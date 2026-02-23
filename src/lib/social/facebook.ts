import type { Trip } from "@/lib/types";
import { sanitizeApiError } from "@/lib/utils/sanitize";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

function getPageAccessToken(): string {
  return process.env.META_PAGE_ACCESS_TOKEN!;
}

function getPageId(): string {
  return process.env.META_PAGE_ID!;
}

/**
 * Post a photo album to Facebook Page.
 * 1. Upload each photo as unpublished
 * 2. Create a feed post that references all photos (creates an album)
 */
export async function postFacebookAlbum(trip: Trip): Promise<string> {
  const token = getPageAccessToken();
  const pageId = getPageId();

  // Step 1: Upload each photo as unpublished
  const photoIds: string[] = [];

  for (const photoUrl of trip.photo_urls) {
    const response = await fetch(`${GRAPH_API_URL}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: photoUrl,
        published: false,
        access_token: token,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Facebook photo upload failed:`, sanitizeApiError(error));
      continue;
    }

    const data = await response.json();
    photoIds.push(data.id);
  }

  if (photoIds.length === 0) {
    throw new Error("No photos were uploaded to Facebook");
  }

  // Step 2: Create feed post with all photos attached
  const caption = trip.caption_facebook || trip.caption || "";
  const attachedMedia = photoIds.map((id) => ({
    media_fbid: id,
  }));

  const feedResponse = await fetch(`${GRAPH_API_URL}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: caption,
      attached_media: attachedMedia,
      access_token: token,
    }),
  });

  if (!feedResponse.ok) {
    const error = await feedResponse.text();
    throw new Error(`Facebook feed post failed: ${sanitizeApiError(error)}`);
  }

  const feedData = await feedResponse.json();
  console.log(`Facebook album posted: ${feedData.id}`);
  return feedData.id;
}
