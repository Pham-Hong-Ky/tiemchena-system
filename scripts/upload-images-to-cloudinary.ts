/**
 * Script upload tất cả ảnh từ thư mục f:\Tiemchena\image\ lên Cloudinary
 * và in ra mapping tên file → URL để cập nhật seed.ts
 *
 * Cách dùng:
 *   1. Thêm credentials Cloudinary vào .env
 *   2. npx tsx scripts/upload-images-to-cloudinary.ts
 */
import { v2 as cloudinary } from "cloudinary";
import { readdir, readFile } from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Thư mục chứa ảnh gốc (nằm ngoài tiemchena-system)
const IMAGE_DIR = path.resolve(__dirname, "../../image");

async function uploadImage(filePath: string, fileName: string): Promise<string> {
  const buffer = await readFile(filePath);

  // Tạo public_id sạch từ tên file (bỏ extension, chuyển tiếng Việt thành slug)
  const baseName = path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: `tiemchena/menu/${baseName}`,
          overwrite: true,
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

async function main() {
  console.log("🚀 Bắt đầu upload ảnh lên Cloudinary...");
  console.log(`📁 Thư mục ảnh: ${IMAGE_DIR}\n`);

  // Kiểm tra credentials
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("❌ Thiếu Cloudinary credentials trong .env!");
    console.error("   Cần thêm vào .env:");
    console.error("   CLOUDINARY_CLOUD_NAME=your-cloud-name");
    console.error("   CLOUDINARY_API_KEY=your-api-key");
    console.error("   CLOUDINARY_API_SECRET=your-api-secret");
    process.exit(1);
  }

  const files = await readdir(IMAGE_DIR);
  const imageFiles = files.filter((f) =>
    [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(
      path.extname(f).toLowerCase()
    )
  );

  console.log(`📸 Tìm thấy ${imageFiles.length} ảnh\n`);

  const mapping: Record<string, string> = {};
  const errors: string[] = [];

  for (const fileName of imageFiles) {
    const filePath = path.join(IMAGE_DIR, fileName);
    try {
      process.stdout.write(`  ⏫ ${fileName} ... `);
      const url = await uploadImage(filePath, fileName);
      mapping[fileName] = url;
      console.log(`✅`);
    } catch (err) {
      console.log(`❌ FAILED`);
      errors.push(`${fileName}: ${err}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 MAPPING TÊN FILE → URL CLOUDINARY:");
  console.log("=".repeat(60));
  for (const [name, url] of Object.entries(mapping)) {
    console.log(`"${name}" → "${url}"`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📝 COPY PASTE VÀO seed.ts (thay /images/...):");
  console.log("=".repeat(60));

  // In ra dạng JS object để dễ copy-paste
  console.log("\nconst IMAGE_URLS: Record<string, string> = {");
  for (const [name, url] of Object.entries(mapping)) {
    console.log(`  "${name}": "${url}",`);
  }
  console.log("};");

  if (errors.length > 0) {
    console.log("\n⚠️  Các file bị lỗi:");
    errors.forEach((e) => console.log("  -", e));
  }

  console.log(`\n✅ Upload hoàn tất: ${Object.keys(mapping).length}/${imageFiles.length} ảnh thành công`);
}

main().catch(console.error);
