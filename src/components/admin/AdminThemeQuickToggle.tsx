"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, THEME_CONFIGS, ThemeMode } from "@/context/ThemeContext";
import { toast } from "@/context/ToastContext";
import { Palette, ChevronDown, Check } from "lucide-react";

export function AdminThemeQuickToggle() {
  const { theme, setTheme, config } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themeList = Object.values(THEME_CONFIGS);

  const handleSelect = (mode: ThemeMode) => {
    setTheme(mode);
    setIsOpen(false);
    toast.success(`Đã đổi theme: ${THEME_CONFIGS[mode].name}`, "Chủ đề giao diện");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition cursor-pointer shadow-2xs"
        title="Đổi chủ đề giao diện lễ hội"
      >
        <Palette className="w-3.5 h-3.5 text-orange-600" />
        <span className="text-sm">{config.emoji}</span>
        <span className="hidden md:inline font-bold">{config.name}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Chọn Theme Lễ Hội
            </span>
            <p className="text-[10px] text-slate-500">
              Thay đổi nút bấm & giao diện toàn web
            </p>
          </div>

          <div className="space-y-1">
            {themeList.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                    isSelected
                      ? "bg-orange-50 text-orange-950 font-black border border-orange-200"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{item.emoji}</span>
                    <div className="min-w-0">
                      <span className="block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal block truncate">
                        {item.tagline}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
