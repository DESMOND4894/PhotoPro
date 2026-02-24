import { createServiceClient } from "@/lib/supabase/server";
import { sendTextMessage, sendPostingConfirmation } from "./client";
import type { Trip } from "@/lib/types";

export async function handleCaptainResponse(
  text: string,
  captainPhone: string
): Promise<void> {
  const supabase = createServiceClient();
  const normalizedText = text.trim().toLowerCase();

  // PROCESS — gather all "receiving" photos, generate caption, send for review
  if (normalizedText === "process" || normalizedText === "ready" || normalizedText === "post") {
    await processReceivingTrips(supabase, captainPhone);
    return;
  }

  // Approve all pending batches
  if (normalizedText === "ok all" || normalizedText === "approve all") {
    await approveAllPending(supabase, captainPhone);
    return;
  }

  // Approve the most recent pending batch
  if (normalizedText === "ok" || normalizedText === "okay" || normalizedText === "approve" || normalizedText === "yes" || normalizedText === "go" || normalizedText === "✅") {
    await approveLatestPending(supabase, captainPhone);
    return;
  }

  // EDIT — prompt to type a custom caption
  if (normalizedText === "edit") {
    await sendTextMessage(captainPhone, "Type your new caption and send it:");
    return;
  }

  // NEW / REDO — generate a fresh AI caption
  if (normalizedText === "new" || normalizedText === "redo") {
    await requestNewCaption(supabase, captainPhone);
    return;
  }

  // Skip the latest pending batch
  if (normalizedText === "skip" || normalizedText === "no" || normalizedText === "pass") {
    await skipLatestPending(supabase, captainPhone);
    return;
  }

  // STATUS — check what's in the queue
  if (normalizedText === "status") {
    await sendStatus(supabase, captainPhone);
    return;
  }

  // Any other text — treat as a custom caption (don't auto-post)
  await applyCustomCaption(supabase, captainPhone, text.trim());
}

// Process all "receiving" trips — generate captions and move to "pending"
async function processReceivingTrips(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string
): Promise<void> {
  const { data: receivingTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "receiving")
    .order("created_at", { ascending: false });

  if (!receivingTrips || receivingTrips.length === 0) {
    await sendTextMessage(captainPhone, "No photos waiting to be processed.");
    return;
  }

  const { generateCaption } = await import("@/lib/ai/caption-generator");

  for (const trip of receivingTrips as Trip[]) {
    const caption = await generateCaption(trip);

    await supabase
      .from("trips")
      .update({
        caption,
        caption_facebook: caption,
        status: "pending",
        batch_complete: true,
      })
      .eq("id", trip.id);

    await sendTextMessage(
      captainPhone,
      `📸 ${trip.boat} — ${trip.trip_time} trip\n` +
        `${trip.photo_count} photo${trip.photo_count > 1 ? "s" : ""}\n\n` +
        `Caption:\n"${caption}"\n\n` +
        `OK = Post it\n` +
        `EDIT = Write your own\n` +
        `NEW = Different AI caption\n` +
        `SKIP = Don't post`
    );
  }
}

async function sendStatus(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string
): Promise<void> {
  const { data: receiving } = await supabase
    .from("trips")
    .select("boat, trip_time, photo_count")
    .eq("status", "receiving");

  const { data: pending } = await supabase
    .from("trips")
    .select("boat, trip_time, photo_count")
    .eq("status", "pending");

  let msg = "";

  if (receiving && receiving.length > 0) {
    msg += "📷 Photos waiting:\n";
    for (const t of receiving) {
      msg += `• ${t.boat} ${t.trip_time}: ${t.photo_count} photos\n`;
    }
    msg += "\nType PROCESS when ready.\n\n";
  }

  if (pending && pending.length > 0) {
    msg += "📝 Ready for approval:\n";
    for (const t of pending) {
      msg += `• ${t.boat} ${t.trip_time}: ${t.photo_count} photos\n`;
    }
    msg += "\nType OK to approve.";
  }

  if (!msg) {
    msg = "Nothing in the queue. Send some photos!";
  }

  await sendTextMessage(captainPhone, msg);
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

  // Delete any existing posting_log entries for this trip, then create fresh ones
  await supabase
    .from("posting_log")
    .delete()
    .eq("trip_id", trip.id);

  const now = new Date();
  for (const platform of trip.platforms_enabled) {
    await supabase.from("posting_log").insert({
      trip_id: trip.id,
      platform,
      status: "pending",
      scheduled_for: now.toISOString(),
    });
  }

  // Trigger publish immediately (don't await — let it run async)
  // If this fails, the scheduled cron (every 5 min) will pick it up as backup
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const cronSecret = process.env.CRON_SECRET;
  if (appUrl && cronSecret) {
    fetch(`${appUrl}/api/cron/publish`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    }).catch((err) => {
      console.error("[CAPTAIN] Failed to trigger publish cron:", err);
    });
  }
}

async function approveLatestPending(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string
): Promise<void> {
  const trip = await getLatestPendingTrip(supabase);

  if (!trip) {
    await sendTextMessage(captainPhone, "No pending batches to approve. Type PROCESS first if you have photos waiting.");
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
    `Approved! ${boatNames} posting now.`
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

  const { generateCaption } = await import("@/lib/ai/caption-generator");
  const newCaption = await generateCaption(trip);

  await supabase
    .from("trips")
    .update({
      caption: newCaption,
      caption_facebook: newCaption,
      caption_instagram: null,
      caption_tiktok: null,
    })
    .eq("id", trip.id);

  await sendTextMessage(
    captainPhone,
    `📝 New caption for ${trip.boat}:\n\n"${newCaption}"\n\n` +
      `OK = Post it\n` +
      `EDIT = Write your own\n` +
      `NEW = Try again\n` +
      `SKIP = Don't post`
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
    `Skipped ${trip.boat} ${trip.trip_time}. You can approve it later from the dashboard.`
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
      "No pending batches. Type PROCESS first to prepare your photos, then you can set a caption."
    );
    return;
  }

  await supabase
    .from("trips")
    .update({
      caption,
      caption_facebook: caption,
      caption_instagram: caption,
      caption_tiktok: caption,
    })
    .eq("id", trip.id);

  await sendTextMessage(
    captainPhone,
    `Caption set for ${trip.boat}:\n\n"${caption}"\n\nOK = Post it\nSKIP = Don't post`
  );
}
