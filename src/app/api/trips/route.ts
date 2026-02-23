import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/trips — list trips, with optional filters
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const boat = searchParams.get("boat");
  const date = searchParams.get("date");
  const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
  const limit = Math.min(Math.max(rawLimit, 1), 100);

  let query = supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (boat) query = query.eq("boat", boat);
  if (date) query = query.eq("date", date);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trips: data });
}
