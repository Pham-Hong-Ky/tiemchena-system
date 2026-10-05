"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, UtensilsCrossed } from "lucide-react";
import { ProductType, CategoryType, ProductOptionType, ToppingType } from "@/types";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { ProductOptionsEditor } from "./ProductOptionsEditor";
import { ProductLivePreview } from "./ProductLivePreview";
import { ProductFormFields } from "./ProductFormFields";
import { toast } from "@/context/ToastContext";

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: ProductType | null;
  categories: CategoryType[];
  toppings: ToppingType[];
  allProducts: ProductType[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: (savedProduct?: ProductType) => void;
}

export function ProductModal({
  isOpen,
  editingProduct,
  categories,
  toppings,
  allProducts,
  defaultCategoryId,
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
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [formIsHot, setFormIsHot] = useState(false);
  const [formIsBestseller, setFormIsBestseller] = useState(false);
  const [formIsOnBanner, setFormIsOnBanner] = useState(false);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formProductType, setFormProductType] = useState<string>("physical");
  const [formStock, setFormStock] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Image Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState("");

  // Options / Toppings State
  const [formOptions, setFormOptions] = useState<ProductOptionType[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update image dimensions whenever formImage changes
  useEffect(() => {
    if (!formImage) {
      setImageDimensions(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = formImage;
  }, [formImage]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setFormName(editingProduct.name);
      setFormPrice(editingProduct.price.toString());
      setFormOriginalPrice(editingProduct.originalPrice ? editingProduct.originalPrice.toString() : "");
      const catMatches = categories.some((c) => c.id === editingProduct.categoryId);
      setFormCategoryId(catMatches ? editingProduct.categoryId : (categories[0]?.id || ""));
      setFormDescription(editingProduct.description || "");
      setFormImage(editingProduct.image || "");
      setFormIsHot(editingProduct.isHot || false);
      setFormIsBestseller(editingProduct.isBestseller || false);
      setFormIsOnBanner(editingProduct.isOnBanner || false);
      setFormIsAvailable(editingProduct.isAvailable !== undefined ? editingProduct.isAvailable : true);
      setFormProductType(editingProduct.productType || "physical");
      setFormStock(
        editingProduct.stock !== null && editingProduct.stock !== undefined ? String(editingProduct.stock) : ""
      );

      if (editingProduct.toppingsJson) {
        try {
          const parsed = JSON.parse(editingProduct.toppingsJson);
          if (Array.isArray(parsed)) {
            const toppingMap = new Map((toppings || []).map((t) => [t.id, t]));
            const normalized = parsed
              .map((item: any, idx: number) => {
                if (typeof item === "string") {
                  const found = toppingMap.get(item);
                  if (found) {
                    return { id: found.id, name: found.name, price: found.price };
                  }
                  return null;
                }
                if (item && typeof item === "object" && item.name) {
                  return {
                    id: item.id || `opt-${idx}-${String(item.name).toLowerCase().replace(/[^a-z0-9]/g, "")}`,
                    name: String(item.name),
                    price: Number(item.price) || 0,
                  };
                }
                return null;
              })
              .filter(Boolean) as ProductOptionType[];
            setFormOptions(normalized);
          } else {
            setFormOptions([]);
          }
        } catch {
          setFormOptions([]);
        }
      } else {
        setFormOptions([]);
      }
    } else {
      setFormName("");
      setFormPrice("");
      setFormOriginalPrice("");
      setFormCategoryId(defaultCategoryId && categories.some(c => c.id === defaultCategoryId) ? defaultCategoryId : (categories[0]?.id || ""));
      setFormDescription("");
      setFormImage("");
      setImageDimensions(null);
      setFormIsHot(false);
      setFormIsBestseller(false);
      setFormIsOnBanner(false);
      setFormIsAvailable(true);
      setFormProductType("physical");
      setFormStock("");
      setFormOptions([]);
    }
  }, [isOpen, editingProduct, categories, toppings, defaultCategoryId]);

  const handleCropComplete = (url: string) => {
    setCropperOpen(false);
    setFormImage(url);
    toast.success("Tải ảnh món ăn thành công!");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice || !formCategoryId) {
      toast.warning("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    const priceNum = parseInt(formPrice);
    if (isNaN(priceNum) || priceNum < 1000 || priceNum > 500000) {
      toast.warning("Giá bán phải từ 1.000đ đến 500.000đ!");
      return;
    }

    let origPriceNum: number | null = null;
    if (formOriginalPrice) {
      origPriceNum = parseInt(formOriginalPrice);
      if (isNaN(origPriceNum) || origPriceNum < 1000 || origPriceNum > 500000) {
        toast.warning("Giá gốc phải từ 1.000đ đến 500.000đ!");
        return;
      }
    }

    if (formProductType === "physical" && formStock.trim() !== "") {
      const n = Number(formStock);
      if (!Number.isInteger(n) || n < 0) {
        toast.warning("Tồn kho phải là số nguyên ≥ 0 (để trống nếu không theo dõi kho)");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        productType: formProductType,
        stock: formProductType === "physical" && formStock.trim() !== "" ? Number(formStock) : null,
        name: formName.trim(),
        price: priceNum,
        originalPrice: origPriceNum,
        categoryId: formCategoryId,
        description: formDescription.trim(),
        image: formImage || "/images/placeholder-food.jpg",
        isHot: formIsHot,
        isBestseller: formIsBestseller,
        isOnBanner: formIsOnBanner,
        isAvailable: formIsAvailable,
        toppingsJson: JSON.stringify(formOptions),
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi lưu món ăn");
      }

      toast.success(editingProduct ? "Đã cập nhật món ăn thành công!" : "Đã thêm món ăn mới thành công!");
      onSaved(data.data);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu món");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return (
    <>
      {createPortal(
        <div
          style={{ zIndex: 99999 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-5 sm:px-6 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold">
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

            {/* Modal Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {/* Left Column: Form Controls */}
              <form onSubmit={handleSaveProduct} id="product-form" className="lg:col-span-7 p-5 sm:p-6 space-y-5 text-xs">
                {/* Basic Info, Image Upload, Status */}
                <ProductFormFields
                  formName={formName}
                  setFormName={setFormName}
                  formPrice={formPrice}
                  setFormPrice={setFormPrice}
                  formOriginalPrice={formOriginalPrice}
                  setFormOriginalPrice={setFormOriginalPrice}
                  formCategoryId={formCategoryId}
                  setFormCategoryId={setFormCategoryId}
                  formDescription={formDescription}
                  setFormDescription={setFormDescription}
                  formImage={formImage}
                  setFormImage={setFormImage}
                  imageDimensions={imageDimensions}
                  setRawImageForCrop={setRawImageForCrop}
                  setCropperOpen={setCropperOpen}
                  formIsHot={formIsHot}
                  setFormIsHot={setFormIsHot}
                  formIsBestseller={formIsBestseller}
                  setFormIsBestseller={setFormIsBestseller}
                  formIsOnBanner={formIsOnBanner}
                  setFormIsOnBanner={setFormIsOnBanner}
                  formIsAvailable={formIsAvailable}
                  setFormIsAvailable={setFormIsAvailable}
                  categories={categories}
                  allProducts={allProducts}
                  editingProduct={editingProduct}
                />

                {/* Product type & stock */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="font-extrabold uppercase tracking-wider text-[11px] text-orange-600">
                    Loại Sản Phẩm & Tồn Kho
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Loại sản phẩm</label>
                      <select
                        value={formProductType}
                        onChange={(e) => setFormProductType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white cursor-pointer"
                      >
                        <option value="physical">Vật lý (món ăn, hàng hóa)</option>
                        <option value="digital">Sản phẩm số (ebook, file…)</option>
                        <option value="service">Dịch vụ</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Tồn kho</label>
                      {formProductType === "physical" ? (
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={formStock}
                          onChange={(e) => setFormStock(e.target.value)}
                          placeholder="Để trống = không theo dõi"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-[11px] font-semibold">
                          Không trừ kho với sản phẩm số / dịch vụ
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Options / Toppings */}
                <ProductOptionsEditor
                  options={formOptions}
                  onAddOption={(newOpt) => setFormOptions((prev) => [...prev, newOpt])}
                  onRemoveOption={(id) => setFormOptions((prev) => prev.filter((o) => o.id !== id))}
                />
              </form>

              {/* Right Column: Live Card Preview */}
              <ProductLivePreview
                name={formName}
                price={formPrice}
                originalPrice={formOriginalPrice}
                description={formDescription}
                image={formImage}
                isHot={formIsHot}
                isBestseller={formIsBestseller}
                isOnBanner={formIsOnBanner}
                isAvailable={formIsAvailable}
                categoryName={categories.find((c) => c.id === formCategoryId)?.name || "Món Ăn"}
                options={formOptions}
              />
            </div>

            {/* Footer */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>{editingProduct ? "Lưu Thay Đổi" : "Thêm Món Ăn"}</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={rawImageForCrop}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={4 / 3}
      />
    </>
  );
}
