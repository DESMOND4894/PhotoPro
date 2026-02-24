"use client";

import { useState } from "react";
import { TripQueue } from "@/components/dashboard/trip-queue";

export default function HistoryPage() {
  const [boatFilter, setBoatFilter] = useState<string>("");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Post History</h2>
          <p className="mt-1 text-slate-500">
            All trip batches and their publishing status
          </p>
        </div>

        <select
          value={boatFilter}
          onChange={(e) => setBoatFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none shadow-sm"
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
