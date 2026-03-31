import { NextResponse } from "next/server";
import { getPublishedTripBySlug } from "@/lib/public-portal-data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const trip = await getPublishedTripBySlug(slug);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
