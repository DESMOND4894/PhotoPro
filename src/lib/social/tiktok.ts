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
    const envToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (!envToken) throw new Error("No TikTok access token found in DB or env");
    return envToken;
  }

  // Check if token is still valid (with 5 min buffer)
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0; // Force refresh if no expiry info
  const isExpired = Date.now() > expiresAt - 5 * 60 * 1000;

  if (!isExpired) {
    return connection.access_token;
  }

  // Token expired — try to refresh
  if (!connection.refresh_token) {
    const envToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (envToken) return envToken;
    throw new Error("TikTok token expired and no refresh token available");
  }

  console.log("[TIKTOK] Access token expired, refreshing...");
  return await refreshAccessToken(connection.refresh_token, connection.platform_user_id);
}

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
 * Convert Supabase storage URLs to proxy URLs on our verified domain.
 * TikTok requires URL ownership verification for PULL_FROM_URL,
 * so we proxy through our own domain.
 */
function toProxyUrls(photoUrls: string[]): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://photo-pro-mu.vercel.app";
  return photoUrls.map(
    (url) => `${appUrl}/api/photos/proxy?url=${encodeURIComponent(url)}`
  );
}

/**
 * Post a photo slideshow to TikTok using the Content Posting API.
 * Uses PULL_FROM_URL with proxied URLs through our verified domain.
 * TikTok photo posts support up to 35 images (JPEG/WEBP only, no PNG).
 */
export async function postTikTokSlideshow(trip: Trip): Promise<string | null> {
  const token = await getAccessToken();

  // Use TikTok-specific caption, fall back to main caption, then AI generation
  const caption =
    trip.caption_tiktok || trip.caption || (await generatePlatformVariant(trip, "tiktok"));

  // Proxy photos through our domain for TikTok URL ownership verification
  const photoUrls = toProxyUrls(trip.photo_urls.slice(0, 35));

  // TikTok sandbox requires SELF_ONLY privacy; production can use PUBLIC_TO_EVERYONE
  const isSandbox = !process.env.TIKTOK_PRODUCTION;
  const privacyLevel = isSandbox ? "SELF_ONLY" : "PUBLIC_TO_EVERYONE";

  console.log(`[TIKTOK] Posting ${photoUrls.length} photos, privacy: ${privacyLevel}`);

  const initResponse = await fetch(
    `${TIKTOK_API_URL}/post/publish/content/init/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: caption.slice(0, 90),
          description: caption.slice(0, 4000),
          privacy_level: privacyLevel,
          disable_comment: false,
          auto_add_music: true,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: photoUrls,
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      }),
    }
  );

  const initText = await initResponse.text();
  let initData;
  try {
    initData = JSON.parse(initText);
  } catch {
    throw new Error(`TikTok init returned non-JSON: ${sanitizeApiError(initText)}`);
  }

  if (initData.error?.code && initData.error.code !== "ok") {
    console.error(`[TIKTOK] Init failed:`, sanitizeApiError(initText));
    throw new Error(`TikTok post init failed: ${sanitizeApiError(initText)}`);
  }

  const publishId = initData.data?.publish_id;

  if (!publishId) {
    throw new Error(`TikTok did not return a publish ID. Response: ${sanitizeApiError(initText)}`);
  }

  console.log(`[TIKTOK] Init success, publish_id: ${publishId}`);

  // Poll for publish status — TikTok pulls photos from our URLs
  const postId = await waitForTikTokPublish(publishId, token);

  console.log(`[TIKTOK] Slideshow posted: ${postId}`);
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

      console.log(`[TIKTOK] Publish status check ${i + 1}: ${status}`);

      if (status === "PUBLISH_COMPLETE") {
        return data.data?.publicly_available_post_id?.[0] || publishId;
      }

      if (status === "FAILED") {
        console.error("[TIKTOK] Publish failed:", data.data?.fail_reason);
        throw new Error(
          `TikTok publish failed: ${data.data?.fail_reason || "Unknown"}`
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.warn("[TIKTOK] Publish status check timed out");
  return null;
}
