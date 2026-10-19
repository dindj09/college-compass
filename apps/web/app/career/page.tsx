import { getSession } from "@/lib/session";
import { getProfile } from "@/lib/profile-store";
import { CareerClient } from "./career-client";

export default async function CareerPage() {
  const session = await getSession();
  const profile = getProfile(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Career Explorer</h1>
        <p className="text-slate-500 mt-1">
          Discover careers and majors that match your personality with the Holland RIASEC assessment.
        </p>
      </div>
      <CareerClient
        interests={profile?.interests}
        careerGoals={profile?.careerGoals}
      />
    </div>
  );
}
