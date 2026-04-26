"use client";

import Image from "next/image";
import { useState } from "react";

interface PhotoItem {
  id?: string;
  url: string;
  mediaType?: "image" | "video";
}

interface PhotoGridProps {
  photos: string[] | PhotoItem[];
  maxDisplay?: number;
  tripId?: string;
  onPhotoDeleted?: () => void;
}

function inferMediaType(url: string): "image" | "video" {
  // Storage convention: video URLs contain "/videos/" in the path.
  return url.includes("/videos/") ? "video" : "image";
}

function normalizePhotos(photos: string[] | PhotoItem[]): PhotoItem[] {
  if (photos.length === 0) return [];
  if (typeof photos[0] === "string") {
    return (photos as string[]).map((url) => ({ url, mediaType: inferMediaType(url) }));
  }
  return (photos as PhotoItem[]).map((p) => ({ ...p, mediaType: p.mediaType ?? inferMediaType(p.url) }));
}

export function PhotoGrid({ photos, maxDisplay = 12, tripId, onPhotoDeleted }: PhotoGridProps) {
  const [showAll, setShowAll] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const items = normalizePhotos(photos);
  const displayPhotos = showAll ? items : items.slice(0, maxDisplay);
  const remaining = items.length - maxDisplay;

  async function handleDelete(photo: PhotoItem) {
    if (!photo.id || !tripId) return;
    if (!confirm("Delete this photo permanently?")) return;
    setDeleting(photo.id);
    await fetch(`/api/trips/${tripId}/photos/${photo.id}`, { method: "DELETE" });
    setDeleting(null);
    onPhotoDeleted?.();
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {displayPhotos.map((photo, i) => (
          <div
            key={photo.id || i}
            className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-100"
          >
            {photo.mediaType === "video" ? (
              <>
                <video
                  src={photo.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full bg-black object-cover"
                />
                <span className="pointer-events-none absolute left-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zm9 1.5 3-1.5v8l-3-1.5v-5z" />
                  </svg>
                  Video
                </span>
              </>
            ) : (
              <Image
                src={photo.url}
                alt={`Trip photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
              />
            )}
            {photo.id && tripId && (
              <button
                type="button"
                onClick={() => handleDelete(photo)}
                disabled={deleting === photo.id}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
                title="Delete photo"
              >
                {deleting === photo.id ? (
                  <span className="text-[10px]">...</span>
                ) : (
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-sm font-medium text-blue-600 hover:underline"
        >
          +{remaining} more photos
        </button>
      )}

      {showAll && items.length > maxDisplay && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-2 text-sm font-medium text-blue-600 hover:underline"
        >
          Show less
        </button>
      )}
    </div>
  );
}
