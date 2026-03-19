import { NextRequest, NextResponse } from "next/server";
import { predictMoodFromText } from "@/lib/geminiMoodPredict";
import { getMoodAdvice } from "@/lib/moodAdvice";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text : "";

    if (!text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const prediction = await predictMoodFromText(text);
    const advice = getMoodAdvice(prediction.mood);

    return NextResponse.json({
      mood: prediction.mood,
      confidence: prediction.confidence,
      rationale: prediction.rationale,
      advice,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Mood prediction failed" },
      { status: 500 }
    );
  }
}

