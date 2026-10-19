import { getLocationById } from "@/services/locationService";
import type { NearbyPlaceDetail } from "@/types/nearby";
import { formatOpeningHours, isOpenNow } from "@/utils/openingHours";

/** GET location detail — dữ liệu thật từ `locationService`, thêm giờ mở cửa đã định dạng. */
export async function getNearbyPlaceDetail(id: string): Promise<NearbyPlaceDetail> {
    const location = await getLocationById(id);
    return {
        ...location,
        hours: location.openingHours ? formatOpeningHours(location.openingHours) : [],
        openNow: location.openingHours ? isOpenNow(location.openingHours) : false,
    };
}
