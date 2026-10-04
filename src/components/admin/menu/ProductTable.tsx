"use client";

import React, { useState } from "react";
import {
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Flame,
  Star,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { ProductType, CategoryType } from "@/types";
import { Pagination } from "@/components/ui/Pagination";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";

interface ProductTableProps {
  products: ProductType[];
  categories: CategoryType[];
  isLoading: boolean;
  onEditProduct: (p: ProductType) => void;
  onDeleteProduct: (id: string) => void;
  onToggleAvailable: (p: ProductType) => void;
  onToggleBanner?: (p: ProductType) => void;
}

export function ProductTable({
  products,
  categories,
  isLoading,
  onEditProduct,
  onDeleteProduct,
  onToggleAvailable,
  onToggleBanner,
}: ProductTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCat === "all"
        ? true
        : selectedCat === "banner"
        ? Boolean(p.isOnBanner)
        : p.categoryId === selectedCat;
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm món ăn theo tên hoặc mô tả..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCat("all");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCat === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất Cả ({products.length})
          </button>

          {/* Tab lọc các món đang ghim Banner */}
          <button
            onClick={() => {
              setSelectedCat("banner");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedCat === "banner"
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
            }`}
          >
            <span>Banner</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                selectedCat === "banner"
                  ? "bg-white/20 text-white"
                  : "bg-purple-200/80 text-purple-900"
              }`}
            >
              {products.filter((p) => p.isOnBanner).length}
            </span>
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCat(c.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCat === c.id ? "bg-orange-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[11px] tracking-wider">
              <tr>
                <th className="p-3.5">Món Ăn</th>
                <th className="p-3.5">Danh Mục</th>
                <th className="p-3.5">Giá Bán</th>
                <th className="p-3.5">Tùy Chọn (Options)</th>
                <th className="p-3.5">Trạng Thái Bán</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
                    <span>Đang tải danh sách món ăn...</span>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span>Không tìm thấy món ăn nào</span>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  let optCount = 0;
                  if (p.toppingsJson) {
                    try {
                      const parsed = typeof p.toppingsJson === "string" ? JSON.parse(p.toppingsJson) : p.toppingsJson;
                      if (Array.isArray(parsed)) optCount = parsed.length;
                    } catch {}
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      {/* Name and image */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={getOptimizedImageUrl(p.image, { width: 120, crop: "fill" })}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{p.name}</div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {!p.isAvailable && (
                                <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-red-200">
                                  Hết Hàng
                                </span>
                              )}
                              {p.isHot && (
                                <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5" /> HOT
                                </span>
                              )}
                              {p.isBestseller && (
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5" /> Bestseller
                                </span>
                              )}
                              {onToggleBanner ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleBanner(p);
                                  }}
                                  title={
                                    p.isOnBanner
                                      ? "Đang ghim trên Banner (Nhấp để gỡ)"
                                      : "Nhấp để ghim lên Banner trang chủ"
                                  }
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer ${
                                    p.isOnBanner
                                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300 shadow-2xs"
                                      : "bg-slate-100 text-slate-400 hover:text-purple-700 hover:bg-purple-50 border border-dashed border-slate-300"
                                  }`}
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>{p.isOnBanner ? "Banner" : "+ Banner"}</span>
                                </button>
                              ) : p.isOnBanner ? (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                                  <Sparkles className="w-2.5 h-2.5" /> Banner
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 font-semibold text-slate-600">
                        {p.category?.name || "Chưa phân loại"}
                      </td>

                      {/* Price */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-orange-600 text-sm">
                          {p.price.toLocaleString("vi-VN")}đ
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-[11px] text-slate-400 line-through block">
                            {p.originalPrice.toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </td>

                      {/* Options count */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                          {optCount > 0 ? `${optCount} tùy chọn` : "Mặc định"}
                        </span>
                      </td>

                      {/* Availability toggle */}
                      <td className="p-3.5">
                        <button
                          onClick={() => onToggleAvailable(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] transition cursor-pointer ${
                            p.isAvailable
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {p.isAvailable ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đang Bán</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Tạm Hết Hàng</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => onEditProduct(p)}
                          className="p-2 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 rounded-xl transition cursor-pointer"
                          title="Chỉnh sửa món"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl transition cursor-pointer"
                          title="Xóa món"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProducts.length}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
