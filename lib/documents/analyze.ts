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

    const systemPrompt = `You are helping a family caregiver understand a medical document. Analyze it and return structured JSON in plain, warm language — no jargon without a parenthetical explanation. Start with the most important takeaway.

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
Be concise — 3-4 sentences for the summary maximum. Key findings only.`;

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

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: messageContent }],
    });

    const responseText = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      return {
        headline: parsed.headline || "Document analyzed",
        findings: parsed.findings || [],
        fullSummary: parsed.fullSummary || responseText,
        symptomConnection: parsed.symptomConnection,
      };
    } catch {
      return {
        headline: "Document analyzed",
        findings: [],
        fullSummary: responseText,
      };
    }
  }
}

export function getDocumentAnalyzer(): DocumentAnalyzer {
  return new AnthropicDocumentAnalyzer();
}
