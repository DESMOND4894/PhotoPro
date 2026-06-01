import type { Trip } from "@/lib/types";
import { generatePlatformVariant } from "@/lib/ai/caption-generator";
import { sanitizeApiError } from "@/lib/utils/sanitize";
import { getInstagramCredentials } from "@/lib/social/tokens";
import { getTripMedia } from "@/lib/social/media";
import { withSignoff } from "@/lib/brand";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

type MediaItem = { type: "image" | "video"; url: string };

/**
 * Post a trip's media to Instagram.
 * - A single photo posts as a single image.
 * - A single video posts as a Reel.
 * - Multiple items (photos and/or videos) post as a carousel (max 20 per post).
 */
export async function postInstagramCarousel(trip: Trip): Promise<string[]> {
  const { imageUrls, videoUrls } = await getTripMedia(trip.id);

  const items: MediaItem[] = [
    ...imageUrls.map((url) => ({ type: "image" as const, url })),
    ...videoUrls.map((url) => ({ type: "video" as const, url })),
  ];

  if (items.length === 0) return [];

  const baseCaption =
    trip.caption_instagram ||
    trip.caption ||
    (await generatePlatformVariant(trip, "instagram"));
  const caption = withSignoff(baseCaption);

  const { token, igAccountId: igId } = await getInstagramCredentials();

  // Single item: post directly (single image, or a Reel for a single video)
  if (items.length === 1) {
    const item = items[0];
    const postId =
      item.type === "video"
        ? await postReel(item.url, caption, token, igId)
        : await postSingleImage(item.url, caption, token, igId);
    return postId ? [postId] : [];
  }

  // Multiple items: carousel(s), max 20 per carousel
  const postIds: string[] = [];
  for (let i = 0; i < items.length; i += 20) {
    const chunk = items.slice(i, i + 20);
    const postId = await postCarousel(chunk, caption, token, igId);
    if (postId) postIds.push(postId);
  }

  return postIds;
}

async function postSingleImage(
  imageUrl: string,
  caption: string,
  token: string,
  igId: string,
): Promise<string | null> {
  const response = await fetch(`${GRAPH_API_URL}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: token,
    }),
  });

  if (!response.ok) {
    console.error("Instagram single image failed:", sanitizeApiError(await response.text()));
    return null;
  }
  const data = await response.json();
  return await publishContainer(data.id, token, igId);
}

async function postReel(
  videoUrl: string,
  caption: string,
  token: string,
  igId: string,
): Promise<string | null> {
  const response = await fetch(`${GRAPH_API_URL}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      share_to_feed: true,
      access_token: token,
    }),
  });

  if (!response.ok) {
    console.error("Instagram reel creation failed:", sanitizeApiError(await response.text()));
    return null;
  }
  const data = await response.json();
  return await publishContainer(data.id, token, igId);
}

async function postCarousel(
  items: MediaItem[],
  caption: string,
  token: string,
  igId: string,
): Promise<string | null> {
  // Step 1: Create a child container for each item
  const containerIds: string[] = [];

  for (const item of items) {
    const body =
      item.type === "video"
        ? { media_type: "VIDEO", video_url: item.url, is_carousel_item: true, access_token: token }
        : { image_url: item.url, is_carousel_item: true, access_token: token };

    const response = await fetch(`${GRAPH_API_URL}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Instagram ${item.type} container failed:`, sanitizeApiError(await response.text()));
      continue;
    }

    const data = await response.json();
    containerIds.push(data.id);
  }

  if (containerIds.length === 0) return null;

  // Carousel needs at least 2 items; if only one survived, publish it on its own
  if (containerIds.length === 1) {
    return await publishContainer(containerIds[0], token, igId);
  }

  // Step 2: Wait for every child to finish processing (videos are async)
  for (const id of containerIds) {
    await waitForContainerReady(id, token);
  }

  // Step 3: Create the carousel container
  const carouselResponse = await fetch(`${GRAPH_API_URL}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      caption,
      children: containerIds,
      access_token: token,
    }),
  });

  if (!carouselResponse.ok) {
    const error = await carouselResponse.text();
    throw new Error(`Instagram carousel creation failed: ${sanitizeApiError(error)}`);
  }

  const carouselData = await carouselResponse.json();

  // Step 4: Publish
  return await publishContainer(carouselData.id, token, igId);
}

async function publishContainer(containerId: string, token: string, igId: string): Promise<string> {
  // Wait for container to be ready (Instagram processes async)
  await waitForContainerReady(containerId, token);

  const response = await fetch(`${GRAPH_API_URL}/${igId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Instagram publish failed: ${sanitizeApiError(error)}`);
  }

  const data = await response.json();
  console.log(`Instagram post published: ${data.id}`);
  return data.id;
}

async function waitForContainerReady(
  containerId: string,
  token: string,
  maxAttempts = 20
): Promise<void> {
  let delay = 2000; // Start at 2 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `${GRAPH_API_URL}/${containerId}?fields=status_code&access_token=${token}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status_code === "FINISHED") return;
      if (data.status_code === "ERROR") {
        throw new Error("Instagram container processing failed");
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(Math.round(delay * 1.5), 15000); // Exponential backoff, cap at 15s
  }

  throw new Error("Instagram container processing timed out");
}
