import { getSession } from "@/lib/session";
import { getProfile, createEmptyProfile } from "@/lib/profile-store";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await getSession();
  const profile = getProfile(session.user.id) ?? createEmptyProfile(session.user.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">
          Fill in your academic and extracurricular information to get personalized recommendations.
        </p>
      </div>
      <ProfileForm initialProfile={profile} />
    </div>
  );
}
