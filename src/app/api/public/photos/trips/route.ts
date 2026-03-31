import { NextResponse } from "next/server";
import { listPublishedTrips } from "@/lib/public-portal-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trips = await listPublishedTrips(18);
    return NextResponse.json({ trips });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load trips";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
