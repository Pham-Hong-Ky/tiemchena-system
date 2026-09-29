import { NextResponse } from "next/server";
import { verifyCredentials, createSessionToken, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";
import { checkGenericRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

    const rateCheck = checkGenericRateLimit("admin_login", clientIp.trim(), {
      maxRequests: 5,
      windowMs: 10 * 60 * 1000, // 10 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
      errorMessage: "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng đợi 15 phút trước khi thử lại.",
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateCheck.error },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập tài khoản và mật khẩu quản trị" },
        { status: 400 }
      );
    }

    const isValid = verifyCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(username);

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
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi đăng nhập" },
      { status: 500 }
    );
  }
}
