"use client";

import React from "react";
import { useTheme, THEME_CONFIGS, ThemeMode } from "@/context/ThemeContext";
import { toast } from "@/context/ToastContext";
import { Sparkles, Check, Palette, ExternalLink } from "lucide-react";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    toast.success(`Đã áp dụng giao diện: ${THEME_CONFIGS[mode].name}`, "Chủ đề giao diện");
  };

  const themeList = Object.values(THEME_CONFIGS);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-orange-600" />
            <span>Chủ Đề Giao Diện Lễ Hội (Theme Festival)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Chọn chủ đề theo mùa. Toàn bộ nút bấm, banner, màu sắc và hiệu ứng trên trang khách hàng sẽ tự động thay đổi theo chủ đề được chọn.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition shrink-0"
        >
          <span>Xem trang khách hàng</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Grid of Theme Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {themeList.map((item) => {
          const isActive = theme === item.id;

          // Theme card background styles
          const cardStyle = {
            default: "hover:border-orange-300 hover:bg-orange-50/20",
            tet: "hover:border-red-300 hover:bg-red-50/20",
            noel: "hover:border-emerald-300 hover:bg-emerald-50/20",
            halloween: "hover:border-purple-300 hover:bg-purple-50/20",
          }[item.id];

          const activeBorder = {
            default: "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30",
            tet: "border-red-500 ring-2 ring-red-500/20 bg-red-50/30",
            noel: "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30",
            halloween: "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/30",
          }[item.id];

          return (
            <div
              key={item.id}
              onClick={() => handleSelectTheme(item.id)}
              className={`relative rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between group ${
                isActive ? activeBorder : `border-slate-200 bg-white ${cardStyle}`
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute -top-2.5 right-3 bg-slate-900 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  <span>ĐANG BẬT</span>
                </div>
              )}

              {/* Theme Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-orange-600 transition">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.tagline}
                    </p>
                  </div>
                </div>

                {/* Banner Gradient Preview Bar */}
                <div
                  style={{ background: item.colors.heroGradientStyle }}
                  className="h-9 rounded-xl shadow-inner relative flex items-center justify-center text-white text-[11px] font-black tracking-wide mb-3 overflow-hidden"
                >
                  <ButtonFestiveDecorator overrideTheme={item.id} />
                  <span className="relative z-10 drop-shadow-md">
                    {item.emoji} {item.id.toUpperCase()} STYLE
                  </span>
                </div>

                {/* Button Style Demo */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    DEMO NÚT BẤM:
                  </span>
                  <div
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black text-center transition flex items-center justify-center relative overflow-visible ${item.colors.primaryBtn}`}
                  >
                    <ButtonFestiveDecorator overrideTheme={item.id} />
                    <span className="relative z-10 drop-shadow-xs">
                      {item.id === "halloween" ? "🎃 " : ""}Đặt Món Ngay
                    </span>
                  </div>
                </div>
              </div>

              {/* Select Button */}
              <button
                type="button"
                className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isActive ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Chủ Đề Hiện Tại</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Áp Dụng Theme</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
