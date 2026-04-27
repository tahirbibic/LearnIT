import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { createRequire } from "module";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const _require = createRequire(import.meta.url);
const workerPath = _require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, "/")}`;

dotenv.config({ path: ".env.local" });
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

const openaiClient = process.env.GITHUB_TOKEN
  ? new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: process.env.GITHUB_TOKEN,
    })
  : null;

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    : null;

// Translate Gemini-format contents into OpenAI messages
function toOpenAIMessages(
  contents: any[],
  systemInstruction?: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  for (const content of contents) {
    const role = content.role === "model" ? "assistant" : (content.role as "user" | "assistant");
    const parts: any[] = content.parts ?? [];

    if (parts.length === 1 && parts[0].text !== undefined) {
      messages.push({ role, content: parts[0].text });
      continue;
    }

    const contentParts: OpenAI.Chat.ChatCompletionContentPart[] = [];
    for (const part of parts) {
      if (part.text !== undefined) {
        contentParts.push({ type: "text", text: part.text });
      } else if (part.inlineData?.mimeType?.startsWith("image/")) {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` },
        });
      }
    }

    if (contentParts.length > 0 && role === "user") {
      messages.push({ role: "user", content: contentParts });
    } else if (contentParts.length > 0) {
      const text = contentParts.filter(p => p.type === "text").map(p => (p as any).text).join("\n");
      messages.push({ role: "assistant", content: text });
    }
  }

  return messages;
}

function toOpenAIParams(generationConfig: any): Partial<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming> {
  if (!generationConfig) return {};
  const p: any = {};
  if (generationConfig.temperature !== undefined) p.temperature = generationConfig.temperature;
  if (generationConfig.maxOutputTokens !== undefined) p.max_tokens = generationConfig.maxOutputTokens;
  if (generationConfig.topP !== undefined) p.top_p = generationConfig.topP;
  if (generationConfig.responseMimeType === "application/json") p.response_format = { type: "json_object" };
  return p;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const doc = await (pdfjsLib as any).getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str ?? "").join(" "));
  }
  return pages.join("\n").trim();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Main AI proxy — GPT via GitHub Models
  app.post("/api/ai/generate", async (req, res) => {
    const { contents, systemInstruction, generationConfig } = req.body;

    if (generationConfig?.responseModalities?.includes("AUDIO")) {
      return res.status(501).json({ error: "Audio not supported — browser TTS fallback active." });
    }

    if (!openaiClient) {
      return res.status(500).json({ error: "GITHUB_TOKEN is not configured on the server." });
    }

    try {
      const messages = toOpenAIMessages(contents, systemInstruction);
      const completion = await openaiClient.chat.completions.create({
        model: MODEL,
        messages,
        ...toOpenAIParams(generationConfig),
      });
      const text = completion.choices[0]?.message?.content ?? "";
      res.json({ text });
    } catch (error: any) {
      console.error("AI Proxy Error:", error.message);
      res.status(500).json({ error: error.message || "Internal AI Error" });
    }
  });

  // Extract text from a PDF (no AI — pure parser)
  app.post("/api/extract-pdf", async (req, res) => {
    const { base64Data } = req.body;
    if (!base64Data) return res.status(400).json({ error: "Missing base64Data." });
    try {
      const buffer = Buffer.from(base64Data, "base64");
      const text = await extractPdfText(buffer);
      res.json({ text });
    } catch (error: any) {
      console.error("PDF extract error:", error.message);
      res.status(500).json({ error: "Nije moguće pročitati PDF. Probaj drugi fajl." });
    }
  });

  // List documents
  app.get("/api/documents", async (_req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase nije konfigurisan." });
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Upload document to Biblioteka (pdf-parse for text extraction)
  app.post("/api/documents/upload", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase nije konfigurisan." });

    const { name, subject, base64Data, mimeType } = req.body;
    if (!name || !base64Data || !mimeType) {
      return res.status(400).json({ error: "Nedostaju podaci (name, base64Data, mimeType)." });
    }

    try {
      const fileBuffer = Buffer.from(base64Data, "base64");
      const extractedText = await extractPdfText(fileBuffer);
      const storagePath = `${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, fileBuffer, { contentType: mimeType });
      if (uploadError) return res.status(500).json({ error: uploadError.message });

      const { data, error: insertError } = await supabase
        .from("documents")
        .insert({ name, subject: subject || "Opšte", storage_path: storagePath, extracted_text: extractedText, file_size: fileBuffer.length })
        .select()
        .single();
      if (insertError) return res.status(500).json({ error: insertError.message });

      res.json(data);
    } catch (error: any) {
      console.error("Upload Error:", error.message);
      res.status(500).json({ error: error.message || "Greška pri otpremanju." });
    }
  });

  // Load document text on demand (pdf-parse, cached after first load)
  app.post("/api/documents/:id/load", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase nije konfigurisan." });

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !doc) return res.status(404).json({ error: "Dokument nije pronađen." });

    if (doc.extracted_text) return res.json({ text: doc.extracted_text });

    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(doc.storage_path);
      if (downloadError) return res.status(500).json({ error: downloadError.message });

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const extractedText = await extractPdfText(buffer);

      await supabase.from("documents").update({ extracted_text: extractedText }).eq("id", doc.id);
      res.json({ text: extractedText });
    } catch (error: any) {
      console.error("Load error:", error.message);
      res.status(500).json({ error: error.message || "Greška pri ekstrakciji teksta." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} — model: ${MODEL}`);
  });
}

startServer();
