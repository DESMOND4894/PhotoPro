"use client";

import Image from "next/image";
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

function IconCamera() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
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

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied`);
    } catch {
      setMessage(`Could not copy ${label.toLowerCase()}`);
    }
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

  const hasFeatured = trip.featuredPhotos.length > 0;

  return (
    <div className="pb-16">
      {/* ─── Trip Header ─── */}
      <section className="bg-[linear-gradient(150deg,#0b1d2e_0%,#0e3347_50%,#0d4a52_100%)] px-4 pb-10 pt-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.4em] text-amber-400">
            Celtic Quest Photo Portal
          </p>
          <h1 className="font-heading mt-4 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            {trip.publicTitle}
          </h1>
          <p className="mt-3 max-w-xl font-sans text-sm leading-6 text-white/65 sm:text-base">
            {trip.publicSubtitle}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 font-sans text-xs font-medium text-white/80">
              {formatTripDate(trip.tripDate)}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 font-sans text-xs font-medium text-white/80">
              {trip.timeLabel}
            </span>
            <span className="rounded-full border border-teal-400/30 bg-teal-400/15 px-3.5 py-1.5 font-sans text-xs font-medium text-teal-300">
              {trip.photoCount} {trip.photoCount === 1 ? "photo" : "photos"}
            </span>
            {trip.speciesTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-amber-400/25 bg-amber-400/15 px-3.5 py-1.5 font-sans text-xs font-medium text-amber-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ─── Featured photo mosaic ─── */}
        {hasFeatured && (
          <section className="-mt-4 sm:-mt-6">
            {trip.featuredPhotos.length >= 3 ? (
              /* Editorial mosaic: 1 big + 2 stacked */
              <div
                className="grid gap-2 overflow-hidden rounded-2xl sm:rounded-3xl"
                style={{ gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr", height: "clamp(240px, 45vw, 480px)" }}
              >
                <button
                  type="button"
                  onClick={() => updatePhotoParam(trip.featuredPhotos[0].id)}
                  className="group relative row-span-2 overflow-hidden"
                >
                  <Image
                    src={trip.featuredPhotos[0].thumbnailUrl}
                    alt={`${trip.publicTitle} – featured`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-103"
                    sizes="(max-width: 640px) 65vw, 40vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
                </button>
                {trip.featuredPhotos.slice(1, 3).map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => updatePhotoParam(photo.id)}
                    className="group relative overflow-hidden"
                  >
                    <Image
                      src={photo.thumbnailUrl}
                      alt={`${trip.publicTitle} – featured`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-103"
                      sizes="(max-width: 640px) 35vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
                  </button>
                ))}
              </div>
            ) : trip.featuredPhotos.length === 2 ? (
              <div
                className="grid gap-2 overflow-hidden rounded-2xl sm:rounded-3xl"
                style={{ gridTemplateColumns: "1fr 1fr", height: "clamp(180px, 35vw, 360px)" }}
              >
                {trip.featuredPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => updatePhotoParam(photo.id)}
                    className="group relative overflow-hidden"
                  >
                    <Image
                      src={photo.thumbnailUrl}
                      alt={`${trip.publicTitle} – featured`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-103"
                      sizes="50vw"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
                style={{ height: "clamp(180px, 35vw, 360px)" }}
              >
                <button
                  type="button"
                  onClick={() => updatePhotoParam(trip.featuredPhotos[0].id)}
                  className="group absolute inset-0"
                >
                  <Image
                    src={trip.featuredPhotos[0].thumbnailUrl}
                    alt={`${trip.publicTitle} – featured`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-103"
                    sizes="100vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* ─── Action cards ─── */}
        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {trip.reviewConfigured ? (
            <a
              href={trip.reviewUrl!}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col gap-3 rounded-2xl bg-slate-900 px-5 py-5 text-white transition-opacity hover:opacity-90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-400">
                <IconStar />
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-white">Leave a review</p>
                <p className="mt-0.5 font-sans text-xs leading-5 text-white/55">
                  Tell Celtic Quest how the trip went.
                </p>
              </div>
            </a>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                <IconStar />
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-slate-500">Review link</p>
                <p className="mt-0.5 font-sans text-xs leading-5 text-slate-400">Not configured yet.</p>
              </div>
            </div>
          )}

          {trip.tagUsText && trip.tagUsUrl ? (
            <a
              href={trip.tagUsUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col gap-3 rounded-2xl bg-amber-400 px-5 py-5 transition-opacity hover:opacity-90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/15 text-amber-950">
                <IconCamera />
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-amber-950">{trip.tagUsText}</p>
                <p className="mt-0.5 font-sans text-xs leading-5 text-amber-950/60">
                  Tag Celtic Quest when you share your catch.
                </p>
              </div>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => shareTrip(tripShareUrl, trip.publicTitle)}
              className="group flex flex-col gap-3 rounded-2xl bg-amber-400 px-5 py-5 text-left transition-opacity hover:opacity-90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/15 text-amber-950">
                <IconShare />
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-amber-950">Share this gallery</p>
                <p className="mt-0.5 font-sans text-xs leading-5 text-amber-950/60">
                  Send your friends the link to this trip.
                </p>
              </div>
            </button>
          )}

          {trip.bookAgainUrl ? (
            <a
              href={trip.bookAgainUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col gap-3 rounded-2xl bg-teal-800 px-5 py-5 text-white transition-opacity hover:opacity-90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-teal-300">
                <IconAnchor />
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-white">Book your next trip</p>
                <p className="mt-0.5 font-sans text-xs leading-5 text-white/55">
                  Head back out on the water.
                </p>
              </div>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => shareTrip(tripShareUrl, trip.publicTitle)}
              className="group flex flex-col gap-3 rounded-2xl bg-teal-800 px-5 py-5 text-left text-white transition-opacity hover:opacity-90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-teal-300">
                <IconShare />
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-white">Share this gallery</p>
                <p className="mt-0.5 font-sans text-xs leading-5 text-white/55">
                  Send friends the link to your trip.
                </p>
              </div>
            </button>
          )}
        </section>

        {/* ─── Crew note ─── */}
        {trip.crewNote && (
          <section className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
              Crew Note
            </p>
            <p className="mt-2 font-sans text-sm leading-6 text-teal-950">{trip.crewNote}</p>
          </section>
        )}

        {/* ─── Social copy tools ─── */}
        {(trip.copyCaption || trip.copyHashtags) && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Share your catch
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {trip.copyCaption && (
                <button
                  type="button"
                  onClick={() => copyText(trip.copyCaption!, "Caption")}
                  className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 font-sans text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Copy caption
                </button>
              )}
              {trip.copyHashtags && (
                <button
                  type="button"
                  onClick={() => copyText(trip.copyHashtags!, "Hashtags")}
                  className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 font-sans text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Copy hashtags
                </button>
              )}
              <button
                type="button"
                onClick={() => shareTrip(tripShareUrl, trip.publicTitle)}
                className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 font-sans text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Share trip link
              </button>
            </div>
          </section>
        )}

        {/* ─── Full gallery ─── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900">Trip Gallery</h2>
              <p className="mt-0.5 font-sans text-sm text-slate-500">
                Tap any photo to view full-size and download.
              </p>
            </div>
          </div>

          {trip.photos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <p className="font-sans text-sm text-slate-500">No photos available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {trip.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => updatePhotoParam(photo.id)}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200 sm:rounded-2xl"
                >
                  <Image
                    src={photo.thumbnailUrl}
                    alt={`${trip.publicTitle} photo ${index + 1}`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/35">
                    <span className="font-sans text-sm font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      View
                    </span>
                  </div>
                  {/* Photo number */}
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-white/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {index + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── Toast ─── */}
      {message && (
        <div className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-full bg-slate-900 px-5 py-3 text-center font-sans text-sm font-medium text-white shadow-2xl sm:left-auto sm:right-6 sm:inset-x-auto">
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
              {/* Prev / Next */}
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

              {/* Share + Download */}
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
