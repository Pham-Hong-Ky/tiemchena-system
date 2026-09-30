"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Flame,
  Utensils,
  MessageSquare,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { FestiveSkyAnimation } from "@/components/theme/FestiveSkyAnimation";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";

import { ProductType } from "@/types";

interface HeroBannerProps {
  products?: ProductType[];
  onSelectTag: (keyword: string) => void;
}

const STORE_WELCOME_SLIDE = [
  {
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    badge: "TIỆM CHÈ NA",
    badgeColor: "bg-orange-600",
    title: "Tiệm Chè Na — Món Ngon Gia Truyền",
    subtitle: "Thực đơn ăn vặt nóng giòn & chè thanh mát giao tận nơi",
    price: "Menu Trực Tuyến",
  },
];

export function HeroBanner({ products = [], onSelectTag }: HeroBannerProps) {
  const { config, theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter banner items (max 5) or fallback to bestsellers/hot items or default
  const selectedBanner = products.filter((p) => p.isOnBanner && p.isAvailable);
  const bestsellers = products.filter((p) => (p.isBestseller || p.isHot) && p.isAvailable);
  const availableProducts = products.filter((p) => p.isAvailable);

  const bannerProducts =
    selectedBanner.length > 0
      ? selectedBanner.slice(0, 8)
      : bestsellers.length > 0
      ? bestsellers.slice(0, 8)
      : availableProducts.slice(0, 8);

  const badgeColors = ["bg-orange-600", "bg-red-600", "bg-amber-500", "bg-emerald-600", "bg-purple-600"];

  const activeSlides =
    bannerProducts.length === 0
      ? STORE_WELCOME_SLIDE
      : bannerProducts.map((p, idx) => ({
          image: p.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
          badge: p.isBestseller ? "🔥 BÁN CHẠY SỐ 1" : p.isHot ? "🌶️ MÓN GÂY NGHIỆN" : "⚡ ĐẶC SẢN TIỆM",
          badgeColor: badgeColors[idx % badgeColors.length],
          title: p.name,
          subtitle: p.description || (p.category?.name ? `Danh mục: ${p.category.name}` : "Nóng hổi chuẩn vị - Giao tận nơi"),
          price: `${p.price.toLocaleString("vi-VN")}đ`,
        }));

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % (activeSlides.length || 1));
  }, [activeSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % (activeSlides.length || 1));
  }, [activeSlides.length]);

  // Reset currentSlide if out of bounds when slides change
  useEffect(() => {
    if (currentSlide >= activeSlides.length) {
      setCurrentSlide(0);
    }
  }, [activeSlides.length, currentSlide]);

  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const interval = setInterval(nextSlide, 3500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, activeSlides.length]);

  return (
    <section
      style={{ background: config.colors.heroGradientStyle }}
      className={`relative overflow-hidden ${config.colors.heroGradient} text-white pt-10 pb-16 lg:pt-16 lg:pb-24 shadow-inner transition-colors duration-500`}
    >
      {/* Flying Sky Character (Santa's Sleigh, Flying Lantern, Witch on Broom) */}
      <FestiveSkyAnimation />

      {/* Background ambient light effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] drop-shadow-md">
              {theme === "default" ? (
                <>
                  ĐẠI TIỆC ĂN VẶT NÓNG HỔI &{" "}
                  <span className="text-yellow-300 font-serif-display italic drop-shadow-sm">
                    CHÈ THANH MÁT
                  </span>{" "}
                  CHUẨN VỊ!
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider block mb-2 text-yellow-300 drop-shadow-sm">
                    {config.emoji} {config.name.toUpperCase()} {config.emoji}
                  </span>
                  <span className="drop-shadow-sm">{config.festiveGreeting}</span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-white/95 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium drop-shadow-xs">
              Chào mừng bạn đến với <strong>Tiệm Chè Na</strong>! Thưởng thức món ăn vặt nóng giòn, chè thanh mát đậm đà chuẩn vị gia truyền, giao hàng tận tay trong <strong>30 phút</strong>!
            </p>

            {/* Quick Product Tags (Dynamic from real products) */}
            {products.length > 0 && (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                {products.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectTag(p.name)}
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/25 hover:border-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition backdrop-blur-md cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-yellow-300" /> {p.name}: <strong className="text-yellow-200">{Math.round(p.price / 1000)}k</strong>
                  </button>
                ))}
              </div>
            )}

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href="https://zalo.me/0986479285"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-950/20 transition transform active:scale-95"
              >
                <MessageSquare className="w-5 h-5" />
                <span>ĐẶT QUA ZALO</span>
              </a>

              <a
                href="#menu"
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 ${config.colors.secondaryBtn} font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-950/20 transition transform active:scale-95 relative`}
              >
                <ButtonFestiveDecorator />
                <Utensils className="w-5 h-5" />
                <span>XEM MENU ĐẶT MÓN</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20 text-center lg:text-left text-white drop-shadow-xs">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>Giao nhanh 30 phút</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold">
                <Flame className="w-4 h-4 text-yellow-300" />
                <span>Nóng giòn chuẩn vị</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-yellow-300" />
                <span>100% Sạch & An Toàn</span>
              </div>
            </div>
          </div>

          {/* Right Visual Image Showcase Slider */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div
              className="relative w-full max-w-md"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/90 aspect-[4/3] sm:aspect-square group bg-slate-900">
                {/* Slides */}
                {activeSlides.map((slide, index) => {
                  const isActive = index === currentSlide;
                  return (
                    <div
                      key={slide.title + index}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      }`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                      {/* Content overlay */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className={`${slide.badgeColor} text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block shadow-md`}
                          >
                            {slide.badge}
                          </span>
                          <span className="bg-white text-orange-600 text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full shadow-md">
                            {slide.price}
                          </span>
                        </div>
                        <p className="font-extrabold text-base sm:text-lg text-white leading-snug">
                          {slide.title}
                        </p>
                        <p className="text-xs text-orange-200 line-clamp-1 mt-0.5">
                          {slide.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Left/Right Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  aria-label="Slide trước"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Slide tiếp theo"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Progress / Indicator Dots */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {activeSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      aria-label={`Chuyển đến slide ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        index === currentSlide
                          ? "w-5 bg-orange-500"
                          : "w-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
