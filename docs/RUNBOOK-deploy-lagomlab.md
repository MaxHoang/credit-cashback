# Runbook — Deploy credit-cashback v2 backend on lagomlab.tech

Backend = PocketBase (single binary + SQLite). Domain: **card.lagomlab.tech** (Cloudflare).

## 1. Run PocketBase
- `cd backend && docker compose up -d` (or run the binary with `--migrationsDir=./pb_migrations`).
- Migrations in `backend/pb_migrations/` auto-apply on start (adds users.owned_cards/picks/default_spend_tier + owner-only rules).
- Data persists in `backend/pb_data/` — **back up this dir** (cp/tar) for backup; single SQLite file tree.

## 2. Cloudflare + TLS
- Point `card.lagomlab.tech` → the PocketBase port (8090) via the existing Cloudflare tunnel (add an ingress hostname → http://localhost:8090). PocketBase serves the API + admin at that host.

## 3. First-run admin + Google OAuth (secrets — NOT in git)
- Open `https://card.lagomlab.tech/_/` → create the superuser admin (store creds in the secret manager).
- Admin → Settings → Auth providers → enable **Google ONLY** (disable others). Paste Google **Client ID + Secret**.
- In Google Cloud console, the OAuth client's Authorized redirect URI must include:
  `https://card.lagomlab.tech/api/oauth2-redirect`
  (and `http://localhost:8090/api/oauth2-redirect` for dev).
- Users collection: confirm password auth disabled (OAuth-only) for production.

## 4. Frontend
- The GitHub Pages frontend must be built with `VITE_PB_URL=https://card.lagomlab.tech`.
  Update the Pages build (repo secret/variable `VITE_PB_URL`) or the workflow env, then re-deploy.
- CORS: PocketBase allows the Pages origin by default via its API; if blocked, add the Pages origin.

## 5. Verify
- `curl -sf https://card.lagomlab.tech/api/health` → 200.
- Log in with Google from the app → set "Thẻ của tôi" → confirm ranking personalizes; confirm a second account cannot read the first's record (owner-only rule).
