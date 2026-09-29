"use client";

import React, { useMemo } from "react";
import { Search, Flame, Plus, Utensils, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";
import { ProductType, CategoryType } from "@/types";

interface MenuSectionProps {
  categories: CategoryType[];
  products: ProductType[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  onOpenCustomize: (product: ProductType) => void;
}

export function MenuSection({
  categories,
  products,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onOpenCustomize,
}: MenuSectionProps) {
  const { addToCart } = useCart();
  const { config, theme } = useTheme();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <section
      id="menu"
      style={{ backgroundColor: config.colors.sectionBg }}
      className={`py-12 lg:py-20 border-t ${config.colors.sectionBorder} transition-colors duration-500`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className={`inline-flex items-center gap-1.5 ${config.colors.tagColor} text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-2`}>
            {theme !== "default" ? <span>{config.emoji}</span> : <Utensils className="w-3.5 h-3.5" />}
            Đặt Món Trực Tuyến
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Thực Đơn Đầy Đủ Tại Tiệm Chè Na
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Chọn món yêu thích, tùy biến topping và chốt đơn trong 30 giây!
          </p>
        </div>

        {/* Search Bar & Category Tabs */}
        <div className="space-y-4 mb-10">
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm món: nem nướng, chè xoài, mỳ trộn..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              🍽️ Tất Cả ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? `${config.colors.primaryBtn} shadow-md`
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 max-w-lg mx-auto">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-800 text-base">Không tìm thấy món ăn phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">Hãy thử tìm với từ khóa khác hoặc đổi danh mục</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${config.colors.accentText} hover:underline cursor-pointer`}
            >
              Xem tất cả thực đơn
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/70 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={
                        product.image ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      {product.isHot && (
                        <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> HOT
                        </span>
                      )}
                      {product.isBestseller && (
                        <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                          ⭐ Bestseller
                        </span>
                      )}
                    </div>

                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Tạm hết hàng
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-baseline justify-between gap-1 mb-1">
                      <h3 className="font-bold text-base text-slate-900 leading-snug group-hover:opacity-80 transition">
                        {product.name}
                      </h3>
                    </div>

                    {product.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-black ${config.colors.accentText}`}>
                        {product.price.toLocaleString("vi-VN")}đ
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {product.originalPrice.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    disabled={!product.isAvailable}
                    onClick={() => onOpenCustomize(product)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 ${config.colors.primaryBtn} disabled:bg-slate-300 disabled:shadow-none disabled:ring-0 font-bold py-2.5 px-3 rounded-xl text-xs transition active:scale-95 cursor-pointer disabled:cursor-not-allowed`}
                  >
                    <ButtonFestiveDecorator />
                    <Plus className="w-4 h-4" /> Thêm Vào Giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
