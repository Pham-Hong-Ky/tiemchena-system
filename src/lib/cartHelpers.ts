import { ProductType, ToppingType } from "@/types";
import { CartTopping, CartItem } from "@/context/CartContext";

/**
 * Trích xuất danh sách options / toppings khả dụng cho món ăn
 * Dùng chung cho cả ProductCustomizeModal và CartDrawer
 */
export function resolveProductOptions(
  product?: ProductType | null,
  toppingsList: ToppingType[] = [],
  currentSelected: CartTopping[] = []
): ToppingType[] {
  if (!product) return [];

  const toppingMap = new Map(toppingsList.map((t) => [t.id, t]));
  const result: ToppingType[] = [];

  if (product.toppingsJson) {
    try {
      const parsed =
        typeof product.toppingsJson === "string"
          ? JSON.parse(product.toppingsJson)
          : product.toppingsJson;

      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((item: any, idx: number) => {
          if (typeof item === "string") {
            const found = toppingMap.get(item);
            if (found) {
              result.push({
                id: found.id,
                name: found.name,
                price: found.price,
                isAvailable: true,
              });
            }
          } else if (item && typeof item === "object" && item.name) {
            result.push({
              id: item.id || `opt-${idx}-${String(item.name).toLowerCase().replace(/[^a-z0-9]/g, "")}`,
              name: item.name,
              price: Number(item.price) || 0,
              isAvailable: true,
            });
          }
        });
      }
    } catch (e) {
      console.error("Error parsing toppingsJson", e);
    }
  }

  // Đảm bảo các topping đã chọn trên món này luôn có mặt để khách có thể tích hoặc bỏ chọn
  currentSelected.forEach((st) => {
    if (!result.some((opt) => opt.id === st.id)) {
      result.push({
        id: st.id,
        name: st.name,
        price: st.price,
        isAvailable: true,
      });
    }
  });

  return result;
}

/**
 * Định dạng nội dung tin nhắn gửi qua Zalo / Mini Zalo
 */
export function buildZaloOrderMessage({
  orderCode,
  customerName,
  customerPhone,
  customerAddress,
  cart,
  finalTotal,
  shippingFee = 0,
  distanceKm,
  note,
}: {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  cart: CartItem[];
  finalTotal: number;
  shippingFee?: number;
  distanceKm?: number | null;
  note?: string;
}): string {
  const itemsSummary = cart
    .map((item, idx) => {
      const toppingTxt = item.selectedToppings?.length
        ? ` (+ ${item.selectedToppings.map((t) => t.name).join(", ")})`
        : "";
      const itemUnitTotal = item.price + item.selectedToppings.reduce((s, t) => s + t.price, 0);
      const lineTotal = itemUnitTotal * item.quantity;
      const noteTxt = item.note ? ` [Ghi chú: ${item.note}]` : "";
      return `${idx + 1}. ${item.quantity}x ${item.name}${toppingTxt}${noteTxt} = ${lineTotal.toLocaleString("vi-VN")}đ`;
    })
    .join("\n");

  const shipLine = shippingFee > 0
    ? `🚗 Phí giao hàng${distanceKm ? ` (${distanceKm}km)` : ""}: ${shippingFee.toLocaleString("vi-VN")}đ\n`
    : "";

  return (
    `🍧 [ĐƠN HÀNG TIỆM CHÈ NA - ZALO MINI]\n` +
    `Mã đơn: #${orderCode}\n` +
    `Khách hàng: ${customerName.trim()}\n` +
    `Số điện thoại: ${customerPhone.trim()}\n` +
    `Địa chỉ nhận: ${customerAddress.trim()}\n\n` +
    `📋 DANH SÁCH MÓN:\n${itemsSummary}\n\n` +
    shipLine +
    `💵 TỔNG THANH TOÁN: ${finalTotal.toLocaleString("vi-VN")}đ\n` +
    `📝 Ghi chú chung: ${note?.trim() || "Không có"}\n\n` +
    `Quán xác nhận và giao sớm giúp mình nhé!`
  );
}
