/** Sinkronisasi environment variables dari .env.local ke .env.worker untuk Render. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENV_FILES = [".env", ".env.local"];

function readEnvFile(filename: string): Record<string, string> {
  const content = readFileSync(filename, "utf-8");
  const result: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

function main() {
  let envVars: Record<string, string> = {};

  for (const file of ENV_FILES) {
    const path = join(process.cwd(), file);
    try {
      envVars = { ...envVars, ...readEnvFile(path) };
    } catch {
      // file tidak ada, lanjut ke berikutnya
    }
  }

  const totalOriginal = Object.keys(envVars).length;

  const filtered: Record<string, string> = {};

  for (const [key, value] of Object.entries(envVars)) {
    if (key.startsWith("NEXT_PUBLIC_")) continue;
    if (key.startsWith("VERCEL_")) continue;
    if (key.startsWith("SENTRY_")) continue;
    if (!value.trim()) continue;

    filtered[key] = value;
  }

  const filteredCount = totalOriginal - Object.keys(filtered).length;
  const workerEnv = Object.entries(filtered)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  writeFileSync(".env.worker", workerEnv);

  console.log(`Environment variables synced for worker:`);
  console.log(`  Original: ${totalOriginal}`);
  console.log(`  Filtered: ${filteredCount}`);
  console.log(`  Written:  ${Object.keys(filtered).length}`);
}

main();
