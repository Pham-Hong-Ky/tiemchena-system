/**
 * Định vị GPS đa nền tảng (tối ưu cho điện thoại).
 *
 * Vì sao hay lỗi trên mobile?
 *  - Trình duyệt chỉ cho phép geolocation khi trang chạy trên HTTPS (secure context).
 *    Khi test qua http://<IP LAN> hoặc khi chưa cấp quyền vị trí → lỗi ngay lập tức.
 *  - getCurrentPosition với `enableHighAccuracy: true` + timeout ngắn rất dễ TIMEOUT
 *    khi khách ở trong nhà / trong ngõ (GPS yếu) → không lấy được vị trí.
 *
 * Giải pháp: thử lần 1 với độ chính xác cao (GPS thật), nếu thất bại do timeout /
 * không có vị trí thì tự động thử lại bằng định vị mạng (Wi-Fi/cell) vốn ổn định hơn.
 */

export type GeoErrorCode =
  | "UNSUPPORTED"
  | "INSECURE_CONTEXT"
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNKNOWN";

export class GeoLocationError extends Error {
  code: GeoErrorCode;

  constructor(code: GeoErrorCode, message: string) {
    super(message);
    this.name = "GeoLocationError";
    this.code = code;
  }
}

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

function requestPosition(options: PositionOptions): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const code: GeoErrorCode =
          err.code === 1
            ? "PERMISSION_DENIED"
            : err.code === 2
            ? "POSITION_UNAVAILABLE"
            : err.code === 3
            ? "TIMEOUT"
            : "UNKNOWN";
        reject(new GeoLocationError(code, err.message || "Không lấy được vị trí"));
      },
      options
    );
  });
}

/**
 * Lấy vị trí hiện tại một cách bền vững: thử GPS chính xác cao trước,
 * fallback sang định vị mạng khi thất bại.
 */
export async function getCurrentPositionRobust(): Promise<GeoPoint> {
  if (typeof window === "undefined" || !isGeolocationSupported()) {
    throw new GeoLocationError("UNSUPPORTED", "Thiết bị không hỗ trợ định vị GPS.");
  }

  // Geolocation chỉ hoạt động trên HTTPS (hoặc localhost). Phát hiện sớm để báo khách rõ ràng.
  if (window.isSecureContext === false) {
    throw new GeoLocationError(
      "INSECURE_CONTEXT",
      "Trình duyệt chặn định vị vì trang không chạy trên HTTPS."
    );
  }

  // Lần 1: GPS chính xác cao (chờ tối đa 15s cho máy kịp bắt sóng).
  try {
    return await requestPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  } catch (err) {
    const e = err as GeoLocationError;

    // Các lỗi này thử lại cũng vô ích → trả về luôn.
    if (
      e.code === "PERMISSION_DENIED" ||
      e.code === "INSECURE_CONTEXT" ||
      e.code === "UNSUPPORTED"
    ) {
      throw e;
    }

    // Lần 2 (fallback): định vị theo mạng/Wi-Fi – hoạt động tốt trong nhà, cho phép vị trí cache.
    try {
      return await requestPosition({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 120000,
      });
    } catch {
      throw e; // giữ thông báo của lần 1 (sát nguyên nhân gốc) để hiển thị cho khách
    }
  }
}

/** Chuyển lỗi định vị thành thông báo tiếng Việt thân thiện với khách hàng. */
export function describeGeoError(err: unknown): string {
  const e = err as GeoLocationError;
  switch (e?.code) {
    case "UNSUPPORTED":
      return "Thiết bị/trình duyệt không hỗ trợ định vị GPS. Bạn hãy bấm “Ghim Bản Đồ” để chọn vị trí nhé.";
    case "INSECURE_CONTEXT":
      return "Trình duyệt chỉ cho phép định vị trên kết nối HTTPS. Vui lòng mở lại trang bằng https:// hoặc bấm “Ghim Bản Đồ”.";
    case "PERMISSION_DENIED":
      return "Bạn đã từ chối quyền vị trí. Vào Cài đặt trình duyệt → Quyền trang web → Vị trí → Cho phép, rồi thử lại hoặc bấm “Ghim Bản Đồ”.";
    case "TIMEOUT":
      return "Quá thời gian lấy vị trí GPS. Hãy bật Định vị (Location) trong cài đặt điện thoại rồi thử lại, hoặc bấm “Ghim Bản Đồ”.";
    case "POSITION_UNAVAILABLE":
      return "Không lấy được vị trí hiện tại. Hãy bật Định vị (Location) trong cài đặt điện thoại, hoặc bấm “Ghim Bản Đồ” để chọn vị trí.";
    default:
      return "Không thể lấy được vị trí GPS. Vui lòng bấm “Ghim Bản Đồ” để chọn vị trí trên bản đồ nhé.";
  }
}
