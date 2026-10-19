"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "college-compass-deadlines";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function useDeadlineAlert() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function check() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { setCount(0); return; }
        const deadlines = JSON.parse(raw) as { date: string; submitted: boolean }[];
        const urgent = deadlines.filter(
          (d) => !d.submitted && daysUntil(d.date) >= 0 && daysUntil(d.date) <= 14
        );
        setCount(urgent.length);
      } catch {
        setCount(0);
      }
    }

    check();
    window.addEventListener("storage", check);
    window.addEventListener("deadlines-updated", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("deadlines-updated", check);
    };
  }, []);

  return count;
}
