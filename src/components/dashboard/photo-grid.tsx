"use client";

import Image from "next/image";
import { useState } from "react";

interface PhotoGridProps {
  photos: string[];
  maxDisplay?: number;
}

export function PhotoGrid({ photos, maxDisplay = 12 }: PhotoGridProps) {
  const [showAll, setShowAll] = useState(false);
  const displayPhotos = showAll ? photos : photos.slice(0, maxDisplay);
  const remaining = photos.length - maxDisplay;

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {displayPhotos.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square overflow-hidden rounded-lg bg-[var(--secondary)]"
          >
            <Image
              src={url}
              alt={`Trip photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 25vw"
            />
          </div>
        ))}
      </div>

      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          +{remaining} more photos
        </button>
      )}

      {showAll && photos.length > maxDisplay && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-2 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Show less
        </button>
      )}
    </div>
  );
}
