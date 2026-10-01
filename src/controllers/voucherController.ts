import { NextResponse } from "next/server";
import { voucherService } from "@/services/voucherService";
import { checkGenericRateLimit } from "@/lib/rateLimit";

export const voucherController = {
  async apply(request: Request) {
    try {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

      const rateCheck = checkGenericRateLimit("voucher_apply", clientIp.trim(), {
        maxRequests: 10,
        windowMs: 60 * 1000,
        blockDurationMs: 5 * 60 * 1000,
        errorMessage: "Bạn đã thử mã quá nhiều lần liên tiếp. Vui lòng đợi 5 phút.",
      });

      if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
      }

      const { code, totalAmount } = await request.json();
      const data = await voucherService.applyVoucher(code, Number(totalAmount) || 0);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error("VoucherController.apply error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi kiểm tra mã giảm giá" }, { status: 400 });
    }
  },
};
