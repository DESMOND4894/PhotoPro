-- Two CHECK constraints were blocking videos end-to-end:
--
-- 1. whatsapp_messages.message_type rejected 'video' (and 'document'), so the
--    inbound audit log silently dropped every video message. The handler
--    catches the failure and continues, so the rest of the upload pipeline
--    looked fine — just no record of arrival.
--
-- 2. trips.status didn't include 'failed', though application code (and the
--    TripStatus union type) has been using it for a while. Not a video bug
--    on its own, but it prevents the trip-reset path inside the video
--    handler from completing cleanly.

ALTER TABLE whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_message_type_check;
ALTER TABLE whatsapp_messages ADD CONSTRAINT whatsapp_messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'video', 'document', 'reaction', 'interactive', 'template'));

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('receiving', 'pending', 'approved', 'posting', 'posted', 'skipped', 'failed'));
