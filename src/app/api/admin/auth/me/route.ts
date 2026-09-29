import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const isValid = await verifySessionToken(token);

    return NextResponse.json({
      success: true,
      authenticated: isValid,
    });
  } catch (error) {
    console.error("Check auth error:", error);
    return NextResponse.json({
      success: true,
      authenticated: false,
    });
  }
}
