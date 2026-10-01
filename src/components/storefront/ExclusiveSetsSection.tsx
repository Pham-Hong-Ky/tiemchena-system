"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";

interface ExclusiveSetsSectionProps {
  onSelectCategory: (categorySlug: string) => void;
}

export function ExclusiveSetsSection({ onSelectCategory }: ExclusiveSetsSectionProps) {
  const { config } = useTheme();

  const handleNavigate = (slug: string) => {
    onSelectCategory(slug);
    const menuElem = document.getElementById("menu");
    if (menuElem) {
      menuElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-10 lg:py-14 bg-gradient-to-b from-amber-50/40 via-orange-50/30 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 text-orange-700 bg-orange-100 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-2.5">
            Bộ Sưu Tập Món Ăn
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hai Bộ Tứ Món Độc Quyền Tiệm Chè Na
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
            Chế biến sạch sẽ • Dầu chiên mới 100% • Giữ nóng giòn đến tận bàn ăn
          </p>
        </div>

        {/* 2 Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Bộ tứ ăn vặt */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-orange-200/60 group bg-slate-900 aspect-[16/10] sm:aspect-[16/9] flex flex-col justify-end p-5 sm:p-7 text-white">
            <img
              src={getOptimizedImageUrl("https://res.cloudinary.com/vhguqaqt/image/upload/v1790778365/tiemchena/menu/banner-do-an.jpg", { width: 800, crop: "fill" })}
              alt="Bộ tứ ăn vặt nóng giòn Tiệm Chè Na"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 space-y-2">
              <span className="inline-block bg-red-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow">
                Bộ Tứ Ăn Vặt Nóng Giòn
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white leading-snug drop-shadow-sm">
                Mỳ Trộn • Nem Nướng • Mỳ Cay • Chân Gà Thái
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow">
                Nóng hổi tận chảo, cay tê đậm vị, giòn rụm kích thích mọi giác quan!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handleNavigate("an-vat-met")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-lg shadow-red-900/30 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Xem Menu Ăn Vặt & Mẹt</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Bộ tứ giải nhiệt */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-amber-200/60 group bg-slate-900 aspect-[16/10] sm:aspect-[16/9] flex flex-col justify-end p-5 sm:p-7 text-white">
            <img
              src={getOptimizedImageUrl("https://res.cloudinary.com/vhguqaqt/image/upload/v1790778362/tiemchena/menu/banner-che.jpg", { width: 800, crop: "fill" })}
              alt="Bộ tứ giải nhiệt thanh mát Tiệm Chè Na"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 space-y-2">
              <span className="inline-block bg-blue-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow">
                Bộ Tứ Giải Nhiệt Thanh Mát
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white leading-snug drop-shadow-sm">
                Chè Xoài • Trà Sữa • Tào Phớ • Sữa Chua Mít
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow">
                Cốt dừa béo ngậy nguyên chất, caramen mịn tan, ngọt thanh không ngấy!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handleNavigate("che-do-uong")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-lg shadow-black/20 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Xem Menu Chè & Đồ Uống</span>
                  <ArrowRight className="w-4 h-4 text-orange-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
