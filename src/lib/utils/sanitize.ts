/**
 * Sanitize API error messages to prevent token/secret leakage in logs.
 */
export function sanitizeApiError(error: string): string {
  return error
    .replace(/access_token=[^&\s"'}\]]+/gi, "access_token=REDACTED")
    .replace(/Bearer\s+[^\s"'}\]]+/gi, "Bearer REDACTED")
    .replace(/token=[^&\s"'}\]]+/gi, "token=REDACTED");
}
