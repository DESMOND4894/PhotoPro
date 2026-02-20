import type { Trip } from "@/lib/types";
import { generatePlatformVariant } from "@/lib/ai/caption-generator";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

function getAccessToken(): string {
  return process.env.META_PAGE_ACCESS_TOKEN!;
}

function getIgAccountId(): string {
  return process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
}

/**
 * Post Instagram carousel(s).
 * Instagram carousels support max 20 images.
 * If more than 20, split into multiple carousels.
 */
export async function postInstagramCarousel(trip: Trip): Promise<string[]> {
  const postIds: string[] = [];
  const photoUrls = trip.photo_urls;

  // Split into chunks of 20
  const chunks: string[][] = [];
  for (let i = 0; i < photoUrls.length; i += 20) {
    chunks.push(photoUrls.slice(i, i + 20));
  }

  // Generate Instagram caption variant
  const caption =
    trip.caption_instagram ||
    (await generatePlatformVariant(trip, "instagram"));

  for (const chunk of chunks) {
    const postId = await postSingleCarousel(chunk, caption);
    if (postId) postIds.push(postId);
  }

  return postIds;
}

async function postSingleCarousel(
  photoUrls: string[],
  caption: string
): Promise<string | null> {
  const token = getAccessToken();
  const igId = getIgAccountId();

  // Step 1: Create media containers for each image
  const containerIds: string[] = [];

  for (const url of photoUrls) {
    const response = await fetch(`${GRAPH_API_URL}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: token,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Instagram media container failed:`, error);
      continue;
    }

    const data = await response.json();
    containerIds.push(data.id);
  }

  if (containerIds.length === 0) return null;

  // If only 1 image, post as single image instead of carousel
  if (containerIds.length === 1) {
    // Re-create as non-carousel item
    const response = await fetch(`${GRAPH_API_URL}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: photoUrls[0],
        caption,
        access_token: token,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return await publishContainer(data.id);
  }

  // Step 2: Create carousel container
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
    throw new Error(`Instagram carousel creation failed: ${error}`);
  }

  const carouselData = await carouselResponse.json();

  // Step 3: Publish
  return await publishContainer(carouselData.id);
}

async function publishContainer(containerId: string): Promise<string> {
  const token = getAccessToken();
  const igId = getIgAccountId();

  // Wait for container to be ready (Instagram processes async)
  await waitForContainerReady(containerId);

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
    throw new Error(`Instagram publish failed: ${error}`);
  }

  const data = await response.json();
  console.log(`Instagram post published: ${data.id}`);
  return data.id;
}

async function waitForContainerReady(
  containerId: string,
  maxAttempts = 10
): Promise<void> {
  const token = getAccessToken();

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

    // Wait 3 seconds between checks
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Instagram container processing timed out");
}
