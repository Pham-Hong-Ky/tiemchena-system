import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";

    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: categories },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("GET categories error:", error);
    return NextResponse.json({ success: false, error: "Không thể lấy danh mục" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { name, icon, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Tên danh mục là bắt buộc" }, { status: 400 });
    }

    const slug =
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-") +
      "-" +
      Date.now();

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon: icon || "Utensils",
        sortOrder: sortOrder ? parseInt(String(sortOrder)) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("POST categories error:", error);
    return NextResponse.json({ success: false, error: "Không thể tạo danh mục" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { id, name, icon, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID danh mục" }, { status: 400 });
    }

    const updateData: { name?: string; icon?: string; sortOrder?: number; isActive?: boolean } = {};
    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(String(sortOrder));
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("PUT categories error:", error);
    return NextResponse.json({ success: false, error: "Không thể cập nhật danh mục" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID danh mục" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa danh mục thành công" });
  } catch (error) {
    console.error("DELETE categories error:", error);
    return NextResponse.json({ success: false, error: "Không thể xóa danh mục" }, { status: 500 });
  }
}
