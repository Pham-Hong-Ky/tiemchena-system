import { ProductType, CategoryType } from "@/types";

export type MenuSectionKey = "all" | "an-vat" | "che" | "do-uong";

export interface MenuSectionMeta {
  key: MenuSectionKey;
  label: string;
  shortLabel: string;
  href: string;
  title: string;
  subtitle: string;
  accentColor: string;
  badgeBg: string;
  bannerResetMessage?: string;
  suggestedBannerKeywords?: string[];
}

export const MENU_SECTIONS: MenuSectionMeta[] = [
  {
    key: "all",
    label: "Tất Cả Món Ăn",
    shortLabel: "Tất Cả",
    href: "/admin/menu",
    title: "Quản Lý Toàn Bộ Thực Đơn",
    subtitle: "Tổng hợp tất cả món ăn, đồ ăn vặt, chè và đồ uống của Tiệm Chè Na",
    accentColor: "from-slate-800 to-slate-900",
    badgeBg: "bg-slate-900 text-white",
    suggestedBannerKeywords: [
      "Nem Nướng",
      "Chân Gà Sốt Thái",
      "Chè Dừa Dầm",
      "Mỳ Cay",
      "Trà Sữa",
    ],
  },
  {
    key: "an-vat",
    label: "Quản Lý Đồ Ăn Vặt",
    shortLabel: "Đồ Ăn Vặt",
    href: "/admin/menu/an-vat",
    title: "Quản Lý Món Ăn Vặt & Mẹt",
    subtitle: "Chuyên Chân gà sốt Thái, Nem nướng Nha Trang, Mỳ cay, Phở cuốn, Bánh mì chảo, Đồ chiên...",
    accentColor: "from-orange-600 to-amber-500",
    badgeBg: "bg-orange-600 text-white",
    suggestedBannerKeywords: [
      "Nem Nướng",
      "Chân Gà Sốt Thái",
      "Mẹt Nem Lụi Huế",
      "Mỳ Cay",
      "Bánh Mỳ Chảo",
    ],
  },
  {
    key: "che",
    label: "Quản Lý Món Chè",
    shortLabel: "Món Chè",
    href: "/admin/menu/che",
    title: "Quản Lý Chè & Tráng Miệng",
    subtitle: "Chè bưởi, Chè dừa dầm, Chè xoài, Tào phớ, Caramen, Sữa chua mít, Bơ già dừa non...",
    accentColor: "from-pink-600 to-rose-500",
    badgeBg: "bg-pink-600 text-white",
    suggestedBannerKeywords: [
      "Chè Dừa Dầm",
      "Chè Bưởi",
      "Chè Xoài",
      "Sữa Chua Mít",
      "Tào Phớ Caramen",
    ],
  },
  {
    key: "do-uong",
    label: "Quản Lý Đồ Uống",
    shortLabel: "Đồ Uống",
    href: "/admin/menu/do-uong",
    title: "Quản Lý Đồ Uống & Trà Sữa",
    subtitle: "Hồng trà sữa, Trà matcha, Nước ép hoa quả tươi nguyên chất, Trà chanh đá tay, Trà đào...",
    accentColor: "from-sky-600 to-cyan-500",
    badgeBg: "bg-sky-600 text-white",
    suggestedBannerKeywords: [
      "Trà Sữa Trân Châu",
      "Hồng Trà Sữa",
      "Nước Ép Dưa Hấu",
      "Trà Chanh Đá Tay",
      "Trà Đào",
    ],
  },
];

/**
 * Classify a product into one of the 3 primary food groups: 'an-vat' | 'che' | 'do-uong'
 */
export function getProductSectionGroup(
  product: ProductType,
  categories?: CategoryType[]
): "an-vat" | "che" | "do-uong" {
  const cat = categories?.find((c) => c.id === product.categoryId) || product.category;
  const catSlug = (cat?.slug || "").toLowerCase();
  const catName = (cat?.name || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  // 1. Check Đồ Ăn Vặt first
  if (
    catSlug === "chan-ga" ||
    catSlug === "an-vat-met" ||
    catSlug === "an-vat" ||
    catSlug === "do-an" ||
    catName.includes("ăn vặt") ||
    catName.includes("mẹt") ||
    catName.includes("chân gà") ||
    name.includes("chân gà") ||
    name.includes("nem") ||
    name.includes("mỳ") ||
    name.includes("bánh mỳ") ||
    name.includes("bánh mì") ||
    name.includes("kimbap") ||
    name.includes("gà rán") ||
    name.includes("gà viên") ||
    name.includes("khoai tây") ||
    name.includes("phô mai que") ||
    name.includes("lạp xưởng") ||
    name.includes("xúc xích") ||
    name.includes("viên chiên") ||
    name.includes("phở cuốn") ||
    name.includes("bún thêm") ||
    name.includes("mỳ trộn") ||
    name.includes("gà chiên") ||
    name.includes("cánh gà")
  ) {
    return "an-vat";
  }

  // 2. Check Đồ Uống
  if (
    catSlug === "do-uong" ||
    catSlug === "tra-sua" ||
    catSlug === "nuoc-ep" ||
    catSlug === "nuoc-uong" ||
    catSlug === "giai-khat" ||
    catName.includes("đồ uống") ||
    catName.includes("trà sữa") ||
    catName.includes("nước ép") ||
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
    name.includes("bia") ||
    name.includes("nha đam")
  ) {
    return "do-uong";
  }

  // 3. Default to Chè & Tráng Miệng
  return "che";
}

/**
 * Filter product list according to the active menu section
 */
export function filterProductsBySection(
  products: ProductType[],
  section: MenuSectionKey,
  categories?: CategoryType[]
): ProductType[] {
  if (section === "all") return products;
  return products.filter((p) => getProductSectionGroup(p, categories) === section);
}

/**
 * Filter categories applicable for the given section
 */
export function getSectionCategories(
  section: MenuSectionKey,
  categories: CategoryType[]
): CategoryType[] {
  if (section === "all") return categories;

  return categories.filter((c) => {
    const slug = c.slug.toLowerCase();
    const name = c.name.toLowerCase();

    if (section === "an-vat") {
      return (
        slug === "chan-ga" ||
        slug === "an-vat-met" ||
        slug === "an-vat" ||
        name.includes("ăn vặt") ||
        name.includes("mẹt") ||
        name.includes("chân gà") ||
        name.includes("đồ ăn")
      );
    }
    if (section === "che") {
      return (
        slug === "che" ||
        slug === "che-trang-mieng" ||
        name.includes("chè") ||
        name.includes("tráng miệng") ||
        name.includes("caramen") ||
        name.includes("sữa chua")
      );
    }
    if (section === "do-uong") {
      return (
        slug === "do-uong" ||
        slug === "tra-sua" ||
        slug === "nuoc-ep" ||
        name.includes("đồ uống") ||
        name.includes("trà sữa") ||
        name.includes("nước ép")
      );
    }
    return true;
  });
}

/**
 * Get default category ID when creating a new product from a section page
 */
export function getDefaultCategoryIdForSection(
  section: MenuSectionKey,
  categories: CategoryType[]
): string {
  const matched = getSectionCategories(section, categories);
  if (matched.length > 0) {
    return matched[0].id;
  }
  return categories[0]?.id || "";
}
