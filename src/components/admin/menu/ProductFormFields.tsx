"use client";

import React, { useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Crop,
  Tag,
  Flame,
  Star,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { CategoryType, ProductType } from "@/types";
import { toast } from "@/context/ToastContext";

interface ProductFormFieldsProps {
  formName: string;
  setFormName: (val: string) => void;
  formPrice: string;
  setFormPrice: (val: string) => void;
  formOriginalPrice: string;
  setFormOriginalPrice: (val: string) => void;
  formCategoryId: string;
  setFormCategoryId: (val: string) => void;
  formDescription: string;
  setFormDescription: (val: string) => void;
  formImage: string;
  setFormImage: (val: string) => void;
  imageDimensions: { width: number; height: number } | null;
  setRawImageForCrop: (val: string) => void;
  setCropperOpen: (val: boolean) => void;
  formIsHot: boolean;
  setFormIsHot: (val: boolean) => void;
  formIsBestseller: boolean;
  setFormIsBestseller: (val: boolean) => void;
  formIsOnBanner: boolean;
  setFormIsOnBanner: (val: boolean) => void;
  formIsAvailable: boolean;
  setFormIsAvailable: (val: boolean) => void;
  categories: CategoryType[];
  allProducts: ProductType[];
  editingProduct: ProductType | null;
}

export function ProductFormFields({
  formName,
  setFormName,
  formPrice,
  setFormPrice,
  formOriginalPrice,
  setFormOriginalPrice,
  formCategoryId,
  setFormCategoryId,
  formDescription,
  setFormDescription,
  formImage,
  setFormImage,
  imageDimensions,
  setRawImageForCrop,
  setCropperOpen,
  formIsHot,
  setFormIsHot,
  formIsBestseller,
  setFormIsBestseller,
  formIsOnBanner,
  setFormIsOnBanner,
  formIsAvailable,
  setFormIsAvailable,
  categories,
  allProducts,
  editingProduct,
}: ProductFormFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhẹ hơn!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setRawImageForCrop(dataUrl);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      {/* 1. Basic Info */}
      <div className="space-y-3">
        <h4 className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-600">
          <span>1. Thông Tin Cơ Bản</span>
        </h4>

        <div className="space-y-1">
          <label className="font-bold text-slate-700">Tên món ăn *</label>
          <input
            type="text"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="VD: Chân Gà Sốt Thái Cóc Xoài"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Giá bán (VNĐ) *</label>
            <input
              type="number"
              required
              min={1000}
              max={500000}
              step={1000}
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="VD: 45000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Giá gốc gạch chân (Tùy chọn)</label>
            <input
              type="number"
              min={1000}
              max={500000}
              step={1000}
              value={formOriginalPrice}
              onChange={(e) => setFormOriginalPrice(e.target.value)}
              placeholder="VD: 55000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700">Danh mục món ăn *</label>
          <select
            value={formCategoryId}
            onChange={(e) => setFormCategoryId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700">Mô tả chi tiết món</label>
          <textarea
            rows={2}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Mô tả các thành phần hấp dẫn, vị sốt đậm đà cay ngọt..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white resize-none"
          />
        </div>
      </div>

      {/* 2. Image Upload */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h4 className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-600">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>2. Hình Ảnh Món Ăn </span>
        </h4>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={formImage}
            onChange={(e) => setFormImage(e.target.value)}
            placeholder="Dán link ảnh hoặc tải ảnh từ máy tính..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải ảnh lên</span>
          </button>
        </div>

        {formImage && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            <img src={formImage} alt="Thumbnail" className="w-12 h-9 object-cover rounded-lg border border-slate-200" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-700 truncate">Ảnh đã tải lên</p>
              {imageDimensions && (
                <p className="text-[10px] text-slate-400 font-mono">
                  {imageDimensions.width} × {imageDimensions.height} px
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setRawImageForCrop(formImage);
                setCropperOpen(true);
              }}
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer text-[11px] font-bold flex items-center gap-1"
            >
              <Crop className="w-3 h-3 text-orange-600" />
              <span>Cắt lại</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Marketing Badges (HOT, BESTSELLER, BANNER) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-700 block text-xs">
          Nhãn
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Tag HOT */}
          <div
            onClick={() => setFormIsHot(!formIsHot)}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none ${
              formIsHot
                ? "bg-red-50/90 border-red-300 ring-1 ring-red-400"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                  formIsHot
                    ? "bg-red-500 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Flame className="w-3 h-3 fill-current" />
                <span>HOT</span>
              </span>
              <span className="text-xs font-bold text-slate-800">Món Hot</span>
            </div>
            <input
              type="checkbox"
              checked={formIsHot}
              onChange={(e) => setFormIsHot(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer pointer-events-none"
            />
          </div>

          {/* Tag BESTSELLER */}
          <div
            onClick={() => setFormIsBestseller(!formIsBestseller)}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none ${
              formIsBestseller
                ? "bg-amber-50/90 border-amber-300 ring-1 ring-amber-400"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                  formIsBestseller
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                <span>BEST</span>
              </span>
              <span className="text-xs font-bold text-slate-800">Bán Chạy</span>
            </div>
            <input
              type="checkbox"
              checked={formIsBestseller}
              onChange={(e) => setFormIsBestseller(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer pointer-events-none"
            />
          </div>

          {/* Tag BANNER */}
          <div
            onClick={() => {
              const nextVal = !formIsOnBanner;
              const MAX_BANNER = 8;
              const otherBannerCount = allProducts.filter(
                (p) => p.isOnBanner && (!editingProduct || p.id !== editingProduct.id)
              ).length;
              if (nextVal && otherBannerCount >= MAX_BANNER) {
                toast.warning(
                  `Đã có tối đa ${MAX_BANNER} món được ghim trên Banner trang chủ. Vui lòng bỏ bớt món trước!`
                );
                return;
              }
              setFormIsOnBanner(nextVal);
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none ${
              formIsOnBanner
                ? "bg-purple-50/90 border-purple-300 ring-1 ring-purple-400"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                  formIsOnBanner
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Sparkles className="w-3 h-3 fill-current" />
                <span>BANNER</span>
              </span>
              <span className="text-xs font-bold text-slate-800">Ghim Banner</span>
            </div>
            <input
              type="checkbox"
              checked={formIsOnBanner}
              onChange={(e) => {
                const MAX_BANNER = 8;
                const otherBannerCount = allProducts.filter(
                  (p) => p.isOnBanner && (!editingProduct || p.id !== editingProduct.id)
                ).length;
                if (e.target.checked && otherBannerCount >= MAX_BANNER) {
                  toast.warning(
                    `Đã có tối đa ${MAX_BANNER} món được ghim trên Banner trang chủ. Vui lòng bỏ bớt món trước!`
                  );
                  return;
                }
                setFormIsOnBanner(e.target.checked);
              }}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Availability Status (Đang Mở Bán / Hết Hàng) */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-700 block text-xs">
          Trạng Thái Mở Bán *
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* Status: Available */}
          <button
            type="button"
            onClick={() => setFormIsAvailable(true)}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition text-left cursor-pointer ${
              formIsAvailable
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500 text-emerald-900 shadow-xs"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 opacity-60"
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${formIsAvailable ? "text-emerald-600" : "text-slate-400"}`} />
            <div>
              <p className="text-xs font-black">Đang Mở Bán</p>
              <p className="text-[10px] text-slate-500">Khách có thể đặt món</p>
            </div>
          </button>

          {/* Status: Out of Stock */}
          <button
            type="button"
            onClick={() => setFormIsAvailable(false)}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition text-left cursor-pointer ${
              !formIsAvailable
                ? "bg-red-50 border-red-300 ring-2 ring-red-500 text-red-900 shadow-xs"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 opacity-60"
            }`}
          >
            <XCircle className={`w-5 h-5 shrink-0 ${!formIsAvailable ? "text-red-600" : "text-slate-400"}`} />
            <div>
              <p className="text-xs font-black">Tạm Hết Hàng</p>
              <p className="text-[10px] text-slate-500">Khóa đặt, gắn nhãn Hết hàng</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
