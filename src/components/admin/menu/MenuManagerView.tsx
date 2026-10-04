"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { ProductType, CategoryType, ToppingType } from "@/types";
import { ProductTable } from "@/components/admin/menu/ProductTable";
import { ProductModal } from "@/components/admin/menu/ProductModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/context/ToastContext";
import {
  MenuSectionKey,
  MENU_SECTIONS,
  filterProductsBySection,
  getSectionCategories,
  getDefaultCategoryIdForSection,
  getProductSectionGroup,
} from "@/lib/menuCategorizer";

interface MenuManagerViewProps {
  section: MenuSectionKey;
}

export function MenuManagerView({ section }: MenuManagerViewProps) {
  const pathname = usePathname();
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [toppings, setToppings] = useState<ToppingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);

  // Delete Modal State
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sectionMeta = useMemo(() => {
    return MENU_SECTIONS.find((s) => s.key === section) || MENU_SECTIONS[0];
  }, [section]);

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/products?t=${timestamp}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        }),
        fetch(`/api/categories?t=${timestamp}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        }),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (prodData.success) {
        setAllProducts(prodData.data.products || []);
        setToppings(prodData.data.toppings || []);
      }
      if (catData.success) {
        setCategories(catData.data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách món ăn");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products for this current section
  const sectionProducts = useMemo(() => {
    return filterProductsBySection(allProducts, section, categories);
  }, [allProducts, section, categories]);

  // Section-applicable categories
  const sectionCategories = useMemo(() => {
    return getSectionCategories(section, categories);
  }, [section, categories]);

  // Section item counts for tabs
  const tabCounts = useMemo(() => {
    const counts = { all: allProducts.length, "an-vat": 0, che: 0, "do-uong": 0 };
    for (const p of allProducts) {
      const group = getProductSectionGroup(p, categories);
      counts[group] = (counts[group] || 0) + 1;
    }
    return counts;
  }, [allProducts, categories]);

  // Section metrics
  const metrics = useMemo(() => {
    const total = sectionProducts.length;
    const available = sectionProducts.filter((p) => p.isAvailable).length;
    const unavailable = total - available;
    const onBanner = sectionProducts.filter((p) => p.isOnBanner).length;
    return { total, available, unavailable, onBanner };
  }, [sectionProducts]);

  const defaultCatId = useMemo(() => {
    return getDefaultCategoryIdForSection(section, categories);
  }, [section, categories]);

  const handleProductSaved = (savedProduct?: ProductType) => {
    if (savedProduct) {
      setAllProducts((prev) => {
        const exists = prev.some((p) => p.id === savedProduct.id);
        if (exists) {
          return prev.map((p) => (p.id === savedProduct.id ? savedProduct : p));
        }
        return [savedProduct, ...prev];
      });
    }
    fetchData();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductType) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleToggleAvailable = async (product: ProductType) => {
    try {
      const updatedStatus = !product.isAvailable;
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: updatedStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAllProducts((prev) =>
          prev.map((item) =>
            item.id === product.id ? { ...item, isAvailable: updatedStatus } : item
          )
        );
        toast.success(`Đã ${updatedStatus ? "bật" : "tắt"} mở bán món "${product.name}"`);
      } else {
        toast.error(data.error || "Không thể cập nhật trạng thái");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleToggleBanner = async (product: ProductType) => {
    try {
      const nextBannerState = !product.isOnBanner;

      // Limit 8 banner items
      if (nextBannerState) {
        const currentBannerCount = allProducts.filter(
          (p) => p.isOnBanner && p.id !== product.id
        ).length;
        if (currentBannerCount >= 8) {
          toast.warning(
            "Đã có tối đa 8 món trên Banner. Vui lòng bấm vào tab 'Banner' để bỏ bớt món trước!"
          );
          return;
        }
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnBanner: nextBannerState }),
      });
      const data = await res.json();
      if (data.success) {
        setAllProducts((prev) =>
          prev.map((item) =>
            item.id === product.id ? { ...item, isOnBanner: nextBannerState } : item
          )
        );
        toast.success(
          nextBannerState
            ? `Đã ghim "${product.name}" lên Banner`
            : `Đã bỏ ghim "${product.name}" khỏi Banner`
        );
      } else {
        toast.error(data.error || "Không thể cập nhật Banner");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối khi cập nhật Banner");
    }
  };

  const confirmDelete = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deletingProductId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAllProducts((prev) => prev.filter((p) => p.id !== deletingProductId));
        toast.success("Đã xóa món ăn khỏi thực đơn thành công");
      } else {
        toast.error(data.error || "Không thể xóa món ăn");
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể xóa món ăn");
    } finally {
      setIsDeleting(false);
      setDeletingProductId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 4 Category Navigation Tabs */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-xs border border-slate-200/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MENU_SECTIONS.map((tab) => {
            const isActive = pathname === tab.href;
            const count = tabCounts[tab.key] || 0;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                }`}
              >
                <span className="text-xs font-black truncate">{tab.label}</span>
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Header Banner for the Current Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {sectionMeta.title}
            </h1>
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${sectionMeta.badgeBg}`}>
              {sectionMeta.shortLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {sectionMeta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-orange-600/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Món {section !== "all" ? sectionMeta.shortLabel : "Mới"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Số Món</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Đang Mở Bán</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.available}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Tạm Hết Hàng</p>
          <p className="text-2xl font-black text-red-600 mt-1">{metrics.unavailable}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Ghim Banner</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{metrics.onBanner}</p>
        </div>
      </div>

      {/* Main Product Table Component */}
      <ProductTable
        products={sectionProducts}
        categories={sectionCategories.length > 0 ? sectionCategories : categories}
        isLoading={isLoading}
        onEditProduct={openEditModal}
        onDeleteProduct={(id) => setDeletingProductId(id)}
        onToggleAvailable={handleToggleAvailable}
        onToggleBanner={handleToggleBanner}
      />

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        categories={categories}
        defaultCategoryId={defaultCatId}
        toppings={toppings}
        allProducts={allProducts}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleProductSaved}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingProductId}
        title="Xác nhận xóa món ăn"
        message="Bạn có chắc chắn muốn xóa món này khỏi thực đơn không? Thao tác này không thể hoàn tác."
        confirmText="Xóa món ăn"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingProductId(null)}
      />
    </div>
  );
}
