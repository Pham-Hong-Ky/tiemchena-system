"use client";

import React from "react";
import { Sparkles, ExternalLink, Heart } from "lucide-react";

const GOOGLE_FORM_URL =
  process.env.NEXT_PUBLIC_GOOGLE_FORM_URL ||
  "https://docs.google.com/forms/d/e/1FAIpQLScpQ02TBTfAp16j6VEGQGpKa1kX_HRPHBv5ogLCjvzbhbnQbg/viewform?embedded=true";

export function CustomerSurveySection() {
  const directLink = GOOGLE_FORM_URL.replace("?embedded=true", "");

  return (
    <section id="khao-sat" className="py-12 sm:py-16 bg-gradient-to-b from-transparent via-orange-50/50 to-orange-100/40 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-2.5 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Lắng Nghe Thực Khách</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Khảo Sát Ý Kiến & Món Ăn Yêu Thích
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Dành 1 phút chia sẻ cảm nhận và món ăn yêu thích để giúp{" "}
            <strong className="text-orange-600">Tiệm Chè Na</strong> phục vụ quý khách ngày một chu đáo hơn!
          </p>
        </div>

        {/* Khung Google Form nhúng trực tiếp */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-500/5 border border-slate-200/90 overflow-hidden">
          {/* Header Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                📝
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">Phiếu Khảo Sát Tiệm Chè Na</h3>
                <p className="text-[11px] text-orange-100">Điền số điện thoại & món ăn yêu thích của bạn</p>
              </div>
            </div>

            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition-colors backdrop-blur-xs shrink-0"
            >
              <span>Mở tab mới</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Iframe Form */}
          <div className="w-full bg-slate-50 flex justify-center">
            <iframe
              src={GOOGLE_FORM_URL}
              className="w-full min-h-[750px] sm:min-h-[850px] border-0"
              loading="lazy"
              title="Google Form Khảo Sát Khách Hàng Tiệm Chè Na"
            >
              Đang tải biểu mẫu khảo sát...
            </iframe>
          </div>

          {/* Card Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/70 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
            <span>Tiệm Chè Na trân trọng từng ý kiến đóng góp của bạn</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </section>
  );
}
