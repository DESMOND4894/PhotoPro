"use client";

import { useState } from "react";
import type { Trip, SocialPlatform } from "@/lib/types";
import { formatTripLabel } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { PlatformToggles } from "./platform-toggles";
import { PhotoGrid } from "./photo-grid";
import { CaptionEditor } from "./caption-editor";

interface TripCardProps {
  trip: Trip;
  onUpdate: () => void;
}

export function TripCard({ trip, onUpdate }: TripCardProps) {
  const [approving, setApproving] = useState(false);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(
    trip.platforms_enabled
  );
  const [caption, setCaption] = useState(trip.caption || "");

  const isPending = trip.status === "pending" || trip.status === "skipped";
  const isActionable = isPending;

  async function handleApprove() {
    setApproving(true);
    const res = await fetch(`/api/trips/${trip.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms }),
    });

    if (res.ok) {
      onUpdate();
    }
    setApproving(false);
  }

  async function handleSkip() {
    await fetch(`/api/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "skipped" }),
    });
    onUpdate();
  }

  async function handlePlatformChange(newPlatforms: SocialPlatform[]) {
    setPlatforms(newPlatforms);
    await fetch(`/api/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms_enabled: newPlatforms }),
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
            {formatTripLabel(trip.boat, trip.trip_time, trip.date)}
          </h3>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            {trip.photo_count} photos
            {trip.crew_notes && (
              <span className="ml-2">
                &middot; Crew: &ldquo;{trip.crew_notes}&rdquo;
              </span>
            )}
          </p>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      {/* Photo Preview */}
      {trip.photo_urls.length > 0 && (
        <div className="mb-4">
          <PhotoGrid photos={trip.photo_urls} />
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Caption
          </label>
          {isActionable ? (
            <CaptionEditor
              tripId={trip.id}
              caption={caption}
              onUpdate={setCaption}
            />
          ) : (
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              &ldquo;{caption}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Platform Toggles */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Post to
        </label>
        <PlatformToggles
          enabled={platforms}
          onChange={handlePlatformChange}
          disabled={!isActionable}
        />
      </div>

      {/* Posted to indicators */}
      {trip.posted_to.length > 0 && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Published
          </label>
          <div className="flex gap-2">
            {trip.posted_to.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isActionable && (
        <div className="flex gap-3 border-t border-[var(--border)] pt-4">
          <button
            onClick={handleApprove}
            disabled={approving || platforms.length === 0}
            className="flex-1 rounded-xl bg-[var(--success)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:text-base"
          >
            {approving ? "Approving…" : `Approve & Post (${platforms.length} platforms)`}
          </button>
          <button
            onClick={handleSkip}
            className="rounded-xl bg-[var(--secondary)] px-4 py-3 text-sm font-medium text-[var(--secondary-foreground)] hover:opacity-90"
          >
            Skip
          </button>
        </div>
      )}

      {/* Weather */}
      {trip.weather_summary && (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Weather: {trip.weather_summary}
        </p>
      )}
    </div>
  );
}
