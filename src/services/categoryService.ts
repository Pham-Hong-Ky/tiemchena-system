import { prisma } from "@/lib/prisma";

export const categoryService = {
  async getCategories(includeInactive: boolean = false) {
    return prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  async createCategory(data: { name: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    if (!data.name) throw new Error("Tên danh mục là bắt buộc");

    const slug =
      data.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-") +
      "-" +
      Date.now();

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        icon: data.icon || "Utensils",
        sortOrder: data.sortOrder ? parseInt(String(data.sortOrder)) : 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  async updateCategory(id: string, data: { name?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    if (!id) throw new Error("Thiếu ID danh mục");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.sortOrder !== undefined) updateData.sortOrder = parseInt(String(data.sortOrder));
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    return prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  async deleteCategory(id: string) {
    if (!id) throw new Error("Thiếu ID danh mục");
    return prisma.category.delete({ where: { id } });
  },
};
