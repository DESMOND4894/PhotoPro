import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to serve Supabase photos through our verified domain.
 * TikTok's Content Posting API requires URL ownership verification,
 * so we serve photos from our own domain instead of supabase.co.
 *
 * Usage: /api/photos/proxy?url=<encoded-supabase-url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow proxying from our Supabase storage bucket
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !url.startsWith(supabaseUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch photo" }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Photo proxy error:", err);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
