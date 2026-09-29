"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Check, PlusCircle, CheckCircle2 } from "lucide-react";
import { useCart, CartTopping, CartItem } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";
import { ProductType, ToppingType } from "@/types";

interface ProductCustomizeModalProps {
  product: ProductType | null;
  editingCartItem?: CartItem | null;
  toppingsList: ToppingType[];
  onClose: () => void;
}

export function ProductCustomizeModal({
  product,
  editingCartItem,
  toppingsList,
  onClose,
}: ProductCustomizeModalProps) {
  const { addToCart, updateCartItem } = useCart();
  const { config } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<CartTopping[]>([]);
  const [note, setNote] = useState("");

  const isEditMode = Boolean(editingCartItem);

  // Sync state on open / change
  useEffect(() => {
    if (editingCartItem) {
      setQuantity(editingCartItem.quantity);
      setSelectedToppings(editingCartItem.selectedToppings || []);
      setNote(editingCartItem.note || "");
    } else {
      setQuantity(1);
      setSelectedToppings([]);
      setNote("");
    }
  }, [product, editingCartItem]);

  const availableOptions: ToppingType[] = React.useMemo(() => {
    if (!product) return [];

    const toppingMap = new Map((toppingsList || []).map((t) => [t.id, t]));

    if (product.toppingsJson) {
      try {
        const parsed =
          typeof product.toppingsJson === "string"
            ? JSON.parse(product.toppingsJson)
            : product.toppingsJson;

        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return [];

          const resolved: ToppingType[] = [];
          parsed.forEach((item: any, idx: number) => {
            if (typeof item === "string") {
              // Lookup from global toppings by ID
              const found = toppingMap.get(item);
              if (found) {
                resolved.push({
                  id: found.id,
                  name: found.name,
                  price: found.price,
                  isAvailable: true,
                });
              }
            } else if (item && typeof item === "object" && item.name) {
              // Custom option object created in Admin
              resolved.push({
                id: item.id || `opt-${idx}-${String(item.name).toLowerCase().replace(/[^a-z0-9]/g, "")}`,
                name: item.name,
                price: Number(item.price) || 0,
                isAvailable: true,
              });
            }
          });

          return resolved;
        }
      } catch (e) {
        console.error("Error parsing toppingsJson", e);
      }
    }

    return [];
  }, [product, toppingsList]);

  if (!product) return null;

  const toggleTopping = (topping: ToppingType) => {
    const exists = selectedToppings.find((t) => t.id === topping.id);
    if (exists) {
      setSelectedToppings((prev) => prev.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings((prev) => [
        ...prev,
        { id: topping.id, name: topping.name, price: topping.price },
      ]);
    }
  };

  const toppingTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const singleItemPrice = product.price + toppingTotal;
  const totalPrice = singleItemPrice * quantity;

  const handleConfirm = () => {
    if (editingCartItem) {
      updateCartItem(editingCartItem.cartItemId, {
        quantity,
        selectedToppings,
        note,
      });
    } else {
      addToCart(product, quantity, selectedToppings, note);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header with image */}
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <img
            src={
              product.image ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"
            }
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className={`absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl ${config.colors.accentText} font-extrabold text-sm shadow-sm flex items-center gap-1.5`}>
            <span>{product.price.toLocaleString("vi-VN")}đ</span>
            {isEditMode && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold">
                Đang chỉnh sửa
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-extrabold text-slate-900">{product.name}</h3>
              {isEditMode && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Chỉnh sửa giỏ hàng
                </span>
              )}
            </div>
            {product.description && (
              <p className="text-xs text-slate-500 leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Options / Toppings list */}
          {availableOptions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5 text-orange-500" /> Tùy chọn & Topping
                </span>
                <span className="text-[11px] text-slate-400">Chọn thêm tùy thích</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {availableOptions.map((t) => {
                  const isChecked = selectedToppings.some((item) => item.id === t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTopping(t)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition cursor-pointer ${
                        isChecked
                          ? "border-orange-500 bg-orange-50/70 text-orange-950 font-semibold ring-1 ring-orange-500/30"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs ${
                            isChecked ? "bg-orange-600" : "border border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-sm font-medium">{t.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${config.colors.accentText}`}>
                        {t.price > 0 ? `+${t.price.toLocaleString("vi-VN")}đ` : "Miễn phí"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ghi chú cho món ăn
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Không cay, nhiều rau, ít đá, để sốt riêng..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center border border-slate-200 bg-white rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-slate-800">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className={`flex-1 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-between transition active:scale-95 cursor-pointer relative ${
              isEditMode
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                : config.colors.primaryBtn
            }`}
          >
            {!isEditMode && <ButtonFestiveDecorator />}
            <span className="flex items-center gap-1.5">
              {isEditMode ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Thêm Vào Giỏ</span>
                </>
              )}
            </span>
            <span className="font-extrabold text-sm sm:text-base">{totalPrice.toLocaleString("vi-VN")}đ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
