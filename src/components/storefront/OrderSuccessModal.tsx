"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import {
  CheckCircle,
  X,
  Copy,
  Check,
  MessageSquare,
  SearchCode,
  Clock,
  MapPin,
  Phone,
  QrCode as QrIcon
} from "lucide-react";
import { OrderType } from "@/types";
import { useTheme } from "@/context/ThemeContext";

interface OrderSuccessModalProps {
  order: OrderType | null;
  onClose: () => void;
  onTrackOrder: (orderCode: string) => void;
}

export function OrderSuccessModal({
  order,
  onClose,
  onTrackOrder,
}: OrderSuccessModalProps) {
  const { config } = useTheme();
  const [copiedText, setCopiedText] = useState("");

  useEffect(() => {
    if (order) {
      // Fire celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [order]);

  if (!order) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const isVietQR = order.paymentMethod === "VIETQR";
  const bankId = process.env.NEXT_PUBLIC_VIETQR_BANK_ID || "MB";
  const accountNo = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || "0986479285";
  const accountName = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "TIEM CHE NA";
  const amount = order.finalAmount;
  const memo = `${order.orderCode} ${order.customerPhone}`;

  const [localQr, setLocalQr] = useState<string>("");

  useEffect(() => {
    if (order && order.paymentMethod === "VIETQR") {
      // Offline fallback QR code
      const transferInfo = `2. STK: ${accountNo} (${bankId}) - So tien: ${amount}d - ND: ${memo}`;
      QRCode.toDataURL(transferInfo, { width: 240, margin: 1 })
        .then((url) => setLocalQr(url))
        .catch(() => {});
    }
  }, [order, bankId, accountNo, amount, memo]);

  const qrDataUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    memo
  )}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
            <CheckCircle className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <h3 className="text-xl font-black">Đặt Đơn Thành Công!</h3>
          <p className="text-xs text-emerald-100 mt-1">
            Mã đơn hàng: <strong className="text-white font-mono bg-black/20 px-2 py-0.5 rounded text-sm">{order.orderCode}</strong>
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* QR Payment Section (if VIETQR) */}
          {isVietQR ? (
            <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-900">
                <QrIcon className="w-4 h-4 text-orange-600" />
                <span>Quét Mã VietQR Chuyển Khoản Tự Động</span>
              </div>

              {/* QR Image */}
              <div className="bg-white p-3 rounded-2xl shadow-sm inline-block border border-orange-100 max-w-[220px]">
                {qrDataUrl || localQr ? (
                  <img
                    src={qrDataUrl}
                    alt="VietQR Tiệm Chè Na"
                    className="w-full h-auto rounded-lg"
                    onError={(e) => {
                      if (localQr) {
                        (e.target as HTMLImageElement).src = localQr;
                      }
                    }}
                  />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-lg" />
                )}
              </div>

              {/* Bank Details */}
              <div className="space-y-1.5 text-xs text-left bg-white p-3 rounded-xl border border-orange-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-slate-800">MB Bank (Quân Đội)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-orange-600 font-mono">0986479285</span>
                    <button
                      onClick={() => handleCopy("0986479285", "stk")}
                      className="text-slate-400 hover:text-orange-600 cursor-pointer"
                    >
                      {copiedText === "stk" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số tiền:</span>
                  <span className="font-black text-orange-600 text-sm">
                    {order.finalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nội dung CK:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800 font-mono">{order.orderCode}</span>
                    <button
                      onClick={() => handleCopy(order.orderCode, "nd")}
                      className="text-slate-400 hover:text-orange-600 cursor-pointer"
                    >
                      {copiedText === "nd" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-blue-900">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Chốt Đơn Qua Zalo Trực Tiếp</span>
              </div>
              <p className="text-lg font-black text-blue-700">
                {order.finalAmount.toLocaleString("vi-VN")}đ
              </p>
              <p className="text-[11px] text-blue-600">
                Thông tin đơn hàng đã được chuẩn bị sẵn trong Zalo. Quán sẽ kiểm tra và phản hồi bạn ngay lập tức!
              </p>
            </div>
          )}

          {/* Delivery Details Summary */}
          <div className="border border-slate-100 bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Dự kiến giao: <strong>25 - 35 phút</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="truncate">Giao tới: <strong>{order.customerAddress}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Khách nhận: <strong>{order.customerName} ({order.customerPhone})</strong></span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
          <a
            href={`https://zalo.me/0986479285?text=${encodeURIComponent(
              `Chào quán, mình vừa đặt đơn ${order.orderCode} (${order.finalAmount.toLocaleString("vi-VN")}đ). Quán kiểm tra giúp mình nhé!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Nhắn Zalo</span>
          </a>

          <button
            onClick={() => {
              onClose();
              onTrackOrder(order.customerPhone || order.orderCode);
            }}
            className={`inline-flex items-center justify-center gap-1.5 ${config.colors.primaryBtn} font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer`}
          >
            <SearchCode className="w-4 h-4" />
            <span>Theo Dõi Đơn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
