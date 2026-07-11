# Tasks: QRFlow Monolith Setup

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Initialize Next.js project base and install dependencies: `mongoose`, `framer-motion`, `qrcode.react`, `lucide-react`, `resend`.
- [x] 1.2 Configure TailwindCSS with Spotify color theme (`#121212`, `#2d2c4a`) and bootstrap shadcn/ui.
- [x] 1.3 Create MongoDB connection utility in `lib/db.ts` with pool caching.
- [x] 1.4 Implement Mongoose model in `models/Registration.ts` with unique indexes on `email`, `instagram`, and `qrToken`.

## Phase 2: Backend API Router

- [x] 2.1 Implement `app/api/register/route.ts` to validate payload, generate UUID `qrToken`, handle MongoDB duplicate key errors (code 11000), and save.
- [x] 2.2 Implement `app/api/admin/send-email/route.ts` to load user data, render Spotify-themed HTML, and dispatch email via Resend.

## Phase 3: Frontend Swipe Form

- [x] 3.1 Build multi-step client form layout in `app/page.tsx` using React state.
- [x] 3.2 Animate step transitions using Framer Motion horizontal swipe effects.
- [x] 3.3 Add success step to render client-side QR code using `qrcode.react` based on the returned `qrToken`.

## Phase 4: Admin Dashboard

- [x] 4.1 Build registrations table in `app/admin/page.tsx` loading data from database.
- [x] 4.2 Format and generate dynamic action links for Instagram and WhatsApp (`wa.me`).
- [x] 4.3 Implement "Enviar Mail" action button calling the send-email endpoint with loading states.

## Phase 5: Verification

- [ ] 5.1 Test double submission to verify database index duplicate rejection.
- [ ] 5.2 Verify that the generated QR code renders correctly on mobile devices.
- [ ] 5.3 Verify delivery and Spotify-theme layout of the QR code email.
