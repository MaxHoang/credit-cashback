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

## Status
- Phase: Design. Spec: `docs/superpowers/specs/`.

## v2 (accounts + amount-aware) — built on dev, awaiting lagomlab deploy
- Backend: PocketBase (`backend/`, SQLite). Frontend integrates via `src/lib/pb.ts` (`VITE_PB_URL`).
- Personalized + amount-aware ranking live in `src/lib/ranking.ts`. Logged-out = v1 behavior.
- Deploy to `card.lagomlab.tech`: see `docs/RUNBOOK-deploy-lagomlab.md` (lagomlab Claude, after Quân approves dev test).
- Needs: Google OAuth client (redirect `https://card.lagomlab.tech/api/oauth2-redirect`), `VITE_PB_URL` prod env.
