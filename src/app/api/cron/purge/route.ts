import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const PURGE_DAYS = 30;

/**
 * Cron job: Auto-purge photos older than 30 days from Supabase storage.
 * Run daily via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoffDate = new Date(
    Date.now() - PURGE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Find photos older than 30 days from posted trips
  const { data: oldPhotos, error } = await supabase
    .from("photos")
    .select("id, storage_path, trip_id")
    .lt("uploaded_at", cutoffDate);

  if (error) {
    console.error("Purge query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!oldPhotos || oldPhotos.length === 0) {
    return NextResponse.json({ purged: 0 });
  }

  // Delete from storage in batches of 100
  const storagePaths = oldPhotos.map((p) => p.storage_path);
  let purged = 0;

  for (let i = 0; i < storagePaths.length; i += 100) {
    const batch = storagePaths.slice(i, i + 100);
    const { error: deleteError } = await supabase.storage
      .from("photos")
      .remove(batch);

    if (deleteError) {
      console.error("Storage delete error:", deleteError);
    } else {
      purged += batch.length;
    }
  }

  // Remove photo records from database
  const photoIds = oldPhotos.map((p) => p.id);
  await supabase.from("photos").delete().in("id", photoIds);

  // Clear photo_urls from trips that had photos purged
  const affectedTripIds = [...new Set(oldPhotos.map((p) => p.trip_id))];
  for (const tripId of affectedTripIds) {
    await supabase
      .from("trips")
      .update({ photo_urls: [] })
      .eq("id", tripId);
  }

  console.log(`Purged ${purged} photos older than ${PURGE_DAYS} days`);
  return NextResponse.json({ purged });
}
