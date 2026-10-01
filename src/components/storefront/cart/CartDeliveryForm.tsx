"use client";

import React from "react";
import {
  Phone,
  User,
  MapPin,
  QrCode,
  Sparkles,
  AlertCircle,
  MessageCircle,
  Navigation,
  Loader2,
} from "lucide-react";

interface CartDeliveryFormProps {
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerAddress: string;
  setCustomerAddress: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  websiteHp: string;
  setWebsiteHp: (v: string) => void;
  paymentMethod: "ZALO" | "VIETQR";
  setPaymentMethod: (v: "ZALO" | "VIETQR") => void;
  formError: string;
  inZaloApp: boolean;
  distanceKm: number | null;
  shippingFee: number;
  isLocating: boolean;
  isCheckingAddress: boolean;
  isOutOfRange: boolean;
  rangeError: string;
  onGetGpsLocation: () => void;
  onCheckAddressDistance: () => void;
}

export function CartDeliveryForm({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
  note,
  setNote,
  websiteHp,
  setWebsiteHp,
  paymentMethod,
  setPaymentMethod,
  formError,
  inZaloApp,
  distanceKm,
  shippingFee,
  isLocating,
  isCheckingAddress,
  isOutOfRange,
  rangeError,
  onGetGpsLocation,
  onCheckAddressDistance,
}: CartDeliveryFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Thông Tin Giao Hàng
        </h4>
        <span className="text-[11px] text-slate-400">* Bắt buộc nhập đầy đủ</span>
      </div>

      {/* Hiển thị lỗi form nếu có */}
      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="font-semibold leading-relaxed">{formError}</div>
        </div>
      )}

      {/* 1. Họ và Tên Người Nhận */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-orange-600" />
            <span>Họ và Tên Người Nhận</span>
            <span className="text-red-500">*</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Ví dụ: An, Linh, Nguyễn Văn A...</span>
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nhập tên..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
      </div>

      {/* 2. Số Điện Thoại Nhận Hàng */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-orange-600" />
            <span>Số Điện Thoại Nhận Hàng</span>
            <span className="text-red-500">*</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">10 số di động</span>
        </label>
        <input
          type="tel"
          maxLength={12}
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Nhập số điện thoại"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder:font-sans placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
      </div>

      {/* 3. Địa Chỉ Nhận Hàng Cụ Thể + Nút Lấy Vị Trí GPS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            <span>Địa Chỉ Giao Hàng Cụ Thể</span>
            <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={onGetGpsLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Sử dụng GPS trên điện thoại để lấy vị trí và tính tiền ship tự động"
          >
            {isLocating ? (
              <Loader2 className="w-3 h-3 animate-spin text-orange-600" />
            ) : (
              <Navigation className="w-3 h-3 text-orange-600" />
            )}
            <span>{isLocating ? "Đang định vị..." : "📍 Lấy vị trí của tôi"}</span>
          </button>
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            onBlur={onCheckAddressDistance}
            placeholder="VD: Số 12 ngõ 45 phố Tây Sơn, phường Quang Trung, Đống Đa, Hà Nội"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
          />
          {customerAddress.trim().length >= 5 && (
            <button
              type="button"
              onClick={onCheckAddressDistance}
              disabled={isCheckingAddress}
              className="absolute right-2 bottom-2.5 px-2 py-0.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-md transition cursor-pointer flex items-center gap-1"
            >
              {isCheckingAddress && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              <span>Kiểm tra khoảng cách</span>
            </button>
          )}
        </div>

        {/* Thẻ thông báo khoảng cách & phí ship hoặc cảnh báo quá xa */}
        {distanceKm !== null && !isOutOfRange && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-sm">🚗</span>
              <span>Khoảng cách: {distanceKm} km</span>
            </div>
            <div className="font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
              Phí ship: {shippingFee.toLocaleString("vi-VN")}đ
            </div>
          </div>
        )}

        {isOutOfRange && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="font-semibold leading-relaxed">
              {rangeError || `Vị trí cách quán ${distanceKm} km, vượt quá bán kính giao hàng tối đa (15 km). Quán rất tiếc chưa thể phục vụ đơn này!`}
            </div>
          </div>
        )}
      </div>

      {/* 4. Ghi Chú Đơn Hàng Chung */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Ghi chú cho quán (Tùy chọn)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Giao giờ trưa, gọi trước khi đến 5 phút..."
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
      </div>

      {/* Honeypot field - Ẩn hoàn toàn với người dùng để chống spam bot */}
      <div className="hidden" aria-hidden="true">
        <input
          type="text"
          name="website_hp"
          tabIndex={-1}
          autoComplete="off"
          value={websiteHp}
          onChange={(e) => setWebsiteHp(e.target.value)}
        />
      </div>

      {/* 5. Chọn Phương Thức Thanh Toán & Chốt Đơn */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-bold text-slate-700 block">
          Phương thức đặt hàng & thanh toán:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* Nút 1: Zalo Order */}
          <button
            type="button"
            onClick={() => setPaymentMethod("ZALO")}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
              paymentMethod === "ZALO"
                ? "bg-blue-50/90 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-xs flex items-center gap-1.5 text-blue-700">
                <MessageCircle className="w-4 h-4 fill-blue-600 text-white" />
                <span>Zalo Order</span>
              </span>
              {inZaloApp && (
                <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Mini Zalo
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
              Tạo đơn & nhắn tin quán trực tiếp
            </p>
          </button>

          {/* Nút 2: Quét Mã VietQR */}
          <button
            type="button"
            onClick={() => setPaymentMethod("VIETQR")}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
              paymentMethod === "VIETQR"
                ? "bg-orange-50/90 border-orange-500 text-orange-900 ring-2 ring-orange-500/20 shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-xs flex items-center gap-1.5 text-orange-700">
                <QrCode className="w-4 h-4" />
                <span>Quét VietQR</span>
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full">
                Tự động 24/7
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
              Chuyển khoản SePay duyệt tự động
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
