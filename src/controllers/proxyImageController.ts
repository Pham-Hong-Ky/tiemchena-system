import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";

function isPrivateIpOrHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower === "169.254.169.254" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  ) {
    return true;
  }

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

export const proxyImageController = {
  async proxy(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const { searchParams } = new URL(request.url);
      const urlString = searchParams.get("url");

      if (!urlString) {
        return NextResponse.json({ success: false, error: "Thiếu URL ảnh" }, { status: 400 });
      }

      let parsed: URL;
      try {
        parsed = new URL(urlString);
      } catch {
        return NextResponse.json({ success: false, error: "URL không hợp lệ" }, { status: 400 });
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return NextResponse.json({ success: false, error: "Chỉ hỗ trợ giao thức HTTP/HTTPS" }, { status: 400 });
      }

      if (isPrivateIpOrHost(parsed.hostname)) {
        return NextResponse.json({ success: false, error: "Không được phép truy cập địa chỉ nội bộ" }, { status: 403 });
      }

      const res = await fetch(urlString, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        return NextResponse.json({ success: false, error: "Không thể tải ảnh từ nguồn" }, { status: res.status });
      }

      const contentType = res.headers.get("content-type") || "image/jpeg";
      if (!contentType.startsWith("image/")) {
        return NextResponse.json({ success: false, error: "Nội dung tải về không phải là ảnh" }, { status: 400 });
      }

      const arrayBuffer = await res.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
        },
      });
    } catch (error) {
      console.error("Proxy image error:", error);
      return NextResponse.json({ success: false, error: "Lỗi xử lý ảnh" }, { status: 500 });
    }
  },
};
