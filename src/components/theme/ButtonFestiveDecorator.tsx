"use client";

import React from "react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";

interface ButtonFestiveDecoratorProps {
  overrideTheme?: ThemeMode;
  compact?: boolean;
}

/**
 * Renders rich seasonal decorative accents directly on buttons,
 * exactly matching the reference design:
 * - Noel: Fluffy white snow caps top & bottom, cute Snowman + Xmas Tree on left, snowballs on right.
 * - Tết: Golden coins & red lucky envelope on left, blooming golden apricot blossoms on right.
 * - Halloween: Glowing Jack-o'-Lantern on left, flying bats & dangling spider on right.
 */
export function ButtonFestiveDecorator({
  overrideTheme,
  compact = false,
}: ButtonFestiveDecoratorProps) {
  const { theme: contextTheme } = useTheme();
  const activeTheme = overrideTheme || contextTheme;

  if (activeTheme === "noel") {
    return (
      <div className="pointer-events-none select-none">
        {/* Top Snow Cap */}
        <div className="snow-cap-layer-top" />

        {/* Bottom Snow Drift */}
        <div className="snow-cap-layer-bottom" />

        {/* Left Side: Snowman & Christmas Tree */}
        <div className="absolute -left-2.5 sm:-left-3.5 -bottom-1 flex items-end text-sm sm:text-base z-20 drop-shadow-md">
          <span className="scale-x-[-1]">☃️</span>
          <span className="-ml-1 text-xs">🎄</span>
        </div>

        {/* Right Side: Snowballs & Snowflake */}
        <div className="absolute -right-2.5 sm:-right-3.5 -bottom-1 flex items-end text-xs sm:text-sm z-20 drop-shadow-md">
          <span className="text-[11px] animate-pulse">❄️</span>
          <span>☃️</span>
        </div>
      </div>
    );
  }

  if (activeTheme === "tet") {
    return (
      <div className="pointer-events-none select-none">
        {/* Left Side: Stack of Golden Lucky Coins & Red Envelope */}
        <div className="absolute -left-3 sm:-left-4 -bottom-1.5 flex items-center text-sm sm:text-base z-20 drop-shadow-md">
          <span className="transform -rotate-12 text-sm sm:text-base">🪙</span>
          <span className="-ml-1 text-xs">🧧</span>
        </div>

        {/* Right Side: Blooming Golden Apricot Blossoms & Peach Flowers */}
        <div className="absolute -right-3.5 sm:-right-4.5 -bottom-1.5 flex items-center text-sm sm:text-base z-20 drop-shadow-md">
          <span className="text-amber-300 drop-shadow-sm animate-pulse">🏵️</span>
          <span className="text-yellow-300 -ml-1 text-xs">🌸</span>
        </div>

        {/* Top-Right Mini Blossom Accent */}
        <div className="absolute -top-2 right-4 text-[11px] z-20 drop-shadow-xs">
          <span>🌸</span>
        </div>
      </div>
    );
  }

  if (activeTheme === "halloween") {
    return (
      <div className="pointer-events-none select-none">
        {/* Left Side: Glowing Jack-o'-Lantern Pumpkin */}
        <div className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 flex items-center text-base sm:text-lg z-20 drop-shadow-md animate-pulse">
          <span>🎃</span>
        </div>

        {/* Top Edge: Flying Bats */}
        <div className="absolute -top-2.5 left-4 flex items-center gap-2 text-[11px] text-slate-900 z-20 opacity-90">
          <span>🦇</span>
          <span className="hidden sm:inline">🦇</span>
        </div>

        {/* Right Side: Dangling Spider on Web */}
        <div className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 flex items-center text-xs sm:text-sm z-20 drop-shadow-md">
          <span className="text-purple-300 opacity-80 text-xs">🕸️</span>
          <span className="-ml-1">🕷️</span>
        </div>
      </div>
    );
  }

  return null;
}
