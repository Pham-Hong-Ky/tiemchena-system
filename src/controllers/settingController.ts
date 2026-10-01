import { NextResponse } from "next/server";
import { settingService } from "@/services/settingService";
import { requireAdmin } from "@/lib/apiAuth";

export const settingController = {
  async get() {
    try {
      const data = await settingService.getSettings();
      return NextResponse.json(
        { success: true, data },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=59",
          },
        }
      );
    } catch (error) {
      console.error("SettingController.get error:", error);
      return NextResponse.json({ success: false, error: "Lỗi cấu hình cửa hàng" }, { status: 500 });
    }
  },

  async put(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      const data = await settingService.updateSettings(body);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error("SettingController.put error:", error);
      return NextResponse.json({ success: false, error: "Không thể cập nhật cấu hình" }, { status: 500 });
    }
  },
};
