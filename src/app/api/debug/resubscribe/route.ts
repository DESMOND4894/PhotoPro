import { NextRequest, NextResponse } from "next/server";

const GRAPH_API = "https://graph.facebook.com/v21.0";
const WABA_ID = process.env.WABA_ID;

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!WABA_ID) {
    return NextResponse.json({ error: "Missing required env var: WABA_ID" }, { status: 500 });
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "WHATSAPP_ACCESS_TOKEN not set" }, { status: 500 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // Step 1: Check current subscription state
  try {
    const checkRes = await fetch(`${GRAPH_API}/${WABA_ID}/subscribed_apps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkData = await checkRes.json();
    results.before = {
      status: checkRes.ok ? "ok" : "error",
      data: checkData,
    };
  } catch (err) {
    results.before = { status: "fetch_error", error: String(err) };
  }

  // Step 2: Re-subscribe WABA to app
  try {
    const subRes = await fetch(`${GRAPH_API}/${WABA_ID}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const subData = await subRes.json();
    results.subscribe = {
      status: subRes.ok ? "ok" : "error",
      http_status: subRes.status,
      data: subData,
      success: subData.success === true,
    };
  } catch (err) {
    results.subscribe = { status: "fetch_error", error: String(err) };
  }

  // Step 3: Verify subscription after re-subscribing
  try {
    const verifyRes = await fetch(`${GRAPH_API}/${WABA_ID}/subscribed_apps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyData = await verifyRes.json();
    results.after = {
      status: verifyRes.ok ? "ok" : "error",
      data: verifyData,
      is_subscribed: Array.isArray(verifyData.data) && verifyData.data.length > 0,
    };
  } catch (err) {
    results.after = { status: "fetch_error", error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
