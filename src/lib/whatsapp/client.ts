import type { WhatsAppSendMessagePayload, WhatsAppMediaResponse } from "./types";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

function getPhoneNumberId(): string {
  return process.env.WHATSAPP_PHONE_NUMBER_ID!;
}

function getAccessToken(): string {
  return process.env.WHATSAPP_ACCESS_TOKEN!;
}

async function whatsappFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${WHATSAPP_API_URL}/${getPhoneNumberId()}/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`WhatsApp API error [${response.status}]:`, error);
    throw new Error(`WhatsApp API error: ${response.status} — ${error}`);
  }

  return response;
}

export async function sendTextMessage(to: string, body: string): Promise<void> {
  const payload: WhatsAppSendMessagePayload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };

  await whatsappFetch("messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendInteractiveButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>
): Promise<void> {
  const payload: WhatsAppSendMessagePayload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply" as const,
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  };

  await whatsappFetch("messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function downloadMedia(mediaId: string): Promise<Buffer> {
  // Step 1: Get media URL
  const metaResponse = await fetch(
    `${WHATSAPP_API_URL}/${mediaId}`,
    {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }
  );

  if (!metaResponse.ok) {
    throw new Error(`Failed to get media URL: ${metaResponse.status}`);
  }

  const mediaInfo: WhatsAppMediaResponse = await metaResponse.json();

  // Step 2: Download the actual file
  const fileResponse = await fetch(mediaInfo.url, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (!fileResponse.ok) {
    throw new Error(`Failed to download media: ${fileResponse.status}`);
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function sendCaptainNotification(
  tripId: string,
  boat: string,
  tripTime: string,
  photoCount: number,
  caption: string
): Promise<void> {
  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE!;

  const message =
    `📸 ${boat} — ${tripTime.charAt(0).toUpperCase() + tripTime.slice(1)} Trip\n` +
    `${photoCount} photos ready to post\n\n` +
    `Caption:\n"${caption}"\n\n` +
    `Reply:\n` +
    `✅ = Approve & post all ${photoCount} photos\n` +
    `✏️ = Send me a new caption\n` +
    `⏭️ = Skip this batch\n\n` +
    `Trip ID: ${tripId.slice(0, 8)}`;

  await sendTextMessage(captainPhone, message);
}

export async function sendGroupConfirmation(
  groupJid: string,
  boat: string,
  photoCount: number
): Promise<void> {
  const message = `📸 ${photoCount} photos received for ${boat} ${
    new Date().getHours() < 13 ? "morning" : "afternoon"
  } trip. Generating caption…`;

  await sendTextMessage(groupJid, message);
}

export async function sendPostingConfirmation(
  to: string,
  boat: string,
  platforms: string[]
): Promise<void> {
  const platformList = platforms
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(", ");

  const message = `✅ ${boat} batch approved! Posting to ${platformList} now.`;
  await sendTextMessage(to, message);
}
