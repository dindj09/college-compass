import Link from "next/link";
import { getSession } from "@/lib/session";
import { getProfile } from "@/lib/profile-store";
import { StrengthenClient } from "./strengthen-client";

export default async function StrengthenPage() {
  const session = await getSession();
  const profile = getProfile(session.user.id);

  if (!profile || !profile.name) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <div className="text-5xl">📈</div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Required</h1>
        <p className="text-slate-500">
          Set up your student profile first so we can give you personalized recommendations.
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
        <h1 className="text-3xl font-bold text-slate-900">Strengthen Your Profile</h1>
        <p className="text-slate-500 mt-1">
          Get specific course and extracurricular recommendations to make your application stronger.
        </p>
      </div>
      <StrengthenClient profile={profile} />
    </div>
  );
}
