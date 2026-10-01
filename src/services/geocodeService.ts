/**
 * Geocode & Distance Calculation Service
 * Tính khoảng cách từ Tiệm Chè Na (Vũ Lăng, Thanh Trì, Hà Nội) và phí giao hàng
 */

// Tọa độ chuẩn của Tiệm Chè Na tại Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội
export const SHOP_COORDINATES = {
  lat: 20.9315,
  lng: 105.8622,
  address: "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội",
};

export const MAX_DELIVERY_DISTANCE_KM = 15; // Bán kính giao hàng tối đa 15km

// Danh bạ tọa độ các thôn/xã/khu vực quanh quán (Thanh Trì & lân cận) để tra cứu tức thì 0ms
const LOCAL_LANDMARKS = [
  { keywords: ["việt yên", "viet yen"], lat: 20.9315, lng: 105.8622, name: "Thôn Việt Yên, Ngũ Hiệp, Thanh Trì" },
  { keywords: ["vũ lăng", "vu lang"], lat: 20.9315, lng: 105.8622, name: "Vũ Lăng, Ngũ Hiệp, Thanh Trì" },
  { keywords: ["tự khoát", "tu khoat"], lat: 20.9250, lng: 105.8610, name: "Thôn Tự Khoát, Ngũ Hiệp, Thanh Trì" },
  { keywords: ["đông trì", "dong tri"], lat: 20.9290, lng: 105.8680, name: "Thôn Đông Trì, Ngũ Hiệp, Thanh Trì" },
  { keywords: ["ngũ hiệp", "ngu hiep"], lat: 20.9271, lng: 105.8520, name: "Xã Ngũ Hiệp, Thanh Trì" },
  { keywords: ["lưu phái", "luu phai"], lat: 20.9220, lng: 105.8500, name: "Lưu Phái, Ngũ Hiệp, Thanh Trì" },
  { keywords: ["tứ hiệp", "tu hiep"], lat: 20.9450, lng: 105.8500, name: "Xã Tứ Hiệp, Thanh Trì" },
  { keywords: ["cổ điển", "co dien"], lat: 20.9420, lng: 105.8530, name: "Cổ Điển, Tứ Hiệp, Thanh Trì" },
  { keywords: ["văn điển", "van dien"], lat: 20.9530, lng: 105.8450, name: "Thị trấn Văn Điển, Thanh Trì" },
  { keywords: ["ngọc hồi", "ngoc hoi"], lat: 20.9150, lng: 105.8550, name: "Xã Ngọc Hồi, Thanh Trì" },
  { keywords: ["đông mỹ", "dong my"], lat: 20.9100, lng: 105.8700, name: "Xã Đông Mỹ, Thanh Trì" },
  { keywords: ["vĩnh quỳnh", "vinh quynh"], lat: 20.9350, lng: 105.8350, name: "Xã Vĩnh Quỳnh, Thanh Trì" },
  { keywords: ["tam hiệp", "tam hiep"], lat: 20.9480, lng: 105.8380, name: "Xã Tam Hiệp, Thanh Trì" },
  { keywords: ["đại áng", "dai ang"], lat: 20.9120, lng: 105.8250, name: "Xã Đại Áng, Thanh Trì" },
  { keywords: ["liên ninh", "lien ninh"], lat: 20.9020, lng: 105.8580, name: "Xã Liên Ninh, Thanh Trì" },
  { keywords: ["yên mỹ", "yen my"], lat: 20.9380, lng: 105.8900, name: "Xã Yên Mỹ, Thanh Trì" },
  { keywords: ["duyên hà", "duyen ha"], lat: 20.9250, lng: 105.8850, name: "Xã Duyên Hà, Thanh Trì" },
  { keywords: ["tecco", "ecohome"], lat: 20.9430, lng: 105.8480, name: "Chung cư Tecco / Ecohome Tứ Hiệp" },
  { keywords: ["iec"], lat: 20.9410, lng: 105.8490, name: "Chung cư IEC Tứ Hiệp" },
];

/**
 * Công thức Haversine tính khoảng cách đường chim bay giữa 2 tọa độ (km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Bảng tính phí ship theo số km
 */
export function calculateShippingFee(distanceKm: number): {
  shippingFee: number;
  isWithinRange: boolean;
  maxDistanceKm: number;
  message?: string;
} {
  if (distanceKm > MAX_DELIVERY_DISTANCE_KM) {
    return {
      shippingFee: 0,
      isWithinRange: false,
      maxDistanceKm: MAX_DELIVERY_DISTANCE_KM,
      message: `Địa chỉ cách quán ${distanceKm} km, vượt quá bán kính giao hàng tối đa (${MAX_DELIVERY_DISTANCE_KM} km) của quán.`,
    };
  }

  let shippingFee = 10000;
  if (distanceKm <= 2) {
    shippingFee = 10000;
  } else if (distanceKm <= 5) {
    shippingFee = 15000;
  } else if (distanceKm <= 10) {
    shippingFee = 25000;
  } else {
    shippingFee = 35000;
  }

  return {
    shippingFee,
    isWithinRange: true,
    maxDistanceKm: MAX_DELIVERY_DISTANCE_KM,
  };
}

export const geocodeService = {
  /**
   * Reverse Geocode: Tọa độ GPS (Lat, Lng) -> Tên địa chỉ chữ + Khoảng cách & Phí ship
   */
  async reverseGeocode(latStr: string, lngStr: string) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Tọa độ không hợp lệ");
    }

    const distanceKm = calculateDistanceKm(SHOP_COORDINATES.lat, SHOP_COORDINATES.lng, lat, lng);
    const feeInfo = calculateShippingFee(distanceKm);

    // Thử dùng photon.komoot.io (đáng tin cậy, không bị chặn DNS)
    try {
      const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
      const res = await fetch(photonUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        const feat = json.features?.[0];
        if (feat?.properties) {
          const p = feat.properties;
          const parts = [p.name, p.street, p.district, p.city || "Hà Nội"].filter(Boolean);
          const formattedAddress = parts.join(", ");
          return {
            address: formattedAddress || `Vị trí (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            lat,
            lng,
            distanceKm,
            ...feeInfo,
          };
        }
      }
    } catch {
      // Ignored - fallback below
    }

    return {
      address: `Vị trí gần quán (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
      distanceKm,
      ...feeInfo,
    };
  },

  /**
   * Forward Geocode: Địa chỉ chữ do khách gõ -> Tìm kiếm tọa độ (Lat, Lng) + Khoảng cách & Phí ship
   */
  async forwardGeocode(address: string) {
    const cleanAddress = address.trim();
    if (!cleanAddress || cleanAddress.length < 2) {
      throw new Error("Địa chỉ tìm kiếm quá ngắn");
    }

    const lower = cleanAddress.toLowerCase();

    // 1. Kiểm tra nhanh danh bạ địa phương (0ms, cực kỳ chính xác cho khách quen)
    for (const lm of LOCAL_LANDMARKS) {
      if (lm.keywords.some((k) => lower.includes(k))) {
        const distanceKm = calculateDistanceKm(SHOP_COORDINATES.lat, SHOP_COORDINATES.lng, lm.lat, lm.lng);
        const feeInfo = calculateShippingFee(distanceKm);
        return {
          formattedAddress: `${cleanAddress} (${lm.name})`,
          lat: lm.lat,
          lng: lm.lng,
          distanceKm,
          ...feeInfo,
        };
      }
    }

    // 2. Dùng Photon API (OpenStreetMap engine, hoạt động mượt mà không bị chặn DNS)
    try {
      const searchTarget = lower.includes("hà nội") || lower.includes("ha noi")
        ? cleanAddress
        : `${cleanAddress}, Thanh Trì, Hà Nội`;

      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchTarget)}&limit=1`;
      const res = await fetch(photonUrl, { signal: AbortSignal.timeout(4000) });

      if (res.ok) {
        const json = await res.json();
        const feat = json.features?.[0];
        if (feat?.geometry?.coordinates) {
          const [lon, lat] = feat.geometry.coordinates;
          const distanceKm = calculateDistanceKm(SHOP_COORDINATES.lat, SHOP_COORDINATES.lng, lat, lon);
          const feeInfo = calculateShippingFee(distanceKm);

          return {
            formattedAddress: feat.properties?.name || cleanAddress,
            lat,
            lng: lon,
            distanceKm,
            ...feeInfo,
          };
        }
      }
    } catch {
      // Ignored
    }

    // 3. Fallback mặc định: nếu không tìm thấy tọa độ trên bản đồ, tính tạm phí ship cơ bản 15.000đ
    return {
      formattedAddress: cleanAddress,
      lat: SHOP_COORDINATES.lat,
      lng: SHOP_COORDINATES.lng,
      distanceKm: 2.5,
      shippingFee: 15000,
      isWithinRange: true,
      maxDistanceKm: MAX_DELIVERY_DISTANCE_KM,
      isEstimated: true,
    };
  },
};
