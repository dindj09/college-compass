import { NextRequest, NextResponse } from "next/server";
import { brainstormEssay } from "@college-compass/core";
import type { EssayBrainstormRequest } from "@college-compass/core";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as EssayBrainstormRequest & { model?: string };

    if (!body.promptType) {
      return NextResponse.json({ error: "promptType is required" }, { status: 400 });
    }

    const result = await brainstormEssay(
      { promptType: body.promptType, targetSchool: body.targetSchool, studentProfile: body.studentProfile },
      { modelOverride: body.model }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/essay/brainstorm]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
