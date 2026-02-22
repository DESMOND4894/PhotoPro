import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Meta Data Deletion Request Callback
// When a user removes the app, Meta POSTs a signed_request here.
// We must return a JSON with a status URL and confirmation code.
// Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 }
      );
    }

    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    if (!appSecret) {
      console.error("INSTAGRAM_APP_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Parse the signed request
    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data) {
      return NextResponse.json(
        { error: "Invalid signed_request" },
        { status: 400 }
      );
    }

    const userId = data.user_id;
    const confirmationCode = generateConfirmationCode();

    console.log(
      `Data deletion request for user ${userId}, confirmation: ${confirmationCode}`
    );

    // In a production app, you'd queue the actual deletion here.
    // For this internal tool, we log the request. Photos auto-purge after 30 days.

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://photo-pro-mu.vercel.app";
    const statusUrl = `${appUrl}/data-deletion?code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("Data deletion callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseSignedRequest(
  signedRequest: string,
  secret: string
): { user_id: string; algorithm: string; issued_at: number } | null {
  const [encodedSig, payload] = signedRequest.split(".", 2);

  if (!encodedSig || !payload) return null;

  // Decode the signature
  const sig = base64UrlDecode(encodedSig);

  // Verify the signature
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    console.error("Data deletion: signature verification failed");
    return null;
  }

  // Decode and parse the payload
  const decoded = base64UrlDecode(payload);
  return JSON.parse(decoded.toString("utf-8"));
}

function base64UrlDecode(str: string): Buffer {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64");
}

function generateConfirmationCode(): string {
  return `del_${crypto.randomBytes(16).toString("hex")}`;
}
