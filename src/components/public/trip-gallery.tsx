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
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        updatePhotoParam(null);
      }

      if (event.key === "ArrowRight" && selectedIndex < trip.photos.length - 1) {
        updatePhotoParam(trip.photos[selectedIndex + 1].id);
      }

      if (event.key === "ArrowLeft" && selectedIndex > 0) {
        updatePhotoParam(trip.photos[selectedIndex - 1].id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, selectedPhoto, trip.photos, searchParams]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const tripShareUrl = baseUrl ? `${baseUrl}${pathname}` : pathname;
  const photoShareUrl = selectedPhoto ? `${tripShareUrl}?photo=${selectedPhoto.id}` : tripShareUrl;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="bg-[linear-gradient(135deg,#082f49,#164e63_55%,#f59e0b)] px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Celtic Quest Photo Portal
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            {trip.publicTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
            {trip.publicSubtitle}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/80">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              {formatTripDate(trip.tripDate)}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              {trip.timeLabel}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              {trip.photoCount} photos
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {trip.featuredPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {trip.featuredPhotos.slice(0, 3).map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => updatePhotoParam(photo.id)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={photo.thumbnailUrl}
                      alt={`${trip.publicTitle} featured photo`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                    <span className="absolute inset-x-3 bottom-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white">
                      Featured
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trip.reviewConfigured ? (
                <a
                  href={trip.reviewUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-slate-950 px-4 py-4 text-sm font-medium text-white"
                >
                  Leave a review
                  <p className="mt-1 text-sm text-white/65">
                    Tell Celtic Quest how the trip went.
                  </p>
                </a>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  Review link not configured yet.
                </div>
              )}

              {trip.tagUsText && trip.tagUsUrl && (
                <a
                  href={trip.tagUsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-amber-100 px-4 py-4 text-sm font-medium text-amber-950"
                >
                  {trip.tagUsText}
                  <p className="mt-1 text-sm text-amber-900/70">
                    Tag Celtic Quest when you share your catch.
                  </p>
                </a>
              )}

              {trip.bookAgainUrl && (
                <a
                  href={trip.bookAgainUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-teal-900 px-4 py-4 text-sm font-medium text-white"
                >
                  Book again
                  <p className="mt-1 text-sm text-white/65">
                    Head back out when you&apos;re ready for the next trip.
                  </p>
                </a>
              )}
            </div>

            {trip.crewNote && (
              <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-4 text-sm text-teal-950">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
                  Crew Note
                </p>
                <p className="mt-2 leading-6">{trip.crewNote}</p>
              </div>
            )}

            {(trip.speciesTags.length > 0 || trip.copyCaption || trip.copyHashtags) && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                {trip.speciesTags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {trip.speciesTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {trip.copyCaption && (
                    <button
                      type="button"
                      onClick={() => copyText(trip.copyCaption!, "Caption")}
                      className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      Copy caption
                    </button>
                  )}
                  {trip.copyHashtags && (
                    <button
                      type="button"
                      onClick={() => copyText(trip.copyHashtags!, "Hashtags")}
                      className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      Copy hashtags
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => shareTrip(tripShareUrl, trip.publicTitle)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    Share trip
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[1.5rem] bg-slate-950 px-5 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/45">
              Quick Actions
            </p>
            <div className="mt-4 space-y-3">
              <Link
                href="/photos"
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85"
              >
                Browse recent trips
              </Link>
              <button
                type="button"
                onClick={() => shareTrip(tripShareUrl, trip.publicTitle)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/85"
              >
                Share this gallery
              </button>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white/65">
                Tap any photo to open the full-screen viewer and download the image.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Trip gallery</h2>
            <p className="text-sm text-slate-600">Built for quick mobile browsing and easy downloads.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {trip.photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => updatePhotoParam(photo.id)}
              className="group relative aspect-square overflow-hidden rounded-[1.5rem] bg-slate-200"
            >
              <Image
                src={photo.thumbnailUrl}
                alt={`${trip.publicTitle} photo ${index + 1}`}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </button>
          ))}
        </div>
      </section>

      {message && (
        <div className="fixed inset-x-4 bottom-4 z-50 rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-medium text-white shadow-xl sm:left-auto sm:right-6 sm:inset-x-auto">
          {message}
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-40 bg-slate-950/90 px-3 py-4 backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex h-full max-w-6xl flex-col rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white/80">{trip.publicTitle}</p>
                <p className="text-xs text-white/45">
                  Photo {selectedIndex + 1} of {trip.photos.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updatePhotoParam(null)}
                className="rounded-full border border-white/15 px-3 py-2 text-sm text-white/80"
              >
                Close
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <Image
                src={selectedPhoto.url}
                alt={`${trip.publicTitle} selected photo`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            <div className="grid gap-3 border-t border-white/10 px-4 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectedIndex > 0 && updatePhotoParam(trip.photos[selectedIndex - 1].id)}
                  disabled={selectedIndex === 0}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => selectedIndex < trip.photos.length - 1 && updatePhotoParam(trip.photos[selectedIndex + 1].id)}
                  disabled={selectedIndex === trip.photos.length - 1}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>

              <button
                type="button"
                onClick={() => shareTrip(photoShareUrl, `${trip.publicTitle} photo`)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm"
              >
                Share
              </button>

              <a
                href={`/api/public/photos/${selectedPhoto.id}/download`}
                className="rounded-full border border-amber-300/30 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-950"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
