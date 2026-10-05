import { prisma } from "@/lib/prisma";
import { validatePrice, validateToppingsJson, validateTypeAndStock } from "@/lib/productValidation";
import { memoryCache } from "@/lib/memoryCache";

export const productService = {
  // Lấy danh sách sản phẩm & topping
  async getProducts(filters?: { categoryId?: string | null; search?: string | null }) {
    const cacheKey = `products:${filters?.categoryId || "all"}:${filters?.search || ""}`;
    const cached = memoryCache.get<{ products: any[]; toppings: any[] }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Record<string, any> = {};
    if (filters?.categoryId && filters.categoryId !== "all") {
      where.categoryId = filters.categoryId;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const [products, toppings] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: [
          { isHot: "desc" },
          { isBestseller: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.topping.findMany({
        where: { isAvailable: true },
      }),
    ]);

    const result = { products, toppings };
    memoryCache.set(cacheKey, result, 60_000); // 60s in-memory cache
    return result;
  },

  // Lấy chi tiết 1 sản phẩm
  async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  // Tạo sản phẩm mới
  async createProduct(data: any) {
    const { name, slug, description, price, originalPrice, image, isHot, isBestseller, isOnBanner, isAvailable, categoryId, toppingsJson, productType, stock } = data;

    if (!name || price === undefined || price === null || !categoryId) {
      throw new Error("Vui lòng điền đủ tên, giá và danh mục món ăn");
    }

    const typeStock = validateTypeAndStock(productType, stock);
    if (!typeStock.valid) throw new Error(typeStock.error);

    const priceCheck = validatePrice(price, "Giá bán");
    if (!priceCheck.valid) throw new Error(priceCheck.error);

    const origPriceCheck = validatePrice(originalPrice, "Giá gốc", { required: false });
    if (!origPriceCheck.valid) throw new Error(origPriceCheck.error);

    const MAX_BANNER = 8;
    const toppingsCheck = validateToppingsJson(toppingsJson);
    if (!toppingsCheck.valid) throw new Error(toppingsCheck.error);

    // Parallelize category and banner checks
    const [categoryExists, bannerCount] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryId } }),
      Boolean(isOnBanner)
        ? prisma.product.count({ where: { isOnBanner: true } })
        : Promise.resolve(0),
    ]);

    if (Boolean(isOnBanner) && bannerCount >= MAX_BANNER) {
      throw new Error(`Đã đạt giới hạn tối đa ${MAX_BANNER} món hiển thị trên Banner.`);
    }

    let validCategoryId = categoryId;
    if (!categoryExists) {
      const fallbackCat = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
      if (fallbackCat) validCategoryId = fallbackCat.id;
    }

    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();

    const created = await prisma.product.create({
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
        productType: typeStock.productType,
        stock: typeStock.stock,
      },
      include: { category: true },
    });

    memoryCache.invalidatePrefix("products:");
    memoryCache.invalidatePrefix("categories:");
    return created;
  },

  // Cập nhật sản phẩm
  async updateProduct(id: string, data: any) {
    const { name, description, price, originalPrice, image, isHot, isBestseller, isOnBanner, isAvailable, categoryId, toppingsJson, productType, stock } = data;

    // Loại sản phẩm / tồn kho: gộp với giá trị hiện tại nếu chỉ gửi 1 trong 2
    let typeStockData: { productType: string; stock: number | null } | undefined;
    if (productType !== undefined || stock !== undefined) {
      const current = await prisma.product.findUnique({ where: { id }, select: { productType: true, stock: true } });
      if (!current) throw new Error("Không tìm thấy món ăn");
      const typeStock = validateTypeAndStock(
        productType !== undefined ? productType : current.productType,
        stock !== undefined ? stock : current.stock
      );
      if (!typeStock.valid) throw new Error(typeStock.error);
      typeStockData = { productType: typeStock.productType!, stock: typeStock.stock ?? null };
    }

    let validatedPrice: number | undefined;
    if (price !== undefined) {
      const priceCheck = validatePrice(price, "Giá bán");
      if (!priceCheck.valid) throw new Error(priceCheck.error);
      validatedPrice = priceCheck.value!;
    }

    let validatedOrigPrice: number | null | undefined;
    if (originalPrice !== undefined) {
      const origPriceCheck = validatePrice(originalPrice, "Giá gốc", { required: false });
      if (!origPriceCheck.valid) throw new Error(origPriceCheck.error);
      validatedOrigPrice = origPriceCheck.value;
    }

    let validatedToppingsJsonStr: string | undefined;
    if (toppingsJson !== undefined) {
      const toppingsCheck = validateToppingsJson(toppingsJson);
      if (!toppingsCheck.valid) throw new Error(toppingsCheck.error);
      validatedToppingsJsonStr = toppingsCheck.jsonString;
    }

    const MAX_BANNER = 8;
    // Parallelize category and banner checks if needed
    const [cat, bannerCount] = await Promise.all([
      categoryId ? prisma.category.findUnique({ where: { id: categoryId } }) : Promise.resolve(null),
      isOnBanner !== undefined && Boolean(isOnBanner)
        ? prisma.product.count({ where: { isOnBanner: true, id: { not: id } } })
        : Promise.resolve(0),
    ]);

    if (isOnBanner !== undefined && Boolean(isOnBanner) && bannerCount >= MAX_BANNER) {
      throw new Error(`Đã đạt giới hạn tối đa ${MAX_BANNER} món trên Banner.`);
    }

    const validCategoryId = cat ? cat.id : undefined;

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
        ...(typeStockData && typeStockData),
      },
      include: { category: true },
    });

    memoryCache.invalidatePrefix("products:");
    memoryCache.invalidatePrefix("categories:");
    return updated;
  },

  // Xóa sản phẩm
  async deleteProduct(id: string) {
    const deleted = await prisma.product.delete({ where: { id } });
    memoryCache.invalidatePrefix("products:");
    memoryCache.invalidatePrefix("categories:");
    return deleted;
  },
};
