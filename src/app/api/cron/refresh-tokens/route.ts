import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Cron job: Refresh TikTok access tokens before they expire.
 * Runs every 12 hours via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return NextResponse.json({ error: "TikTok client credentials not set" }, { status: 500 });
  }

  // Find TikTok connections with refresh tokens
  const { data: connections } = await supabase
    .from("social_connections")
    .select("*")
    .eq("platform", "tiktok")
    .not("refresh_token", "is", null);

  if (!connections || connections.length === 0) {
    return NextResponse.json({ refreshed: 0, message: "No TikTok connections with refresh tokens" });
  }

  let refreshed = 0;

  for (const conn of connections) {
    try {
      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: conn.refresh_token,
        }),
      });

      const data = await res.json();

      if (data.error || !data.access_token) {
        console.error(`[REFRESH] TikTok refresh failed for ${conn.platform_user_id}:`, data);
        continue;
      }

      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null;
      const refreshExpiresAt = data.refresh_expires_in
        ? new Date(Date.now() + data.refresh_expires_in * 1000).toISOString()
        : null;

      await supabase
        .from("social_connections")
        .update({
          access_token: data.access_token,
          token_expires_at: expiresAt,
          refresh_token: data.refresh_token || conn.refresh_token,
          refresh_token_expires_at: refreshExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conn.id);

      refreshed++;
      console.log(`[REFRESH] TikTok token refreshed for ${conn.platform_user_id}`);
    } catch (err) {
      console.error(`[REFRESH] Error refreshing TikTok token:`, err);
    }
  }

  return NextResponse.json({ refreshed });
}
