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
};
