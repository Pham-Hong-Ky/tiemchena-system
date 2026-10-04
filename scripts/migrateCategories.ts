import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting category migration...");

  // Ensure 4 clean categories
  const catChanGa = await prisma.category.upsert({
    where: { slug: "chan-ga" },
    update: { name: "Chuyên Chân Gà Sốt Thái", icon: null, sortOrder: 1, isActive: true },
    create: { name: "Chuyên Chân Gà Sốt Thái", slug: "chan-ga", icon: null, sortOrder: 1, isActive: true },
  });

  const catAnVat = await prisma.category.upsert({
    where: { slug: "an-vat-met" },
    update: { name: "Bảng Ăn Vặt & Mẹt", icon: null, sortOrder: 2, isActive: true },
    create: { name: "Bảng Ăn Vặt & Mẹt", slug: "an-vat-met", icon: null, sortOrder: 2, isActive: true },
  });

  const catChe = await prisma.category.upsert({
    where: { slug: "che" },
    update: { name: "Chè & Tráng Miệng", icon: null, sortOrder: 3, isActive: true },
    create: { name: "Chè & Tráng Miệng", slug: "che", icon: null, sortOrder: 3, isActive: true },
  });

  const catDoUong = await prisma.category.upsert({
    where: { slug: "do-uong" },
    update: { name: "Đồ Uống & Trà Sữa", icon: null, sortOrder: 4, isActive: true },
    create: { name: "Đồ Uống & Trà Sữa", slug: "do-uong", icon: null, sortOrder: 4, isActive: true },
  });

  const allProducts = await prisma.product.findMany();
  console.log(`Found ${allProducts.length} total products.`);

  for (const item of allProducts) {
    const name = item.name.toLowerCase();
    let targetCatId = catAnVat.id;

    if (name.includes("chân gà")) {
      targetCatId = catChanGa.id;
    } else if (
      name.includes("trà sữa") ||
      name.startsWith("hồng trà") ||
      name.startsWith("nước ép") ||
      name.startsWith("ép ") ||
      name.startsWith("trà ") ||
      name.includes("trà đào") ||
      name.includes("trà quất") ||
      name.includes("trà chanh") ||
      name.includes("trà me") ||
      name.includes("nước chanh") ||
      name.includes("coca") ||
      name.includes("lavie") ||
      name.includes("bia")
    ) {
      targetCatId = catDoUong.id;
    } else if (
      name.startsWith("chè") ||
      name.includes("chè ") ||
      name.includes("caramen") ||
      name.includes("tào phớ") ||
      name.includes("sữa chua") ||
      name.includes("dừa dầm") ||
      name.includes("dừa non") ||
      name.includes("hoa quả dầm")
    ) {
      targetCatId = catChe.id;
    } else {
      targetCatId = catAnVat.id;
    }

    await prisma.product.update({
      where: { id: item.id },
      data: { categoryId: targetCatId },
    });
  }

  // Delete obsolete categories if empty
  await prisma.category.deleteMany({
    where: {
      slug: { in: ["che-do-uong", "do-an", "nuoc-uong"] },
      products: { none: {} },
    },
  });

  const result = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  console.log("MIGRATION COMPLETED SUCCESSFULLY:");
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
