# PhotoPro Auto-Send Gallery Links - Claude Code Build Prompt

*Prepared for Capt Des O'Sullivan / Celtic Quest Fishing Fleet*  
*Created: May 07, 2026*  
*Target repo: `DESMOND4894/PhotoPro`*  
*Related repo: `DESMOND4894/cqreservationsystem`*

---

## Executive Summary

This is the implementation prompt for adding a Picsaurus-style feature to PhotoPro:

> After a trip gallery is approved and published, Celtic Quest can text every eligible customer/passenger attached to that trip with the public gallery link.

The recommendation is **not** to replace PhotoPro. Keep PhotoPro, then add this missing auto-send/delivery feature.

---

## What We Already Have

### PhotoPro

- WhatsApp/photo bot intake.
- Trip grouping by boat, date, and morning/afternoon.
- Public gallery portal.
- Published trip URLs like `/photos/trips/[slug]`.
- Approval/publishing flow.

### CQ Reservation System

- Trip schedules.
- Bookings/customers.
- Customer phone numbers.
- Existing Twilio SMS function.
- Existing SMS logs.
- Existing blast-by-schedule behavior.

---

## Main Missing Piece

The missing bridge is connecting:

1. A PhotoPro public gallery trip.
2. The matching CQ Reservation System trip schedule.
3. The customers/bookings attached to that schedule.
4. A safe SMS send/logging workflow.

---

## Recommended MVP

Build this as a **manual admin-confirmed send first**, not full automation on day one.

1. Admin approves/publishes gallery.
2. Admin sees matched reservation trip.
3. Admin clicks **Send Gallery to Passengers**.
4. System shows a dry-run preview.
5. Admin confirms.
6. SMS goes out once per eligible booking/customer.
7. Every result is logged.

---

## Actual Prompt To Copy/Paste Into Claude Code

```text
You are Claude Code working in the PhotoPro repository for Celtic Quest.

MISSION
Build a safe MVP for automatically sending public trip gallery links to passengers/customers after a PhotoPro trip gallery is approved and published.

BUSINESS CONTEXT
Celtic Quest already has two systems:
1. PhotoPro: WhatsApp/photo intake, trip grouping, public photo gallery publishing.
2. CQ Reservation System: bookings, customers, trip schedules, Twilio SMS, SMS logs.

The goal is NOT to replace PhotoPro with Picsaurus. The goal is to copy the best Picsaurus feature: after a trip, every customer attached to the trip gets a text with the gallery link.

KNOWN REPOS
- PhotoPro repo: DESMOND4894/PhotoPro
- CQ Reservation System repo: DESMOND4894/cqreservationsystem

KNOWN LIVE PHOTO PORTAL
- https://photo-pro-mu.vercel.app/photos
- Example gallery URL shape: https://photo-pro-mu.vercel.app/photos/trips/2026-04-28-celtic-grace-afternoon

CURRENT PHOTOPRO FACTS TO VERIFY IN CODE
PhotoPro trips already appear to have:
- public_enabled
- public_slug
- public_published_at
- public_cover_photo_id
- public_title
- public_subtitle
- public_review_url
- public_book_again_url

The public gallery route appears to be:
- /photos/trips/[slug]

The trip approval flow likely sets:
- public_enabled = true
- public_slug
- public_published_at

Do not assume this blindly. Verify before editing.

CURRENT CQ RESERVATION SYSTEM FACTS TO VERIFY IN CODE
The private CQ Reservation System already has a Supabase Edge Function:
- supabase/functions/send-sms/index.ts

That function already supports blast SMS by schedule:
- request body includes scheduleId
- isBlast: true
- optional bookingIds
- optional customMessage

It fetches bookings by trip_schedule_id, joins customers, sends Twilio SMS, and writes sms_logs.

Relevant tables from prior schema review:
- trip_schedules
- bookings
- customers
- sms_templates
- sms_logs
- scheduled_emails
- review_requests

Do not expose secrets. If you inspect env files or config, never print credentials.

FEATURE TO BUILD
Add a PhotoPro admin workflow that lets staff send the public gallery link to all eligible customers on the matching CQ Reservation trip schedule.

MVP REQUIREMENTS
1. Add a durable mapping between a PhotoPro trip and a CQ Reservation trip schedule.
   Preferred field on PhotoPro trips:
   - cq_trip_schedule_id UUID NULL

2. Add safe trip matching.
   Use automatic matching where possible:
   - boat name
   - trip date
   - morning/afternoon or start_time window

   If matching is ambiguous or missing, provide manual admin selection/confirmation.

3. Add a manual admin button first.
   Button label:
   - Send Gallery to Passengers

   Do not make the first version fully automatic. First version should be admin-confirmed.

4. Add dry-run preview before sending.
   Show:
   - matched reservation trip
   - total bookings found
   - customers with valid phone numbers
   - skipped records
   - already-sent records
   - exact SMS preview

5. Add duplicate protection.
   A customer/booking must not be texted twice for the same PhotoPro trip unless an admin explicitly chooses resend failed.

6. Add/send via the existing Twilio path.
   Prefer creating a new CQ Reservation System Supabase Edge Function:
   - send-photo-gallery-link

   This function should reuse the existing phone formatting, Twilio send, and logging approach from send-sms.

7. Log every send.
   Add a dedicated table if needed:
   - photo_gallery_sends

   Suggested fields:
   - id
   - photo_pro_trip_id
   - trip_schedule_id
   - booking_id
   - customer_id
   - recipient_phone
   - gallery_url
   - channel
   - status
   - twilio_message_sid
   - error_message
   - sent_at
   - created_at

   Add a unique constraint to prevent duplicate sends:
   - photo_pro_trip_id + booking_id + channel

8. Do not send unless the gallery is actually public.
   Required checks:
   - public_enabled is true
   - public_slug exists
   - public_published_at exists
   - photo_count > 0 or photos exist

9. SMS message copy.
   Use this first:
   Hi {{first_name}}, thanks for joining Celtic Quest today! Your trip photos are ready: {{gallery_url}}
   Download, share, and tag us. Reply STOP to unsubscribe.

10. Compliance basics.
   Include STOP language.
   Respect existing opt-out/do-not-text fields if present.
   Do not send promotional language in this message.
   Treat it as transactional post-trip media delivery.

SUGGESTED ARCHITECTURE
PhotoPro is the source of truth for gallery publication.
CQ Reservation System is the source of truth for bookings, customers, phone numbers, and Twilio.

Flow:
1. Crew sends photos through WhatsApp.
2. PhotoPro groups photos by boat/date/time.
3. Admin approves the trip gallery.
4. PhotoPro publishes the public gallery.
5. Admin clicks Send Gallery to Passengers.
6. PhotoPro calls CQ Reservation System function with:
   - tripScheduleId
   - photoProTripId
   - galleryUrl
   - dryRun or send mode
7. CQ Reservation System looks up eligible bookings/customers.
8. CQ Reservation System sends SMS through Twilio.
9. CQ Reservation System logs result per booking.
10. PhotoPro displays send summary.

IMPLEMENTATION STEPS
Step 1: Inspect both repos.
- Confirm PhotoPro trip schema/migrations.
- Confirm approval route.
- Confirm public gallery URL builder.
- Confirm dashboard trip detail/admin UI.
- Confirm CQ Reservation send-sms function and booking schema.

Step 2: Add database migrations.
In PhotoPro:
- Add cq_trip_schedule_id to trips if this is the chosen mapping location.
- Optional: add cq_trip_schedule_match_status and cq_trip_schedule_match_notes if useful.

In CQ Reservation System:
- Add photo_gallery_sends table.
- Add unique constraint for duplicate protection.

Step 3: Build CQ Edge Function.
Create:
- supabase/functions/send-photo-gallery-link/index.ts

Input schema:
{
  "tripScheduleId": "uuid",
  "photoProTripId": "uuid or string",
  "galleryUrl": "https URL",
  "dryRun": true,
  "resendFailed": false
}

Output:
{
  "success": true,
  "dryRun": true,
  "matchedBookings": 30,
  "validPhones": 27,
  "alreadySent": 0,
  "skipped": 3,
  "sent": 0,
  "failed": 0,
  "results": []
}

Step 4: Build PhotoPro API route.
Suggested route:
- POST /api/trips/[id]/send-gallery-link

Responsibilities:
- validate admin/session if auth exists
- load trip
- confirm public gallery is ready
- build gallery URL
- resolve or require cq_trip_schedule_id
- call CQ Reservation function
- return dry-run/send summary

Step 5: Build PhotoPro admin UI.
On trip detail/approval page add:
- linked reservation trip display
- Match Reservation Trip button if not linked
- Send Gallery to Passengers button
- Dry Run Preview modal
- Confirm Send button
- Send status summary
- Resend Failed button only after first send

Step 6: Testing.
Add tests or manual test scripts for:
- gallery not public -> blocked
- no trip schedule -> blocked with useful message
- dry run returns recipients without sending
- duplicate send is prevented
- invalid/missing phone numbers are skipped
- cancelled/deleted bookings are excluded
- Twilio failure logs failed status

SAFETY RULES
- Never print Supabase service role keys, Twilio auth tokens, or env values.
- Do not send real SMS in tests unless explicitly configured for a real manual test.
- Build dry-run first.
- Manual send first. Do not fully automate until Des approves after live testing.
- Do not change model assignments, deployment settings, or unrelated code.
- Keep the implementation narrow.

DELIVERABLES
1. Code changes in PhotoPro for mapping, API route, and admin UI.
2. Code changes in CQ Reservation System for the Edge Function and send log table.
3. Migrations for any schema changes.
4. A short operator note explaining how staff uses the feature.
5. A test checklist with verified results.
6. A rollout plan:
   - staging dry run
   - one live trip manual send
   - review logs
   - only then consider automation.

DEFINITION OF DONE
- Admin can open a PhotoPro trip with a published gallery.
- Admin can match/link the CQ reservation schedule.
- Admin can run dry-run preview.
- Admin can confirm send.
- Eligible customers receive one SMS with the gallery link.
- Send results are logged.
- Re-clicking send does not duplicate texts.
- Failed sends can be reviewed and retried.
- Gallery URL works in browser.
- No secrets are exposed in logs or code.

```

---

## Suggested First Live Test

Use one real completed trip after the gallery is approved.

1. Run dry-run only.
2. Confirm recipient count looks right.
3. Send to a tiny test booking or internal number first if possible.
4. Send to passengers.
5. Check Twilio/Supabase logs.
6. Open the gallery link from a phone.

---

## Bottom Line

This is very buildable because the hard parts already exist:

- PhotoPro already has galleries.
- CQ Reservation System already has customers and Twilio.

We just need the bridge, the safety rails, and the admin button.
