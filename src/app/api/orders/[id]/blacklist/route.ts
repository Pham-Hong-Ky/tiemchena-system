import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/services/orderService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Bom hàng / Hủy đơn ảo";

    const updated = await orderService.blacklistAndCancelOrder(id, reason);
    return NextResponse.json({
      success: true,
      message: `Đã chặn số điện thoại ${updated.customerPhone} vào danh sách đen và hủy đơn hàng!`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/orders/[id]/blacklist error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể chặn đơn hàng" },
      { status: 500 }
    );
  }
}
