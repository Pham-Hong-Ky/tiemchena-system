/**
 * Geocode & Distance Calculation Service
 * Tính khoảng cách chuẩn xác bằng Haversine * 1.3 (ước lượng đường đi xe máy nội đô Hà Nội)
 * Hoạt động 100% độc lập, không phụ thuộc API bên ngoài, không lo giới hạn quota
 */

import {
  SHOP_COORDINATES,
  MAX_DELIVERY_DISTANCE_KM,
  calculateRoadDistanceKm,
  calculateShippingFeeByKm,
  HANOI_DISTRICTS,
  haversineStraightKm,
} from "@/data/hanoiLocations";

export { SHOP_COORDINATES, MAX_DELIVERY_DISTANCE_KM };

/**
 * Tìm xã/phường gần nhất trong dữ liệu Hà Nội theo tọa độ GPS
 */
export function findNearestHanoiWard(lat: number, lng: number) {
  let nearestWard: { districtName: string; wardName: string; dist: number } | null = null;

  for (const dist of HANOI_DISTRICTS) {
    for (const ward of dist.wards) {
      const d = haversineStraightKm(lat, lng, ward.lat, ward.lng);
      if (!nearestWard || d < nearestWard.dist) {
        nearestWard = {
          districtName: dist.name,
          wardName: ward.name,
          dist: d,
        };
      }
    }
  }

  return nearestWard;
}

export const geocodeService = {
  /**
   * Tính khoảng cách đường xe máy thực tế (Haversine * 1.3) và phí giao hàng
   */
  calculateFeeForCoordinates(dest: { lat: number; lng: number }) {
    const km = calculateRoadDistanceKm(dest.lat, dest.lng);
    const feeInfo = calculateShippingFeeByKm(km);
    return {
      distanceKm: km,
      source: "haversine" as const,
      ...feeInfo,
    };
  },

  /**
   * Reverse Geocode: Nhận tọa độ GPS -> Trả về khoảng cách Haversine * 1.3 & Tên vị trí
   */
  async reverseGeocode(latStr: string, lngStr: string) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error("Tọa độ GPS không hợp lệ");
    }

    const feeInfo = this.calculateFeeForCoordinates({ lat, lng });
    const nearest = findNearestHanoiWard(lat, lng);

    let address = `Vị trí (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    if (nearest && nearest.dist <= 3) {
      address = `${nearest.wardName}, ${nearest.districtName}, Hà Nội`;
    }

    // Thử làm giàu thêm tên đường qua Photon OpenStreetMap (nếu có kết nối)
    try {
      const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
      const res = await fetch(photonUrl, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const json = await res.json();
        const feat = json.features?.[0];
        if (feat?.properties) {
          const p = feat.properties;
          const parts = [p.name, p.street, p.district || nearest?.wardName, p.city || "Hà Nội"].filter(Boolean);
          if (parts.length > 0) {
            address = parts.join(", ");
          }
        }
      }
    } catch {
      // Ignored
    }

    return {
      address,
      lat,
      lng,
      ...feeInfo,
    };
  },
};
