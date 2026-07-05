import type { Category } from "../lib/types";

export const CATEGORIES: Category[] = [
  { id: "an-uong", label: "Ăn uống / Nhà hàng", icon: "🍜" },
  { id: "sieu-thi", label: "Siêu thị", icon: "🛒" },
  { id: "tien-loi", label: "Cửa hàng tiện lợi", icon: "🏪" },
  { id: "mua-sam-online", label: "Mua sắm online", icon: "🛍️" },
  { id: "mua-sam-offline", label: "Mua sắm offline", icon: "🏬" },
  { id: "thoi-trang", label: "Thời trang", icon: "👗" },
  { id: "du-lich", label: "Du lịch", icon: "✈️" },
  { id: "giai-tri", label: "Giải trí", icon: "🎬" },
  { id: "xang-dau", label: "Xăng dầu", icon: "⛽" },
  { id: "bao-hiem", label: "Bảo hiểm", icon: "🛡️" },
  { id: "suc-khoe-giao-duc", label: "Sức khoẻ / Giáo dục", icon: "💊" },
  { id: "nuoc-ngoai", label: "Chi tiêu nước ngoài", icon: "🌐" },
  { id: "khac", label: "Khác", icon: "💳" },
];

export const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
