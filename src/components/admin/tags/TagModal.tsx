"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Tag,
  Loader2,
  X,
  Flame,
  Star,
  Award,
  Heart,
  AlertCircle,
  Zap,
  Check,
  CheckCircle2,
  Utensils
} from "lucide-react";
import { TagType } from "@/types";
import { createTag, updateTag } from "@/lib/api";

export const COLOR_PRESETS = [
  { label: "Đỏ Rực (Hot)", badgeColor: "bg-red-500 text-white", textColor: "text-red-600" },
  { label: "Vàng Kim (Best Seller)", badgeColor: "bg-amber-500 text-white", textColor: "text-amber-600" },
  { label: "Xanh Lá (Đang Bán)", badgeColor: "bg-emerald-500 text-white", textColor: "text-emerald-600" },
  { label: "Tím Mộng Mơ (Mới)", badgeColor: "bg-purple-600 text-white", textColor: "text-purple-600" },
  { label: "Cam Đậm (Đặc Sản)", badgeColor: "bg-orange-600 text-white", textColor: "text-orange-600" },
  { label: "Xanh Dương (Combo)", badgeColor: "bg-blue-600 text-white", textColor: "text-blue-600" },
  { label: "Xám Đen (Tạm Hết)", badgeColor: "bg-slate-600 text-white", textColor: "text-slate-600" },
];

export const ICON_OPTIONS = ["Flame", "Star", "CheckCircle2", "Award", "Heart", "AlertCircle", "Zap", "Utensils"];

export function renderBadgeIcon(iconName: string) {
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

interface TagModalProps {
  isOpen: boolean;
  editingTag: TagType | null;
  totalTags: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function TagModal({
  isOpen,
  editingTag,
  totalTags,
  onClose,
  onSuccess,
}: TagModalProps) {
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingTag) {
      setFormName(editingTag.name);
      setFormCode(editingTag.code);
      setFormIcon(editingTag.icon || "Flame");
      setFormBadgeColor(editingTag.badgeColor || "bg-red-500 text-white");
      setFormTextColor(editingTag.textColor || "text-red-600");
      setFormDescription(editingTag.description || "");
      setFormSortOrder(String(editingTag.sortOrder));
      setFormIsActive(editingTag.isActive);
    } else {
      setFormName("");
      setFormCode("");
      setFormIcon("Flame");
      setFormBadgeColor("bg-red-500 text-white");
      setFormTextColor("text-red-600");
      setFormDescription("");
      setFormSortOrder(String(totalTags + 1));
      setFormIsActive(true);
    }
    setErrorMsg("");
  }, [editingTag, totalTags, isOpen]);

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
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi lưu thẻ");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      style={{ zIndex: 99999 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-slate-900">
            {editingTag ? "Chỉnh Sửa Nhãn Trạng Thái" : "Thêm Nhãn Mới"}
          </h2>
          <button
            onClick={onClose}
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
              onClick={onClose}
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
    </div>,
    document.body
  );
}
