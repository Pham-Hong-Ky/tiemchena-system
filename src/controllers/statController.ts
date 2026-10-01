import { NextResponse } from "next/server";
import { statService } from "@/services/statService";
import { requireAdmin } from "@/lib/apiAuth";

export const statController = {
  async get() {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const data = await statService.getStats();
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error("StatController.get error:", error);
      return NextResponse.json({ success: false, error: "Không thể lấy thống kê" }, { status: 500 });
    }
  },
};
