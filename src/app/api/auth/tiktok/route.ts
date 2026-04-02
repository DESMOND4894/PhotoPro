import { NextRequest, NextResponse } from "next/server";

// Start TikTok OAuth flow — redirects to TikTok authorization page
export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) {
    return NextResponse.json({ error: "TIKTOK_CLIENT_KEY not set" }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/tiktok/callback`;
  const state = crypto.randomUUID();
  const scopes = "user.info.basic,video.upload";

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url.toString());
  response.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    path: "/",
  });

  return response;
}
