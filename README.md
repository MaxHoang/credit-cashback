# credit-cashback

Web app tra cứu & so sánh hoàn tiền thẻ tín dụng VN (mobile-first, tiếng Việt).

## Chạy local
- `npm install`
- `npm run dev` → http://localhost:5173
- `npm test` (Vitest) · `npm run build`

## Thêm/sửa thẻ
Sửa `src/data/cards.json` (rate = decimal, 0.10 = 10%). Merchant: `src/data/merchants.json`.
Mỗi rate/thẻ có `confidence` + `sources` + `as_of` — không bịa số.

## Deploy
Push `main` → GitHub Actions build + deploy GitHub Pages. Bật Pages: repo Settings → Pages → Source = GitHub Actions.

**Miễn trừ:** Tỷ lệ có thể thay đổi — xác nhận với ngân hàng. Không phải lời khuyên tài chính.
