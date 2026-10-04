import { prisma } from "@/lib/prisma";
import { TagType } from "@/types";

let badgesStore: TagType[] = [
  {
    id: "tag-hot",
    code: "HOT",
    name: "Món Hot Đang Sốt",
    icon: "Flame",
    badgeColor: "bg-red-500 text-white",
    textColor: "text-red-600",
    description: "Gắn nhãn món ăn được tìm kiếm và gọi nhiều nhất tại quán",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "tag-bestseller",
    code: "BESTSELLER",
    name: "Bán Chạy Nhất (Best Seller)",
    icon: "Star",
    badgeColor: "bg-amber-500 text-white",
    textColor: "text-amber-600",
    description: "Nhãn vinh danh các món ăn đạt lượng tiêu thụ kỷ lục",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "tag-available",
    code: "AVAILABLE",
    name: "Đang Mở Bán",
    icon: "CheckCircle2",
    badgeColor: "bg-emerald-500 text-white",
    textColor: "text-emerald-600",
    description: "Trạng thái sẵn sàng phục vụ thực khách tại quán và giao hàng",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "tag-new",
    code: "NEW",
    name: "Món Mới Ra Lò",
    icon: "Award",
    badgeColor: "bg-purple-600 text-white",
    textColor: "text-purple-600",
    description: "Nhãn dành cho các món ăn và thức uống mới cập nhật trong thực đơn",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "tag-signature",
    code: "SIGNATURE",
    name: "Đặc Sản Quán",
    icon: "Heart",
    badgeColor: "bg-orange-600 text-white",
    textColor: "text-orange-600",
    description: "Món gia truyền mang hương vị độc quyền làm nên thương hiệu",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "tag-out-of-stock",
    code: "OUT_OF_STOCK",
    name: "Hết Hàng",
    icon: "AlertCircle",
    badgeColor: "bg-red-500 text-white",
    textColor: "text-red-600",
    description: "Nhãn hết hàng - Món ăn sẽ hiển thị nhãn Hết hàng và khóa không cho khách đặt món",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "tag-promo",
    code: "PROMO",
    name: "Combo Tiết Kiệm",
    icon: "Zap",
    badgeColor: "bg-blue-600 text-white",
    textColor: "text-blue-600",
    description: "Ưu đãi giá tốt khi mua theo set hoặc combo nhiều món",
    sortOrder: 7,
    isActive: true,
  },
];

export const tagService = {
  async getTags() {
    const [hotCount, bestsellerCount, availableCount, totalProducts] = await Promise.all([
      prisma.product.count({ where: { isHot: true } }),
      prisma.product.count({ where: { isBestseller: true } }),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.product.count(),
    ]);

    return badgesStore.map((b) => {
      let appliedCount = 0;
      if (b.code === "HOT") appliedCount = hotCount;
      else if (b.code === "BESTSELLER") appliedCount = bestsellerCount;
      else if (b.code === "AVAILABLE") appliedCount = availableCount;
      else if (b.code === "OUT_OF_STOCK") appliedCount = Math.max(0, totalProducts - availableCount);
      return { ...b, appliedCount };
    });
  },

  async createTag(data: Partial<TagType>) {
    if (!data.name || !data.code) throw new Error("Tên nhãn và mã thẻ là bắt buộc");

    const newTag: TagType = {
      id: "tag-" + Date.now(),
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      icon: data.icon || "Flame",
      badgeColor: data.badgeColor || "bg-orange-500 text-white",
      textColor: data.textColor || "text-orange-600",
      description: data.description || "",
      sortOrder: data.sortOrder ? parseInt(String(data.sortOrder)) : badgesStore.length + 1,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      appliedCount: 0,
    };

    badgesStore.push(newTag);
    return newTag;
  },

  async updateTag(id: string, data: Partial<TagType>) {
    const idx = badgesStore.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Không tìm thấy thẻ nhãn");

    badgesStore[idx] = {
      ...badgesStore[idx],
      ...data,
      id,
    };
    return badgesStore[idx];
  },

  async deleteTag(id: string) {
    badgesStore = badgesStore.filter((t) => t.id !== id);
    return true;
  },
};
