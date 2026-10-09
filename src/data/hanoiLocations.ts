/**
 * Danh mục đơn vị hành chính TP. Hà Nội (Cập nhật mới nhất sau sắp xếp đơn vị hành chính)
 * Giới hạn các Quận/Huyện và Xã/Phường xung quanh Tiệm Chè Na trong bán kính 5 km
 */

export interface HanoiWard {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface HanoiDistrict {
  id: string;
  name: string;
  lat: number;
  lng: number;
  wards: HanoiWard[];
}

// Tọa độ chuẩn của Tiệm Chè Na (từ Google Maps: 20.9246936, 105.8551433)
export const SHOP_COORDINATES = {
  lat: process.env.SHOP_LAT ? parseFloat(process.env.SHOP_LAT) : 20.9246936,
  lng: process.env.SHOP_LNG ? parseFloat(process.env.SHOP_LNG) : 105.8551433,
  address: process.env.SHOP_ADDRESS || "Vũ Lăng, Thanh Trì, Hà Nội",
};

export const MAX_DELIVERY_DISTANCE_KM = 5; // Bán kính giao hàng tối đa 5km

/**
 * Danh sách Quận / Huyện xung quanh quán trong bán kính 5 km
 * ĐÃ CẬP NHẬT 5 ĐƠN VỊ HÀNH CHÍNH MỚI CỦA HUYỆN THANH TRÌ:
 * - Xã Thanh Trì (Khu Vực Quán)
 * - Xã Nam Phù
 * - Xã Ngọc Hồi
 * - Xã Đại Thanh
 * - Phường Thanh Liệt
 */
export const HANOI_DISTRICTS: HanoiDistrict[] = [
  {
    id: "thanh-tri",
    name: "Huyện Thanh Trì (Khu Vực Quán)",
    lat: 20.9247,
    lng: 105.8551,
    wards: [
      { id: "xa-thanh-tri", name: "Xã Thanh Trì (Khu Vực Quán)", lat: 20.9270, lng: 105.8530 },
      { id: "xa-nam-phu", name: "Xã Nam Phù", lat: 20.9160, lng: 105.8750 },
      { id: "xa-ngoc-hoi", name: "Xã Ngọc Hồi", lat: 20.9120, lng: 105.8500 },
      { id: "xa-dai-thanh", name: "Xã Đại Thanh", lat: 20.9400, lng: 105.8180 },
      { id: "phuong-thanh-liet", name: "Phường Thanh Liệt", lat: 20.9700, lng: 105.8150 },
    ],
  },
  {
    id: "hoang-mai",
    name: "Quận Hoàng Mai (Giáp phía Bắc)",
    lat: 20.9720,
    lng: 105.8500,
    wards: [
      { id: "hoang-liet", name: "Phường Hoàng Liệt", lat: 20.9650, lng: 105.8420 },
      { id: "thinh-liet", name: "Phường Thịnh Liệt", lat: 20.9750, lng: 105.8450 },
      { id: "yen-so", name: "Phường Yên Sở", lat: 20.9720, lng: 105.8650 },
      { id: "tran-phu", name: "Phường Trần Phú", lat: 20.9780, lng: 105.8780 },
      { id: "giap-bat", name: "Phường Giáp Bát", lat: 20.9850, lng: 105.8400 },
      { id: "tuong-mai", name: "Phường Tương Mai", lat: 20.9920, lng: 105.8480 },
      { id: "dinh-cong", name: "Phường Định Công", lat: 20.9820, lng: 105.8280 },
      { id: "dai-kim", name: "Phường Đại Kim", lat: 20.9750, lng: 105.8200 },
      { id: "tan-mai", name: "Phường Tân Mai", lat: 20.9880, lng: 105.8550 },
      { id: "vinh-hung", name: "Phường Vĩnh Hưng", lat: 20.9950, lng: 105.8800 },
      { id: "linh-nam", name: "Phường Lĩnh Nam", lat: 20.9850, lng: 105.8950 },
      { id: "mai-dong", name: "Phường Mai Động", lat: 20.9950, lng: 105.8600 },
    ],
  },
  {
    id: "thuong-tin",
    name: "Huyện Thường Tín (Giáp phía Nam)",
    lat: 20.8750,
    lng: 105.8650,
    wards: [
      { id: "duyen-thai", name: "Xã Duyên Thái (Giáp quán)", lat: 20.8950, lng: 105.8620 },
      { id: "ninh-so", name: "Xã Ninh Sở", lat: 20.9020, lng: 105.8850 },
      { id: "nhi-khe", name: "Xã Nhị Khê", lat: 20.8850, lng: 105.8450 },
      { id: "tt-thuong-tin", name: "Thị trấn Thường Tín", lat: 20.8750, lng: 105.8650 },
      { id: "van-binh", name: "Xã Văn Bình", lat: 20.8650, lng: 105.8600 },
      { id: "khanh-ha", name: "Xã Khánh Hà", lat: 20.8950, lng: 105.8300 },
      { id: "tien-phong", name: "Xã Tiền Phong", lat: 20.8600, lng: 105.8350 },
      { id: "ha-hoi", name: "Xã Hà Hồi", lat: 20.8600, lng: 105.8750 },
      { id: "lien-phuong", name: "Xã Liên Phương", lat: 20.8700, lng: 105.8850 },
    ],
  },
  {
    id: "ha-dong",
    name: "Quận Hà Đông (Phía Tây)",
    lat: 20.9700,
    lng: 105.7750,
    wards: [
      { id: "kien-hung", name: "Phường Kiến Hưng (Giáp quán)", lat: 20.9580, lng: 105.7950 },
      { id: "phuc-la", name: "Phường Phúc La (KĐT Xa La)", lat: 20.9650, lng: 105.7920 },
      { id: "van-quan", name: "Phường Văn Quán", lat: 20.9780, lng: 105.7880 },
      { id: "ha-cau", name: "Phường Hà Cầu", lat: 20.9680, lng: 105.7720 },
      { id: "quang-trung-hd", name: "Phường Quang Trung", lat: 20.9720, lng: 105.7780 },
      { id: "yet-kieu", name: "Phường Yết Kiêu", lat: 20.9760, lng: 105.7750 },
      { id: "nguyen-trai-hd", name: "Phường Nguyễn Trãi", lat: 20.9700, lng: 105.7820 },
      { id: "van-phuc-hd", name: "Phường Vạn Phúc", lat: 20.9820, lng: 105.7750 },
      { id: "mo-lao", name: "Phường Mộ Lao", lat: 20.9850, lng: 105.7850 },
      { id: "phu-la", name: "Phường Phú La", lat: 20.9550, lng: 105.7650 },
    ],
  },
  {
    id: "thanh-oai",
    name: "Huyện Thanh Oai (Giáp phía Tây Nam)",
    lat: 20.8800,
    lng: 105.7800,
    wards: [
      { id: "cu-khe", name: "Xã Cự Khê (KĐT Thanh Hà)", lat: 20.9380, lng: 105.7850 },
      { id: "my-hung", name: "Xã Mỹ Hưng", lat: 20.9150, lng: 105.7950 },
      { id: "bich-hoa", name: "Xã Bích Hòa", lat: 20.9300, lng: 105.7650 },
      { id: "tam-hung", name: "Xã Tam Hưng", lat: 20.8950, lng: 105.8050 },
    ],
  },
  {
    id: "thanh-xuan",
    name: "Quận Thanh Xuân (Phía Tây Bắc)",
    lat: 20.9950,
    lng: 105.8080,
    wards: [
      { id: "khuong-dinh", name: "Phường Khương Đình", lat: 20.9850, lng: 105.8150 },
      { id: "ha-dinh", name: "Phường Hạ Đình", lat: 20.9880, lng: 105.8080 },
      { id: "kim-giang", name: "Phường Kim Giang", lat: 20.9820, lng: 105.8120 },
      { id: "phuong-liet", name: "Phường Phương Liệt", lat: 20.9950, lng: 105.8380 },
      { id: "khuong-mai", name: "Phường Khương Mai", lat: 20.9980, lng: 105.8280 },
      { id: "khuong-trung", name: "Phường Khương Trung", lat: 20.9980, lng: 105.8180 },
      { id: "thanh-xuan-nam", name: "Phường Thanh Xuân Nam", lat: 20.9920, lng: 105.7980 },
    ],
  },
  {
    id: "hai-ba-trung",
    name: "Quận Hai Bà Trưng (Phía Bắc)",
    lat: 21.0050,
    lng: 105.8500,
    wards: [
      { id: "dong-tam", name: "Phường Đồng Tâm", lat: 20.9980, lng: 105.8420 },
      { id: "bach-khoa", name: "Phường Bách Khoa", lat: 21.0050, lng: 105.8450 },
      { id: "bach-mai", name: "Phường Bạch Mai", lat: 21.0020, lng: 105.8480 },
      { id: "truong-dinh", name: "Phường Trương Định", lat: 20.9980, lng: 105.8500 },
      { id: "minh-khai", name: "Phường Minh Khai", lat: 20.9980, lng: 105.8650 },
      { id: "vinh-tuy", name: "Phường Vĩnh Tuy", lat: 21.0050, lng: 105.8750 },
      { id: "quynh-loi", name: "Phường Quỳnh Lôi", lat: 21.0020, lng: 105.8580 },
      { id: "quynh-mai", name: "Phường Quỳnh Mai", lat: 21.0050, lng: 105.8600 },
    ],
  },
  {
    id: "dong-da",
    name: "Quận Đống Đa (Phía Bắc)",
    lat: 21.0150,
    lng: 105.8250,
    wards: [
      { id: "phuong-mai", name: "Phường Phương Mai", lat: 21.0020, lng: 105.8380 },
      { id: "kim-lien", name: "Phường Kim Liên", lat: 21.0080, lng: 105.8350 },
      { id: "khuong-thuong", name: "Phường Khương Thượng", lat: 21.0050, lng: 105.8250 },
      { id: "trung-tu", name: "Phường Trung Tự", lat: 21.0100, lng: 105.8300 },
      { id: "quang-trung-dd", name: "Phường Quang Trung", lat: 21.0120, lng: 105.8280 },
      { id: "nam-dong", name: "Phường Nam Đồng", lat: 21.0150, lng: 105.8300 },
      { id: "nga-tu-so", name: "Phường Ngã Tư Sở", lat: 21.0050, lng: 105.8200 },
    ],
  },
];

/**
 * Công thức Haversine tính khoảng cách đường chim bay giữa 2 tọa độ (km)
 */
export function haversineStraightKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tính khoảng cách ước lượng đường xe máy nội đô (Haversine * 1.4)
 * Dùng khi OSRM chưa trả về kết quả (preview nhanh)
 */
export function calculateRoadDistanceKm(destLat: number, destLng: number): number {
  const straightKm = haversineStraightKm(
    SHOP_COORDINATES.lat,
    SHOP_COORDINATES.lng,
    destLat,
    destLng
  );
  // Hệ số 1.4 để ước lượng đường thực tế nội đô ngõ ngách Hà Nội
  const roadKm = straightKm * 1.4;
  return Number(roadKm.toFixed(1));
}

/**
 * Lấy khoảng cách đường thực tế bằng OSRM (Open Source Routing Machine)
 * Miễn phí, không cần API key, dữ liệu OpenStreetMap thực tế
 * Profile: driving (xe máy đi đường ô tô - gần nhất với thực tế VN)
 * @returns km thực tế hoặc null nếu thất bại
 */
export async function fetchOsrmDistanceKm(
  destLat: number,
  destLng: number
): Promise<number | null> {
  try {
    const shopLng = SHOP_COORDINATES.lng;
    const shopLat = SHOP_COORDINATES.lat;
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${shopLng},${shopLat};${destLng},${destLat}` +
      `?overview=false&alternatives=false&steps=false`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const json = await res.json();
    if (json.code !== "Ok" || !json.routes?.[0]) return null;

    // OSRM trả về distance tính bằng mét
    const meters: number = json.routes[0].distance;
    return Number((meters / 1000).toFixed(1));
  } catch {
    return null;
  }
}

/**
 * Bảng tính phí ship theo số km (làm tròn lên theo km - Math.ceil)
 * 1km = 5.000đ · 2km = 10.000đ · 3km = 15.000đ · 4km = 20.000đ · 5km = 30.000đ
 * Tối đa 5km
 */
export function calculateShippingFeeByKm(distanceKm: number): {
  shippingFee: number;
  isWithinRange: boolean;
  maxDistanceKm: number;
  message?: string;
} {
  const MAX_KM = MAX_DELIVERY_DISTANCE_KM;

  if (distanceKm > MAX_KM) {
    return {
      shippingFee: 0,
      isWithinRange: false,
      maxDistanceKm: MAX_KM,
      message: `Địa chỉ cách quán ${distanceKm} km, vượt quá bán kính giao hàng tối đa (${MAX_KM} km) của quán.`,
    };
  }

  // Làm tròn lên km gần nhất, tối thiểu 1km; từ 5km trở lên tính mức 30.000đ
  const billableKm = Math.min(MAX_KM, Math.max(1, Math.ceil(distanceKm)));
  const shippingFee = billableKm >= 5 ? 30000 : billableKm * 5000;

  return {
    shippingFee,
    isWithinRange: true,
    maxDistanceKm: MAX_KM,
  };
}
