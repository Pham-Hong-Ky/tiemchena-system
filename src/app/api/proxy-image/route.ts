import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";

function isPrivateIpOrHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower === "169.254.169.254" || // AWS / GCP metadata
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  ) {
    return true;
  }

  // Check IPv4 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = lower.match(ipv4Regex);
  if (match) {
    const [, a, b] = match.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 127) return true;
    if (a === 0) return true;
  }

  return false;
}

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const urlString = searchParams.get("url");

    if (!urlString) {
      return NextResponse.json({ success: false, error: "Thiếu đường dẫn hình ảnh" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlString);
    } catch {
      return NextResponse.json({ success: false, error: "Đường dẫn không hợp lệ" }, { status: 400 });
    }

    // Chỉ cho phép HTTP và HTTPS
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ success: false, error: "Giao thức không được hỗ trợ" }, { status: 400 });
    }

    // Chặn SSRF tới mạng nội bộ hoặc cloud metadata
    if (isPrivateIpOrHost(parsedUrl.hostname)) {
      return NextResponse.json({ success: false, error: "Địa chỉ bị từ chối truy cập" }, { status: 403 });
    }

    const res = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "TiemCheNa-ImageProxy/1.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Không thể tải hình ảnh từ liên kết gốc" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "";
    // Đảm bảo kết quả trả về là ảnh
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Tài nguyên không phải là hình ảnh hợp lệ" }, { status: 400 });
    }

    const buffer = await res.arrayBuffer();

    // Giới hạn ảnh tối đa 10MB
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Ảnh quá lớn (tối đa 10MB)" }, { status: 400 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Proxy image error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi tải ảnh" }, { status: 500 });
  }
}
