import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderEvents } from "@/lib/orderEvents";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = id.trim().replace(/[\s.-]/g, "");

    // Support lookup by ID, orderCode, or customerPhone
    const orders = await prisma.order.findMany({
      where: {
        OR: [{ id }, { orderCode: id }, { customerPhone: cleanId }],
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: orders[0], allOrders: orders });
  } catch (error) {
    console.error("GET order error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { orderStatus, paymentStatus, note } = body;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
        ...(note !== undefined && { note }),
      },
      include: {
        items: true,
      },
    });

    try {
      orderEvents.emit("order_updated", updated);
    } catch (e) {
      console.warn("Event emit warning:", e);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ success: false, error: "Không thể cập nhật đơn hàng" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Đã xóa đơn hàng" });
  } catch (error) {
    console.error("DELETE order error:", error);
    return NextResponse.json({ success: false, error: "Không thể xóa đơn hàng" }, { status: 500 });
  }
}
