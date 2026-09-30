"use client";

import React, { useState } from "react";
import { BookOpen, ZoomIn, X, Download } from "lucide-react";

interface MenuImageItem {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  imageUrl: string;
}

const MENU_BOARDS: MenuImageItem[] = [
  {
    id: "board-do-an",
    badge: "BẢNG ĂN VẶT & MẸT",
    badgeColor: "bg-orange-600 text-white",
    title: "Nem Nướng, Mỳ Trộn, Mẹt Nem Lụi & Đồ Chiên",
    description: "Đầy đủ mỳ cay 7 cấp độ, phở cuốn, bánh mì chảo, gà lắc phomai và các loại đồ chiên giòn thơm nức mũi.",
    imageUrl: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778393/tiemchena/menu/menu-do-an.jpg",
  },
  {
    id: "board-che-do-uong",
    badge: "BẢNG CHÈ & ĐỒ UỐNG",
    badgeColor: "bg-teal-600 text-white",
    title: "Chè Xoài, Trà Sữa, Nước Ép & Sinh Tố Bơ",
    description: "Chè dừa dầm, tào phớ caramen, sữa chua mít, trà tắc khổng lồ và các loại sinh tố hoa quả tươi mát lành.",
    imageUrl: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778390/tiemchena/menu/menu-che-va-do-uong.jpg",
  },
  {
    id: "board-chan-ga",
    badge: "CHUYÊN CHÂN GÀ SỐT THÁI",
    badgeColor: "bg-red-600 text-white",
    title: "Chân Gà Sốt Thái, Sả Tắc, Hấp Sả & Xào Cay",
    description: "Suất nhỏ chỉ từ 35k, suất lớn 55k - 65k, tặng kèm sốt chấm độc quyền cay tê, đậm đà khó cưỡng.",
    imageUrl: "https://res.cloudinary.com/vhguqaqt/image/upload/v1790778388/tiemchena/menu/menu-chan-ga.jpg",
  },
];

export function FullMenuGallerySection() {
  const [activeZoomImage, setActiveZoomImage] = useState<MenuImageItem | null>(null);

  return (
    <section className="py-12 lg:py-16 bg-amber-50/20 border-t border-amber-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 text-amber-900 bg-amber-100 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-2.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            Bảng Menu Gốc Tiệm Chè Na
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Bảng Menu Đầy Đủ & Chi Tiết Từng Topping
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
            Nhấp vào bất kỳ bảng menu nào bên dưới để phóng to xem trọn vẹn toàn bộ danh sách món và giá thành!
          </p>
        </div>

        {/* 3 Menu Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {MENU_BOARDS.map((board) => (
            <div
              key={board.id}
              onClick={() => setActiveZoomImage(board)}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer hover:-translate-y-1"
            >
              {/* Image Preview with Hover Zoom Icon */}
              <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                <img
                  src={board.imageUrl}
                  alt={board.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-1.5">
                    <ZoomIn className="w-4 h-4 text-orange-600" />
                    <span>Xem Phóng To</span>
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <span
                    className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${board.badgeColor} mb-1.5`}
                  >
                    {board.badge}
                  </span>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                    {board.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {board.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5" /> Chạm để phóng to
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">HD 1080p</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal (Phóng to xem menu gốc cực nét) */}
      {activeZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveZoomImage(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between text-white mb-3 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${activeZoomImage.badgeColor}`}>
                {activeZoomImage.badge}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">{activeZoomImage.title}</h4>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activeZoomImage.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                title="Tải ảnh gốc"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setActiveZoomImage(null)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Large Image Box */}
          <div
            className="relative max-w-4xl w-full max-h-[82vh] overflow-auto rounded-2xl bg-slate-900/50 flex items-center justify-center p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeZoomImage.imageUrl}
              alt={activeZoomImage.title}
              className="max-h-[80vh] w-auto object-contain rounded-xl shadow-2xl"
            />
          </div>

          <p className="text-xs text-slate-400 mt-2">Bấm bất kỳ đâu ngoài ảnh hoặc nhấn nút X để đóng</p>
        </div>
      )}
    </section>
  );
}
