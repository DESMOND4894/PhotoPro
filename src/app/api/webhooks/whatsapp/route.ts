import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { WhatsAppWebhookPayload } from "@/lib/types";
import {
  handleIncomingPhoto,
  handleIncomingText,
  handleIncomingReaction,
} from "@/lib/whatsapp/webhook-handler";

// Allow up to 60s for webhook processing (AI caption generation can take time)
export const maxDuration = 60;

// Webhook verification (GET) — Meta sends this to verify your endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log(`[WEBHOOK GET] mode=${mode}, hasToken=${!!token}, hasChallenge=${!!challenge}`);

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WEBHOOK GET] Verification SUCCESS");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("[WEBHOOK GET] Verification FAILED — token mismatch or missing params");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Verify Meta webhook signature using HMAC-SHA256
function checkSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const expectedSignature =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  if (!signatureHeader || signatureHeader === "none") {
    console.error("[WEBHOOK] No signature header present");
    return false;
  }

  // Try META_APP_SECRET first, then fall back to INSTAGRAM_APP_SECRET
  // (both should be the same Meta App Secret, but allows for misconfiguration)
  const secrets = [
    { name: "META_APP_SECRET", value: process.env.META_APP_SECRET },
    { name: "INSTAGRAM_APP_SECRET", value: process.env.INSTAGRAM_APP_SECRET },
  ].filter((s) => !!s.value);

  if (secrets.length === 0) {
    console.error("[WEBHOOK] No app secret configured (need META_APP_SECRET or INSTAGRAM_APP_SECRET)");
    return false;
  }

  for (const secret of secrets) {
    if (checkSignature(rawBody, signatureHeader, secret.value!)) {
      console.log(`[WEBHOOK] Signature verified using ${secret.name}`);
      return true;
    }
  }

  console.error(`[WEBHOOK] Signature failed against ${secrets.map((s) => s.name).join(", ")}`);
  return false;
}

// Incoming messages (POST)
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const signature = request.headers.get("x-hub-signature-256") || "none";
  const userAgent = request.headers.get("user-agent") || "unknown";

  console.log(`[WEBHOOK POST] ${timestamp} | sig=${signature.slice(0, 20)}... | ua=${userAgent}`);

  try {
    const rawBody = await request.text();

    // Verify signature before processing — reject forged requests
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error(`[WEBHOOK POST] Signature verification FAILED at ${timestamp}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`[WEBHOOK POST] Signature verified. Body (${rawBody.length} chars): ${rawBody.slice(0, 500)}`);

    const payload: WhatsAppWebhookPayload = JSON.parse(rawBody);

    // Await processing so Vercel doesn't kill the function before completion.
    // Meta allows up to 20s before retrying, which is enough for AI caption generation.
    await processWebhook(payload);

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error(`[WEBHOOK POST] Processing error at ${timestamp}:`, error);
    // Still return 200 — Meta requires it to avoid infinite retries
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}

async function processWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
  if (payload.object !== "whatsapp_business_account") return;

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;

      const messages = change.value.messages;
      if (!messages) continue;

      for (const message of messages) {
        const senderPhone = message.from;
        // Group messages include a group ID in the context
        const groupId = message.context?.from;

        try {
          switch (message.type) {
            case "image":
              await handleIncomingPhoto(message, senderPhone, groupId);
              break;

            case "text":
              await handleIncomingText(message, senderPhone, groupId);
              break;

            case "reaction":
              await handleIncomingReaction(message, senderPhone);
              break;

            default:
              console.log(`[WEBHOOK] Ignoring message type: ${message.type} from ${senderPhone}`);
          }
        } catch (error) {
          console.error(
            `Error processing ${message.type} from ${senderPhone}:`,
            error
          );
        }
      }
    }
  }
}
