import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchUserInfo,
  fetchUserPages,
  fetchGrantedPermissions,
} from "@/lib/social/facebook-oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const origin = request.nextUrl.origin;

  // User denied permissions
  if (error) {
    return NextResponse.redirect(`${origin}/admin/connect?error=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/admin/connect?error=missing_params`);
  }

  // Verify CSRF state
  const savedState = request.cookies.get("fb_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    console.error("CSRF state mismatch", { savedState: !!savedState, stateParam: !!state });
    return NextResponse.redirect(`${origin}/admin/connect?error=invalid_state`);
  }

  try {
    const redirectUri = `${origin}/api/auth/facebook/callback`;
    console.log("OAuth callback: exchanging code, redirectUri:", redirectUri);

    // Exchange code for short-lived token
    const shortLived = await exchangeCodeForToken(code, redirectUri);

    // Exchange for long-lived token (60 days)
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    const userToken = longLived.access_token;
    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000).toISOString();

    // Fetch user info, pages, and permissions
    const [userInfo, pages, permissions] = await Promise.all([
      fetchUserInfo(userToken),
      fetchUserPages(userToken),
      fetchGrantedPermissions(userToken),
    ]);

    if (pages.length === 0) {
      return NextResponse.redirect(`${origin}/admin/connect?error=no_pages`);
    }

    const supabase = createServiceClient();

    // Store each page + its Instagram account
    for (const page of pages) {
      // Upsert Facebook Page connection
      await supabase.from("social_connections").upsert(
        {
          platform: "facebook",
          platform_user_id: page.id,
          platform_name: page.name,
          access_token: page.access_token,
          token_expires_at: expiresAt,
          page_id: page.id,
          ig_account_id: page.instagram_business_account?.id || null,
          scopes: permissions,
          connected_by_name: userInfo.name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "platform,platform_user_id" }
      );

      // If page has Instagram Business account, upsert that too
      if (page.instagram_business_account?.id) {
        await supabase.from("social_connections").upsert(
          {
            platform: "instagram",
            platform_user_id: page.instagram_business_account.id,
            platform_name: `${page.name} (Instagram)`,
            access_token: userToken, // Instagram uses user token
            token_expires_at: expiresAt,
            page_id: page.id,
            ig_account_id: page.instagram_business_account.id,
            scopes: permissions,
            connected_by_name: userInfo.name,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "platform,platform_user_id" }
        );
      }
    }

    // Clear the CSRF cookie
    const response = NextResponse.redirect(`${origin}/admin/connect?success=true`);
    response.cookies.delete("fb_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Facebook OAuth callback error:", message);
    return NextResponse.redirect(`${origin}/admin/connect?error=exchange_failed&detail=${encodeURIComponent(message)}`);
  }
}
