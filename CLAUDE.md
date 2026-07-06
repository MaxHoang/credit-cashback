# credit-cashback

Web app (React + Vite + TS) tra cứu & so sánh **hoàn tiền thẻ tín dụng VN**. Mobile-first, tiếng Việt,
deploy public (GitHub Pages) để share. Mở rộng thẻ = thêm entry vào `src/data/cards.json`.

## Core feature
Chọn/tìm danh mục hoặc merchant (vd "Shopee") → xếp hạng thẻ theo **% hoàn tiền hiệu dụng**, kèm điều
kiện (cap, min spend, độ tin cậy, nguồn). Merchant→MCC→danh mục qua `merchants.json`.

## Thẻ v1 (7)
Cake Freedom · VPBank StepUp · TCB Spark · TCB Everyday · MB JCB Ultimate · MB Priority Visa Signature · VIB Travel Elite.

## Nguyên tắc dữ liệu (tài chính — quan trọng)
- Số hoàn tiền là **best-effort research + gắn cờ tin cậy** (high/medium/low) + nguồn + as_of.
- KHÔNG bịa số. UI luôn hiện **disclaimer** "tỷ lệ có thể thay đổi — xác nhận với ngân hàng". Không phải lời khuyên tài chính.
- Quân (chủ thẻ) là nguồn chuẩn nhất → dễ sửa `cards.json`.

## Run
- `npm install` · `npm run dev` (5173) · `npm test` · `npm run build`
- Deploy: push main → GitHub Actions → Pages (bật Pages: Settings → Pages → GitHub Actions).
- Sửa số liệu: `src/data/cards.json` / `src/data/merchants.json`.

## Status — v2 built + tested on dev, DEPLOY-READY for lagomlab
- Frontend (Pages): v1 features + accounts (Google SSO) + amount-aware ranking + spend-tier-as-info + 79 curated merchants. Logged-out = v1 behavior.
- Backend (`backend/`, PocketBase+SQLite → `card.lagomlab.tech`): profile fields + owner-only rules + public-read `merchants` collection (53k VN merchants from rcgv). Frontend integrates via `src/lib/pb.ts` (`VITE_PB_URL`).
- **Deploy:** full self-contained sequence in `docs/RUNBOOK-deploy-lagomlab.md` (lagomlab Claude).
- **Needs from Quân:** Google OAuth client (redirect `https://card.lagomlab.tech/api/oauth2-redirect`); set repo variable `VITE_PB_URL=https://card.lagomlab.tech`.
- Follow-up (post-deploy): wire frontend merchant search → backend `merchants` collection for long-tail.
