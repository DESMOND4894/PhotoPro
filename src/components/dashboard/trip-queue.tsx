"use client";

import { useEffect, useState, useCallback } from "react";
import type { Trip } from "@/lib/types";
import { TripCard } from "./trip-card";

interface TripQueueProps {
  filter?: "today" | "all";
  statusFilter?: string;
}

export function TripQueue({ filter = "today", statusFilter }: TripQueueProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    const params = new URLSearchParams();

    if (filter === "today") {
      params.set("date", new Date().toISOString().split("T")[0]);
    }

    if (statusFilter) {
      params.set("status", statusFilter);
    }

    params.set("limit", "50");

    const res = await fetch(`/api/trips?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTrips(data.trips);
    }
    setLoading(false);
  }, [filter, statusFilter]);

  useEffect(() => {
    fetchTrips();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchTrips, 30000);
    return () => clearInterval(interval);
  }, [fetchTrips]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[var(--muted-foreground)]">
          Loading trips…
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] py-16">
        <p className="text-lg font-medium text-[var(--muted-foreground)]">
          No trips yet today
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Photos will appear here when crew sends them via WhatsApp
        </p>
      </div>
    );
  }

  // Separate pending/actionable from others
  const pendingTrips = trips.filter(
    (t) => t.status === "pending" || t.status === "receiving"
  );
  const otherTrips = trips.filter(
    (t) => t.status !== "pending" && t.status !== "receiving"
  );

  return (
    <div className="space-y-6">
      {pendingTrips.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Needs Approval ({pendingTrips.length})
          </h2>
          <div className="space-y-4">
            {pendingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onUpdate={fetchTrips} />
            ))}
          </div>
        </div>
      )}

      {otherTrips.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {filter === "today" ? "Today" : "All Trips"} ({otherTrips.length})
          </h2>
          <div className="space-y-4">
            {otherTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onUpdate={fetchTrips} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
