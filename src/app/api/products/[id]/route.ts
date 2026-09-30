import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { validatePrice, validateToppingsJson } from "@/lib/productValidation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Không tìm thấy món ăn" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("GET product error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, originalPrice, image, isHot, isBestseller, isOnBanner, isAvailable, categoryId, toppingsJson } = body;

    let validatedPrice: number | undefined;
    if (price !== undefined) {
      const priceCheck = validatePrice(price, "Giá bán");
      if (!priceCheck.valid) {
        return NextResponse.json({ success: false, error: priceCheck.error }, { status: 400 });
      }
      validatedPrice = priceCheck.value!;
    }

    let validatedOrigPrice: number | null | undefined;
    if (originalPrice !== undefined) {
      const origPriceCheck = validatePrice(originalPrice, "Giá gốc", { required: false });
      if (!origPriceCheck.valid) {
        return NextResponse.json({ success: false, error: origPriceCheck.error }, { status: 400 });
      }
      validatedOrigPrice = origPriceCheck.value;
    }

    // Check banner limit if toggling isOnBanner to true (max 8)
    const MAX_BANNER = 8;
    if (isOnBanner !== undefined && Boolean(isOnBanner)) {
      const bannerCount = await prisma.product.count({
        where: {
          isOnBanner: true,
          id: { not: id },
        },
      });
      if (bannerCount >= MAX_BANNER) {
        return NextResponse.json(
          {
            success: false,
            error: `Đã đạt giới hạn tối đa ${MAX_BANNER} món hiển thị trên Banner. Vui lòng chuyển sang tab "🎯 Banner" để bỏ chọn bớt món khác!`,
          },
          { status: 400 }
        );
      }
    }

    // Validate options / toppings prices
    let validatedToppingsJsonStr: string | undefined;
    if (toppingsJson !== undefined) {
      const toppingsCheck = validateToppingsJson(toppingsJson);
      if (!toppingsCheck.valid) {
        return NextResponse.json({ success: false, error: toppingsCheck.error }, { status: 400 });
      }
      validatedToppingsJsonStr = toppingsCheck.jsonString;
    }

    let validCategoryId: string | undefined = undefined;
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (cat) {
        validCategoryId = cat.id;
      } else {
        const fallbackCat = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
        validCategoryId = fallbackCat?.id;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(validatedPrice !== undefined && { price: validatedPrice }),
        ...(originalPrice !== undefined && { originalPrice: validatedOrigPrice }),
        ...(image !== undefined && { image }),
        ...(isHot !== undefined && { isHot: Boolean(isHot) }),
        ...(isBestseller !== undefined && { isBestseller: Boolean(isBestseller) }),
        ...(isOnBanner !== undefined && { isOnBanner: Boolean(isOnBanner) }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(validCategoryId && { categoryId: validCategoryId }),
        ...(validatedToppingsJsonStr !== undefined && { toppingsJson: validatedToppingsJsonStr }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    const errorMsg = error instanceof Error ? error.message : "Lỗi máy chủ khi cập nhật món ăn";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Đã xóa món ăn thành công" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ success: false, error: "Không thể xóa món ăn" }, { status: 500 });
  }
}
