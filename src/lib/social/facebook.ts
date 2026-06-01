import type { Trip } from "@/lib/types";
import { sanitizeApiError } from "@/lib/utils/sanitize";
import { getFacebookPageToken } from "@/lib/social/tokens";
import { getTripMedia } from "@/lib/social/media";
import { withSignoff } from "@/lib/brand";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

/**
 * Post a trip's media to a Facebook Page.
 * - Photos go up as a single album feed post.
 * - Each video goes up as its own video post.
 * Returns the id of the first successful post.
 */
export async function postFacebookAlbum(trip: Trip): Promise<string> {
  const { token, pageId } = await getFacebookPageToken();
  const { imageUrls, videoUrls } = await getTripMedia(trip.id);
  const caption = withSignoff(trip.caption_facebook || trip.caption || "");

  const postedIds: string[] = [];

  // Photos → one album feed post
  if (imageUrls.length > 0) {
    const albumId = await postPhotoAlbum(imageUrls, caption, token, pageId);
    if (albumId) postedIds.push(albumId);
  }

  // Videos → one video post each
  for (const videoUrl of videoUrls) {
    const videoId = await postVideo(videoUrl, caption, token, pageId);
    if (videoId) postedIds.push(videoId);
  }

  if (postedIds.length === 0) {
    throw new Error("Facebook: nothing was posted (no photos or videos succeeded)");
  }

  return postedIds[0];
}

async function postPhotoAlbum(
  imageUrls: string[],
  caption: string,
  token: string,
  pageId: string,
): Promise<string | null> {
  // Step 1: Upload each photo as unpublished
  const photoIds: string[] = [];

  for (const photoUrl of imageUrls) {
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

  if (photoIds.length === 0) return null;

  // Step 2: Create feed post with all photos attached
  const attachedMedia = photoIds.map((id) => ({ media_fbid: id }));

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

async function postVideo(
  videoUrl: string,
  caption: string,
  token: string,
  pageId: string,
): Promise<string | null> {
  // Facebook pulls the video from our public storage URL (non-resumable upload)
  const response = await fetch(`${GRAPH_API_URL}/${pageId}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_url: videoUrl,
      description: caption,
      access_token: token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Facebook video upload failed:`, sanitizeApiError(error));
    return null;
  }

  const data = await response.json();
  console.log(`Facebook video posted: ${data.id}`);
  return data.id || null;
}
