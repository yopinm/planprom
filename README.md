# couponkum.com

Coupon-first price comparison + affiliate platform.

Stack: Next.js 15 App Router · TypeScript · Tailwind · Supabase · Cloudflare · Ruk-Com-Cloud

---

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (free tier is fine for local dev)

---

## Run Project

```bash
# 1. Clone the repo
git clone https://github.com/yopinm/couponkum.git
cd couponkum

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Open .env.local and fill in NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY at minimum

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Verify setup:
```
GET http://localhost:3000/api/health
→ 200 { "status": "ok", "timestamp": "...", "version": "0.1.0" }
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in each value.
**Never commit `.env.local`** — it is gitignored.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | ✅ | Full app URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only) |
| `LAZADA_APP_KEY` | Phase 1 | Lazada Open API app key |
| `LAZADA_APP_SECRET` | Phase 1 | Lazada Open API app secret |
| `LAZADA_USER_TOKEN` | Phase 1 | Lazada user access token |
| `SHOPEE_APP_ID` | Phase 1 | Shopee Affiliate API app ID |
| `SHOPEE_APP_SECRET` | Phase 1 | Shopee Affiliate API app secret |
| `CLOUDFLARE_WORKER_URL` | Phase 4 | Cloudflare Worker base URL |
| `CLOUDFLARE_API_TOKEN` | Phase 4 | Cloudflare API token |
| `SENTRY_DSN` | Phase 4 | Sentry DSN for error tracking |
| `REDIS_URL` | Phase 1 | Redis connection URL (search result caching) |

### Setting env on Ruk-Com-Cloud

1. Go to **Dashboard → Project → Environment**
2. Add each variable as a key/value pair
3. Redeploy after saving
4. Do **not** upload `.env.local` to the server

---

## Scripts

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build — must pass before any deploy
npm run start    # Start production server (after build)
npm run lint     # Run ESLint
```

---

## Project Structure

```
app/                    Next.js App Router pages + API routes
src/
├── components/         Shared UI components
├── features/
│   ├── search/         Search intent + result logic
│   ├── coupons/        Coupon rules engine
│   └── affiliate/      Affiliate link + click tracking
├── lib/
│   └── supabase/       Browser + server Supabase clients
├── server/             Server-only utilities
├── services/
│   ├── platform.interface.ts   PlatformAdapter interface
│   ├── lazada/         Lazada REST API adapter (Phase 1)
│   └── shopee/         Shopee GraphQL API adapter (Phase 1)
├── styles/             Global styles
└── types/              Shared TypeScript types
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check → `{ status, timestamp, version }` |

---

## Git Flow

```
main        — production (protected, PR-only)
develop     — integration branch (default)
feature/*   — one branch per task
```

**Daily workflow:**

```bash
# Start a new task
git checkout develop
git pull origin develop
git checkout -b feature/task-name

# After coding + passing build
git add <files>
git commit -m "feat(scope): description"
git push origin feature/task-name
# Open PR → develop
```

**Commit convention:**

```
feat(scope):     new feature
fix(scope):      bug fix
chore(scope):    config / tooling
docs(scope):     documentation
refactor:        no behavior change
test:            tests only
```

---

## Deploy Process

### Preview (per PR)

1. Push branch → open PR to `develop`
2. Ruk-Com-Cloud auto-deploys a preview URL
3. Test on preview URL before merging

### Production

1. Merge `develop` → `main` (via PR)
2. Ruk-Com-Cloud auto-deploys to production
3. Verify `GET /api/health` returns 200 on production URL

### Manual deploy (if needed)

```bash
npm run build        # verify build passes locally first
# then trigger redeploy from Ruk-Com-Cloud dashboard
```

### Required env check before deploy

- [ ] All `✅ Required` env variables set in Ruk-Com-Cloud dashboard
- [ ] `npm run build` passes locally
- [ ] `/api/health` returns 200 on preview URL
