import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/apiAuth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploadController = {
  async upload(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy tệp tải lên" },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "Kích thước ảnh vượt quá giới hạn cho phép (tối đa 5MB)" },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: "Định dạng file không được hỗ trợ. Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF, AVIF" },
          { status: 400 }
        );
      }

      const path = await import("path");
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { success: false, error: "Phần mở rộng file không hợp lệ" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "tiemchena/products",
                resource_type: "image",
                transformation: [{ quality: "auto", fetch_format: "auto" }],
              },
              (error, result) => {
                if (error || !result) reject(error ?? new Error("Upload failed"));
                else resolve(result as { secure_url: string; public_id: string });
              }
            )
            .end(buffer);
        }
      );

      return NextResponse.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { success: false, error: "Không thể tải lên hình ảnh" },
        { status: 500 }
      );
    }
  },
};
