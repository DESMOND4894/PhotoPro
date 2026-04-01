"use client";

import Image from "next/image";
import { useState } from "react";

interface PhotoItem {
  id?: string;
  url: string;
}

interface PhotoGridProps {
  photos: string[] | PhotoItem[];
  maxDisplay?: number;
  tripId?: string;
  onPhotoDeleted?: () => void;
}

function normalizePhotos(photos: string[] | PhotoItem[]): PhotoItem[] {
  if (photos.length === 0) return [];
  if (typeof photos[0] === "string") {
    return (photos as string[]).map((url) => ({ url }));
  }
  return photos as PhotoItem[];
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
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {displayPhotos.map((photo, i) => (
          <div
            key={photo.id || i}
            className="group relative h-24 overflow-hidden rounded-lg bg-slate-100"
          >
            <Image
              src={photo.url}
              alt={`Trip photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 16vw"
            />
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
