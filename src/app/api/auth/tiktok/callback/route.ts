import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Handle TikTok OAuth callback — exchange code for access token and store in DB
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: "User denied authorization", detail: error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No authorization code received" }, { status: 400 });
  }

  // Verify CSRF state
  const savedState = request.cookies.get("tiktok_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.json({ error: "State mismatch — try again" }, { status: 400 });
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return NextResponse.json({ error: "TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET not set" }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/tiktok/callback`;

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("TikTok token exchange failed:", tokenData);
      return NextResponse.json({ error: "Token exchange failed", detail: tokenData }, { status: 400 });
    }

    // Store tokens in social_connections table
    const supabase = createServiceClient();
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;
    const refreshExpiresAt = tokenData.refresh_expires_in
      ? new Date(Date.now() + tokenData.refresh_expires_in * 1000).toISOString()
      : null;

    await supabase.from("social_connections").upsert(
      {
        platform: "tiktok",
        platform_user_id: tokenData.open_id,
        platform_name: "TikTok",
        access_token: tokenData.access_token,
        token_expires_at: expiresAt,
        refresh_token: tokenData.refresh_token || null,
        refresh_token_expires_at: refreshExpiresAt,
        scopes: tokenData.scope ? tokenData.scope.split(",") : [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform,platform_user_id" }
    );

    const response = NextResponse.redirect(`${origin}/admin/connect?tiktok=connected`);
    response.cookies.delete("tiktok_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("TikTok OAuth error:", message);
    return NextResponse.json({ error: "OAuth failed", detail: message }, { status: 500 });
  }
}
