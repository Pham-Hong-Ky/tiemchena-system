/**
 * Product validation utilities
 * Shared between POST and PUT product endpoints
 */

export interface PriceValidationResult {
  valid: boolean;
  error?: string;
  value?: number | null;
}

export function validatePrice(
  price: unknown,
  fieldName = "Giá bán",
  options: { required?: boolean; min?: number; max?: number } = {}
): PriceValidationResult {
  const { required = true, min = 1000, max = 500000 } = options;

  if (price === undefined || price === null || price === "") {
    if (required) {
      return { valid: false, error: `${fieldName} món ăn không được để trống` };
    }
    return { valid: true, value: null };
  }

  const num = typeof price === "number" ? price : parseFloat(String(price));
  if (isNaN(num) || num < min || num > max) {
    return {
      valid: false,
      error: `${fieldName} món ăn phải từ ${min.toLocaleString("vi-VN")}đ đến ${max.toLocaleString("vi-VN")}đ`,
    };
  }

  return { valid: true, value: num };
}

export function validateToppingsJson(toppingsJson: unknown): {
  valid: boolean;
  error?: string;
  jsonString: string;
} {
  if (toppingsJson === undefined || toppingsJson === null || toppingsJson === "") {
    return { valid: true, jsonString: "[]" };
  }

  let list: any[] = [];
  try {
    list = typeof toppingsJson === "string" ? JSON.parse(toppingsJson) : toppingsJson;
  } catch {
    return { valid: false, error: "Định dạng tùy chọn món không hợp lệ", jsonString: "[]" };
  }

  if (Array.isArray(list)) {
    for (const opt of list) {
      if (!opt) continue;
      const optPrice = parseFloat(opt.price);
      if (isNaN(optPrice) || (optPrice !== 0 && (optPrice < 1000 || optPrice > 500000))) {
        return {
          valid: false,
          error: `Giá tùy chọn "${opt.name || "Tùy chọn"}" phải bằng 0đ hoặc từ 1.000đ đến 500.000đ`,
          jsonString: "[]",
        };
      }
    }
  }

  const jsonString = typeof toppingsJson === "string" ? toppingsJson : JSON.stringify(list || []);
  return { valid: true, jsonString };
}
