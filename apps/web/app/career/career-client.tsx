"use client";

import { useState, useMemo } from "react";
import type { RiasecResult, RiasecType, SupportedModel } from "@college-compass/core";
import { RIASEC_QUESTIONS, DISPLAY_ORDER } from "@college-compass/core";
import { cn } from "@/lib/utils";

const MODEL_OPTIONS: { label: string; value: SupportedModel; note: string }[] = [
  { label: "Haiku",  value: "claude-haiku-4-5-20251001", note: "Claude · fast" },
  { label: "Sonnet", value: "claude-sonnet-4-6",         note: "Claude · recommended" },
  { label: "Opus",   value: "claude-opus-4-6",           note: "Claude · best" },
];

const SCALE_LABELS = ["Not interested", "Slightly", "Somewhat", "Very interested", "Extremely"];

const TYPE_COLORS: Record<RiasecType, string> = {
  R: "bg-orange-500",
  I: "bg-blue-500",
  A: "bg-purple-500",
  S: "bg-green-500",
  E: "bg-red-500",
  C: "bg-yellow-500",
};

const TYPE_BADGE_COLORS: Record<RiasecType, string> = {
  R: "bg-orange-50 text-orange-700 border-orange-200",
  I: "bg-blue-50 text-blue-700 border-blue-200",
  A: "bg-purple-50 text-purple-700 border-purple-200",
  S: "bg-green-50 text-green-700 border-green-200",
  E: "bg-red-50 text-red-700 border-red-200",
  C: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const TYPE_NAMES: Record<RiasecType, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

interface Props {
  interests?: string[];
  careerGoals?: string[];
}

export function CareerClient({ interests, careerGoals }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<RiasecResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<SupportedModel>("claude-sonnet-4-6");

  const questionMap = useMemo(
    () => Object.fromEntries(RIASEC_QUESTIONS.map((q) => [q.id, q])),
    []
  );

  const orderedQuestions = useMemo(
    () => DISPLAY_ORDER.map((id) => questionMap[id]).filter(Boolean),
    [questionMap]
  );

  const answeredCount = Object.keys(answers).length;
  const totalCount = orderedQuestions.length;
  const allAnswered = answeredCount === totalCount;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/riasec/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, model, interests, careerGoals }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAnswers({});
    setResult(null);
    setError(null);
  }

  if (result) {
    return <Results result={result} onRetake={reset} />;
  }

  return (
    <div className="space-y-6">
      {/* Intro card */}
      <div className="card p-6 bg-gradient-to-br from-brand-50 to-white border-brand-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">How it works</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Rate your interest in each activity from 1 (not interested) to 5 (extremely interested).
          There are no right or wrong answers — just be honest about what genuinely excites you.
          Your responses reveal your Holland Code, which maps to careers and college majors.
        </p>
        {interests?.length || careerGoals?.length ? (
          <p className="text-sm text-brand-700 mt-3 font-medium">
            Your profile interests will be used to personalize the recommendations.
          </p>
        ) : null}
      </div>

      {/* Model picker + progress */}
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

          <div className="ml-auto text-right">
            <div className="text-sm text-slate-500">{answeredCount} / {totalCount} answered</div>
            <div className="w-48 h-2 bg-slate-100 rounded-full mt-1">
              <div
                className="h-2 bg-brand-500 rounded-full transition-all"
                style={{ width: `${(answeredCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="card p-6 space-y-6">
        {/* Scale legend */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>1 = Not interested</span>
          <span>5 = Extremely interested</span>
        </div>

        {orderedQuestions.map((q, idx) => (
          <div key={q.id} className={cn(
            "flex flex-col sm:flex-row sm:items-center gap-3 pb-5",
            idx < orderedQuestions.length - 1 && "border-b border-slate-100"
          )}>
            <div className="flex-1 text-sm text-slate-800">
              <span className="text-slate-400 mr-2">{idx + 1}.</span>
              {q.text}
            </div>
            <div className="flex gap-2 shrink-0">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                  title={SCALE_LABELS[val - 1]}
                  className={cn(
                    "w-9 h-9 rounded-xl text-sm font-medium border transition-colors",
                    answers[q.id] === val
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        {!allAnswered && (
          <p className="text-sm text-slate-400">
            {totalCount - answeredCount} question{totalCount - answeredCount !== 1 ? "s" : ""} remaining
          </p>
        )}
        <button
          onClick={submit}
          disabled={!allAnswered || loading}
          className="btn-primary ml-auto"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner /> Analyzing your results...
            </span>
          ) : "Get My Results"}
        </button>
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function Results({ result, onRetake }: { result: RiasecResult; onRetake: () => void }) {
  const sortedScores = (Object.entries(result.scores) as [RiasecType, number][])
    .sort((a, b) => b[1] - a[1]);

  const maxScore = 30;
  const topTypes = result.hollandCode.split("") as RiasecType[];

  return (
    <div className="space-y-6">
      {/* Model badge + retake */}
      <div className="flex items-center justify-between">
        <span className="badge bg-slate-100 text-slate-600 border-slate-200 text-sm">
          Model: {result.modelUsed}
        </span>
        <button onClick={onRetake} className="text-sm text-brand-600 hover:underline font-medium">
          Retake Quiz
        </button>
      </div>

      {/* Holland Code hero */}
      <div className="card p-8 text-center bg-gradient-to-br from-brand-50 to-white border-brand-100">
        <p className="text-sm font-medium text-slate-500 mb-2">Your Holland Code</p>
        <div className="flex items-center justify-center gap-3 mb-4">
          {topTypes.map((t) => (
            <div
              key={t}
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-sm",
                TYPE_COLORS[t]
              )}
            >
              {t}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          {topTypes.map((t) => (
            <span key={t} className={cn("badge", TYPE_BADGE_COLORS[t])}>
              {TYPE_NAMES[t]}
            </span>
          ))}
        </div>
        <p className="text-slate-700 text-sm leading-relaxed max-w-xl mx-auto">{result.summary}</p>
      </div>

      {/* Score bars */}
      <div className="card p-6">
        <h2 className="section-heading mb-4">Your RIASEC Scores</h2>
        <div className="space-y-3">
          {sortedScores.map(([type, score]) => (
            <div key={type} className="flex items-center gap-3">
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0", TYPE_COLORS[type])}>
                {type}
              </div>
              <div className="text-sm text-slate-600 w-28 shrink-0">{TYPE_NAMES[type]}</div>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-3 rounded-full transition-all", TYPE_COLORS[type])}
                  style={{ width: `${(score / maxScore) * 100}%` }}
                />
              </div>
              <div className="text-sm font-medium text-slate-700 w-12 text-right shrink-0">
                {score}/30
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top type descriptions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {topTypes.map((t) => (
          <div key={t} className={cn("card p-5 border", TYPE_BADGE_COLORS[t])}>
            <div className="font-semibold mb-1">{TYPE_NAMES[t]}</div>
            <p className="text-sm leading-relaxed">{result.typeDescriptions[t]}</p>
          </div>
        ))}
      </div>

      {/* Career matches */}
      <div className="card p-6">
        <h2 className="section-heading mb-4">Recommended Careers</h2>
        <div className="space-y-4">
          {result.topCareers.map((career, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{career.title}</h3>
              </div>
              <p className="text-sm text-slate-700">{career.description}</p>
              <p className="text-xs text-slate-500 italic">{career.fitReason}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {career.majors.map((major, j) => (
                  <span key={j} className="badge bg-brand-50 text-brand-700 border-brand-200 text-xs">
                    {major}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top majors */}
      <div className="card p-6">
        <h2 className="section-heading mb-4">Recommended College Majors</h2>
        <div className="flex flex-wrap gap-2">
          {result.topMajors.map((major, i) => (
            <span key={i} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700">
              {major}
            </span>
          ))}
        </div>
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
