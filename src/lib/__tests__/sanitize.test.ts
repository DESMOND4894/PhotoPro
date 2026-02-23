import { describe, it, expect } from "vitest";
import { sanitizeApiError } from "@/lib/utils/sanitize";

describe("sanitizeApiError", () => {
  it("redacts access_token query parameters", () => {
    const error = 'Error: https://graph.facebook.com/v21.0/me?access_token=EAABsBCS1XYZ123&fields=id';
    const result = sanitizeApiError(error);
    expect(result).toContain("access_token=REDACTED");
    expect(result).not.toContain("EAABsBCS1XYZ123");
  });

  it("redacts Bearer tokens", () => {
    const error = 'Authorization: Bearer sk-ant-api03-abc123xyz';
    const result = sanitizeApiError(error);
    expect(result).toContain("Bearer REDACTED");
    expect(result).not.toContain("sk-ant-api03-abc123xyz");
  });

  it("redacts generic token parameters", () => {
    const error = 'Failed with token=mySecretToken123&other=value';
    const result = sanitizeApiError(error);
    expect(result).toContain("token=REDACTED");
    expect(result).not.toContain("mySecretToken123");
  });

  it("preserves non-sensitive content", () => {
    const error = "Instagram container processing failed with status 400";
    const result = sanitizeApiError(error);
    expect(result).toBe(error);
  });

  it("handles multiple tokens in one string", () => {
    const error = 'access_token=ABC123&token=DEF456 Bearer GHI789';
    const result = sanitizeApiError(error);
    expect(result).not.toContain("ABC123");
    expect(result).not.toContain("DEF456");
    expect(result).not.toContain("GHI789");
  });
});
