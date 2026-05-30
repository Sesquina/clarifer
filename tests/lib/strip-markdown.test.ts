/**
 * tests/lib/strip-markdown.test.ts
 * Unit tests for the stripMarkdown utility used by the family-update page
 * to remove any markdown that leaks past the system prompt instruction.
 * Sprint: fix/p0-demo-blockers
 * HIPAA: No PHI in this file.
 */
import { describe, it, expect } from "vitest";
import { stripMarkdown } from "@/lib/family-update/strip-markdown";

describe("stripMarkdown", () => {
  it("removes # headings — '# Update for Carlos' → 'Update for Carlos'", () => {
    expect(stripMarkdown("# Update for Carlos\nHe is doing well.")).toBe(
      "Update for Carlos\nHe is doing well."
    );
  });

  it("removes ## and ### headings", () => {
    expect(stripMarkdown("## This week\nSome text.")).toBe("This week\nSome text.");
    expect(stripMarkdown("### Section\nMore text.")).toBe("Section\nMore text.");
  });

  it("removes **bold** markers and keeps the inner text", () => {
    expect(stripMarkdown("He is **doing well** today.")).toBe("He is doing well today.");
  });

  it("removes *italic* markers and keeps the inner text", () => {
    expect(stripMarkdown("She felt *much better* yesterday.")).toBe(
      "She felt much better yesterday."
    );
  });

  it("removes _underline_ and __double underline__", () => {
    expect(stripMarkdown("He is _stable_.")).toBe("He is stable.");
    expect(stripMarkdown("She is __recovering__.")).toBe("She is recovering.");
  });

  it("removes - list item prefixes", () => {
    expect(stripMarkdown("- Appointment on Tuesday\n- Feeling better")).toBe(
      "Appointment on Tuesday\nFeeling better"
    );
  });

  it("removes numbered list prefixes", () => {
    expect(stripMarkdown("1. Take medication\n2. Rest")).toBe(
      "Take medication\nRest"
    );
  });

  it("removes backtick code spans", () => {
    expect(stripMarkdown("Use the `Clarifer` app.")).toBe("Use the  app.");
  });

  it("removes blockquote > prefix", () => {
    expect(stripMarkdown("> Carlos is improving.")).toBe("Carlos is improving.");
  });

  it("removes --- horizontal rules", () => {
    expect(stripMarkdown("Para one.\n---\nPara two.")).toBe(
      "Para one.\n\nPara two."
    );
  });

  it("collapses 3+ blank lines into 2", () => {
    expect(stripMarkdown("First.\n\n\n\nSecond.")).toBe("First.\n\nSecond.");
  });

  it("leaves plain text untouched", () => {
    const plain =
      "Carlos had an appointment on Tuesday. The doctor said he is stable. Next appointment is Friday.";
    expect(stripMarkdown(plain)).toBe(plain);
  });

  it("full markdown-heavy input is fully cleaned", () => {
    const input = [
      "# Update for Carlos",
      "",
      "This week was **steady**. Carlos had his *chemo* session on Tuesday.",
      "",
      "- Doctor visit: good news",
      "- Medications adjusted",
      "",
      "1. Rest more",
      "2. Drink fluids",
      "",
      "> The doctor says he is on track.",
      "",
      "---",
      "",
      "Next appointment is Friday.",
    ].join("\n");

    const result = stripMarkdown(input);

    expect(result).not.toContain("#");
    expect(result).not.toContain("**");
    expect(result).not.toContain("*chemo*");
    expect(result).not.toContain("- Doctor");
    expect(result).not.toContain("1. Rest");
    expect(result).not.toContain(">");
    expect(result).not.toContain("---");
    expect(result).toContain("steady");
    expect(result).toContain("chemo");
    expect(result).toContain("Next appointment is Friday.");
  });
});
