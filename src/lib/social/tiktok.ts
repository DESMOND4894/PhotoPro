import type { Trip } from "@/lib/types";
import { generatePlatformVariant } from "@/lib/ai/caption-generator";
import { sanitizeApiError } from "@/lib/utils/sanitize";

const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";

function getAccessToken(): string {
  return process.env.TIKTOK_ACCESS_TOKEN!;
}

/**
 * Post a photo slideshow to TikTok using the Content Posting API.
 * TikTok's photo post API allows up to 35 images per post.
 */
export async function postTikTokSlideshow(trip: Trip): Promise<string | null> {
  const token = getAccessToken();

  // Use TikTok-specific caption, fall back to main caption, then AI generation
  const caption =
    trip.caption_tiktok || trip.caption || (await generatePlatformVariant(trip, "tiktok"));

  // Step 1: Initialize photo post
  const photoUrls = trip.photo_urls.slice(0, 35); // TikTok max 35 images

  const initResponse = await fetch(
    `${TIKTOK_API_URL}/post/publish/content/init/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_images: photoUrls,
        },
        post_mode: "MEDIA_UPLOAD",
        media_type: "PHOTO",
      }),
    }
  );

  if (!initResponse.ok) {
    const error = await initResponse.text();
    console.error(`TikTok init failed:`, sanitizeApiError(error));
    throw new Error(`TikTok post init failed: ${sanitizeApiError(error)}`);
  }

  const initData = await initResponse.json();
  const publishId = initData.data?.publish_id;

  if (!publishId) {
    throw new Error("TikTok did not return a publish ID");
  }

  // Step 2: Check publish status
  const postId = await waitForTikTokPublish(publishId);

  console.log(`TikTok slideshow posted: ${postId}`);
  return postId;
}

async function waitForTikTokPublish(
  publishId: string,
  maxAttempts = 20
): Promise<string | null> {
  const token = getAccessToken();

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `${TIKTOK_API_URL}/post/publish/status/fetch/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publish_id: publishId }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const status = data.data?.status;

      if (status === "PUBLISH_COMPLETE") {
        return data.data?.publicly_available_post_id?.[0] || publishId;
      }

      if (status === "FAILED") {
        console.error("TikTok publish failed:", data.data?.fail_reason);
        throw new Error(
          `TikTok publish failed: ${data.data?.fail_reason || "Unknown"}`
        );
      }
    }

    // Wait 5 seconds between checks
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.warn("TikTok publish status check timed out");
  return null;
}
