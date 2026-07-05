# credit-cashback — Design Spec

- **Ngày:** 2026-07-05
- **Project:** `credit-cashback` (`~/projects/credit-cashback`, repo `github.com/MaxHoang/credit-cashback`, private)
- **Mục tiêu:** Web app mobile-first (tiếng Việt) tra cứu & so sánh hoàn tiền thẻ tín dụng VN; deploy public để share; mở rộng thẻ dễ dàng.

## 1. Core feature & scope

Người dùng **tìm theo danh mục hoặc gõ tên merchant** (vd "Shopee") → app map merchant→MCC→danh mục → xếp
hạng thẻ theo **% hoàn tiền hiệu dụng** kèm điều kiện (cap, min-spend, độ tin cậy, nguồn).

- **v1 = tra cứu thuần** (không theo dõi chi tiêu cá nhân). Có dropdown "mức chi tiêu/tháng" để tính đúng thẻ theo bậc.
- **Thẻ v1 (7):** Cake Freedom, VPBank StepUp, TCB Spark, TCB Everyday, MB JCB Ultimate, MB Priority Visa Signature, VIB Travel Elite.
- **Out of scope:** theo dõi/nhập chi tiêu, trừ cap thực tế, đăng nhập, backend/DB.

## 2. Nguyên tắc dữ liệu tài chính (BẮT BUỘC)

- Số hoàn tiền = **best-effort research**, mỗi tỷ lệ gắn `confidence` (high/medium/low) + `source` + `as_of`.
- **KHÔNG bịa số.** Nhóm không rõ → `default_rate` + note "chưa xác nhận".
- 2 thẻ TCB dùng **U-Point** (Quân xác nhận 1 điểm = 1 VND → quy ra %); VIB dùng **dặm** (giá trị chính = phòng chờ sân bay, cashback yếu) → `reward_type` đánh dấu, note rõ "ước tính".
- UI **luôn** hiện disclaimer: *"Tỷ lệ có thể thay đổi — vui lòng xác nhận với ngân hàng. Đây không phải lời khuyên tài chính."* + "cập nhật lần cuối".

## 3. Tech stack & kiến trúc

- **React + Vite + TypeScript** (TS = an toàn kiểu cho data tài chính). Không UI lib nặng; CSS mobile-first thuần.
- **Vitest** cho logic thuần. Build tĩnh (`vite build` → `dist/`) → **GitHub Pages** (URL public, share link).
- Dữ liệu tách khỏi code: `src/data/cards.json`, `src/data/categories.ts`, `src/data/merchants.json` → mở rộng = sửa data.

### File structure (dự kiến)
```
src/
  data/{categories.ts, cards.json, merchants.json}
  lib/{ranking.ts, resolve.ts, types.ts}      # thuần, có test
  components/{SearchBar, CategoryGrid, CardList, CardDetail, ConfidenceBadge, Disclaimer, SpendTierSelect}
  App.tsx, main.tsx, styles.css
tests/{ranking.test.ts, resolve.test.ts, data.test.ts}
```

## 4. Data model

### 4.1 Categories (13)
`{ id, label, icon }` — ids: `an-uong, sieu-thi, tien-loi, mua-sam-online, mua-sam-offline, thoi-trang,
du-lich, giai-tri, xang-dau, bao-hiem, suc-khoe-giao-duc, nuoc-ngoai, khac`.

### 4.2 Card
```ts
type Card = {
  id: string; name: string; issuer: string; network: string;
  annual_fee: number; annual_fee_note?: string;
  reward_type: "cashback" | "points" | "miles";   // points/miles -> % ước tính (note)
  scheme: "flat" | "pick-n" | "spend-tier";
  min_monthly_spend: number;          // ngưỡng mở khoá; 0 nếu không
  monthly_cap_total: number | null;   // cap tổng/kỳ
  default_rate: number;               // % cho danh mục không liệt kê (decimal)
  excluded_categories: string[];      // 0% / không áp dụng
  confidence: "high" | "medium" | "low"; as_of: string; sources: string[]; notes: string[];
  rates: Rate[];
};
type Rate = {
  category: string; rate: number;     // decimal, vd 0.10
  cap_monthly?: number | null; cap_per_txn?: number | null; min_txn?: number | null;
  group?: string;                     // "fixed"|"flex"|"mam1"|"mam2" cho pick-n
  tier?: string;                      // cho spend-tier: khớp SpendTier id
  online_only?: boolean;
  excluded_merchants?: string[];      // vd Shopee bị loại khỏi rate này -> dùng default_rate
  confidence?: "high"|"medium"|"low"; note?: string;
};
```

### 4.3 Merchant (merchants.json)
`{ name, aliases: string[], mcc: string, category: string, note?: string }` — seed các merchant VN phổ biến:
Shopee, ShopeeFood, Lazada, Tiki, Grab, GrabFood, Be, Circle K, GS25, Ministop, WinMart, Bách Hoá Xanh,
Co.opmart, Highlands, Starbucks, CGV, Galaxy, Vietjet, Bảo Việt/MIC, VNPay… (mở rộng dễ).

### 4.4 SpendTier (cho ranking thẻ spend-tier)
`{ id, label }`: `lt10 (<10tr) / m10_30 (10–30tr) / m30_100 (30–100tr) / gte100 (≥100tr)`. Mặc định `m10_30`.

## 5. Seed dữ liệu 7 thẻ (research 2026-07-05 — gắn cờ; Quân verify sau)

> Giá trị dưới đây được nạp vào `cards.json` ở bước build. Đơn vị rate = decimal (0.10 = 10%).

- **Cake Freedom** — cashback, pick-n, min 5.000.000, cap tổng 1.000.000, cap/nhóm 200.000, per-tx cap 50k(≥200k)/10k(<200k). **conf high** (cake.vn) nhưng danh sách fixed/flex **medium**. Cố định 20%: `mua-sam-online, du-lich, thoi-trang`. Linh hoạt(chọn 2) 20%: `an-uong, sieu-thi(1tx/ngày), tien-loi, bao-hiem, giai-tri`. Loại: `xang-dau`. default 0. Nguồn: cake.vn T&C.
- **VPBank StepUp** — cashback, spend-tier, min 0, **conf medium** (T&C hết hạn 11/2025). `mua-sam-online`: tier gte100→0.15(cap1.5tr), m10_30/m30_100→0.15(cap700k), lt10→0.06(cap300k); `an-uong`: ≥m10_30→0.04(cap200k), lt10→0.02(cap100k); default 0.001. `excluded_merchants` cho online: Shopee/ShopeeFood; loại `xang-dau`; bảo hiểm về default. Nguồn: vpbank.com.vn PDF.
- **TCB Spark** — points(1:1), flat, cap tổng 500.000, **conf medium**. `du-lich,thoi-trang,giai-tri`=0.08; `an-uong,mua-sam-online`=0.02; default 0.001. Nguồn: techcombank.com.
- **TCB Everyday** — points(1:1), spend-tier(cap), cap 500k(m10_30)/700k(gte m30_100), **conf medium**. `mua-sam-online`=0.03 (note: quốc tế 0.08); `an-uong`=0.01; default 0.001. Nguồn: techcombank.com.
- **MB JCB Ultimate** — cashback, flat, cap tổng 800.000, **conf high** (tienphong 01/11/2025). `bao-hiem`=0.10(cap400k); `suc-khoe-giao-duc`=0.10 (chung cap 800k); default 0.001 (note: nhóm khác chưa rõ ưu đãi). Nguồn: tienphong.vn, rcgv.vn.
- **MB Priority Visa Signature** — cashback, pick-n(Mâm), **min 10.000.000**, cap tổng 800.000, phí 1.299.000 (miễn năm 1; miễn nếu chi ≥100tr/năm), **conf medium**. Mâm1(chọn1,10%,cap400k): `an-uong,du-lich,giai-tri,bao-hiem`. Mâm2(chọn2,2%,cap400k): `sieu-thi,thoi-trang,mua-sam-online,suc-khoe-giao-duc`. Note: sinh nhật x2; `suc-khoe` mâm chưa chắc. default 0.001. Nguồn: mbbank.com.vn, rcgv.vn.
- **VIB Travel Elite** — miles, flat, **conf low**. default ~0.003 (ước tính từ dặm ~1/30.000). `nuoc-ngoai` note "0% phí ngoại tệ 3 kỳ đầu"; `du-lich` note "lounge + ưu đãi đối tác". Note nổi bật: *"Giá trị chính = phòng chờ sân bay; chương trình hoàn tiền yếu/đã hết hạn."* Nguồn: vib.com.vn.

## 6. Logic (thuần, test Vitest)

- `resolveQuery(text, merchants, categories) → { kind: "merchant"|"category"|"none", merchant?, mcc?, categoryId?, suggestions[] }`
  — fuzzy match alias merchant + label danh mục; trả gợi ý khi mơ hồ.
- `effectiveRate(card, categoryId, {spendTier, merchant?}) → { rate, capMonthly, minSpend, eligible, confidence, note, conditions[] }`
  — `excluded_categories`→eligible=false,rate 0; `excluded_merchants` khớp→dùng default_rate; spend-tier→rate theo `tier`; pick-n→rate theo group (giả định đã chọn, note); else default_rate.
- `rankCards(categoryId, cards, opts) → RankedCard[]` — giảm dần theo rate; tie-break cap↑ rồi confidence↑. Kèm điều kiện hiển thị.
- Test: Bảo hiểm→MB JCB Ultimate #1(10%); "Shopee"→mua-sam-online, VPBank bị `excluded_merchants`→tụt hạng; spend-tier đổi theo dropdown; nhóm loại không lọt top.

## 7. UI (mobile-first, tiếng Việt)

- **Trang chủ:** header + **Disclaimer** + "cập nhật lần cuối"; **SearchBar** (gõ danh mục/merchant, autocomplete); lưới **13 danh mục**; **SpendTierSelect**; link "Tất cả thẻ".
- **Kết quả:** nếu merchant → dòng "Shopee → MCC 5399 (Mua sắm online)"; danh sách thẻ xếp hạng, **#1 nổi bật 👑**: % hiệu dụng, cap/tháng, điều kiện (min-spend…), **ConfidenceBadge** 🟢🟡🔴, note; bấm → chi tiết.
- **Chi tiết thẻ:** phí, reward_type, min-spend, cap tổng, **bảng % mọi danh mục**, confidence+as_of+**link nguồn**, notes, disclaimer.
- **Tất cả thẻ:** danh sách 7 thẻ.
- Responsive, chạm tốt, 100% tiếng Việt.

## 8. Testing & verify

- Vitest: `ranking.test.ts`, `resolve.test.ts`, `data.test.ts` (validate schema: mọi `rate.category`/`excluded_categories`/`merchant.category` là category id hợp lệ; rate∈[0,1]; card có đủ field bắt buộc).
- Build pass (`vite build`), app render (dùng harness `/run` hoặc preview).
- Deploy GitHub Pages → mở URL trên điện thoại kiểm tra.

## 9. Build qua harness dev-orchestrator

Dogfood: Opus điều phối, subagent implement (route task non-sensitive coding qua `route_llm`/Gemini khi hợp
lý), gates TDD→verify→code-review→security-review trước commit. Data là **thông tin thẻ công khai** (không
Sovico/KYC/secret) → non-sensitive; nhưng **độ chính xác tài chính** là tiêu chí review quan trọng.

## 10. Deployment

- `vite build` → `dist/` → GitHub Pages (`base` config = `/credit-cashback/`). Public URL share bạn bè.
- Không secret, không backend. Cập nhật số = sửa `cards.json` → rebuild → redeploy.

## 11. Open items
- SpendTier mặc định `m10_30` — chỉnh nếu Quân muốn.
- Danh sách merchant seed sẽ mở rộng dần; per-card MCC-exclusion chỉ seed case đã biết (VPBank×Shopee).
- Số liệu nhiều thẻ ở mức medium/low → Quân verify qua app ngân hàng để nâng cờ.
