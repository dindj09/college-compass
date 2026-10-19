"use server";

import { revalidatePath } from "next/cache";
import type { TourEntry, TourStatus } from "@college-compass/core";
import { upsertTour, removeTour } from "@/lib/tour-store";

export async function addTourAction(entry: Omit<TourEntry, "addedAt">): Promise<void> {
  upsertTour({ ...entry, addedAt: new Date().toISOString() });
  revalidatePath("/tours");
  revalidatePath("/schools");
}

export async function updateTourAction(
  collegeId: string,
  updates: Partial<Pick<TourEntry, "status" | "scheduledDate" | "notes">>
): Promise<void> {
  const { getTour } = await import("@/lib/tour-store");
  const existing = getTour(collegeId);
  if (!existing) return;
  upsertTour({ ...existing, ...updates });
  revalidatePath("/tours");
}

export async function removeTourAction(collegeId: string): Promise<void> {
  removeTour(collegeId);
  revalidatePath("/tours");
  revalidatePath("/schools");
}
