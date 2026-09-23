# Email, self-hosting, 46 more cards, instant rates

## 1. Email sending goes live (Cloudflare)

Your Cloudflare mail details get saved into the app's secure settings:

- Host `smtp.mx.cloudflare.net`, port `465` (secure), user `api_token`, the token you gave as the password
- From address `welcome@alert.scousgiftcardexchange.com`
- From name `ScousGiftCardExchange`, reply-to `support@scousgiftcardexchange.com` (tell me if you want a different one)

Then a live test: send a real test message from Admin → Mail & alerts, confirm it lands, and confirm a sign-up code email arrives with the code block, footer and clean spam-word check. Once mail is confirmed working, sign-up stops auto-verifying and always requires the emailed code.

## 2. 46 more gift cards added to the market

Every brand on your list is added with its artwork: Wayfair, Ulta, Twitch, Subway, KFC, Southwest, Sam's Club, Roblox, REI, Papa Murphy's, Paramount+, Panda Express, Old Navy, Nintendo, Microsoft 365 Personal, Microsoft 365 Business, Meta Quest, Lyft, Kohl's, JCPenney, Instacart, IKEA, Hulu, Hotels.com, Home Depot, H&M, Google Workspace, GAP, GameStop, Etsy, Domino's, Disney, Delta, CVS, Chewy, Belk, Bass Pro, BabyGap, Applebee's, Amtrak, Airbnb, Adidas, 1-800-Flowers, Uber/Uber Eats, DoorDash, Lowe's.

Each gets US physical + e-code rates in line with the existing cards, visible on the market, and each logo is checked to actually load (any that a browser blocks gets re-hosted on our own image CDN so it never breaks).

## 3. Rates change instantly everywhere

Right now a rate saved in the admin panel only refreshes that admin screen. Change: the public rates page, the member trade screen and the admin panel all listen for changes to brands and rates, so saving a rate or flipping a brand on/off updates every open page within a second, with no refresh.

## 4. Run it on your own VPS (Docker)

You get a ready-to-deploy package in the project:

- `Dockerfile` — builds the app and runs it in one small container
- `docker-compose.yml` — single service, reads everything from `.env`, restarts on reboot, health check
- `.env.example` — every setting the app uses, named and commented: database URL and keys, all the mail settings, sender identity, app URL, port
- `DEPLOY.md` — copy-paste steps: clone, fill `.env`, `docker compose up -d`, and how to put it behind your own domain

## 5. Full verification pass

Walked through in a real browser and reported back: admin sign-in at `/ScousGiftCardExchange/admin` with your admin account, every admin page loads, a non-admin is bounced out; sign-up gives the ₦5,000 locked bonus, referral code gives ₦2,000 to both sides, and a withdrawal refuses locked money until a card is redeemed; trade with photos, PIN withdrawal, admin approve/partial/decline, credit/debit, freeze/unfreeze, contact form; plus a clean type-check with zero errors.

## Cloudflare D1 — what I can and can't do

You chose "Docker on my VPS, same database", so the app keeps its current cloud database and private image storage, and the Docker package points at it. That is the safe route: the money engine (wallets, locked bonuses, trade approvals, audit log) runs as database functions with row-level security and live updates that D1 does not support — moving it would mean rewriting every screen and carries real risk of mis-crediting balances. Card photos also stay in the existing private storage with short-lived links, per your answer. If you later want the database on your own machine too, the realistic path is a Postgres container next to the app, not D1 — say the word and I'll plan that separately.

## Technical notes

- Secrets stored: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `APP_EMAIL_FROM`, `APP_EMAIL_FROM_NAME`, `APP_EMAIL_REPLY_TO`. `.env.example` documents them; real values never committed.
- Brands/variants added by migration (insert into `gift_card_brands` + `gift_card_variants`, `logo_url` set, `is_visible` true, US region, physical and ecode rows).
- Instant rates: Supabase realtime channel on `gift_card_brands` and `gift_card_variants` invalidating the `rates-table`, `market`, `admin-brands` and `admin-variants` queries; realtime publication added for both tables in the same migration.
- Docker: multi-stage node build, `vite build`, runs the Nitro server output on `PORT`; no secrets baked into the image.
