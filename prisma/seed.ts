import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Tiệm Chè Na database...");

  // ────────────────────────────────────────────
  // 1. Clean existing data
  // ────────────────────────────────────────────
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.voucher.deleteMany();

  // ────────────────────────────────────────────
  // 2. Store Settings
  // ────────────────────────────────────────────
  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "Tiệm Chè Na",
      hotline: "0986.479.285",
      address: "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội",
      openingHours: "09:00 - 22:30",
      bannerAnnouncement:
        "GIẢM NGAY 10% tổng hóa đơn khi đặt trước hoặc chốt đơn qua Zalo hôm nay!",
      qrBankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || "MB",
      qrAccountNumber:
        process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || "0986479285",
      qrAccountName:
        process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "TIEM CHE NA",
      zaloUrl: "https://zalo.me/0986479285",
      isAcceptingOrders: true,
    },
  });

  // ────────────────────────────────────────────
  // 3. Toppings
  // ────────────────────────────────────────────
  const toppingNhaDam = await prisma.topping.create({
    data: { name: "Nha đam", price: 5000 },
  });
  const toppingThach3q = await prisma.topping.create({
    data: { name: "Thạch 3Q", price: 5000 },
  });
  const toppingThachDua = await prisma.topping.create({
    data: { name: "Thạch dừa", price: 5000 },
  });

  const toppingIds = JSON.stringify([
    toppingNhaDam.id,
    toppingThach3q.id,
    toppingThachDua.id,
  ]);

  // ────────────────────────────────────────────
  // 4. Categories (3 nhóm chính)
  // ────────────────────────────────────────────
  const catDoAn = await prisma.category.create({
    data: {
      name: "Đồ Ăn",
      slug: "do-an",
      icon: "🍜",
      sortOrder: 1,
      isActive: true,
    },
  });

  const catChe = await prisma.category.create({
    data: {
      name: "Chè",
      slug: "che",
      icon: "🍡",
      sortOrder: 2,
      isActive: true,
    },
  });

  const catNuocUong = await prisma.category.create({
    data: {
      name: "Nước Uống",
      slug: "nuoc-uong",
      icon: "🧃",
      sortOrder: 3,
      isActive: true,
    },
  });

  // ────────────────────────────────────────────
  // 5. Products – ĐỒ ĂN
  // ────────────────────────────────────────────

  // ── Chân Gà ──
  await prisma.product.createMany({
    data: [
      {
        name: "Chân Gà Sốt Thái (Nhỏ)",
        slug: "chan-ga-sot-thai-nho",
        description: "Chân gà sốt Thái chua ngọt cay đặc biệt – size nhỏ",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778371/tiemchena/menu/chan-ga-sot-thai.jpg",
        isHot: true,
        isBestseller: true,
        isOnBanner: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Chân Gà Sốt Thái (Lớn)",
        slug: "chan-ga-sot-thai-lon",
        description: "Chân gà sốt Thái chua ngọt cay đặc biệt – size lớn",
        price: 65000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778371/tiemchena/menu/chan-ga-sot-thai.jpg",
        isHot: true,
        isBestseller: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Chân Gà Sả Tắc (Nhỏ)",
        slug: "chan-ga-sa-tac-nho",
        description: "Chân gà hấp sả tắc thơm nức – size nhỏ",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778373/tiemchena/menu/chan-ga-xa-tac.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Chân Gà Sả Tắc (Lớn)",
        slug: "chan-ga-sa-tac-lon",
        description: "Chân gà hấp sả tắc thơm nức – size lớn",
        price: 55000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778373/tiemchena/menu/chan-ga-xa-tac.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Chân Gà Hấp (Nhỏ)",
        slug: "chan-ga-hap-nho",
        description: "Chân gà hấp mềm ngon – size nhỏ",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778369/tiemchena/menu/chan-ga-muoi.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Chân Gà Hấp (Lớn)",
        slug: "chan-ga-hap-lon",
        description: "Chân gà hấp mềm ngon – size lớn",
        price: 55000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778369/tiemchena/menu/chan-ga-muoi.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Chân Gà Xào Cay Đặc Biệt (Nhỏ)",
        slug: "chan-ga-xao-cay-dac-biet-nho",
        description: "Chân gà xào cay đặc biệt kèm bánh mỳ – size nhỏ",
        price: 45000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778371/tiemchena/menu/chan-ga-sot-thai.jpg",
        isHot: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Chân Gà Xào Cay Đặc Biệt (Lớn)",
        slug: "chan-ga-xao-cay-dac-biet-lon",
        description: "Chân gà xào cay đặc biệt kèm bánh mỳ – size lớn",
        price: 65000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778371/tiemchena/menu/chan-ga-sot-thai.jpg",
        isHot: true,
        categoryId: catDoAn.id,
      },
    ],
  });

  // ── Mẹt Nem ──
  await prisma.product.createMany({
    data: [
      {
        name: "Mẹt Nem Lụi Huế",
        slug: "met-nem-lui-hue",
        description: "Mẹt nem lụi Huế thơm ngon đặc trưng",
        price: 45000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778403/tiemchena/menu/nem-lui-dong-goi.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Nem Lụi Huế",
        slug: "nem-lui-hue",
        description: "Nem lụi Huế đậm đà hương vị miền Trung",
        price: 10000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778403/tiemchena/menu/nem-lui-dong-goi.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Phở Cuốn",
        slug: "pho-cuon",
        description: "Phở cuốn tươi ngon thanh mát",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778410/tiemchena/menu/nem-nuong.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Nem Nướng",
        slug: "nem-nuong",
        description: "Nem nướng thơm lừng hấp dẫn",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778410/tiemchena/menu/nem-nuong.jpg",
        isBestseller: true,
        isOnBanner: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Nem Chua Rán",
        slug: "nem-chua-ran",
        description: "Nem chua rán giòn rụm, chua cay đặc biệt",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778401/tiemchena/menu/nem-chua-ran.jpg",
        categoryId: catDoAn.id,
      },
    ],
  });

  // ── Bánh Mỳ ──
  await prisma.product.createMany({
    data: [
      {
        name: "Bánh Mỳ Chảo Phô Mai",
        slug: "banh-my-chao-pho-mai",
        description: "Bánh mỳ chảo phô mai béo ngậy",
        price: 45000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778386/tiemchena/menu/kimbap-chien.jpg",
        isOnBanner: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Bánh Mỳ Thập Cẩm",
        slug: "banh-my-thap-cam",
        description: "Bánh mỳ thập cẩm đầy đủ nguyên liệu",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778386/tiemchena/menu/kimbap-chien.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Bánh Mỳ Bơ",
        slug: "banh-my-bo",
        description: "Bánh mỳ bơ thơm bùi giản dị",
        price: 10000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778386/tiemchena/menu/kimbap-chien.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Bánh Mỳ Sốt Chà Bông",
        slug: "banh-my-sot-cha-bong",
        description: "Bánh mỳ sốt chà bông ngọt bùi",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778386/tiemchena/menu/kimbap-chien.jpg",
        categoryId: catDoAn.id,
      },
    ],
  });

  // ── Đồ Chiên ──
  await prisma.product.createMany({
    data: [
      {
        name: "Kimbap Chiên",
        slug: "kimbap-chien",
        description: "Kimbap chiên giòn vàng ruộm kiểu Hàn Quốc",
        price: 30000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778386/tiemchena/menu/kimbap-chien.jpg",
        isHot: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Gà Rán Đùi / Cánh",
        slug: "ga-ran-dui-canh",
        description: "Gà rán đùi hoặc cánh giòn tan",
        price: 30000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778422/tiemchena/menu/dui-ga-ran.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Gà Chiên Đùi - Cánh Sốt Cay / Ngọt",
        slug: "ga-chien-dui-canh-sot-cay-ngot",
        description: "Gà chiên đùi hoặc cánh sốt cay hoặc ngọt",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778422/tiemchena/menu/dui-ga-ran.jpg",
        isHot: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Phô Mai Que",
        slug: "pho-mai-que",
        description: "Phô mai que chiên giòn chảy",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778384/tiemchena/menu/khoai-lac-phomai.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Khoai Tây Chiên Lắc Phô Mai",
        slug: "khoai-tay-chien-lac-pho-mai",
        description: "Khoai tây chiên lắc phô mai bột vàng thơm",
        price: 30000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778384/tiemchena/menu/khoai-lac-phomai.jpg",
        isBestseller: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Gà Viên Lắc Phô Mai",
        slug: "ga-vien-lac-pho-mai",
        description: "Gà viên chiên lắc phô mai đặc biệt",
        price: 50000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778383/tiemchena/menu/ga-vien.jpg",
        isHot: true,
        isBestseller: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Gà Viên Sốt",
        slug: "ga-vien-sot",
        description: "Gà viên chiên sốt đặc biệt",
        price: 55000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778383/tiemchena/menu/ga-vien.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Xúc Xích",
        slug: "xuc-xich",
        description: "Xúc xích chiên nóng",
        price: 10000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778404/tiemchena/menu/nem-nuong-dong-goi.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Viên Chiên",
        slug: "vien-chien",
        description: "Viên chiên giòn các loại",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778383/tiemchena/menu/ga-vien.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Lạp Xưởng",
        slug: "lap-xuong",
        description: "Lạp xưởng nướng thơm ngon",
        price: 15000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778404/tiemchena/menu/nem-nuong-dong-goi.jpg",
        categoryId: catDoAn.id,
      },
    ],
  });

  // ── Mỳ ──
  await prisma.product.createMany({
    data: [
      {
        name: "Mỳ Cay Bò",
        slug: "my-cay-bo",
        description: "Mỳ cay bò đậm đà, cay nồng hấp dẫn",
        price: 45000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778396/tiemchena/menu/mi-cay.jpg",
        isHot: true,
        isBestseller: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Mỳ Ý",
        slug: "my-y",
        description: "Mỳ Ý sốt đặc biệt kiểu Tiệm Chè Na",
        price: 45000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778396/tiemchena/menu/mi-cay.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Mỳ Trộn Đặc Biệt",
        slug: "my-tron-dac-biet",
        description: "Mỳ trộn đặc biệt nhiều nguyên liệu",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778399/tiemchena/menu/mi-tron.jpg",
        isBestseller: true,
        isOnBanner: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Mỳ Cay Xúc Xích",
        slug: "my-cay-xuc-xich",
        description: "Mỳ cay kèm xúc xích hấp dẫn",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778396/tiemchena/menu/mi-cay.jpg",
        isHot: true,
        isOnBanner: true,
        categoryId: catDoAn.id,
      },
      {
        name: "Mỳ Cay Thập Cẩm",
        slug: "my-cay-thap-cam",
        description: "Mỳ cay thập cẩm đủ loại topping",
        price: 55000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778396/tiemchena/menu/mi-cay.jpg",
        isHot: true,
        categoryId: catDoAn.id,
      },
    ],
  });

  // ── Đồ Thêm ──
  await prisma.product.createMany({
    data: [
      {
        name: "Bún Thêm",
        slug: "bun-them",
        description: "Thêm bún vào món ăn",
        price: 5000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778399/tiemchena/menu/mi-tron.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Bánh Mỳ Thêm",
        slug: "banh-my-them",
        description: "Thêm bánh mỳ vào món ăn",
        price: 5000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778386/tiemchena/menu/kimbap-chien.jpg",
        categoryId: catDoAn.id,
      },
      {
        name: "Mỳ Trộn Thêm",
        slug: "my-tron-them",
        description: "Thêm mỳ trộn vào món ăn",
        price: 5000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778399/tiemchena/menu/mi-tron.jpg",
        categoryId: catDoAn.id,
      },
    ],
  });

  // ────────────────────────────────────────────
  // 6. Products – CHÈ
  // ────────────────────────────────────────────

  // ── Chè Truyền Thống ──
  await prisma.product.createMany({
    data: [
      {
        name: "Chè Thập Cẩm",
        slug: "che-thap-cam",
        description: "Chè thập cẩm đủ loại nguyên liệu truyền thống",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778378/tiemchena/menu/che-thap-cam.jpg",
        isBestseller: true,
        isOnBanner: true,
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Thập Cẩm Caramen",
        slug: "che-thap-cam-caramen",
        description: "Chè thập cẩm caramen ngọt dịu",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778378/tiemchena/menu/che-thap-cam.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Bưởi",
        slug: "che-buoi",
        description: "Chè bưởi thơm mát thanh tao",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778380/tiemchena/menu/che.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Ngô",
        slug: "che-ngo",
        description: "Chè ngô ngọt bùi dân dã",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778380/tiemchena/menu/che.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Đậu Đỏ",
        slug: "che-dau-do",
        description: "Chè đậu đỏ truyền thống thanh mát",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778380/tiemchena/menu/che.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Ngô Bưởi Khoai",
        slug: "che-ngo-buoi-khoai",
        description: "Chè ngô bưởi khoai kết hợp độc đáo",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778380/tiemchena/menu/che.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
    ],
  });

  // ── Chè Xoài Caramen ──
  await prisma.product.create({
    data: {
      name: "Chè Xoài Caramen",
      slug: "che-xoai-caramen",
      description: "Chè xoài caramen ngọt béo hấp dẫn",
      price: 30000,
      image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778376/tiemchena/menu/che-hoa-qua.jpg",
      isHot: true,
      isBestseller: true,
      isOnBanner: true,
      categoryId: catChe.id,
      toppingsJson: toppingIds,
    },
  });

  // ── Chè Hot ──
  await prisma.product.createMany({
    data: [
      {
        name: "Chè Dừa Dầm",
        slug: "che-dua-dam",
        description: "Chè dừa dầm lạnh mát giải nhiệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778376/tiemchena/menu/che-hoa-qua.jpg",
        isHot: true,
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Dừa Dầm Caramen",
        slug: "che-dua-dam-caramen",
        description: "Chè dừa dầm caramen béo ngậy",
        price: 30000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778376/tiemchena/menu/che-hoa-qua.jpg",
        isHot: true,
        isBestseller: true,
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Khoai Dẻo",
        slug: "che-khoai-deo",
        description: "Chè khoai dẻo ngọt bùi đặc sắc",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778380/tiemchena/menu/che.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Khoai Dẻo Caramen",
        slug: "che-khoai-deo-caramen",
        description: "Chè khoai dẻo caramen đặc biệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778380/tiemchena/menu/che.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Xoài",
        slug: "che-xoai",
        description: "Chè xoài tươi ngon mát lạnh",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778376/tiemchena/menu/che-hoa-qua.jpg",
        isHot: true,
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
    ],
  });

  // ── Chè Caramen ──
  await prisma.product.createMany({
    data: [
      {
        name: "Chè Caramen Mít Trân Châu",
        slug: "che-caramen-mit-tran-chau",
        description: "Chè caramen mít trân châu béo thơm",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778376/tiemchena/menu/che-hoa-qua.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Chè Caramen Thạch",
        slug: "che-caramen-thach",
        description: "Chè caramen thạch mát lạnh",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778376/tiemchena/menu/che-hoa-qua.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Caramen Hộp",
        slug: "caramen-hop",
        description: "Caramen đóng hộp tiện lợi",
        price: 6000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778376/tiemchena/menu/che-hoa-qua.jpg",
        categoryId: catChe.id,
      },
    ],
  });

  // ── Tào Phớ ──
  await prisma.product.createMany({
    data: [
      {
        name: "Tào Phớ Trân Châu",
        slug: "tao-pho-tran-chau",
        description: "Tào phớ mềm mịn kèm trân châu",
        price: 10000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778420/tiemchena/menu/tao-pho.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
      {
        name: "Tào Phớ Caramen Trân Châu",
        slug: "tao-pho-caramen-tran-chau",
        description: "Tào phớ caramen mềm mịn kèm trân châu",
        price: 15000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778420/tiemchena/menu/tao-pho.jpg",
        categoryId: catChe.id,
        toppingsJson: toppingIds,
      },
    ],
  });

  // ── Sữa Chua Hoa Quả ──
  await prisma.product.createMany({
    data: [
      {
        name: "Sữa Chua Mít",
        slug: "sua-chua-mit",
        description: "Sữa chua mít béo thơm đặc biệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
        categoryId: catChe.id,
      },
      {
        name: "Sữa Chua Mít Caramen",
        slug: "sua-chua-mit-caramen",
        description: "Sữa chua mít caramen ngọt dịu",
        price: 30000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
        isBestseller: true,
        categoryId: catChe.id,
      },
      {
        name: "Sữa Chua Lắc Dâu Tây",
        slug: "sua-chua-lac-dau-tay",
        description: "Sữa chua lắc dâu tây chua ngọt hấp dẫn",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
        isHot: true,
        categoryId: catChe.id,
      },
      {
        name: "Sữa Chua Lắc Lào",
        slug: "sua-chua-lac-lao",
        description: "Sữa chua lắc lào đậm đà thơm ngon",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
        categoryId: catChe.id,
      },
      {
        name: "Sữa Chua Lắc Việt Quất",
        slug: "sua-chua-lac-viet-quat",
        description: "Sữa chua lắc việt quất tím thơm",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
        categoryId: catChe.id,
      },
      {
        name: "Sữa Chua Hoa Quả Dầm",
        slug: "sua-chua-hoa-qua-dam",
        description: "Sữa chua hoa quả dầm tươi ngon",
        price: 30000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
        isBestseller: true,
        categoryId: catChe.id,
      },
      {
        name: "Sữa Chua Hoa Quả Caramen",
        slug: "sua-chua-hoa-qua-caramen",
        description: "Sữa chua hoa quả caramen đặc biệt",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
        isHot: true,
        isBestseller: true,
        categoryId: catChe.id,
      },
      {
        name: "Sữa Chua Đánh Đá",
        slug: "sua-chua-danh-da",
        description: "Sữa chua đánh đá mát lạnh sảng khoái",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778415/tiemchena/menu/sua-chua-hoa-qua.jpg",
        categoryId: catChe.id,
      },
    ],
  });

  // ────────────────────────────────────────────
  // 7. Products – NƯỚC UỐNG
  // ────────────────────────────────────────────

  // ── Nước Ép Hoa Quả ──
  await prisma.product.createMany({
    data: [
      {
        name: "Nước Ép Dứa",
        slug: "nuoc-ep-dua",
        description: "Nước ép dứa tươi mát giải nhiệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Nước Ép Dưa Hấu",
        slug: "nuoc-ep-dua-hau",
        description: "Nước ép dưa hấu mát lạnh ngọt thanh",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Nước Ép Lê",
        slug: "nuoc-ep-le",
        description: "Nước ép lê thanh mát bổ dưỡng",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Nước Ép Lựu (Theo Mùa)",
        slug: "nuoc-ep-luu-theo-mua",
        description: "Nước ép lựu tươi theo mùa đặc biệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Nước Ép Cà Rốt",
        slug: "nuoc-ep-ca-rot",
        description: "Nước ép cà rốt bổ dưỡng tốt cho sức khỏe",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Nước Ép Táo",
        slug: "nuoc-ep-tao",
        description: "Nước ép táo tươi ngon thanh ngọt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Nước Ép Chanh Leo",
        slug: "nuoc-ep-chanh-leo",
        description: "Nước ép chanh leo chua ngọt đặc biệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Ép Mix (Theo Yêu Cầu)",
        slug: "ep-mix-theo-yeu-cau",
        description: "Ép mix nhiều loại quả theo yêu cầu",
        price: 30000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        isHot: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Ép Cam",
        slug: "ep-cam",
        description: "Nước cam ép tươi nguyên chất",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778413/tiemchena/menu/nuoc-ep-hoa-qua.jpg",
        isBestseller: true,
        isOnBanner: true,
        categoryId: catNuocUong.id,
      },
    ],
  });

  // ── Trà Sữa Milk Tea ──
  await prisma.product.createMany({
    data: [
      {
        name: "Hồng Trà Sữa",
        slug: "hong-tra-sua",
        description: "Hồng trà sữa thơm đậm đà kiểu Đài",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
        isBestseller: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Sữa Bạc Hà",
        slug: "tra-sua-bac-ha",
        description: "Trà sữa bạc hà mát lạnh tươi sảng khoái",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Sữa Sôcôla",
        slug: "tra-sua-socola",
        description: "Trà sữa sôcôla ngọt béo đặc biệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Sữa Việt Quất",
        slug: "tra-sua-viet-quat",
        description: "Trà sữa việt quất tím thơm lạ miệng",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
        isHot: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Sữa Khoai Môn",
        slug: "tra-sua-khoai-mon",
        description: "Trà sữa khoai môn tím tím thơm ngọt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
        isBestseller: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Sữa Dưa Lưới",
        slug: "tra-sua-dua-luoi",
        description: "Trà sữa dưa lưới thơm ngọt mát",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Sữa Matcha",
        slug: "tra-sua-matcha",
        description: "Trà sữa matcha xanh lá đậm đà",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
        isHot: true,
        isBestseller: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Sữa Trân Châu Đường Đen",
        slug: "tra-sua-tran-chau-duong-den",
        description: "Trà sữa trân châu đường đen kinh điển",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778417/tiemchena/menu/tra-sua.jpg",
        isHot: true,
        isBestseller: true,
        isOnBanner: true,
        categoryId: catNuocUong.id,
      },
    ],
  });

  // ── Sinh Tố ──
  await prisma.product.createMany({
    data: [
      {
        name: "Sinh Tố Bơ Già Dừa Non",
        slug: "sinh-to-bo-gia-dua-non",
        description: "Sinh tố bơ già dừa non béo ngậy thơm lừng",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778367/tiemchena/menu/bo-gia-dua-non.jpg",
        isHot: true,
        isBestseller: true,
        isOnBanner: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Sinh Tố Xoài Già Dừa Non",
        slug: "sinh-to-xoai-gia-dua-non",
        description: "Sinh tố xoài già dừa non ngọt mát đặc biệt",
        price: 35000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778367/tiemchena/menu/bo-gia-dua-non.jpg",
        isHot: true,
        isBestseller: true,
        isOnBanner: true,
        categoryId: catNuocUong.id,
      },
    ],
  });

  // ── Trà Hoa Quả ──
  await prisma.product.createMany({
    data: [
      {
        name: "Trà Chanh Đá Tay",
        slug: "tra-chanh-da-tay",
        description: "Trà chanh đá tay chua ngọt sảng khoái",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        isBestseller: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Chanh / Trà Quất",
        slug: "tra-chanh-tra-quat",
        description: "Trà chanh hoặc trà quất tươi",
        price: 15000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Chanh Đào",
        slug: "tra-chanh-dao",
        description: "Trà chanh đào thơm ngọt mát lạnh",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        isHot: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Mẻ",
        slug: "tra-me",
        description: "Trà mẻ chua nhẹ thanh giải nhiệt",
        price: 15000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Nước Chanh Tươi",
        slug: "nuoc-chanh-tuoi",
        description: "Nước chanh tươi vắt sảng khoái",
        price: 15000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Chanh Leo Nha Đam",
        slug: "tra-chanh-leo-nha-dam",
        description: "Trà chanh leo nha đam mát lạnh đặc biệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        isHot: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Trà Đào",
        slug: "tra-dao",
        description: "Trà đào cam sả thơm ngọt đặc biệt",
        price: 25000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        isBestseller: true,
        categoryId: catNuocUong.id,
      },
      {
        name: "Coca Cola",
        slug: "coca-cola",
        description: "Nước ngọt Coca Cola mát lạnh",
        price: 15000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Lavie",
        slug: "lavie",
        description: "Nước suối Lavie tinh khiết",
        price: 10000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        categoryId: catNuocUong.id,
      },
      {
        name: "Bia",
        slug: "bia",
        description: "Bia tươi mát lạnh",
        price: 20000,
        image: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778419/tiemchena/menu/tra-tac.jpg",
        categoryId: catNuocUong.id,
      },
    ],
  });

  // ────────────────────────────────────────────
  // 8. Vouchers mẫu
  // ────────────────────────────────────────────
  await prisma.voucher.createMany({
    data: [
      {
        code: "ZALO10",
        discountType: "PERCENT",
        discountValue: 10,
        minOrderValue: 50000,
        maxDiscount: 30000,
        usageLimit: 999,
        isActive: true,
      },
      {
        code: "NEWUSER",
        discountType: "FIXED",
        discountValue: 20000,
        minOrderValue: 80000,
        usageLimit: 100,
        isActive: true,
      },
    ],
  });

  console.log("✅ Seed hoàn tất!");
  console.log("   📂 3 danh mục: Đồ Ăn | Chè | Nước Uống");
  console.log("   🍜 Đồ Ăn: Chân gà, Mẹt nem, Bánh mỳ, Đồ chiên, Mỳ, Đồ thêm");
  console.log("   🍡 Chè: Chè truyền thống, Chè hot, Caramen, Tào phớ, Sữa chua");
  console.log("   🧃 Nước Uống: Nước ép, Trà sữa, Sinh tố, Trà hoa quả");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
