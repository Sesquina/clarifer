import Anthropic from "@anthropic-ai/sdk";

export interface AnalysisResult {
  headline: string;
  findings: Array<{ label: string; value: string; status: "normal" | "flagged" | "info" }>;
  fullSummary: string;
  symptomConnection?: string;
}

export interface DocumentAnalyzer {
  analyze(fileData: string, mediaType: string, patientContext?: string): Promise<AnalysisResult>;
}

class AnthropicDocumentAnalyzer implements DocumentAnalyzer {
  async analyze(fileData: string, mediaType: string, patientContext?: string): Promise<AnalysisResult> {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const systemPrompt = `You are helping a family caregiver understand a medical document. Analyze it and return structured JSON in plain, warm language. No jargon without a parenthetical explanation. Start with the most important takeaway. Never use em dashes or en dashes. Use plain sentences. Use colons where a pause is needed.

${patientContext ? `Patient context: ${patientContext}` : ""}

Return ONLY valid JSON:
{
  "headline": "One-line plain-language takeaway",
  "findings": [
    {"label": "Finding name", "value": "Plain-language explanation", "status": "normal"},
    {"label": "Concerning item", "value": "Plain-language explanation", "status": "flagged"}
  ],
  "fullSummary": "3-4 sentence plain-language summary for a caregiver"
}

Use "flagged" for abnormal values, "normal" for normal values, "info" for neutral context.
Be concise. 3-4 sentences for the summary maximum. Key findings only.`;

    // Build message content based on MIME type:
    // image/* → image block, text/* → decoded UTF-8 string, all else → PDF document block.
    const messageContent: Anthropic.MessageParam["content"] = mediaType.startsWith("image/")
      ? [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: mediaType as Anthropic.Base64ImageSource["media_type"],
              data: fileData,
            },
          },
          { type: "text" as const, text: "Please analyze this medical document." },
        ]
      : mediaType.startsWith("text/")
      ? Buffer.from(fileData, "base64").toString("utf8") + "\n\nPlease analyze this medical document."
      : [
          {
            type: "document" as const,
            source: {
              type: "base64" as const,
              media_type: "application/pdf" as const,
              data: fileData,
            },
          },
          { type: "text" as const, text: "Please analyze this medical document." },
        ];

    const completion = await Promise.race([
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: messageContent }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 25000)
      ),
    ]);

    const responseText = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const stripDashes = (text: string): string =>
      text
        .replace(/—/g, ",")
        .replace(/–/g, " to ")
        .replace(/ -- /g, ", ")
        .replace(/ - /g, ", ");

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      const findings = (parsed.findings || []).map((f: { label: string; value: string; status: string }) => ({
        ...f,
        value: stripDashes(f.value),
      }));
      return {
        headline: stripDashes(parsed.headline || "Document analyzed"),
        findings,
        fullSummary: stripDashes(parsed.fullSummary || responseText),
        symptomConnection: parsed.symptomConnection ? stripDashes(parsed.symptomConnection) : undefined,
      };
    } catch {
      return {
        headline: "Document analyzed",
        findings: [],
        fullSummary: stripDashes(responseText),
      };
    }
  }
}

export function getDocumentAnalyzer(): DocumentAnalyzer {
  return new AnthropicDocumentAnalyzer();
}
