import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateEnv } from "@/lib/env";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env for each test
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123456");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "test-token");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "test-verify");
    vi.stubEnv("WHATSAPP_CAPTAIN_PHONE", "15551234567");
    vi.stubEnv("WHATSAPP_GROUP_CELTIC_QUEST_IV", "120363000000000000@g.us");
    vi.stubEnv("WHATSAPP_GROUP_CELTIC_GRACE", "120363000000000001@g.us");
    vi.stubEnv("META_APP_SECRET", "test-secret");
    vi.stubEnv("CRON_SECRET", "test-cron");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns valid when all required env vars are set", () => {
    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("reports missing env vars", () => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    vi.stubEnv("META_APP_SECRET", "");
    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("WHATSAPP_ACCESS_TOKEN");
    expect(result.missing).toContain("META_APP_SECRET");
  });
});
