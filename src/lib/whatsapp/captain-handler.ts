import { createServiceClient } from "@/lib/supabase/server";
import { sendTextMessage, sendPostingConfirmation } from "./client";
import type { Trip, BoatName } from "@/lib/types";
import { generateTripPublicSlug } from "@/lib/public-portal";
import { withSignoff } from "@/lib/brand";

// `currentBoat` is the boat whose chat the captain typed in (so generic replies
// come back through the same WhatsApp conversation). Trip-specific replies use
// `trip.boat` so each trip's confirmation lands in that trip's chat.
export async function handleCaptainResponse(
  text: string,
  captainPhone: string,
  currentBoat: BoatName
): Promise<void> {
  const supabase = createServiceClient();
  const normalizedText = text.trim().toLowerCase();

  // PROCESS — gather all "receiving" photos, generate caption, send for review
  if (normalizedText === "process" || normalizedText === "ready" || normalizedText === "post") {
    await processReceivingTrips(supabase, captainPhone, currentBoat);
    return;
  }

  // Approve all pending batches
  if (normalizedText === "ok all" || normalizedText === "approve all") {
    await approveAllPending(supabase, captainPhone, currentBoat);
    return;
  }

  // Approve the most recent pending batch
  if (normalizedText === "ok" || normalizedText === "okay" || normalizedText === "approve" || normalizedText === "yes" || normalizedText === "go" || normalizedText === "✅") {
    await approveLatestPending(supabase, captainPhone, currentBoat);
    return;
  }

  // EDIT / NEW / REDO — prompt to type a caption
  if (normalizedText === "edit" || normalizedText === "new" || normalizedText === "redo") {
    await sendTextMessage(captainPhone, "Type your caption and send it:", currentBoat);
    return;
  }

  // Skip the latest pending batch
  if (normalizedText === "skip" || normalizedText === "no" || normalizedText === "pass") {
    await skipLatestPending(supabase, captainPhone, currentBoat);
    return;
  }

  // HIDE — remove current trip from customer portal
  if (normalizedText === "hide" || normalizedText === "private") {
    await hideFromPortal(supabase, captainPhone, currentBoat);
    return;
  }

  // SHOW — re-enable current trip on customer portal
  if (normalizedText === "show" || normalizedText === "unhide") {
    await showOnPortal(supabase, captainPhone, currentBoat);
    return;
  }

  // STATUS — check what's in the queue
  if (normalizedText === "status") {
    await sendStatus(supabase, captainPhone, currentBoat);
    return;
  }

  // Any other text — treat as a custom caption (don't auto-post)
  await applyCustomCaption(supabase, captainPhone, text.trim(), currentBoat);
}

// Process all "receiving" trips — generate captions and move to "pending"
async function processReceivingTrips(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string,
  currentBoat: BoatName
): Promise<void> {
  const { data: receivingTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "receiving")
    .order("created_at", { ascending: false });

  if (!receivingTrips || receivingTrips.length === 0) {
    await sendTextMessage(captainPhone, "No photos waiting to be processed.", currentBoat);
    return;
  }

  for (const trip of receivingTrips as Trip[]) {
    await supabase
      .from("trips")
      .update({
        caption: null,
        caption_facebook: null,
        caption_instagram: null,
        caption_tiktok: null,
        status: "pending",
        batch_complete: true,
      })
      .eq("id", trip.id);

    await sendTextMessage(
      captainPhone,
      `📸 ${trip.boat} — ${trip.trip_time} trip\n` +
        `${trip.photo_count} photo${trip.photo_count > 1 ? "s" : ""} ready\n\n` +
        `Add a caption — type the words you want on the post and send them.\n\n` +
        `SKIP = Don't post`,
      trip.boat
    );
  }
}

async function sendStatus(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string,
  currentBoat: BoatName
): Promise<void> {
  const { data: receiving } = await supabase
    .from("trips")
    .select("boat, trip_time, photo_count, public_enabled")
    .eq("status", "receiving");

  const { data: pending } = await supabase
    .from("trips")
    .select("boat, trip_time, photo_count, public_enabled")
    .eq("status", "pending");

  let msg = "";

  if (receiving && receiving.length > 0) {
    msg += "📷 Photos waiting:\n";
    for (const t of receiving) {
      const portal = t.public_enabled ? "🌐" : "🔒";
      msg += `• ${t.boat} ${t.trip_time}: ${t.photo_count} photos ${portal}\n`;
    }
    msg += "\nType PROCESS when ready.\n\n";
  }

  if (pending && pending.length > 0) {
    msg += "📝 Ready for approval:\n";
    for (const t of pending) {
      const portal = t.public_enabled ? "🌐" : "🔒";
      msg += `• ${t.boat} ${t.trip_time}: ${t.photo_count} photos ${portal}\n`;
    }
    msg += "\nType OK to approve.";
  }

  if (!msg) {
    msg = "Nothing in the queue. Send some photos!";
  } else {
    msg += "\n\n🌐 = live on portal  🔒 = hidden";
  }

  await sendTextMessage(captainPhone, msg, currentBoat);
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
  captainPhone: string,
  currentBoat: BoatName
): Promise<void> {
  const trip = await getLatestPendingTrip(supabase);

  if (!trip) {
    await sendTextMessage(captainPhone, "No pending batches to approve. Type PROCESS first if you have photos waiting.", currentBoat);
    return;
  }

  if (!trip.caption || trip.caption.trim() === "") {
    await sendTextMessage(
      captainPhone,
      "Add a caption first — type the words you want on the post, then send OK.",
      currentBoat
    );
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
  captainPhone: string,
  currentBoat: BoatName
): Promise<void> {
  const { data: pendingTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!pendingTrips || pendingTrips.length === 0) {
    await sendTextMessage(captainPhone, "No pending batches to approve.", currentBoat);
    return;
  }

  const captioned = (pendingTrips as Trip[]).filter(
    (t) => t.caption && t.caption.trim() !== ""
  );

  if (captioned.length === 0) {
    await sendTextMessage(
      captainPhone,
      "Add a caption to each batch first — type the words you want on the post, then send OK ALL.",
      currentBoat
    );
    return;
  }

  for (const trip of captioned) {
    await approveTrip(supabase, trip);
  }

  const boatNames = captioned.map((t) => t.boat).join(" & ");
  const waiting = (pendingTrips as Trip[]).length - captioned.length;
  await sendTextMessage(
    captainPhone,
    `Approved! ${boatNames} posting now.` +
      (waiting > 0
        ? `\n\n${waiting} batch${waiting > 1 ? "es" : ""} still need a caption before posting.`
        : ""),
    currentBoat
  );
}

async function skipLatestPending(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string,
  currentBoat: BoatName
): Promise<void> {
  const trip = await getLatestPendingTrip(supabase);

  if (!trip) {
    await sendTextMessage(captainPhone, "No pending batches to skip.", currentBoat);
    return;
  }

  await supabase
    .from("trips")
    .update({ status: "skipped" })
    .eq("id", trip.id);

  await sendTextMessage(
    captainPhone,
    `Skipped ${trip.boat} ${trip.trip_time}. You can approve it later from the dashboard.`,
    trip.boat
  );
}

async function hideFromPortal(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string,
  currentBoat: BoatName
): Promise<void> {
  const { data: trip } = await supabase
    .from("trips")
    .select("id, boat, trip_time, public_enabled")
    .in("status", ["receiving", "pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!trip) {
    await sendTextMessage(captainPhone, "No active trip to hide.", currentBoat);
    return;
  }

  await supabase
    .from("trips")
    .update({ public_enabled: false })
    .eq("id", trip.id);

  await sendTextMessage(
    captainPhone,
    `🔒 Hidden from portal: ${trip.boat} ${trip.trip_time}. Photos are still saved — type SHOW to make it visible again.`,
    trip.boat as BoatName
  );
}

async function showOnPortal(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string,
  currentBoat: BoatName
): Promise<void> {
  const { data: trip } = await supabase
    .from("trips")
    .select("id, boat, trip_time, date, public_slug")
    .in("status", ["receiving", "pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!trip) {
    await sendTextMessage(captainPhone, "No active trip to show.", currentBoat);
    return;
  }

  const slug = trip.public_slug || generateTripPublicSlug(trip.boat, trip.date, trip.trip_time);
  await supabase
    .from("trips")
    .update({
      public_enabled: true,
      public_slug: slug,
      public_published_at: new Date().toISOString(),
    })
    .eq("id", trip.id);

  await sendTextMessage(
    captainPhone,
    `🌐 Now visible on portal: ${trip.boat} ${trip.trip_time}. Type HIDE to remove.`,
    trip.boat as BoatName
  );
}

async function applyCustomCaption(
  supabase: ReturnType<typeof createServiceClient>,
  captainPhone: string,
  caption: string,
  currentBoat: BoatName
): Promise<void> {
  const trip = await getLatestPendingTrip(supabase);

  if (!trip) {
    await sendTextMessage(
      captainPhone,
      "No pending batches. Type PROCESS first to prepare your photos, then you can set a caption.",
      currentBoat
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
    `Caption set for ${trip.boat}:\n\n"${withSignoff(caption)}"\n\nOK = Post it\nSKIP = Don't post`,
    trip.boat
  );
}
