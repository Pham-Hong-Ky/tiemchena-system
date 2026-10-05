/**
 * Order Validation & Anti-Spam Security Module
 * Kiểm tra dữ liệu đặt hàng chống spam, chặn SĐT ảo, tên rác và địa chỉ nhập bừa
 */

// 1. Danh sách đầu số di động chuẩn Việt Nam (Viettel, Mobifone, Vinaphone, Vietnamobile, Gmobile, Itelecom, Wintel)
const VN_STRICT_PHONE_REGEX = /^(03[2-9]|05[25689]|07[06-9]|08[1-9]|09[0-9])\d{7}$/;

// Danh sách các số điện thoại ảo, test, chuỗi số dễ gõ bừa
const FAKE_PHONE_LIST = new Set([
  "0123456789",
  "0987654321",
  "0901234567",
  "0912345678",
  "0988888888",
  "0999999999",
  "0888888888",
  "0777777777",
  "0555555555",
  "0333333333",
  "0000000000",
  "0111111111",
  "0222222222",
  "0444444444",
  "0666666666",
  "0900000000",
  "0911111111",
  "0909090909",
  "0912121212",
  "0989898989",
  "0939393939",
  "0979797979",
]);

export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  const cleanPhone = (phone || "").replace(/[\s.-]/g, "");

  if (!cleanPhone) {
    return { valid: false, error: "Vui lòng nhập số điện thoại nhận hàng" };
  }

  if (!VN_STRICT_PHONE_REGEX.test(cleanPhone)) {
    return {
      valid: false,
      error: "Số điện thoại không hợp lệ (Phải là số di động 10 số của Viettel, Vina, Mobi... bắt đầu bằng 03, 05, 07, 08, 09)",
    };
  }

  if (FAKE_PHONE_LIST.has(cleanPhone)) {
    return {
      valid: false,
      error: "Số điện thoại không hợp lệ hoặc nằm trong danh sách nghi vấn",
    };
  }

  // Chặn 4 chữ số giống hệt nhau liên tiếp (ví dụ: 0981111234, 0900001234)
  if (/(\d)\1{3,}/.test(cleanPhone)) {
    return { valid: false, error: "Số điện thoại có chuỗi số lặp bất thường, vui lòng nhập số thật" };
  }

  // Chặn chuỗi tiến/lùi liên tục 5 số (ví dụ: 12345, 54321)
  const digits = cleanPhone.split("").map(Number);
  let ascCount = 1;
  let descCount = 1;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] === digits[i - 1] + 1) {
      ascCount++;
      if (ascCount >= 5) return { valid: false, error: "Số điện thoại không hợp lệ (dãy số tăng dần ngẫu nhiên)" };
    } else {
      ascCount = 1;
    }

    if (digits[i] === digits[i - 1] - 1) {
      descCount++;
      if (descCount >= 5) return { valid: false, error: "Số điện thoại không hợp lệ (dãy số giảm dần ngẫu nhiên)" };
    } else {
      descCount = 1;
    }
  }

  return { valid: true };
}

// 2. Họ và Tên Khách Hàng
const VIETNAMESE_VOWELS_REGEX = /[aeiouyàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/i;
const NAME_REGEX = /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹĐđ\s]+$/;

const SPAM_NAME_WORDS = [
  "test", "demo", "admin", "null", "undefined", "asdf", "qwer", "zxcv",
  "abcd", "xyz", "fake", "spam", "ahihi", "hjhj", "haha", "khong",
  "chua", "biet", "linh tinh", "bừa", "người dùng", "khách", "anonym",
  "abc", "123", "aaaa", "bbbb", "cccc"
];

export function validateCustomerName(name: string): { valid: boolean; error?: string } {
  const trimmed = (name || "").trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return { valid: false, error: "Vui lòng nhập họ và tên người nhận" };
  }

  // Tối thiểu 2 ký tự (chấp nhận tên ngắn như An, Vy, Hà, Lê...)
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { valid: false, error: "Họ và tên người nhận phải từ 2 đến 50 ký tự" };
  }

  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, error: "Tên người nhận chỉ được chứa chữ cái tiếng Việt, không chứa số hay ký tự đặc biệt" };
  }

  // Kiểm tra từng từ trong tên phải có nguyên âm hợp lệ (chấp nhận tên 1 từ hoặc nhiều từ)
  const words = trimmed.split(" ").filter(Boolean);
  for (const word of words) {
    if (!VIETNAMESE_VOWELS_REGEX.test(word)) {
      return { valid: false, error: `Từ "${word}" không hợp lệ trong tiếng Việt, vui lòng nhập tên thật` };
    }
  }

  const lower = trimmed.toLowerCase();
  if (SPAM_NAME_WORDS.some((kw) => lower.includes(kw))) {
    return { valid: false, error: "Vui lòng nhập họ và tên người nhận có thật để shipper liên hệ" };
  }

  return { valid: true };
}

// 3. Địa Chỉ Nhận Hàng Cụ Thể
const ADDRESS_LOCATION_KEYWORDS = [
  "số", "sn", "nhà", "ngõ", "ngách", "hẻm", "kiệt",
  "đường", "phố", "đại lộ",
  "tòa", "toà", "chung cư", "kđt", "kdt", "khu đô thị", "tập thể", "tt", "tầng", "phòng", "căn", "khu",
  "thôn", "xóm", "làng", "ấp", "xã", "phường", "quận", "huyện", "thị xã", "thị trấn", "thành phố", "tp",
  "gần", "đối diện", "cạnh", "ngã ba", "ngã tư", "cổng", "chợ", "trường", "bệnh viện",
  "hà nội", "hn", "thanh trì", "cầu giấy", "đống đa", "ba đình", "hoàn kiếm", "hai bà trưng",
  "hoàng mai", "thanh xuân", "nam từ liêm", "bắc từ liêm", "hà đông", "tây hồ", "long biên"
];

const SPAM_ADDRESS_PHRASES = [
  "linh tinh", "khong biet", "không biết", "o dau cung duoc", "ở đâu cũng được",
  "giao dai", "giao đại", "test", "demo", "abc", "xyz", "asdf", "qwer", "zxcv",
  "ghjk", "hjkl", "bla bla", "tuy y", "tùy ý", "cho nao cung duoc", "chỗ nào cũng được",
  "khong co dia chi", "không có địa chỉ", "ảo ma", "ao ma", "nhap bua", "nhập bừa"
];

export function validateCustomerAddress(address: string): { valid: boolean; error?: string } {
  const trimmed = (address || "").trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return { valid: false, error: "Vui lòng nhập địa chỉ nhận hàng cụ thể" };
  }

  if (trimmed.length < 6) {
    return {
      valid: false,
      error: "Địa chỉ giao hàng quá ngắn (Ví dụ: Thôn Việt Yên, Ngũ Hiệp hoặc Số nhà, tên ngõ/đường)",
    };
  }

  if (trimmed.length > 150) {
    return {
      valid: false,
      error: "Địa chỉ giao hàng quá dài (Tối đa 150 ký tự)",
    };
  }

  // Chặn nếu toàn số hoặc toàn ký tự đặc biệt
  if (!/[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹĐđ]/.test(trimmed)) {
    return { valid: false, error: "Địa chỉ phải có tên đường, ngõ hoặc tên khu vực cụ thể" };
  }

  // Chặn chuỗi ký tự lặp bất thường (vd: aaaaa, 11111)
  if (/(.)\1{4,}/.test(trimmed)) {
    return { valid: false, error: "Địa chỉ chứa chuỗi ký tự lặp ngẫu nhiên, vui lòng nhập địa chỉ thật" };
  }

  // Chặn các cụm từ đùa cợt / nhập bừa
  const lower = trimmed.toLowerCase();
  for (const phrase of SPAM_ADDRESS_PHRASES) {
    if (lower.includes(phrase)) {
      return { valid: false, error: "Vui lòng nhập địa chỉ giao hàng có thật để shipper tìm được" };
    }
  }

  // Phải có ít nhất 2 từ (vd: "Việt Yên", "Ngũ Hiệp", "Số 12 Vũ Lăng")
  const words = trimmed.split(" ").filter(Boolean);
  if (words.length < 2) {
    return {
      valid: false,
      error: "Địa chỉ cần chi tiết hơn (Ví dụ: Thôn Việt Yên, Ngũ Hiệp hoặc Số nhà, tên đường...)",
    };
  }

  // Kiểm tra từng từ: từ có 3 ký tự trở lên (không phải số) không được là phụ âm gõ phím ngẫu nhiên
  const ALLOWED_SHORT_WORDS = new Set(["sn", "tt", "tp", "kdt", "kđt", "p.", "q.", "hn", "s2", "s1", "r1", "r2", "iec", "ct1", "ct2", "ct3"]);
  for (const w of words) {
    const cleanWord = w.replace(/[.,/\\-]/g, "").toLowerCase();
    if (cleanWord.length >= 3 && !/^\d+$/.test(cleanWord) && !ALLOWED_SHORT_WORDS.has(cleanWord)) {
      if (!VIETNAMESE_VOWELS_REGEX.test(cleanWord)) {
        return {
          valid: false,
          error: `Từ "${w}" trong địa chỉ không hợp lệ. Vui lòng không gõ phím ngẫu nhiên.`,
        };
      }
    }
  }

  return { valid: true };
}

// 3b. Email (không bắt buộc – có nhập thì phải đúng định dạng để không mất liên lạc với khách)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string | null | undefined): { valid: boolean; error?: string } {
  const trimmed = (email || "").trim();
  if (!trimmed) return { valid: true };
  if (trimmed.length > 100 || !EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Email không hợp lệ (ví dụ đúng: tenban@gmail.com)" };
  }
  return { valid: true };
}

// 4. Giới Hạn Tần Suất Gửi Đơn (Rate Limit)
import { checkGenericRateLimit } from "@/lib/rateLimit";

const MAX_ORDERS_PER_WINDOW = 2; // Tối đa 2 đơn trong 5 phút
const WINDOW_DURATION_MS = 5 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMinutes?: number; error?: string } {
  return checkGenericRateLimit("orders", key, {
    maxRequests: MAX_ORDERS_PER_WINDOW,
    windowMs: WINDOW_DURATION_MS,
    blockDurationMs: BLOCK_DURATION_MS,
    errorMessage: "Bạn đã gửi đơn hàng quá nhanh liên tiếp. Vui lòng đợi 15 phút hoặc gọi trực tiếp hotline của quán.",
  });
}

// 5. Kiểm Tra Giờ Mở Cửa (09:00 - 22:00 Giờ Việt Nam GMT+7)
export function validateOpeningHours(): { isOpen: boolean; currentVnTime: string; error?: string } {
  const now = new Date();
  const vnTimeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
    hour: "numeric",
    minute: "numeric",
  });

  const parts = vnTimeFormatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const currentMinutes = hour * 60 + minute;

  const OPEN_MINUTES = 9 * 60; // 09:00
  const CLOSE_MINUTES = 22 * 60; // 22:00

  const formattedHour = String(hour).padStart(2, "0");
  const formattedMinute = String(minute).padStart(2, "0");
  const currentVnTime = `${formattedHour}:${formattedMinute}`;

  const isOpen = currentMinutes >= OPEN_MINUTES && currentMinutes < CLOSE_MINUTES;

  if (!isOpen) {
    return {
      isOpen: false,
      currentVnTime,
      error: `Quán chỉ nhận đơn đặt hàng từ 09:00 đến 22:00 hàng ngày (Hiện tại là ${currentVnTime}). Quý khách vui lòng quay lại trong khung giờ mở cửa nhé!`,
    };
  }

  return { isOpen: true, currentVnTime };
}

