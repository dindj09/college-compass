"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type DeadlineType = "ED" | "EA" | "ED2" | "RD" | "Scholarship" | "Other";

interface Deadline {
  id: string;
  schoolName: string;
  type: DeadlineType;
  date: string; // YYYY-MM-DD
  notes: string;
  submitted: boolean;
  createdAt: string;
}

const STORAGE_KEY = "college-compass-deadlines";

const TYPE_LABELS: Record<DeadlineType, string> = {
  ED: "Early Decision",
  EA: "Early Action",
  ED2: "Early Decision II",
  RD: "Regular Decision",
  Scholarship: "Scholarship",
  Other: "Other",
};

const TYPE_COLORS: Record<DeadlineType, string> = {
  ED:          "bg-purple-50 text-purple-700 border-purple-200",
  EA:          "bg-blue-50 text-blue-700 border-blue-200",
  ED2:         "bg-indigo-50 text-indigo-700 border-indigo-200",
  RD:          "bg-slate-50 text-slate-700 border-slate-200",
  Scholarship: "bg-amber-50 text-amber-700 border-amber-200",
  Other:       "bg-green-50 text-green-700 border-green-200",
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number, submitted: boolean): string {
  if (submitted) return "border-l-slate-300";
  if (days < 0) return "border-l-slate-400";
  if (days <= 7) return "border-l-red-500";
  if (days <= 30) return "border-l-amber-500";
  return "border-l-green-500";
}

function countdownLabel(days: number, submitted: boolean): { text: string; cls: string } {
  if (submitted) return { text: "Submitted", cls: "text-slate-400" };
  if (days < 0) return { text: `${Math.abs(days)}d past`, cls: "text-slate-400" };
  if (days === 0) return { text: "Due today!", cls: "text-red-600 font-bold" };
  if (days === 1) return { text: "Due tomorrow!", cls: "text-red-600 font-semibold" };
  if (days <= 7) return { text: `${days} days left`, cls: "text-red-600 font-semibold" };
  if (days <= 30) return { text: `${days} days left`, cls: "text-amber-600 font-medium" };
  return { text: `${days} days left`, cls: "text-green-600" };
}

const EMPTY_FORM = { schoolName: "", type: "RD" as DeadlineType, date: "", notes: "" };

export function DeadlinesClient() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "submitted">("upcoming");

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDeadlines(JSON.parse(raw));
    } catch {}
  }, []);

  function save(updated: Deadline[]) {
    setDeadlines(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("deadlines-updated"));
  }

  function addDeadline() {
    if (!form.schoolName.trim() || !form.date) return;
    const newDeadline: Deadline = {
      id: crypto.randomUUID(),
      schoolName: form.schoolName.trim(),
      type: form.type,
      date: form.date,
      notes: form.notes.trim(),
      submitted: false,
      createdAt: new Date().toISOString(),
    };
    save([...deadlines, newDeadline]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function toggleSubmitted(id: string) {
    save(deadlines.map((d) => d.id === id ? { ...d, submitted: !d.submitted } : d));
  }

  function remove(id: string) {
    save(deadlines.filter((d) => d.id !== id));
  }

  const sorted = [...deadlines].sort((a, b) => {
    if (a.submitted !== b.submitted) return a.submitted ? 1 : -1;
    return a.date.localeCompare(b.date);
  });

  const filtered = sorted.filter((d) => {
    if (filter === "upcoming") return !d.submitted;
    if (filter === "submitted") return d.submitted;
    return true;
  });

  const upcomingCount = deadlines.filter((d) => !d.submitted).length;
  const urgentCount = deadlines.filter((d) => !d.submitted && daysUntil(d.date) <= 7).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {deadlines.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">{deadlines.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Deadlines</div>
          </div>
          <div className="card p-4 text-center">
            <div className={cn("text-3xl font-bold", urgentCount > 0 ? "text-red-600" : "text-slate-900")}>
              {urgentCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Due in 7 Days</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {deadlines.length - upcomingCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Submitted</div>
          </div>
        </div>
      )}

      {/* Add deadline button / form */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn-primary w-full">
          + Add Deadline
        </button>
      ) : (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">New Deadline</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">School / Organization</label>
              <input
                className="input"
                placeholder="e.g. MIT, Gates Foundation"
                value={form.schoolName}
                onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addDeadline()}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DeadlineType }))}
              >
                {(Object.keys(TYPE_LABELS) as DeadlineType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Deadline Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input
                className="input"
                placeholder="e.g. Requires CSS Profile"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={addDeadline}
              disabled={!form.schoolName.trim() || !form.date}
              className="btn-primary"
            >
              Add Deadline
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {deadlines.length > 0 && (
        <div className="flex gap-2 border-b border-slate-200">
          {([["upcoming", "Upcoming"], ["submitted", "Submitted"], ["all", "All"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                filter === val
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {label}
              {val === "upcoming" && upcomingCount > 0 && (
                <span className={cn(
                  "ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold",
                  urgentCount > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                )}>
                  {upcomingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Deadline list */}
      {filtered.length === 0 && deadlines.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-4">📅</div>
          <p className="font-medium text-slate-500">No deadlines yet</p>
          <p className="text-sm mt-1">Add your first deadline above to get started.</p>
        </div>
      )}

      {filtered.length === 0 && deadlines.length > 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          No deadlines in this category.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((d) => {
          const days = daysUntil(d.date);
          const { text: countText, cls: countCls } = countdownLabel(days, d.submitted);
          const dateFormatted = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          });

          return (
            <div
              key={d.id}
              className={cn(
                "card p-4 border-l-4 flex items-start gap-4",
                urgencyClass(days, d.submitted),
                d.submitted && "opacity-60"
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleSubmitted(d.id)}
                className={cn(
                  "mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                  d.submitted
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-slate-300 hover:border-brand-400"
                )}
                title={d.submitted ? "Mark as not submitted" : "Mark as submitted"}
              >
                {d.submitted && (
                  <svg viewBox="0 0 12 10" className="w-3 h-3 fill-white">
                    <path d="M1 5l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("font-semibold text-slate-900", d.submitted && "line-through")}>
                    {d.schoolName}
                  </span>
                  <span className={cn("badge text-xs", TYPE_COLORS[d.type])}>
                    {d.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm text-slate-500">{dateFormatted}</span>
                  <span className={cn("text-sm", countCls)}>{countText}</span>
                </div>
                {d.notes && (
                  <p className="text-xs text-slate-500 mt-1">{d.notes}</p>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => remove(d.id)}
                className="text-slate-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                title="Delete"
              >
                <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
