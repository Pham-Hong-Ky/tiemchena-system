import { prisma } from "@/lib/prisma";
import { orderEvents } from "@/lib/orderEvents";
import {
  validatePhoneNumber,
  validateCustomerName,
  validateCustomerAddress,
  checkRateLimit,
} from "@/lib/orderValidation";

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  paymentMethod?: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    name: string;
    selectedToppings?: Array<{ id: string; name: string; price: number }>;
    note?: string;
  }>;
  voucherCode?: string;
  website_hp?: string;
  shippingFee?: number;
  distanceKm?: number | null;
}

export const orderService = {
  // Lấy danh sách đơn hàng cho Admin
  async listOrders(filters?: { status?: string | null; search?: string | null; limit?: number }) {
    const where: Record<string, any> = {};
    if (filters?.status && filters.status !== "ALL") {
      where.orderStatus = filters.status;
    }
    if (filters?.search) {
      const s = filters.search;
      where.OR = [
        { orderCode: { contains: s } },
        { customerName: { contains: s } },
        { customerPhone: { contains: s } },
      ];
    }

    return prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
    });
  },

  // Lấy đơn hàng theo ID hoặc OrderCode hoặc SĐT
  async getOrderByIdOrCode(idOrCode: string) {
    const clean = idOrCode.trim().replace(/[\s.-]/g, "");
    return prisma.order.findFirst({
      where: {
        OR: [{ id: idOrCode }, { orderCode: idOrCode }, { customerPhone: clean }],
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  },

  // Tra cứu đơn hàng theo SĐT hoặc Mã đơn (cho khách hàng)
  async trackOrders(query: string) {
    const cleanQuery = query.trim().replace(/[\s.-]/g, "");
    const orConditions: any[] = [
      { orderCode: query.trim() },
      { orderCode: query.trim().toUpperCase() },
    ];

    if (cleanQuery.length >= 9) {
      orConditions.push({ customerPhone: cleanQuery });
    }

    return prisma.order.findMany({
      where: { OR: orConditions },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  },

  // Tạo đơn hàng mới
  async createOrder(data: CreateOrderInput, clientIp: string) {
    // 1. Chống Bot / Honeypot
    if (data.website_hp && data.website_hp.trim() !== "") {
      throw new Error("Spam detected");
    }

    // 2. Rate limit
    const cleanPhone = (data.customerPhone || "").replace(/[\s.-]/g, "");
    const rateLimitKey = `${clientIp}_${cleanPhone}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.error || "Bạn đã gửi đơn hàng quá nhanh");
    }

    // 3. Validate
    const phoneCheck = validatePhoneNumber(data.customerPhone);
    if (!phoneCheck.valid) throw new Error(phoneCheck.error || "Số điện thoại không hợp lệ");

    const nameCheck = validateCustomerName(data.customerName);
    if (!nameCheck.valid) throw new Error(nameCheck.error || "Tên người nhận không hợp lệ");

    const addressCheck = validateCustomerAddress(data.customerAddress);
    if (!addressCheck.valid) throw new Error(addressCheck.error || "Địa chỉ không hợp lệ");

    if (!data.items || data.items.length === 0) {
      throw new Error("Giỏ hàng của bạn đang trống");
    }

    // 4. Verify giá và sản phẩm từ DB
    const productIds = data.items.map((i) => i.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });

    const dbToppings = await prisma.topping.findMany({
      where: { isAvailable: true },
    });
    const dbToppingMap = new Map(dbToppings.map((t) => [t.id, t]));

    let totalAmount = 0;
    const orderItemsData: any[] = [];

    for (const item of data.items) {
      const dbProduct = dbProducts.find((p) => p.id === item.id);
      if (!dbProduct) throw new Error(`Món ăn không tồn tại hoặc đã ngừng bán`);

      const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));
      let toppingSum = 0;
      const validToppings: any[] = [];

      if (Array.isArray(item.selectedToppings)) {
        for (const top of item.selectedToppings) {
          const dbTop = dbToppingMap.get(top.id);
          const topPrice = dbTop ? dbTop.price : Number(top.price) || 0;
          validToppings.push({ id: top.id, name: dbTop?.name || top.name, price: topPrice });
          toppingSum += topPrice;
        }
      }

      const unitTotal = dbProduct.price + toppingSum;
      const lineTotal = unitTotal * qty;
      totalAmount += lineTotal;

      orderItemsData.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        productPrice: dbProduct.price,
        quantity: qty,
        toppingsJson: validToppings.length > 0 ? JSON.stringify(validToppings) : null,
        itemTotal: lineTotal,
        note: item.note ? String(item.note).slice(0, 200) : null,
      });
    }

    // 5. Voucher
    let discountAmount = 0;
    if (data.voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: data.voucherCode.toUpperCase().trim() },
      });
      if (voucher && voucher.isActive && totalAmount >= voucher.minOrderValue) {
        if (voucher.discountType === "PERCENT") {
          discountAmount = (totalAmount * voucher.discountValue) / 100;
          if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
            discountAmount = voucher.maxDiscount;
          }
        } else {
          discountAmount = voucher.discountValue;
        }
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // 6. Phí giao hàng & Khoảng cách
    const distanceKm = typeof data.distanceKm === "number" ? data.distanceKm : null;
    const shippingFee = Math.max(0, Number(data.shippingFee) || 0);

    if (distanceKm !== null && distanceKm > 15) {
      throw new Error(`Khoảng cách giao hàng (${distanceKm} km) vượt quá bán kính tối đa (15 km) của quán.`);
    }

    const finalAmount = Math.max(0, totalAmount + shippingFee - discountAmount);
    const orderCode = "TCN-" + Math.floor(100000 + Math.random() * 900000);

    let finalNote = data.note ? data.note.trim() : null;
    if (distanceKm !== null) {
      const shipTag = `[Ship: ${distanceKm}km - ${shippingFee.toLocaleString("vi-VN")}đ]`;
      finalNote = finalNote ? `${shipTag} ${finalNote}` : shipTag;
    }

    const order = await prisma.order.create({
      data: {
        orderCode,
        customerName: data.customerName.trim(),
        customerPhone: cleanPhone,
        customerAddress: data.customerAddress.trim(),
        note: finalNote,
        paymentMethod: data.paymentMethod || "ZALO",
        paymentStatus: "UNPAID",
        orderStatus: "PENDING",
        totalAmount,
        discountAmount,
        finalAmount,
        voucherCode: data.voucherCode || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    orderEvents.emit("new_order", order);
    return order;
  },

  // Cập nhật trạng thái đơn hàng (Admin)
  async updateOrder(id: string, data: { orderStatus?: string; paymentStatus?: string; note?: string }) {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(data.orderStatus ? { orderStatus: data.orderStatus } : {}),
        ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
      },
      include: {
        items: true,
      },
    });

    orderEvents.emit("order_updated", updated);
    return updated;
  },

  async deleteOrder(id: string) {
    return prisma.order.delete({
      where: { id },
    });
  },

  async cleanCancelledOrders() {
    return prisma.order.deleteMany({
      where: { orderStatus: "CANCELLED" },
    });
  },
};
