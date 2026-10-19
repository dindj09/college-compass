import { DeadlinesClient } from "./deadlines-client";

export default function DeadlinesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Deadline Tracker</h1>
        <p className="text-slate-500 mt-1">
          Track all your application and scholarship deadlines in one place.
        </p>
      </div>
      <DeadlinesClient />
    </div>
  );
}
