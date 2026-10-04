import { NextResponse } from "next/server";
import { productService } from "@/services/productService";
import { requireAdmin } from "@/lib/apiAuth";

export const productController = {
  async get(request: Request, id?: string) {
    try {
      if (id) {
        const product = await productService.getProductById(id);
        if (!product) {
          return NextResponse.json({ success: false, error: "Không tìm thấy món ăn" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: product });
      }

      const { searchParams } = new URL(request.url);
      const categoryId = searchParams.get("categoryId");
      const search = searchParams.get("search");

      const data = await productService.getProducts({ categoryId, search });
      return NextResponse.json(
        { success: true, data },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
    } catch (error) {
      console.error("ProductController.get error:", error);
      return NextResponse.json({ success: false, error: "Không thể lấy thông tin món ăn" }, { status: 500 });
    }
  },

  async post(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      const product = await productService.createProduct(body);
      return NextResponse.json({ success: true, data: product });
    } catch (error: any) {
      console.error("ProductController.post error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi tạo món ăn" }, { status: 400 });
    }
  },

  async put(request: Request, id: string) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      const updated = await productService.updateProduct(id, body);
      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("ProductController.put error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi cập nhật món ăn" }, { status: 400 });
    }
  },

  async delete(_request: Request, id: string) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      await productService.deleteProduct(id);
      return NextResponse.json({ success: true, message: "Đã xóa món ăn thành công" });
    } catch (error) {
      console.error("ProductController.delete error:", error);
      return NextResponse.json({ success: false, error: "Không thể xóa món ăn" }, { status: 500 });
    }
  },
};
