import { NextResponse } from "next/server";
import { categoryService } from "@/services/categoryService";
import { requireAdmin } from "@/lib/apiAuth";

export const categoryController = {
  async get(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get("all") === "true";

      const categories = await categoryService.getCategories(includeInactive);
      return NextResponse.json(
        { success: true, data: categories },
        {
          headers: {
            "Cache-Control": "public, s-maxage=15, stale-while-revalidate=59",
          },
        }
      );
    } catch (error) {
      console.error("CategoryController.get error:", error);
      return NextResponse.json({ success: false, error: "Không thể lấy danh mục" }, { status: 500 });
    }
  },

  async post(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      const category = await categoryService.createCategory(body);
      return NextResponse.json({ success: true, data: category });
    } catch (error: any) {
      console.error("CategoryController.post error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi tạo danh mục" }, { status: 400 });
    }
  },

  async put(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      const { id, ...data } = body;
      const category = await categoryService.updateCategory(id, data);
      return NextResponse.json({ success: true, data: category });
    } catch (error: any) {
      console.error("CategoryController.put error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi cập nhật danh mục" }, { status: 400 });
    }
  },

  async delete(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      if (!id) {
        return NextResponse.json({ success: false, error: "Thiếu ID danh mục" }, { status: 400 });
      }

      await categoryService.deleteCategory(id);
      return NextResponse.json({ success: true, message: "Đã xóa danh mục" });
    } catch (error: any) {
      console.error("CategoryController.delete error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi xóa danh mục" }, { status: 500 });
    }
  },
};
