import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderEvents } from "@/lib/orderEvents";
import { requireAdmin } from "@/lib/apiAuth";
import {
  validatePhoneNumber,
  validateCustomerName,
  validateCustomerAddress,
  checkRateLimit,
} from "@/lib/orderValidation";

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};
    if (status && status !== "ALL") {
      where.orderStatus = status;
    }
    if (search) {
      where.OR = [
        { orderCode: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách đơn hàng" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerAddress,
      note,
      paymentMethod = "COD",
      items,
      voucherCode,
      website_hp, // Honeypot trap field
    } = body;

    // ─── 1. BẪY BOT VÔ HÌNH (Honeypot Trap) ──────────────────────────────
    // Nếu bot tự động điền vào ô ẩn website_hp -> âm thầm bỏ qua / chặn ngay
    if (website_hp && String(website_hp).trim() !== "") {
      console.warn("🛡️ Honeypot bot submission detected and blocked:", { customerPhone, website_hp });
      return NextResponse.json({
        success: true,
        data: {
          orderCode: "TCN-" + Math.floor(100000 + Math.random() * 900000),
          customerName: customerName || "Guest",
          orderStatus: "PENDING",
        },
      });
    }

    // ─── 2. RATE LIMITING (Chống spam / tool bắn đơn liên tục) ─────────
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

    const ipLimit = checkRateLimit(`ip:${clientIp.trim()}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: ipLimit.error },
        { status: 429 }
      );
    }

    if (customerPhone) {
      const phoneLimit = checkRateLimit(`phone:${String(customerPhone).trim()}`);
      if (!phoneLimit.allowed) {
        return NextResponse.json(
          { success: false, error: phoneLimit.error },
          { status: 429 }
        );
      }
    }

    // ─── 3. KIỂM TRA DỮ LIỆU ĐẦU VÀO (Strict Validation) ─────────────────
    const nameValidation = validateCustomerName(customerName || "");
    if (!nameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nameValidation.error },
        { status: 400 }
      );
    }

    const phoneValidation = validatePhoneNumber(customerPhone || "");
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error },
        { status: 400 }
      );
    }

    const addressValidation = validateCustomerAddress(customerAddress || "");
    if (!addressValidation.valid) {
      return NextResponse.json(
        { success: false, error: addressValidation.error },
        { status: 400 }
      );
    }

    // ─── 4. KIỂM TRA GIỎ HÀNG & TÍNH LẠI GIÁ TỪ DATABASE ─────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Giỏ hàng đang trống, vui lòng chọn món" },
        { status: 400 }
      );
    }

    // Lấy danh sách ID sản phẩm có trong giỏ
    const productIds = items
      .map((item: any) => item.id || item.productId)
      .filter((id: any) => typeof id === "string" && id.length > 0);

    // Lấy thông tin sản phẩm và toppings từ Database để xác thực giá chuẩn 100%
    const [dbProducts, dbToppings] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
      }),
      prisma.topping.findMany(),
    ]);

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const toppingMap = new Map(dbToppings.map((t) => [t.id, t]));

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const pId = item.id || item.productId;
      const dbProduct = pId ? productMap.get(pId) : null;

      // Chống giả mạo: Bắt buộc sản phẩm phải tồn tại trong cơ sở dữ liệu
      if (!dbProduct) {
        return NextResponse.json(
          {
            success: false,
            error: `Món "${item.name || "trong giỏ hàng"}" không tồn tại hoặc đã ngừng kinh doanh. Vui lòng tải lại trang.`,
          },
          { status: 400 }
        );
      }

      // Kiểm tra trạng thái mở bán
      if (!dbProduct.isAvailable) {
        return NextResponse.json(
          {
            success: false,
            error: `Món "${dbProduct.name}" hiện đang tạm hết hàng. Quý khách vui lòng chọn món khác.`,
          },
          { status: 400 }
        );
      }

      // Đảm bảo số lượng hợp lệ (từ 1 đến 99)
      const qty = Math.min(99, Math.max(1, parseInt(item.quantity) || 1));

      // Tuyệt đối sử dụng giá niêm yết từ Database máy chủ
      const verifiedPrice = dbProduct.price;
      const verifiedName = dbProduct.name;

      // Xác thực toppings từ Database
      let toppingSum = 0;
      const validToppings = [];
      if (item.selectedToppings && Array.isArray(item.selectedToppings)) {
        for (const t of item.selectedToppings) {
          const dbTop = t.id ? toppingMap.get(t.id) : null;
          const topPrice = dbTop ? dbTop.price : Math.max(0, parseFloat(t.price) || 0);
          const topName = dbTop ? dbTop.name : (t.name || "Topping");
          validToppings.push({
            id: t.id || `top-${Date.now()}`,
            name: topName,
            price: topPrice,
          });
          toppingSum += topPrice;
        }
      }

      const unitTotal = verifiedPrice + toppingSum;
      const lineTotal = unitTotal * qty;
      totalAmount += lineTotal;

      orderItemsData.push({
        productId: dbProduct.id,
        productName: verifiedName,
        productPrice: verifiedPrice,
        quantity: qty,
        toppingsJson: validToppings.length > 0 ? JSON.stringify(validToppings) : null,
        itemTotal: lineTotal,
        note: item.note ? String(item.note).slice(0, 200) : null,
      });
    }

    // ─── 5. ÁP DỤNG VOUCHER & TÍNH TỔNG TIỀN CUỐI CÙNG ─────────────────────
    let discountAmount = 0;
    if (voucherCode && typeof voucherCode === "string") {
      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode.toUpperCase().trim() },
      });

      if (voucher && voucher.isActive) {
        const isExpired = voucher.expiresAt && new Date(voucher.expiresAt) < new Date();
        const isUsageExceeded = voucher.usageLimit && voucher.usedCount >= voucher.usageLimit;

        if (!isExpired && !isUsageExceeded && totalAmount >= voucher.minOrderValue) {
          if (voucher.discountType === "PERCENT") {
            discountAmount = (totalAmount * voucher.discountValue) / 100;
            if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
              discountAmount = voucher.maxDiscount;
            }
          } else {
            discountAmount = voucher.discountValue;
          }

          // Cập nhật số lượt dùng voucher
          await prisma.voucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);
    const orderCode = "TCN-" + Math.floor(100000 + Math.random() * 900000);

    // Tạo đơn hàng trong DB
    const order = await prisma.order.create({
      data: {
        orderCode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim().replace(/[\s.-]/g, ""),
        customerAddress: customerAddress.trim(),
        note: note ? String(note).trim().slice(0, 500) : null,
        paymentMethod,
        paymentStatus: "UNPAID",
        orderStatus: "PENDING",
        totalAmount,
        discountAmount,
        finalAmount,
        voucherCode: voucherCode ? voucherCode.toUpperCase().trim() : null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Phát sự kiện Real-time thông báo đơn mới cho trang Quản trị Admin
    try {
      orderEvents.emit("new_order", order);
    } catch (e) {
      console.warn("Event emit warning:", e);
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, error: "Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại!" },
      { status: 500 }
    );
  }
}
