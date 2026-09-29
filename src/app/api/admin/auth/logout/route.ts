import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Đã đăng xuất thành công",
    });

    // Clear session cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi đăng xuất" },
      { status: 500 }
    );
  }
}
