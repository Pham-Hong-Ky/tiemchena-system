"use client";

import React from "react";
import { Flame, Heart, Plus, Star, type LucideIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";
import { ProductType } from "@/types";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignatureDishConfig {
  badgeIcon: LucideIcon;
  badgeLabel: string;
  badgeColor: string;
  gradientClass: string;
  borderClass: string;
}

interface SignatureDishCardProps {
  product: ProductType;
  config: SignatureDishConfig;
  onAdd: () => void;
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function SignatureDishCard({ product, config, onAdd }: SignatureDishCardProps) {
  const { config: themeConfig } = useTheme();
  const {
    badgeIcon: BadgeIcon,
    badgeLabel,
    badgeColor,
    gradientClass,
    borderClass,
  } = config;

  return (
    <div
      className={`${gradientClass} rounded-3xl p-6 ${borderClass} shadow-lg hover:shadow-xl transition flex flex-col justify-between`}
    >
      <div>
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-5 shadow-sm group">
          <img
            src={getOptimizedImageUrl(product.image, { width: 600, crop: "fill" })}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div
            className={`absolute top-3 left-3 ${badgeColor} text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1`}
          >
            <BadgeIcon className="w-3.5 h-3.5" /> {badgeLabel}
          </div>
        </div>

        {/* Title */}
        <div className="mb-2">
          <h3 className="font-extrabold text-xl text-slate-900 leading-snug">{product.name}</h3>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-3">
          {product.description}
        </p>
      </div>

      {/* Actions: Price on Left, + Chọn Món Green Button on Right */}
      <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
        <span className="font-black text-xl sm:text-2xl text-[#c2410c] shrink-0">
          {product.price.toLocaleString("vi-VN")}đ
        </span>
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-1.5 bg-[#15803d] hover:bg-[#166534] text-white py-2.5 px-5 rounded-xl font-extrabold text-sm sm:text-base cursor-pointer transition active:scale-95 shadow-md"
        >
          <span>+ Chọn Món</span>
        </button>
      </div>
    </div>
  );
}

// ─── Config per dish ─────────────────────────────────────────────────────────

const NEM_NUONG_CONFIG: SignatureDishConfig = {
  badgeIcon: Flame,
  badgeLabel: "BEST-SELLER SỐ 1",
  badgeColor: "bg-red-600",
  gradientClass: "bg-gradient-to-br from-orange-50/50 to-amber-50/30",
  borderClass: "border border-orange-200/70",
};

const CHE_XOAI_CONFIG: SignatureDishConfig = {
  badgeIcon: Heart,
  badgeLabel: "MÓN CHÈ TƯƠI MÁT",
  badgeColor: "bg-amber-500",
  gradientClass: "bg-gradient-to-br from-amber-50/50 to-yellow-50/30",
  borderClass: "border border-amber-200/70",
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface SignatureDishesProps {
  products: ProductType[];
  onOpenCustomize: (product: ProductType) => void;
}

export function SignatureDishes({ products, onOpenCustomize }: SignatureDishesProps) {
  const { addToCart } = useCart();
  const { config: themeConfig, theme } = useTheme();

  const nemNuong = products.find((p) => p.slug.includes("nem-nuong")) || products[0];
  const cheXoai = products.find((p) => p.slug.includes("che-xoai")) || products[1];

  if (!nemNuong && !cheXoai) return null;

  return (
    <section
      id="mon-hot"
      style={{ backgroundColor: themeConfig.colors.sectionBg }}
      className={`py-12 lg:py-16 border-y ${themeConfig.colors.sectionBorder} transition-colors duration-500`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className={`inline-flex items-center gap-1.5 ${themeConfig.colors.tagColor} text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-2`}>
            {theme !== "default" ? <span>{themeConfig.emoji}</span> : <Flame className="w-3.5 h-3.5" />}
            Bán Chạy Nhất Tại Tiệm
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            2 Món Vạn Người Mê Tại Tiệm Chè Na
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Chưa thử 2 món này là chưa thực sự trải nghiệm trọn vẹn hương vị đặc sắc của Tiệm Chè Na!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {nemNuong && (
            <SignatureDishCard
              product={nemNuong}
              config={NEM_NUONG_CONFIG}
              onAdd={() => onOpenCustomize(nemNuong)}
            />
          )}
          {cheXoai && (
            <SignatureDishCard
              product={cheXoai}
              config={CHE_XOAI_CONFIG}
              onAdd={() => onOpenCustomize(cheXoai)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
