# Sign-in codes, email alerts, withdrawal PIN and admin controls

## 1. A real, unskippable code screen

Every sign-up and every login sends a 6-digit code to the member's email and stops on a
code screen until it matches.

- Countdown changed to **5 minutes**, shown live on screen ("Code expires in 4:38").
- Wrong code says **"Invalid OTP — check the code and try again"**; expired says the code
has expired with a "Send a new one" button (60-second resend cooldown stays).
- 3 wrong tries kills the code and forces a new one.
- No more silent skipping: today, when email is not working the app quietly verifies
people and lets them in. That shortcut is removed once sending is live, so the code
screen can never be bypassed. New accounts stay unverified until they enter the code.
- The code is only ever stored scrambled; matching happens on the server.

## 2. Email delivery through your SMTP

You supply host, port, username, password, from-name and from-address. They are saved in
the encrypted secret store (not written into a plain file, so they can't leak), and the
admin panel gets a **Mail settings** screen showing from-name, from-address, reply-to and
a "Send test email" button.

**Important honesty note:** our hosting runs on an edge runtime that usually blocks
direct SMTP connections. I will wire SMTP first and test it end to end. If the provider
refuses the connection there, I will tell you and switch the same settings over to that
provider's web API (most SMTP providers offer one, same account, same sender) — no
redesign, just a different pipe.

### The email itself

One polished, inbox-friendly template used for every code:

- Table-based HTML that renders correctly in Gmail, Outlook, Apple Mail and on phones.
- The 6 digits shown large, spaced and highlighted in a bordered block, easy to copy.
- Plain-text version sent alongside (a big spam-score win).
- Clear subject lines, no ALL CAPS, no exclamation marks, no "free", "winner", "urgent",
"click here", "act now", "guaranteed" — I will run the subject and body through a spam
word checklist and keep the text-to-link ratio high.
- Stable footer: your business name, what the email is for, "you received this because
someone signed in to your account", and a note to ignore it if it wasn't them.
- Same shell reused for the welcome email, withdrawal alerts and admin alerts so
everything looks like one brand.

## 3. Admin alert address

Admin panel gets an **Alerts** setting: one or more email addresses that receive an
instant email when

- a gift card is submitted (member name, brand, region, value, payout, reference, link
straight to the trade),
- a withdrawal is requested (member, amount, fee, net, bank name, account number and
account name, link to the withdrawal queue),
- a contact-form message arrives.

The in-app bell and sound alerts stay as they are.

## 4. Gift card submission — verified and cleanly separated

- Photo upload is checked properly before submit: images only, 1–5 files, each under
10 MB, and the upload is confirmed saved before the trade is accepted. If an upload
fails the trade is not created, so you never get a trade with missing proof.
- Card value capped at **$5,000** per submission, checked on the server as well as on
screen; over that, the member is told to contact support.
- In the admin panel every trade is shown with the member it belongs to (name, email,
phone, member link) and their photos are fetched with short-lived private links tied to
that trade — one member's images can never appear under another's.
- Each user's page lists only their own cards, withdrawals and ledger.

## 5. Locked money handling

- A trade can only be decided once. A second click, a double submit or two admins acting
at the same time cannot credit twice — the trade is locked while it is being decided
and re-checked as still pending inside the same transaction.
- Nothing is credited until an admin approves. Approving writes the wallet change and the
ledger entry together; if either fails, neither happens.
- Every credit and debit, manual or automatic, lands in the ledger with who did it, when,
and why.

## 6. Withdrawal PIN

- Members set a **4-digit PIN** in Settings (stored scrambled, never readable).
- Every withdrawal asks for the PIN. Wrong PIN blocks the request; 5 wrong tries locks
PIN entry for 30 minutes.
- "Forgot PIN" sends a 6-digit code to their email, then lets them set a new one.
- No PIN set yet → the withdraw screen sends them to set one first.
- The admin withdrawal queue shows amount, fee, net, bank name, account number, account
name, the member's name/email/phone, and the time — the same snapshot the member sees.

## 7. Admin money and account controls

- **Credit / debit** any member with a reason; the member gets a notification and the
ledger records it.
- **Freeze / unfreeze**: a frozen member can still log in and see their balance and
history, but trading and withdrawals are refused with a clear frozen banner, enforced
on the server, not just hidden in the app. Freeze and unfreeze are logged.

## 8. Contact form on the homepage

A feedback form (name, email, message) on the homepage. Submissions are saved, counted on
the admin overview ("3 new messages"), listed in a new admin **Messages** screen with
read/unread, and emailed to the alert address.

Rate-limited and length-limited so it can't be used for spam.

## 9. Verification pass

Before I hand back:

- Walk the real app in a browser: sign up → code screen → wrong code → correct code →
dashboard; login → code → dashboard; submit a card with photos; set a PIN; request a
withdrawal with right and wrong PIN; admin approve, partially pay, decline; credit,
debit, freeze, unfreeze; contact form.
- Confirm every new page has a working route and no broken links, and that the whole
project builds and type-checks clean.
- Send a live test email and read it on a phone-width inbox view.

## Technical notes

- Schema: `profiles.withdrawal_pin_hash`, `pin_attempts`, `pin_locked_until`,
`frozen_at`, `frozen_reason`; new `contact_messages` table; `app_settings` table holding
alert emails and mail from-name/reply-to; all with RLS plus grants (`contact_messages`
insert for anon, read for admins only).
- OTP: `OTP_TTL_MIN` 10 → 5 in `src/lib/auth.functions.ts`; `expiresAt` already returned,
surfaced in `OtpForm` as a live countdown; the `verifiedWithoutEmail` bypass in
`completeSignup` becomes conditional on mail actually being unavailable and is dropped
once SMTP verifies.
- Email: `src/lib/email.server.ts` gains a real SMTP transport plus a shared layout
builder (`renderEmail({ preheader, heading, body, cta })`) and text alternative;
secrets `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`,
`APP_EMAIL_FROM`, `APP_EMAIL_FROM_NAME`, `APP_EMAIL_REPLY_TO`.
- Money: `admin_review_trade` and `create_withdrawal` already lock rows; add an explicit
status re-check plus a `verify_withdrawal_pin` SQL function; `create_trade` gains the
$5,000 ceiling and a frozen-account guard; new `admin_set_frozen` writes the audit row.
- Alerts fire from server functions after the database transaction commits, so a mail
failure can never roll back a trade or withdrawal.
- New routes: `/app/settings` PIN section, `/ScousGiftCardExchange/admin/messages`,
`/ScousGiftCardExchange/admin/mail`; all under existing admin gate + `is_admin()` checks
inside every function.

## Not included

- Marketing or newsletter email.
- SMS or push notifications.
- Automatic bank-account name verification with a bank API.