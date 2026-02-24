# Photo Pro — Stability Document

**Last updated: Feb 23, 2026 (Session 4)**
**Purpose: Prevent regressions. Read this BEFORE making any code changes.**

---

## GOLDEN RULES

1. **DO NOT add blocking/rejection logic to photo uploads.** Every photo must be accepted regardless of trip status. We learned this the hard way — three separate times.
2. **DO NOT add duplicate detection.** Removed by user request. The same photo may be sent multiple times intentionally.
3. **DO NOT enforce webhook signature verification.** It's log-only right now because neither META_APP_SECRET nor INSTAGRAM_APP_SECRET matches what Meta actually signs with. Blocking = all webhooks rejected = bot completely dead.
4. **Always update ALL caption fields together.** The system has `caption`, `caption_facebook`, `caption_instagram`, `caption_tiktok`. If you update one, update all of them. Facebook reads `caption_facebook` first, not `caption`.
5. **Test the FULL flow before deploying.** photo → PROCESS → EDIT → custom caption → OK → verify it posts with the custom caption.
6. **Clean the database after testing.** Stuck trips in "pending"/"approved"/"posting" status will block future tests.
7. **When committing, stage specific files only.** `git add <file1> <file2>` — NEVER `git add .` or `git add -A`. Verify with `git diff --cached --stat` before committing. A bad `git add` already destroyed 58 files once in this project.

---

## SESSION 4 FULL ACTIVITY LOG (Feb 23, 2026)

This session involved **9 surviving commits + 2 failed commits (reset) + 6 Vercel deployments + 3 database cleanups**. The git reflog shows 13 total git operations.

### Surviving Commits (in git history)

| Commit | What it did | Files touched |
|--------|------------|---------------|
| `0acc42f` | Initial bot: webhook, captain flow, Instagram, Facebook, dashboard | Everything |
| `1e7feec` | Storage bucket SQL | supabase/ |
| `2dbd58a` | Meta App Review: data deletion, Instagram webhook, support page | Pages, routes |
| `c18d093` | **BIG commit**: Security hardening, bug fixes, tests, logging | 26 files |
| `9ff67a6` | Webhook sig: try both META_APP_SECRET and INSTAGRAM_APP_SECRET | route.ts |
| `d64a402` | Webhook sig: changed to log-only (stop blocking all webhooks) | route.ts |
| `c5b6268` | **Caption fix**: custom captions now write to ALL platform fields | captain-handler, instagram, tiktok |
| `c09db61` | Removed duplicate photo detection entirely | webhook-handler |
| `b58f5a9` | Removed photo blocking logic, added "okay" + ✅ to approval | webhook-handler, captain-handler |

### Failed Commits (reset with `git reset HEAD~1`)

| Reflog | What happened | Why it was reset |
|--------|--------------|-----------------|
| `9c2b7d9` | First attempt at big commit | `git add` staged deletions of ALL 58 files |
| `6a5a991` | First attempt at webhook sig fix | Same `git add` issue — 69 file deletions |

### Vercel Deployments (~6 total)

1. After `c18d093` — Deployed big commit. **Broke the bot** (signature verification blocking webhooks)
2. After `9ff67a6` — Tried both secrets. **Still broken** (neither secret matched)
3. After `d64a402` — Made sig log-only. **Bot started receiving messages again**
4. After `c5b6268` — Caption fix. **Custom captions now publish correctly**
5. After `c09db61` — Removed duplicate detection. **Photos no longer rejected as dupes**
6. After `b58f5a9` — Removed photo blocking. **Photos always accepted**

### Database Cleanups (via Supabase REST API)

1. Deleted Feb 24 morning trip stuck in "pending" with 0 photos
2. Patched Feb 23 afternoon trip from "posting" to "posted"
3. Patched Feb 24 morning trip from "posting" to correct state

### Timeline of What Broke and When

1. **Big commit deployed** → Bot completely dead (signature verification blocking all webhooks)
2. **Sig fix #1** → Still dead (wrong secret values)
3. **Sig fix #2 (log-only)** → Bot receives messages again
4. **User tests caption flow** → Custom caption ignored (publishing old AI caption)
5. **Caption fix deployed** → Custom captions work
6. **User re-sends same photo** → "Duplicate detected" blocks it
7. **Duplicate detection removed** → Photo accepted
8. **User sends another photo** → "Already being processed" blocks it
9. **Photo blocking removed + DB cleanup** → Photos always accepted

---

## WHAT WORKS AND MUST NOT BE TOUCHED

### 1. Photo Upload Flow (webhook-handler.ts)
**Status: WORKING. DO NOT ADD BLOCKING LOGIC.**

Current behavior:
- Photo arrives → find or create trip
- If trip is "posted"/"skipped"/"failed" → reset to "receiving" (new batch)
- If trip is ANY other status → just add the photo (no blocking)
- Download from WhatsApp → upload to Supabase Storage → save record → recompute photo_urls
- Send captain a confirmation message

### 2. Captain Command Matching (captain-handler.ts)
**Status: WORKING. Commands are case-insensitive.**

| Command | Action |
|---------|--------|
| process, ready, post | Generate AI caption, move to "pending" |
| ok, okay, approve, yes, go, ✅ | Approve latest pending trip |
| ok all, approve all | Approve all pending trips |
| edit | Prompt for custom caption |
| new, redo | Regenerate AI caption |
| skip, no, pass | Skip the trip |
| status | Show queue |
| *(anything else)* | Set as custom caption |

### 3. Custom Caption Flow (captain-handler.ts)
**Status: FIXED in c5b6268. DO NOT CHANGE THE FIELD LIST.**

When user types a custom caption, ALL fields are updated:
```
caption = custom text
caption_facebook = custom text
caption_instagram = custom text
caption_tiktok = custom text
```

When PROCESS generates AI caption:
```
caption = AI text
caption_facebook = AI text
caption_instagram = null (platform will generate variant)
caption_tiktok = null (platform will generate variant)
```

### 4. Caption Fallback Chains (social/*.ts)
**Status: FIXED in c5b6268. These chains are correct.**

- **Facebook**: `caption_facebook || caption || ""`
- **Instagram**: `caption_instagram || caption || generatePlatformVariant()`
- **TikTok**: `caption_tiktok || caption || generatePlatformVariant()`

### 5. Webhook Signature Verification (route.ts)
**Status: LOG-ONLY. DO NOT MAKE IT BLOCKING.**

Tries META_APP_SECRET then INSTAGRAM_APP_SECRET. If both fail, logs a warning but processes the webhook anyway. Will enforce once the correct secret is confirmed.

### 6. Trip Reset on New Batch (webhook-handler.ts)
**Status: WORKING.**

When a photo arrives for a "posted"/"skipped"/"failed" trip, it resets:
```
status → "receiving"
photo_urls → []
photo_count → 0
caption, caption_facebook, caption_instagram, caption_tiktok → null
batch_complete → false
approved_at → null
posted_to → []
```

### 7. Publishing Cron (cron/publish/route.ts)
**Status: WORKING.**

- Runs every 5 min via Vercel cron
- Also triggered immediately when captain approves (fire-and-forget)
- Processes each platform independently (one failure doesn't stop others)
- Trip goes to "posted" when all platforms done, "failed" if any failed

---

## KNOWN ISSUES (Not fixed yet)

1. **Webhook signature verification is disabled.** Both META_APP_SECRET and INSTAGRAM_APP_SECRET fail to match Meta's signatures. Need to verify the correct App Secret from Meta Developer Dashboard and update Vercel env vars.

2. **Trip time boundary.** If photos are sent around 1:00 PM, some may go to "morning" trip and some to "afternoon" trip. The cutoff is `hour < 13`.

3. **Dashboard reported broken.** User said "nothing works on the dashboard" in an earlier session. Not investigated yet.

4. **Tokens expire.** WhatsApp access token expires in ~1-2 hours. Need to create a permanent System User token.

5. **Meta App Review not submitted.** App is in Development mode. Need to record screencast and write permission descriptions.

---

## DATABASE STATE

After Session 4 cleanup:
- Feb 24 morning trip: **DELETED** (was stuck in "pending" with 0 photos)
- Feb 23 afternoon: "posted", 10 photos
- Feb 23 morning: "skipped", 2 photos
- Feb 22 afternoon: "skipped", 1 photo

**If testing gets stuck:** Query and delete/reset trips via Supabase REST API:
```bash
# Check current trips
curl "$SUPABASE_URL/rest/v1/trips?select=id,date,trip_time,status,photo_count&order=created_at.desc" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"

# Reset a stuck trip
curl -X PATCH "$SUPABASE_URL/rest/v1/trips?id=eq.TRIP_ID" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -d '{"status":"posted"}'

# Delete a trip (also delete its photos and posting_log first)
curl -X DELETE "$SUPABASE_URL/rest/v1/posting_log?trip_id=eq.TRIP_ID" ...
curl -X DELETE "$SUPABASE_URL/rest/v1/photos?trip_id=eq.TRIP_ID" ...
curl -X DELETE "$SUPABASE_URL/rest/v1/trips?id=eq.TRIP_ID" ...
```

---

## GIT SAFETY

**CRITICAL: Stage specific files only.**
```bash
# CORRECT:
git add src/lib/whatsapp/captain-handler.ts src/lib/social/instagram.ts
git diff --cached --stat  # VERIFY before committing
git commit -m "message"

# WRONG (has deleted files before):
git add .
git add -A
```

**After committing, always verify:**
```bash
git show --stat HEAD  # Should show only the files you intended
```

---

## DEPLOYMENT

Push doesn't always trigger Vercel deploy. Force with:
```bash
vercel --prod
```

After deploy, verify it's live:
```bash
vercel inspect <deployment-url>
```
