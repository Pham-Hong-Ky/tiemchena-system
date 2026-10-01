import { NextResponse } from "next/server";
import { tagService } from "@/services/tagService";
import { requireAdmin } from "@/lib/apiAuth";

export const tagController = {
  async get() {
    try {
      const tags = await tagService.getTags();
      return NextResponse.json({ success: true, data: tags });
    } catch (error) {
      console.error("TagController.get error:", error);
      return NextResponse.json({ success: false, error: "Không thể lấy danh sách thẻ" }, { status: 500 });
    }
  },

  async post(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      const newTag = await tagService.createTag(body);
      return NextResponse.json({ success: true, data: newTag });
    } catch (error: any) {
      console.error("TagController.post error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi tạo thẻ" }, { status: 400 });
    }
  },

  async put(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const body = await request.json();
      const { id, ...data } = body;
      const updated = await tagService.updateTag(id, data);
      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("TagController.put error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi cập nhật thẻ" }, { status: 400 });
    }
  },

  async delete(request: Request) {
    try {
      const authError = await requireAdmin();
      if (authError) return authError;

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ success: false, error: "Thiếu ID thẻ" }, { status: 400 });

      await tagService.deleteTag(id);
      return NextResponse.json({ success: true, message: "Đã xóa thẻ" });
    } catch (error: any) {
      console.error("TagController.delete error:", error);
      return NextResponse.json({ success: false, error: error.message || "Lỗi xóa thẻ" }, { status: 500 });
    }
  },
};
