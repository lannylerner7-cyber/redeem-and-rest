# Gift Card Exchange

Now we wanted to copy our entire source code cloning from GitHub(https://github.com/lannylerner7-cyber/gift-goldrush.git ) to complete the rest of the web application perfectly without making any changes to our plans & codebase so we just start the code follow up using this remaining aspect ideaology “# Trading, bank accounts and the admin panel

The admin address `/ScousGiftCardExchange/admin` returns nothing today because no admin pages exist yet — only the public site, accounts and the member dashboard are built. This plan builds the full trading loop, bank details, and the admin panel behind that address.

## 1. Member: trade a card (step by step)

One screen, five steps, with a progress bar and slide transitions:

1. Market — grid of every card brand the admin has made visible, real logo on each tile.

2. Region — the regions priced for that brand (US, UK, DE, CA, AU, ...), flag and currency.

3. Type — Physical card or E-code.

4. Amount — enter the card value; the Naira payout updates live from the admin's rate, with the rate and value band shown.

5. Proof — physical: upload 1–5 photos of the card and receipt; e-code: enter the code and PIN. Both accept an optional note.

Submit creates the trade as Pending and lands on a confirmation screen with the reference. Payout is always recalculated on the server from the stored rate, never trusted from the browser.

## 2. Member: history and the success moment

- History list with status chips and filters; tapping a trade opens its timeline, photos, payout and the admin's note.

- When a trade turns Successful (or Partially paid) the member gets a celebratory pop-up: "Your gift card has been redeemed successfully — check your balance now", confetti, a chime, and a button straight to the balance dashboard. It fires live while they're in the app, and on their next visit if they were away.

- Declined cards (Used / Error) show the admin's reason instead.

## 3. Member: bank accounts in Settings

- Add a bank account: pick from a full list of Nigerian banks — commercial and digital (Access, GTBank, Zenith, UBA, First Bank, Fidelity, FCMB, Sterling, Stanbic IBTC, Union, Wema, Polaris, Keystone, Unity, Providus, Titan, Globus, Jaiz, SunTrust, Parallex, Premium Trust, Optimus, Opay, PalmPay, Moniepoint, Kuda, VFD, Rubies, Sparkle, Fairmoney, Carbon, Mintyn, Paga, Eyowo, 9 Payment Service Bank, Momo PSB, SmartCash PSB) plus account number and account name.

- Set a default, and delete an account (blocked while a withdrawal using it is still pending).

- Also in Settings: profile details, notification and sound preferences, and delete account.

## 4. Admin panel at `/ScousGiftCardExchange/admin`

Reachable only by an admin account; everyone else is bounced to the member area.

- **Overview** — platform capital: total member balances (money owed), total paid out, total card value redeemed, fees and margin earned, held funds, plus today/this-week counters and a pending-work badge.

- **Trade queue** — newest first, unattended ones badged, a sound alert when something new arrives. Opening a trade shows the member, the brand/region/type/value, the uploaded photos full-size (or the e-code and PIN with a copy button), and the calculated payout.

- **Decision** — Valid (credits the full payout), Partially paid (enter the amount actually paid), or Invalid / Used / Error, each with a note the member sees. Approval credits the member's wallet automatically and instantly, and writes a ledger entry.

- **Users** — search, open a member to see balance, bank accounts, trade history and wallet ledger; manual credit or debit with a reason.

- **Rates** — per brand + region + value band, plus market visibility toggles per brand.

- **Withdrawals** — queue with approve / cancel / mark paid.

- **Banners**, **notification broadcaster**, **mail settings**, **audit log** of every admin action.

## 5. Fraud and privacy

- Uploaded card photos live in private storage; only the owner and admins can open them, through short-lived links.

- Duplicate-code and duplicate-image detection flags repeat submissions for review.

- Every money movement is recorded in the ledger with who did it and when; nothing is computed in the browser.

- Privacy page updated to describe card images, bank details and how long they're kept.

## Technical notes

- New routes: `src/routes/_authenticated/scous-admin.*` mapped to the `/ScousGiftCardExchange/admin` path, gated by a `has_role(auth.uid(),'admin')` check in `beforeLoad` and re-checked inside every admin server function.

- Money runs in server functions (`createServerFn` + `requireSupabaseAuth`): a single Postgres function per action updates `wallets` and inserts `wallet_transactions` in one transaction, plus an `admin_audit_log` row. Idempotent so a double-click can't double-credit.

- New `banks` reference table seeded with the Nigerian bank list (name + NIBSS code); `bank_accounts` links to it.

- `trade_images` rows plus signed URLs from the private `card-proofs` bucket; e-code and PIN readable only by the owner and admins.

- Realtime on `trades`, `wallets` and `notifications` drives the live status change, the success pop-up and the admin queue alert; `chat_threads` added to the realtime publication.

- Motion: step slide transitions, tilt on tile tap, counting balance, shimmer skeletons, confetti and chime reuse the existing motion kit.

## Not in this plan

Chat with admin, push notifications, PWA/store packaging and the real Canva artwork stay queued as later phases. Email delivery still needs a sending domain you own. Admin login info; Admin user; 197200 admin pass: Adeyemi20@ 

users account info will be live at admin panel if users submitted withdrawal they for se debited instant and history display withdrawal $amount to $bankname" date users can print users balance deduct and display pending in history if admin  hit withdraw complete in admin the users account withdraw history will be update too, if admin hit decline withdraw in admin panel. users balance return back. ”

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://redeem-and-rest.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b10ccc80-17f5-43bd-b170-11b917f3ca57).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
