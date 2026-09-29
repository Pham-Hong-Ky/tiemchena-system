"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { X, Sparkles } from "lucide-react";

export function FestiveFloatingBuddy() {
  const { theme } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSpeech, setShowSpeech] = useState(true);

  if (theme === "default" || isDismissed) return null;

  const buddyConfigs = {
    noel: {
      avatar: "☃️",
      name: "Người Tuyết Na Na",
      tag: "Giáng Sinh Ấm Áp",
      greeting: "Trời lạnh rồi, ghé Tiệm Chè Na làm bát chè nóng nhé! ❄️",
      badgeColor: "bg-red-600 text-white",
      borderColor: "border-red-200",
      speechBg: "bg-white text-slate-800",
    },
    tet: {
      avatar: "🦁",
      name: "Bé Lân Tài Lộc",
      tag: "Khai Xuân Như Ý",
      greeting: "Xuân mới an khang, tấn tài tấn lộc cùng Tiệm Chè Na! 🧧",
      badgeColor: "bg-red-600 text-amber-200",
      borderColor: "border-amber-300",
      speechBg: "bg-amber-50 text-red-950",
    },
    halloween: {
      avatar: "🎃",
      name: "Bí Ngô Jacky",
      tag: "Đêm Hội Ma Mị",
      greeting: "Trick or Treat! Thèm nem nướng giòn rụm chốt đơn ngay! 👻",
      badgeColor: "bg-purple-900 text-orange-400",
      borderColor: "border-orange-400",
      speechBg: "bg-slate-900 text-orange-100",
    },
  };

  const buddy = buddyConfigs[theme as keyof typeof buddyConfigs];
  if (!buddy) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end select-none animate-in slide-in-from-bottom-5 duration-300">
      {/* Speech Bubble */}
      {showSpeech && (
        <div
          className={`mb-2.5 max-w-[220px] p-3 rounded-2xl shadow-xl border ${buddy.borderColor} ${buddy.speechBg} text-xs font-semibold relative animate-in fade-in duration-200`}
        >
          <button
            onClick={() => setShowSpeech(false)}
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-[10px] text-slate-600 cursor-pointer"
            title="Đóng câu thoại"
          >
            <X className="w-2.5 h-2.5" />
          </button>
          <div className="flex items-center gap-1 mb-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${buddy.badgeColor}`}>
              {buddy.tag}
            </span>
          </div>
          <p className="leading-snug pr-2">{buddy.greeting}</p>
          {/* Arrow */}
          <div
            className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45 border-r border-b bg-inherit"
            style={{ borderColor: "inherit" }}
          />
        </div>
      )}

      {/* Mascot Avatar Button */}
      <div className="relative group">
        <button
          onClick={() => setShowSpeech(!showSpeech)}
          className="w-14 h-14 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border-2 border-amber-300 flex items-center justify-center text-3xl transition transform active:scale-90 hover:scale-110 cursor-pointer animate-bob-float"
          title={`Bấm để trò chuyện với ${buddy.name}`}
        >
          <span>{buddy.avatar}</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[8px] text-white font-bold items-center justify-center">
              !
            </span>
          </span>
        </button>

        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-800/80 hover:bg-slate-900 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
          title="Tạm ẩn nhân vật"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
