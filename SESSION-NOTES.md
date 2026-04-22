# Photo Pro — Session Notes (Updated Feb 23, 2026 — Session 3)

## What Photo Pro Is
Internal WhatsApp photo bot for Celtic Quest Fishing Fleet. Crew sends fishing trip photos via WhatsApp, captain approves via WhatsApp, photos auto-publish to Instagram + Facebook with AI-generated captions.

## What's Built & Deployed
- WhatsApp webhook + bot at `/api/webhooks/whatsapp`
- Captain approval flow via WhatsApp text commands (PROCESS, OK, EDIT, SKIP, STATUS)
- AI caption generation via Anthropic API
- Dashboard at https://photo-pro-mu.vercel.app (has bugs — needs fixing)
- Instagram publishing code (`src/lib/social/instagram.ts`)
- Facebook publishing code (`src/lib/social/facebook.ts`)
- Cron jobs: batch-complete (1min), publish (5min), purge (daily)
- Privacy, Terms, Support pages
- Data deletion endpoint + status page
- Instagram webhook endpoint
- Supabase database + storage
- Deployed on Vercel

---

## Current Status: WEBHOOKS WORKING — READY FOR FULL PIPELINE TEST

### The Problem (Sessions 1-2)
Meta stopped delivering WhatsApp webhooks after token expiration + Live/Development mode toggle cycle. Extensive debugging across sessions 1-2 couldn't resolve it.

### Session 3 — RESOLVED (Feb 23 evening)

**Root cause was a combination of:**
1. Meta webhook subscription in exponential backoff state from failures during token expiration
2. User's phone number was de-registered as a test recipient after the Live/Development mode toggle
3. Expired/wrong-scope access tokens used during earlier fix attempts

**What fixed it:**
1. Deleted webhook subscription entirely (nuclear reset to clear backoff state)
2. Re-created webhook subscription fresh
3. User re-verified their phone number as a test recipient in Meta Console
4. Fresh access token generated from WhatsApp > API Setup page (not Graph API Explorer — that only gives `public_profile` scope)
5. Updated token in both `.env.local` and Vercel env vars
6. Redeployed to Vercel

**Proof it works — inbound webhook received at 16:00:17 UTC:**
```json
{"from":"16317023350","text":{"body":"Hi there"},"type":"text"}
```

**Key learnings:**
- Status webhooks (sent/delivered/read) can work even when inbound message webhooks don't — they use different delivery paths
- Development mode requires phone numbers to be explicitly verified as test recipients (max 5)
- The Live/Development mode toggle resets test recipient verification
- Tokens from Graph API Explorer only have `public_profile` scope — must use WhatsApp > API Setup page
- Token expiry is ~1-2 hours (NOT 24 hours) — System User token recommended for permanence
- Shell quoting can mangle tokens with special characters (ZA, ZB, ZC patterns) — read from file instead

### Session 2 — Diagnostic Work (Feb 23 afternoon)
1. Deep web research on Meta webhook failures (3 parallel research agents)
2. Identified "Shadow Delivery" problem — RULED OUT (subscription was active)
3. Added comprehensive request logging to webhook POST handler
4. Created `/api/debug/webhook-status` diagnostic endpoint
5. Created `/api/debug/resubscribe` endpoint
6. Added `META_APP_SECRET`, `META_APP_ID`, `WABA_ID` to Vercel env vars
7. All subscription/token checks passed — mystery deepened
8. Sent test outgoing messages (worked) but no inbound webhooks received

---

## Code Changes Made (UNCOMMITTED — across sessions 1 & 2)

### `src/app/api/webhooks/whatsapp/route.ts` — Enhanced Logging (Session 2)
- Every POST now logs: timestamp, X-Hub-Signature-256, User-Agent, body preview
- Every GET now logs: verification attempt details
- Improved default message type logging (includes sender phone)

### `src/app/api/debug/webhook-status/route.ts` — NEW (Session 2)
- GET endpoint that checks WABA subscription, webhook field subscriptions, token validity
- Protected by CRON_SECRET bearer token
- Returns clear JSON diagnostic report

### `src/app/api/debug/resubscribe/route.ts` — NEW (Session 2)
- POST endpoint that re-subscribes WABA to app via Graph API
- Shows before/after state
- Protected by CRON_SECRET bearer token

### `src/lib/whatsapp/webhook-handler.ts` — Major Rewrite (Session 1)
- Photos now save silently with brief confirmation ("Photo X received for Celtic Quest IV. Type PROCESS when ready.")
- Captain text check moved BEFORE boat check (fixed bug where captain texts were saved as crew notes)
- Trip lookup filters by `["receiving", "pending"]` only (prevents reusing skipped/posted trips)

### `src/lib/whatsapp/captain-handler.ts` — Complete Rewrite
New "process"-based flow. Commands:
- **PROCESS / READY / POST**: Gather all "receiving" photos, generate AI caption, send for review
- **OK / APPROVE / YES / GO**: Approve latest pending batch
- **OK ALL / APPROVE ALL**: Approve all pending batches
- **EDIT / NEW / REDO**: Generate new AI caption
- **SKIP / NO / PASS**: Skip the batch
- **STATUS**: Show what's in the queue
- **Any other text**: Set as custom caption (asks for confirmation, doesn't auto-post)

### `src/lib/whatsapp/client.ts` — Updated
- sendCaptainNotification shows text commands instead of emojis

---

## Tokens & Credentials (Current)

### WhatsApp
- Phone Number ID: `1067239349796642`
- Test Phone Number: `+1 (555) 142-0958` ("Test Number")
- Captain Phone: `16317023350`
- Verify Token: `photopro-celtic-quest-2024`
- Access Token: Temporary, expires ~1-2 hours (NOT 24hrs as previously thought!)
- **Token must be refreshed frequently** from Meta Console > WhatsApp > API Setup
- **Recommended**: Create a System User token (permanent) instead

### Instagram / Facebook
- Page Access Token: Set (Instagram user token from Graph API Explorer)
- Instagram Business Account ID: `34067142812929141`
- Instagram App Secret: `74d7cd7265cdba8d833c2e924438fec1`
- Meta Page ID: `101274736607035`
- Instagram username: `celtic_quest_fleet`

### Meta App
- App ID: `25685444174460751`
- App Secret: `e3058db1a31a0c8e157693cf86446e12`
- WABA ID: `1451319923281075`
- App Mode: Development (Unpublished)

---

## Supabase Data
3 trips exist (all "skipped" from testing):
- Feb 23 afternoon: 3 photos
- Feb 23 morning: 2 photos
- Feb 22 afternoon: 1 photo

---

## Meta App Review — APPROVED (April 8, 2026)

Submitted and reviewed. Approved scopes: `pages_manage_posts`, `whatsapp_business_messaging`, `pages_show_list`, `instagram_content_publish`, `business_management`, `pages_read_engagement`, `instagram_basic`.

Rejected: `instagram_business_basic` (screencast mismatch). **Dropped — not needed.** The OAuth code in `src/lib/social/facebook-oauth.ts` only requests 4 scopes (`pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish`), none of which is `instagram_business_basic`. No endpoint in this repo calls anything requiring it. Do not resubmit.

### Scopes actually requested by the OAuth code (source of truth):
`pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`

### WhatsApp messaging scopes:
`whatsapp_business_messaging` — covered via the WhatsApp Business Platform app setup (separate from the OAuth flow).

---

## Second Boat Activation (Celtic Grace)

Code already supports two boats via `WHATSAPP_GROUP_CELTIC_QUEST_IV` and `WHATSAPP_GROUP_CELTIC_GRACE` env vars in `src/lib/whatsapp/webhook-handler.ts`. DB schema already accepts `Celtic Grace` in the `trips.boat` CHECK constraint. Both boats post to the shared Celtic Quest Facebook Page and Instagram account.

To activate Celtic Grace: create a WhatsApp group with the crew + bot number, send a test message, capture the group JID from the `whatsapp_messages` table (or dashboard), and set `WHATSAPP_GROUP_CELTIC_GRACE=<jid>` in Vercel production env. Both groups' JIDs are now required by `validateEnv()` so a missing one fails loud at boot.

---

## Key URLs
- App: https://photo-pro-mu.vercel.app
- Meta Developer Console: https://developers.facebook.com/apps/25685444174460751/
- WhatsApp Configuration: https://developers.facebook.com/apps/25685444174460751/whatsapp-business/wa-settings/
- WhatsApp API Setup: https://developers.facebook.com/apps/25685444174460751/whatsapp-business/wa-dev-console/
- Privacy: https://photo-pro-mu.vercel.app/privacy
- Terms: https://photo-pro-mu.vercel.app/terms
- Support: https://photo-pro-mu.vercel.app/support

## Git Info
- Branch: `claude/photo-pro-whatsapp-bot-Nuky7`
- Latest commit: `2dbd58a` (code changes are uncommitted)
- Modified files: `captain-handler.ts`, `webhook-handler.ts`, `client.ts`, `package.json`

---

## Dashboard Issues (User Reported)
User said "nothing works on the dashboard" and "it's kind of a mess." Needs investigation and fixes in a future session.

---

## New Debug Endpoints (Session 2)
- `/api/debug/webhook-status` — GET (requires `Authorization: Bearer {CRON_SECRET}`)
  - Checks WABA subscription, webhook fields, token validity
- `/api/debug/resubscribe` — POST (requires `Authorization: Bearer {CRON_SECRET}`)
  - Re-subscribes WABA to app via Graph API

## New Vercel Env Vars Added (Session 2)
- `META_APP_SECRET` = `e3058db1a31a0c8e157693cf86446e12`
- `META_APP_ID` = `25685444174460751`
- `WABA_ID` = `1451319923281075`

## Next Steps
1. **Test full photo flow**: Send a photo via WhatsApp → type PROCESS → review AI caption → type OK → verify publish to Instagram/Facebook
2. **Create System User token** (permanent, never expires) — current tokens expire in ~1-2 hours
3. Fix dashboard (user reported "nothing works on the dashboard")
4. Record screencast for Meta App Review
5. Write permission descriptions for all 11 permissions
6. Complete and submit Meta App Review
7. Commit all uncommitted code changes
