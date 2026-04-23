# Photo Pro — Lessons Learned

Each lesson here exists because a real mistake or wrong assumption cost real time. Read before proposing changes that touch the same area.

---

## 2026-04-23 — Cloud API numbers cannot join consumer WhatsApp groups

**What went wrong:** Spent weeks of conversational effort iterating on a "two WhatsApp groups, one per boat" design where each boat's bot phone (a Meta WhatsApp Cloud API number) would be a member of its boat's WhatsApp group. Repeatedly tried to add the bot phone (+1 555-142-0958, +1 631-502-5322) to a group on the captain's phone — WhatsApp consistently showed "Invite via SMS" instead of adding the number.

**Why:** Meta WhatsApp Cloud API is architecturally restricted from consumer WhatsApp group participation. Cloud API numbers exist only on Meta's servers; they have no consumer WhatsApp account, so the WhatsApp client correctly refuses to add them to groups. This is deliberate Meta policy, not a bug. Sources:
- Multiple developer-community posts (Stack Overflow, Meta Community Forum, respond.io knowledge base) confirm Cloud API numbers cannot be added to consumer WhatsApp groups.
- Adding a Two-Step Verification PIN, calling `POST /{phone-number-id}/register`, or waiting for propagation does not change this.
- The "WhatsApp Cloud API Groups" feature Meta documents is for high-volume programmatically-managed groups, not for being added to user-created groups.

**Symptoms to recognize next time:**
- WhatsApp shows "Invite via SMS" when adding a Cloud API number to a contact or group.
- A `wa.me/<number>` link works (1:1 chat opens), but adding the same number to a group fails.
- Test numbers behave the same way — being a "test" number doesn't grant group access.

**Rule going forward:** Never propose putting a Cloud API bot phone into a consumer WhatsApp group. The only working architecture on Cloud API is **1:1 chat per boat**:
- Crew → message captain via normal WhatsApp.
- Captain → 1:1 chat with the boat's bot phone, sends photos there.
- Bot routes by `change.value.metadata.phone_number_id` (the only reliable inbound boat signal).
- Bot replies from the matching boat's phone via `getPhoneNumberIdForBoat(boat)`.

If a future request asks for "put the bot in the group" — point at this lesson, do not retry.

**Files that encode this rule:**
- `CLAUDE.md` (top-level "ARCHITECTURAL CONSTRAINT" block)
- `src/lib/whatsapp/webhook-handler.ts` (`getBoatForReceiver`, comment explaining why)
- `src/lib/whatsapp/client.ts` (`getPhoneNumberIdForBoat`)

---

## 2026-04-22 — Vague UI walkthroughs waste Des's time

**What went wrong:** Repeatedly told Des to "click Settings → Configuration → Webhooks" without specifying which sidebar, which page, what the button text says, where it lives on the screen. Wasted his time hunting through Meta UIs that have multiple "Settings" pages and confusing navigation.

**Rule going forward:** Click-by-click instructions only. Always include:
1. The exact URL if there is one.
2. The exact button text in **bold**.
3. Where the button lives on the screen (top-right, sidebar, dropdown under X).
4. What the next screen should look like after the click.

This applies to Meta, Twilio, Vercel, Supabase, GitHub, every dashboard. Never assume Des knows where anything is.
