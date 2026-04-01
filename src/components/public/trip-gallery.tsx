"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PublicTripDetail } from "@/lib/public-portal";
import { formatTripDate } from "@/lib/public-portal";

interface TripGalleryProps {
  trip: PublicTripDetail;
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function IconStar() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function IconAnchor() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="4.5" r="1.5" />
      <line x1="10" y1="6" x2="10" y2="18" />
      <path d="M5 11c0 3.314 2.239 5 5 5s5-1.686 5-5" />
      <line x1="4" y1="9" x2="16" y2="9" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="2" x2="8" y2="11" />
      <polyline points="5,8 8,11 11,8" />
      <path d="M3 13h10" />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function TripGallery({ trip }: TripGalleryProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPhotoId = searchParams.get("photo");
  const selectedIndex = trip.photos.findIndex((photo) => photo.id === selectedPhotoId);
  const selectedPhoto = selectedIndex >= 0 ? trip.photos[selectedIndex] : null;
  const [message, setMessage] = useState<string | null>(null);

  function updatePhotoParam(photoId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (photoId) {
      params.set("photo", photoId);
    } else {
      params.delete("photo");
    }
    startTransition(() => {
      router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
        scroll: false,
      });
    });
  }

  async function shareTrip(url: string, title: string) {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setMessage("Share sheet opened");
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch {
      setMessage("Sharing cancelled");
    }
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!selectedPhoto) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") updatePhotoParam(null);
      if (event.key === "ArrowRight" && selectedIndex < trip.photos.length - 1)
        updatePhotoParam(trip.photos[selectedIndex + 1].id);
      if (event.key === "ArrowLeft" && selectedIndex > 0)
        updatePhotoParam(trip.photos[selectedIndex - 1].id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, selectedPhoto, trip.photos, searchParams]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const tripShareUrl = baseUrl ? `${baseUrl}${pathname}` : pathname;
  const photoShareUrl = selectedPhoto ? `${tripShareUrl}?photo=${selectedPhoto.id}` : tripShareUrl;

  return (
    <div className="pb-16">
      {/* ─── Trip Header ─── */}
      <section className="relative overflow-hidden px-5 pb-10 pt-6 lg:px-8" style={{ minHeight: "clamp(240px, 35vw, 360px)" }}>
        <div className="absolute inset-0">
          <Image
            src="/images/fleet-hero.jpg"
            alt="Celtic Quest Fleet"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,29,46,0.6)] to-[rgba(11,29,46,0.9)]" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl">
          <Link
            href="/photos"
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-4 py-2 font-sans text-[0.8rem] font-semibold text-white/70 transition-all hover:bg-white/15 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="10,3 5,8 10,13" />
            </svg>
            All Trips
          </Link>
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-amber-400">
            {trip.boatLabel}
          </p>
          <h1 className="font-heading mt-2 max-w-2xl text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.1] text-white">
            {trip.timeLabel}<br />{formatTripDate(trip.tripDate)}
          </h1>
          <div className="mt-3 flex flex-wrap gap-3">
            <span className="font-sans text-[0.78rem] text-white/55">{trip.boatLabel}</span>
            <span className="font-sans text-[0.78rem] text-white/30">&middot;</span>
            <span className="font-sans text-[0.78rem] text-white/55">Port Jefferson, NY</span>
            <span className="font-sans text-[0.78rem] text-white/30">&middot;</span>
            <span className="font-sans text-[0.78rem] text-white/55">{trip.photoCount} photos</span>
          </div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <div className="mx-auto max-w-6xl px-5 lg:px-8">

        {/* ─── Action cards ─── */}
        <div className="relative z-10 -mt-6 grid gap-3 sm:grid-cols-3">
          {trip.reviewConfigured ? (
            <a
              href={trip.reviewUrl!}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(0,0,0,0.15)]"
            >
              <span className="text-[1.75rem]">&#11088;</span>
              <h3 className="mt-2 font-sans text-[0.9rem] font-bold text-amber-950">Leave a Review</h3>
              <p className="mt-0.5 font-sans text-[0.72rem] leading-relaxed text-amber-950/60">Your words help other anglers find us.</p>
            </a>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <span className="text-[1.75rem] grayscale">&#11088;</span>
              <h3 className="mt-2 font-sans text-[0.9rem] font-bold text-slate-400">Review Link</h3>
              <p className="mt-0.5 font-sans text-[0.72rem] leading-relaxed text-slate-400">Not configured yet.</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => shareTrip(tripShareUrl, trip.publicTitle)}
            className="overflow-hidden rounded-2xl border border-black/6 bg-white p-5 text-left shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(0,0,0,0.15)]"
          >
            <span className="text-[1.75rem]">&#128279;</span>
            <h3 className="mt-2 font-sans text-[0.9rem] font-bold text-slate-900">Share This Gallery</h3>
            <p className="mt-0.5 font-sans text-[0.72rem] leading-relaxed text-slate-500">Send the link to friends and family.</p>
          </button>

          {trip.bookAgainUrl ? (
            <a
              href={trip.bookAgainUrl}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1d2e] to-[#134e5e] p-5 text-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(0,0,0,0.15)]"
            >
              <span className="text-[1.75rem]">&#9875;</span>
              <h3 className="mt-2 font-sans text-[0.9rem] font-bold">Book Your Next Trip</h3>
              <p className="mt-0.5 font-sans text-[0.72rem] leading-relaxed text-white/55">Ready for another adventure?</p>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => shareTrip(tripShareUrl, trip.publicTitle)}
              className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1d2e] to-[#134e5e] p-5 text-left text-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(0,0,0,0.15)]"
            >
              <span className="text-[1.75rem]">&#128279;</span>
              <h3 className="mt-2 font-sans text-[0.9rem] font-bold">Share This Gallery</h3>
              <p className="mt-0.5 font-sans text-[0.72rem] leading-relaxed text-white/55">Send friends the link to your trip.</p>
            </button>
          )}
        </div>

        {/* ─── Download All bar ─── */}
        <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl bg-[#0b1d2e] px-6 py-4 sm:flex-row">
          <div>
            <h3 className="font-sans text-[0.9rem] font-bold text-white">Download All Photos</h3>
            <p className="font-sans text-[0.75rem] text-white/45">Get every photo from this trip in one zip file.</p>
          </div>
          <a
            href={`/api/public/photos/trips/${trip.slug}/download-all`}
            className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-2.5 font-sans text-[0.85rem] font-bold text-[#0b1d2e] transition-colors hover:bg-amber-300"
          >
            <IconDownload />
            Download All
          </a>
        </div>

        {/* ─── Full gallery ─── */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-heading text-2xl font-bold text-slate-900">Trip Photos</h2>
            <p className="mt-0.5 font-sans text-sm text-slate-500">
              Click any photo to view full-size. Hover to download.
            </p>
          </div>

          {trip.photos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <p className="font-sans text-sm text-slate-500">No photos available yet.</p>
            </div>
          ) : (
            <div className="columns-2 gap-2.5 sm:columns-3 lg:columns-4">
              {trip.photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative mb-2.5 cursor-pointer overflow-hidden rounded-[0.875rem] bg-[#d6d3cd] break-inside-avoid"
                  onClick={() => updatePhotoParam(photo.id)}
                >
                  <Image
                    src={photo.thumbnailUrl}
                    alt={`${trip.publicTitle} photo ${index + 1}`}
                    width={400}
                    height={400 + (index % 3) * 80}
                    className="block w-full transition duration-400 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Hover overlay with download */}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-250 group-hover:opacity-100">
                    <a
                      href={`/api/public/photos/${photo.id}/download`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 font-sans text-[0.75rem] font-bold text-slate-900 transition-colors hover:bg-amber-400"
                    >
                      <IconDownload />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Bottom action bar ─── */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href={trip.reviewUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 px-6 py-5 transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] bg-amber-900/10 text-amber-800">
              <IconStar />
            </span>
            <div>
              <p className="font-sans text-[0.95rem] font-bold text-amber-950">Leave a Review</p>
              <p className="font-sans text-[0.78rem] text-amber-950/60">Tell us how your charter went</p>
            </div>
          </a>
          <a
            href={trip.bookAgainUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#0b1d2e] to-[#134e5e] px-6 py-5 text-white transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-teal-300">
              <IconAnchor />
            </span>
            <div>
              <p className="font-sans text-[0.95rem] font-bold">Book Your Next Trip</p>
              <p className="font-sans text-[0.78rem] text-white/55">Head back out on the water</p>
            </div>
          </a>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="mt-10 border-t border-black/8 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <p className="font-sans text-sm font-semibold text-slate-600">Celtic Quest Fishing Fleet</p>
          <p className="font-sans text-xs text-slate-400">Port Jefferson, Long Island, NY</p>
        </div>
      </footer>

      {/* ─── Toast ─── */}
      {message && (
        <div className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-full bg-slate-900 px-5 py-3 text-center font-sans text-sm font-medium text-white shadow-2xl sm:inset-x-auto sm:left-auto sm:right-6">
          {message}
        </div>
      )}

      {/* ─── Lightbox ─── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-sm">
          <div className="flex h-full flex-col">
            {/* Lightbox header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <p className="font-sans text-sm font-semibold text-white/90">{trip.publicTitle}</p>
                <p className="font-sans text-xs text-white/40">
                  {selectedIndex + 1} of {trip.photos.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updatePhotoParam(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>

            {/* Lightbox image */}
            <div className="relative flex-1 overflow-hidden">
              <Image
                src={selectedPhoto.url}
                alt={`${trip.publicTitle} photo ${selectedIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Lightbox controls */}
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-4 sm:px-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectedIndex > 0 && updatePhotoParam(trip.photos[selectedIndex - 1].id)}
                  disabled={selectedIndex === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30"
                  aria-label="Previous photo"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="10,3 6,8 10,13" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => selectedIndex < trip.photos.length - 1 && updatePhotoParam(trip.photos[selectedIndex + 1].id)}
                  disabled={selectedIndex === trip.photos.length - 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30"
                  aria-label="Next photo"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,3 10,8 6,13" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shareTrip(photoShareUrl, `${trip.publicTitle} photo`)}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-white/15 px-4 font-sans text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
                >
                  <IconShare />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <a
                  href={`/api/public/photos/${selectedPhoto.id}/download`}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-amber-400 px-5 font-sans text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
                >
                  <IconDownload />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
