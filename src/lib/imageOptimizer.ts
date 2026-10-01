/**
 * Tiện ích Tối Ưu Hóa Ảnh Tự Động cho Tiệm Chè Na
 * Giúp giảm 80-95% dung lượng tải trang mà vẫn giữ nguyên độ nét hoàn hảo.
 */

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number | "auto";
  crop?: "fill" | "limit" | "fit" | "thumb";
  fallback?: string;
}

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

/**
 * Tối ưu hóa ảnh từ Cloudinary hoặc Unsplash
 * - Cloudinary: Chèn f_auto (WebP/AVIF), q_auto (nén thông minh), w_{width}, c_{crop}
 * - Unsplash: Tự động thêm auto=format&fit=crop&w={width}
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: OptimizeOptions = {}
): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return options.fallback || DEFAULT_FALLBACK;
  }

  const cleanUrl = url.trim();
  const width = options.width || 500;
  const crop = options.crop || "fill";
  const quality = options.quality ?? "auto";

  // 1. Tối ưu ảnh Cloudinary
  if (cleanUrl.includes("res.cloudinary.com") && cleanUrl.includes("/upload/")) {
    // Nếu URL đã có các biến đổi f_auto,q_auto thì tránh chèn lặp lại
    if (cleanUrl.includes("/upload/f_auto") || cleanUrl.includes("/upload/w_")) {
      return cleanUrl;
    }

    const transformParams = [`f_auto`, `q_${quality}`, `w_${width}`, `c_${crop}`];
    if (options.height) {
      transformParams.push(`h_${options.height}`);
    }

    const transformString = transformParams.join(",");
    return cleanUrl.replace("/upload/", `/upload/${transformString}/`);
  }

  // 2. Tối ưu ảnh Unsplash
  if (cleanUrl.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(cleanUrl);
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", quality === "auto" ? "80" : String(quality));
      if (options.height) {
        parsed.searchParams.set("h", String(options.height));
      }
      return parsed.toString();
    } catch {
      return cleanUrl;
    }
  }

  return cleanUrl;
}
