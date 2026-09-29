"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export function HeaderFestiveDecor() {
  const { theme } = useTheme();

  if (theme === "noel") {
    return (
      <div className="pointer-events-none select-none overflow-hidden">
        {/* Christmas Fairy Lights String along the bottom edge */}
        <div className="absolute -bottom-2 left-0 right-0 flex justify-around items-center px-4 overflow-hidden z-20">
          {[...Array(24)].map((_, i) => {
            const colors = [
              "text-red-500",
              "text-amber-400",
              "text-emerald-400",
              "text-blue-400",
              "text-rose-400",
            ];
            const blinkClasses = [
              "animate-fairy-blink-1",
              "animate-fairy-blink-2",
              "animate-fairy-blink-3",
            ];
            const colorClass = colors[i % colors.length];
            const blinkClass = blinkClasses[i % blinkClasses.length];

            return (
              <div key={i} className="flex flex-col items-center">
                <span className="w-1 h-1.5 bg-slate-700/80 rounded-t-xs" />
                <span
                  className={`w-2.5 h-3.5 rounded-full ${colorClass} ${blinkClass} bg-current shadow-sm`}
                />
              </div>
            );
          })}
        </div>

        {/* Hanging Mistletoe & Bells in Header corners */}
        <div className="absolute top-1 left-2 hidden md:flex items-center gap-1 text-sm opacity-90">
          <span>🎄</span>
          <span className="text-[10px] font-black text-emerald-800 tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            MÙA GIÁNG SINH
          </span>
        </div>
        <div className="absolute top-1 right-2 hidden md:flex items-center gap-1 text-sm opacity-90">
          <span>🔔</span>
          <span className="text-[10px] font-black text-red-800 tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            NĂM MỚI AN LÀNH
          </span>
        </div>
      </div>
    );
  }

  if (theme === "tet") {
    return (
      <div className="pointer-events-none select-none overflow-hidden">
        {/* Swinging Red Lanterns on left and right */}
        <div className="absolute top-1 left-3 flex items-center gap-1.5">
          <div className="animate-lantern-swing text-2xl drop-shadow-sm">🏮</div>
          <span className="hidden sm:inline text-[10px] font-black text-red-700 tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            KHAI XUÂN PHÁT TÀI
          </span>
        </div>

        <div className="absolute top-1 right-3 flex items-center gap-1.5">
          <span className="hidden sm:inline text-[10px] font-black text-amber-800 tracking-wider bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            VẠN SỰ NHƯ Ý
          </span>
          <div className="animate-lantern-swing text-2xl drop-shadow-sm" style={{ animationDelay: "0.8s" }}>
            🏮
          </div>
        </div>

        {/* Tiny Firecracker & Blossom Garland */}
        <div className="absolute bottom-0 left-1/4 right-1/4 hidden lg:flex justify-center gap-4 text-xs opacity-75">
          <span>🌸</span>
          <span>🧨</span>
          <span>🏵️</span>
          <span>🧧</span>
          <span>🌸</span>
        </div>
      </div>
    );
  }

  if (theme === "halloween") {
    return (
      <div className="pointer-events-none select-none overflow-hidden">
        {/* Spider Web & Dangling Spider on top left */}
        <div className="absolute top-0 left-2 flex flex-col items-center">
          <span className="text-xl opacity-80">🕸️</span>
          <span className="w-[1px] h-3 bg-purple-400/50" />
          <span className="animate-spider-dangle text-xs -mt-1">🕷️</span>
        </div>

        {/* Jack-o'-Lanterns on top right */}
        <div className="absolute top-1 right-3 flex items-center gap-1.5">
          <span className="hidden sm:inline text-[10px] font-black text-orange-700 tracking-wider bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
            HALLOWEEN NIGHT
          </span>
          <span className="text-xl animate-pulse drop-shadow-sm">🎃</span>
        </div>
      </div>
    );
  }

  return null;
}
