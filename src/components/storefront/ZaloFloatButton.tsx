"use client";

import React from "react";
import { SHOP_ENV } from "@/config/shopEnv";

/**
 * Nút nổi Zalo — cùng kiểu dáng / kích thước với bong bóng trợ lý ảo,
 * đặt ngay phía trên để khách chốt đơn qua Zalo nhanh hơn.
 */
export function ZaloFloatButton() {
  const phone = (SHOP_ENV.zaloPhone || "").replace(/[^0-9]/g, "");
  const href = phone ? `https://zalo.me/${phone}` : "https://zalo.me";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nhắn Zalo đặt món"
      title="Nhắn Zalo đặt món"
      className="animate-zalo-glow relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0a8bff] to-[#0057d9] text-white transition-transform hover:scale-105 active:scale-95"
    >
      {/* Hai vòng sóng lan tỏa lệch nhịp quanh nút */}
      <span
        aria-hidden="true"
        className="animate-zalo-halo pointer-events-none absolute inset-0 rounded-full border-[3px] border-[#1a9bff]"
      />
      <span
        aria-hidden="true"
        className="animate-zalo-halo pointer-events-none absolute inset-0 rounded-full border-[3px] border-[#4db2ff]"
        style={{ animationDelay: "1.1s" }}
      />
      <span className="relative flex flex-col items-center leading-none">
        <ZaloGlyph className="h-5 w-5" />
        <span className="mt-[3px] text-[9px] font-black tracking-[0.02em]">Zalo</span>
      </span>
    </a>
  );
}

function ZaloGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <path
        d="M20.1 5.5C11.9 5.5 5.3 10.9 5.3 17.6c0 3.9 2.1 7.4 5.4 9.7.4 1.6-.2 3.7-1.6 5.9-.3.5.1 1.1.6 1 2.8-.6 5.1-1.9 6.6-3.1 1.2.2 2.5.4 3.8.4 8.2 0 14.8-5.5 14.8-12.2S28.3 5.5 20.1 5.5z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
