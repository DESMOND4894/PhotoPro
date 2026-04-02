import type { Trip } from "@/lib/types";
import { generatePlatformVariant } from "@/lib/ai/caption-generator";
import { sanitizeApiError } from "@/lib/utils/sanitize";
import { createServiceClient } from "@/lib/supabase/server";

const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";

/**
 * Get a valid TikTok access token.
 * Reads from social_connections table, falls back to env var.
 * Auto-refreshes if token is expired and refresh_token is available.
 */
async function getAccessToken(): Promise<string> {
  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from("social_connections")
    .select("*")
    .eq("platform", "tiktok")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!connection) {
    // Fall back to env var (initial setup before DB storage)
    const envToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (!envToken) throw new Error("No TikTok access token found in DB or env");
    return envToken;
  }

  // Check if token is still valid (with 5 min buffer)
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : Infinity;
  const isExpired = Date.now() > expiresAt - 5 * 60 * 1000;

  if (!isExpired) {
    return connection.access_token;
  }

  // Token expired — try to refresh
  if (!connection.refresh_token) {
    // No refresh token — fall back to env var or fail
    const envToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (envToken) return envToken;
    throw new Error("TikTok token expired and no refresh token available");
  }

  console.log("[TIKTOK] Access token expired, refreshing...");
  return await refreshAccessToken(connection.refresh_token, connection.platform_user_id);
}

/**
 * Refresh the TikTok access token using the refresh token.
 */
async function refreshAccessToken(refreshToken: string, openId: string): Promise<string> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error("TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET not set — cannot refresh");
  }

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();

  if (data.error || !data.access_token) {
    console.error("[TIKTOK] Token refresh failed:", data);
    throw new Error(`TikTok token refresh failed: ${data.error_description || data.error || "unknown"}`);
  }

  // Update stored tokens
  const supabase = createServiceClient();
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;
  const refreshExpiresAt = data.refresh_expires_in
    ? new Date(Date.now() + data.refresh_expires_in * 1000).toISOString()
    : null;

  await supabase
    .from("social_connections")
    .update({
      access_token: data.access_token,
      token_expires_at: expiresAt,
      refresh_token: data.refresh_token || refreshToken,
      refresh_token_expires_at: refreshExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("platform", "tiktok")
    .eq("platform_user_id", openId);

  console.log("[TIKTOK] Token refreshed successfully");
  return data.access_token;
}

/**
 * Post a photo slideshow to TikTok using the Content Posting API.
 * TikTok's photo post API allows up to 35 images per post.
 */
export async function postTikTokSlideshow(trip: Trip): Promise<string | null> {
  const token = await getAccessToken();

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
  const postId = await waitForTikTokPublish(publishId, token);

  console.log(`TikTok slideshow posted: ${postId}`);
  return postId;
}

async function waitForTikTokPublish(
  publishId: string,
  token: string,
  maxAttempts = 20
): Promise<string | null> {
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
