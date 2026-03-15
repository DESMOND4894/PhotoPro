import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/trips/[id]/approve — approve a trip for publishing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Get the trip
  const { data: trip, error: tripError } = await serviceClient
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (trip.status !== "pending" && trip.status !== "skipped") {
    return NextResponse.json(
      { error: `Trip is already ${trip.status}` },
      { status: 400 }
    );
  }

  // Check if custom caption was provided
  const body = await request.json().catch(() => ({}));
  if (body.caption) {
    await serviceClient
      .from("trips")
      .update({ caption: body.caption })
      .eq("id", id);
  }

  // Update status to approved
  await serviceClient
    .from("trips")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Create posting log entries with staggered schedule
  const now = new Date();
  const platformsEnabled = body.platforms || trip.platforms_enabled || [
    "facebook",
    "instagram",
    "tiktok",
  ];

  const schedules: Record<string, number> = {
    facebook: 0,
    instagram: 30,
    tiktok: 60,
  };

  for (const platform of platformsEnabled) {
    const scheduledFor = new Date(
      now.getTime() + (schedules[platform] || 0) * 60 * 1000
    );

    await serviceClient.from("posting_log").upsert(
      {
        trip_id: id,
        platform,
        status: "pending",
        scheduled_for: scheduledFor.toISOString(),
      },
      { onConflict: "trip_id,platform" }
    );
  }

  // Trigger publish cron immediately (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const cronSecret = process.env.CRON_SECRET;
  if (appUrl && cronSecret) {
    fetch(`${appUrl}/api/cron/publish`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    }).catch((err) => {
      console.error("[APPROVE] Failed to trigger publish cron:", err);
    });
  }

  return NextResponse.json({ status: "approved", trip_id: id });
}
