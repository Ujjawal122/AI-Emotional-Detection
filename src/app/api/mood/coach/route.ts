import { NextRequest, NextResponse } from "next/server";
import { coachMoodChat } from "@/lib/geminiMoodCoach";
import type { MoodSentiment } from "@/lib/moodTypes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const text: string = typeof body?.text === "string" ? body.text : "";
    const mood: MoodSentiment | undefined = typeof body?.mood === "string" ? (body.mood as MoodSentiment) : undefined;
    const confidence: number | undefined =
      typeof body?.confidence === "number" ? body.confidence : undefined;
    const history = Array.isArray(body?.history) ? body.history : undefined;

    if (!text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const response = await coachMoodChat({ text, mood, confidence, history });
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Mood coaching failed" },
      { status: 500 }
    );
  }
}

