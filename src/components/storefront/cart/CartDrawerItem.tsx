"use client";

import React from "react";
import { Plus, Minus, Trash2, SlidersHorizontal, Check } from "lucide-react";
import { CartItem, CartTopping } from "@/context/CartContext";
import { ToppingType } from "@/types";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";

interface CartDrawerItemProps {
  item: CartItem;
  index: number;
  isExpanded: boolean;
  availableOptions: ToppingType[];
  isOutOfStock?: boolean;
  onToggleExpand: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onToggleTopping: (topping: ToppingType) => void;
  onUpdateNote: (note: string) => void;
}

export function CartDrawerItem({
  item,
  isExpanded,
  availableOptions,
  isOutOfStock = false,
  onToggleExpand,
  onUpdateQuantity,
  onRemove,
  onToggleTopping,
  onUpdateNote,
}: CartDrawerItemProps) {
  const toppingTotal = item.selectedToppings.reduce((s, t) => s + t.price, 0);
  const itemUnitTotal = item.price + toppingTotal;
  const lineTotal = itemUnitTotal * item.quantity;

  return (
    <div className={`py-3 px-2 flex flex-col gap-2 rounded-xl transition ${isOutOfStock ? "bg-red-50/70 border border-red-200" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={getOptimizedImageUrl(item.image, { width: 160, crop: "fill" })}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-14 h-14 rounded-xl object-cover border border-slate-200"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
              <span className="text-[9px] font-black text-white bg-red-600 px-1 py-0.5 rounded">Hết</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
              {isOutOfStock && (
                <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded shrink-0">
                  Hết hàng
                </span>
              )}
            </div>
            <button
              onClick={onRemove}
              className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer shrink-0"
              title="Xóa món"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xs font-extrabold text-orange-600">
              {itemUnitTotal.toLocaleString("vi-VN")}đ
            </span>
            {toppingTotal > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                (Gốc {item.price.toLocaleString("vi-VN")}đ + Topping {toppingTotal.toLocaleString("vi-VN")}đ)
              </span>
            )}
          </div>

          {/* Toppings tags & Nút đổi option */}
          <div className="mt-1 flex items-center flex-wrap gap-1.5">
            {item.selectedToppings.length > 0 && (
              <div className="flex items-center flex-wrap gap-1">
                {item.selectedToppings.map((top) => (
                  <span
                    key={top.id}
                    className="text-[10px] font-semibold bg-orange-100/70 text-orange-800 px-1.5 py-0.5 rounded-md border border-orange-200/60"
                  >
                    +{top.name}
                  </span>
                ))}
              </div>
            )}

            {availableOptions.length > 0 && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 px-2 py-0.5 rounded-lg border border-orange-200/80 flex items-center gap-1 cursor-pointer transition"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>
                  {isExpanded
                    ? "Đóng tùy chọn"
                    : item.selectedToppings.length > 0
                    ? "Đổi topping"
                    : "+ Thêm option / topping"}
                </span>
              </button>
            )}
          </div>

          {/* Tăng giảm số lượng & Tổng tiền dòng */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => onUpdateQuantity(item.quantity - 1)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.quantity + 1)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs font-black text-slate-800 font-mono">
              {lineTotal.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      </div>

      {/* Bảng chọn Option / Topping mở rộng trực tiếp trong giỏ hàng */}
      {isExpanded && (
        <div className="mt-1 p-3 bg-white rounded-xl border border-orange-200 shadow-sm space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
            <span className="flex items-center gap-1.5 text-orange-600">
              Tùy chọn & Topping cho món này:
            </span>
            <button
              type="button"
              onClick={onToggleExpand}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 bg-slate-100 rounded-md cursor-pointer"
            >
              Xong
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {availableOptions.map((opt) => {
              const isChecked = item.selectedToppings.some((t) => t.id === opt.id);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onToggleTopping(opt)}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold transition text-left border cursor-pointer ${
                    isChecked
                      ? "bg-orange-50 border-orange-400 text-orange-900 shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 border ${
                        isChecked
                          ? "bg-orange-600 border-orange-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{opt.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-orange-600 shrink-0">
                    +{opt.price.toLocaleString("vi-VN")}đ
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ghi chú trực tiếp từng món */}
      <div className="pl-1">
        <input
          type="text"
          value={item.note || ""}
          onChange={(e) => onUpdateNote(e.target.value)}
          placeholder="Ghi chú món này (ít ngọt, không đá, chia riêng...)"
          className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition"
        />
      </div>
    </div>
  );
}
