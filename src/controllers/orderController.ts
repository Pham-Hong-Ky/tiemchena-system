import { NextResponse } from "next/server";
import { orderService } from "@/services/orderService";
import { requireAdmin } from "@/lib/apiAuth";

export const orderController = {
  // Lấy danh sách đơn hàng cho Admin
  async list(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      const search = searchParams.get("search");
      const limit = Number(searchParams.get("limit")) || 100;

      const orders = await orderService.listOrders({ status, search, limit });
      return NextResponse.json({ success: true, data: orders });
    } catch (error) {
      console.error("OrderController.list error:", error);
      return NextResponse.json({ success: false, error: "Lỗi hệ thống khi lấy đơn hàng" }, { status: 500 });
    }
  },

  // Lấy chi tiết đơn hàng theo ID hoặc Mã đơn
  async getById(_request: Request, id: string) {
    try {
      const order = await orderService.getOrderByIdOrCode(id);
      if (!order) {
        return NextResponse.json({ success: false, error: "Không tìm thấy đơn hàng" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: order, allOrders: [order] });
    } catch (error) {
      console.error("OrderController.getById error:", error);
      return NextResponse.json({ success: false, error: "Lỗi hệ thống khi lấy đơn hàng" }, { status: 500 });
    }
  },

  // Tra cứu đơn hàng theo SĐT / Mã đơn
  async track(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get("phone") || searchParams.get("q") || "";
      if (!query.trim()) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập số điện thoại hoặc mã đơn hàng" },
          { status: 400 }
        );
      }
      const orders = await orderService.trackOrders(query);
      if (!orders || orders.length === 0) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy đơn hàng nào liên kết với thông tin này" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: orders,
        latestOrder: orders[0],
      });
    } catch (error) {
      console.error("OrderController.track error:", error);
      return NextResponse.json({ success: false, error: "Lỗi hệ thống khi tra cứu đơn hàng" }, { status: 500 });
    }
  },

  // Tạo đơn hàng mới
  async post(request: Request) {
    try {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

      const body = await request.json();
      const order = await orderService.createOrder(body, clientIp.trim());

      return NextResponse.json({
        success: true,
        data: order,
        orderCode: order.orderCode,
        message: "Tạo đơn hàng thành công!",
      });
    } catch (error: any) {
      console.error("OrderController.post error:", error);
      const isKnown =
        error.message?.includes("không hợp lệ") ||
        error.message?.includes("trống") ||
        error.message?.includes("nhanh") ||
        error.message?.includes("không tồn tại");

      return NextResponse.json(
        { success: false, error: error.message || "Lỗi tạo đơn hàng, vui lòng thử lại" },
        { status: isKnown ? 400 : 500 }
      );
    }
  },

  // Cập nhật trạng thái đơn hàng (Admin)
  async patch(request: Request, id: string) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      if (!id) {
        return NextResponse.json({ success: false, error: "Thiếu mã định danh đơn hàng" }, { status: 400 });
      }

      const body = await request.json();
      const updated = await orderService.updateOrder(id, body);

      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      console.error("OrderController.patch error:", error);
      return NextResponse.json({ success: false, error: "Không thể cập nhật đơn hàng" }, { status: 500 });
    }
  },

  // Xóa đơn hàng (Admin)
  async delete(_request: Request, id: string) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      if (!id) {
        return NextResponse.json({ success: false, error: "Thiếu mã định danh đơn hàng" }, { status: 400 });
      }

      await orderService.deleteOrder(id);
      return NextResponse.json({ success: true, message: "Đã xóa đơn hàng thành công" });
    } catch (error) {
      console.error("OrderController.delete error:", error);
      return NextResponse.json({ success: false, error: "Không thể xóa đơn hàng" }, { status: 500 });
    }
  },

  // Dọn sạch toàn bộ đơn rác / đã hủy (Admin)
  async cleanCancelled(_request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const result = await orderService.cleanCancelledOrders();
      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Đã dọn dẹp ${result.count} đơn hàng rác/đã hủy`,
      });
    } catch (error) {
      console.error("OrderController.cleanCancelled error:", error);
      return NextResponse.json({ success: false, error: "Không thể dọn dẹp đơn hàng" }, { status: 500 });
    }
  },
};
