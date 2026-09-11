import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Security & Secret Exposure Invariants", () => {
  it("ensures no NEXT_PUBLIC_ variables expose secrets", () => {
    const envExamplePath = path.resolve(process.cwd(), ".env.example");
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, "utf-8");
      expect(content).not.toMatch(/NEXT_PUBLIC_.*(KEY|SECRET|TOKEN)/i);
    }
  });

  it("ensures client components do not import propr-api directly", () => {
    const componentsDir = path.resolve(process.cwd(), "apps/terminal/src/components");
    if (fs.existsSync(componentsDir)) {
      const files = fs.readdirSync(componentsDir);
      for (const file of files) {
        if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          const content = fs.readFileSync(path.join(componentsDir, file), "utf-8");
          if (content.includes('"use client"')) {
            expect(content).not.toMatch(/import\s+.*from\s+["'].*propr-api["']/);
            expect(content).not.toMatch(/process\.env\.PROPR_API_KEY/);
          }
        }
      }
    }
  });
});
