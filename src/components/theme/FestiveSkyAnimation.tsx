"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export function FestiveSkyAnimation() {
  const { theme } = useTheme();

  if (theme === "noel") {
    return (
      <div className="absolute top-3 left-0 right-0 pointer-events-none select-none overflow-hidden h-20 z-10">
        <div className="animate-fly-across flex items-center gap-1.5 text-2xl drop-shadow-md">
          <span>✨</span>
          <span>🦌</span>
          <span>🦌</span>
          <span>🛷</span>
          <span className="text-xl">🎅</span>
          <span className="text-xs bg-white/20 backdrop-blur-xs text-white px-2 py-0.5 rounded-full font-bold ml-1 border border-white/30 hidden sm:inline">
            Ho! Ho! Ho! Merry Christmas!
          </span>
        </div>
      </div>
    );
  }

  if (theme === "tet") {
    return (
      <div className="absolute top-3 left-0 right-0 pointer-events-none select-none overflow-hidden h-20 z-10">
        <div className="animate-fly-across flex items-center gap-2 text-2xl drop-shadow-md" style={{ animationDuration: "26s" }}>
          <span>✨</span>
          <span>🕊️</span>
          <span>🏮</span>
          <span>🕊️</span>
          <span className="text-xs bg-red-900/60 backdrop-blur-xs text-amber-200 px-2 py-0.5 rounded-full font-bold border border-amber-300/40 hidden sm:inline">
            Chúc Mừng Năm Mới 🧧
          </span>
        </div>
      </div>
    );
  }

  if (theme === "halloween") {
    return (
      <div className="absolute top-3 left-0 right-0 pointer-events-none select-none overflow-hidden h-20 z-10">
        <div className="animate-fly-across flex items-center gap-2 text-2xl drop-shadow-md" style={{ animationDuration: "20s" }}>
          <span>🌕</span>
          <span>🧙‍♀️</span>
          <span>🧹</span>
          <span>🦇</span>
          <span className="text-xs bg-purple-950/70 backdrop-blur-xs text-orange-200 px-2 py-0.5 rounded-full font-bold border border-orange-400/40 hidden sm:inline">
            Happy Halloween! 🎃
          </span>
        </div>
      </div>
    );
  }

  return null;
}
