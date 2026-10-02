"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { HeaderFestiveDecor } from "@/components/theme/HeaderFestiveDecor";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";
import {
  ShoppingBag,
  PhoneCall,
  Flame,
  UtensilsCrossed,
  ShieldCheck,
  SearchCode,
  ClipboardList
} from "lucide-react";

interface HeaderProps {
  onOpenTracking: () => void;
}

export function Header({ onOpenTracking }: HeaderProps) {
  const { totalItemCount, setIsCartOpen, isLoaded } = useCart();
  const { config, theme } = useTheme();

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b ${config.colors.headerBorder} shadow-sm relative`}>
      {/* Festive Decorations across Header */}
      <HeaderFestiveDecor />

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3.5 group py-1 relative">
            <div className="relative">
              <img
                src="/logo.png"
                alt="Tiệm Chè Na Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform border border-amber-200 shrink-0"
              />
              {/* Seasonal Logo Hat/Accent */}
              {theme === "noel" && (
                <span className="absolute -top-3.5 -right-1 text-2xl -rotate-12 pointer-events-none select-none drop-shadow-md animate-bounce">
                  🎅
                </span>
              )}
              {theme === "tet" && (
                <span className="absolute -top-2.5 -right-2 text-xl pointer-events-none select-none drop-shadow-md animate-pulse">
                  🏮
                </span>
              )}
              {theme === "halloween" && (
                <span className="absolute -top-3 -right-2 text-xl pointer-events-none select-none drop-shadow-md animate-pulse">
                  🧙
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <span className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tight leading-none">
                TIỆM CHÈ <span className={config.colors.accentText}>NA</span>
              </span>
              {theme !== "default" && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 w-fit shadow-2xs ${config.colors.tagColor}`}>
                  <span>{config.emoji}</span>
                  <span>{config.name}</span>
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <a href="#mon-hot" className="hover:text-orange-600 transition flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" /> Món Hot
            </a>
            <a href="#menu" className="hover:text-orange-600 transition flex items-center gap-1">
              <UtensilsCrossed className="w-4 h-4 text-amber-500" /> Thực Đơn
            </a>
            <a href="#cam-ket" className="hover:text-orange-600 transition flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Chuẩn ATTP
            </a>
            <button
              onClick={onOpenTracking}
              className="hover:text-orange-600 transition flex items-center gap-1 text-slate-600 cursor-pointer"
            >
              <SearchCode className="w-4 h-4 text-blue-500" /> Tra Cứu Đơn
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Hotline Call */}
            <a
              href="tel:0986479285"
              className="hidden sm:flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold px-3.5 py-2 rounded-xl transition border border-orange-200/60 text-sm"
            >
              <PhoneCall className="w-4 h-4 text-orange-600 animate-bounce" />
              <span>0986.479.285</span>
            </a>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative flex items-center gap-2 ${config.colors.cartButton} text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer`}
            >
              <ButtonFestiveDecorator />
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Giỏ Hàng</span>
              {isLoaded && totalItemCount > 0 && (
                <span className={`${config.colors.cartBadge} text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-scale`}>
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
