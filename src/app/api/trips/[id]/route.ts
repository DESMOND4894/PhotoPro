import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/trips/[id] — get a single trip with photos
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("trip_id", id)
    .eq("is_duplicate", false)
    .order("uploaded_at", { ascending: true });

  const { data: postingLog } = await supabase
    .from("posting_log")
    .select("*")
    .eq("trip_id", id);

  return NextResponse.json({ trip, photos: photos || [], postingLog: postingLog || [] });
}

// PATCH /api/trips/[id] — update trip (caption, status, platforms)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const allowedFields = [
    "caption",
    "caption_facebook",
    "caption_instagram",
    "caption_tiktok",
    "status",
    "platforms_enabled",
    "public_enabled",
    "public_slug",
    "public_published_at",
    "public_cover_photo_id",
    "public_title",
    "public_subtitle",
    "public_crew_note",
    "show_public_crew_note",
    "public_review_url",
    "public_tag_us_text",
    "public_tag_us_url",
    "public_book_again_url",
    "public_copy_caption",
    "public_copy_hashtags",
    "featured_photo_ids",
    "public_species_tags",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("trips")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trip: data });
}

// DELETE /api/trips/[id] — delete trip and related records
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete related records first (foreign key constraints)
  await supabase.from("posting_log").delete().eq("trip_id", id);
  await supabase.from("photos").delete().eq("trip_id", id);
  const { error } = await supabase.from("trips").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
