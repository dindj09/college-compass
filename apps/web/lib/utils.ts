import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

export function scoreColor(score: number): string {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-yellow-600";
  return "text-red-500";
}

export function tierColor(tier: "reach" | "target" | "safety"): string {
  switch (tier) {
    case "reach": return "bg-red-100 text-red-700 border-red-200";
    case "target": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "safety": return "bg-green-100 text-green-700 border-green-200";
  }
}

export function tierLabel(tier: "reach" | "target" | "safety"): string {
  switch (tier) {
    case "reach": return "Reach";
    case "target": return "Target";
    case "safety": return "Safety";
  }
}
