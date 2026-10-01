# ARGUS Customer Review System

**One link. No customer login. One simple review. One simple admin dashboard.**

Built for restaurants, cafés, hotels and resorts. A guest opens `/r/your-business` from a WhatsApp message, an SMS, an email or a QR code. They leave stars and a few words (plus an optional photo) and they're done in under 30 seconds. The business manages everything from `/admin`.

```
Guest  ── opens link ──> /r/abc-restaurant ── rating + feedback ──> Thank you
                                                    │                 └── 4–5★ → "Review us on Google"
                                                    ▼
                                         PostgreSQL (source of truth)
                                                    │  after() — guest never waits
                                                    ▼
                                    n8n webhook (signed) → Sheets / WhatsApp / creatives
Business ── /admin ── reviews · customers · creatives · branding · share link · integrations
```

---

## Quick start (local)

Requirements: Node 20.9+ and PostgreSQL 14+.

```bash
cd argus-reviews
npm install
cp .env.example .env            # then edit DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:setup                # migrate + seed demo business, demo reviews and your admin
npm run dev                     # http://localhost:3000
```

| What | URL |
| --- | --- |
| Landing page | http://localhost:3000/ |
| **Public review page (demo)** | http://localhost:3000/r/abc-restaurant |
| Demo hotel (shows the type config) | http://localhost:3000/r/lakeview-hotel |
| Admin | http://localhost:3000/admin/login (the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`) |

No passwords are hard-coded. The seed creates the first admin from env vars. To add more admins or reset a password:

```bash
ADMIN_EMAIL=owner@hotel.com ADMIN_PASSWORD='a-long-password' npm run admin:create -- --business lakeview-hotel
```

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, `proxy.ts`), React 19, TypeScript, Tailwind CSS v4.
- **PostgreSQL + Drizzle ORM**. This works with any Postgres: local, **Supabase**, Neon or RDS. SQL migrations are in `drizzle/`.
- Auth: email/password (bcrypt) with a signed httpOnly JWT cookie. Only business admins log in.
- Images: `sharp` (resize, auto-orient, strip EXIF/GPS, WebP). Storage is local disk or any S3-compatible bucket.
- QR: `qrcode`. Social images: `next/og`. Validation: `zod`.

## Routes

**Public (no auth)**

| Route | Purpose |
| --- | --- |
| `/` | Product landing page |
| `/r/:slug` | Branded review page. It's server-rendered, cached, and refreshes instantly when branding changes. `?s=qr\|whatsapp\|email\|website` tracks the source. |

**Admin (login required)**

| Route | Purpose |
| --- | --- |
| `/admin/login` | Sign in |
| `/admin` | Overview: review link card (Copy / Open / QR / WhatsApp / Email), 5 stats, recent reviews, 30-day activity |
| `/admin/reviews` | Filter, search, detail drawer, Approve / Feature / Follow-up / Reject, CSV export |
| `/admin/customers` | Guest list with totals, average rating, last visit, last feedback, status; detail drawer with history, WhatsApp and Email |
| `/admin/creatives` | Turn approved, consented reviews into 1080×1080 quote-card posts with captions |
| `/admin/settings` | Business information, review settings, Google Review URL, plan |
| `/admin/branding` | Logo, cover, colours, name, headline, description, Google URL, with a live phone preview |
| `/admin/settings/share` | Review link, QR, website button snippet, floating `embed.js` button |
| `/admin/integrations` | n8n webhook URL + signing secret, test event, delivery log, API key |

## API

**Public.** This is the only unauthenticated surface. It can read public config and create a review, nothing else.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/public/business/:slug` | Public branding/form config only (no ids, no Google URL, no settings) |
| POST | `/api/public/reviews` | Creates a review. Idempotent via `submission_id`, with a honeypot and a per-IP-hash rate limit |
| POST | `/api/public/uploads` | Premium only. Multipart photo upload returning a short-lived signed `photo_token` |

```jsonc
// POST /api/public/reviews
{ "business_slug": "abc-restaurant", "rating": 5, "feedback": "Excellent food and service.",
  "name": "Rahim Ahmed", "phone": "+880…", "email": null, "service_type": "Dining",
  "photo_token": null, "consent_to_publish": true, "source": "whatsapp", "submission_id": "uuid" }
// → { "success": true, "review_id": "…", "rating": 5, "show_google_review": true, "google_review_url": "https://…" }
```

**Admin (session cookie):** `GET /api/admin/qr?format=png|svg[&download=1]`, `GET /api/admin/export` (CSV), `GET /api/admin/media/:reviewId` (private photo), `POST /api/admin/assets` (logo/cover upload), `GET /api/admin/creatives/:id/image`.

**Integration API for n8n.** Send `Authorization: Bearer argus_sk_…`. You generate the key in `/admin/integrations`. Each key is scoped to one business and stored hashed.

| Method | Path |
| --- | --- |
| GET | `/api/integrations/v1/reviews?since=ISO&status=APPROVED&limit=100` |
| GET / PATCH | `/api/integrations/v1/reviews/:id` (`{ "status": "APPROVED" }`) |
| GET | `/api/integrations/v1/reviews/:id/photo` |
| POST | `/api/integrations/v1/creatives` (`{ review_id, caption, image_url, status }`, consent enforced) |
| PATCH | `/api/integrations/v1/creatives/:id` |

## n8n webhook (outbound)

Set the URL in **Settings → Integrations**, or set a global `N8N_WEBHOOK_URL`. Events are `review.created`, `review.status_changed`, `creative.updated` and `test`. They are sent with `after()`, so guests and admins never wait on them, and every delivery is logged.

```
POST <your n8n webhook>
X-Argus-Event: review.created
X-Argus-Timestamp: 1767225600
X-Argus-Signature: sha256=HMAC_SHA256(secret, "<timestamp>.<raw body>")

{ "event": "review.created", "sent_at": "…", "data": {
  "review_id", "business", "business_slug", "customer_name", "phone", "email", "rating", "feedback",
  "service", "photo_url", "consent", "source", "status", "creative_status", "creative_url",
  "caption", "publish_status", "created_at" } }
```

The `data` object is exactly the Google Sheets column set, so an n8n flow can append it to a sheet as-is: **Webhook → Google Sheets → WhatsApp notify → creative → approval → Facebook**. The app database stays the source of truth, and Sheets is only an operations view. The same columns are available as CSV from **Reviews → Export CSV**.

## Database tables

`businesses` · `admin_users` · `business_members` (OWNER / STAFF) · `customers` · `reviews` · `review_media` · `creative_posts` · `integrations` · `activity_logs`. See `src/db/schema.ts`.

- Review status: `NEW · REVIEWED · APPROVED · FEATURED · REJECTED · FOLLOW_UP`. Ratings of 1–3★ land in `FOLLOW_UP` automatically.
- Customer status: `NEW · ACTIVE · FOLLOW_UP · COMPLETED`. Customers are deduplicated per business by phone or email. They are business-owned guest records, not accounts.
- `FEATURED` and social creatives require the guest's publish consent.

## Hotels and other business types

Restaurants, cafés, hotels and resorts all run on one code path. `src/lib/business-types.ts` defines each type's headline, service options and two short follow-up questions (e.g. hotel: *How was the room? / How was the service?*). Changing the business type in Settings re-configures the public form. Adding a vertical means adding one entry there.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `AUTH_SECRET` | ✓ | 32+ random chars. Signs sessions and photo tokens, and salts IP hashes |
| `NEXT_PUBLIC_APP_URL` | ✓ | Public base URL for links, QR and share messages, e.g. `https://review.argusofficial.com` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | seed only | First admin account |
| `STORAGE_DRIVER` | – | `local` (default) or `s3` |
| `UPLOAD_DIR` | – | Local upload folder (default `./uploads`) |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | if `s3` | Supabase Storage (S3 endpoint), Cloudflare R2, AWS S3… |
| `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` | – | Global fallback webhook |
| `DATABASE_PREPARE` | – | `false` when using a transaction pooler (Supabase :6543) |
| `REVIEW_RATE_LIMIT_PER_HOUR` | – | Default 8 reviews per IP per business per hour |
| `NEXT_PUBLIC_CONTACT_EMAIL` | – | "Get Started" contact on the landing page |

## Testing

```bash
npm run lint && npm run typecheck
npm test            # Vitest: rules, validation, sharing, CSV, HMAC + DB integration tests (uses argus_test DB)
npm run test:e2e    # Playwright: builds the app, seeds argus_e2e DB, runs on mobile (390px) + desktop
```

The end-to-end tests cover:
- Every rating from 1★ to 5★, including whether the Google CTA appears.
- Submissions with and without name, contact, photo and consent.
- An invalid slug, a missing rating, empty feedback and a double-click submit.
- No horizontal scroll at 375/390/412px, and rendering on a throttled slow-3G connection.
- Public API data exposure, and 401s on the admin and integration APIs.
- Admin login and logout, review actions, the customer drawer, and branding changes showing up on the public page.
- Copying the link, downloading the QR, and the WhatsApp/email links.
- Creatives, plus n8n webhook signature verification and the API-key round trip.

Databases for tests: `TEST_DATABASE_URL` (default `postgres://argus:argus@localhost:5432/argus_test`) and `E2E_DATABASE_URL` (default `…/argus_e2e`).

## Deploying

1. Create a Postgres database (a Supabase project works: use its connection string, and set `DATABASE_PREPARE=false` if you use the pooler).
2. Set the env vars above. On serverless hosts (e.g. Vercel), use `STORAGE_DRIVER=s3` because local disk isn't persistent.
3. Run `npm run db:migrate`, then `npm run admin:create` (or `db:seed` for the demo).
4. If you deploy on Vercel, set **Root Directory** to `argus-reviews`. Point `review.argusofficial.com` at the deployment.
