# After All email delivery — Resend activation guide

The signup page at https://becauseafterall.com/updates.html saves consented email addresses in Supabase. The confirmation-email integration is implemented but **does not send until configured**.

## Architecture and safety

- Sender: Resend Email API.
- Trigger: an email signup on `/updates.html`, after the existing guest session and consent checks.
- Recipient: submitted email address; no bulk sending or import.
- Transaction: store signup first, then attempt confirmation email.
- Double opt-in: `verified` stays false until the recipient follows `/email.html#confirm=<random-token>`; the Edge Function compares only SHA-256 hashes of 64-character tokens.
- Confirmation links expire after seven days. The same emailed token also supports unsubscribing at `/email.html#unsubscribe=<token>`.
- Provider key: `RESEND_API_KEY`, stored **only** in Supabase Edge Function secrets, never browser source or GitHub.
- The provider request has an idempotency key and saves the provider's message ID. Attempts per address are throttled to 3 in 24 hours, with a two-minute cooldown. Provider failures do not erase signups or falsely mark emails as sent.
- If the provider is not configured, the form still saves the signup and simply says `You're on the list.`; no verification email is promised.

## Step 1: Create a sending account

1. Open https://resend.com and create/sign in to your own Resend account.
2. Open **Domains** and select **Add Domain**.
3. Enter `becauseafterall.com`.
4. Select your sending region and save.
5. Resend will show its own DNS records for DKIM, SPF and return-path/MAIL FROM. **Copy the exact values Resend displays** rather than using any DNS values from an online tutorial.

### Why the domain's existing email is important

The domain currently uses GoDaddy nameservers. It has existing GoDaddy email records, including MX and DKIM records. **Do not remove existing mail MX records, DKIM records, domain A records, the WWW CNAME or nameservers.**

For each new Resend record:
- In GoDaddy → `becauseafterall.com` → **DNS** → **Add New Record**, choose the same Type, Name/Host, Value and Priority shown in Resend.
- When the record name is a fully qualified domain, GoDaddy may expect only the host prefix (for example, `resend._domainkey` instead of `resend._domainkey.becauseafterall.com`). Check GoDaddy's field hint before saving.
- Resend's bounce-domain MX record may legitimately belong under a subdomain such as `send`; that is different from an existing inbound `@` MX record.
- If Resend asks you to change an existing record rather than add a non-conflicting one, stop and inspect it. Particularly, **never create two competing SPF TXT entries for the same host**. Merge only with verified guidance.
- Leave the root A records and current website DNS exactly as they are.
- Return to Resend and select **Verify DNS Records** until the domain shows verified.

Do not set up DNS based on guesswork. Only the Resend dashboard supplies the actual targets assigned to the domain.

## Step 2: Create a sending API key

1. In Resend, go to **API Keys**.
2. Select **Create API Key**.
3. Give it a name such as `After All Nothing confirmation`.
4. If offered, restrict its permissions to sending and its scope to the verified domain.
5. Create the key and **copy it directly into the Supabase dashboard**. Do not paste it into ChatGPT, WhatsApp, GitHub, a screenshot, source code, or browser developer tools.

## Step 3: Configure Supabase secrets

1. Open https://supabase.com/dashboard/project/scgihelnwihjckzzvxyc/functions/secrets
2. Select **Add new secret** (or the equivalent Add Secret control).
3. Enter these two key/value pairs:

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | Your private key copied from Resend |
| `AFTER_ALL_EMAIL_FROM` | `After All <hello@becauseafterall.com>` |

4. Optional: `AFTER_ALL_REPLY_TO` — an actual monitored mailbox you control, e.g. `hello@becauseafterall.com`, **only if it receives mail**.
5. Save. Supabase makes these secrets available to the deployed `nothing-game` Edge Function. You normally do not need to change the frontend or redeploy just to add an environment secret.

## Step 4: Test with an inbox you control

1. Visit https://becauseafterall.com/updates.html in a regular browser (ideally one used for the game).
2. Enter **your own** email address and check the consent box; click **Keep Me Posted**.
3. The page should say **Check your inbox to confirm your email.**
4. Check Inbox and Spam. Expected sender: `After All <hello@becauseafterall.com>`; subject: **A note from After All.**
5. Click **CONFIRM MY EMAIL**. It opens https://becauseafterall.com/email.html and displays a confirmed state.
6. In Supabase, inspect `public.nothing_waitlist`: for the exact address `confirmation_sent_at` and `confirmed_at` should be populated and `verified` should be true.
7. Test unsubscribe using the link in the email, then inspect `marketing_consent=false` and `unsubscribed_at` populated. The subscription must be excluded from operational marketing exports.
8. To test again, use a different address you control or the same browser's explicit resubscribe flow. No welcome emails are ever sent to addresses merely present in the old database.

## Delivery troubleshooting

- **Form says "You're on the list" but no confirmation email:** check that both Supabase secrets are present and Resend verified the sending domain.
- **Form says the provider couldn't send:** in Resend, open Email Logs and inspect the rejected delivery; confirm sender domain and billing/limits. Supabase logs show error category without exposing the API key or email address.
- **Nothing in Inbox:** check Spam and Resend's delivery logs; `confirmation_sent_at` means Resend **accepted** the request, not necessarily that the receiving mailbox delivered it.
- **Link expired:** return to the signup form using the same browser and address; a fresh link can be requested subject to rate limits.
- **Already on list:** existing rows may not have received an email before activation. From the same browser and email address, resubmit after activating the provider to request a confirmation.
- **No account recovery for old signup:** a different browser identity cannot resend to the same email address by design, to avoid contact enumeration and spam. Ask the operator to assist privately; do not expose email records.

## Operations and compliance

- `public.nothing_waitlist` is the source of truth. Only `verified=true AND marketing_consent=true AND unsubscribed_at IS NULL` should be eligible for future promotional campaigns.
- Confirmed email addresses are for **product updates only**, not proof of eligibility for any game prize.
- The existing privacy notice describes the email provider and confirmation states.
- Outbound email delivery is **not** a mass marketing system. Announcements to subscribers require an approved campaign tool/workflow, consent review, unsubscribe headers, suppression management and sender reputation monitoring.
- A successful Resend API response means the provider **accepted** the message. Recipient-level delivery/bounce status should be monitored in Resend or via separately configured signed provider webhooks.
- This system should undergo an Indian privacy/legal review before broad public acquisition campaigns.

## Current blocker

As of the implementation, the assistant can write/deploy the application and database changes, but cannot log into an unconnected Resend account, register a sending domain inside it, create a private API key on your behalf, or inject that key through the currently available Supabase connector. These steps must be completed in the provider dashboards by an authorised owner.
