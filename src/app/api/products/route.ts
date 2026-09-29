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

    return NextResponse.json({ success: true, data: { products, toppings } });
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

    // Check banner limit if isOnBanner is true
    if (Boolean(isOnBanner)) {
      const bannerCount = await prisma.product.count({
        where: { isOnBanner: true },
      });
      if (bannerCount >= 5) {
        return NextResponse.json(
          { success: false, error: "Đã đạt giới hạn tối đa 5 món hiển thị trên Banner. Vui lòng bỏ chọn món khác trước!" },
          { status: 400 }
        );
      }
    }

    // Validate options / toppings prices
    const toppingsCheck = validateToppingsJson(toppingsJson);
    if (!toppingsCheck.valid) {
      return NextResponse.json({ success: false, error: toppingsCheck.error }, { status: 400 });
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
        categoryId,
        toppingsJson: toppingsCheck.jsonString,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "Không thể thêm món ăn mới" },
      { status: 500 }
    );
  }
}
