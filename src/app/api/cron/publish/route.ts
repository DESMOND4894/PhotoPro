import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { postFacebookAlbum } from "@/lib/social/facebook";
import { postInstagramCarousel } from "@/lib/social/instagram";
import { postTikTokSlideshow } from "@/lib/social/tiktok";
import type { Trip, SocialPlatform } from "@/lib/types";

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
    const trip = post.trips as unknown as Trip;
    const platform = post.platform as SocialPlatform;

    // Update to "posting"
    await supabase
      .from("posting_log")
      .update({ status: "posting" })
      .eq("id", post.id);

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

      // Update trip's posted_to
      const currentPostedTo = trip.posted_to || [];
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
      }

      published++;
      console.log(`Published ${trip.boat} to ${platform}: ${platformPostId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      console.error(`Publish failed [${platform}]:`, errorMessage);

      await supabase
        .from("posting_log")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", post.id);
    }
  }

  return NextResponse.json({ published });
}
