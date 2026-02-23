import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Test the webhook signature verification logic directly
function verifyWebhookSignature(rawBody: string, signatureHeader: string, appSecret: string): boolean {
  if (!appSecret || !signatureHeader || signatureHeader === "none") {
    return false;
  }

  const expectedSignature =
    "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

describe("verifyWebhookSignature", () => {
  const APP_SECRET = "test-secret-123";

  function createValidSignature(body: string): string {
    return "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex");
  }

  it("accepts a valid signature", () => {
    const body = '{"object":"whatsapp_business_account"}';
    const signature = createValidSignature(body);
    expect(verifyWebhookSignature(body, signature, APP_SECRET)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const body = '{"object":"whatsapp_business_account"}';
    expect(verifyWebhookSignature(body, "sha256=invalid", APP_SECRET)).toBe(false);
  });

  it("rejects when signature header is missing", () => {
    expect(verifyWebhookSignature("{}", "none", APP_SECRET)).toBe(false);
    expect(verifyWebhookSignature("{}", "", APP_SECRET)).toBe(false);
  });

  it("rejects when app secret is empty", () => {
    const body = "test";
    const signature = createValidSignature(body);
    expect(verifyWebhookSignature(body, signature, "")).toBe(false);
  });

  it("rejects a modified body", () => {
    const originalBody = '{"original": true}';
    const signature = createValidSignature(originalBody);
    const tamperedBody = '{"original": false}';
    expect(verifyWebhookSignature(tamperedBody, signature, APP_SECRET)).toBe(false);
  });
});
