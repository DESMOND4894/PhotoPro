/**
 * Validate that required environment variables are set.
 * Call at the top of critical handlers (webhooks, cron) for clear error messages.
 */

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_PHONE_NUMBER_ID_QUEST_IV",
  "WHATSAPP_PHONE_NUMBER_ID_GRACE",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_CAPTAIN_PHONE",
  "META_APP_SECRET",
  "CRON_SECRET",
] as const;

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  return { valid: missing.length === 0, missing };
}
