import { prisma } from "@/lib/prisma";

export const voucherService = {
  async applyVoucher(code: string, totalAmount: number) {
    if (!code) throw new Error("Vui lòng nhập mã giảm giá");

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!voucher || !voucher.isActive) {
      throw new Error("Mã giảm giá không tồn tại hoặc đã hết hạn");
    }

    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      throw new Error("Mã giảm giá đã hết thời hạn sử dụng");
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      throw new Error("Mã giảm giá đã hết lượt sử dụng");
    }

    if (totalAmount < voucher.minOrderValue) {
      throw new Error(`Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này`);
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

    return {
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount: Math.min(discount, totalAmount),
    };
  },
};
