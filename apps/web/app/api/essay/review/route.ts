import { NextRequest, NextResponse } from "next/server";
import { reviewEssay } from "@college-compass/core";
import type { EssayReviewRequest } from "@college-compass/core";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as EssayReviewRequest & { model?: string };

    if (!body.essayText?.trim()) {
      return NextResponse.json({ error: "essayText is required" }, { status: 400 });
    }

    const result = await reviewEssay(
      {
        essayText: body.essayText,
        promptType: body.promptType ?? "common_app_main",
        targetSchool: body.targetSchool,
        wordLimit: body.wordLimit,
        studentProfile: body.studentProfile,
      },
      { modelOverride: body.model }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/essay/review]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
