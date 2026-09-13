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

  it("ensures client components do not import propr-api directly (recursively)", () => {
    const componentsDir = path.resolve(process.cwd(), "apps/terminal/src/components");

    function getAllFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllFiles(fullPath));
        } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          results.push(fullPath);
        }
      }
      return results;
    }

    if (fs.existsSync(componentsDir)) {
      const allFiles = getAllFiles(componentsDir);
      expect(allFiles.length).toBeGreaterThan(5);

      for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, "utf-8");
        if (content.includes('"use client"')) {
          expect(content).not.toMatch(/import\s+.*from\s+["'].*propr-api["']/);
          expect(content).not.toMatch(/process\.env\.PROPR_API_KEY/);
        }
      }
    }
  });
});
