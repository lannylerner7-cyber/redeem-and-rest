# ScousGiftCardExchange — Build Roadmap (living blueprint)

Status key: [ ] not started · [~] in progress · [x] done

## Phase 1 — Foundation

- [x] Lovable Cloud enabled
- [x] Database: all tables, indexes, row-level security, grants
- [x] Roles in separate `user_roles` table + `has_role()` check
- [x] Private storage buckets for card proofs and chat images
- [x] Brand design tokens (deep-night navy/charcoal, gold-green money accents, display typeface)
- [x] Display + body fonts loaded (Bricolage Grotesque, Manrope)
- [x] Shared 5-second branded page loader
- [x] Motion kit: card tilt, counting balance, shimmer skeletons, confetti, chime/alert sounds
- [ ] Seeded admin account (code 197200)

## Phase 2 — Public site

- [x] Homepage: hero, live rate ticker, campaign banners, brand grid
- [x] Rates page with search
- [x] Support / FAQ page
- [x] Terms and Privacy pages
- [x] Mobile navigation + footer
- [x] Real brand logos (Simpleicons + Google logo service, letter fallback)
- [x] Hero artwork, floating motion, auto-rotating banner carousel
- [x] Show/hide eye toggle on every password field
- [ ] Real Canva artwork (placeholders in place)
- [ ] App icon and splash screens

## Phase 3 — Accounts

- [x] Signup (name, email, phone, password)
- [x] 6-digit code screens with resend cooldown (60s) and hourly cap
- [x] Login: unknown email message, 3 failed attempts = 30-minute lock with unlock time
- [x] Forgot password + set new password
- [x] Protected member area + logout
- [~] Email delivery: code and welcome emails are written but cannot be sent until a
      sending domain is connected. Until then new accounts are verified immediately.
- [ ] Profile page + unverified ribbon
- [ ] Delete exchange account (typed DELETE + password, blocked if balance/pending)
- [ ] Admin mail-settings screen

## Phase 4 — Trading

- [x] Member dashboard: balance with hide/show, counting animation, recent trades
- [ ] Market grid with brand tiles
- [ ] Region picker (US, UK, DE, AU, CA, IT, FR, CH, NZ, JP, AE, SG)
- [ ] Physical vs e-code paths
- [ ] Live Naira payout preview
- [ ] Photo upload 1–5 / code + PIN
- [ ] Exchange history + status timeline + admin note

## Phase 5 — Money out

- [ ] Bank accounts (add/delete/default)
- [ ] Withdrawal request, ₦300 fee, total before confirm
- [ ] Balance held at request time
- [ ] Wallet ledger
- [ ] Refunds and manual deductions

## Phase 6 — Admin panel (`/ScousGiftCardExchange/admin`)

- [ ] Overview
- [ ] Trade queue, unattended badge, sound alert
- [ ] Approve / decline / partial with note
- [ ] Rates per brand + region + value band
- [ ] Market visibility
- [ ] Users: balances, banks, manual credit/debit
- [ ] Withdrawal queue
- [ ] Banner manager
- [ ] Notification broadcaster
- [ ] Mail settings
- [ ] Audit log

## Phase 7 — Chat and notifications

- [ ] Chat with admin (text + images, trade context)
- [ ] Sound alerts wired to live events
- [ ] Notification centre
- [ ] Push notifications

## Phase 8 — App packaging

- [ ] PWA manifest + service worker + offline shell
- [ ] Icons and splash screens
- [ ] Store listing assets
- [ ] Capacitor wrap

## Phase 9 — Hardening and launch

- [ ] Security review
- [ ] Rate limits
- [ ] Duplicate-card fraud checks
- [ ] Load test
- [ ] Submission checklist

## Open items

- Starting rates per brand/region — set in the admin panel at launch
- Email sending domain — needed before codes and welcome emails can actually be delivered
- Referrals — not scheduled yet
- Canva exports — swap in when ready
- MongoDB is not usable on this runtime; backend is Lovable Cloud (Postgres)
