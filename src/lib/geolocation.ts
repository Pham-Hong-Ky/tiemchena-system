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
  /** Với lỗi INACCURATE: vị trí gần đúng tốt nhất (chỉ dùng để canh bản đồ, KHÔNG dùng làm điểm giao). */
  approx?: GeoPoint;

  constructor(code: GeoErrorCode, message: string, approx?: GeoPoint) {
    super(message);
    this.name = "GeoLocationError";
    this.code = code;
    this.approx = approx;
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

/** Sai số "đủ tốt" để dừng chờ sớm (mét). */
const GOOD_ACCURACY_METERS = 30;
/** Thời gian tối đa chờ GPS cải thiện độ chính xác. */
const MAX_WAIT_MS = 20000;
/** Đã có fix dùng được (<= MAX_ACCURACY_METERS) thì chỉ chờ thêm chừng này để tìm fix tốt hơn. */
const SETTLE_MS = 4000;

function mapErrorCode(code: number): GeoErrorCode {
  return code === 1
    ? "PERMISSION_DENIED"
    : code === 2
    ? "POSITION_UNAVAILABLE"
    : code === 3
    ? "TIMEOUT"
    : "UNKNOWN";
}

/**
 * Theo dõi vị trí bằng watchPosition và trả về fix CHÍNH XÁC NHẤT trong thời gian chờ.
 *
 * Vì sao không dùng getCurrentPosition? Safari (iOS & macOS) trả về NGAY fix đầu tiên —
 * thường là vị trí thô từ WiFi/IP (sai số vài trăm mét → vài km) — trong khi GPS thật
 * cần thêm vài giây. Chrome/Android thường có sẵn fix tốt nên không gặp vấn đề này.
 * watchPosition nhận liên tục các fix ngày càng chính xác hơn.
 */
function watchBestPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    let best: GeoPoint | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let done = false;

    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(maxTimer);
      if (settleTimer) clearTimeout(settleTimer);
      fn();
    };

    const resolveBest = () =>
      finish(() =>
        best ? resolve(best) : reject(new GeoLocationError("TIMEOUT", "Quá thời gian lấy vị trí"))
      );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        if (!best || point.accuracy < best.accuracy) best = point;
        if (best.accuracy <= GOOD_ACCURACY_METERS) return resolveBest();
        // Đã dùng được → chờ thêm một chút xem có fix tốt hơn không
        if (best.accuracy <= MAX_ACCURACY_METERS && !settleTimer) {
          settleTimer = setTimeout(resolveBest, SETTLE_MS);
        }
      },
      (err) => {
        // Lỗi tạm thời (TIMEOUT/UNAVAILABLE) khi đã có fix → vẫn dùng fix tốt nhất
        if (err.code !== 1 && best) return resolveBest();
        if (err.code === 3) return; // watchPosition sẽ tự thử tiếp, chờ maxTimer
        finish(() =>
          reject(new GeoLocationError(mapErrorCode(err.code), err.message || "Không lấy được vị trí"))
        );
      },
      { enableHighAccuracy: true, timeout: MAX_WAIT_MS, maximumAge: 0 }
    );

    const maxTimer = setTimeout(resolveBest, MAX_WAIT_MS);
  });
}

/**
 * Lấy vị trí hiện tại một cách chặt chẽ: chờ GPS cải thiện tới tối đa MAX_WAIT_MS,
 * chỉ nhận khi sai số <= MAX_ACCURACY_METERS, nếu không thì báo lỗi
 * (lỗi INACCURATE kèm `approx` để giao diện canh bản đồ cho khách tự ghim).
 *
 * LƯU Ý Safari/iOS: phải gọi hàm này NGAY trong cú chạm của người dùng,
 * KHÔNG await bất cứ thứ gì trước đó.
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

  const point = await watchBestPosition();
  if (point.accuracy <= MAX_ACCURACY_METERS) return point;

  // Chính xác kém (WiFi/IP, hoặc tắt "Vị trí chính xác") → KHÔNG dùng làm điểm giao
  throw new GeoLocationError(
    "INACCURATE",
    `Vị trí lấy được chỉ chính xác trong khoảng ±${Math.round(point.accuracy)}m.`,
    point
  );
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
