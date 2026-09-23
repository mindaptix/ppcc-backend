# Flutter app API and WhatsApp OTP

Apply `db/schema.sql` to the PostgreSQL database before deploying this change.
It adds persistent OTP challenges and shared send limits. Existing member data is retained.

Set `DATABASE_URL`, `MSG91_WIDGET_ID` and `MSG91_WIDGET_TOKEN` on the backend.
PPCC no longer uses `MSG91_TEMPLATE_ID` or the SMS `/api/v5/otp` API.
Do not put MSG91 credentials in Flutter.

In MSG91, configure this widget with WhatsApp as primary channel (including the
India country override), WhatsApp as the only retry channel, and no SMS/voice
fallback. Select a WhatsApp authentication template in the MSG91 dashboard if
required by your account; not needing a template ID in PPCC does not remove
WhatsApp template requirements. Enable mobile integration, disable captcha and
invisible verification, and use a 4-digit OTP. Then set `MSG91_WHATSAPP_ONLY=true`.
This flag is an operator confirmation, not a remote validation of dashboard
settings. Initial delivery follows those settings; retries explicitly use channel
`12`. PPCC fails closed while this confirmation is absent.

Provider reference: https://msg91.com/help/sendotp/how-to-integrate-the-new-login-with-otp-widget
The HTTP payloads follow MSG91's sendotp_flutter_sdk widget API contract.

Run Flutter with `--dart-define=API_BASE_URL=https://your-backend-host` (origin only).
For Android emulator development use `http://10.0.2.2:3000`; real devices need a
reachable server address. Production must use HTTPS.

All routes below are relative to `/api/app` and accept/return JSON:

| Method | Route | Request / response |
| --- | --- | --- |
| POST | auth/send-otp | `{mobile}` → `{ok, reqId, channel: "whatsapp", otp_length: 4}` |
| POST | auth/send-otp | `{mobile, reqId}` resends via WhatsApp, same response |
| POST | auth/verify-otp | `{mobile, reqId, otp, fcm_token?}` → `{token, user, is_new_user: false}` |
| GET | me | `{user}` |
| PATCH | profile | Optional `name, email, district, constituency, role` → `{user}` |
| POST | fcm-token | `{fcm_token}` → `{ok}` |
| POST | auth/logout | Revokes bearer session → `{ok}` |

The last four routes use `Authorization: Bearer <token>`. Mobile is immutable in
profile updates. Only numbers already in `members` may sign in. Flutter stores
sessions in platform secure storage, restores via `me`, and updates FCM tokens
on sign-in, restoration, and refresh. Profile saves wait for backend success.

Send limits: 60 seconds between sends, at most 3 per 10 minutes per mobile.
Challenges expire after 10 minutes, allow 5 checks, and are consumed atomically
on verification. Starting a new challenge invalidates the previous challenge.

App-facing feeds, meetings, and notification-history APIs do not exist in this
backend yet; their existing frontend data remains unchanged. Admin APIs are not
called with member credentials.

Verify with `npm run test:auth`, `npx next typegen`, `npx tsc --noEmit` and
`npm run lint`. Live delivery requires a configured widget and registered member.
