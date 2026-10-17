/**
 * Định vị GPS đa nền tảng (tối ưu cho điện thoại, đặc biệt iOS Safari).
 *
 * Vì sao hay lỗi / trả về vị trí sai?
 *  - Trình duyệt chỉ cho phép geolocation khi trang chạy trên HTTPS (secure context).
 *  - Có thể bị chặn bởi header `Permissions-Policy: geolocation=...`.
 *  - iOS/Safari khi KHÔNG lấy được GPS thật (hoặc người dùng tắt "Precise Location")
 *    thường KHÔNG báo lỗi mà trả về một vị trí thô/garbage (sai hàng km).
 *  - `getCurrentPosition` với `enableHighAccuracy: true` + timeout ngắn dễ TIMEOUT khi ở trong nhà.
 *
 * Nguyên tắc: chỉ trả về vị trí khi ĐỦ CHÍNH XÁC; nếu không thì BÁO LỖI (tuyệt đối
 * không trả về vị trí sai để tránh tính phí ship/distance sai).
 */

export type GeoErrorCode =
  | "UNSUPPORTED"
  | "INSECURE_CONTEXT"
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "INACCURATE"
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

/** Sai số tối đa cho phép (mét). Rộng hơn ngưỡng này coi như KHÔNG dùng được. */
export const MAX_ACCURACY_METERS = 200;

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
 * Lấy vị trí hiện tại một cách chặt chẽ: thử GPS chính xác cao (2 lần cho các lỗi tạm thời),
 * chỉ nhận khi sai số <= MAX_ACCURACY_METERS, nếu không thì báo lỗi.
 *
 * LƯU Ý Safari/iOS: phải gọi getCurrentPosition NGAY trong cú chạm của người dùng,
 * KHÔNG await bất cứ thứ gì trước đó (nếu không Safari sẽ chặn vì mất user gesture).
 */
export async function getCurrentPositionRobust(): Promise<GeoPoint> {
  if (typeof window === "undefined" || !isGeolocationSupported()) {
    throw new GeoLocationError("UNSUPPORTED", "Thiết bị không hỗ trợ định vị GPS.");
  }

  // Geolocation chỉ hoạt động trên HTTPS (hoặc localhost).
  if (window.isSecureContext === false) {
    throw new GeoLocationError(
      "INSECURE_CONTEXT",
      "Trình duyệt chặn định vị vì trang không chạy trên HTTPS."
    );
  }

  // Thử 2 lần: iPhone/Safari đôi khi lần gọi đầu thất bại tạm thời rồi lần sau thành công.
  const attempts: PositionOptions[] = [
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
  ];

  let lastError: GeoLocationError | null = null;
  let mostAccuratePoorFix: GeoPoint | null = null;

  for (const options of attempts) {
    try {
      const point = await requestPosition(options);
      if (point.accuracy <= MAX_ACCURACY_METERS) return point; // đủ chính xác → dùng luôn
      // Chính xác kém (network/garbage) → KHÔNG dùng, ghi nhận để báo lỗi rõ ràng
      if (!mostAccuratePoorFix || point.accuracy < mostAccuratePoorFix.accuracy) {
        mostAccuratePoorFix = point;
      }
    } catch (err) {
      const e = err as GeoLocationError;
      // Các lỗi này thử lại vô ích
      if (
        e.code === "PERMISSION_DENIED" ||
        e.code === "INSECURE_CONTEXT" ||
        e.code === "UNSUPPORTED"
      ) {
        throw e;
      }
      lastError = e;
    }
  }

  if (mostAccuratePoorFix) {
    throw new GeoLocationError(
      "INACCURATE",
      `Vị trí lấy được chỉ chính xác trong khoảng ±${Math.round(mostAccuratePoorFix.accuracy)}m.`
    );
  }

  throw lastError ?? new GeoLocationError("UNKNOWN", "Không lấy được vị trí.");
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
      return "Bạn chưa cho phép quyền vị trí. Trên iPhone: Cài đặt → Safari → Vị trí → chọn “Cho phép”, rồi tải lại trang. Hoặc bấm “Ghim Bản Đồ” để chọn tay.";
    case "TIMEOUT":
      return "Quá thời gian lấy vị trí GPS. Hãy bật Định vị (Location) trong cài đặt điện thoại rồi thử lại, hoặc bấm “Ghim Bản Đồ”.";
    case "POSITION_UNAVAILABLE":
      return "Không lấy được vị trí hiện tại. Hãy bật Định vị (Location) trong cài đặt điện thoại, hoặc bấm “Ghim Bản Đồ” để chọn vị trí.";
    case "INACCURATE":
      return `${e.message || "Vị trí lấy được chưa đủ chính xác."} Trên iPhone hãy bật “Vị trí chính xác” (Cài đặt → Safari → Vị trí → Precise Location), hoặc bấm “Ghim Bản Đồ” để tự chọn vị trí trên bản đồ.`;
    default:
      return "Không thể lấy được vị trí GPS. Vui lòng bấm “Ghim Bản Đồ” để chọn vị trí trên bản đồ nhé.";
  }
}
