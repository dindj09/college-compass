/**
 * Profile storage — currently backed by HTTP cookies.
 *
 * To add a database (Postgres/Prisma, Supabase, etc.):
 *   1. Replace getProfile() and saveProfile() with DB calls.
 *   2. Remove the cookie imports/logic.
 *   3. Everything else in the app stays the same.
 */

import { cookies } from "next/headers";
import type { StudentProfile } from "@college-compass/core";

const COOKIE_NAME = "cc_profile";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getProfile(_userId: string): StudentProfile | null {
  try {
    const value = cookies().get(COOKIE_NAME)?.value;
    if (!value) return null;
    return JSON.parse(decodeURIComponent(value)) as StudentProfile;
  } catch {
    return null;
  }
}

export function saveProfile(_userId: string, profile: StudentProfile): void {
  // saveProfile must only be called from Server Actions (Next.js requirement for cookie writes)
  const updated = { ...profile, updatedAt: new Date().toISOString() };
  cookies().set(COOKIE_NAME, encodeURIComponent(JSON.stringify(updated)), {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export function profileExists(_userId: string): boolean {
  return !!cookies().get(COOKIE_NAME)?.value;
}

// ─── Default empty profile factory ───────────────────────────────────────────

export function createEmptyProfile(userId: string): StudentProfile {
  return {
    id: userId,
    name: "",
    currentGrade: 11,
    gpaUnweighted: 0,
    gpaWeighted: 0,
    satScore: undefined,
    actScore: undefined,
    subjectGrades: [],
    extracurriculars: [],
    interests: [],
    careerGoals: [],
    preferredStates: [],
    avoidedStates: [],
    schoolSizePreference: "no_preference",
    budgetRange: "no_limit",
    updatedAt: new Date().toISOString(),
  };
}
