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

      const chanGaUpdated = await prisma.product.updateMany({
        where: {
          OR: [
            { name: { contains: "Chân Gà", mode: "insensitive" } },
            { slug: { contains: "chan-ga" } },
          ],
        },
        data: { categoryId: boardChanGa.id },
      });

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

      const anVatUpdated = await prisma.product.updateMany({
        where: {
          categoryId: { notIn: [boardChanGa.id, boardCheDoUong.id] },
        },
        data: { categoryId: boardAnVat.id },
      });

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
  },
};
