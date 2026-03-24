import type { MoodSentiment } from "./moodTypes";
import { isMoodSentiment } from "./moodTypes";

export type MoodPrediction = {
  mood: MoodSentiment;
  confidence: number; // 0..1
  rationale: string;
};

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function extractJson(text: string): unknown | null {
  // Gemini sometimes returns fenced code blocks.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fenceMatch?.[1] ?? text;

  try {
    return JSON.parse(raw);
  } catch {
    const firstObj = text.match(/\{[\s\S]*\}/);
    if (!firstObj) return null;
    try {
      return JSON.parse(firstObj[0]);
    } catch {
      return null;
    }
  }
}

export async function predictMoodFromText(
  inputText: string,
  opts?: { model?: string }
): Promise<MoodPrediction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const text = inputText.trim();
  if (!text) {
    throw new Error("Input text is required");
  }

  const rawModel = opts?.model ?? process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  // Gemini expects a model id like `gemini-1.5-flash` for:
  //   /v1beta/models/{model}:generateContent
  // If user includes `models/` we strip it to avoid `models/models/...` errors.
  const model = rawModel.replace(/^models\//i, "").replace(/^model\//i, "").trim();

  const prompt = `
You are a mood classifier for an emotional wellbeing app.
Allowed moods:
happy, low, neutral, stressed, anxious, excited, angry, sad

Analyze the user's text below and choose exactly one allowed mood.

Return ONLY valid JSON with this exact shape:
{
  "mood": "<one of the allowed moods>",
  "confidence": <number between 0 and 1>,
  "rationale": "<1 sentence explanation>"
}

User text:
${text}
`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  const candidateText =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("\n") ??
    "";

  const parsed = extractJson(candidateText);
  if (!parsed || typeof parsed !== "object") {
    // Fallback if parsing fails
    return {
      mood: "neutral",
      confidence: 0.2,
      rationale: "Could not parse model output; defaulting to neutral.",
    };
  }

  const moodRaw = (parsed as any).mood;
  const confidenceRaw = (parsed as any).confidence;
  const rationaleRaw = (parsed as any).rationale;

  const mood = typeof moodRaw === "string" && isMoodSentiment(moodRaw) ? moodRaw : "neutral";
  const confidence =
    typeof confidenceRaw === "number" ? clamp01(confidenceRaw) : clamp01(Number(confidenceRaw));
  const rationale = typeof rationaleRaw === "string" ? rationaleRaw : "";

  return { mood, confidence, rationale };
}

