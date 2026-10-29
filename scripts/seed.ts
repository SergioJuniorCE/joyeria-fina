import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { SEED_DESCRIPTIONS, SEED_MEDIA, SEED_PRODUCTS } from "../shared/catalog";
import { DEFAULT_SETTINGS } from "../shared/config";

const run = promisify(execFile);
const capsuleDir = resolve(import.meta.dir, "..");
const assetsDir = resolve(capsuleDir, "seed-assets");

const args = process.argv.slice(2);
const target = args.find((arg) => arg.startsWith("--target="))?.split("=")[1];
const force = args.includes("--force");
const imageBase = args.find((arg) => arg.startsWith("--image-base="))?.split("=")[1]?.replace(/\/$/, "");
const portArg = args.find((arg) => arg.startsWith("--port="))?.split("=")[1] ?? "3000";
const baseUrl = (target ?? `http://127.0.0.1:${portArg}`).replace(/\/$/, "");

function readEnv(): Record<string, string> {
  try {
    const text = readFileSync(join(capsuleDir, ".env.lakebed.server"), "utf8");
    const env: Record<string, string> = {};
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
    }
    return env;
  } catch {
    return {};
  }
}

async function upload(file: string): Promise<{ key: string; url: string }> {
  const commandArgs = ["--yes", "lakebed", "storage", "put", join(assetsDir, file), "--public", "--json"];
  if (target) commandArgs.push(target);
  else commandArgs.push("--port", portArg);

  const { stdout } = await run(process.platform === "win32" ? "npx.cmd" : "npx", commandArgs, {
    cwd: capsuleDir,
    maxBuffer: 1024 * 1024 * 8,
    shell: process.platform === "win32"
  });

  const start = stdout.indexOf("{");
  const parsed = JSON.parse(start >= 0 ? stdout.slice(start) : stdout);
  if (!parsed.url) throw new Error(`Upload failed for ${file}: ${stdout}`);
  return { key: parsed.key, url: parsed.url };
}

async function main() {
  const env = readEnv();
  const seedToken = env.SEED_TOKEN;
  if (!seedToken) throw new Error("SEED_TOKEN is missing from .env.lakebed.server");

  const requestHeaders = { Authorization: `Bearer ${seedToken}`, Origin: baseUrl };
  const countResponse = await fetch(`${baseUrl}/api/catalog-count`, { headers: requestHeaders });
  if (!countResponse.ok) throw new Error(`Could not read catalog count: ${countResponse.status}`);
  const { count } = (await countResponse.json()) as { count: number };

  if (count > 0 && !force) {
    console.log(`Catalog already has ${count} products. Use --force to replace it.`);
    return;
  }

  const files = [...new Set([...SEED_PRODUCTS.map((product) => product.imageFile), SEED_MEDIA.heroFile, SEED_MEDIA.storyFile])];
  const urls = new Map<string, string>();

  if (imageBase) {
    for (const file of files) urls.set(file, `${imageBase}/${file}`);
    console.log(`Using public image base: ${imageBase}`);
  } else {
    if (target) {
      throw new Error("Hosted uploads require a signed-in app user, not developer credentials. Publish seed-assets on a public static host and pass --image-base=<url>, or upload images from the admin panel with Google.");
    }
    console.log(`Uploading ${files.length} images to ${baseUrl}...`);
    let completed = 0;
    for (const file of files) {
      const uploaded = await upload(file);
      urls.set(file, uploaded.url);
      completed += 1;
      if (completed % 8 === 0 || completed === files.length) {
        console.log(`  uploaded ${completed}/${files.length}`);
      }
    }
  }

  const products = SEED_PRODUCTS.map((product, index) => ({
    name: product.name,
    price: product.price,
    collection: product.collection,
    imageUrl: urls.get(product.imageFile) ?? "",
    description: SEED_DESCRIPTIONS[product.collection] ?? "",
    available: true,
    featured: product.featured === true,
    position: index + 1
  }));

  const settings = {
    ...DEFAULT_SETTINGS,
    heroImageUrl: urls.get(SEED_MEDIA.heroFile) ?? "",
    storyImageUrl: urls.get(SEED_MEDIA.storyFile) ?? ""
  };

  const response = await fetch(`${baseUrl}/api/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${seedToken}`,
      Origin: baseUrl
    },
    body: JSON.stringify({ products, settings, replace: force })
  });

  const result = (await response.json()) as { ok: boolean; count?: number; error?: string };
  if (!response.ok || !result.ok) {
    throw new Error(`Seed failed: ${response.status} ${JSON.stringify(result)}`);
  }

  console.log(`Seeded ${result.count} products and site settings.`);
  console.log(`Storefront: ${baseUrl}/`);
  console.log(`Admin: ${baseUrl}/admin`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
