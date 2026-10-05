import { NextResponse } from "next/server";
import { customerService } from "@/services/customerService";
import { requireAdmin } from "@/lib/apiAuth";

export const customerController = {
  // GET: Xử lý cả lấy danh sách khách (Admin) hoặc tra cứu tên (Lookup)
  async get(request: Request, slug?: string[]) {
    try {
      const { searchParams } = new URL(request.url);

      // 1. Nhánh tra cứu /api/customers/lookup?phone=...
      if (slug && slug[0] === "lookup") {
        const phone = searchParams.get("phone") || "";
        const result = await customerService.lookupByPhone(phone);
        return NextResponse.json({ success: true, ...result });
      }

      // 2. Nhánh lấy danh sách khách hàng cho Admin
      const authError = await requireAdmin();
      if (authError) return authError;

      const customers = await customerService.getCustomers();
      return NextResponse.json({ success: true, data: customers });
    } catch (error: any) {
      console.error("CustomerController.get error:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Không thể lấy thông tin khách hàng" },
        { status: 400 }
      );
    }
  },

  // POST /api/customers – thêm 1 khách, hoặc { import: [...], source: "waitlist" } để nhập danh sách chờ
  async post(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      if (Array.isArray(body.import)) {
        const result = await customerService.importCustomers(body.import, body.source === "manual" ? "manual" : "waitlist");
        return NextResponse.json({ success: true, data: result });
      }
      const customer = await customerService.createCustomer(body);
      return NextResponse.json({ success: true, data: customer });
    } catch (error: any) {
      console.error("CustomerController.post error:", error);
      return NextResponse.json({ success: false, error: error.message || "Không thể thêm khách hàng" }, { status: 400 });
    }
  },

  // PUT /api/customers – { id, name, phone, zalo, email, address, note }
  async put(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      const customer = await customerService.updateCustomer(body.id, body);
      return NextResponse.json({ success: true, data: customer });
    } catch (error: any) {
      console.error("CustomerController.put error:", error);
      return NextResponse.json({ success: false, error: error.message || "Không thể cập nhật khách hàng" }, { status: 400 });
    }
  },

  // DELETE /api/customers?id=...
  async delete(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const id = new URL(request.url).searchParams.get("id") || "";
      await customerService.deleteCustomer(id);
      return NextResponse.json({ success: true, data: { id } });
    } catch (error: any) {
      console.error("CustomerController.delete error:", error);
      return NextResponse.json({ success: false, error: error.message || "Không thể xóa khách hàng" }, { status: 400 });
    }
  },
};
