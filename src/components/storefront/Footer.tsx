"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, Phone, Clock, MessageSquare, ShieldCheck, Heart, Zap } from "lucide-react";
import { SHOP_ENV } from "@/config/shopEnv";

export function Footer() {
  const { theme, config } = useTheme();

  const footerStyles = {
    default: {
      bgStyle: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
      borderColor: "border-slate-800",
      accentText: "text-orange-400",
      hotlineBtn: "bg-orange-600 hover:bg-orange-700",
      greetingBanner: null,
    },
    tet: {
      bgStyle: "linear-gradient(180deg, #2b0404 0%, #130202 100%)",
      borderColor: "border-amber-500/30",
      accentText: "text-amber-300",
      hotlineBtn: "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700",
      greetingBanner: {
        text: "🧧 KHAI XUÂN NHƯ Ý - VẠN SỰ CÁT TƯỜNG - TẤN TÀI TẤN LỘC! 🌸",
        badgeBg: "bg-red-950/80 text-amber-200 border-amber-400/40",
      },
    },
    noel: {
      bgStyle: "linear-gradient(180deg, #1c0505 0%, #06150e 100%)",
      borderColor: "border-red-900/50",
      accentText: "text-emerald-400",
      hotlineBtn: "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800",
      greetingBanner: {
        text: "🎄 CHÚC MÙNG GIÁNG SINH & NĂM MỚI AN LÀNH TỪ TIỆM CHÈ NA! 🎅❄️",
        badgeBg: "bg-red-950/80 text-white border-red-500/40",
      },
    },
    halloween: {
      bgStyle: "linear-gradient(180deg, #170226 0%, #08010f 100%)",
      borderColor: "border-purple-900/50",
      accentText: "text-orange-400",
      hotlineBtn: "bg-gradient-to-r from-purple-800 to-orange-600 hover:from-purple-900 hover:to-orange-700",
      greetingBanner: {
        text: "🎃 HAPPY HALLOWEEN - ĐÊM HỘI BÍ NGÔ MA MỊ & ĂN VẶT THẢ GA! 👻🦇",
        badgeBg: "bg-purple-950/80 text-orange-200 border-orange-500/40",
      },
    },
  };

  const style = footerStyles[theme] || footerStyles.default;

  return (
    <footer
      id="lien-he"
      style={{ background: style.bgStyle }}
      className={`text-slate-200 pt-12 pb-8 border-t ${style.borderColor} relative overflow-hidden transition-colors duration-500`}
    >
      {/* Noel Snow Trim along Top edge of Footer */}
      {theme === "noel" && (
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-white/90 via-white to-white/90 rounded-b-full shadow-sm" />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Festive Greeting Banner if active */}
        {style.greetingBanner && (
          <div className="mb-10 text-center">
            <span
              className={`inline-block text-xs sm:text-sm font-black tracking-wide px-5 py-2 rounded-full border shadow-lg ${style.greetingBanner.badgeBg}`}
            >
              {style.greetingBanner.text}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Tiệm Chè Na"
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/40 shadow-md"
              />
              <span className="font-extrabold text-2xl text-white tracking-tight">
                TIỆM CHÈ <span className={config.colors.accentText}>NA</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Điểm hẹn ăn vặt & chè thanh mát hàng đầu khu vực Vũ Lăng, Ngũ Hiệp, Thanh Trì. Thực đơn món ăn vặt phong phú, chè tráng miệng gia truyền thanh mát chuẩn vị.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={`https://zalo.me/${SHOP_ENV.zaloPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 font-bold transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Zalo Quán</span>
              </a>
              {SHOP_ENV.hotline && (
                <a
                  href={`tel:${SHOP_ENV.hotline}`}
                  className={`${style.hotlineBtn} text-white py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 font-bold transition shadow-sm`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Hotline</span>
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Liên hệ & Địa chỉ */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Thông Tin Quán</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <MapPin className={`w-4 h-4 ${style.accentText} shrink-0 mt-0.5`} />
                <a
                  href={SHOP_ENV.mapsUrl || "https://www.google.com/maps/place/Ti%E1%BB%87m+Ch%C3%A8+Na"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-white transition"
                  title="Mở chỉ đường trên Google Maps"
                >
                  Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội (Gần chợ Ngũ Hiệp & Tecco)
                </a>
              </li>
              {SHOP_ENV.hotline && (
                <li className="flex items-center gap-2">
                  <Phone className={`w-4 h-4 ${style.accentText} shrink-0`} />
                  <a href={`tel:${SHOP_ENV.hotline}`} className={`hover:underline font-bold ${style.accentText}`}>
                    {SHOP_ENV.hotline}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${style.accentText} shrink-0`} />
                <span>09:00 - 22:30 hàng ngày</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Danh mục & Liên kết nhanh */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Khám Phá Thực Đơn</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#menu" className="hover:text-white transition font-medium">🍽️ Toàn Bộ Thực Đơn Món Ăn</a></li>
              <li><a href="#mon-hot" className="hover:text-white transition font-medium">🔥 Món Bán Chạy Đặc Sản</a></li>
              <li><a href="#danh-gia" className="hover:text-white transition font-medium">⭐ Đánh Giá Từ Thực Khách</a></li>
              <li><a href="#menu" className="hover:text-white transition font-medium">🛒 Hướng Dẫn Đặt Món Online</a></li>
              <li><a href={`https://zalo.me/${SHOP_ENV.zaloPhone}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition font-medium">💬 Đặt Tiệc / Tư Vấn Zalo</a></li>
            </ul>
          </div>

          {/* Col 4: Cam kết phục vụ */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Cam Kết Tiệm Chè Na</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Nguyên liệu tươi sạch, an toàn</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>Giao nhanh nóng hổi trong 30 phút</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Nêm nếm chuẩn vị gia truyền</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Tiệm Chè Na. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for Tiệm Chè Na Thanh Trì
          </p>
        </div>
      </div>
    </footer>
  );
}
