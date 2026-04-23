import { createServiceClient } from "@/lib/supabase/server";
import { downloadMedia, sendTextMessage } from "./client";
import { logWhatsAppMessage } from "./message-log";
import type { WhatsAppMessage, BoatName, TripTime } from "@/lib/types";
import { getBoatSlug } from "@/lib/types";
import { generateTripPublicSlug } from "@/lib/public-portal";

// Map the bot's Cloud API phone_number_id (which received the message) to a boat.
// Cloud API does not allow numbers to join consumer WhatsApp groups, so each boat
// has its own bot phone and the captain holds a 1:1 chat per boat. The receiving
// phone is the only reliable signal for which boat a message belongs to.
function getBoatForReceiver(receivingPhoneId: string): BoatName {
  if (receivingPhoneId === process.env.WHATSAPP_PHONE_NUMBER_ID_QUEST_IV) return "Celtic Quest IV";
  if (receivingPhoneId === process.env.WHATSAPP_PHONE_NUMBER_ID_GRACE) return "Celtic Grace";
  return "Celtic Quest IV";
}

function getCurrentTripTime(): TripTime {
  const hour = new Date().getHours();
  return hour < 13 ? "morning" : "afternoon";
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function handleIncomingPhoto(
  message: WhatsAppMessage,
  senderPhone: string,
  receivingPhoneId: string
): Promise<void> {
  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE?.trim();
  const supabase = createServiceClient();
  const boat = getBoatForReceiver(receivingPhoneId);

  // Log inbound photo
  await logWhatsAppMessage({
    direction: "inbound",
    senderPhone,
    messageType: "image",
    content: `Photo from ${boat}`,
    whatsappMessageId: message.id,
    mediaId: message.image?.id,
    isCaptain: senderPhone === captainPhone,
  });

  const mediaId = message.image!.id;
  const date = getTodayDate();
  const tripTime = getCurrentTripTime();

  // Get or create the trip record
  // First check for any existing trip (including skipped/posted) to avoid unique constraint violation
  const { data: existingTrip } = await supabase
    .from("trips")
    .select("*")
    .eq("boat", boat)
    .eq("date", date)
    .eq("trip_time", tripTime)
    .single();

  let tripId: string;

  if (existingTrip) {
    tripId = existingTrip.id;

    if (["posted", "skipped", "failed"].includes(existingTrip.status)) {
      // Old batch is done — reset and start fresh
      await supabase
        .from("posting_log")
        .delete()
        .eq("trip_id", tripId);

      await supabase
        .from("photos")
        .delete()
        .eq("trip_id", tripId);

      await supabase
        .from("trips")
        .update({
          status: "receiving",
          photo_urls: [],
          photo_count: 0,
          caption: null,
          caption_facebook: null,
          caption_instagram: null,
          caption_tiktok: null,
          batch_complete: false,
          approved_at: null,
          posted_to: [],
          public_enabled: true,
          public_slug: existingTrip.public_slug || generateTripPublicSlug(boat, date, tripTime),
          public_published_at: existingTrip.public_published_at || new Date().toISOString(),
        })
        .eq("id", tripId);
    }
    // "pending"/"approved"/"posting" — captain is reviewing, just add the photo
    // without resetting the trip. Don't nuke captions or status mid-review.
  } else {
    const { data: newTrip, error } = await supabase
      .from("trips")
      .insert({
        boat,
        date,
        trip_time: tripTime,
        status: "receiving",
        // Live portal: auto-publish to customer portal immediately
        public_enabled: true,
        public_slug: generateTripPublicSlug(boat, date, tripTime),
        public_published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error && error.code === "23505") {
      // Race condition: another request created the trip first — re-fetch
      const { data: refetched } = await supabase
        .from("trips")
        .select("*")
        .eq("boat", boat)
        .eq("date", date)
        .eq("trip_time", tripTime)
        .single();

      if (!refetched) throw new Error("Failed to fetch trip after unique constraint conflict");
      tripId = refetched.id;
    } else if (error) {
      throw new Error(`Failed to create trip: ${error.message}`);
    } else {
      tripId = newTrip.id;
    }
  }

  // Download the photo from WhatsApp
  const photoBuffer = await downloadMedia(mediaId);

  // Upload to Supabase Storage — use timestamp-based name to avoid race condition conflicts
  const boatSlug = getBoatSlug(boat);
  const photoTimestamp = Date.now();
  const storagePath = `photos/${date}/${boatSlug}/${tripTime}/photo-${photoTimestamp}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(storagePath, photoBuffer, {
      contentType: message.image!.mime_type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw new Error(`Failed to upload photo: ${uploadError.message}`);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("photos")
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Save photo record
  await supabase.from("photos").insert({
    trip_id: tripId,
    storage_path: storagePath,
    public_url: publicUrl,
    whatsapp_media_id: mediaId,
  });

  // Update trip record — recompute from photos table to avoid race conditions
  const { data: allPhotos } = await supabase
    .from("photos")
    .select("public_url")
    .eq("trip_id", tripId)
    .order("uploaded_at", { ascending: true });

  const updatedUrls = allPhotos?.map((p) => p.public_url) || [];

  await supabase
    .from("trips")
    .update({
      photo_count: updatedUrls.length,
      photo_urls: updatedUrls,
      last_photo_at: new Date().toISOString(),
      batch_complete: false,
    })
    .eq("id", tripId);

  console.log(
    `Photo ${updatedUrls.length} saved for ${boat} ${tripTime} trip (${tripId})`
  );

  // Only notify on the first photo — don't spam 20 messages for 20 photos
  if (senderPhone === captainPhone && updatedUrls.length === 1) {
    const slug = generateTripPublicSlug(boat, date, tripTime);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const portalLink = appUrl ? `\n🔗 ${appUrl}/photos/trips/${slug}` : "";
    await sendTextMessage(
      captainPhone,
      `📸 Photos coming in for ${boat} — live on customer portal now.${portalLink}\nType PROCESS when you're done sending.\nType HIDE to remove from portal.`,
      boat
    );
  }
}

export async function handleIncomingText(
  message: WhatsAppMessage,
  senderPhone: string,
  receivingPhoneId: string
): Promise<void> {
  const text = message.text?.body?.trim();
  if (!text) return;

  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE?.trim();
  const boat = getBoatForReceiver(receivingPhoneId);

  // Log inbound text
  await logWhatsAppMessage({
    direction: "inbound",
    senderPhone,
    messageType: "text",
    content: text,
    whatsappMessageId: message.id,
    isCaptain: senderPhone === captainPhone,
  });

  if (senderPhone === captainPhone) {
    const { handleCaptainResponse } = await import("./captain-handler");
    await handleCaptainResponse(text, senderPhone, boat);
    return;
  }
}

export async function handleIncomingReaction(
  message: WhatsAppMessage,
  senderPhone: string,
  receivingPhoneId: string
): Promise<void> {
  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE?.trim();
  const boat = getBoatForReceiver(receivingPhoneId);

  // Log inbound reaction
  await logWhatsAppMessage({
    direction: "inbound",
    senderPhone,
    messageType: "reaction",
    content: message.reaction?.emoji || "",
    whatsappMessageId: message.id,
    isCaptain: senderPhone === captainPhone,
  });

  if (senderPhone !== captainPhone) return;

  const emoji = message.reaction?.emoji;
  if (emoji === "✅") {
    // Approve reaction on a trip notification
    const { handleCaptainResponse } = await import("./captain-handler");
    await handleCaptainResponse("✅", senderPhone, boat);
  }
}
