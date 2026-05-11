import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { createRequire } from "module";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const _require = createRequire(import.meta.url);
const workerPath = _require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, "/")}`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const CONTENT_DIR = path.join(__dirname, "content");

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

const openaiTextClient = process.env.GITHUB_TOKEN
  ? new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: process.env.GITHUB_TOKEN,
    })
  : null;

const openaiTtsClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    : null;

function toOpenAIMessages(
  contents: any[],
  systemInstruction?: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  for (const content of contents) {
    const role = content.role === "model" ? "assistant" : (content.role as "user" | "assistant");
    const parts: any[] = content.parts ?? [];
    if (parts.length === 1 && parts[0].text !== undefined) {
      messages.push({ role, content: parts[0].text });
      continue;
    }
    const contentParts: OpenAI.Chat.ChatCompletionContentPart[] = [];
    for (const part of parts) {
      if (part.text !== undefined) contentParts.push({ type: "text", text: part.text });
      else if (part.inlineData?.mimeType?.startsWith("image/")) {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` },
        });
      }
    }
    if (contentParts.length > 0 && role === "user") {
      messages.push({ role: "user", content: contentParts });
    } else if (contentParts.length > 0) {
      messages.push({
        role: "assistant",
        content: contentParts.filter(p => p.type === "text").map(p => (p as any).text).join("\n"),
      });
    }
  }
  return messages;
}

function toOpenAIParams(
  generationConfig: any
): Partial<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming> {
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

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.sendStatus(200); return; }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.post("/api/ai/generate", async (req, res) => {
  const { contents, systemInstruction, generationConfig } = req.body;
  if (!openaiTextClient) {
    return res.status(500).json({ error: "GITHUB_TOKEN is not configured." });
  }
  try {
    const messages = toOpenAIMessages(contents, systemInstruction);
    const completion = await openaiTextClient.chat.completions.create({
      model: MODEL,
      messages,
      ...toOpenAIParams(generationConfig),
    });
    res.json({ text: completion.choices[0]?.message?.content ?? "" });
  } catch (error: any) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

function truncateAtSentence(text: string, maxChars = 600): string {
  if (text.length <= maxChars) return text;
  const chunk = text.slice(0, maxChars);
  const last = Math.max(chunk.lastIndexOf('.'), chunk.lastIndexOf('!'), chunk.lastIndexOf('?'));
  return last > maxChars * 0.4 ? chunk.slice(0, last + 1) : chunk;
}

app.post("/api/tts", async (req, res) => {
  const { text, voice } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text." });
  if (!openaiTtsClient) {
    return res.status(501).json({ error: "OPENAI_API_KEY not configured." });
  }
  const validVoices = ["alloy", "ash", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"];
  const safeVoice = validVoices.includes(voice) ? voice : "nova";
  const input = truncateAtSentence(text);

  try {
    const mp3 = await openaiTtsClient.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: safeVoice as any,
      input,
      response_format: "mp3",
      instructions: "You are speaking Serbian (srpski jezik). Pronounce every word exactly as a native Serbian speaker would. Use proper Serbian phonetics throughout — never use English pronunciation for any word.",
    } as any);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return res.json({ audio: buffer.toString("base64") });
  } catch (err1: any) {
    console.warn("gpt-4o-mini-tts failed, falling back to tts-1:", err1.message);
  }

  try {
    const mp3 = await openaiTtsClient.audio.speech.create({
      model: "tts-1",
      voice: safeVoice as any,
      input,
      response_format: "mp3",
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return res.json({ audio: buffer.toString("base64") });
  } catch (error: any) {
    console.error("TTS Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/extract-pdf", async (req, res) => {
  const { base64Data } = req.body;
  if (!base64Data) return res.status(400).json({ error: "Missing base64Data." });
  try {
    const text = await extractPdfText(Buffer.from(base64Data, "base64"));
    res.json({ text });
  } catch (error: any) {
    console.error("PDF extract error:", error.message);
    res.status(500).json({ error: "Nije moguće pročitati PDF. Probaj drugi fajl." });
  }
});

app.get("/api/content-pdfs", (_req, res) => {
  try {
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.toLowerCase().endsWith(".pdf"));
    const items = files.map(f => ({
      filename: f,
      name: f.replace(/\.pdf$/i, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    }));
    res.json(items);
  } catch {
    res.json([]);
  }
});

app.get("/api/content-pdfs/:filename", async (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const fullPath = path.join(CONTENT_DIR, safeFilename);
  if (!safeFilename.toLowerCase().endsWith(".pdf") || !fullPath.startsWith(CONTENT_DIR)) {
    return res.status(400).json({ error: "Nevažeći fajl." });
  }
  try {
    const buffer = fs.readFileSync(fullPath);
    const text = await extractPdfText(buffer);
    res.json({ text });
  } catch (error: any) {
    console.error("Content PDF error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/leaderboard", async (_req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from("leaderboard")
    .select("username, score")
    .order("score", { ascending: false })
    .limit(20);
  if (error) return res.json([]);
  res.json(data || []);
});

app.post("/api/leaderboard/upsert", async (req, res) => {
  const { username, score } = req.body;
  if (!username || score === undefined) {
    return res.status(400).json({ error: "Missing username or score." });
  }
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const { error } = await supabase
    .from("leaderboard")
    .upsert({ username, score, updated_at: new Date().toISOString() }, { onConflict: "username" });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get("/api/documents", async (_req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase nije konfigurisan." });
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/documents/upload", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase nije konfigurisan." });
  const { name, subject, base64Data, mimeType } = req.body;
  if (!name || !base64Data || !mimeType) {
    return res.status(400).json({ error: "Nedostaju podaci." });
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
    res.status(500).json({ error: error.message });
  }
});

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
    const extractedText = await extractPdfText(Buffer.from(await fileData.arrayBuffer()));
    await supabase.from("documents").update({ extracted_text: extractedText }).eq("id", doc.id);
    res.json({ text: extractedText });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../frontend/dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}

const PORT = parseInt(process.env.PORT || "3001");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://localhost:${PORT} — model: ${MODEL}`);
});
