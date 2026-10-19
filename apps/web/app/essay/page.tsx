import { getSession } from "@/lib/session";
import { getProfile } from "@/lib/profile-store";
import { EssayClient } from "./essay-client";

export default async function EssayPage() {
  const session = await getSession();
  const profile = getProfile(session.user.id);

  const studentContext = profile
    ? {
        interests: profile.interests,
        careerGoals: profile.careerGoals,
        currentGrade: profile.currentGrade,
        extracurriculars: profile.extracurriculars,
      }
    : undefined;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Essay Coach</h1>
        <p className="text-slate-500 mt-1">
          Paste your essay for detailed AI feedback across six key dimensions.
        </p>
      </div>
      <EssayClient studentContext={studentContext} />
    </div>
  );
}
