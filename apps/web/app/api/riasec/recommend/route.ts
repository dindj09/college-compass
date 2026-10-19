import { NextRequest, NextResponse } from "next/server";
import { assessCareer } from "@college-compass/core";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      answers: Record<string, number>;
      model?: string;
      interests?: string[];
      careerGoals?: string[];
    };

    if (!body.answers || typeof body.answers !== "object") {
      return NextResponse.json({ error: "answers is required" }, { status: 400 });
    }

    const result = await assessCareer(body.answers, {
      modelOverride: body.model,
      interests: body.interests,
      careerGoals: body.careerGoals,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/riasec/recommend]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
