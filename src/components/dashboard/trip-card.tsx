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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {formatTripLabel(trip.boat, trip.trip_time, trip.date)}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
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

      {/* Card Body */}
      <div className="px-6 py-5">
        {/* Photo Preview */}
        {trip.photo_urls.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700 mb-3">
              {trip.photo_count} Photos
            </p>
            <PhotoGrid photos={trip.photo_urls} />
          </div>
        )}

        {/* Caption */}
        {caption && (
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700 mb-2">Caption</p>
            {isActionable ? (
              <CaptionEditor
                tripId={trip.id}
                caption={caption}
                onUpdate={setCaption}
              />
            ) : (
              <div style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }} className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-700 leading-relaxed border border-slate-200">
                {caption}
              </div>
            )}
          </div>
        )}

        {/* Platform Toggles */}
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-700 mb-3">Publish To</p>
          <PlatformToggles
            enabled={platforms}
            onChange={handlePlatformChange}
            disabled={!isActionable}
          />
        </div>

        {/* Posted to indicators */}
        {trip.posted_to.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700 mb-3">Posted To</p>
            <div className="flex items-center gap-2">
              {trip.posted_to.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isActionable && (
          <div
            style={{ marginTop: "20px", paddingTop: "12px" }}
            className="flex flex-col items-start gap-2"
          >
            <button
              onClick={handleApprove}
              disabled={approving || platforms.length === 0}
              className="inline-flex min-w-[260px] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 py-2.5 pl-6 pr-12 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="whitespace-nowrap">
                {approving ? "Approving\u2026" : "Approve & Post"}
              </span>
            </button>
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-2 whitespace-nowrap px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {/* Weather */}
        {trip.weather_summary && (
          <p className="mt-3 text-xs text-slate-400">
            Weather: {trip.weather_summary}
          </p>
        )}
      </div>
    </div>
  );
}
