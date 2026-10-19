import Link from "next/link";
import { getSession } from "@/lib/session";
import { getProfile } from "@/lib/profile-store";

export default async function DashboardPage() {
  const session = await getSession();
  const profile = getProfile(session.user.id);
  const hasProfile = profile && profile.name;

  const features = [
    {
      href: "/profile",
      title: "My Profile",
      description: "Set up your GPA, test scores, courses, and extracurriculars.",
      icon: "👤",
      cta: hasProfile ? "Edit Profile" : "Get Started",
      highlight: !hasProfile,
    },
    {
      href: "/schools",
      title: "School Recommendations",
      description: "Get AI-curated reach, target, and safety school lists tailored to you.",
      icon: "🏛",
      cta: "Find Schools",
      highlight: false,
    },
    {
      href: "/strengthen",
      title: "Strengthen Profile",
      description: "Discover which courses and activities will boost your application.",
      icon: "📈",
      cta: "Get Advice",
      highlight: false,
    },
    {
      href: "/essay",
      title: "Essay Coach",
      description: "Paste your essay and get detailed, section-by-section feedback from AI.",
      icon: "✍️",
      cta: "Review Essay",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center py-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 text-sm font-medium rounded-full border border-brand-200">
          AI-Powered College Guidance
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          {hasProfile ? `Welcome back, ${profile.name.split(" ")[0]}` : "Your college journey starts here"}
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          {hasProfile
            ? "Continue building your college application strategy."
            : "Set up your student profile to get personalized school recommendations, course advice, and essay feedback."}
        </p>
        {!hasProfile && (
          <Link href="/profile" className="btn-primary text-base px-8 py-3 mt-2 inline-block">
            Set Up Your Profile
          </Link>
        )}
      </div>

      {/* Progress indicator (when profile exists) */}
      {hasProfile && (
        <div className="card p-6">
          <h2 className="section-heading mb-4">Your Profile Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Grade" value={`${profile.currentGrade}th`} />
            <Stat label="GPA (UW)" value={profile.gpaUnweighted.toFixed(2)} />
            <Stat label="SAT" value={profile.satScore ? String(profile.satScore) : "—"} />
            <Stat label="Activities" value={String(profile.extracurriculars.length)} />
          </div>
        </div>
      )}

      {/* Feature cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div
            key={f.href}
            className={`card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow ${f.highlight ? "ring-2 ring-brand-400" : ""}`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{f.icon}</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">{f.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{f.description}</p>
              </div>
            </div>
            <Link
              href={f.href}
              className={f.highlight ? "btn-primary self-start" : "btn-secondary self-start"}
            >
              {f.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-8">
        <h2 className="section-heading mb-6 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Build Your Profile", desc: "Enter your grades, test scores, activities, and goals." },
            { step: "2", title: "Get School Matches", desc: "AI categorizes 100+ colleges into reach, target, and safety." },
            { step: "3", title: "Strengthen Your App", desc: "Get specific course and EC recommendations for your goals." },
            { step: "4", title: "Polish Your Essays", desc: "Receive expert-level feedback on every part of your essay." },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mx-auto text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-brand-700">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
