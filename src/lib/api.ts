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

export type CreateOrderPayload = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  paymentMethod: "COD" | "VIETQR" | "ZALO";
  items: unknown[];
  voucherCode?: string;
  website_hp?: string;
  shippingFee?: number;
  distanceKm?: number | null;
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

import { CategoryType, CustomerType, TagType, FeedbackType } from "@/types";

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

// ─── Tags API ─────────────────────────────────────────────────────────────────

export async function getTags(): Promise<TagType[]> {
  return apiFetch<TagType[]>("/api/tags");
}

export async function createTag(payload: {
  code: string;
  name: string;
  icon?: string;
  badgeColor?: string;
  textColor?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<TagType> {
  return apiFetch<TagType>("/api/tags", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTag(payload: {
  id: string;
  code?: string;
  name?: string;
  icon?: string;
  badgeColor?: string;
  textColor?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<TagType> {
  return apiFetch<TagType>("/api/tags", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTag(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/tags?id=${id}`, {
    method: "DELETE",
  });
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

