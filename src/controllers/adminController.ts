import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const adminController = {
  // POST /api/admin/reset-banner
  async resetBanner() {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      await prisma.product.updateMany({
        data: { isOnBanner: false },
      });

      const targetKeywords = [
        "Nem Nướng Nha Trang",
        "Chân Gà Sốt Thái",
        "Chè Dừa Dầm",
        "Mỳ Cay 7 Cấp Độ",
        "Trà Sữa Trân Châu",
      ];

      const selectedIds: string[] = [];

      for (const kw of targetKeywords) {
        const p = await prisma.product.findFirst({
          where: {
            name: { contains: kw },
            isAvailable: true,
          },
        });
        if (p && !selectedIds.includes(p.id)) {
          selectedIds.push(p.id);
        }
      }

      if (selectedIds.length < 5) {
        const moreProducts = await prisma.product.findMany({
          where: {
            id: { notIn: selectedIds },
            isAvailable: true,
          },
          orderBy: [{ isBestseller: "desc" }, { isHot: "desc" }],
          take: 5 - selectedIds.length,
        });
        moreProducts.forEach((p) => selectedIds.push(p.id));
      }

      if (selectedIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: selectedIds } },
          data: { isOnBanner: true },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Đã chuẩn hóa về ${selectedIds.length} món Banner đặc sắc nhất!`,
        count: selectedIds.length,
      });
    } catch (error) {
      console.error("Error resetting banner items:", error);
      return NextResponse.json(
        { success: false, error: "Không thể đặt lại danh sách banner" },
        { status: 500 }
      );
    }
  },

  // GET /api/admin/sync-categories
  async syncCategories() {
    try {
      const boardChanGa = await prisma.category.upsert({
        where: { slug: "chan-ga" },
        update: { name: "Chuyên Chân Gà Sốt Thái", icon: null, sortOrder: 1, isActive: true },
        create: { name: "Chuyên Chân Gà Sốt Thái", slug: "chan-ga", icon: null, sortOrder: 1, isActive: true },
      });

      const boardAnVat = await prisma.category.upsert({
        where: { slug: "an-vat-met" },
        update: { name: "Bảng Ăn Vặt & Mẹt", icon: null, sortOrder: 2, isActive: true },
        create: { name: "Bảng Ăn Vặt & Mẹt", slug: "an-vat-met", icon: null, sortOrder: 2, isActive: true },
      });

      const boardChe = await prisma.category.upsert({
        where: { slug: "che" },
        update: { name: "Chè & Tráng Miệng", icon: null, sortOrder: 3, isActive: true },
        create: { name: "Chè & Tráng Miệng", slug: "che", icon: null, sortOrder: 3, isActive: true },
      });

      const boardDoUong = await prisma.category.upsert({
        where: { slug: "do-uong" },
        update: { name: "Đồ Uống & Trà Sữa", icon: null, sortOrder: 4, isActive: true },
        create: { name: "Đồ Uống & Trà Sữa", slug: "do-uong", icon: null, sortOrder: 4, isActive: true },
      });

      const allProducts = await prisma.product.findMany();
      let chanGaCount = 0;
      let anVatCount = 0;
      let cheCount = 0;
      let doUongCount = 0;

      for (const item of allProducts) {
        const name = item.name.toLowerCase();
        let targetCatId = boardAnVat.id;

        if (name.includes("chân gà")) {
          targetCatId = boardChanGa.id;
          chanGaCount++;
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
          targetCatId = boardDoUong.id;
          doUongCount++;
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
          targetCatId = boardChe.id;
          cheCount++;
        } else {
          targetCatId = boardAnVat.id;
          anVatCount++;
        }

        await prisma.product.update({
          where: { id: item.id },
          data: { categoryId: targetCatId },
        });
      }

      await prisma.category.deleteMany({
        where: {
          slug: { in: ["che-do-uong", "do-an", "nuoc-uong"] },
          products: { none: {} },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã đồng bộ thực đơn và danh mục thành công!",
        data: {
          chanGaCount,
          anVatCount,
          cheCount,
          doUongCount,
        },
      });
    } catch (error) {
      console.error("Error syncing categories:", error);
      return NextResponse.json(
        { success: false, error: "Lỗi đồng bộ danh mục" },
        { status: 500 }
      );
    }
  },
};
