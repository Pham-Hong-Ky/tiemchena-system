"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { ProductOptionType } from "@/types";
import { toast } from "@/context/ToastContext";

interface ProductOptionsEditorProps {
  options: ProductOptionType[];
  onAddOption: (option: ProductOptionType) => void;
  onRemoveOption: (id: string) => void;
}

export function ProductOptionsEditor({
  options,
  onAddOption,
  onRemoveOption,
}: ProductOptionsEditorProps) {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  const handleAdd = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const trimmedName = newOptionName.trim();
    if (!trimmedName) {
      toast.warning("Vui lòng nhập tên tùy chọn (VD: Thêm chân gà, Ít cay...)");
      nameInputRef.current?.focus();
      return;
    }

    const priceNum = newOptionPrice.trim() === "" ? 0 : parseFloat(newOptionPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.warning("Giá tùy chọn không hợp lệ");
      return;
    }
    if (priceNum !== 0 && (priceNum < 1000 || priceNum > 500000)) {
      toast.warning("Giá phụ thu tùy chọn phải bằng 0đ (miễn phí) hoặc từ 1.000đ đến 500.000đ");
      return;
    }

    onAddOption({
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      price: priceNum,
    });

    setNewOptionName("");
    setNewOptionPrice("");
    toast.success(`Đã thêm tùy chọn "${trimmedName}"`);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleAdd(e);
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-600">
          <span>3. Tùy Chọn & Topping Cho Món ({options.length})</span>
        </h4>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
        <input
          ref={nameInputRef}
          type="text"
          value={newOptionName}
          onChange={(e) => setNewOptionName(e.target.value)}
          onKeyDown={handleKeyDown}
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
          onKeyDown={handleKeyDown}
          placeholder="Giá thêm (0 - 500k)"
          className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="button"
          onClick={(e) => handleAdd(e)}
          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold rounded-xl transition cursor-pointer whitespace-nowrap shadow-xs"
        >
          + Thêm
        </button>
      </div>

      {options.length > 0 && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {options.map((opt) => (
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
                  onClick={() => onRemoveOption(opt.id)}
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
  );
}
