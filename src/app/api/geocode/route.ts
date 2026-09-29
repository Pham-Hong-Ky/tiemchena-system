import { NextResponse } from "next/server";
import { checkGenericRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

    const rateCheck = checkGenericRateLimit("geocode", clientIp.trim(), {
      maxRequests: 6,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block
      errorMessage: "Bạn đã yêu cầu định vị quá nhanh. Vui lòng thử lại sau ít phút.",
    });

    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: "Tọa độ không hợp lệ" },
        { status: 400 }
      );
    }

    // Call OpenStreetMap Nominatim with Vietnamese language
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=vi`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "TiemCheNa-System/1.0 (contact@tiemchena.local)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Không thể lấy thông tin địa chỉ từ tọa độ GPS" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const addressObj = data.address || {};

    // Construct a friendly Vietnamese address string
    const parts: string[] = [];

    // House number / road
    if (addressObj.house_number && addressObj.road) {
      parts.push(`Số ${addressObj.house_number}, ${addressObj.road}`);
    } else if (addressObj.road) {
      parts.push(addressObj.road);
    } else if (addressObj.pedestrian) {
      parts.push(addressObj.pedestrian);
    }

    // Suburb / Neighbourhood / Ward
    if (addressObj.suburb) parts.push(addressObj.suburb);
    else if (addressObj.quarter) parts.push(addressObj.quarter);
    else if (addressObj.neighbourhood) parts.push(addressObj.neighbourhood);

    // District / County / Town
    if (addressObj.city_district) parts.push(addressObj.city_district);
    else if (addressObj.district) parts.push(addressObj.district);
    else if (addressObj.county) parts.push(addressObj.county);
    else if (addressObj.town) parts.push(addressObj.town);

    // City / Province
    if (addressObj.city) parts.push(addressObj.city);
    else if (addressObj.state) parts.push(addressObj.state);

    const formattedAddress = parts.length > 0 ? parts.join(", ") : data.display_name || "";

    return NextResponse.json({
      success: true,
      data: {
        address: formattedAddress,
        raw: data,
      },
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi lấy địa chỉ" },
      { status: 500 }
    );
  }
}
