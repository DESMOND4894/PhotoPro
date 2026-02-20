import { createServiceClient } from "@/lib/supabase/server";
import { sendTextMessage, sendPostingConfirmation } from "./client";
import type { Trip } from "@/lib/types";

export async function handleCaptainResponse(
  text: string,
  captainPhone: string
): Promise<void> {
  const supabase = createServiceClient();
  const normalizedText = text.trim().toLowerCase();

  // "✅ all" — approve all pending batches
  if (normalizedText === "✅ all" || normalizedText === "✅all") {
    await approveAllPending(supabase, captainPhone);
    return;
  }

  // "✅" — approve the most recent pending batch
  if (normalizedText === "✅") {
    await approveLatestPending(supabase, captainPhone);
    return;
  }

  // "✏️" — request new caption for latest pending
  if (normalizedText === "✏️" || normalizedText === "edit") {
    await requestNewCaption(supabase, captainPhone);
    return;
  }

  // "⏭️" — skip the latest pending batch
  if (normalizedText === "⏭️" || normalizedText === "skip") {
    await skipLatestPending(supabase, captainPhone);
    return;
  }

  // Any other text — treat as a custom caption and auto-approve
  await applyCustomCaption(supabase, captainPhone, text.trim());
}

async function getLatestPendingTrip(
  supabase: ReturnType<typeof createServiceClient>
): Promise<Trip | null> {
  const { data } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data as Trip | null;
}

async function approveTrip(
  supabase: ReturnType<typeof createServiceClient>,
  trip: Trip
): Promise<void> {
  await supabase
    .from("trips")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", trip.id);

  // Create posting log entries for each enabled platform with staggered schedule
  const now = new Date();
  const schedules: Record<string, number> = {
    facebook: 0, // Immediately
    instagram: 30, // 30 minutes later
    tiktok: 60, // 1 hour later
  };

  for (const platform of trip.platforms_enabled) {
    const scheduledFor = new Date(
      now.getTime() + (schedules[platform] || 0) * 60 * 1000
    );

    await supabase.from("posting_log").insert({
      trip_id: trip.id,
      platform,
      status: "pending",
      scheduled_for: scheduledFor.toISOString(),
    });
  }
}

async function approveLatestPending(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string
): Promise<void> {
  const trip = await getLatestPendingTrip(supabase);

  if (!trip) {
    await sendTextMessage(captainPhone, "No pending batches to approve.");
    return;
  }

  await approveTrip(supabase, trip);
  await sendPostingConfirmation(
    captainPhone,
    trip.boat,
    trip.platforms_enabled
  );
}

async function approveAllPending(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string
): Promise<void> {
  const { data: pendingTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!pendingTrips || pendingTrips.length === 0) {
    await sendTextMessage(captainPhone, "No pending batches to approve.");
    return;
  }

  for (const trip of pendingTrips as Trip[]) {
    await approveTrip(supabase, trip);
  }

  const boatNames = (pendingTrips as Trip[]).map((t) => t.boat).join(" & ");
  await sendTextMessage(
    captainPhone,
    `✅ ${pendingTrips.length} batch${pendingTrips.length > 1 ? "es" : ""} approved! ` +
      `${boatNames} posting to Facebook now. Instagram and TikTok to follow.`
  );
}

async function requestNewCaption(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string
): Promise<void> {
  const trip = await getLatestPendingTrip(supabase);

  if (!trip) {
    await sendTextMessage(captainPhone, "No pending batches to edit.");
    return;
  }

  // Re-generate caption
  const { generateCaption } = await import("@/lib/ai/caption-generator");
  const newCaption = await generateCaption(trip);

  await supabase
    .from("trips")
    .update({ caption: newCaption })
    .eq("id", trip.id);

  await sendTextMessage(
    captainPhone,
    `📝 New caption for ${trip.boat}:\n\n"${newCaption}"\n\n` +
      `Reply ✅ to approve, ✏️ for another, or send your own caption.`
  );
}

async function skipLatestPending(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string
): Promise<void> {
  const trip = await getLatestPendingTrip(supabase);

  if (!trip) {
    await sendTextMessage(captainPhone, "No pending batches to skip.");
    return;
  }

  await supabase
    .from("trips")
    .update({ status: "skipped" })
    .eq("id", trip.id);

  await sendTextMessage(
    captainPhone,
    `⏭️ ${trip.boat} ${trip.trip_time} batch skipped. You can approve it later from the dashboard.`
  );
}

async function applyCustomCaption(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string,
  caption: string
): Promise<void> {
  const trip = await getLatestPendingTrip(supabase);

  if (!trip) {
    await sendTextMessage(
      captainPhone,
      "No pending batches. Your message wasn't applied as a caption."
    );
    return;
  }

  await supabase
    .from("trips")
    .update({ caption })
    .eq("id", trip.id);

  // Auto-approve with custom caption
  await approveTrip(supabase, trip);

  await sendPostingConfirmation(
    captainPhone,
    trip.boat,
    trip.platforms_enabled
  );
}
