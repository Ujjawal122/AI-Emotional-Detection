export const MOODS = [
  "happy",
  "low",
  "neutral",
  "stressed",
  "anxious",
  "excited",
  "angry",
  "sad",
] as const;

export type MoodSentiment = (typeof MOODS)[number];

export function isMoodSentiment(value: string): value is MoodSentiment {
  return (MOODS as readonly string[]).includes(value);
}

