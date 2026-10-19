import Link from "next/link";
import { getTours } from "@/lib/tour-store";
import { ToursClient } from "./tours-client";

export default async function ToursPage() {
  const tours = getTours();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Campus Tours</h1>
          <p className="text-slate-500 mt-1">
            Track the schools you want to visit. Add them from the{" "}
            <Link href="/schools" className="text-brand-600 hover:underline">Schools</Link> page.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {tours.length} {tours.length === 1 ? "school" : "schools"} tracked
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="card p-16 text-center space-y-4">
          <div className="text-5xl">🗺️</div>
          <h2 className="text-xl font-semibold text-slate-700">No tours tracked yet</h2>
          <p className="text-slate-500 text-sm">
            Go to your school recommendations and click &quot;Track Tour&quot; on any school.
          </p>
          <Link href="/schools" className="btn-primary inline-block">
            View School Recommendations
          </Link>
        </div>
      ) : (
        <ToursClient initialTours={tours} />
      )}
    </div>
  );
}
