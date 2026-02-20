import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateCaption } from "@/lib/ai/caption-generator";
import type { Trip } from "@/lib/types";

// POST /api/trips/[id]/caption — regenerate caption
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  const { data: trip, error } = await serviceClient
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const newCaption = await generateCaption(trip as Trip);

  await serviceClient
    .from("trips")
    .update({ caption: newCaption })
    .eq("id", id);

  return NextResponse.json({ caption: newCaption });
}
