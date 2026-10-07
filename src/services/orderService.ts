import { prisma } from "@/lib/prisma";
import { orderEvents } from "@/lib/orderEvents";
import { memoryCache } from "@/lib/memoryCache";
import { emailService } from "@/services/emailService";
import {
  validatePhoneNumber,
  validateCustomerName,
  validateCustomerAddress,
  validateEmail,
  checkRateLimit,
  validateOpeningHours,
} from "@/lib/orderValidation";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Trả lại tồn kho cho các món VẬT LÝ có theo dõi kho của 1 đơn (khi hủy đơn)
async function restoreStock(tx: Tx, items: { productId: string | null; quantity: number }[]) {
  for (const item of items) {
    if (!item.productId) continue;
    await tx.product.updateMany({
      where: { id: item.productId, productType: "physical", stock: { not: null } },
      data: { stock: { increment: item.quantity } },
    });
  }
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
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
  distanceSource?: string | null;
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

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
    });

    const phones = Array.from(new Set(orders.map((o) => o.customerPhone).filter(Boolean)));
    if (phones.length === 0) return orders;

    // Đếm số đơn đã hoàn thành (COMPLETED) của từng số điện thoại
    const completedGroups = await prisma.order.groupBy({
      by: ["customerPhone"],
      where: {
        customerPhone: { in: phones },
        orderStatus: "COMPLETED",
      },
      _count: { id: true },
    });

    const completedMap = new Map(completedGroups.map((g) => [g.customerPhone, g._count.id]));

    return orders.map((order) => {
      const count = completedMap.get(order.customerPhone) || 0;
      return {
        ...order,
        completedOrdersCount: count,
        isLoyalCustomer: count >= 2,
      };
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
    // Đơn chỉ gồm sản phẩm số / dịch vụ: không cần giao hàng, không phụ thuộc giờ bếp
    const requestedIds = Array.isArray(data.items) ? data.items.map((i) => i.id).filter(Boolean) : [];
    const requestedTypes = requestedIds.length
      ? await prisma.product.findMany({ where: { id: { in: requestedIds } }, select: { productType: true } })
      : [];
    const isNonPhysicalOnly =
      requestedTypes.length > 0 && requestedTypes.every((p) => p.productType && p.productType !== "physical");
    if (isNonPhysicalOnly && !String(data.customerAddress || "").trim()) {
      data.customerAddress = "Sản phẩm số / dịch vụ – không cần giao hàng";
    }

    // 0. Kiểm tra giờ mở cửa của quán (09:00 - 22:00) – chỉ áp dụng khi có món cần bếp làm
    const timeCheck = validateOpeningHours();
    if (!isNonPhysicalOnly && !timeCheck.isOpen) {
      throw new Error(timeCheck.error || "Quán chỉ nhận đơn đặt hàng từ 09:00 đến 22:00");
    }

    // 0.1 Kiểm tra Blacklist (SĐT hoặc IP đã bị chặn do bom hàng)
    const cleanPhone = (data.customerPhone || "").replace(/[\s.-]/g, "");
    try {
      const isBlacklisted = await (prisma as any).blacklist?.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            ...(clientIp ? [{ ipAddress: clientIp }] : []),
          ],
        },
      });
      if (isBlacklisted) {
        throw new Error(
          "Số điện thoại hoặc thiết bị này đã bị tạm khóa do có lịch sử bom/hủy đơn. Quý khách vui lòng liên hệ trực tiếp hotline quán để được hỗ trợ!"
        );
      }
    } catch (e: any) {
      if (e.message?.includes("tạm khóa do có lịch sử bom")) throw e;
    }

    // 1. Chống Bot / Honeypot
    if (data.website_hp && data.website_hp.trim() !== "") {
      throw new Error("Spam detected");
    }

    // 2. Rate limit
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

    const emailCheck = validateEmail(data.customerEmail);
    if (!emailCheck.valid) throw new Error(emailCheck.error || "Email không hợp lệ");
    const cleanEmail = data.customerEmail ? data.customerEmail.trim().toLowerCase() : null;

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
    // Số lượng cần trừ kho – CHỈ sản phẩm vật lý có theo dõi tồn kho (stock != null).
    // Sản phẩm số / dịch vụ không bao giờ trừ kho.
    const stockToDeduct = new Map<string, { name: string; qty: number; stock: number }>();

    for (const item of data.items) {
      const dbProduct = dbProducts.find((p) => p.id === item.id);
      if (!dbProduct) throw new Error(`Món ăn không tồn tại hoặc đã ngừng bán`);
      if (!dbProduct.isAvailable) {
        throw new Error(`Món "${dbProduct.name}" hiện đang hết hàng, quý khách vui lòng chọn món khác!`);
      }

      const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));

      if (dbProduct.productType === "physical" && dbProduct.stock !== null) {
        const prev = stockToDeduct.get(dbProduct.id);
        stockToDeduct.set(dbProduct.id, { name: dbProduct.name, qty: (prev?.qty || 0) + qty, stock: dbProduct.stock });
      }

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

    // 4b. Không đủ tồn kho → báo khách ngay, không tạo đơn
    for (const [, s] of stockToDeduct) {
      if (s.stock < s.qty) {
        throw new Error(
          s.stock <= 0
            ? `Món "${s.name}" hiện đang hết hàng, quý khách vui lòng chọn món khác!`
            : `Món "${s.name}" chỉ còn ${s.stock} phần, quý khách vui lòng giảm số lượng`
        );
      }
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
      const sourceTag = data.distanceSource ? ` (${data.distanceSource})` : "";
      const shipTag = `[Ship: ${distanceKm}km - ${shippingFee.toLocaleString("vi-VN")}đ${sourceTag}]`;
      finalNote = finalNote ? `${shipTag} ${finalNote}` : shipTag;
    }

    // Tạo đơn + trừ kho trong 1 transaction: trừ kho thất bại (2 khách mua cùng lúc) thì không tạo đơn
    const order = await prisma.$transaction(async (tx) => {
      for (const [productId, s] of stockToDeduct) {
        const res = await tx.product.updateMany({
          where: { id: productId, stock: { gte: s.qty } },
          data: { stock: { decrement: s.qty } },
        });
        if (res.count === 0) {
          throw new Error(`Món "${s.name}" vừa hết hàng, quý khách vui lòng chọn món khác!`);
        }
      }

      return tx.order.create({
      data: {
        orderCode,
        customerName: data.customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: cleanEmail,
        customerAddress: data.customerAddress.trim(),
        note: finalNote,
        ...(clientIp ? { ipAddress: clientIp } : {}),
        paymentMethod: data.paymentMethod || "COD",
        paymentStatus: "UNPAID",
        orderStatus: "PENDING",
        totalAmount,
        discountAmount,
        finalAmount,
        voucherCode: data.voucherCode || null,
        items: {
          create: orderItemsData,
        },
      } as any,
      include: {
        items: true,
      },
    });
    });

    if (stockToDeduct.size > 0) memoryCache.invalidatePrefix("products:");

    // Lưu / cập nhật khách vào CRM (không chặn đơn nếu lỗi)
    try {
      await prisma.customer.upsert({
        where: { phone: cleanPhone },
        create: {
          name: data.customerName.trim(),
          phone: cleanPhone,
          zalo: cleanPhone,
          email: cleanEmail,
          address: data.customerAddress.trim(),
          source: "order",
        },
        update: {
          name: data.customerName.trim(),
          address: data.customerAddress.trim(),
          ...(cleanEmail ? { email: cleanEmail } : {}),
        },
      });
    } catch (e) {
      console.warn("Customer upsert warning:", e);
    }

    orderEvents.emit("new_order", order);
    return order;
  },

  // Chặn khách bom hàng & Hủy đơn hàng
  async blacklistAndCancelOrder(id: string, reason = "Bom hàng / Hủy đơn ảo") {
    const order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order) throw new Error("Không tìm thấy đơn hàng");

    const cleanPhone = (order.customerPhone || "").replace(/[\s.-]/g, "");
    const orderIp = (order as any).ipAddress || null;

    // Thêm vào bảng Blacklist
    if (cleanPhone) {
      try {
        await (prisma as any).blacklist.upsert({
          where: { phone: cleanPhone },
          update: {
            ipAddress: orderIp || undefined,
            reason,
          },
          create: {
            phone: cleanPhone,
            ipAddress: orderIp || null,
            reason,
          },
        });
      } catch (e) {
        console.error("Failed to add to blacklist:", e);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (order.orderStatus !== "CANCELLED") {
        const items = await tx.orderItem.findMany({ where: { orderId: id }, select: { productId: true, quantity: true } });
        await restoreStock(tx, items);
      }
      return tx.order.update({
        where: { id },
        data: {
          orderStatus: "CANCELLED",
          note: order.note
            ? `[🚫 ĐÃ CHẶN BOM HÀNG] ${order.note}`
            : "[🚫 ĐÃ CHẶN BOM HÀNG]",
        },
        include: {
          items: true,
        },
      });
    });
    memoryCache.invalidatePrefix("products:");

    orderEvents.emit("order_updated", updated);
    return updated;
  },

  // Cập nhật trạng thái đơn hàng (Admin)
  async updateOrder(id: string, data: { orderStatus?: string; paymentStatus?: string; note?: string }) {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new Error("Không tìm thấy đơn hàng");

      // Hủy đơn → trả lại tồn kho hàng vật lý
      if (data.orderStatus === "CANCELLED" && current.orderStatus !== "CANCELLED") {
        await restoreStock(tx, current.items);
      }

      return tx.order.update({
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
    });
    if (data.orderStatus === "CANCELLED") memoryCache.invalidatePrefix("products:");
    if (data.orderStatus) await emailService.sendOrderConfirmationIfNeeded(id);

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
