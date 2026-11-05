import { getLocationById } from "./api";
import type { NearbyPlaceDetail } from "./nearbyTypes";
import { formatOpeningHours, isOpenNow } from "./openingHours";

/** GET location detail — dữ liệu thật từ `locationService`, thêm giờ mở cửa đã định dạng. */
export async function getNearbyPlaceDetail(id: string): Promise<NearbyPlaceDetail> {
    const location = await getLocationById(id);
    return {
        ...location,
        hours: location.openingHours ? formatOpeningHours(location.openingHours) : [],
        openNow: location.openingHours ? isOpenNow(location.openingHours) : false,
    };
}
