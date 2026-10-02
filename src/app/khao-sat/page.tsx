"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Heart, Sparkles } from "lucide-react";

// =========================================================================
// 🎯 BẠN DÁN LINK GOOGLE FORM CỦA BẠN VÀO ĐÂY:
// Ví dụ: "https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform"
// (Hệ thống sẽ tự động tối ưu để nhúng đẹp mắt lên web cho khách hàng)
// =========================================================================
const GOOGLE_FORM_URL =
  process.env.NEXT_PUBLIC_GOOGLE_FORM_URL ||
  "https://docs.google.com/forms/d/e/1FAIpQLScpQ02TBTfAp16j6VEGQGpKa1kX_HRPHBv5ogLCjvzbhbnQbg/viewform?embedded=true";

export default function KhaoSatPage() {
  // Chuẩn hóa link để nhúng vào iframe trên web
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    const clean = url.trim();
    if (clean.includes("forms.gle/")) {
      // Nếu là link rút gọn forms.gle, mở thẳng hoặc dùng link gốc
      return clean;
    }
    if (clean.includes("viewform")) {
      const baseUrl = clean.split("?")[0];
      return `${baseUrl}?embedded=true`;
    }
    if (clean.includes("/d/e/")) {
      return `${clean.replace(/\/+$/, "")}/viewform?embedded=true`;
    }
    return clean;
  };

  const embedUrl = getEmbedUrl(GOOGLE_FORM_URL);
  const isFormConfigured = Boolean(embedUrl);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/70 via-amber-50/30 to-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-orange-600" />
            <span>Về Trang Chủ Tiệm Chè Na</span>
          </Link>

          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Tiệm Chè Na"
              className="w-9 h-9 rounded-full object-cover border border-amber-200 shadow-xs"
            />
            <span className="font-extrabold text-base tracking-tight text-slate-900 hidden sm:inline">
              TIỆM CHÈ <span className="text-orange-600">NA</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-10">
        {/* Tiêu đề & Lời nhắn */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100/80 border border-orange-200/80 text-orange-700 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Khảo Sát Khách Hàng</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Khảo Sát Ý Kiến & Món Ăn Yêu Thích
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Ý kiến đóng góp của quý khách giúp <strong className="text-orange-600">Tiệm Chè Na</strong> phục vụ tốt hơn mỗi ngày. Xin chân thành cảm ơn quý khách!
          </p>
        </div>

        {/* Khung Google Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-500/5 border border-slate-200/80 overflow-hidden relative">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm sm:text-base">Phiếu Khảo Sát Tiệm Chè Na</h2>
              <p className="text-xs text-orange-100">Điền số điện thoại & món yêu thích (chỉ mất ~1 phút)</p>
            </div>
            {isFormConfigured && (
              <a
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition-colors backdrop-blur-xs"
              >
                <span>Mở tab mới</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="w-full relative min-h-[750px] bg-slate-50 flex flex-col items-center justify-center">
            {isFormConfigured ? (
              <iframe
                src={embedUrl}
                className="w-full min-h-[850px] sm:min-h-[900px] border-0"
                loading="lazy"
                title="Khảo sát Tiệm Chè Na"
              >
                Đang tải biểu mẫu...
              </iframe>
            ) : (
              /* Hiển thị khi chưa dán link */
              <div className="p-8 sm:p-12 text-center max-w-lg space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-3xl shadow-inner">
                  📝
                </div>
                <h3 className="font-black text-slate-800 text-lg sm:text-xl">
                  Trang Khảo Sát Đã Sẵn Sàng!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Bạn chỉ cần gửi link Google Form của bạn cho tôi, hoặc dán link vào file{" "}
                  <code className="bg-amber-100 text-amber-900 font-mono px-2 py-0.5 rounded text-xs font-bold">
                    src/app/khao-sat/page.tsx
                  </code>{" "}
                  tại dòng <code className="bg-amber-100 text-amber-900 font-mono px-1.5 py-0.5 rounded text-xs font-bold">GOOGLE_FORM_URL</code>, biểu mẫu khảo sát sẽ hiển thị trực tiếp ngay tại đây để khách hàng vào điền.
                </p>
                <div className="pt-2 text-left bg-orange-50/60 p-4 rounded-2xl border border-orange-200/60 text-xs text-slate-700 space-y-2">
                  <p className="font-bold text-orange-800">📋 Nội dung các câu hỏi gợi ý cho Form:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Họ và tên của quý khách (tùy chọn)</li>
                    <li><strong>Số điện thoại</strong> (để nhận voucher ưu đãi tri ân)</li>
                    <li><strong>Món ăn / chè yêu thích nhất</strong> tại Tiệm Chè Na</li>
                    <li>Độ ngọt và hương vị có vừa miệng bạn không?</li>
                    <li>Góp ý thêm để quán cải thiện</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 text-center text-xs text-slate-400">
        <p className="flex items-center justify-center gap-1">
          Tiệm Chè Na &bull; Cảm ơn quý khách đã gửi phản hồi <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        </p>
      </footer>
    </div>
  );
}
