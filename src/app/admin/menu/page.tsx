"use client";

import React, { useState, useEffect } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { ProductType, CategoryType, ToppingType } from "@/types";
import { ProductTable } from "@/components/admin/menu/ProductTable";
import { ProductModal } from "@/components/admin/menu/ProductModal";
import { toast } from "@/context/ToastContext";

export default function AdminMenuPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [toppings, setToppings] = useState<ToppingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (prodData.success) {
        setProducts(prodData.data.products);
        setToppings(prodData.data.toppings || []);
      }
      if (catData.success) setCategories(catData.data);
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
        setProducts((prev) =>
          prev.map((item) => (item.id === product.id ? { ...item, isAvailable: updatedStatus } : item))
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

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa món này khỏi thực đơn?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Đã xóa món ăn khỏi thực đơn thành công");
      } else {
        toast.error(data.error || "Không thể xóa món ăn");
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể xóa món ăn");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-orange-600" />
            <span>Quản Lý Thực Đơn & Món Ăn</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thêm món mới, tải ảnh trực tiếp, căn chỉnh góc ảnh chuẩn 4:3 và tùy biến Options
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold px-5 py-3 rounded-xl text-sm shadow-md shadow-orange-600/20 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Món Ăn Mới</span>
        </button>
      </div>

      {/* Main Product Table Component */}
      <ProductTable
        products={products}
        categories={categories}
        isLoading={isLoading}
        onEditProduct={openEditModal}
        onDeleteProduct={handleDelete}
        onToggleAvailable={handleToggleAvailable}
      />

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        categories={categories}
        toppings={toppings}
        allProducts={products}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchData}
      />
    </div>
  );
}
