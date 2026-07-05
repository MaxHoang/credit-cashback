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

## 6. Merchant dataset (53k VN merchants → MCC → category)
- `backend/data/merchants.jsonl` — **53,097** VN merchants `{name, mcc, category, method}` crawled from
  rcgv.vn/check-mcc (56,572 raw → deduped), mapped from rcgv's 23 categories to the app's 13. `name` is the
  raw statement descriptor (good for matching bank-statement text).
- Migration `backend/pb_migrations/1720300000_merchants_collection.js` creates a **public-read `merchants`**
  collection (indexes on name + mcc). Auto-applies on PocketBase start.
- **One-time import** (after PB up + superuser created):
  `PB_URL=https://card.lagomlab.tech PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node backend/import-merchants.mjs`
  (~53k sequential creates → several minutes; `IMPORT_LIMIT=N` for a partial run).
- **Frontend (production) usage (follow-up wiring):** resolve any merchant via
  `GET /api/collections/merchants/records?perPage=5&filter=name~'<q>'` → use the returned `category` for ranking.
  The bundled curated `src/data/merchants.json` (79, with online/convenience overrides) stays as the accurate
  fast-path / offline fallback; the backend collection is the long-tail.
- **Verified on dev VPS:** migration applies; `import-merchants.mjs` imported a 500-row subset (500/500 ok);
  public search endpoint returns records. Full 53k import runs identically on prod.
