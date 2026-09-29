"use client";

import React from "react";
import { Droplet, Package, Sprout, CookingPot, ShieldCheck } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function TrustSection() {
  const { config } = useTheme();
  const safetyCards = [
    {
      icon: Droplet,
      title: "Dầu Chiên Mới 100%",
      desc: "Nói không với dầu chiên đi chiên lại. Đồ ăn vàng ươm, thơm rụm giòn tan, không hề ám khét.",
    },
    {
      icon: Package,
      title: "Bao Bì Sạch Vệ Sinh",
      desc: "Hộp đựng giấy an toàn thực phẩm, đá và thạch đóng riêng biệt tinh tươm giữ trọn độ ngon.",
    },
    {
      icon: Sprout,
      title: "Rau Củ Tươi Trong Ngày",
      desc: "Rau sống, xoài, cóc, dưa chuột được rửa nước muối sạch bong, giòn ngọt thanh khiết.",
    },
    {
      icon: CookingPot,
      title: "Chè Nấu Mới Mỗi Ngày",
      desc: "Nước cốt dừa thơm ngậy tự nhiên, caramen béo mịn không rỗ, hoàn toàn không chất bảo quản.",
    },
  ];

  return (
    <section
      id="cam-ket"
      style={{ backgroundColor: config.colors.sectionBg }}
      className={`py-14 lg:py-20 border-t ${config.colors.sectionBorder} transition-colors duration-500`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-3 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cam Kết An Toàn Thực Phẩm
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Chất Lượng Vệ Sinh & An Toàn Tuyệt Đối
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Mỗi món ăn gửi đến bạn đều được chuẩn bị với sự tận tâm và tiêu chuẩn sạch sẽ hàng đầu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safetyCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100/80 group-hover:bg-emerald-200/80 flex items-center justify-center text-emerald-700 mb-5 transition-colors shadow-xs">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mb-3">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
