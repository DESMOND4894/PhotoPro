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

  // Portal publish panel state
  const [portalOpen, setPortalOpen] = useState(false);
  const [portalEnabled, setPortalEnabled] = useState(trip.public_enabled ?? false);
  const [portalSlug, setPortalSlug] = useState(trip.public_slug ?? "");
  const [portalTitle, setPortalTitle] = useState(trip.public_title ?? "");
  const [portalReviewUrl, setPortalReviewUrl] = useState(trip.public_review_url ?? "");
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalSaved, setPortalSaved] = useState(false);

  async function handlePortalSave() {
    setPortalSaving(true);
    setPortalSaved(false);
    const payload: Record<string, unknown> = {
      public_enabled: portalEnabled,
      public_slug: portalSlug || null,
      public_title: portalTitle || null,
      public_review_url: portalReviewUrl || null,
    };
    if (portalEnabled && !payload.public_published_at) {
      payload.public_published_at = new Date().toISOString();
    }
    await fetch(`/api/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPortalSaving(false);
    setPortalSaved(true);
    setTimeout(() => setPortalSaved(false), 2500);
    onUpdate();
  }

  const isPending = trip.status === "pending";
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

  async function handleDelete() {
    if (!confirm("Delete this trip and all its photos?")) return;
    await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
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
        <div className="flex items-center gap-2">
          <StatusBadge status={trip.status} />
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete trip"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
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

      {/* Portal Publish Panel */}
      <div className="border-t border-slate-100">
        <button
          type="button"
          onClick={() => setPortalOpen((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>Customer Portal</span>
            {portalEnabled && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Published
              </span>
            )}
          </span>
          <span className="text-slate-400">{portalOpen ? "▲" : "▼"}</span>
        </button>

        {portalOpen && (
          <div className="px-6 pb-5 space-y-4 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                role="switch"
                aria-checked={portalEnabled}
                onClick={() => setPortalEnabled((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  portalEnabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    portalEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-slate-700">
                {portalEnabled ? "Publicly visible" : "Private (default)"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Slug (URL path)
              </label>
              <input
                type="text"
                value={portalSlug}
                onChange={(e) => setPortalSlug(e.target.value)}
                placeholder={trip.public_slug ?? "auto-generated"}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
              />
              {portalSlug && (
                <a
                  href={`/photos/trips/${portalSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-teal-600 underline"
                >
                  Preview →
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Public Title
              </label>
              <input
                type="text"
                value={portalTitle}
                onChange={(e) => setPortalTitle(e.target.value)}
                placeholder="Leave blank to use default"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Review URL
              </label>
              <input
                type="url"
                value={portalReviewUrl}
                onChange={(e) => setPortalReviewUrl(e.target.value)}
                placeholder="Leave blank to use default"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handlePortalSave}
                disabled={portalSaving}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 transition-colors"
              >
                {portalSaving ? "Saving…" : "Save Portal Settings"}
              </button>
              {portalSaved && (
                <span className="text-xs font-medium text-emerald-600">Saved</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
