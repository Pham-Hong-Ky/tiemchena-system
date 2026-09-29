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
  Loader2,
  X,
  Flame,
  Star,
  Award,
  Heart,
  AlertCircle,
  Zap,
  Check,
  Utensils
} from "lucide-react";
import { TagType } from "@/types";
import { getTags, createTag, updateTag, deleteTag } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "@/context/ToastContext";

const COLOR_PRESETS = [
  { label: "Đỏ Rực (Hot)", badgeColor: "bg-red-500 text-white", textColor: "text-red-600" },
  { label: "Vàng Kim (Best Seller)", badgeColor: "bg-amber-500 text-white", textColor: "text-amber-600" },
  { label: "Xanh Lá (Đang Bán)", badgeColor: "bg-emerald-500 text-white", textColor: "text-emerald-600" },
  { label: "Tím Mộng Mơ (Mới)", badgeColor: "bg-purple-600 text-white", textColor: "text-purple-600" },
  { label: "Cam Đậm (Đặc Sản)", badgeColor: "bg-orange-600 text-white", textColor: "text-orange-600" },
  { label: "Xanh Dương (Combo)", badgeColor: "bg-blue-600 text-white", textColor: "text-blue-600" },
  { label: "Xám Đen (Tạm Hết)", badgeColor: "bg-slate-600 text-white", textColor: "text-slate-600" },
];

const ICON_OPTIONS = ["Flame", "Star", "CheckCircle2", "Award", "Heart", "AlertCircle", "Zap", "Utensils"];

function renderBadgeIcon(iconName: string) {
  switch (iconName) {
    case "Flame":
      return <Flame className="w-3.5 h-3.5 fill-current" />;
    case "Star":
      return <Star className="w-3.5 h-3.5 fill-current" />;
    case "CheckCircle2":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "Award":
      return <Award className="w-3.5 h-3.5" />;
    case "Heart":
      return <Heart className="w-3.5 h-3.5 fill-current" />;
    case "AlertCircle":
      return <AlertCircle className="w-3.5 h-3.5" />;
    case "Zap":
      return <Zap className="w-3.5 h-3.5 fill-current" />;
    default:
      return <Tag className="w-3.5 h-3.5" />;
  }
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formIcon, setFormIcon] = useState("Flame");
  const [formBadgeColor, setFormBadgeColor] = useState("bg-red-500 text-white");
  const [formTextColor, setFormTextColor] = useState("text-red-600");
  const [formDescription, setFormDescription] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("1");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    setFormName("");
    setFormCode("");
    setFormIcon("Flame");
    setFormBadgeColor("bg-red-500 text-white");
    setFormTextColor("text-red-600");
    setFormDescription("");
    setFormSortOrder(String(tags.length + 1));
    setFormIsActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (tag: TagType) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormCode(tag.code);
    setFormIcon(tag.icon || "Flame");
    setFormBadgeColor(tag.badgeColor || "bg-red-500 text-white");
    setFormTextColor(tag.textColor || "text-red-600");
    setFormDescription(tag.description || "");
    setFormSortOrder(String(tag.sortOrder));
    setFormIsActive(tag.isActive);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ tên thẻ và mã thẻ");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    try {
      if (editingTag) {
        await updateTag({
          id: editingTag.id,
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          icon: formIcon,
          badgeColor: formBadgeColor,
          textColor: formTextColor,
          description: formDescription.trim(),
          sortOrder: parseInt(formSortOrder) || 0,
          isActive: formIsActive,
        });
      } else {
        await createTag({
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          icon: formIcon,
          badgeColor: formBadgeColor,
          textColor: formTextColor,
          description: formDescription.trim(),
          sortOrder: parseInt(formSortOrder) || 0,
          isActive: formIsActive,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi lưu thẻ");
    } finally {
      setIsSaving(false);
    }
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

  const handleDelete = async (tag: TagType) => {
    try {
      await deleteTag(tag.id);
      toast.success(`Đã xóa nhãn "${tag.name}" thành công`);
      loadData();
    } catch (err) {
      toast.error("Không thể xóa thẻ");
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
                          onClick={() => handleDelete(tag)}
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

      {/* Modal Create / Edit Tag */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                {editingTag ? "Chỉnh Sửa Nhãn Trạng Thái" : "Thêm Nhãn Mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Nhãn Hiển Thị *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Món Hot Đang Sốt, Bán Chạy Nhất, Đang Mở Bán..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mã Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="VD: HOT, BESTSELLER, NEW..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Thứ Tự Ưu Tiên
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Màu Sắc Nhãn
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_PRESETS.map((c) => {
                    const isSelected = formBadgeColor === c.badgeColor;
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => {
                          setFormBadgeColor(c.badgeColor);
                          setFormTextColor(c.textColor);
                        }}
                        className={`p-2 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${c.badgeColor}`}>
                          {c.label.split(" ")[0]}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Biểu Tượng (Icon)
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {ICON_OPTIONS.map((ico) => {
                    const isSelected = formIcon === ico;
                    return (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setFormIcon(ico)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        title={ico}
                      >
                        {renderBadgeIcon(ico)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mô Tả Nhãn
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả công dụng và ý nghĩa của nhãn..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Kích hoạt áp dụng nhãn này trong hệ thống
                  </span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/25 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu Nhãn Trạng Thái</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
