"use server";

import { revalidatePath } from "next/cache";
import type { StudentProfile } from "@college-compass/core";
import { saveProfile } from "@/lib/profile-store";
import { getCurrentUserId } from "@/lib/session";

export async function saveProfileAction(profile: StudentProfile): Promise<void> {
  const userId = await getCurrentUserId();
  saveProfile(userId, profile);
  revalidatePath("/", "layout"); // revalidate all pages so they pick up the new profile
}
