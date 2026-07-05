# credit-cashback v2 — Tài khoản & Cá nhân hoá (Design Spec)

- **Ngày:** 2026-07-05
- **Phạm vi:** Sub-project v2. Thêm đăng nhập Google + lưu "thẻ của tôi" & "lựa chọn nhóm" trên server →
  ranking **chính xác** (hết đoán pick-n). Nối tiếp v1 (đã live: https://maxhoang.github.io/credit-cashback/).
- **Tiền đề:** v1 static SPA trên GitHub Pages. Xem [[project-credit-cashback]].

## 1. Mục tiêu

Với thẻ cho **chọn nhóm** (Cake: 2 nhóm linh hoạt; MB Priority: Mâm 1 chọn 1, Mâm 2 chọn 2), user khai
**thực tế mình chọn gì** → app tính đúng % (không còn "best-achievable + điều kiện"). User cũng khai **thẻ
đang giữ** → lọc "chỉ thẻ của tôi". Đăng nhập **Google SSO only**, dữ liệu lưu **server**.

## 2. Kiến trúc & ràng buộc (đã chốt)

- **Production = lagomlab.tech** (self-host, Cloudflare-managed). **Single node → SQLite.**
- **Backend = PocketBase** (1 binary Go + SQLite nhúng): Google OAuth built-in, REST API + JS SDK, access
  rules per-record (như RLS). "DB đơn giản, gần như 0 maintenance" — backup = copy `pb_data/`.
- **Frontend = React app v1 (giữ trên GitHub Pages)** + PocketBase JS SDK. Anonymous vẫn dùng như v1;
  đăng nhập → cá nhân hoá.
- **Deploy do Claude-lagomlab làm SAU** khi test xong. Tôi build+test ở **VPS dev này** (chạy PocketBase local),
  commit repo + viết **runbook handoff**; sync qua GitHub.
- Secrets (Google OAuth client secret, PocketBase admin) **KHÔNG commit** — env/setup steps trong runbook.

## 3. Data model (PocketBase collection `users` — auth, mở rộng field)

OAuth-only (tắt password signup). Mỗi user 1 record; thêm field:
```
owned_cards:        json   // string[] card ids đang giữ (subset 7 thẻ)
picks:              json   // lựa chọn nhóm per thẻ, vd:
  // { "cake-freedom": { "flex": ["an-uong","sieu-thi"] },
  //   "mb-priority-visa-signature": { "mam1": "bao-hiem", "mam2": ["sieu-thi","thoi-trang"] } }
default_spend_tier: text   // "lt10"|"m10_30"|"m30_100"|"gte100"
```
**Access rules** (`users` collection): view/update **chỉ chính chủ** (`id = @request.auth.id`); không ai đọc data người khác. List/search: disabled cho user thường.

## 4. Ranking cá nhân hoá (mở rộng logic thuần v1)

`effectiveRate(card, categoryId, { spendTier, merchant?, userPicks?, amount? })`:
- Nếu **có `userPicks`** cho thẻ này (đã đăng nhập + đã khai): nhóm pick-n áp dụng rate **chỉ khi** `categoryId`
  nằm trong lựa chọn của user cho group đó; ngược lại → `default_rate`. → % **chính xác**, không còn điều kiện "nếu chọn".
- Không có `userPicks` (anonymous / chưa khai) → hành vi v1 (best-achievable + điều kiện). Giữ nguyên, không phá.
- **`amount` (số tiền giao dịch) — v2 CORE:** khi có `amount`, tính **tiền hoàn thực = min(amount × rate, cap_monthly)**
  và trả `estimatedCashback`. Giải quyết đúng ca của Quân: bảo hiểm 10tr → MB JCB (10%, cap 400k) = 400k **>**
  Cake (20%, cap 200k) = 200k. `rankCards` khi có `amount` → **xếp theo `estimatedCashback` giảm dần** (không phải rate);
  không có `amount` → xếp theo rate như trước.
- `rankCards(..., { userPicks?, onlyOwned?, ownedCards?, amount? })`: `onlyOwned` → lọc còn thẻ user giữ.

Logic vẫn **thuần, test Vitest**. Không đụng backend từ hàm ranking (nhận `userPicks`/`amount` như tham số).

## 5. Frontend (thêm vào app v1)

- SDK: `pocketbase` (JS). Config `VITE_PB_URL` (build-time): dev `http://localhost:8090`, prod = domain lagomlab.
- **Đăng nhập:** nút "Đăng nhập với Google" → `pb.collection('users').authWithOAuth2({ provider: 'google' })`.
  Trạng thái auth lưu trong localStorage (PocketBase SDK tự quản); hiện avatar + "Đăng xuất".
- **Màn "Thẻ của tôi":** chọn thẻ đang giữ (checkbox 7 thẻ); với thẻ pick-n đang giữ → chọn nhóm (Cake: 2/5;
  MB Priority Mâm 1: 1/4, Mâm 2: 2/4) bằng UI ràng buộc đúng số lượng; chọn `default_spend_tier`. Lưu → PocketBase.
- **Ranking:** đăng nhập → dùng `userPicks` (chính xác) + toggle **"Chỉ thẻ của tôi / Tất cả"**. Chưa đăng nhập → như v1.
- Không có backend → app vẫn chạy (degrade về v1 anonymous). Frontend vẫn deploy Pages như cũ.

## 6. Build – Test – Handoff (quan trọng)

1. **Dev VPS (tôi):** tải PocketBase binary, tạo collection/field + access rules (qua `pb_migrations/` JS migration
   để version-control schema), bật Google OAuth (test client), chạy app React trỏ `localhost:8090`, test E2E.
2. **Test tự động:** ranking cá nhân hoá (`effectiveRate` + `userPicks`) — Vitest thuần. Access-rule isolation —
   integration test nhỏ trên PocketBase local (user A không đọc được profile user B). Login/settings — render test (mock SDK).
3. **Handoff:** commit `pb_migrations/`, `docker-compose.yml` (chạy PocketBase), frontend changes, và
   **`docs/RUNBOOK-deploy-lagomlab.md`** (Claude-lagomlab đọc để deploy): chạy PocketBase sau Cloudflare
   (hostname vd `api.credit-cashback...`), set Google OAuth **prod redirect URI**, env, backup `pb_data`, bật provider Google.
4. **Deploy prod:** Claude-lagomlab thực hiện sau khi Quân duyệt kết quả test ở dev.

## 7. Cần Quân/Claude-lagomlab chuẩn bị (external — ghi rõ, không giả định)

- **Google Cloud OAuth Client** (Web): Authorized redirect URIs cho **cả dev** (`http://localhost:8090/api/oauth2-redirect`)
  **và prod** (`https://card.lagomlab.tech/api/oauth2-redirect`). Client ID + Secret nhập vào PocketBase (không commit).
- **Domain PocketBase (prod) = `card.lagomlab.tech`** trên Cloudflare (lagomlab) — Claude-lagomlab cấu hình lúc deploy.
  `VITE_PB_URL` prod = `https://card.lagomlab.tech`.

## 8. Out of scope (v2)
- Multi-node/scaling (single-node cố ý).
- Tự deploy prod (Claude-lagomlab làm sau khi Quân duyệt test).

## 9. Đã chốt
- Lưu trên record `users` (field owned_cards/picks/default_spend_tier) — gọn cho single-node.
- **Amount-input NẰM TRONG v2 core** (mục 4).
- Domain prod = `card.lagomlab.tech`; `VITE_PB_URL` prod = `https://card.lagomlab.tech`.
