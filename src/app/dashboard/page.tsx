"use client";

import { TripQueue } from "@/components/dashboard/trip-queue";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Today&apos;s Queue
        </h2>
        <p className="text-slate-500 mt-1">{today}</p>
      </div>

      <TripQueue filter="today" />
    </div>
  );
}
