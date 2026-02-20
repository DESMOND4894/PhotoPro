import { createServiceClient } from "@/lib/supabase/server";
import { downloadMedia, sendGroupConfirmation } from "./client";
import type { WhatsAppMessage, BoatName, TripTime } from "@/lib/types";
import { getBoatSlug } from "@/lib/types";
import { computeImageHash } from "@/lib/duplicate-detection";

// Map WhatsApp group JIDs to boat names (configured via env)
function getBoatForSender(from: string): BoatName | null {
  const questGroup = process.env.WHATSAPP_GROUP_CELTIC_QUEST_IV;
  const graceGroup = process.env.WHATSAPP_GROUP_CELTIC_GRACE;

  if (questGroup && from === questGroup) return "Celtic Quest IV";
  if (graceGroup && from === graceGroup) return "Celtic Grace";

  // For 1:1 messages, check if it's a known crew number
  // This allows crew to send photos directly to the bot number
  return null;
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
  groupId?: string
): Promise<void> {
  const supabase = createServiceClient();
  const boat = getBoatForSender(groupId || senderPhone);

  if (!boat) {
    console.log(`Unknown sender/group: ${groupId || senderPhone}, ignoring photo`);
    return;
  }

  const mediaId = message.image!.id;
  const date = getTodayDate();
  const tripTime = getCurrentTripTime();

  // Get or create the trip record
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
  } else {
    const { data: newTrip, error } = await supabase
      .from("trips")
      .insert({
        boat,
        date,
        trip_time: tripTime,
        status: "receiving",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create trip: ${error.message}`);
    tripId = newTrip.id;
  }

  // Download the photo from WhatsApp
  const photoBuffer = await downloadMedia(mediaId);

  // Compute image hash for duplicate detection
  const imageHash = computeImageHash(photoBuffer);

  // Check for duplicates
  const { data: existingPhoto } = await supabase
    .from("photos")
    .select("id")
    .eq("trip_id", tripId)
    .eq("image_hash", imageHash)
    .single();

  if (existingPhoto) {
    console.log(`Duplicate photo detected for trip ${tripId}, skipping`);
    return;
  }

  // Upload to Supabase Storage
  const boatSlug = getBoatSlug(boat);
  const photoNumber = (existingTrip?.photo_count || 0) + 1;
  const storagePath = `photos/${date}/${boatSlug}/${tripTime}/photo-${String(photoNumber).padStart(3, "0")}.jpg`;

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
    image_hash: imageHash,
    is_duplicate: false,
  });

  // Update trip record
  const { data: currentTrip } = await supabase
    .from("trips")
    .select("photo_count, photo_urls")
    .eq("id", tripId)
    .single();

  const updatedUrls = [...(currentTrip?.photo_urls || []), publicUrl];

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
}

export async function handleIncomingText(
  message: WhatsAppMessage,
  senderPhone: string,
  groupId?: string
): Promise<void> {
  const supabase = createServiceClient();
  const text = message.text?.body?.trim();
  if (!text) return;

  // Check if this is from a group (crew note)
  const boat = getBoatForSender(groupId || senderPhone);
  if (boat) {
    // Crew note: attach to current trip
    const date = getTodayDate();
    const tripTime = getCurrentTripTime();

    await supabase
      .from("trips")
      .update({
        crew_notes: text,
      })
      .eq("boat", boat)
      .eq("date", date)
      .eq("trip_time", tripTime);

    console.log(`Crew note saved for ${boat}: "${text}"`);
    return;
  }

  // Check if this is from the captain (approval flow)
  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE;
  if (senderPhone === captainPhone) {
    const { handleCaptainResponse } = await import("./captain-handler");
    await handleCaptainResponse(text, senderPhone);
    return;
  }
}

export async function handleIncomingReaction(
  message: WhatsAppMessage,
  senderPhone: string
): Promise<void> {
  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE;
  if (senderPhone !== captainPhone) return;

  const emoji = message.reaction?.emoji;
  if (emoji === "✅") {
    // Approve reaction on a trip notification
    const { handleCaptainResponse } = await import("./captain-handler");
    await handleCaptainResponse("✅", senderPhone);
  }
}
