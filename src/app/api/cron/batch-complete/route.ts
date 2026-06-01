import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendCaptainNotification } from "@/lib/whatsapp/client";
import type { Trip } from "@/lib/types";

const QUIET_PERIOD_MINUTES = 2;

/**
 * Cron job: Check for trips that have stopped receiving photos (2-min quiet period).
 * When detected: mark batch complete, generate caption, notify captain.
 * Run every minute via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find trips in "receiving" state where last photo was > 2 min ago
  const cutoff = new Date(
    Date.now() - QUIET_PERIOD_MINUTES * 60 * 1000
  ).toISOString();

  const { data: readyTrips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "receiving")
    .eq("batch_complete", false)
    .lt("last_photo_at", cutoff)
    .not("last_photo_at", "is", null);

  if (error) {
    console.error("Batch complete check failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!readyTrips || readyTrips.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  for (const trip of readyTrips as Trip[]) {
    try {
      // Mark batch complete and move to pending — no auto-caption.
      // The captain types the caption they want on the post.
      await supabase
        .from("trips")
        .update({
          batch_complete: true,
          status: "pending",
        })
        .eq("id", trip.id);

      // Notify captain via WhatsApp to add a caption
      await sendCaptainNotification(
        trip.id,
        trip.boat,
        trip.trip_time,
        trip.photo_count
      );

      processed++;
      console.log(
        `Batch complete: ${trip.boat} ${trip.trip_time} — ${trip.photo_count} photos, captain notified`
      );
    } catch (err) {
      console.error(`Failed to process batch for trip ${trip.id}:`, err);
    }
  }

  return NextResponse.json({ processed });
}
