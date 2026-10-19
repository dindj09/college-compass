"use client";

import { useState } from "react";
import type { TourEntry, TourStatus } from "@college-compass/core";
import { cn } from "@/lib/utils";
import { updateTourAction, removeTourAction } from "./actions";

const STATUS_CONFIG: Record<TourStatus, { label: string; color: string; next: TourStatus | null }> = {
  wishlist:  { label: "Wishlist",   color: "bg-slate-100 text-slate-600 border-slate-200",   next: "scheduled" },
  scheduled: { label: "Scheduled",  color: "bg-blue-100 text-blue-700 border-blue-200",      next: "completed" },
  completed: { label: "Completed",  color: "bg-green-100 text-green-700 border-green-200",   next: null },
  cancelled: { label: "Cancelled",  color: "bg-red-100 text-red-500 border-red-200",         next: null },
};

const STATUS_ORDER: TourStatus[] = ["wishlist", "scheduled", "completed", "cancelled"];

export function ToursClient({ initialTours }: { initialTours: TourEntry[] }) {
  const [tours, setTours]   = useState<TourEntry[]>(initialTours);
  const [filter, setFilter] = useState<TourStatus | "all">("all");

  const filtered = filter === "all" ? tours : tours.filter(t => t.status === filter);
  const counts   = Object.fromEntries(
    STATUS_ORDER.map(s => [s, tours.filter(t => t.status === s).length])
  ) as Record<TourStatus, number>;

  async function handleUpdate(collegeId: string, updates: Partial<Pick<TourEntry, "status" | "scheduledDate" | "notes">>) {
    await updateTourAction(collegeId, updates);
    setTours(prev => prev.map(t => t.collegeId === collegeId ? { ...t, ...updates } : t));
  }

  async function handleRemove(collegeId: string) {
    await removeTourAction(collegeId);
    setTours(prev => prev.filter(t => t.collegeId !== collegeId));
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
          All ({tours.length})
        </FilterBtn>
        {STATUS_ORDER.map(s => (
          <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
            <span className={cn("badge mr-1.5", STATUS_CONFIG[s].color)}>{STATUS_CONFIG[s].label}</span>
            ({counts[s]})
          </FilterBtn>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-slate-400 text-sm">
          No {filter === "all" ? "" : STATUS_CONFIG[filter as TourStatus].label.toLowerCase() + " "}tours.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(tour => (
          <TourCard
            key={tour.collegeId}
            tour={tour}
            onUpdate={(updates) => handleUpdate(tour.collegeId, updates)}
            onRemove={() => handleRemove(tour.collegeId)}
          />
        ))}
      </div>
    </div>
  );
}

function TourCard({
  tour,
  onUpdate,
  onRemove,
}: {
  tour: TourEntry;
  onUpdate: (updates: Partial<Pick<TourEntry, "status" | "scheduledDate" | "notes">>) => void;
  onRemove: () => void;
}) {
  const [editingDate, setEditingDate]   = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [dateVal, setDateVal]           = useState(tour.scheduledDate ?? "");
  const [notesVal, setNotesVal]         = useState(tour.notes ?? "");
  const [saving, setSaving]             = useState(false);
  const [removing, setRemoving]         = useState(false);

  const cfg = STATUS_CONFIG[tour.status];
  const visitUrl = `https://${tour.collegeWebsite}/visit`;

  async function saveDate() {
    setSaving(true);
    await onUpdate({ scheduledDate: dateVal || undefined });
    setEditingDate(false);
    setSaving(false);
  }

  async function saveNotes() {
    setSaving(true);
    await onUpdate({ notes: notesVal || undefined });
    setEditingNotes(false);
    setSaving(false);
  }

  async function advanceStatus() {
    if (!cfg.next) return;
    await onUpdate({ status: cfg.next });
  }

  async function handleRemove() {
    setRemoving(true);
    await onRemove();
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-lg">{tour.collegeName}</h3>
            <span className={cn("badge", cfg.color)}>{cfg.label}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{tour.collegeState}</p>
        </div>

        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none mt-1"
          title="Remove from tour list"
        >
          &times;
        </button>
      </div>

      {/* Date */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500 w-24 shrink-0">Visit date</span>
        {editingDate ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input py-1 text-sm"
              value={dateVal}
              onChange={e => setDateVal(e.target.value)}
            />
            <button onClick={saveDate} disabled={saving} className="btn-primary py-1 px-3 text-xs">
              {saving ? "..." : "Save"}
            </button>
            <button onClick={() => setEditingDate(false)} className="btn-ghost py-1 px-2 text-xs">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingDate(true)}
            className="text-brand-600 hover:underline"
          >
            {tour.scheduledDate
              ? new Date(tour.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : "Add date"}
          </button>
        )}
      </div>

      {/* Notes */}
      <div className="flex items-start gap-3 text-sm">
        <span className="text-slate-500 w-24 shrink-0 mt-0.5">Notes</span>
        {editingNotes ? (
          <div className="flex-1 space-y-2">
            <textarea
              className="input resize-none text-sm"
              rows={2}
              value={notesVal}
              onChange={e => setNotesVal(e.target.value)}
              placeholder="e.g. need to book hotel, contact admissions..."
            />
            <div className="flex gap-2">
              <button onClick={saveNotes} disabled={saving} className="btn-primary py-1 px-3 text-xs">
                {saving ? "..." : "Save"}
              </button>
              <button onClick={() => setEditingNotes(false)} className="btn-ghost py-1 px-2 text-xs">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className={cn("text-left hover:underline", tour.notes ? "text-slate-700" : "text-brand-600")}
          >
            {tour.notes ?? "Add notes"}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <a
          href={visitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs py-1.5 px-3"
        >
          Visit Page &rarr;
        </a>

        {cfg.next && (
          <button onClick={advanceStatus} className="btn-primary text-xs py-1.5 px-3">
            Mark as {STATUS_CONFIG[cfg.next].label}
          </button>
        )}

        {tour.status !== "cancelled" && !cfg.next && tour.status !== "cancelled" && (
          <button
            onClick={() => onUpdate({ status: "cancelled" })}
            className="btn-ghost text-xs py-1.5 px-3 text-red-500 hover:bg-red-50"
          >
            Cancel tour
          </button>
        )}
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors flex items-center",
        active ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}
