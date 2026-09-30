import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Ensure the 3 standard boards exist as categories
    const boardChanGa = await prisma.category.upsert({
      where: { slug: "chan-ga" },
      update: { name: "Chuyên Chân Gà Sốt Thái", icon: "🍗", sortOrder: 1, isActive: true },
      create: { name: "Chuyên Chân Gà Sốt Thái", slug: "chan-ga", icon: "🍗", sortOrder: 1, isActive: true },
    });

    const boardAnVat = await prisma.category.upsert({
      where: { slug: "an-vat-met" },
      update: { name: "Bảng Ăn Vặt & Mẹt", icon: "🍢", sortOrder: 2, isActive: true },
      create: { name: "Bảng Ăn Vặt & Mẹt", slug: "an-vat-met", icon: "🍢", sortOrder: 2, isActive: true },
    });

    const boardCheDoUong = await prisma.category.upsert({
      where: { slug: "che-do-uong" },
      update: { name: "Bảng Chè & Đồ Uống", icon: "🍧", sortOrder: 3, isActive: true },
      create: { name: "Bảng Chè & Đồ Uống", slug: "che-do-uong", icon: "🍧", sortOrder: 3, isActive: true },
    });

    // 2. Re-assign products into the 3 boards
    // A. Chân Gà products -> boardChanGa
    const chanGaUpdated = await prisma.product.updateMany({
      where: {
        OR: [
          { name: { contains: "Chân Gà", mode: "insensitive" } },
          { slug: { contains: "chan-ga" } },
        ],
      },
      data: { categoryId: boardChanGa.id },
    });

    // B. Chè & Nước uống products -> boardCheDoUong
    // First find old categories
    const oldCheOrNuoc = await prisma.category.findMany({
      where: {
        slug: { in: ["che", "nuoc-uong"] },
      },
    });
    const oldCheOrNuocIds = oldCheOrNuoc.map((c) => c.id);

    const cheUpdated = await prisma.product.updateMany({
      where: {
        OR: [
          { categoryId: { in: oldCheOrNuocIds } },
          { name: { contains: "Chè", mode: "insensitive" } },
          { name: { contains: "Trà", mode: "insensitive" } },
          { name: { contains: "Nước", mode: "insensitive" } },
          { name: { contains: "Sinh Tố", mode: "insensitive" } },
          { name: { contains: "Sữa Chua", mode: "insensitive" } },
          { name: { contains: "Tào Phớ", mode: "insensitive" } },
          { name: { contains: "Dừa Dầm", mode: "insensitive" } },
        ],
      },
      data: { categoryId: boardCheDoUong.id },
    });

    // C. All remaining food products -> boardAnVat
    const anVatUpdated = await prisma.product.updateMany({
      where: {
        categoryId: { notIn: [boardChanGa.id, boardCheDoUong.id] },
      },
      data: { categoryId: boardAnVat.id },
    });

    // Clean up old unused categories if any have 0 products
    await prisma.category.deleteMany({
      where: {
        slug: { in: ["do-an", "che", "nuoc-uong"] },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã đồng bộ thực đơn và danh mục theo đúng 3 bảng của quán!",
      data: {
        chanGaCount: chanGaUpdated.count,
        cheDoUongCount: cheUpdated.count,
        anVatCount: anVatUpdated.count,
      },
    });
  } catch (error) {
    console.error("Error syncing categories:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi đồng bộ danh mục" },
      { status: 500 }
    );
  }
}
