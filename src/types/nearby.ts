/** Trang chi tiết địa điểm: toàn bộ dữ liệu lấy từ `LocationItem` (bảng DB), cộng giờ mở cửa đã định dạng. */
import type { LocationItem } from "@/types/location";

export interface NearbyPlaceDetail extends LocationItem {
    /** Đang mở cửa lúc này (theo giờ máy người dùng); chỉ có nghĩa khi `hours` không rỗng. */
    openNow: boolean;
    hours: { day: string; dayKey?: string; hours: string; today?: boolean }[];
}
