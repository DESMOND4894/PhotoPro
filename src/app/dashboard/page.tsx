"use client";

import { TripQueue } from "@/components/dashboard/trip-queue";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Today&apos;s Queue
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Review and approve trip photos for publishing
        </p>
      </div>

      <TripQueue filter="today" />
    </div>
  );
}
