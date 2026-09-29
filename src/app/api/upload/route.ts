import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/apiAuth";

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

export async function POST(request: Request) {
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

    // 1. Kiểm tra dung lượng file (tối đa 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Kích thước ảnh vượt quá giới hạn cho phép (tối đa 5MB)" },
        { status: 400 }
      );
    }

    // 2. Kiểm tra MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Định dạng file không được hỗ trợ. Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF, AVIF" },
        { status: 400 }
      );
    }

    // 3. Kiểm tra extension của file
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: "Phần mở rộng file không hợp lệ" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Clean file base name and create unique filename
    const baseName = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);

    const uniqueFileName = `${Date.now()}-${baseName || "image"}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;
    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: uniqueFileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải lên hình ảnh" },
      { status: 500 }
    );
  }
}
