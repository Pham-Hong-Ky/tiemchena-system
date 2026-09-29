/**
 * Order Validation & Anti-Spam Security Module
 */

// 1. Phone number validation (Vietnam standard)
const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

const FAKE_PHONE_LIST = new Set([
  "0123456789",
  "0987654321",
  "0000000000",
  "0999999999",
  "0888888888",
  "0777777777",
  "0555555555",
  "0333333333",
  "0111111111",
  "0222222222",
  "0444444444",
  "0666666666",
]);

export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  const cleanPhone = phone.replace(/[\s.-]/g, "");

  if (!cleanPhone) {
    return { valid: false, error: "Vui lòng nhập số điện thoại" };
  }

  if (!VN_PHONE_REGEX.test(cleanPhone)) {
    return {
      valid: false,
      error: "Số điện thoại không hợp lệ (Phải đủ 10 số, bắt đầu bằng 03, 05, 07, 08, 09)",
    };
  }

  if (FAKE_PHONE_LIST.has(cleanPhone)) {
    return {
      valid: false,
      error: "Số điện thoại không hợp lệ hoặc nằm trong danh sách nghi vấn",
    };
  }

  // Check repeating identical digits (e.g. 0988888888)
  const isRepeating = /^0[35789](\d)\1{7}$/.test(cleanPhone);
  if (isRepeating) {
    return { valid: false, error: "Số điện thoại không hợp lệ (dãy số trùng lặp)" };
  }

  return { valid: true };
}

// 2. Customer Name validation
const NAME_REGEX = /^[a-zA-ZÀ-ỹ\s]+$/;
const SPAM_NAME_WORDS = ["test", "asdf", "qwer", "admin", "null", "undefined", "123", "abc", "fake", "demo", "spam"];

export function validateCustomerName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: "Vui lòng nhập họ và tên người nhận" };
  }

  if (trimmed.length < 2 || trimmed.length > 50) {
    return { valid: false, error: "Họ và tên phải từ 2 đến 50 ký tự" };
  }

  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, error: "Tên người nhận chỉ được chứa chữ cái và khoảng trắng" };
  }

  const lower = trimmed.toLowerCase();
  if (SPAM_NAME_WORDS.some((word) => lower.includes(word))) {
    return { valid: false, error: "Vui lòng nhập tên người nhận có thật" };
  }

  return { valid: true };
}

// 3. Customer Address validation
export function validateCustomerAddress(address: string): { valid: boolean; error?: string } {
  const trimmed = address.trim();

  if (!trimmed) {
    return { valid: false, error: "Vui lòng nhập địa chỉ giao hàng" };
  }

  if (trimmed.length < 10) {
    return {
      valid: false,
      error: "Địa chỉ giao hàng quá ngắn (Cần tối thiểu 10 ký tự: số nhà, tên ngõ/đường, phường/xã)",
    };
  }

  // Check if address is just numbers or non-sensical
  if (/^\d+$/.test(trimmed)) {
    return { valid: false, error: "Địa chỉ không thể chỉ gồm số" };
  }

  return { valid: true };
}

import { checkGenericRateLimit } from "@/lib/rateLimit";

const MAX_ORDERS_PER_WINDOW = 2; // Maximum 2 orders
const WINDOW_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // Block for 15 minutes if spammed

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMinutes?: number; error?: string } {
  return checkGenericRateLimit("orders", key, {
    maxRequests: MAX_ORDERS_PER_WINDOW,
    windowMs: WINDOW_DURATION_MS,
    blockDurationMs: BLOCK_DURATION_MS,
    errorMessage: "Bạn đã gửi đơn hàng quá nhanh liên tiếp. Vui lòng đợi 15 phút hoặc gọi trực tiếp hotline của quán.",
  });
}
