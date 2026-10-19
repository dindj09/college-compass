import { NextRequest, NextResponse } from "next/server";
import { recommendSchools } from "@college-compass/core";
import type { StudentProfile } from "@college-compass/core";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      profile: StudentProfile;
      model?: string;
      useLLMNarratives?: boolean;
    };

    if (!body.profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    const result = await recommendSchools(body.profile, {
      modelOverride: body.model,
      useLLMNarratives: body.useLLMNarratives ?? false,
      maxPerTier: 6,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/schools/recommend]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
