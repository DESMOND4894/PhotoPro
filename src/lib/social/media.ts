import { createServiceClient } from "@/lib/supabase/server";

export interface TripMedia {
  imageUrls: string[];
  videoUrls: string[];
}

/**
 * Split a trip's media into images and videos.
 *
 * `trip.photo_urls` is a flat list of all media (photos + videos) and does not
 * carry the media type, so we read the photos table — the same source the
 * customer portal uses — and split by `media_type`. Ordered by upload time so
 * the sequence matches how the captain sent them.
 */
export async function getTripMedia(tripId: string): Promise<TripMedia> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("photos")
    .select("public_url, media_type")
    .eq("trip_id", tripId)
    .order("uploaded_at", { ascending: true });

  const rows = data ?? [];
  const imageUrls = rows
    .filter((p) => (p.media_type ?? "image") === "image")
    .map((p) => p.public_url as string);
  const videoUrls = rows
    .filter((p) => p.media_type === "video")
    .map((p) => p.public_url as string);

  return { imageUrls, videoUrls };
}
