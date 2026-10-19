import Link from "next/link";
import { getSession } from "@/lib/session";
import { getProfile } from "@/lib/profile-store";
import { getTours } from "@/lib/tour-store";
import { SchoolsClient } from "./schools-client";

export default async function SchoolsPage() {
  const session = await getSession();
  const profile = getProfile(session.user.id);

  if (!profile || !profile.name) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <div className="text-5xl">🏛</div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Required</h1>
        <p className="text-slate-500">
          Set up your student profile first so we can recommend the right schools for you.
        </p>
        <Link href="/profile" className="btn-primary inline-block">
          Set Up Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">School Recommendations</h1>
        <p className="text-slate-500 mt-1">
          AI-curated reach, target, and safety schools based on your profile.
        </p>
      </div>
      <SchoolsClient profile={profile} trackedCollegeIds={getTours().map(t => t.collegeId)} />
    </div>
  );
}
