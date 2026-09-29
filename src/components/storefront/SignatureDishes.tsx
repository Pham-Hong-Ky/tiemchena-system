"use client";

import React from "react";
import { Flame, Heart, Plus, Star, type LucideIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";
import { ProductType } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignatureDishConfig {
  badgeIcon: LucideIcon;
  badgeLabel: string;
  badgeColor: string;
  rating: string;
  gradientClass: string;
  borderClass: string;
  tags: string[];
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
    rating,
    gradientClass,
    borderClass,
    tags,
  } = config;

  return (
    <div
      className={`${gradientClass} rounded-3xl p-6 ${borderClass} shadow-lg hover:shadow-xl transition flex flex-col justify-between`}
    >
      <div>
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-5 shadow-sm group">
          <img
            src={
              product.image ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div
            className={`absolute top-3 left-3 ${badgeColor} text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1`}
          >
            <BadgeIcon className="w-3.5 h-3.5" /> {badgeLabel}
          </div>
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {rating}
          </div>
        </div>

        {/* Title & Price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-extrabold text-xl text-slate-900 leading-snug">{product.name}</h3>
          <span className={`font-black text-xl ${themeConfig.colors.accentText} shrink-0`}>
            {product.price.toLocaleString("vi-VN")}đ
          </span>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-3">
          {product.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700 mb-6">
          {tags.map((tag) => (
            <span key={tag} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2">
        <button
          onClick={onAdd}
          className={`w-full inline-flex items-center justify-center gap-2 ${themeConfig.colors.primaryBtn} py-3 px-4 rounded-xl font-bold cursor-pointer transition active:scale-95 shadow-md`}
        >
          <ButtonFestiveDecorator />
          <Plus className="w-4 h-4" /> Thêm Vào Giỏ
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
  rating: "4.9 (500+ đánh giá)",
  gradientClass: "bg-gradient-to-br from-orange-50/50 to-amber-50/30",
  borderClass: "border border-orange-200/70",
  tags: ["🥢 Kèm bánh tráng & rau tươi", "🥣 Sốt chấm thịt băm độc quyền"],
};

const CHE_XOAI_CONFIG: SignatureDishConfig = {
  badgeIcon: Heart,
  badgeLabel: "CHÈ HOT TRIỆU VIEW",
  badgeColor: "bg-amber-500",
  rating: "5.0 (420+ đánh giá)",
  gradientClass: "bg-gradient-to-br from-amber-50/50 to-yellow-50/30",
  borderClass: "border border-amber-200/70",
  tags: ["🥭 Xoài chín ngọt thanh", "🍮 Caramen mềm mướt béo ngậy"],
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
