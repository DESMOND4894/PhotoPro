import { NextRequest, NextResponse } from "next/server";

// Handle TikTok OAuth callback — exchange code for access token
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
    // Exchange code for access token
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
      return NextResponse.json({
        error: "Token exchange failed",
        detail: tokenData,
      }, { status: 400 });
    }

    // Show the token to the user so they can copy it
    // In production, you'd store this in the database instead
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>TikTok Connected</title></head>
      <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>TikTok Connected!</h1>
        <p>Copy the access token below and add it to your Vercel environment variables as <code>TIKTOK_ACCESS_TOKEN</code>.</p>
        <div style="background: #f0f0f0; padding: 16px; border-radius: 8px; word-break: break-all; margin: 16px 0;">
          <strong>Access Token:</strong><br/>
          <code id="token">${tokenData.access_token}</code>
        </div>
        <p><strong>Open ID:</strong> ${tokenData.open_id || "N/A"}</p>
        <p><strong>Scope:</strong> ${tokenData.scope || "N/A"}</p>
        <p><strong>Expires in:</strong> ${tokenData.expires_in ? Math.round(tokenData.expires_in / 3600) + " hours" : "N/A"}</p>
        ${tokenData.refresh_token ? `
        <div style="background: #f0f0f0; padding: 16px; border-radius: 8px; word-break: break-all; margin: 16px 0;">
          <strong>Refresh Token (save this too):</strong><br/>
          <code>${tokenData.refresh_token}</code>
        </div>
        <p><strong>Refresh expires in:</strong> ${tokenData.refresh_expires_in ? Math.round(tokenData.refresh_expires_in / 86400) + " days" : "N/A"}</p>
        ` : ""}
        <button onclick="navigator.clipboard.writeText(document.getElementById('token').textContent)" style="padding: 8px 16px; cursor: pointer;">
          Copy Token
        </button>
      </body>
      </html>
    `;

    const response = new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
    response.cookies.delete("tiktok_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("TikTok OAuth error:", message);
    return NextResponse.json({ error: "OAuth failed", detail: message }, { status: 500 });
  }
}
