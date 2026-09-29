import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkGenericRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

    const rateCheck = checkGenericRateLimit("voucher_apply", clientIp.trim(), {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block if spammed
      errorMessage: "Bạn đã thử mã quá nhiều lần liên tiếp. Vui lòng đợi 5 phút.",
    });

    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
    }

    const { code, totalAmount } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập mã giảm giá" }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!voucher || !voucher.isActive) {
      return NextResponse.json({ success: false, error: "Mã giảm giá không tồn tại hoặc đã hết hạn" }, { status: 400 });
    }

    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: "Mã giảm giá đã hết thời hạn sử dụng" }, { status: 400 });
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      return NextResponse.json({ success: false, error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
    }

    if (totalAmount < voucher.minOrderValue) {
      return NextResponse.json({
        success: false,
        error: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này`,
      }, { status: 400 });
    }

    let discount = 0;
    if (voucher.discountType === "PERCENT") {
      discount = (totalAmount * voucher.discountValue) / 100;
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    } else {
      discount = voucher.discountValue;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discountAmount: Math.min(discount, totalAmount),
      },
    });
  } catch (error) {
    console.error("Voucher apply error:", error);
    return NextResponse.json({ success: false, error: "Lỗi kiểm tra mã giảm giá" }, { status: 500 });
  }
}
