"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Flame
} from "lucide-react";
import { TagType } from "@/types";
import { getTags, updateTag, deleteTag } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/context/ToastContext";
import { TagModal, renderBadgeIcon } from "@/components/admin/tags/TagModal";

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Deletion state
  const [deletingTag, setDeletingTag] = useState<TagType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getTags();
      setTags(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingTag(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tag: TagType) => {
    setEditingTag(tag);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (tag: TagType) => {
    try {
      await updateTag({
        id: tag.id,
        isActive: !tag.isActive,
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteTag = async () => {
    if (!deletingTag) return;
    setIsDeleting(true);
    try {
      await deleteTag(deletingTag.id);
      toast.success(`Đã xóa nhãn "${deletingTag.name}" thành công`);
      loadData();
    } catch {
      toast.error("Không thể xóa thẻ");
    } finally {
      setIsDeleting(false);
      setDeletingTag(null);
    }
  };

  const filteredTags = useMemo(() => {
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  const totalPages = Math.ceil(filteredTags.length / pageSize) || 1;
  const paginatedTags = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTags.slice(start, start + pageSize);
  }, [filteredTags, currentPage]);

  const activeCount = tags.filter((t) => t.isActive).length;
  const totalApplied = tags.reduce((sum, t) => sum + (t.appliedCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Tag className="w-7 h-7 text-orange-600" />
            <span>Quản Lý Nhãn Trạng Thái & Thẻ Món Ăn (Tags & Badges)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các nhãn nhận diện món ăn như <strong>Món Hot</strong>, <strong>Best Seller</strong>, <strong>Đang Mở Bán</strong>, <strong>Món Mới</strong>, <strong>Tạm Hết Hàng</strong>...
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold px-5 py-3 rounded-xl shadow-md shadow-orange-600/20 transition active:scale-95 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhãn Mới</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tổng Số Nhãn / Thẻ</p>
            <p className="text-2xl font-black text-slate-900">{tags.length} nhãn</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Đang Kích Hoạt</p>
            <p className="text-2xl font-black text-emerald-600">{activeCount} nhãn</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Số Món Ăn Đang Gắn Nhãn</p>
            <p className="text-2xl font-black text-slate-900">{totalApplied} lượt món</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên nhãn, mã code, mô tả..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            Tìm thấy {filteredTags.length} nhãn
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : paginatedTags.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Chưa có nhãn nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Thứ Tự</th>
                  <th className="py-3.5 px-4">Giao Diện Nhãn (Preview)</th>
                  <th className="py-3.5 px-4">Mã Nhãn (Code)</th>
                  <th className="py-3.5 px-4">Ý Nghĩa & Mô Tả</th>
                  <th className="py-3.5 px-4">Món Đang Gắn</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 inline-flex items-center justify-center text-slate-600 font-extrabold">
                        {tag.sortOrder}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 ${tag.badgeColor} px-3 py-1 rounded-full font-black text-xs shadow-xs tracking-wide uppercase`}
                      >
                        {renderBadgeIcon(tag.icon)}
                        <span>{tag.name}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-xs">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {tag.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">{tag.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-orange-50 text-orange-700 border border-orange-200/60 px-2.5 py-1 rounded-full font-bold text-xs">
                        {tag.appliedCount || 0} món
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(tag)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition ${
                          tag.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {tag.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đang Bật</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Đã Tắt</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(tag)}
                          className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                          title="Sửa nhãn"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTag(tag)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Xóa nhãn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reusable Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredTags.length}
          pageSize={pageSize}
        />
      </div>

      {/* Modal Create / Edit Tag Component */}
      <TagModal
        isOpen={isModalOpen}
        editingTag={editingTag}
        totalTags={tags.length}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Confirm Delete Tag Modal */}
      <ConfirmModal
        isOpen={!!deletingTag}
        title="Xác nhận xóa nhãn (tag)"
        message={`Bạn có chắc chắn muốn xóa nhãn "${deletingTag?.name || ""}"? Nhãn này sẽ bị gỡ khỏi tất cả món ăn đang được gắn.`}
        confirmText="Xóa nhãn"
        isLoading={isDeleting}
        onConfirm={confirmDeleteTag}
        onClose={() => setDeletingTag(null)}
      />
    </div>
  );
}
