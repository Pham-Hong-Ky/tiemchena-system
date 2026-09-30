import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function POST() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    // 1. Reset all products isOnBanner to false
    await prisma.product.updateMany({
      data: { isOnBanner: false },
    });

    // 2. Select top 5 signature products to mark as banner
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

    // If still less than 5, fill up with bestsellers / hot items
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

    // Set isOnBanner = true for the 5 selected products
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
}
