/** Khu vực có sẵn để chọn khi người dùng từ chối quyền vị trí (bản mock của "nhập địa chỉ"). */
export const MOCK_AREAS = [
    { key: "district1", lat: 10.7769, lng: 106.7009 },
    { key: "district3", lat: 10.7843, lng: 106.6844 },
    { key: "binhThanh", lat: 10.8106, lng: 106.7091 },
    { key: "thuDuc", lat: 10.8494, lng: 106.7537 },
    { key: "district7", lat: 10.734, lng: 106.7219 },
] as const;

export type MockAreaKey = (typeof MOCK_AREAS)[number]["key"];
