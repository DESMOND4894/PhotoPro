import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: tripId, photoId } = await params;

  // Auth check
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Verify the photo belongs to this trip
  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("id, trip_id, storage_path")
    .eq("id", photoId)
    .eq("trip_id", tripId)
    .single();

  if (photoError || !photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Delete from Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("photos")
    .remove([photo.storage_path]);

  if (storageError) {
    console.error(`Failed to delete photo from storage: ${storageError.message}`);
    // Continue with DB deletion even if storage fails
  }

  // Delete from photos table
  await supabase.from("photos").delete().eq("id", photoId);

  // Recompute trip photo_count and photo_urls
  const { data: remainingPhotos } = await supabase
    .from("photos")
    .select("public_url")
    .eq("trip_id", tripId)
    .order("uploaded_at", { ascending: true });

  const urls = remainingPhotos?.map((p) => p.public_url) || [];

  await supabase
    .from("trips")
    .update({
      photo_count: urls.length,
      photo_urls: urls,
    })
    .eq("id", tripId);

  return NextResponse.json({ success: true, remainingPhotos: urls.length });
}
