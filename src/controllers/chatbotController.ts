import { NextResponse } from "next/server";
import { chatbotService } from "@/services/chatbotService";
import { checkGenericRateLimit } from "@/lib/rateLimit";

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return ((forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1").trim();
}

const MAX_MESSAGE_LENGTH = 500;

export const chatbotController = {
  /**
   * POST /api/chat
   * Body: { message: string, history?: { role: "user" | "bot"; content: string }[] }
   */
  async post(request: Request) {
    try {
      const rateCheck = checkGenericRateLimit("chat", getClientIp(request), {
        maxRequests: 25,
        windowMs: 60 * 1000,
        blockDurationMs: 2 * 60 * 1000,
        errorMessage: "Bạn nhắn hơi nhanh rồi. Vui lòng thử lại sau ít phút nhé!",
      });

      if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
      }

      const body = await request.json().catch(() => ({} as any));
      const message = typeof body?.message === "string" ? body.message.trim() : "";

      if (!message) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập nội dung cần hỏi" },
          { status: 400 }
        );
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { success: false, error: `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự` },
          { status: 400 }
        );
      }

      const history = Array.isArray(body?.history)
        ? body.history
            .filter((m: any) => m && (m.role === "user" || m.role === "bot") && typeof m.content === "string")
            .slice(-6)
        : [];

      const data = await chatbotService.ask(message, history);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error("ChatbotController.post error:", error);
      return NextResponse.json(
        { success: false, error: "Trợ lý ảo đang bận, bạn thử lại sau ít giây nhé!" },
        { status: 500 }
      );
    }
  },
};
