"use client";

import { useState } from "react";
import type { EssayReview, EssayBrainstorm, EssayPromptType, SupportedModel } from "@college-compass/core";
import { cn, scoreColor } from "@/lib/utils";

type Tab = "brainstorm" | "review";

const PROMPT_TYPES: { value: EssayPromptType; label: string }[] = [
  { value: "common_app_main", label: "Common App Main Essay" },
  { value: "common_app_activity", label: "Common App Activities" },
  { value: "why_school", label: "Why This School" },
  { value: "supplemental", label: "Supplemental Essay" },
  { value: "scholarship", label: "Scholarship Essay" },
  { value: "other", label: "Other" },
];

const MODEL_OPTIONS: { label: string; value: SupportedModel; note: string }[] = [
  { label: "Haiku",       value: "claude-haiku-4-5-20251001", note: "Claude · fast" },
  { label: "Sonnet",      value: "claude-sonnet-4-6",         note: "Claude · recommended" },
  { label: "Opus",        value: "claude-opus-4-6",           note: "Claude · thorough" },
  { label: "GPT-4o Mini", value: "gpt-4o-mini",               note: "OpenAI · fast" },
  { label: "GPT-4o",      value: "gpt-4o",                    note: "OpenAI · best" },
];

const SECTION_LABELS: Record<string, string> = {
  hook: "Opening Hook",
  storytelling: "Storytelling",
  voice: "Authentic Voice",
  structure: "Structure & Flow",
  insight: "Self-Insight",
  conclusion: "Conclusion",
};

interface StudentContext {
  interests: string[];
  careerGoals: string[];
  currentGrade: number;
  extracurriculars?: { name: string; role: string; isLeadership: boolean }[];
}

export function EssayClient({ studentContext }: { studentContext?: StudentContext }) {
  const [tab, setTab] = useState<Tab>("brainstorm");
  const [promptType, setPromptType] = useState<EssayPromptType>("common_app_main");
  const [targetSchool, setTargetSchool] = useState("");
  const [model, setModel] = useState<SupportedModel>("claude-sonnet-4-6");

  // Review state
  const [essayText, setEssayText] = useState("");
  const [wordLimit, setWordLimit] = useState<number | undefined>(650);
  const [review, setReview] = useState<EssayReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Brainstorm state
  const [brainstorm, setBrainstorm] = useState<EssayBrainstorm | null>(null);
  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

  async function submitReview() {
    if (!essayText.trim()) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/essay/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayText,
          promptType,
          targetSchool: targetSchool || undefined,
          wordLimit,
          studentProfile: studentContext,
          model,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setReview(await res.json());
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setReviewLoading(false);
    }
  }

  async function submitBrainstorm() {
    setBrainstormLoading(true);
    setBrainstormError(null);
    try {
      const res = await fetch("/api/essay/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptType,
          targetSchool: targetSchool || undefined,
          studentProfile: studentContext,
          model,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setBrainstorm(await res.json());
    } catch (e) {
      setBrainstormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBrainstormLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        {([["brainstorm", "Brainstorm Ideas"], ["review", "Review My Essay"]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Shared controls */}
      <div className="card p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Essay Type</label>
            <select
              className="input"
              value={promptType}
              onChange={(e) => setPromptType(e.target.value as EssayPromptType)}
            >
              {PROMPT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target School (optional)</label>
            <input
              className="input"
              placeholder="e.g. Stanford, MIT, Any"
              value={targetSchool}
              onChange={(e) => setTargetSchool(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">AI Model</label>
          <div className="flex gap-2">
            {MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setModel(opt.value)}
                className={cn(
                  "flex-1 px-2 py-2 rounded-xl text-sm font-medium border transition-colors text-center",
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
      </div>

      {/* Brainstorm tab */}
      {tab === "brainstorm" && (
        <div className="space-y-6">
          {!studentContext && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">
              Set up your profile to get story ideas tailored to your specific experiences and interests.
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={submitBrainstorm}
              disabled={brainstormLoading}
              className="btn-primary"
            >
              {brainstormLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Generating ideas...
                </span>
              ) : brainstorm ? "Regenerate Ideas" : "Generate Story Ideas"}
            </button>
          </div>

          {brainstormError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {brainstormError}
            </div>
          )}

          {brainstorm && <BrainstormResult brainstorm={brainstorm} />}
        </div>
      )}

      {/* Review tab */}
      {tab === "review" && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Word Limit (optional)</label>
              <input
                type="number"
                className="input"
                placeholder="650"
                value={wordLimit ?? ""}
                onChange={(e) => setWordLimit(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Your Essay</label>
                <span className={cn("text-sm font-medium", wordLimit && wordCount > wordLimit ? "text-red-600" : "text-slate-500")}>
                  {wordCount} words{wordLimit ? ` / ${wordLimit}` : ""}
                </span>
              </div>
              <textarea
                className="input resize-y min-h-[280px] font-serif text-[15px] leading-relaxed"
                placeholder="Paste your essay here..."
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={submitReview}
                disabled={reviewLoading || !essayText.trim()}
                className="btn-primary"
              >
                {reviewLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Reviewing essay...
                  </span>
                ) : "Get Feedback"}
              </button>
            </div>
          </div>

          {reviewError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {reviewError}
            </div>
          )}

          {review && <EssayReviewResult review={review} />}
        </div>
      )}
    </div>
  );
}

function BrainstormResult({ brainstorm }: { brainstorm: EssayBrainstorm }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-heading">Story Ideas</h2>
        <span className="badge bg-slate-100 text-slate-600 border-slate-200 text-sm">
          Model: {brainstorm.modelUsed}
        </span>
      </div>
      {brainstorm.angles.map((angle, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <h3 className="font-semibold text-slate-900 leading-snug">{angle.title}</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{angle.story}</p>
          <p className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
            <span className="font-medium">Why it works: </span>{angle.whyItWorks}
          </p>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500 mb-1 font-medium">Suggested opening:</p>
            <p className="text-sm text-slate-700 italic font-serif leading-relaxed">
              &ldquo;{angle.suggestedOpening}&rdquo;
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EssayReviewResult({ review }: { review: EssayReview }) {
  return (
    <div className="space-y-6">
      {/* Header scores */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-heading">Essay Review</h2>
          <div className="text-right">
            <div className={cn("text-4xl font-bold", scoreColor(review.overallScore))}>
              {review.overallScore}/10
            </div>
            <div className="text-xs text-slate-400">Overall Score</div>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(review.sections).map(([key, section]) => (
            <div key={key} className="text-center bg-slate-50 rounded-xl p-3">
              <div className={cn("text-xl font-bold", scoreColor(section.score))}>
                {section.score}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">
                {SECTION_LABELS[key]}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-400 mt-2 text-right">
          Model: {review.modelUsed} &middot; {review.wordCount} words
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-green-700 mb-3">Top Strengths</h3>
          <ul className="space-y-2">
            {review.topStrengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-amber-700 mb-3">Top Improvements</h3>
          <ul className="space-y-2">
            {review.topImprovements.map((s, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#9651;</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Revised opening */}
      {review.revisedOpening && (
        <div className="card p-5 border-brand-200 bg-brand-50">
          <h3 className="font-semibold text-brand-700 mb-2">Suggested Opening Rewrite</h3>
          <p className="text-slate-700 italic font-serif text-[15px] leading-relaxed">
            &ldquo;{review.revisedOpening}&rdquo;
          </p>
        </div>
      )}

      {/* Detailed section feedback */}
      <div className="space-y-4">
        <h2 className="section-heading">Section-by-Section Feedback</h2>
        {Object.entries(review.sections).map(([key, section]) => (
          <div key={key} className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-900">{SECTION_LABELS[key]}</h3>
              <span className={cn("text-lg font-bold", scoreColor(section.score))}>
                {section.score}/10
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{section.feedback}</p>
            {section.suggestions.length > 0 && (
              <ul className="space-y-1.5">
                {section.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-brand-700 flex items-start gap-2 bg-brand-50 rounded-lg px-3 py-1.5">
                    <span className="mt-0.5">&#8594;</span> {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
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
