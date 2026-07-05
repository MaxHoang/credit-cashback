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

## Run (điền khi build)
- TBD

## Status
- Phase: Design. Spec: `docs/superpowers/specs/`.
