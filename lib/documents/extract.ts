import {
  extractText as unpdfExtractText,
  getDocumentProxy,
} from "unpdf";

export async function extractText(
  input: File | Buffer,
  mimeType: string
): Promise<string> {
  const buffer =
    input instanceof Buffer
      ? input
      : Buffer.from(await (input as File).arrayBuffer());

  if (mimeType === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await unpdfExtractText(pdf, { mergePages: true });
    return text.trim();
  }

  if (mimeType.startsWith("image/")) {
    return "[Image document — text extraction not yet available]";
  }

  return buffer.toString("utf8").trim();
}
