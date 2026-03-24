import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildFacebookOAuthURL } from "@/lib/social/facebook-oauth";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/facebook/callback`;
  const state = randomBytes(32).toString("hex");

  const oauthUrl = buildFacebookOAuthURL(redirectUri, state);

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set("fb_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
