"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicTripCard } from "@/lib/public-portal";
import { formatTripDate } from "@/lib/public-portal";

type FilterValue = "all" | "Celtic Quest IV" | "Celtic Grace" | "morning" | "afternoon";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All Trips", value: "all" },
  { label: "Celtic Quest IV", value: "Celtic Quest IV" },
  { label: "Celtic Grace", value: "Celtic Grace" },
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
];

export function PhotosSearch({ trips }: { trips: PublicTripCard[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = trips.filter((trip) => {
    // Text search
    if (query) {
      const q = query.toLowerCase();
      const searchable = `${trip.publicTitle} ${trip.boatLabel} ${formatTripDate(trip.tripDate)} ${trip.timeLabel}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    // Filter pills
    if (filter === "Celtic Quest IV" && trip.boatLabel !== "Celtic Quest IV") return false;
    if (filter === "Celtic Grace" && trip.boatLabel !== "Celtic Grace") return false;
    if (filter === "morning" && trip.timeLabel !== "Morning Trip") return false;
    if (filter === "afternoon" && trip.timeLabel !== "Afternoon Trip") return false;
    return true;
  });

  return (
    <>
      {/* ─── Search bar ─── */}
      <div className="relative z-20 mx-auto -mt-7 max-w-6xl px-5 lg:px-8">
        <div className="flex items-center gap-3 rounded-2xl border border-black/4 bg-white px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <svg className="h-5 w-5 flex-shrink-0 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="9" cy="9" r="6" />
            <line x1="14" y1="14" x2="18" y2="18" />
          </svg>
          <input
            type="text"
            placeholder="Search by date, boat name, or trip..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent font-sans text-[0.95rem] text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-sans text-[0.8rem] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="4" y1="8" x2="12" y2="8" />
              <line x1="6" y1="12" x2="10" y2="12" />
            </svg>
            Filters
          </button>
        </div>
      </div>

      {/* ─── Filter pills ─── */}
      {showFilters && (
        <div className="mx-auto mt-3 flex max-w-6xl flex-wrap gap-2 px-5 lg:px-8">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 font-sans text-[0.78rem] font-semibold transition-all ${
                filter === value
                  ? "bg-[#0b1d2e] text-white"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Trip cards grid ─── */}
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Recent Charters
          </h2>
          {filtered.length > 0 && (
            <p className="font-sans text-sm text-slate-500">
              {filtered.length} {filtered.length === 1 ? "trip" : "trips"}
            </p>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <svg className="mx-auto h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2" />
              <line x1="12" y1="7" x2="12" y2="22" />
              <path d="M5 15c0 3.866 3.134 7 7 7s7-3.134 7-7" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <h3 className="font-heading mx-auto mt-5 max-w-xs text-xl font-bold text-slate-800">
              {query || filter !== "all" ? "No matching trips" : "No trips published yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm font-sans text-sm leading-6 text-slate-500">
              {query || filter !== "all"
                ? "Try a different search or filter."
                : "Your photos will appear here once the captain publishes them after your charter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((trip) => (
              <Link
                key={trip.slug}
                href={`/photos/trips/${trip.slug}`}
                className="group overflow-hidden rounded-[1.25rem] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
              >
                {/* Cover image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#d6d3cd]">
                  {trip.coverPhotoUrl ? (
                    <Image
                      src={trip.coverPhotoUrl}
                      alt={trip.publicTitle}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0b1d2e] via-[#0f766e] to-[#d97706]" />
                  )}
                  {/* Boat badge */}
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 font-sans text-[0.7rem] font-bold text-white backdrop-blur-sm">
                    {trip.boatLabel}
                  </span>
                  {/* Time badge */}
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 font-sans text-[0.7rem] font-bold text-slate-900">
                    {trip.timeLabel.replace(" Trip", "")}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-5 pb-1 pt-4">
                  <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.15em] text-amber-600">
                    {formatTripDate(trip.tripDate)}
                  </p>
                  <p className="mt-1.5 font-sans text-[1rem] font-bold leading-snug text-slate-900">
                    {trip.timeLabel} — {trip.boatLabel}
                  </p>
                </div>

                {/* Card footer */}
                <div className="mt-3 border-t border-slate-100 px-5 py-3">
                  <span className="flex items-center gap-1 font-sans text-sm font-bold text-teal-700 transition-[gap] duration-200 group-hover:gap-2">
                    View photos
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="4" y1="8" x2="12" y2="8" />
                      <polyline points="9,5 12,8 9,11" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
