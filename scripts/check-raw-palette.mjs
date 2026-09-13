#!/usr/bin/env node

/**
 * CI Guardrail: Check for raw Tailwind palette colors
 *
 * Scans `apps/terminal/src` (excluding `components/ui/` and `globals.css`)
 * and fails if raw Tailwind palette classes (e.g. text-emerald-400, bg-zinc-900)
 * exceed the downward threshold budget (current ceiling: 730).
 *
 * This mechanically prevents regression and ensures future work adopts design tokens:
 * - text-[var(--green)], text-[var(--red)], text-[var(--amber)], text-[var(--cyan)]
 * - bg-[var(--bg-surface)], bg-[var(--bg-elevated)], border-[var(--border-subtle)]
 * - text-[var(--text-secondary)], text-[var(--text-muted)]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const TARGET_DIR = path.join(ROOT_DIR, "apps/terminal/src");

const RAW_PALETTE_REGEX = /\b(bg|text|border)-(red|emerald|green|zinc|amber|cyan)-[0-9]+(?:\/[0-9]+)?\b/g;
const MAX_ALLOWED_CLASSES = 730;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const rel = path.relative(TARGET_DIR, full);

    // Exclude components/ui/ and globals.css
    if (rel.startsWith("components/ui") || rel === "app/globals.css") {
      continue;
    }

    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(TARGET_DIR);
let totalMatches = 0;
const fileMatches = [];

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  const matches = content.match(RAW_PALETTE_REGEX);
  if (matches && matches.length > 0) {
    totalMatches += matches.length;
    fileMatches.push({
      file: path.relative(ROOT_DIR, f),
      count: matches.length,
      sample: matches.slice(0, 3).join(", "),
    });
  }
}

fileMatches.sort((a, b) => b.count - a.count);

console.log("\n=======================================================");
console.log("🎨 Design Token Guardrail (Raw Palette Scanner)");
console.log("=======================================================");
console.log(`Scanned files: ${files.length}`);
console.log(`Total raw palette classes: ${totalMatches}`);
console.log(`Allowed ceiling budget:   ${MAX_ALLOWED_CLASSES}`);
console.log("-------------------------------------------------------");

if (fileMatches.length > 0) {
  console.log("Top file offenders:");
  for (const item of fileMatches.slice(0, 10)) {
    console.log(`  ${String(item.count).padStart(4)} × ${item.file} (${item.sample})`);
  }
}

if (totalMatches > MAX_ALLOWED_CLASSES) {
  console.error(
    `\n❌ GUARDRAIL FAILED: Found ${totalMatches} raw palette classes (exceeds ceiling of ${MAX_ALLOWED_CLASSES}).`
  );
  console.error("Please replace raw palette classes with design token CSS variables from globals.css:");
  console.error("  - text-[var(--green)], text-[var(--red)], text-[var(--amber)], text-[var(--cyan)]");
  console.error("  - bg-[var(--bg-surface)], bg-[var(--bg-elevated)], border-[var(--border-subtle)]");
  console.error("  - text-[var(--text-secondary)], text-[var(--text-muted)]\n");
  process.exit(1);
} else {
  console.log(`\n✅ GUARDRAIL PASSED: Raw palette count (${totalMatches}) is within budget (<= ${MAX_ALLOWED_CLASSES}).\n`);
  process.exit(0);
}
