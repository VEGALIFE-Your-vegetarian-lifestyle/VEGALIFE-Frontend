/** Khu vực (quận/huyện TP.HCM) để chọn khi người dùng chưa cho phép vị trí. Tọa độ là điểm trung tâm gần đúng. */
export const MOCK_AREAS = [
    { key: "district1", lat: 10.7769, lng: 106.7009 },
    { key: "district3", lat: 10.7843, lng: 106.6844 },
    { key: "district4", lat: 10.7578, lng: 106.7013 },
    { key: "district5", lat: 10.754, lng: 106.6634 },
    { key: "district6", lat: 10.748, lng: 106.6352 },
    { key: "district7", lat: 10.734, lng: 106.7219 },
    { key: "district8", lat: 10.724, lng: 106.6286 },
    { key: "district10", lat: 10.7746, lng: 106.6679 },
    { key: "district11", lat: 10.7629, lng: 106.65 },
    { key: "district12", lat: 10.8672, lng: 106.6413 },
    { key: "binhThanh", lat: 10.8106, lng: 106.7091 },
    { key: "goVap", lat: 10.8386, lng: 106.6652 },
    { key: "phuNhuan", lat: 10.7992, lng: 106.6803 },
    { key: "tanBinh", lat: 10.8015, lng: 106.6527 },
    { key: "tanPhu", lat: 10.7906, lng: 106.6281 },
    { key: "binhTan", lat: 10.7654, lng: 106.6038 },
    { key: "thuDuc", lat: 10.8494, lng: 106.7537 },
    { key: "binhChanh", lat: 10.6874, lng: 106.5936 },
    { key: "nhaBe", lat: 10.695, lng: 106.737 },
    { key: "hocMon", lat: 10.886, lng: 106.592 },
    { key: "cuChi", lat: 10.9733, lng: 106.4933 },
    { key: "canGio", lat: 10.4114, lng: 106.954 },
] as const;

export type MockAreaKey = (typeof MOCK_AREAS)[number]["key"];
