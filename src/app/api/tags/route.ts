import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TagType } from "@/types";
import { requireAdmin } from "@/lib/apiAuth";

// Default system badges
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
    name: "Tạm Hết Hàng",
    icon: "AlertCircle",
    badgeColor: "bg-slate-500 text-white",
    textColor: "text-slate-500",
    description: "Tạm ngưng phục vụ do hết nguyên liệu tươi trong ngày",
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

export async function GET() {
  try {
    // Count how many products have isHot, isBestseller, isAvailable
    const [hotCount, bestsellerCount, availableCount, totalProducts] = await Promise.all([
      prisma.product.count({ where: { isHot: true } }),
      prisma.product.count({ where: { isBestseller: true } }),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.product.count(),
    ]);

    const result = badgesStore.map((b) => {
      let appliedCount = 0;
      if (b.code === "HOT") appliedCount = hotCount;
      else if (b.code === "BESTSELLER") appliedCount = bestsellerCount;
      else if (b.code === "AVAILABLE") appliedCount = availableCount;
      else if (b.code === "OUT_OF_STOCK") appliedCount = totalProducts - availableCount;
      else if (b.code === "SIGNATURE") appliedCount = 2;
      else if (b.code === "NEW") appliedCount = 1;
      else appliedCount = 0;

      return {
        ...b,
        appliedCount,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET tags error:", error);
    return NextResponse.json({ success: false, error: "Không thể lấy danh sách thẻ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { code, name, icon, badgeColor, textColor, description, sortOrder, isActive } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: "Tên nhãn và mã thẻ là bắt buộc" }, { status: 400 });
    }

    const newTag: TagType = {
      id: "tag-" + Date.now(),
      code: code.toUpperCase().trim(),
      name: name.trim(),
      icon: icon || "Flame",
      badgeColor: badgeColor || "bg-orange-500 text-white",
      textColor: textColor || "text-orange-600",
      description: description || "",
      sortOrder: sortOrder ? parseInt(String(sortOrder)) : badgesStore.length + 1,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      appliedCount: 0,
    };

    badgesStore.push(newTag);
    return NextResponse.json({ success: true, data: newTag });
  } catch (error) {
    console.error("POST tags error:", error);
    return NextResponse.json({ success: false, error: "Không thể tạo thẻ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { id, code, name, icon, badgeColor, textColor, description, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID thẻ" }, { status: 400 });
    }

    const idx = badgesStore.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy thẻ" }, { status: 404 });
    }

    badgesStore[idx] = {
      ...badgesStore[idx],
      code: code !== undefined ? code.toUpperCase().trim() : badgesStore[idx].code,
      name: name !== undefined ? name.trim() : badgesStore[idx].name,
      icon: icon !== undefined ? icon.trim() : badgesStore[idx].icon,
      badgeColor: badgeColor !== undefined ? badgeColor : badgesStore[idx].badgeColor,
      textColor: textColor !== undefined ? textColor : badgesStore[idx].textColor,
      description: description !== undefined ? description : badgesStore[idx].description,
      sortOrder: sortOrder !== undefined ? parseInt(String(sortOrder)) : badgesStore[idx].sortOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : badgesStore[idx].isActive,
    };

    return NextResponse.json({ success: true, data: badgesStore[idx] });
  } catch (error) {
    console.error("PUT tags error:", error);
    return NextResponse.json({ success: false, error: "Không thể cập nhật thẻ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID thẻ" }, { status: 400 });
    }

    badgesStore = badgesStore.filter((t) => t.id !== id);
    return NextResponse.json({ success: true, message: "Đã xóa thẻ thành công" });
  } catch (error) {
    console.error("DELETE tags error:", error);
    return NextResponse.json({ success: false, error: "Không thể xóa thẻ" }, { status: 500 });
  }
}
