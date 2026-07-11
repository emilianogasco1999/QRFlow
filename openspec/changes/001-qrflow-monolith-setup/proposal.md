# Proposal: Setup QRFlow Monolith

## Intent
Build a secure monolithic Next.js & MongoDB Atlas application featuring a Spotify-themed multi-step user form, admin dashboard, and frontend QR code generation with email integration.

## Scope

### In Scope
- Monolithic Next.js (App Router) setup with TailwindCSS and shadcn/ui.
- Mongoose schemas with unique indexes for `email`, `instagram`, and `qrToken`.
- Multi-step form with swipe transitions using Framer Motion.
- Admin dashboard (`/admin`) displaying registrations, Instagram/WhatsApp link generators, and a button to trigger emails.
- Email dispatch (HTML with Spotify-inspired dark theme and QR code).
- Frontend QR generation (`qrcode.react`) based on a backend-generated secure token.

### Out of Scope
- Full OAuth authentication for admin (simple password/token protection).
- Direct WhatsApp API integrations (only `wa.me` links).

## Capabilities

### New Capabilities
- `user-form`: Multi-step swipe form for collecting user data and showing QR.
- `admin-dashboard`: Admin panel to review entries, launch WhatsApp/Instagram, and trigger emails.

### Modified Capabilities
- None

## Approach
1. Initialize Next.js project with Tailwind and Mongoose.
2. Define MongoDB `Registration` model with strict unique constraints.
3. Build user form with Framer Motion swipe transitions. Generate QR on success page using backend `qrToken`.
4. Build `/admin` dashboard with a clean table. Use string formatting for Instagram and WhatsApp links.
5. Setup Next.js API Route for email dispatching using Resend or Nodemailer.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/` | New | App Router pages (`/` and `/admin`) and API routes. |
| `models/` | New | Mongoose schemas. |
| `lib/` | New | Database connection and email utilities. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Duplicate entry race conditions | Medium | Mongoose `unique` indexes + catch MongoDB error 11000. |
| QR spoofing | Low | Backend generates the secure `qrToken` (UUID); client only renders it. |

## Rollback Plan
- Reset repository to root commit (`git reset --hard`).

## Dependencies
- MongoDB Atlas URI.
- SMTP / Resend API Key.

## Success Criteria
- [ ] Users can submit forms with swipe transitions.
- [ ] DB rejects duplicate emails, Instagrams, and QR tokens.
- [ ] Admin panel generates valid WhatsApp/Instagram links and successfully triggers Spotify-themed QR emails.
