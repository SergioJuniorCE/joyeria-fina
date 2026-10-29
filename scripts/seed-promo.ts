import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const capsuleDir = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);

const target = args.find((arg) => arg.startsWith("--target="))?.split("=")[1];
const portArg = args.find((arg) => arg.startsWith("--port="))?.split("=")[1] ?? "3000";
const code = (args.find((arg) => arg.startsWith("--code="))?.split("=")[1] ?? "PROMO10").toUpperCase();
const percent = Number(args.find((arg) => arg.startsWith("--percent="))?.split("=")[1] ?? "10");
const minSubtotal = Number(args.find((arg) => arg.startsWith("--min="))?.split("=")[1] ?? "0");
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

async function main() {
  const seedToken = readEnv().SEED_TOKEN;
  if (!seedToken) throw new Error("SEED_TOKEN is missing from .env.lakebed.server");
  if (!code) throw new Error("The coupon code is empty.");
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    throw new Error("--percent must be between 1 and 100.");
  }

  const response = await fetch(`${baseUrl}/api/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${seedToken}`,
      Origin: baseUrl
    },
    body: JSON.stringify({
      promotions: [
        {
          code,
          kind: "percent",
          value: Math.round(percent),
          minSubtotal: Math.max(0, Math.round(minSubtotal)),
          active: true
        }
      ]
    })
  });

  const result = (await response.json()) as { ok?: boolean; promotions?: number; error?: string };
  if (!response.ok || !result.ok) {
    throw new Error(`Coupon seed failed: ${response.status} ${JSON.stringify(result)}`);
  }

  console.log(`Coupon ${code} created: ${Math.round(percent)}% off${minSubtotal > 0 ? ` from ${minSubtotal} MXN` : ""}.`);
  console.log(`Store: ${baseUrl}/`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
