import { createServiceClient } from "@/lib/supabase/server";
import type { Photo, Trip } from "@/lib/types";
import {
  getPortalDefaults,
  getPublicPhotoUrl,
  getPublicSubtitle,
  getPublicTitle,
  getTripTimeLabel,
  sortTripsNewestFirst,
  type PublicTripCard,
  type PublicTripDetail,
  type PublicTripPhoto,
} from "@/lib/public-portal";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapPhoto(photo: Photo): PublicTripPhoto {
  const url = getPublicPhotoUrl(photo);

  return {
    id: photo.id,
    url,
    thumbnailUrl: url,
    uploadedAt: photo.uploaded_at,
  };
}

async function getPhotosByIds(photoIds: string[]): Promise<Map<string, Photo>> {
  if (photoIds.length === 0) {
    return new Map();
  }

  const supabase = createServiceClient();
  // NOTE: is_duplicate filter intentionally omitted — duplicate detection was
  // removed from the upload path (CLAUDE.md golden rule). Filtering here would
  // silently hide photos that were flagged during the old detection window.
  const { data } = await supabase
    .from("photos")
    .select("*")
    .in("id", photoIds);

  const photos = (data || []) as Photo[];
  return new Map(photos.map((photo) => [photo.id, photo]));
}

function mapTripCard(trip: Trip, photoMap: Map<string, Photo>): PublicTripCard {
  const coverPhoto = trip.public_cover_photo_id ? photoMap.get(trip.public_cover_photo_id) : null;
  const featuredPhotos = toStringArray(trip.featured_photo_ids)
    .map((id) => photoMap.get(id))
    .filter((photo): photo is Photo => Boolean(photo))
    .map((photo) => getPublicPhotoUrl(photo));

  return {
    slug: trip.public_slug!,
    publicTitle: getPublicTitle(trip),
    publicSubtitle: getPublicSubtitle(trip),
    boatLabel: trip.boat,
    tripDate: trip.date,
    timeLabel: getTripTimeLabel(trip.trip_time),
    coverPhotoUrl: coverPhoto ? getPublicPhotoUrl(coverPhoto) : trip.photo_urls[0] || null,
    photoCount: trip.photo_count,
    speciesTags: toStringArray(trip.public_species_tags),
    featuredPhotoUrls: featuredPhotos,
  };
}

function mapTripDetail(trip: Trip, photos: Photo[], photoMap: Map<string, Photo>): PublicTripDetail {
  const defaults = getPortalDefaults();
  const card = mapTripCard(trip, photoMap);
  const mappedPhotos = photos.map(mapPhoto);
  const featuredPhotos = toStringArray(trip.featured_photo_ids)
    .map((id) => photos.find((photo) => photo.id === id))
    .filter((photo): photo is Photo => Boolean(photo))
    .map(mapPhoto);

  const reviewUrl = trip.public_review_url || defaults.reviewUrl;
  const tagUsText = trip.public_tag_us_text || defaults.tagUsText;
  const tagUsUrl = trip.public_tag_us_url || defaults.tagUsUrl;
  const bookAgainUrl = trip.public_book_again_url || defaults.bookAgainUrl;

  return {
    ...card,
    tripId: trip.id,
    reviewUrl,
    reviewConfigured: Boolean(reviewUrl),
    tagUsText: tagUsText && tagUsUrl ? tagUsText : null,
    tagUsUrl: tagUsText && tagUsUrl ? tagUsUrl : null,
    bookAgainUrl,
    copyCaption: trip.public_copy_caption,
    copyHashtags: trip.public_copy_hashtags,
    crewNote: trip.show_public_crew_note ? trip.public_crew_note : null,
    featuredPhotos,
    photos: mappedPhotos,
  };
}

export async function listPublishedTrips(limit = 12): Promise<PublicTripCard[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("public_enabled", true)
    .gt("photo_count", 0)
    .not("public_slug", "is", null)
    .order("date", { ascending: false })
    .limit(Math.max(limit * 2, limit));

  if (error) {
    throw new Error(`Failed to load public trips: ${error.message}`);
  }

  const trips = sortTripsNewestFirst((data || []) as Trip[]);
  const photoIds = Array.from(new Set(
    trips.flatMap((trip) => [
      ...(trip.public_cover_photo_id ? [trip.public_cover_photo_id] : []),
      ...toStringArray(trip.featured_photo_ids),
    ])
  ));
  const photoMap = await getPhotosByIds(photoIds);

  return trips.map((trip) => mapTripCard(trip, photoMap)).slice(0, limit);
}

export async function getPublishedTripBySlug(slug: string): Promise<PublicTripDetail | null> {
  const supabase = createServiceClient();
  const { data: tripData, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("public_slug", slug)
    .eq("public_enabled", true)
    .gt("photo_count", 0)
    .single();

  if (tripError || !tripData) {
    return null;
  }

  const trip = tripData as Trip;
  // NOTE: is_duplicate filter intentionally omitted — see getPhotosByIds comment.
  const { data: photoData, error: photoError } = await supabase
    .from("photos")
    .select("*")
    .eq("trip_id", trip.id)
    .order("uploaded_at", { ascending: true });

  if (photoError) {
    throw new Error(`Failed to load public photos: ${photoError.message}`);
  }

  const photos = (photoData || []) as Photo[];
  if (photos.length === 0) {
    return null;
  }

  const photoMap = new Map(photos.map((photo) => [photo.id, photo]));
  return mapTripDetail(trip, photos, photoMap);
}

export async function getPublishedPhotoDownloadUrl(photoId: string): Promise<string | null> {
  const supabase = createServiceClient();
  // NOTE: is_duplicate filter intentionally omitted — see getPhotosByIds comment.
  const { data: photoData, error: photoError } = await supabase
    .from("photos")
    .select("*")
    .eq("id", photoId)
    .single();

  if (photoError || !photoData) {
    return null;
  }

  const photo = photoData as Photo;
  const { data: tripData, error: tripError } = await supabase
    .from("trips")
    .select("id, public_enabled")
    .eq("id", photo.trip_id)
    .eq("public_enabled", true)
    .single();

  if (tripError || !tripData) {
    return null;
  }

  return getPublicPhotoUrl(photo);
}
