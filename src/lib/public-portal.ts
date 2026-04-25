import type { Photo, Trip, TripTime } from "@/lib/types";

export interface PublicTripCard {
  slug: string;
  publicTitle: string;
  publicSubtitle: string;
  boatLabel: string;
  tripDate: string;
  timeLabel: string;
  coverPhotoUrl: string | null;
  photoCount: number;
  speciesTags: string[];
  featuredPhotoUrls: string[];
}

export interface PublicTripPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: string;
  mediaType: "image" | "video";
  durationSeconds: number | null;
}

export interface PublicTripDetail extends PublicTripCard {
  tripId: string;
  reviewUrl: string | null;
  reviewConfigured: boolean;
  tagUsText: string | null;
  tagUsUrl: string | null;
  bookAgainUrl: string | null;
  copyCaption: string | null;
  copyHashtags: string | null;
  crewNote: string | null;
  featuredPhotos: PublicTripPhoto[];
  photos: PublicTripPhoto[];
}

export function getTripTimeLabel(tripTime: TripTime): string {
  return tripTime === "morning" ? "Morning Trip" : "Afternoon Trip";
}

export function formatTripDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateTripPublicSlug(
  boat: Pick<Trip, "boat">["boat"],
  date: string,
  tripTime: TripTime
): string {
  const boatSlug = boat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${date}-${boatSlug}-${tripTime}`;
}

export function getPublicTitle(trip: Pick<Trip, "boat" | "date" | "trip_time" | "public_title">): string {
  return trip.public_title || `${trip.boat} ${getTripTimeLabel(trip.trip_time)}`;
}

export function getPublicSubtitle(
  trip: Pick<Trip, "boat" | "date" | "trip_time" | "public_subtitle">
): string {
  return trip.public_subtitle || `${formatTripDate(trip.date)} • ${trip.boat}`;
}

export function getPublicPhotoUrl(photo: Pick<Photo, "watermarked_url" | "public_url">): string {
  return photo.watermarked_url || photo.public_url;
}

export function getPortalDefaults() {
  return {
    reviewUrl: process.env.PHOTO_PORTAL_DEFAULT_REVIEW_URL || null,
    tagUsText: process.env.PHOTO_PORTAL_DEFAULT_TAG_US_TEXT || null,
    tagUsUrl: process.env.PHOTO_PORTAL_DEFAULT_TAG_US_URL || null,
    bookAgainUrl: process.env.PHOTO_PORTAL_DEFAULT_BOOK_AGAIN_URL || null,
  };
}

export function sortTripsNewestFirst<T extends Pick<Trip, "date" | "trip_time">>(trips: T[]): T[] {
  return [...trips].sort((a, b) => {
    const aHour = a.trip_time === "afternoon" ? 15 : 8;
    const bHour = b.trip_time === "afternoon" ? 15 : 8;
    const aDate = new Date(`${a.date}T${String(aHour).padStart(2, "0")}:00:00`).getTime();
    const bDate = new Date(`${b.date}T${String(bHour).padStart(2, "0")}:00:00`).getTime();
    return bDate - aDate;
  });
}
