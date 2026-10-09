import { NextResponse } from "next/server";
import { sepayService } from "@/services/sepayService";

export const sepayController = {
  async webhook(request: Request) {
    try {
      const url = new URL(request.url);
      const authHeader =
        request.headers.get("authorization") ||
        request.headers.get("x-api-key") ||
        url.searchParams.get("apiKey") ||
        url.searchParams.get("key") ||
        "";
      const body = await request.json().catch(() => ({}));

      const result = await sepayService.processWebhook(body, authHeader);
      return NextResponse.json(result);
    } catch (error: any) {
      if (error.message === "UNAUTHORIZED_SEPAY") {
        return NextResponse.json(
          { success: false, error: "Unauthorized SePay Webhook", diag: error.diag },
          { status: 401 }
        );
      }
      console.error("SepayController error:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error processing webhook" },
        { status: 500 }
      );
    }
  },
};
