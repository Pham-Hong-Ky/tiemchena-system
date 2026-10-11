import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, isTelegramConfigured } from "@/lib/telegram";

// Giữ danh sách đơn đã gửi trong bộ nhớ (an toàn với hot-reload khi dev)
const globalForTelegram = globalThis as unknown as { sentOrders: Set<string> };
globalForTelegram.sentOrders ??= new Set<string>();

type OrderWithItems = {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string;
  note: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  voucherCode: string | null;
  createdAt: Date;
  items: Array<{
    productName: string;
    quantity: number;
    itemTotal: number;
    toppingsJson: string | null;
    note: string | null;
  }>;
};

const PAYMENT_LABEL: Record<string, string> = {
  COD: "COD (tiền mặt khi nhận)",
  VIETQR: "Chuyển khoản VietQR",
  VIETQR_SEPAY: "Chuyển khoản (Sepay)",
  ZALO: "Chốt qua Zalo",
  PAYOS: "PayOS",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  DELIVERING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function money(v: number): string {
  return `${Math.round(Number(v) || 0).toLocaleString("vi-VN")}đ`;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Rút link bản đồ Google khách ghim (nếu có) từ ghi chú đơn */
function extractMapLink(note: string | null): string | null {
  if (!note) return null;
  const match = note.match(/https?:\/\/(?:www\.)?google\.com\/maps[^\s\]]+/i);
  return match ? match[0] : null;
}

function formatItems(items: OrderWithItems["items"]): string {
  if (items.length === 0) return "• (giỏ trống)";
  return items
    .map((item) => {
      let line = `• <b>${esc(item.productName)}</b> x${item.quantity}`;
      let toppingsText = "";
      if (item.toppingsJson) {
        try {
          const tops = JSON.parse(item.toppingsJson) as Array<{ name?: string }>;
          const names = tops.map((t) => t?.name).filter(Boolean);
          if (names.length) toppingsText = ` (${names.map(esc).join(", ")})`;
        } catch {
          /* bỏ qua JSON hỏng */
        }
      }
      line += `${toppingsText} — ${money(item.itemTotal)}`;
      if (item.note) line += `\n   ↳ ${esc(item.note)}`;
      return line;
    })
    .join("\n");
}

/** Dựng nội dung tin nhắn Telegram cho 1 đơn hàng */
export function buildOrderMessage(order: OrderWithItems): string {
  const shippingFee = Math.max(
    0,
    order.finalAmount - order.totalAmount + order.discountAmount
  );

  const lines: string[] = [];
  lines.push(`🛎️ <b>ĐƠN HÀNG MỚI</b> — <code>${esc(order.orderCode)}</code>`);
  lines.push(`🕐 ${formatTime(order.createdAt)}`);
  lines.push("━━━━━━━━━━━━━━━");
  lines.push(`👤 <b>Khách:</b> ${esc(order.customerName)}`);
  lines.push(`📞 <b>SĐT:</b> ${esc(order.customerPhone)}`);
  lines.push(`📍 <b>Địa chỉ:</b> ${esc(order.customerAddress)}`);
  lines.push(
    `💳 <b>Thanh toán:</b> ${esc(PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod)} — ${order.paymentStatus === "PAID" ? "✅ Đã trả" : "⏳ Chưa trả"}`
  );
  lines.push(`📦 <b>Trạng thái:</b> ${esc(STATUS_LABEL[order.orderStatus] || order.orderStatus)}`);
  lines.push("━━━━━━━━━━━━━━━");
  lines.push("<b>🧾 Món đặt:</b>");
  lines.push(formatItems(order.items));
  lines.push("━━━━━━━━━━━━━━━");
  lines.push(`Tạm tính: ${money(order.totalAmount)}`);
  if (shippingFee > 0) lines.push(`Phí ship: ${money(shippingFee)}`);
  if (order.discountAmount > 0) {
    lines.push(`Giảm giá${order.voucherCode ? ` (${esc(order.voucherCode)})` : ""}: -${money(order.discountAmount)}`);
  }
  lines.push(`💰 <b>TỔNG THU: ${money(order.finalAmount)}</b>`);

  if (order.note) lines.push(`📝 <b>Ghi chú:</b> ${esc(order.note)}`);
  const mapLink = extractMapLink(order.note);
  if (mapLink) lines.push(`🗺️ <a href="${esc(mapLink)}">Mở vị trí trên Google Maps</a>`);

  return lines.join("\n");
}

export const telegramService = {
  /**
   * Thông báo 1 đơn mới về Telegram. Không bao giờ throw (lỗi Telegram không được
   * làm hỏng luồng tạo đơn). Giữ danh sách đơn đã gửi trong bộ nhớ để tránh gửi
   * trùng khi hàm bị gọi lại (tạo đơn + cập nhật trạng thái).
   */
  async notifyNewOrder(orderId: string) {
    if (!isTelegramConfigured()) return;
    if (globalForTelegram.sentOrders.has(orderId)) return;
    try {
      const order = (await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })) as OrderWithItems | null;
      if (!order) return;

      const result = await sendTelegramMessage(buildOrderMessage(order));
      if (result.sent) {
        globalForTelegram.sentOrders.add(orderId);
      }
    } catch (e) {
      console.error("[Telegram] Lỗi gửi thông báo đơn mới:", e);
    }
  },

  /** Gửi tin nhắn thử để kiểm tra cấu hình bot (dùng cho admin) */
  async sendTestMessage() {
    return sendTelegramMessage("✅ <b>Tiệm Chè Na</b>: Kết nối bot Telegram thành công! Từ giờ đơn mới sẽ được báo về đây.");
  },
};
