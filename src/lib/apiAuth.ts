import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

/**
 * Helper to enforce admin authentication in API Route Handlers.
 * Returns `NextResponse` with 401 if unauthenticated, or `null` if authorized.
 * 
 * Usage:
 * const authError = await requireAdmin();
 * if (authError) return authError;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const isAuthenticated = await verifySessionToken(token);

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền quản trị viên" },
        { status: 401 }
      );
    }

    return null;
  } catch (error) {
    console.error("requireAdmin error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xác thực hệ thống" },
      { status: 500 }
    );
  }
}
