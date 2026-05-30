/**
 * lib/family-update/strip-markdown.ts
 * Strips markdown formatting from AI-generated family update text before display.
 * Tables: None
 * Auth: Public (pure utility, no network calls)
 * HIPAA: No PHI in this file.
 */

export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")        // headings: # ## ### etc.
    .replace(/\*\*(.+?)\*\*/g, "$1")     // bold: **text**
    .replace(/\*(.+?)\*/g, "$1")         // italic: *text*
    .replace(/_{1,2}(.+?)_{1,2}/g, "$1") // underline: _text_ or __text__
    .replace(/^[-*]\s+/gm, "")           // list dashes/bullets: - item or * item
    .replace(/^\d+\.\s+/gm, "")          // numbered lists: 1. item
    .replace(/`{1,3}[^`]*`{1,3}/g, "")   // code: `code` or ```code```
    .replace(/^>\s+/gm, "")              // blockquotes: > text
    .replace(/^-{3,}$/gm, "")            // horizontal rules: ---
    .replace(/\n{3,}/g, "\n\n");         // collapse excess blank lines
}
