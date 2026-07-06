# Runbook — Deploy `credit-cashback` to production (lagomlab.tech)

**Audience:** the Claude on the lagomlab VPS (Dev+Prod). You have `git pull` access to
`github.com/MaxHoang/credit-cashback` and control of the Cloudflare-managed domain.
Everything code/data-side is already committed on `main` — this runbook is the deploy sequence.

## What you are deploying

| Piece | Where | What |
|-------|-------|------|
| **Frontend** | GitHub Pages (`maxhoang.github.io/credit-cashback/`) | React static app. Anonymous features (search, ranking, amount-aware) need no backend. |
| **Backend** | `card.lagomlab.tech` (this VPS) | PocketBase (single Go binary + SQLite): Google-SSO accounts + personalization + 53k merchant→MCC→category lookup. |

Frontend talks to backend only for **login + saving "Thẻ của tôi" + merchant lookup**. With the
backend down or `VITE_PB_URL` unset, the app still works anonymously (login degrades gracefully).

## Already prepared on `main` (nothing to build)
- `backend/docker-compose.yml`, `backend/run-dev.sh` — run PocketBase.
- `backend/pb_migrations/` — auto-applied on start: `users` profile fields + owner-only rules; `merchants` collection (public-read).
- `backend/data/merchants.jsonl` — 53,097 VN merchants `{name, mcc, category, method}` (from rcgv.vn/check-mcc, mapped to the app's 13 categories).
- `backend/import-merchants.mjs` — one-time bulk import (uses the `pocketbase` npm dep).
- `.github/workflows/deploy.yml` — Pages build reads repo variable `VITE_PB_URL`.

## What you must supply (secrets — NEVER commit)
- **Google OAuth client** (from Quân): Client ID + Secret. Authorized redirect URI must include
  `https://card.lagomlab.tech/api/oauth2-redirect`.
- **PocketBase superuser** admin email + password (store in your secret manager).

---

## Step 0 — Pull latest
```bash
cd <repo>/credit-cashback && git fetch && git pull --ff-only origin main
```

## Step 1 — Run PocketBase
```bash
cd backend
docker compose up -d          # serves :8090, applies migrations from pb_migrations/
sleep 5 && curl -sf http://localhost:8090/api/health   # expect {"code":200,...}
```
Migrations auto-apply: `users` gets `owned_cards/picks/default_spend_tier` + owner-only rules, and the
public-read `merchants` collection is created. Data lives in `backend/pb_data/` (git-ignored).

## Step 2 — Expose at card.lagomlab.tech (Cloudflare)
Add a tunnel ingress hostname `card.lagomlab.tech` → `http://localhost:8090` (same pattern as other
lagomlab services). PocketBase serves the REST API + admin UI at that host over Cloudflare TLS.
```bash
curl -sf https://card.lagomlab.tech/api/health    # expect 200 once the tunnel is live
```

## Step 3 — Superuser + Google-only auth  🔒 SECURITY-CRITICAL
```bash
cd backend && ./pocketbase superuser upsert <ADMIN_EMAIL> '<ADMIN_PW>'   # or docker exec
```
Then open `https://card.lagomlab.tech/_/` (superuser login) → **Settings → Auth providers**:
- **Enable Google ONLY.** Paste the Google Client ID + Secret.
- **DISABLE password/identity auth** on the `users` collection.
  ⚠️ The `users` `createRule` is `""` (public-create, required for OAuth signup). This is safe **only if
  password auth is disabled** — otherwise public email/password signup is open. Do not skip this.

## Step 4 — Import the 53k merchant dataset (one-time)
From the repo root, with the backend reachable:
```bash
PB_URL=https://card.lagomlab.tech \
PB_ADMIN_EMAIL=<ADMIN_EMAIL> PB_ADMIN_PASSWORD='<ADMIN_PW>' \
  node backend/import-merchants.mjs
# ~53k sequential creates → several minutes. Expect "done: 53097 processed, ok=53097, fail=0".
# Partial test first if you like: prefix IMPORT_LIMIT=500
```
Verify:
```bash
curl -s "https://card.lagomlab.tech/api/collections/merchants/records?perPage=1" \
  | grep -o '"totalItems":[0-9]*'      # expect ~53097
```

## Step 5 — Point the frontend at the backend
1. GitHub → repo **Settings → Secrets and variables → Actions → Variables** → new repository variable
   `VITE_PB_URL = https://card.lagomlab.tech`.
2. Re-run the deploy workflow (Actions → "Deploy to GitHub Pages" → Run workflow on `main`), or push any commit.
   The Pages build now bakes in the prod backend URL, so login works from the live site.
   - Note: GitHub Pages limits ~10 deploys/hour/repo; if a deploy fails with "try again later," wait and re-run.

## Step 6 — Verify end-to-end
- `curl -sf https://card.lagomlab.tech/api/health` → 200.
- On the live Pages site: **Đăng nhập với Google** → succeeds → set **Thẻ của tôi** → reload → selections persisted → ranking personalizes.
- **Isolation:** a second Google account cannot read the first's record (owner-only rule). Confirm via two logins.
- **Backup:** snapshot `backend/pb_data/` (tar/cp) — it is the entire SQLite state.

---

## Follow-up (not required for first deploy)
The 53k `merchants` collection is imported and queryable, but the **frontend does not yet query it** —
merchant search currently uses the bundled curated `src/data/merchants.json` (79 merchants, with
online/convenience overrides). Wiring the frontend to fall back to the backend for long-tail merchants
(`GET /api/collections/merchants/records?perPage=5&filter=name~'<q>'` → use returned `category`) is a
follow-up feature — do it after the backend is live so it can be tested end-to-end.

## Rollback
- Frontend: re-run the workflow on a prior `main` commit (Pages redeploys the older bundle).
- Backend: `docker compose down`; restore the `pb_data/` backup; `docker compose up -d`.
