import { NextResponse } from "next/server";
import { geocodeService } from "@/services/geocodeService";
import { checkGenericRateLimit } from "@/lib/rateLimit";

function checkIpRate(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

  return checkGenericRateLimit("geocode", clientIp.trim(), {
    maxRequests: 60,
    windowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
    errorMessage: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây.",
  });
}

export const geocodeController = {
  /**
   * GET/POST /api/geocode/estimate
   * Tính khoảng cách Haversine * 1.3 và phí giao hàng theo tọa độ { lat, lng }
   */
  async estimate(request: Request) {
    try {
      const rateCheck = checkIpRate(request);
      if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
      }

      let lat: number | null = null;
      let lng: number | null = null;

      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        lat = typeof body.lat === "number" ? body.lat : parseFloat(body.lat);
        lng = typeof body.lng === "number" ? body.lng : parseFloat(body.lng);
      } else {
        const { searchParams } = new URL(request.url);
        lat = parseFloat(searchParams.get("lat") || "");
        lng = parseFloat(searchParams.get("lng") || "");
      }

      if (lat === null || lng === null || isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json({ success: false, error: "Tọa độ không hợp lệ (-90..90, -180..180)" }, { status: 400 });
      }

      const result = geocodeService.calculateFeeForCoordinates({ lat, lng });

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("GeocodeController estimate error:", error);
      return NextResponse.json({ success: false, error: error?.message || "Lỗi tính khoảng cách" }, { status: 500 });
    }
  },

  /**
   * GET /api/geocode/reverse?lat=...&lng=...
   * Định vị khi khách bấm nút "Lấy vị trí của tôi" (GPS)
   */
  async reverse(request: Request) {
    try {
      const rateCheck = checkIpRate(request);
      if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
      }

      const { searchParams } = new URL(request.url);
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");

      if (!lat || !lng) {
        return NextResponse.json({ success: false, error: "Tọa độ không hợp lệ" }, { status: 400 });
      }

      const data = await geocodeService.reverseGeocode(lat, lng);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error("GeocodeController reverse error:", error);
      return NextResponse.json({ success: false, error: error?.message || "Không thể định vị tọa độ này" }, { status: 400 });
    }
  },
};
