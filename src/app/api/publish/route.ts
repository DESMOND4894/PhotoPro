import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { postFacebookAlbum } from "@/lib/social/facebook";
import { postInstagramCarousel } from "@/lib/social/instagram";
import { postTikTokSlideshow } from "@/lib/social/tiktok";
import type { Trip, SocialPlatform } from "@/lib/types";

// POST /api/publish — publish a specific trip+platform combo
// Called by the cron job or manually from dashboard
export async function POST(request: NextRequest) {
  // Verify cron secret or auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    // Check for authenticated user session as fallback
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json();
  const { tripId, platform } = body as {
    tripId: string;
    platform: SocialPlatform;
  };

  if (!tripId || !platform) {
    return NextResponse.json(
      { error: "tripId and platform are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Get trip
  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (error || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Update posting log to "posting"
  await supabase
    .from("posting_log")
    .update({ status: "posting" })
    .eq("trip_id", tripId)
    .eq("platform", platform);

  try {
    let platformPostId: string | null = null;

    switch (platform) {
      case "facebook":
        platformPostId = await postFacebookAlbum(trip as Trip);
        break;
      case "instagram": {
        const ids = await postInstagramCarousel(trip as Trip);
        platformPostId = ids[0] || null;
        break;
      }
      case "tiktok":
        platformPostId = await postTikTokSlideshow(trip as Trip);
        break;
    }

    // Update posting log to "posted"
    await supabase
      .from("posting_log")
      .update({
        status: "posted",
        platform_post_id: platformPostId,
        posted_at: new Date().toISOString(),
      })
      .eq("trip_id", tripId)
      .eq("platform", platform);

    // Update trip's posted_to array
    const currentPostedTo = (trip as Trip).posted_to || [];
    if (!currentPostedTo.includes(platform)) {
      await supabase
        .from("trips")
        .update({
          posted_to: [...currentPostedTo, platform],
        })
        .eq("id", tripId);
    }

    // Check if all platforms are posted — mark trip as "posted"
    const { data: allLogs } = await supabase
      .from("posting_log")
      .select("status")
      .eq("trip_id", tripId);

    const allPosted = allLogs?.every((log) => log.status === "posted");
    if (allPosted) {
      await supabase
        .from("trips")
        .update({ status: "posted" })
        .eq("id", tripId);
    }

    return NextResponse.json({
      status: "posted",
      platform,
      platformPostId,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Publishing to ${platform} failed:`, errorMessage);

    await supabase
      .from("posting_log")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("trip_id", tripId)
      .eq("platform", platform);

    return NextResponse.json(
      { error: `Publishing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
