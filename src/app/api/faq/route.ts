import { NextRequest, NextResponse } from "next/server";
import { findBestAnswer } from "@/lib/faqData";

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Invalid 'question'" }, { status: 400 });
    }

    // Simulate thinking delay on server to make UI feel like an assistant
    await new Promise((r) => setTimeout(r, 350));

    const answer = findBestAnswer(question);
    const suggestions = buildSuggestions(question);
    if (!answer) {
      return NextResponse.json({
        found: false,
        answer: "Here are some things I can help with:",
        suggestions,
      });
    }
    return NextResponse.json({ found: true, answer, suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bad request" }, { status: 400 });
  }
}

function buildSuggestions(_q: string): string[] {
  return [
    "How do I scan a medicine?",
    "How do I scan a food?",
    "How do I scan a cosmetic?",
    "How do I scan a leaf?",
    "What are the plan limits?",
    "How do I export my data?",
  ];
}

