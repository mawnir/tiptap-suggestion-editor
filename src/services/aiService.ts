import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "XXXXXXXX" });

export async function improveWriting(text: string): Promise<string> {
  if (!text.trim()) return text;

  try {
    const response = await ai.models.generateContent({
      model: "gemma-4-26b-a4b-it",
      contents: `Improve the following text for clarity, grammar, and style. Keep the original meaning and tone, but make it more professional and polished. Return ONLY the improved text, no explanations or conversational filler.

Text to improve:
"${text}"`,
    });

    return response.text || text;
  } catch (error) {
    console.error("AI Improvement Error:", error);
    return text;
  }
}
