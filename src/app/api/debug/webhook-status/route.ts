import { NextRequest, NextResponse } from "next/server";

const GRAPH_API = "https://graph.facebook.com/v21.0";
const WABA_ID = process.env.WABA_ID;
const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;

export async function GET(request: NextRequest) {
  // Debug endpoints are opt-in in production
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!WABA_ID || !APP_ID || !APP_SECRET) {
    return NextResponse.json(
      { error: "Missing required env vars: WABA_ID, META_APP_ID, or META_APP_SECRET" },
      { status: 500 }
    );
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "WHATSAPP_ACCESS_TOKEN not set" }, { status: 500 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check 1: WABA-to-App subscription (the most common silent failure)
  try {
    const wabaRes = await fetch(`${GRAPH_API}/${WABA_ID}/subscribed_apps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const wabaData = await wabaRes.json();
    results.checks = {
      ...results.checks as object,
      waba_subscribed_apps: {
        status: wabaRes.ok ? "ok" : "error",
        http_status: wabaRes.status,
        data: wabaData,
        is_empty: Array.isArray(wabaData.data) && wabaData.data.length === 0,
        diagnosis: Array.isArray(wabaData.data) && wabaData.data.length === 0
          ? "PROBLEM: No apps subscribed to this WABA. Webhooks will NOT be delivered. Use /api/debug/resubscribe to fix."
          : "OK: App is subscribed to WABA.",
      },
    };
  } catch (err) {
    results.checks = {
      ...results.checks as object,
      waba_subscribed_apps: { status: "fetch_error", error: String(err) },
    };
  }

  // Check 2: App webhook subscriptions (field-level)
  try {
    const appToken = `${APP_ID}|${APP_SECRET}`;
    const subsRes = await fetch(`${GRAPH_API}/${APP_ID}/subscriptions?access_token=${appToken}`);
    const subsData = await subsRes.json();
    results.checks = {
      ...results.checks as object,
      app_webhook_subscriptions: {
        status: subsRes.ok ? "ok" : "error",
        http_status: subsRes.status,
        data: subsData,
      },
    };
  } catch (err) {
    results.checks = {
      ...results.checks as object,
      app_webhook_subscriptions: { status: "fetch_error", error: String(err) },
    };
  }

  // Check 3: Token validity
  try {
    const appToken = `${APP_ID}|${APP_SECRET}`;
    const debugRes = await fetch(
      `${GRAPH_API}/debug_token?input_token=${token}&access_token=${appToken}`
    );
    const debugData = await debugRes.json();
    const tokenData = debugData.data || {};
    results.checks = {
      ...results.checks as object,
      token_debug: {
        status: debugRes.ok ? "ok" : "error",
        is_valid: tokenData.is_valid,
        expires_at: tokenData.expires_at
          ? new Date(tokenData.expires_at * 1000).toISOString()
          : "unknown",
        scopes: tokenData.scopes,
        app_id: tokenData.app_id,
      },
    };
  } catch (err) {
    results.checks = {
      ...results.checks as object,
      token_debug: { status: "fetch_error", error: String(err) },
    };
  }

  // Check 4: Environment config
  results.checks = {
    ...results.checks as object,
    env_config: {
      has_access_token: !!process.env.WHATSAPP_ACCESS_TOKEN,
      has_verify_token: !!process.env.WHATSAPP_VERIFY_TOKEN,
      has_phone_number_id: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      has_captain_phone: !!process.env.WHATSAPP_CAPTAIN_PHONE,
      has_app_secret: !!APP_SECRET,
      has_waba_id: !!WABA_ID,
      has_app_id: !!APP_ID,
    },
  };

  return NextResponse.json(results, { status: 200 });
}
