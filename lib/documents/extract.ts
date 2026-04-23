import { PDFParse } from "pdf-parse";

export async function extractText(
  input: File | Buffer,
  mimeType: string
): Promise<string> {
  const buffer =
    input instanceof Buffer ? input : Buffer.from(await (input as File).arrayBuffer());

  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text.trim();
  }

  if (mimeType.startsWith("image/")) {
    return "[Image document — OCR text extraction available in Sprint 8]";
  }

  return buffer.toString("utf8").trim();
}
