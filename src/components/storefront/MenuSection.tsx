"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Flame,
  Plus,
  Utensils,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";
import { ProductType, CategoryType } from "@/types";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";

interface MenuSectionProps {
  categories: CategoryType[];
  products: ProductType[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  onOpenCustomize: (product: ProductType) => void;
}

const ITEMS_PER_PAGE = 16;

export function MenuSection({
  categories,
  products,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onOpenCustomize,
}: MenuSectionProps) {
  const { config, theme } = useTheme();

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // Reset trang về 1 khi đổi danh mục hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Lọc sản phẩm theo danh mục và tìm kiếm
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "all" ||
        p.categoryId === selectedCategory ||
        p.category?.slug === selectedCategory;

      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

  // Sản phẩm hiển thị cho trang hiện tại
  const displayedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const scrollToMenuTop = () => {
    const el = document.getElementById("menu-catalog");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToMenuTop();
  };

  return (
    <section
      id="menu"
      style={{ backgroundColor: config.colors.sectionBg }}
      className={`py-12 lg:py-20 border-t ${config.colors.sectionBorder} transition-colors duration-500`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span
            className={`inline-flex items-center gap-1.5 ${config.colors.tagColor} text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-2`}
          >
            {theme !== "default" ? <span>{config.emoji}</span> : <Utensils className="w-3.5 h-3.5" />}
            Đặt Món Trực Tuyến
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Thực Đơn Đầy Đủ Tại Tiệm Chè Na
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Gần 100 món ăn vặt giòn rụm, chè thanh mát & đồ uống thơm ngon đang chờ bạn!
          </p>
        </div>

        {/* Search Bar & Category Navigation */}
        <div id="menu-catalog" className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm món: nem nướng, chè xoài, chân gà sốt thái..."
              className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition"
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

          {/* Sticky Category Tabs Bar */}
          <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>🍽️ Tất Cả</span>
              <span className="text-[10px] opacity-75">({products.length})</span>
            </button>

            {categories.map((cat) => {
              const count = products.filter(
                (p) => p.categoryId === cat.id || p.category?.slug === cat.slug
              ).length;
              const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${config.colors.primaryBtn} shadow`
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{cat.icon || "🍴"}</span>
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Count Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-5 px-1">
          <p>
            Tìm thấy <strong className="text-slate-800 font-bold">{filteredProducts.length}</strong> món ăn
            {totalPages > 1 && (
              <span> (Trang {currentPage}/{totalPages})</span>
            )}
          </p>

          <span className="text-[11px] text-slate-400">
            Hiển thị 16 món/trang
          </span>
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {displayedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/70 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={getOptimizedImageUrl(product.image, { width: 450, crop: "fill" })}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {!product.isAvailable && (
                        <span className="bg-red-600 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                          Hết Hàng
                        </span>
                      )}
                      {product.isHot && (
                        <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> HOT
                        </span>
                      )}
                      {product.isBestseller && (
                        <span className="bg-amber-500 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
                          ⭐ Bestseller
                        </span>
                      )}
                    </div>

                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                          Hết Hàng
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3 sm:p-4 pb-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug group-hover:text-orange-600 transition line-clamp-1 mb-1">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-1 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Footer: Price on Left, + Chọn Món Green Button on Right */}
                <div className="p-3 sm:p-4 pt-2 flex items-center justify-between gap-2 border-t border-slate-100/80">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm sm:text-base font-black text-[#c2410c] tracking-tight whitespace-nowrap">
                      {product.price.toLocaleString("vi-VN")}đ
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[10px] text-slate-400 line-through -mt-0.5">
                        {product.originalPrice.toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>

                  <button
                    disabled={!product.isAvailable}
                    onClick={() => onOpenCustomize(product)}
                    className="inline-flex items-center justify-center gap-1 bg-[#15803d] hover:bg-[#166534] text-white font-extrabold py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <span>{product.isAvailable ? "+ Chọn Món" : "Hết hàng"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── BỘ PHÂN TRANG THEO SỐ TRANG GỌN ĐẸP ─── */}
        {filteredProducts.length > 0 && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1.5 pt-2">
            {/* Nút Trước */}
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Các số trang */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isActive = currentPage === page;
              if (
                totalPages > 7 &&
                Math.abs(page - currentPage) > 2 &&
                page !== 1 &&
                page !== totalPages
              ) {
                if (Math.abs(page - currentPage) === 3) {
                  return (
                    <span key={page} className="w-6 text-center text-slate-400 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md scale-105"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Nút Sau */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
