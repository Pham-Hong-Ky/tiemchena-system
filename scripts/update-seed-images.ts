import fs from "fs";
import path from "path";

const IMAGE_URLS: Record<string, string> = {
  "baner.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778357/tiemchena/menu/baner.jpg",
  "banner chân gà.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778360/tiemchena/menu/banner-chan-ga.jpg",
  "banner chè.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778362/tiemchena/menu/banner-che.jpg",
  "banner đồ ăn.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778365/tiemchena/menu/banner-do-an.jpg",
  "bơ già dừa non.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778367/tiemchena/menu/bo-gia-dua-non.jpg",
  "chân gà muối.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778369/tiemchena/menu/chan-ga-muoi.jpg",
  "chân gà sốt thái.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778371/tiemchena/menu/chan-ga-sot-thai.jpg",
  "chân gà xả tắc.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778373/tiemchena/menu/chan-ga-xa-tac.jpg",
  "chè hoa quả.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778376/tiemchena/menu/che-hoa-qua.jpg",
  "chè thập cẩm.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778378/tiemchena/menu/che-thap-cam.jpg",
  "chè.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778380/tiemchena/menu/che.jpg",
  "gà viên.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778383/tiemchena/menu/ga-vien.jpg",
  "khoai lắc phomai.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778384/tiemchena/menu/khoai-lac-phomai.jpg",
  "kimbap chiên.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778386/tiemchena/menu/kimbap-chien.jpg",
  "menu chân gà.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778388/tiemchena/menu/menu-chan-ga.jpg",
  "menu chè và đồ uống.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778390/tiemchena/menu/menu-che-va-do-uong.jpg",
  "menu đồ ăn.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778393/tiemchena/menu/menu-do-an.jpg",
  "mì cay.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778396/tiemchena/menu/mi-cay.jpg",
  "mì trộn.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778399/tiemchena/menu/mi-tron.jpg",
  "nem chua rán.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778401/tiemchena/menu/nem-chua-ran.jpg",
  "nem lụi đóng gói.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778403/tiemchena/menu/nem-lui-dong-goi.jpg",
  "nem nướng đóng gói.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778404/tiemchena/menu/nem-nuong-dong-goi.jpg",
  "nem nướng.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778410/tiemchena/menu/nem-nuong.jpg",
  "nước ép hoa quả.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
  "sữa chua hoa quả.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
  "trà sữa.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
  "trà tắc.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
  "tào phớ.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778420/tiemchena/menu/tao-pho.jpg",
  "đùi gà rán.jpg": "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778422/tiemchena/menu/dui-ga-ran.jpg",
};

const seedPath = path.resolve(__dirname, "../prisma/seed.ts");
let content = fs.readFileSync(seedPath, "utf8");

let count = 0;
for (const [filename, url] of Object.entries(IMAGE_URLS)) {
  const target = `"/images/${filename}"`;
  while (content.includes(target)) {
    content = content.replace(target, `"${url}"`);
    count++;
  }
}

// Check for any remaining local /images/
const remaining = [...content.matchAll(/"\/images\/([^"]+)"/g)].map((m) => m[1]);
if (remaining.length > 0) {
  console.log("⚠️ Remaining /images/ without exact mapping:", [...new Set(remaining)]);
  // Fallback to banner / generic image if needed
  for (const rem of new Set(remaining)) {
    const fallbackUrl = IMAGE_URLS["baner.jpg"];
    const target = `"/images/${rem}"`;
    content = content.split(target).join(`"${fallbackUrl}"`);
  }
}

fs.writeFileSync(seedPath, content, "utf8");
console.log(`✅ Successfully replaced ${count} image URLs with Cloudinary URLs in seed.ts!`);
