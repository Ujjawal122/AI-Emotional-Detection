import type { MoodSentiment } from "./moodTypes";

type MoodAdvice = {
  breathing: {
    title: string;
    steps: string[];
    durationMinutes?: number;
  };
  quickGrounding?: {
    title: string;
    steps: string[];
  };
  journalPrompt: string;
};

const MOOD_ADVICE: Record<MoodSentiment, MoodAdvice> = {
  angry: {
    breathing: {
      title: "4-7-8 Cooling Breath",
      durationMinutes: 3,
      steps: [
        "Inhale through the nose for 4 seconds",
        "Hold your breath for 7 seconds",
        "Exhale slowly for 8 seconds",
        "Repeat for 4 rounds, focusing on a long exhale",
      ],
    },
    quickGrounding: {
      title: "5-4-3-2-1 Reset",
      steps: [
        "Name 5 things you can see",
        "Name 4 things you can feel",
        "Name 3 things you can hear",
        "Name 2 things you can smell",
        "Name 1 thing you can taste",
      ],
    },
    journalPrompt: "What triggered this anger, and what is one calm action you can take next?",
  },
  anxious: {
    breathing: {
      title: "Box Breathing (4-4-4-4)",
      durationMinutes: 4,
      steps: [
        "Inhale for 4 seconds",
        "Hold for 4 seconds",
        "Exhale for 4 seconds",
        "Hold for 4 seconds",
        "Repeat for 6 rounds",
      ],
    },
    journalPrompt:
      "What is the most likely outcome, and what’s one small step you can take in the next 10 minutes?",
  },
  stressed: {
    breathing: {
      title: "Long Exhale Breath",
      durationMinutes: 3,
      steps: [
        "Inhale for 4 seconds",
        "Exhale slowly for 8 seconds",
        "Repeat for 10 cycles, relaxing your shoulders",
      ],
    },
    journalPrompt: "What part of today feels most heavy, and what boundary or pause could help?",
  },
  low: {
    breathing: {
      title: "Gentle Heart Breath",
      durationMinutes: 3,
      steps: [
        "Place a hand on your chest",
        "Inhale for 4 seconds, feeling warmth",
        "Exhale for 6 seconds, softening your body",
        "Repeat for 8 cycles",
      ],
    },
    journalPrompt: "What’s one kind thing you can do for yourself right now, even if small?",
  },
  sad: {
    breathing: {
      title: "Compassion Breath",
      durationMinutes: 4,
      steps: [
        "Inhale for 4 seconds",
        "Exhale for 6 seconds",
        "On the exhale, silently say: “I can get through this.”",
        "Repeat for 8 cycles",
      ],
    },
    journalPrompt: "What feeling needs the most attention, and what support would help you?",
  },
  happy: {
    breathing: {
      title: "Celebrate & Breathe",
      durationMinutes: 2,
      steps: [
        "Inhale and notice where the happiness lives in your body",
        "Exhale slowly, letting that feeling spread",
        "Repeat for 6 cycles",
      ],
    },
    journalPrompt: "What caused this good feeling, and how can you create one more moment like it?",
  },
  excited: {
    breathing: {
      title: "Energize Breath (Slow Down)",
      durationMinutes: 2,
      steps: [
        "Inhale for 3 seconds",
        "Exhale for 6 seconds",
        "Repeat for 8 cycles to keep excitement steady",
      ],
    },
    journalPrompt: "What are you looking forward to, and what’s one action you can do calmly next?",
  },
  neutral: {
    breathing: {
      title: "Check-In Breath",
      durationMinutes: 2,
      steps: [
        "Inhale for 4 seconds",
        "Exhale for 6 seconds",
        "Scan your body for sensations without judging them",
        "Repeat for 6 cycles",
      ],
    },
    journalPrompt: "What do you need right now—rest, clarity, connection, or action?",
  },
};

export function getMoodAdvice(mood: MoodSentiment): MoodAdvice {
  return MOOD_ADVICE[mood];
}

