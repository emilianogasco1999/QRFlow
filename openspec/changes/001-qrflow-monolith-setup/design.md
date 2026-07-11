# Design: QRFlow Monolith Setup

## Technical Approach
Implement a monolithic Next.js App Router application with Mongoose database layers and Resend email integration. The UI is built using TailwindCSS and Framer Motion for fluent step transitions, adhering to the Spotify visual theme.

## Architecture Decisions

| Decision | Option A | Option B | Rationale |
|----------|----------|----------|-----------|
| **Form Steps Transition** | URL-based routing per step. | React State + Framer Motion on a single page. | **Option B**: Allows smoother, fluid swipe animations and simple state synchronization. |
| **QR Code Generation** | Render PNG on backend & store in S3. | Generate `qrToken` in backend; render SVG in frontend. | **Option B**: Reduces database storage and network bandwidth, honoring the user constraint. |
| **Admin Protection** | Complex NextAuth configuration. | Token/Password header or simple query param token. | **Option A (simplified)**: Simple environment-variable based admin token to keep the monolith lean. |

## Data Flow
```
[User Form] ──(POST /api/register)──> [Next.js API] ──(Save)──> [MongoDB Atlas]
     │                                     │
     │ <────(Response: qrToken)────────────┘
     ▼
[Success Page: Render QR Code]

[Admin Table] ──(POST /api/admin/send-email)──> [Next.js API] ──(Send API)──> [Resend/SMTP]
                                                                                   │
                                                                                   ▼
                                                                             [User Inbox]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Install Mongoose, Framer Motion, qrcode.react, lucide-react, and Resend. |
| `lib/db.ts` | Create | MongoDB database connection wrapper. |
| `models/Registration.ts` | Create | Registration Mongoose schema with unique indexes on `email`, `instagram`, and `qrToken`. |
| `app/api/register/route.ts` | Create | POST endpoint for registrations. Handles duplicate errors (code 11000). |
| `app/api/admin/send-email/route.ts` | Create | POST endpoint to trigger the custom Spotify-styled QR email. |
| `app/page.tsx` | Create | Multi-step client component form with Framer Motion swipe transitions and success page. |
| `app/admin/page.tsx` | Create | Protected admin dashboard rendering the registrations table. |

## Interfaces / Contracts

### MongoDB Schema
```typescript
interface IRegistration {
  instagram: string; // unique, lowercase
  whatsapp: string;
  email: string;     // unique, lowercase
  dob: string;
  location: string;
  referral: string;
  qrToken: string;   // unique, UUIDv4
  createdAt: Date;
}
```

### API Post `/api/register` Request Body
```json
{
  "instagram": "@tuinstagram",
  "whatsapp": "+54911223344",
  "email": "tu@mail.com",
  "dob": "1999-07-10",
  "location": "Buenos Aires",
  "referral": "Instagram"
}
```

### API Post `/api/admin/send-email` Request Body
```json
{
  "registrationId": "60d0fe4f5311236168a109ca"
}
```

## Testing Strategy
- **Unit**: Verify Mongoose validation regex for email format, phone format, and Instagram handler (`@`).
- **Integration**: Verify `/api/register` throws `400 Bad Request` on duplicate `email` or `instagram`.
- **E2E**: Validate swipe transition rendering on mobile browsers and email formatting tests.

## Migration / Rollout
No data migration required as this is a fresh setup. Mongoose schemas will compile and create the unique indexes automatically on Atlas startup.
