import { cookies } from "next/headers";
import type { TourEntry } from "@college-compass/core";

const COOKIE_NAME = "cc_tours";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readAll(): TourEntry[] {
  try {
    const value = cookies().get(COOKIE_NAME)?.value;
    if (!value) return [];
    return JSON.parse(decodeURIComponent(value)) as TourEntry[];
  } catch {
    return [];
  }
}

function writeAll(tours: TourEntry[]): void {
  cookies().set(COOKIE_NAME, encodeURIComponent(JSON.stringify(tours)), {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export function getTours(): TourEntry[] {
  return readAll();
}

export function upsertTour(entry: TourEntry): void {
  const all = readAll();
  const idx = all.findIndex(t => t.collegeId === entry.collegeId);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.push(entry);
  }
  writeAll(all);
}

export function removeTour(collegeId: string): void {
  writeAll(readAll().filter(t => t.collegeId !== collegeId));
}

export function getTour(collegeId: string): TourEntry | null {
  return readAll().find(t => t.collegeId === collegeId) ?? null;
}
