import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, basename } from "path";
import dotenv from "dotenv";

dotenv.config({ path: join(process.cwd(), ".env.local") });
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const CONTENT_DIR = join(process.cwd(), "..", "backend", "content");

const SUBJECT_MAP: Record<string, string> = {
  prvi_svetski_rat: "Istorija",
  drugi_svetski_rat: "Istorija",
  hladni_rat: "Istorija",
  istorija_rimljani: "Istorija",
  istorija_nemanjici: "Istorija",
  istorija_obrenovici: "Istorija",
};

async function seedDocument(filePath: string) {
  const filename = basename(filePath, ".pdf");
  const displayName = filename.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const subject = SUBJECT_MAP[filename] || "Opšte";

  console.log(`Processing: ${displayName}`);

  // Check if already seeded
  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("name", displayName)
    .maybeSingle();

  if (existing) {
    console.log(`  Skipped (already exists).`);
    return;
  }

  const fileBuffer = readFileSync(filePath);
  const storagePath = `${Date.now()}_${filename}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBuffer, { contentType: "application/pdf" });

  if (uploadError) {
    console.error(`  Storage error: ${uploadError.message}`);
    return;
  }

  const { error: insertError } = await supabase.from("documents").insert({
    name: displayName,
    subject,
    storage_path: storagePath,
    extracted_text: null,
    file_size: fileBuffer.length,
  });

  if (insertError) {
    console.error(`  DB error: ${insertError.message}`);
  } else {
    console.log(`  Done. Text will be extracted on first load.`);
  }
}

async function main() {
  console.log("Starting seed (no Gemini — text extracted on first click)...\n");
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith(".pdf"));
  console.log(`Found ${files.length} PDFs in backend/content/\n`);

  for (const file of files) {
    await seedDocument(join(CONTENT_DIR, file));
  }

  console.log("\nSeed complete. Run `npm run dev` and open Biblioteka.");
}

main().catch(console.error);
