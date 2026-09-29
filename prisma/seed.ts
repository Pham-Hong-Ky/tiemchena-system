import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Resetting and initializing Tiệm Chè Na database...");

  // 1. Clean out all sample / mock data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.voucher.deleteMany();

  // 2. Ensure default store settings exist
  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "Tiệm Chè Na",
      hotline: "0986.479.285",
      address: "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội",
      openingHours: "09:00 - 22:30",
      bannerAnnouncement: "GIẢM NGAY 10% tổng hóa đơn khi đặt trước hoặc chốt đơn qua Zalo hôm nay!",
      qrBankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || "MB",
      qrAccountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || "0986479285",
      qrAccountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "TIEM CHE NA",
      zaloUrl: "https://zalo.me/0986479285",
      isAcceptingOrders: true,
    },
  });

  console.log("✅ Database reset complete: all sample orders, products, categories, vouchers removed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed reset error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
