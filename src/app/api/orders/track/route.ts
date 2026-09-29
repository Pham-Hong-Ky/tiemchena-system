import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkGenericRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

    const rateCheck = checkGenericRateLimit("order_track", clientIp.trim(), {
      maxRequests: 15,
      windowMs: 5 * 60 * 1000, // 5 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes block
      errorMessage: "Bạn đã tra cứu quá nhiều lần liên tiếp. Vui lòng thử lại sau 15 phút.",
    });

    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("phone") || searchParams.get("q") || "";
    const cleanQuery = query.trim().replace(/[\s.-]/g, "");

    if (!cleanQuery) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập số điện thoại hoặc mã đơn hàng" },
        { status: 400 }
      );
    }

    if (cleanQuery.length < 4) {
      return NextResponse.json(
        { success: false, error: "Thông tin tra cứu quá ngắn (tối thiểu 4 ký tự)" },
        { status: 400 }
      );
    }

    // Exact phone match (if >= 9 digits) or exact orderCode match
    const orConditions: any[] = [
      { orderCode: query.trim() },
      { orderCode: query.trim().toUpperCase() },
    ];

    if (cleanQuery.length >= 9) {
      orConditions.push({ customerPhone: cleanQuery });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy đơn hàng nào liên kết với số điện thoại này. Quý khách vui lòng kiểm tra lại số điện thoại đã đặt hàng.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orders,
      latestOrder: orders[0],
    });
  } catch (error) {
    console.error("Order tracking search error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tra cứu đơn hàng" },
      { status: 500 }
    );
  }
}
