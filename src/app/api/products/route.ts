import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { validatePrice, validateToppingsJson } from "@/lib/productValidation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};
    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { isHot: "desc" },
        { isBestseller: "desc" },
        { createdAt: "desc" },
      ],
    });

    const toppings = await prisma.topping.findMany({
      where: { isAvailable: true },
    });

    return NextResponse.json(
      { success: true, data: { products, toppings } },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách món ăn" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { name, slug, description, price, originalPrice, image, isHot, isBestseller, isOnBanner, isAvailable, categoryId, toppingsJson } = body;

    if (!name || price === undefined || price === null || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Vui lòng điền đủ tên, giá và danh mục món ăn" },
        { status: 400 }
      );
    }

    const priceCheck = validatePrice(price, "Giá bán");
    if (!priceCheck.valid) {
      return NextResponse.json({ success: false, error: priceCheck.error }, { status: 400 });
    }

    const origPriceCheck = validatePrice(originalPrice, "Giá gốc", { required: false });
    if (!origPriceCheck.valid) {
      return NextResponse.json({ success: false, error: origPriceCheck.error }, { status: 400 });
    }

    // Check banner limit if isOnBanner is true (max 8)
    const MAX_BANNER = 8;
    if (Boolean(isOnBanner)) {
      const bannerCount = await prisma.product.count({
        where: { isOnBanner: true },
      });
      if (bannerCount >= MAX_BANNER) {
        return NextResponse.json(
          {
            success: false,
            error: `Đã đạt giới hạn tối đa ${MAX_BANNER} món hiển thị trên Banner. Vui lòng chuyển sang tab "🎯 Banner" để bỏ chọn món khác trước!`,
          },
          { status: 400 }
        );
      }
    }

    // Validate options / toppings prices
    const toppingsCheck = validateToppingsJson(toppingsJson);
    if (!toppingsCheck.valid) {
      return NextResponse.json({ success: false, error: toppingsCheck.error }, { status: 400 });
    }

    let validCategoryId = categoryId;
    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      const fallbackCat = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
      if (fallbackCat) validCategoryId = fallbackCat.id;
    }

    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();

    const product = await prisma.product.create({
      data: {
        name,
        slug: productSlug,
        description,
        price: priceCheck.value!,
        originalPrice: origPriceCheck.value,
        image,
        isHot: Boolean(isHot),
        isBestseller: Boolean(isBestseller),
        isOnBanner: Boolean(isOnBanner),
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        categoryId: validCategoryId,
        toppingsJson: toppingsCheck.jsonString,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    const errorMsg = error instanceof Error ? error.message : "Không thể thêm món ăn mới";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
