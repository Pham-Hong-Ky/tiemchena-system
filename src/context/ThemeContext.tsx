"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { FestiveFloatingBuddy } from "@/components/theme/FestiveFloatingBuddy";

export type ThemeMode = "default" | "tet" | "noel" | "halloween";

export interface ThemeColors {
  primaryGradient: string;
  primaryBtn: string;
  secondaryBtn: string;
  heroGradient: string;
  heroGradientStyle: string;
  heroBadge: string;
  cartButton: string;
  cartBadge: string;
  accentText: string;
  headerBorder: string;
  tagColor: string;
  sectionBg: string;
  sectionBorder: string;
}

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  tagline: string;
  emoji: string;
  festiveGreeting: string;
  colors: ThemeColors;
}

export const THEME_CONFIGS: Record<ThemeMode, ThemeConfig> = {
  default: {
    id: "default",
    name: "Tiệm Chè Na Nguyên Bản",
    tagline: "Cam Hổ Phách & Mật Ong Ấm Áp",
    emoji: "🍊",
    festiveGreeting: "ĐẠI TIỆC ĂN VẶT NÓNG HỔI & CHÈ THANH MÁT CHUẨN VỊ!",
    colors: {
      primaryGradient: "from-orange-600 via-orange-500 to-amber-500",
      primaryBtn: "bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 relative",
      secondaryBtn: "bg-white hover:bg-orange-50 text-orange-600 border border-orange-200",
      heroGradient: "bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500",
      heroGradientStyle: "linear-gradient(135deg, #c2410c 0%, #ea580c 45%, #d97706 100%)",
      heroBadge: "bg-white/20 text-white border-white/30",
      cartButton: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 relative",
      cartBadge: "bg-white text-orange-600",
      accentText: "text-orange-600",
      headerBorder: "border-amber-100",
      tagColor: "bg-orange-100 text-orange-800",
      sectionBg: "#edf6ef",
      sectionBorder: "border-emerald-200/50",
    },
  },
  tet: {
    id: "tet",
    name: "Tết Nguyên Đán & Mùa Xuân",
    tagline: "Đỏ May Mắn, Vàng Kim & Hoa Mai",
    emoji: "🧧",
    festiveGreeting: "TẾT SUM VẦY - KHAI XUÂN PHÁT TÀI - RỰC RỠ SẮC HOA!",
    colors: {
      primaryGradient: "from-red-600 via-red-500 to-amber-400",
      primaryBtn: "bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-600/35 ring-1 ring-amber-300/50 relative",
      secondaryBtn: "bg-amber-50 hover:bg-amber-100 text-red-700 border border-amber-300",
      heroGradient: "bg-gradient-to-br from-red-700 via-red-600 to-amber-600",
      heroGradientStyle: "linear-gradient(135deg, #881337 0%, #b91c1c 40%, #991b1b 70%, #78350f 100%)",
      heroBadge: "bg-amber-400/30 text-amber-100 border-amber-300/40",
      cartButton: "bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-600/30 ring-1 ring-amber-300/40 relative",
      cartBadge: "bg-amber-300 text-red-900 font-black",
      accentText: "text-red-600",
      headerBorder: "border-red-200",
      tagColor: "bg-red-100 text-red-800",
      sectionBg: "#fdf5f5",
      sectionBorder: "border-red-200/50",
    },
  },
  noel: {
    id: "noel",
    name: "Giáng Sinh & Năm Mới",
    tagline: "Đỏ Nhung, Xanh Thông & Tuyết Trắng",
    emoji: "🎄",
    festiveGreeting: "GIÁNG SINH RỘN RÀNG - MÙA ĐÔNG ẤM ÁP - ĐÓN NĂM MỚI!",
    colors: {
      primaryGradient: "from-red-600 via-rose-600 to-emerald-600",
      primaryBtn: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/35 border border-red-400/40 relative",
      secondaryBtn: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300",
      heroGradient: "bg-gradient-to-br from-red-900 via-red-800 to-emerald-950",
      heroGradientStyle: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 40%, #831843 70%, #064e3b 100%)",
      heroBadge: "bg-white/20 text-white border-white/40",
      cartButton: "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg shadow-red-600/35 border border-red-400/30 relative",
      cartBadge: "bg-white text-red-700 font-black",
      accentText: "text-red-600",
      headerBorder: "border-red-200",
      tagColor: "bg-red-100 text-red-800",
      sectionBg: "#f0f6fa",
      sectionBorder: "border-sky-200/50",
    },
  },
  halloween: {
    id: "halloween",
    name: "Lễ Hội Bí Ngô Halloween",
    tagline: "Tím Ma Mị & Cam Bí Ngô Neon",
    emoji: "🎃",
    festiveGreeting: "ĐÊM HỘI HALLOWEEN - BÍ NGÔ MA MỊ - ĂN VẶT CỰC ĐÃ!",
    colors: {
      primaryGradient: "from-purple-700 via-purple-800 to-orange-500",
      primaryBtn: "bg-gradient-to-r from-purple-800 via-purple-700 to-orange-500 hover:from-purple-900 hover:to-orange-600 text-white shadow-lg shadow-orange-500/40 ring-1 ring-orange-400/50 relative",
      secondaryBtn: "bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300",
      heroGradient: "bg-gradient-to-br from-purple-950 via-slate-950 to-orange-950",
      heroGradientStyle: "linear-gradient(135deg, #2e0854 0%, #3b0764 45%, #581c87 75%, #7c2d12 100%)",
      heroBadge: "bg-orange-500/30 text-orange-200 border-orange-400/40",
      cartButton: "bg-gradient-to-r from-purple-800 to-orange-500 hover:from-purple-900 hover:to-orange-600 text-white shadow-lg shadow-orange-500/40 ring-1 ring-orange-400/50 relative",
      cartBadge: "bg-orange-500 text-white font-black",
      accentText: "text-purple-600",
      headerBorder: "border-purple-200",
      tagColor: "bg-purple-100 text-purple-800",
      sectionBg: "#f5f0f8",
      sectionBorder: "border-purple-200/50",
    },
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("default");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedTheme = localStorage.getItem("tiemchena_theme") as ThemeMode;
      if (savedTheme && THEME_CONFIGS[savedTheme]) {
        setThemeState(savedTheme);
      }
    } catch {
      // fallback
    }

    // Listen for storage events across tabs or windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tiemchena_theme" && e.newValue && THEME_CONFIGS[e.newValue as ThemeMode]) {
        setThemeState(e.newValue as ThemeMode);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const activeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.default;

  // Single source of truth for applying theme styles to DOM
  useEffect(() => {
    if (!isMounted) return;
    try {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.setProperty("--theme-section-bg", activeConfig.colors.sectionBg);
      document.body.style.backgroundColor = activeConfig.colors.sectionBg;
    } catch (e) {
      console.warn("Error applying theme styling:", e);
    }
  }, [theme, isMounted, activeConfig]);

  const setTheme = (newTheme: ThemeMode) => {
    if (!THEME_CONFIGS[newTheme]) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem("tiemchena_theme", newTheme);
      // Dispatch custom event for immediate same-tab listeners
      window.dispatchEvent(new Event("tiemchena_theme_change"));
    } catch {
      // fallback
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config: activeConfig }}>
      {children}
      {isMounted && <FestiveOverlay theme={theme} />}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// ─── Subtle Festive Visual Overlay (Floating particles & Buddy Mascot) ─────────
function FestiveOverlay({ theme }: { theme: ThemeMode }) {
  if (theme === "default") return null;

  return (
    <>
      {/* Interactive Mascot Buddy */}
      <FestiveFloatingBuddy />

      {/* Floating Atmosphere Particles */}
      {theme === "tet" && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-blossom"
              style={{
                left: `${(i * 7 + 3) % 96}%`,
                animationDuration: `${7 + (i % 6) * 1.5}s`,
                animationDelay: `${(i * 0.7) % 5}s`,
                opacity: 0.75,
                fontSize: `${14 + (i % 4) * 4}px`,
              }}
            >
              {i % 2 === 0 ? "🌸" : "🏵️"}
            </div>
          ))}
        </div>
      )}

      {theme === "noel" && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-snowfall"
              style={{
                left: `${(i * 5.6 + 2) % 97}%`,
                animationDuration: `${5.5 + (i % 5) * 1.6}s`,
                animationDelay: `${(i * 0.5) % 4}s`,
                opacity: 0.85,
                fontSize: `${13 + (i % 4) * 5}px`,
              }}
            >
              ❄️
            </div>
          ))}
        </div>
      )}

      {theme === "halloween" && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bat"
              style={{
                left: `${(i * 11 + 5) % 92}%`,
                animationDuration: `${9 + (i % 4) * 2}s`,
                animationDelay: `${i * 1.1}s`,
                opacity: 0.7,
                fontSize: `${16 + (i % 3) * 6}px`,
              }}
            >
              {i % 2 === 0 ? "🦇" : "👻"}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
