"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Loader2,
  X,
  Upload,
  Image as ImageIcon,
  Flame,
  SlidersHorizontal,
  Eye,
  UtensilsCrossed,
  Crop,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ProductType, CategoryType, ProductOptionType, ToppingType } from "@/types";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { toast } from "@/context/ToastContext";

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: ProductType | null;
  categories: CategoryType[];
  toppings: ToppingType[];
  allProducts: ProductType[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductModal({
  isOpen,
  editingProduct,
  categories,
  toppings,
  allProducts,
  onClose,
  onSaved,
}: ProductModalProps) {
  const [mounted, setMounted] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formIsHot, setFormIsHot] = useState(false);
  const [formIsBestseller, setFormIsBestseller] = useState(false);
  const [formIsOnBanner, setFormIsOnBanner] = useState(false);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Image Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState("");

  // Options / Toppings State
  const [formOptions, setFormOptions] = useState<ProductOptionType[]>([]);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setFormName(editingProduct.name);
      setFormPrice(editingProduct.price.toString());
      setFormOriginalPrice(editingProduct.originalPrice ? editingProduct.originalPrice.toString() : "");
      setFormCategoryId(editingProduct.categoryId);
      setFormDescription(editingProduct.description || "");
      setFormImage(editingProduct.image || "");
      setFormIsHot(Boolean(editingProduct.isHot));
      setFormIsBestseller(Boolean(editingProduct.isBestseller));
      setFormIsOnBanner(Boolean(editingProduct.isOnBanner));
      setFormIsAvailable(Boolean(editingProduct.isAvailable));

      const parsedOpts: ProductOptionType[] = [];
      if (editingProduct.toppingsJson) {
        try {
          const parsed = typeof editingProduct.toppingsJson === "string"
            ? JSON.parse(editingProduct.toppingsJson)
            : editingProduct.toppingsJson;
          if (Array.isArray(parsed)) {
            const toppingMap = new Map((toppings || []).map((t) => [t.id, t]));
            parsed.forEach((item: any, idx: number) => {
              if (typeof item === "string") {
                const found = toppingMap.get(item);
                if (found) {
                  parsedOpts.push({
                    id: found.id,
                    name: found.name,
                    price: found.price,
                  });
                }
              } else if (item && typeof item === "object" && item.name) {
                parsedOpts.push({
                  id: item.id || `opt-${idx}-${String(item.name).toLowerCase().replace(/[^a-z0-9]/g, "")}`,
                  name: item.name,
                  price: Number(item.price) || 0,
                });
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse toppingsJson", e);
        }
      }
      setFormOptions(parsedOpts);
    } else {
      setFormName("");
      setFormPrice("");
      setFormOriginalPrice("");
      setFormCategoryId(categories[0]?.id || "");
      setFormDescription("");
      setFormImage("");
      setFormIsHot(false);
      setFormIsBestseller(false);
      setFormIsOnBanner(false);
      setFormIsAvailable(true);
      setFormOptions([]);
    }

    setNewOptionName("");
    setNewOptionPrice("");
  }, [isOpen, editingProduct, categories, toppings]);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.warning("Kích thước file ảnh không được vượt quá 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRawImageForCrop(reader.result);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCropperForCurrent = () => {
    if (!formImage) return;
    setRawImageForCrop(formImage);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedUrl: string) => {
    setFormImage(croppedUrl);
    setCropperOpen(false);
  };

  const handleAddOption = () => {
    if (!newOptionName.trim()) {
      toast.warning("Vui lòng nhập tên tùy chọn (option)");
      return;
    }
    const priceNum = newOptionPrice.trim() === "" ? 0 : parseFloat(newOptionPrice);
    if (isNaN(priceNum)) {
      toast.warning("Giá tùy chọn không hợp lệ");
      return;
    }
    if (priceNum !== 0 && (priceNum < 1000 || priceNum > 500000)) {
      toast.warning("Giá phụ thu tùy chọn phải bằng 0đ (miễn phí) hoặc từ 1.000đ đến 500.000đ");
      return;
    }
    setFormOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}-${newOptionName.trim().replace(/\s+/g, "-").toLowerCase()}`,
        name: newOptionName.trim(),
        price: priceNum,
      },
    ]);
    setNewOptionName("");
    setNewOptionPrice("");
  };

  const handleRemoveOption = (id: string) => {
    setFormOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice || !formCategoryId) {
      toast.warning("Vui lòng điền đủ Tên món, Giá và Danh mục");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 1000 || priceNum > 500000) {
      toast.warning("Giá bán món ăn phải từ 1.000đ đến 500.000đ");
      return;
    }

    if (formOriginalPrice) {
      const origNum = parseFloat(formOriginalPrice);
      if (isNaN(origNum) || origNum < 1000 || origNum > 500000) {
        toast.warning("Giá gốc gạch chân phải từ 1.000đ đến 500.000đ");
        return;
      }
    }

    for (const opt of formOptions) {
      const optPrice = typeof opt.price === "number" ? opt.price : parseFloat(String(opt.price));
      if (isNaN(optPrice) || (optPrice !== 0 && (optPrice < 1000 || optPrice > 500000))) {
        toast.warning(`Tùy chọn "${opt.name}" có giá không hợp lệ (phải bằng 0đ hoặc từ 1.000đ đến 500.000đ)`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        price: parseFloat(formPrice),
        originalPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : null,
        categoryId: formCategoryId,
        description: formDescription.trim(),
        image:
          formImage.trim() ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
        isHot: formIsHot,
        isBestseller: formIsBestseller,
        isOnBanner: formIsOnBanner,
        isAvailable: formIsAvailable,
        toppingsJson: JSON.stringify(formOptions),
      };

      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Cập nhật món ăn thành công");
          onSaved();
          onClose();
        } else {
          toast.error(data.error || "Không thể cập nhật món ăn");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Đã thêm món ăn mới vào thực đơn");
          onSaved();
          onClose();
        } else {
          toast.error(data.error || "Không thể thêm món ăn mới");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi lưu món ăn");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategoryName =
    categories.find((c) => c.id === formCategoryId)?.name || "Danh mục";

  if (!isOpen || !mounted) return null;

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    {editingProduct ? "Chỉnh Sửa Món Ăn" : "Thêm Món Ăn Mới"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cập nhật hình ảnh, tùy chọn Option và xem trước thẻ hiển thị
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - 2 Columns Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {/* Left Column: Form Controls (7 Cols) */}
              <form onSubmit={handleSaveProduct} id="product-form" className="lg:col-span-7 p-5 sm:p-6 space-y-5 text-xs">
                {/* 1. Basic Info */}
                <div className="space-y-3">
                  <h4 className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-600">
                    <span>1. Thông Tin Cơ Bản</span>
                  </h4>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên món ăn *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="VD: Nem Nướng Nha Trang Đặc Biệt"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">Giá bán (VNĐ) *</label>
                        <span className="text-[10px] text-orange-600 font-extrabold">1k - 500k</span>
                      </div>
                      <input
                        type="number"
                        required
                        min={1000}
                        max={500000}
                        step={500}
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="VD: 35000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">Giá gốc gạch chân</label>
                        <span className="text-[10px] text-slate-400 font-semibold">1k - 500k</span>
                      </div>
                      <input
                        type="number"
                        min={1000}
                        max={500000}
                        step={500}
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(e.target.value)}
                        placeholder="VD: 45000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Danh mục món *</label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mô tả hương vị món ăn</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Mô tả hương vị, nguyên liệu, nước chấm ăn kèm..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* 2. Image Upload & Adjustment */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-600">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>2. Hình Ảnh Món Ăn (Tải Từ Thiết Bị)</span>
                    </h4>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {!formImage ? (
                    <div
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-slate-200 hover:border-orange-500 bg-slate-50 hover:bg-orange-50/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 group-hover:bg-orange-200 text-orange-600 flex items-center justify-center mb-2 transition">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                        Nhấn để tải ảnh món ăn từ máy
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Hỗ trợ PNG, JPG, JPEG, WEBP (Tự động mở công cụ căn chỉnh chuẩn 4:3)
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="relative w-28 aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-xs">
                        <img
                          src={formImage}
                          alt="Ảnh món ăn"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenCropperForCurrent}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          <span>Căn chỉnh lại góc ảnh</span>
                        </button>

                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Đổi ảnh khác</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormImage("")}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Product Options / Toppings */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-600">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>3. Tùy Chọn & Topping Cho Món ({formOptions.length})</span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                    <input
                      type="text"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      placeholder="Tên tùy chọn (VD: Thêm chả, Size lớn...)"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      min={0}
                      max={500000}
                      step={500}
                      value={newOptionPrice}
                      onChange={(e) => setNewOptionPrice(e.target.value)}
                      placeholder="Giá thêm (0 - 500k)"
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
                    >
                      + Thêm
                    </button>
                  </div>

                  {formOptions.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {formOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            <span className="font-bold text-slate-800">{opt.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-orange-600">
                              {opt.price > 0 ? `+${opt.price.toLocaleString("vi-VN")}đ` : "Miễn phí (0đ)"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(opt.id)}
                              className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                              title="Xóa tùy chọn này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Badges & Status */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsHot}
                      onChange={(e) => setFormIsHot(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Gắn nhãn HOT 🔥</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsBestseller}
                      onChange={(e) => setFormIsBestseller(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Gắn nhãn Bestseller ⭐</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsOnBanner}
                      onChange={(e) => {
                        const otherBannerCount = allProducts.filter(
                          (p) => p.isOnBanner && (!editingProduct || p.id !== editingProduct.id)
                        ).length;
                        if (e.target.checked && otherBannerCount >= 5) {
                          toast.warning("Đã có tối đa 5 món được ghim trên Banner trang chủ. Vui lòng bỏ chọn bớt món khác trước!");
                          return;
                        }
                        setFormIsOnBanner(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <span>Hiển thị trên Banner 🎯</span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 font-extrabold px-1.5 py-0.5 rounded-md">
                        {allProducts.filter((p) => p.isOnBanner && (!editingProduct || p.id !== editingProduct.id)).length + (formIsOnBanner ? 1 : 0)}/5 món
                      </span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsAvailable}
                      onChange={(e) => setFormIsAvailable(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Đang có sẵn để bán</span>
                  </label>
                </div>
              </form>

              {/* Right Column: Live Product Card Preview (5 Cols) */}
              <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-800">
                      <Eye className="w-3.5 h-3.5 text-orange-600" />
                      <span>Xem Trước Thẻ Món (Live Preview)</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      Giao diện khách hàng
                    </span>
                  </div>

                  <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md transition-all duration-300 flex flex-col max-w-xs mx-auto">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={
                          formImage ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"
                        }
                        alt={formName || "Tên món ăn"}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {formIsHot && (
                          <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                            <Flame className="w-3.5 h-3.5" /> HOT
                          </span>
                        )}
                        {formIsBestseller && (
                          <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                            ⭐ Bestseller
                          </span>
                        )}
                        {formIsOnBanner && (
                          <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                            🎯 Banner
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        {selectedCategoryName}
                      </div>

                      {!formIsAvailable && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Tạm hết hàng
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                        {formName || "Tên món ăn sẽ hiển thị ở đây"}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {formDescription || "Mô tả hương vị, gia vị và nét đặc trưng thơm ngon của món ăn..."}
                      </p>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-lg font-black text-orange-600">
                          {formPrice ? `${parseFloat(formPrice).toLocaleString("vi-VN")}đ` : "35.000đ"}
                        </span>
                        {formOriginalPrice && parseFloat(formOriginalPrice) > (parseFloat(formPrice) || 0) && (
                          <span className="text-xs text-slate-400 line-through">
                            {parseFloat(formOriginalPrice).toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </div>

                      {formOptions.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            ✨ {formOptions.length} Tùy chọn đi kèm:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {formOptions.map((opt) => (
                              <span
                                key={opt.id}
                                className="bg-orange-50 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-orange-200/60"
                              >
                                {opt.name} {opt.price > 0 ? `(+${opt.price / 1000}k)` : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 pt-0 flex items-center gap-2">
                      <button
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-orange-600 text-white font-bold py-2 rounded-xl text-xs shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm vào giỏ
                      </button>
                      <button
                        type="button"
                        title="Tùy chọn Topping"
                        className="inline-flex items-center justify-center bg-slate-100 text-slate-700 p-2 rounded-xl"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition cursor-pointer text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 transition flex items-center gap-2 cursor-pointer text-xs disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingProduct ? "Lưu Cập Nhật Món" : "Thêm Món Vào Thực Đơn"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {cropperOpen && (
        <ImageCropperModal
          isOpen={cropperOpen}
          imageSrc={rawImageForCrop}
          onClose={() => setCropperOpen(false)}
          onCropComplete={handleCropComplete}
          aspectRatio={4 / 3}
        />
      )}
    </>
  );
}
