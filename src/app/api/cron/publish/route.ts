import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { postFacebookAlbum } from "@/lib/social/facebook";
import { postInstagramCarousel } from "@/lib/social/instagram";
import { postTikTokSlideshow } from "@/lib/social/tiktok";
import type { Trip, SocialPlatform } from "@/lib/types";
import { sanitizeApiError } from "@/lib/utils/sanitize";

// Allow up to 120s for publishing (multi-photo uploads + Instagram processing)
export const maxDuration = 120;

/**
 * Cron job: Process scheduled publishing queue.
 * Checks for posting_log entries where scheduled_for <= now and status = pending.
 * Run every 5 minutes via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Find pending posts that are due
  const { data: duePosts, error } = await supabase
    .from("posting_log")
    .select("*, trips(*)")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true });

  if (error) {
    console.error("Publish cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  let published = 0;

  for (const post of duePosts) {
    const platform = post.platform as SocialPlatform;
    const tripId = post.trip_id;

    // Atomic claim: only proceed if WE transition from "pending" to "posting"
    // This prevents two concurrent cron runs from both publishing the same entry
    const { data: claimed } = await supabase
      .from("posting_log")
      .update({ status: "posting" })
      .eq("id", post.id)
      .eq("status", "pending")
      .select();

    if (!claimed || claimed.length === 0) {
      console.log(`[PUBLISH] Skipping posting_log ${post.id} — already claimed by another process`);
      continue;
    }

    // Re-read FRESH trip data from DB (not the stale JOIN data)
    // This ensures we publish with the latest caption, not a stale one
    const { data: freshTrip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (!freshTrip) {
      console.error(`[PUBLISH] Trip ${tripId} not found — skipping`);
      await supabase
        .from("posting_log")
        .update({ status: "failed", error_message: "Trip not found" })
        .eq("id", post.id);
      continue;
    }

    const trip = freshTrip as Trip;

    // Only publish if trip is actually approved or already posting
    // Skip if trip was reset to receiving/pending/skipped (captain changed their mind)
    if (trip.status !== "approved" && trip.status !== "posting") {
      console.log(`[PUBLISH] Trip ${tripId} status is "${trip.status}" — skipping (expected approved/posting)`);
      await supabase
        .from("posting_log")
        .update({ status: "failed", error_message: `Trip status was ${trip.status}, not approved` })
        .eq("id", post.id);
      continue;
    }

    // Update trip status
    await supabase
      .from("trips")
      .update({ status: "posting" })
      .eq("id", trip.id);

    try {
      let platformPostId: string | null = null;

      switch (platform) {
        case "facebook":
          platformPostId = await postFacebookAlbum(trip);
          break;
        case "instagram": {
          const ids = await postInstagramCarousel(trip);
          platformPostId = ids[0] || null;
          if (!platformPostId) {
            throw new Error("Instagram returned no post ID — publishing likely failed");
          }
          break;
        }
        case "tiktok":
          platformPostId = await postTikTokSlideshow(trip);
          break;
      }

      await supabase
        .from("posting_log")
        .update({
          status: "posted",
          platform_post_id: platformPostId,
          posted_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      // Update trip's posted_to — re-read to avoid stale data
      const { data: currentTrip } = await supabase
        .from("trips")
        .select("posted_to")
        .eq("id", trip.id)
        .single();

      const currentPostedTo = (currentTrip?.posted_to as SocialPlatform[]) || [];
      if (!currentPostedTo.includes(platform)) {
        await supabase
          .from("trips")
          .update({ posted_to: [...currentPostedTo, platform] })
          .eq("id", trip.id);
      }

      // Check if all platforms done
      const { data: allLogs } = await supabase
        .from("posting_log")
        .select("status")
        .eq("trip_id", trip.id);

      if (allLogs?.every((l) => l.status === "posted")) {
        await supabase
          .from("trips")
          .update({ status: "posted" })
          .eq("id", trip.id);
      } else if (
        allLogs?.some((l) => l.status === "failed") &&
        allLogs?.every((l) => l.status === "posted" || l.status === "failed")
      ) {
        // All platforms attempted, some failed
        await supabase
          .from("trips")
          .update({ status: "failed" })
          .eq("id", trip.id);
      }

      published++;
      console.log(`[PUBLISH] Published ${trip.boat} to ${platform}: ${platformPostId}`);
    } catch (err) {
      const rawError = err instanceof Error ? err.message : "Unknown error";
      const errorMessage = sanitizeApiError(rawError);
      console.error(`[PUBLISH] Failed [${platform}]:`, errorMessage);

      await supabase
        .from("posting_log")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", post.id);

      // Check if all platforms are now done (posted or failed)
      const { data: allLogs } = await supabase
        .from("posting_log")
        .select("status")
        .eq("trip_id", trip.id);

      if (allLogs?.every((l) => l.status === "posted")) {
        await supabase
          .from("trips")
          .update({ status: "posted" })
          .eq("id", trip.id);
      } else if (
        allLogs?.every((l) => l.status === "posted" || l.status === "failed")
      ) {
        // All platforms attempted — mark posted if any succeeded, failed if none did
        const anyPosted = allLogs.some((l) => l.status === "posted");
        await supabase
          .from("trips")
          .update({ status: anyPosted ? "posted" : "failed" })
          .eq("id", trip.id);
      }
    }
  }

  return NextResponse.json({ published });
}
