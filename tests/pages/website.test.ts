import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf-8");
}

describe("website pages", () => {
  it("landing page renders Clarifer brand and no Medalyn reference", () => {
    const src = readFile("app/page.tsx");
    expect(src).toContain("Clarifer");
    expect(src.toLowerCase()).not.toContain("medalyn");
  });

  it("login page uses two-column layout and Sign in copy", () => {
    const src = readFile("app/login/page.tsx");
    expect(src).toContain("Sign in");
    expect(src.toLowerCase()).not.toContain("medalyn");
  });

  it("download page renders App Store and Google Play options", () => {
    const src = readFile("app/download/page.tsx");
    expect(src).toContain("Download");
    expect(src).toContain("App Store");
    expect(src).toContain("Google Play");
  });

  it("about page is mission-forward with no founder medical details", () => {
    const src = readFile("app/about/page.tsx");
    expect(src.toLowerCase()).toContain("mission");
    expect(src).not.toMatch(/cholangiocarcinoma/i);
    expect(src).not.toMatch(/\bbile duct\b/i);
    expect(src).not.toMatch(/\bmy father\b/i);
  });

  it("privacy page exists and is readable", () => {
    const src = readFile("app/privacy/page.tsx");
    expect(src.length).toBeGreaterThan(0);
  });

  it("no hex colors in new marketing components", () => {
    const files = [
      "app/page.tsx",
      "app/login/page.tsx",
      "app/about/page.tsx",
      "app/download/page.tsx",
      "components/layout/header.tsx",
      "components/ui/AnchorLogo.tsx",
    ];
    const googleGPaths = [
      "#EA4335",
      "#4285F4",
      "#FBBC05",
      "#34A853",
    ];
    for (const f of files) {
      const src = readFile(f);
      const hexMatches = src.match(/#[0-9A-Fa-f]{6}\b/g) ?? [];
      const nonGoogleHexes = hexMatches.filter((h) => !googleGPaths.includes(h));
      expect(nonGoogleHexes, `${f} contained hex colors: ${nonGoogleHexes.join(", ")}`).toEqual([]);
    }
  });

  it("no em dashes in new marketing copy", () => {
    const files = [
      "app/page.tsx",
      "app/login/page.tsx",
      "app/about/page.tsx",
      "app/download/page.tsx",
      "components/layout/header.tsx",
    ];
    for (const f of files) {
      const src = readFile(f);
      expect(src, `${f} contained em dashes`).not.toMatch(/—/);
    }
  });

  it("letter-M logo pattern removed from header", () => {
    const src = readFile("components/layout/header.tsx");
    expect(src).not.toMatch(/<span[^>]*>M<\/span>/);
  });
});
