"use client";

import { useState } from "react";
import { TripQueue } from "@/components/dashboard/trip-queue";

export default function HistoryPage() {
  const [boatFilter, setBoatFilter] = useState<string>("");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Post History
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            All trip batches and their publishing status
          </p>
        </div>

        <select
          value={boatFilter}
          onChange={(e) => setBoatFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
        >
          <option value="">All Boats</option>
          <option value="Celtic Quest IV">Celtic Quest IV</option>
          <option value="Celtic Grace">Celtic Grace</option>
        </select>
      </div>

      <TripQueue filter="all" />
    </div>
  );
}
