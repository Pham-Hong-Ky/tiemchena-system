import { NextResponse } from "next/server";
import { geocodeService, SHOP_COORDINATES, MAX_DELIVERY_DISTANCE_KM } from "@/services/geocodeService";
import { checkGenericRateLimit } from "@/lib/rateLimit";

function checkIpRate(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

  return checkGenericRateLimit("geocode", clientIp.trim(), {
    maxRequests: 30,
    windowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
    errorMessage: "Bạn đã yêu cầu định vị quá nhanh. Vui lòng thử lại sau ít phút.",
  });
}

export const geocodeController = {
  /**
   * GET /api/geocode?lat=...&lng=... hoặc /api/geocode/reverse?lat=...&lng=...
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
    } catch (error) {
      console.error("GeocodeController reverse error:", error);
      return NextResponse.json({
        success: true,
        data: {
          address: "Vị trí gần quán",
          lat: SHOP_COORDINATES.lat,
          lng: SHOP_COORDINATES.lng,
          distanceKm: 1.0,
          shippingFee: 10000,
          isWithinRange: true,
          maxDistanceKm: MAX_DELIVERY_DISTANCE_KM,
          isEstimated: true,
        },
      });
    }
  },

  /**
   * GET /api/geocode/forward?address=...
   */
  async forward(request: Request) {
    try {
      const rateCheck = checkIpRate(request);
      if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
      }

      const { searchParams } = new URL(request.url);
      const address = searchParams.get("address");

      if (!address || address.trim().length < 2) {
        return NextResponse.json({ success: false, error: "Địa chỉ tìm kiếm không hợp lệ" }, { status: 400 });
      }

      const data = await geocodeService.forwardGeocode(address);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error("GeocodeController forward error:", error);
      return NextResponse.json({
        success: true,
        data: {
          formattedAddress: "Gần khu vực quán",
          lat: SHOP_COORDINATES.lat,
          lng: SHOP_COORDINATES.lng,
          distanceKm: 2.0,
          shippingFee: 15000,
          isWithinRange: true,
          maxDistanceKm: MAX_DELIVERY_DISTANCE_KM,
          isEstimated: true,
        },
      });
    }
  },
};
