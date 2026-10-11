import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { telegramService } from "@/services/telegramService";
import { isTelegramConfigured, getChatIds, fetchTelegramChats, hasTelegramToken } from "@/lib/telegram";

export const telegramController = {
  // GET /api/admin/telegram/status → kiểm tra đã cấu hình bot chưa
  async status() {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      return NextResponse.json({
        success: true,
        data: {
          configured: isTelegramConfigured(),
          hasToken: hasTelegramToken(),
          chatCount: getChatIds().length,
        },
      });
    } catch (error) {
      console.error("TelegramController.status error:", error);
      return NextResponse.json({ success: false, error: "Lỗi kiểm tra cấu hình Telegram" }, { status: 500 });
    }
  },

  // GET /api/admin/telegram/detect → dò chat id từ getUpdates
  async detect() {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const result = await fetchTelegramChats();
      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      console.error("TelegramController.detect error:", error);
      return NextResponse.json({ success: false, error: "Lỗi dò chat id Telegram" }, { status: 500 });
    }
  },

  // POST /api/admin/telegram/test → gửi 1 tin nhắn thử
  async test() {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      if (!isTelegramConfigured()) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID trong biến môi trường.",
          },
          { status: 400 }
        );
      }

      const result = await telegramService.sendTestMessage();
      if (!result.sent) {
        return NextResponse.json(
          { success: false, error: result.error || "Không gửi được tin nhắn Telegram" },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, message: "Đã gửi tin nhắn thử về Telegram!" });
    } catch (error) {
      console.error("TelegramController.test error:", error);
      return NextResponse.json({ success: false, error: "Lỗi gửi tin nhắn thử" }, { status: 500 });
    }
  },
};
