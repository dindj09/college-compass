"use client";

import { useState } from "react";
import type { StudentProfile, StrengthReport, SupportedModel } from "@college-compass/core";
import { cn } from "@/lib/utils";

const MODEL_OPTIONS: { label: string; value: SupportedModel; note: string }[] = [
  { label: "Haiku",       value: "claude-haiku-4-5-20251001", note: "Claude · fast" },
  { label: "Sonnet",      value: "claude-sonnet-4-6",         note: "Claude · recommended" },
  { label: "Opus",        value: "claude-opus-4-6",           note: "Claude · best" },
  { label: "GPT-4o Mini", value: "gpt-4o-mini",               note: "OpenAI · fast" },
  { label: "GPT-4o",      value: "gpt-4o",                    note: "OpenAI · best" },
];

const PRIORITY_COLORS = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-green-50 text-green-700 border-green-200",
};

export function StrengthenClient({ profile }: { profile: StudentProfile }) {
  const [report, setReport] = useState<StrengthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<SupportedModel>("claude-sonnet-4-6");

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/strengthen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, model }),
      });
      if (!res.ok) throw new Error(await res.text());
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
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

          <button onClick={analyze} disabled={loading} className="btn-primary ml-auto">
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Analyzing your profile...
              </span>
            ) : report ? "Re-analyze" : "Analyze My Profile"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Model badge */}
          <div className="text-sm text-slate-500">
            <span className="badge bg-slate-100 text-slate-600 border-slate-200">
              Model: {report.modelUsed}
            </span>
          </div>

          {/* Overall Assessment */}
          <div className="card p-6">
            <h2 className="section-heading mb-3">Overall Assessment</h2>
            <p className="text-slate-700 leading-relaxed">{report.overallAssessment}</p>
          </div>

          {/* Strengths & Gaps */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-6">
              <h2 className="section-heading mb-3 text-green-700">Your Strengths</h2>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-500 font-bold mt-0.5">&#10003;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6">
              <h2 className="section-heading mb-3 text-amber-700">Areas to Improve</h2>
              <ul className="space-y-2">
                {report.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-500 font-bold mt-0.5">&#9651;</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Course Recommendations */}
          <div className="card p-6">
            <h2 className="section-heading mb-4">Recommended Courses</h2>
            <div className="space-y-3">
              {report.courseRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                  <span className={cn("badge shrink-0 mt-0.5", PRIORITY_COLORS[rec.priority])}>
                    {rec.priority}
                  </span>
                  <div>
                    <div className="font-medium text-slate-900">{rec.course}</div>
                    <div className="text-sm text-slate-600 mt-0.5">{rec.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EC Recommendations */}
          <div className="card p-6">
            <h2 className="section-heading mb-4">Recommended Activities</h2>
            <div className="space-y-3">
              {report.ecRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                  <span className={cn("badge shrink-0 mt-0.5", PRIORITY_COLORS[rec.priority])}>
                    {rec.priority}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">{rec.activity}</span>
                      <span className="text-xs text-slate-400">{rec.timeCommitment}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">{rec.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <h2 className="section-heading mb-3">Timeline Advice</h2>
            <p className="text-slate-700 leading-relaxed">{report.timelineAdvice}</p>
          </div>
        </div>
      )}
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
