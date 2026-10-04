"use client";

import React from "react";
import { Eye, Flame, Star, Sparkles, Plus, SlidersHorizontal } from "lucide-react";
import { ProductOptionType } from "@/types";

interface ProductLivePreviewProps {
  name: string;
  price: string;
  originalPrice?: string;
  description?: string;
  image?: string;
  isHot: boolean;
  isBestseller: boolean;
  isOnBanner: boolean;
  isAvailable: boolean;
  categoryName: string;
  options: ProductOptionType[];
}

export function ProductLivePreview({
  name,
  price,
  originalPrice,
  description,
  image,
  isHot,
  isBestseller,
  isOnBanner,
  isAvailable,
  categoryName,
  options,
}: ProductLivePreviewProps) {
  const numericPrice = parseFloat(price) || 0;
  const numericOrigPrice = parseFloat(originalPrice || "") || 0;

  return (
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
                image ||
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"
              }
              alt={name || "Tên món ăn"}
              className="w-full h-full object-cover"
            />

            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
              {isHot && (
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>HOT</span>
                </span>
              )}
              {isBestseller && (
                <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>BESTSELLER</span>
                </span>
              )}
              {isOnBanner && (
                <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span>BANNER</span>
                </span>
              )}
            </div>

            <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
              {categoryName}
            </div>

            {!isAvailable && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Tạm hết hàng
                </span>
              </div>
            )}
          </div>

          <div className="p-4 space-y-2">
            <h3 className="font-extrabold text-base text-slate-900 leading-snug">
              {name || "Tên món ăn sẽ hiển thị ở đây"}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {description || "Mô tả hương vị, gia vị và nét đặc trưng thơm ngon của món ăn..."}
            </p>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-lg font-black text-orange-600">
                {price ? `${numericPrice.toLocaleString("vi-VN")}đ` : "35.000đ"}
              </span>
              {numericOrigPrice > numericPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {numericOrigPrice.toLocaleString("vi-VN")}đ
                </span>
              )}
            </div>

            {options.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {options.length} Tùy chọn đi kèm:
                </p>
                <div className="flex flex-wrap gap-1">
                  {options.map((opt) => (
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
              disabled={!isAvailable}
              className={`flex-1 inline-flex items-center justify-center gap-1 font-bold py-2 rounded-xl text-xs shadow-xs transition ${
                isAvailable
                  ? "bg-orange-600 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isAvailable ? (
                <>
                  <Plus className="w-3.5 h-3.5" /> Thêm vào giỏ
                </>
              ) : (
                <span>Hết hàng</span>
              )}
            </button>
            <button
              type="button"
              disabled={!isAvailable}
              title="Tùy chọn Topping"
              className={`inline-flex items-center justify-center p-2 rounded-xl ${
                isAvailable
                  ? "bg-slate-100 text-slate-700"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
