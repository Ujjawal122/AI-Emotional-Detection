import type { MoodSentiment } from "./moodTypes";
import { getMoodAdvice } from "./moodAdvice";
import { isMoodSentiment } from "./moodTypes";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MoodCoachResponse = {
  reply: string;
  nextAction?: {
    type: "breathing" | "quickGrounding" | "journal" | "none";
    title?: string;
    steps?: string[];
    journalPrompt?: string;
  };
  followUpQuestion?: string;
};

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export async function coachMoodChat(params: {
  text: string;
  mood?: MoodSentiment;
  confidence?: number;
  history?: ChatMessage[];
}): Promise<MoodCoachResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const text = params.text.trim();
  if (!text) throw new Error("text is required");

  const rawModel =
    process.env.GEMINI_MODEL ??
    // keep consistent with prediction defaults
    "gemini-1.5-flash";
  const model = rawModel
    .replace(/^models\//i, "")
    .replace(/^model\//i, "")
    .trim();

  let mood: MoodSentiment = "neutral";
  if (params.mood && isMoodSentiment(params.mood)) mood = params.mood;

  const advice = getMoodAdvice(mood);
  const confidence = clamp01(params.confidence ?? 0.5);

  const history = params.history ?? [];
  const allowedHistory = history.slice(-12).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const prompt = `
You are a calm emotional wellbeing coach for a user who is experiencing this mood:
Mood: ${mood}
Confidence: ${confidence}

Use this mood plan (do not invent different breathing steps):
Breathing: ${advice.breathing.title}
Breathing steps: ${advice.breathing.steps.join(" | ")}
Quick grounding: ${advice.quickGrounding?.title ?? "none"}
Quick grounding steps: ${advice.quickGrounding?.steps?.join(" | ") ?? "none"}
Journal prompt: ${advice.journalPrompt}

Conversation context (may include prior coaching):
${history.map((m) => `${m.role}: ${m.content}`).join("\n")}

User question:
${text}

Rules:
1) Respond supportively and briefly.
2) Give one clear next action from the plan (breathing, grounding, or journaling).
3) End with exactly one follow-up question.
4) Return ONLY valid JSON:
{
  "reply": string,
  "nextAction": {
    "type": "breathing" | "quickGrounding" | "journal" | "none",
    "title"?: string,
    "steps"?: string[],
    "journalPrompt"?: string
  },
  "followUpQuestion": string
}
`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        ...allowedHistory,
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
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

  // Gemini with responseMimeType json should already be parseable, but keep safe.
  try {
    const obj = JSON.parse(candidateText);
    if (typeof obj?.reply !== "string") throw new Error("bad response shape");
    return obj as MoodCoachResponse;
  } catch {
    return {
      reply: "I’m here with you. Tell me more about what you’re feeling right now.",
      nextAction: {
        type: "breathing",
        title: advice.breathing.title,
        steps: advice.breathing.steps,
      },
      followUpQuestion: "What’s one thing that happened right before you started feeling this mood?",
    };
  }
}

