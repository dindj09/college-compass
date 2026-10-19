import { NextRequest, NextResponse } from "next/server";
import { analyzeProfile } from "@college-compass/core";
import type { StudentProfile } from "@college-compass/core";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      profile: StudentProfile;
      model?: string;
    };

    if (!body.profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    const result = await analyzeProfile(body.profile, {
      modelOverride: body.model,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/strengthen]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
