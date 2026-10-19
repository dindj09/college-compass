"use client";

import { useState } from "react";
import type { StudentProfile, SchoolRecommendationResult, CollegeRecommendation, SupportedModel } from "@college-compass/core";
import { cn, formatCurrency, formatPercent, tierColor, tierLabel } from "@/lib/utils";
import { addTourAction } from "../tours/actions";

const MODEL_OPTIONS: { label: string; value: SupportedModel; note: string }[] = [
  { label: "Haiku",        value: "claude-haiku-4-5-20251001", note: "Claude · fastest" },
  { label: "Sonnet",       value: "claude-sonnet-4-6",         note: "Claude · balanced" },
  { label: "Opus",         value: "claude-opus-4-6",           note: "Claude · best" },
  { label: "GPT-4o Mini",  value: "gpt-4o-mini",               note: "OpenAI · fast" },
  { label: "GPT-4o",       value: "gpt-4o",                    note: "OpenAI · best" },
];

export function SchoolsClient({ profile, trackedCollegeIds }: { profile: StudentProfile; trackedCollegeIds: string[] }) {
  const [result, setResult] = useState<SchoolRecommendationResult | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(() => new Set(trackedCollegeIds));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<SupportedModel>("claude-haiku-4-5-20251001");
  const [useLLM, setUseLLM] = useState(true);
  const [activeTab, setActiveTab] = useState<"reach" | "target" | "safety">("target");

  async function fetchRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schools/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, model, useLLMNarratives: useLLM }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setActiveTab("target");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings card */}
      <div className="card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">AI Model</label>
            <div className="flex gap-2">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setModel(opt.value)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-medium border transition-colors",
                    model === opt.value
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
                  )}
                >
                  <div>{opt.label}</div>
                  <div className="text-xs opacity-70">{opt.note}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer mb-0.5">
            <input
              type="checkbox"
              checked={useLLM}
              onChange={(e) => setUseLLM(e.target.checked)}
              className="rounded w-4 h-4"
            />
            Generate AI narratives for each school
          </label>

          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="btn-primary ml-auto"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Analyzing...
              </span>
            ) : result ? "Refresh Recommendations" : "Get Recommendations"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {result && (
        <>
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="badge bg-slate-100 text-slate-600 border-slate-200">
              Model: {result.modelUsed}
            </span>
            <span className="badge bg-slate-100 text-slate-600 border-slate-200">
              {result.gpaTypeUsed === "weighted"
                ? `Using weighted GPA: ${result.gpaUsed.toFixed(2)}`
                : `Using unweighted GPA: ${result.gpaUsed.toFixed(2)}`}
            </span>
            <span>{result.reach.length + result.target.length + result.safety.length} schools matched</span>
          </div>

          {/* Tier tabs */}
          <div className="flex gap-2">
            {(["reach", "target", "safety"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTab(tier)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors",
                  activeTab === tier
                    ? tierColor(tier) + " ring-1"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {tierLabel(tier)} ({result[tier].length})
              </button>
            ))}
          </div>

          {/* School list */}
          <div className="space-y-4">
            {result[activeTab].length === 0 ? (
              <div className="text-center py-12 text-slate-400 card">
                No {activeTab} schools found for your profile.
              </div>
            ) : (
              result[activeTab].map((rec) => (
                <CollegeCard
                  key={rec.college.id}
                  rec={rec}
                  tracked={trackedIds.has(rec.college.id)}
                  onTrack={async () => {
                    await addTourAction({
                      collegeId: rec.college.id,
                      collegeName: rec.college.name,
                      collegeState: rec.college.state,
                      collegeWebsite: rec.college.website,
                      status: "wishlist",
                    });
                    setTrackedIds(prev => new Set([...prev, rec.college.id]));
                  }}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const LOCATION_FIT_BADGE: Record<string, string> = {
  preferred: "bg-green-50 text-green-700 border-green-200",
  avoided:   "bg-red-50 text-red-600 border-red-200",
  neutral:   "",
};

const LOCATION_FIT_LABEL: Record<string, string> = {
  preferred: "Preferred state",
  avoided:   "State to avoid",
  neutral:   "",
};

function CollegeCard({ rec, tracked, onTrack }: { rec: CollegeRecommendation; tracked: boolean; onTrack: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [tracking, setTracking] = useState(false);
  const { college, tier, matchScore, locationFit, fitReasons, concerns, llmNarrative } = rec;

  async function handleTrack() {
    setTracking(true);
    await onTrack();
    setTracking(false);
  }

  return (
    <div className={cn(
      "card p-5 hover:shadow-md transition-shadow",
      locationFit === "avoided" && "opacity-80"
    )}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 text-lg">{college.name}</h3>
            <span className={cn("badge", tierColor(tier))}>
              {tierLabel(tier)}
            </span>
            {locationFit !== "neutral" && (
              <span className={cn("badge", LOCATION_FIT_BADGE[locationFit])}>
                {LOCATION_FIT_LABEL[locationFit]}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {college.city}, {college.state} &middot; {college.type === "public" ? "Public" : "Private"} &middot; {college.size} school
          </p>

          {llmNarrative && (
            <p className="text-sm text-slate-600 mt-2 italic">&ldquo;{llmNarrative}&rdquo;</p>
          )}
        </div>

        <div className="text-right shrink-0 space-y-2">
          <div>
            <div className="text-2xl font-bold text-brand-600">{matchScore}</div>
            <div className="text-xs text-slate-400">match score</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {tracked ? (
              <span className="inline-block text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                &#10003; Tour tracked
              </span>
            ) : (
              <button
                onClick={handleTrack}
                disabled={tracking}
                className="btn-secondary text-xs py-1 px-2.5"
              >
                {tracking ? "Adding..." : "+ Track Tour"}
              </button>
            )}
            <a
              href={`https://${college.website}/visit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline"
            >
              Book tour &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        <Stat label="Acceptance" value={formatPercent(college.acceptanceRate)} />
        <Stat label="Avg GPA" value={college.avgGPA.toFixed(2)} />
        <Stat label="Avg SAT" value={String(college.avgSAT)} />
        <Stat label="Avg ACT" value={String(college.avgACT)} />
        <Stat label="Total CoA" value={formatCurrency(college.annualTuition + college.annualRoomBoard)} />
        {college.ranking < 999 && <Stat label="US News Rank" value={`#${college.ranking}`} />}
      </div>

      {/* Strong programs */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {college.strongPrograms.slice(0, 5).map((prog) => (
          <span key={prog} className="badge bg-brand-50 text-brand-700 border-brand-100">
            {prog}
          </span>
        ))}
      </div>

      {/* Expand for reasons/concerns */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="text-sm text-brand-600 hover:text-brand-800 mt-3 font-medium"
      >
        {expanded ? "Hide details" : "Show fit details"}
      </button>

      {expanded && (
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          {fitReasons.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Why it fits</div>
              <ul className="space-y-1">
                {fitReasons.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">&#10003;</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {concerns.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Things to consider</div>
              <ul className="space-y-1">
                {concerns.map((c, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">!</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center bg-slate-50 rounded-lg px-3 py-1.5">
      <div className="font-semibold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
