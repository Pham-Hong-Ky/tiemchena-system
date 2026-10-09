/**
 * Centralized API helpers – mọi logic gọi fetch nên dùng từ đây
 * thay vì viết thẳng trong component.
 */

import { OrderType, StoreSettingType, StatsType } from "@/types";

// ─── Generic fetch wrapper ───────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!data.success) {
    throw new ApiError(res.status, data.error || "Lỗi không xác định");
  }
  return data.data as T;
}

// ─── Orders API ──────────────────────────────────────────────────────────────

export async function getOrders(): Promise<OrderType[]> {
  return apiFetch<OrderType[]>("/api/orders");
}

export async function patchOrder(
  orderId: string,
  patch: { orderStatus?: string; paymentStatus?: string; note?: string }
): Promise<OrderType> {
  return apiFetch<OrderType>(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/orders/${orderId}`, {
    method: "DELETE",
  });
}

export async function cleanCancelledOrders(): Promise<{ success: boolean; count: number; message?: string }> {
  return apiFetch<{ success: boolean; count: number; message?: string }>("/api/orders/cleanup", {
    method: "DELETE",
  });
}

export async function blacklistOrder(
  id: string,
  reason?: string
): Promise<{ success: boolean; message: string; data: OrderType }> {
  return apiFetch<{ success: boolean; message: string; data: OrderType }>(`/api/orders/${id}/blacklist`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export type CreateOrderPayload = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  note?: string;
  paymentMethod: "COD" | "VIETQR" | "ZALO";
  items: unknown[];
  voucherCode?: string;
  website_hp?: string;
  shippingFee?: number;
  distanceKm?: number | null;
  distanceSource?: "ward" | "pin" | "gps" | "haversine" | string;
  /** Toạ độ vị trí khách ghim/GPS trên bản đồ (gửi về admin) */
  latitude?: number | null;
  longitude?: number | null;
  /** Tên vị trí hiển thị (xã/phường hoặc "GPS") */
  locationName?: string | null;
};

export async function createOrder(payload: CreateOrderPayload): Promise<OrderType> {
  return apiFetch<OrderType>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Settings API ─────────────────────────────────────────────────────────────

export async function getSettings(): Promise<StoreSettingType> {
  return apiFetch<StoreSettingType>("/api/settings");
}

export async function saveSettings(settings: StoreSettingType): Promise<StoreSettingType> {
  return apiFetch<StoreSettingType>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// ─── Stats API ────────────────────────────────────────────────────────────────

export async function getStats(): Promise<StatsType> {
  return apiFetch<StatsType>("/api/stats");
}

// ─── Voucher API ──────────────────────────────────────────────────────────────

export type VoucherResult = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
};

export async function validateVoucher(code: string): Promise<VoucherResult> {
  return apiFetch<VoucherResult>(`/api/vouchers/${code}`);
}

// ─── Categories API ───────────────────────────────────────────────────────────

import { CategoryType, CustomerType, FeedbackType } from "@/types";

export async function getCategories(all = false): Promise<CategoryType[]> {
  return apiFetch<CategoryType[]>(`/api/categories${all ? "?all=true" : ""}`);
}

export async function createCategory(payload: {
  name: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<CategoryType> {
  return apiFetch<CategoryType>("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(payload: {
  id: string;
  name?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<CategoryType> {
  return apiFetch<CategoryType>("/api/categories", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/categories?id=${id}`, {
    method: "DELETE",
  });
}

// ─── Customers / Users API ───────────────────────────────────────────────────

export async function getCustomers(): Promise<CustomerType[]> {
  return apiFetch<CustomerType[]>("/api/customers");
}

export type CustomerPayload = {
  name: string;
  phone: string;
  zalo?: string;
  email?: string;
  address?: string;
  note?: string;
};

export async function createCustomer(payload: CustomerPayload): Promise<CustomerType> {
  return apiFetch<CustomerType>("/api/customers", { method: "POST", body: JSON.stringify(payload) });
}

export async function importCustomers(
  rows: CustomerPayload[]
): Promise<{ created: number; updated: number; skipped: number; errors: string[] }> {
  return apiFetch("/api/customers", { method: "POST", body: JSON.stringify({ import: rows, source: "waitlist" }) });
}

export async function updateCustomer(id: string, payload: CustomerPayload): Promise<CustomerType> {
  return apiFetch<CustomerType>("/api/customers", { method: "PUT", body: JSON.stringify({ id, ...payload }) });
}

export async function deleteCustomer(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/api/customers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Upload API ───────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Lỗi tải ảnh lên");
  }
  return data.url;
}

