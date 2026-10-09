"use client";

import React, { useState } from "react";
import {
  Phone,
  Mail,
  User,
  MapPin,
  QrCode,
  Sparkles,
  AlertCircle,
  MessageCircle,
  Navigation,
  Loader2,
  CheckCircle2,
  Compass,
  ExternalLink,
} from "lucide-react";
import {
  SHOP_COORDINATES,
  calculateRoadDistanceKm,
  calculateShippingFeeByKm,
} from "@/data/hanoiLocations";
import { findNearestHanoiWard } from "@/services/geocodeService";
import { SHOP_ENV } from "@/config/shopEnv";
import dynamic from "next/dynamic";

// Dynamic import Modal Bản đồ để tránh lỗi SSR Leaflet
const DeliveryMapModal = dynamic(
  () => import("./DeliveryMapModal").then((mod) => mod.DeliveryMapModal),
  { ssr: false }
);

interface CartDeliveryFormProps {
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  customerAddress: string;
  setCustomerAddress: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  websiteHp: string;
  setWebsiteHp: (v: string) => void;
  paymentMethod: "COD" | "VIETQR";
  setPaymentMethod: (v: "COD" | "VIETQR") => void;
  formError: string;
  inZaloApp: boolean;
  distanceKm: number | null;
  setDistanceKm: (km: number | null) => void;
  shippingFee: number;
  setShippingFee: (fee: number) => void;
  isOutOfRange: boolean;
  setIsOutOfRange: (v: boolean) => void;
  rangeError: string;
  setRangeError: (msg: string) => void;
  distanceSource?: "ward" | "pin" | "gps";
  setDistanceSource?: (s: "ward" | "pin" | "gps") => void;
  /** Báo vị trí ghim/GPS lên component cha để gửi kèm đơn hàng về admin */
  onLocationChange?: (loc: { lat: number; lng: number; name: string }) => void;
}

export function CartDeliveryForm({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
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
  setDistanceKm,
  shippingFee,
  setShippingFee,
  isOutOfRange,
  setIsOutOfRange,
  rangeError,
  setRangeError,
  distanceSource = "pin",
  setDistanceSource,
  onLocationChange,
}: CartDeliveryFormProps) {
  // Địa chỉ chi tiết (số nhà, ngõ ngách, tên tòa nhà nếu có)
  const [streetDetail, setStreetDetail] = useState<string>("");

  // Vị trí định vị (từ Ghim bản đồ hoặc GPS). Rỗng = khách CHƯA chọn vị trí.
  const [locationName, setLocationName] = useState<string>("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: SHOP_COORDINATES.lat + 0.003,
    lng: SHOP_COORDINATES.lng + 0.003,
  });

  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  // Đồng bộ chuỗi địa chỉ giao hàng
  const syncFullAddress = React.useCallback(
    (street: string, locName: string) => {
      const parts = [street.trim(), locName.trim()].filter(Boolean);
      const full = parts.join(", ") || "Hà Nội";
      setCustomerAddress(full);
    },
    [setCustomerAddress]
  );

  // Thay đổi số nhà / ngõ / chi tiết
  const handleStreetDetailChange = (val: string) => {
    setStreetDetail(val);
    syncFullAddress(val, locationName);
  };

  // Lấy vị trí GPS của điện thoại / máy tính
  const handleGetGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Thiết bị của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        const km = calculateRoadDistanceKm(latitude, longitude);
        const feeInfo = calculateShippingFeeByKm(km);

        setDistanceKm(km);
        setShippingFee(feeInfo.shippingFee);
        setIsOutOfRange(!feeInfo.isWithinRange);
        if (setDistanceSource) setDistanceSource("gps");

        const nearest = findNearestHanoiWard(latitude, longitude);
        const newLocName = nearest
          ? `${nearest.wardName}, ${nearest.districtName}`
          : `Tọa độ GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

        setLocationName(newLocName);
        syncFullAddress(streetDetail, newLocName);
        onLocationChange?.({ lat: latitude, lng: longitude, name: newLocName });

        if (!feeInfo.isWithinRange) {
          setRangeError(
            `Vị trí GPS cách quán ${km} km, vượt quá bán kính giao hàng tối đa (5 km).`
          );
        } else {
          setRangeError("");
        }
        setIsLocatingGps(false);
      },
      () => {
        setIsLocatingGps(false);
        alert(
          "Không thể lấy được vị trí GPS hiện tại. Vui lòng cho phép quyền vị trí trong trình duyệt hoặc bấm 'Ghim Bản Đồ' để chọn vị trí nhé."
        );
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // Xử lý khi khách chốt Ghim trên bản đồ Leaflet
  const handleConfirmPinMap = (result: {
    lat: number;
    lng: number;
    distanceKm: number;
    shippingFee: number;
    isWithinRange: boolean;
    locationName?: string;
  }) => {
    setUserCoords({ lat: result.lat, lng: result.lng });
    setDistanceKm(result.distanceKm);
    setShippingFee(result.shippingFee);
    setIsOutOfRange(!result.isWithinRange);
    if (setDistanceSource) setDistanceSource("pin");

    const newLocName =
      result.locationName ||
      `Vị trí ghim (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`;
    setLocationName(newLocName);
    syncFullAddress(streetDetail, newLocName);
    onLocationChange?.({ lat: result.lat, lng: result.lng, name: newLocName });

    if (!result.isWithinRange) {
      setRangeError(
        `Vị trí ghim cách quán ${result.distanceKm} km, vượt quá bán kính giao hàng tối đa (5 km).`
      );
    } else {
      setRangeError("");
    }
  };

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
          <span className="text-[10px] text-slate-400 font-normal">Ví dụ: Anh Nam, Chị Linh...</span>
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nhập tên người nhận..."
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
          placeholder="Nhập số điện thoại..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder:font-sans placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
      </div>

      {/* 2b. Email nhận xác nhận đơn (không bắt buộc) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-orange-600" />
            <span>Email nhận xác nhận đơn</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Không bắt buộc</span>
        </label>
        <input
          type="email"
          inputMode="email"
          maxLength={100}
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="tenban@gmail.com"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
      </div>

      {/* 3. Vị Trí Giao Hàng: Chỉ Ghim Bản Đồ & GPS */}
      <div className="space-y-3 p-3.5 bg-slate-50/90 border border-slate-200 rounded-2xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span>Vị Trí Nhận Hàng</span>
            <span className="text-red-500">*</span>
          </label>
          <span className="text-[10px] text-slate-400">Chọn trên bản đồ hoặc GPS</span>
        </div>

        {/* 2 Nút lớn chọn vị trí: Ghim bản đồ & GPS */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-orange-50/60 text-slate-800 hover:text-orange-700 border-2 border-slate-200 hover:border-orange-400 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Compass className="w-4 h-4 text-orange-600" />
            <span>Ghim Bản Đồ</span>
          </button>

          <button
            type="button"
            onClick={handleGetGps}
            disabled={isLocatingGps}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-blue-50/60 text-slate-800 hover:text-blue-700 border-2 border-slate-200 hover:border-blue-400 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isLocatingGps ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Navigation className="w-4 h-4 text-blue-600" />
            )}
            <span>Vị Trí Hiện Tại (GPS)</span>
          </button>
        </div>

        {/* Thẻ hiển thị vị trí đã chọn, cự ly và phí ship */}
        <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Vị trí đã định vị
              </div>
              <div className={`text-xs font-extrabold flex items-center gap-1.5 ${locationName ? "text-slate-800" : "text-amber-600"}`}>
                <span className="text-orange-600">📍</span>
                <span>{locationName || "Chưa chọn — bấm Ghim Bản Đồ hoặc Vị Trí Hiện Tại (GPS)"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline shrink-0 cursor-pointer"
            >
              {locationName ? "Chỉnh ghim" : "Chọn vị trí"}
            </button>
          </div>

          {/* Cự ly & Phí ship */}
          {distanceKm !== null && !isOutOfRange && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <span>🛵 Khoảng cách:</span>
                <span className="font-black text-emerald-600">{distanceKm} km</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({distanceSource === "gps" ? "GPS" : "Bản đồ"})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium mr-1.5">Phí ship:</span>
                <span className="font-black text-orange-600 text-sm">
                  {shippingFee.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          )}

          {/* Cảnh báo vượt quá 5km */}
          {isOutOfRange && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">
                {rangeError ||
                  `Vị trí cách quán ${distanceKm} km, vượt quá bán kính phục vụ (5 km). Quán rất tiếc chưa thể giao đơn này!`}
              </div>
            </div>
          )}
        </div>

        {/* 4. Địa Chỉ Chi Tiết (Số nhà, ngõ, tòa nhà - Nếu có) */}
        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>Địa chỉ chi tiết (nếu có)</span>
          </label>
          <textarea
            rows={2}
            value={streetDetail}
            onChange={(e) => handleStreetDetailChange(e.target.value)}
            placeholder="Số nhà, ngõ/ngách, tên tòa nhà, số phòng chung cư (nếu có)..."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition resize-none"
          />
        </div>

        {/* 5. Chú thích: Sai địa chỉ thì liên hệ Zalo */}
        <div className="p-3 bg-blue-50/90 border border-blue-200/90 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
          <MessageCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 w-full">
            <p className="font-bold text-blue-950 leading-snug">
              Sai địa chỉ hoặc định vị chưa chuẩn?
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Nếu bản đồ định vị chưa chính xác hoặc bạn muốn giao tới địa chỉ đặc biệt, hãy nhắn tin trực tiếp để quán hỗ trợ giao tận tay nhé:
            </p>
            <a
              href={SHOP_ENV.zaloPhone ? `https://zalo.me/${SHOP_ENV.zaloPhone}` : `https://zalo.me`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-extrabold shadow-xs transition active:scale-95 cursor-pointer mt-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>
                Nhắn Zalo Quán {SHOP_ENV.zaloPhone ? `(${SHOP_ENV.zaloPhone})` : ""}
              </span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>
      </div>

      {/* 6. Ghi Chú Đơn Hàng */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>Ghi Chú Đơn Hàng</span>
          <span className="text-[10px] text-slate-400 font-normal">Không bắt buộc</span>
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập ghi chú..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* 7. Hình Thức Thanh Toán */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>Hình Thức Thanh Toán</span>
          <span className="text-[10px] text-emerald-600 font-bold">Linh hoạt & Tiện lợi</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {/* Lựa chọn 1: Tiền mặt khi nhận hàng (COD) */}
          <button
            type="button"
            onClick={() => setPaymentMethod("COD")}
            className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between relative cursor-pointer ${
              paymentMethod === "COD"
                ? "border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20"
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                <span className="text-sm">💵</span>
                <span>Tiền Mặt (COD)</span>
              </span>
              {paymentMethod === "COD" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Thanh toán trực tiếp khi nhận hàng.
            </p>
          </button>

          {/* Lựa chọn 2: Quét mã VietQR SePay */}
          <button
            type="button"
            onClick={() => setPaymentMethod("VIETQR")}
            className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between relative cursor-pointer ${
              paymentMethod === "VIETQR"
                ? "border-orange-600 bg-orange-50/60 shadow-xs ring-2 ring-orange-500/20"
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 font-bold text-xs text-orange-950">
                <QrCode className="w-4 h-4 text-orange-600" />
                <span>Quét Mã VietQR</span>
              </span>
              {paymentMethod === "VIETQR" && (
                <CheckCircle2 className="w-4 h-4 text-orange-600" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Chuyển khoản QR, hệ thống tự động xác nhận 24/7.
            </p>
          </button>
        </div>
      </div>

      {/* Honeypot chống bot */}
      <input
        type="text"
        name="website_hp"
        value={websiteHp}
        onChange={(e) => setWebsiteHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        style={{ display: "none" }}
      />

      {/* Modal Ghim Bản Đồ Leaflet */}
      <DeliveryMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLat={userCoords.lat}
        initialLng={userCoords.lng}
        onConfirmLocation={handleConfirmPinMap}
      />
    </div>
  );
}
