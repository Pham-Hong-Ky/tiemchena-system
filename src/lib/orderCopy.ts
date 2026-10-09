/**
 * Tiện ích cho admin: lấy link vị trí ghim trong ghi chú đơn hàng
 * và tạo nội dung văn bản để "Copy đơn" (dán sang Zalo / in / lưu).
 */

import { OrderType } from "@/types";

/**
 * Copy văn bản vào clipboard, hoạt động trên MỌI môi trường:
 * - HTTPS / localhost: dùng Clipboard API hiện đại.
 * - HTTP (vd: 192.168.x.x:3000) hoặc trình duyệt cũ / Zalo webview:
 *   navigator.clipboard không tồn tại nên phải fallback bằng execCommand.
 * Trả về true nếu copy thành công.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  // 1. Clipboard API (chỉ có trên secure context: HTTPS hoặc localhost)
  if (
    typeof navigator !== "undefined" &&
    typeof window !== "undefined" &&
    window.isSecureContext &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Bị từ chối quyền → thử cách cũ bên dưới
    }
  }

  // 2. Fallback cho HTTP / trình duyệt không hỗ trợ
  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    // iOS cần set selection range rõ ràng
    const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent || "");
    if (isIOS) {
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      textarea.setSelectionRange(0, text.length);
    } else {
      textarea.select();
    }

    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    return succeeded;
  } catch {
    return false;
  }
}

/**
 * Lấy link Google Maps mà khách đã ghim (được lưu trong ghi chú đơn hàng).
 * Trả về null nếu đơn không có vị trí ghim.
 */
export function getOrderMapUrl(note?: string | null): string | null {
  if (!note) return null;
  const match = note.match(/https:\/\/(?:www\.)?google\.com\/maps\?q=[^\s\]]+/);
  return match ? match[0] : null;
}

/** Chuỗi ghi chú đã bỏ các thẻ meta [Ship:...] / [Vị trí:...] cho dễ đọc */
export function getDisplayNote(note?: string | null): string {
  if (!note) return "";
  return note.replace(/\[(?:Ship|Vị trí):[^\]]*\]/g, "").trim();
}

function parseToppings(toppingsJson?: string | null): string {
  if (!toppingsJson) return "";
  try {
    const arr = typeof toppingsJson === "string" ? JSON.parse(toppingsJson) : toppingsJson;
    const names = Array.isArray(arr)
      ? arr.map((t: { name?: string }) => t?.name).filter(Boolean)
      : [];
    return names.length > 0 ? ` (+ ${names.join(", ")})` : "";
  } catch {
    return "";
  }
}

/** Tạo nội dung văn bản đầy đủ của một đơn hàng để admin copy */
export function buildOrderCopyText(order: OrderType): string {
  const lines: string[] = [];

  lines.push("🍧 TIỆM CHÈ NA");
  lines.push(`Mã đơn: ${order.orderCode}`);
  lines.push(`Thời gian: ${new Date(order.createdAt).toLocaleString("vi-VN")}`);
  lines.push(`Khách hàng: ${order.customerName}`);
  lines.push(`SĐT: ${order.customerPhone}`);
  lines.push(`Địa chỉ: ${order.customerAddress}`);

  const mapUrl = getOrderMapUrl(order.note);
  if (mapUrl) lines.push(`Vị trí ghim: ${mapUrl}`);

  lines.push("");
  lines.push("--- MÓN ĐÃ ĐẶT ---");

  const items = order.items || [];
  items.forEach((item, idx) => {
    const toppingTxt = parseToppings(item.toppingsJson);
    const total = item.itemTotal ?? (item.productPrice || 0) * (item.quantity || 1);
    const noteTxt = item.note ? ` [Ghi chú: ${item.note}]` : "";
    lines.push(
      `${idx + 1}. ${item.quantity}x ${item.productName}${toppingTxt} = ${total.toLocaleString("vi-VN")}đ${noteTxt}`
    );
  });

  lines.push("");
  lines.push(`Tạm tính: ${order.totalAmount.toLocaleString("vi-VN")}đ`);
  if (order.discountAmount > 0) {
    lines.push(
      `Giảm giá${order.voucherCode ? ` (${order.voucherCode})` : ""}: -${order.discountAmount.toLocaleString("vi-VN")}đ`
    );
  }
  lines.push(`THANH TOÁN: ${order.finalAmount.toLocaleString("vi-VN")}đ`);
  lines.push(`Hình thức: ${order.paymentMethod}`);

  const displayNote = getDisplayNote(order.note);
  if (displayNote) lines.push(`Ghi chú: ${displayNote}`);

  return lines.join("\n");
}
