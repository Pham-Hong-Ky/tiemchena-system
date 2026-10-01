import { NextResponse } from "next/server";
import { authService } from "@/services/authService";
import { COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";
import { checkGenericRateLimit } from "@/lib/rateLimit";

export const authController = {
  async login(request: Request) {
    try {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

      const rateCheck = checkGenericRateLimit("admin_login", clientIp.trim(), {
        maxRequests: 5,
        windowMs: 10 * 60 * 1000,
        blockDurationMs: 15 * 60 * 1000,
        errorMessage: "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng đợi 15 phút.",
      });

      if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
      }

      const body = await request.json();
      const { username, password } = body;
      const { token } = await authService.login(username, password);

      const response = NextResponse.json({
        success: true,
        message: "Đăng nhập thành công",
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });

      return response;
    } catch (error: any) {
      console.error("AuthController.login error:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Lỗi đăng nhập" },
        { status: 401 }
      );
    }
  },

  async logout() {
    const response = NextResponse.json({
      success: true,
      message: "Đăng xuất thành công",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });

    return response;
  },

  async me() {
    const authenticated = await authService.verifyCurrentSession();
    return NextResponse.json({ success: true, authenticated });
  },
};
