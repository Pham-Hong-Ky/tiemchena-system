"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  X,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { OrderType } from "@/types";
import { playOrderNotificationSound } from "@/lib/notificationSound";
import { toast } from "@/context/ToastContext";
import { generateVietQrEmvCo } from "@/lib/vietqr";

interface VietQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderType | null;
  bankId?: string;
  accountName?: string;
  accountNumber?: string;
  onPaymentSuccess: (paidOrder: OrderType) => void;
}

export function VietQrPaymentModal({
  isOpen,
  onClose,
  order,
  bankId = "MB",
  accountName = "HO KINH DOANH TIEM CHE NA",
  accountNumber = "836888181",
  onPaymentSuccess,
}: VietQrPaymentModalProps) {
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidOrder, setPaidOrder] = useState<OrderType | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(true);

  // Đảm bảo số tài khoản và ngân hàng luôn có giá trị an toàn
  const safeBankId = bankId || "MB";
  const safeAccountNumber = accountNumber || "836888181";
  const safeAccountName = accountName || "HO KINH DOANH TIEM CHE NA";

  // Reset state and generate instant VietQR when a new order is passed
  useEffect(() => {
    if (order) {
      const alreadyPaid = order.paymentStatus === "PAID";
      setIsPaid(alreadyPaid);
      setPaidOrder(alreadyPaid ? order : null);
      setIsGeneratingQr(true);

      const transferMemo = `TCN ${order.orderCode.replace(/[^0-9]/g, "")}`;

      // 1. Tạo chuỗi chuẩn VietQR EMVCo (tương thích 100% app ngân hàng VN)
      const emvCoString = generateVietQrEmvCo({
        bankId: safeBankId,
        accountNumber: safeAccountNumber,
        amount: order.finalAmount,
        memo: transferMemo,
      });

      // 2. Tạo QR Code cục bộ trực tiếp (0ms, không phụ thuộc máy chủ trung gian)
      QRCode.toDataURL(emvCoString, {
        width: 320,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
          setIsGeneratingQr(false);
        })
        .catch((err) => {
          console.error("QR Code generate error:", err);
          // Fallback sang link VietQR online nếu QRCode lỗi
          const fallbackUrl = `https://img.vietqr.io/image/${safeBankId}-${safeAccountNumber}-compact2.png?amount=${order.finalAmount}&addInfo=${encodeURIComponent(
            transferMemo
          )}&accountName=${encodeURIComponent(safeAccountName)}`;
          setQrDataUrl(fallbackUrl);
          setIsGeneratingQr(false);
        });
    }
  }, [order, safeBankId, safeAccountNumber, safeAccountName]);

  // Polling SePay / Order payment status every 2 seconds
  useEffect(() => {
    if (!isOpen || !order || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.paymentStatus === "PAID") {
            setIsPaid(true);
            setPaidOrder(json.data);
            playOrderNotificationSound();
            toast.success("Thanh toán thành công! Quán đã nhận tiền tự động.");
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error("Check SePay payment error:", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, order, isPaid]);

  if (!isOpen || !order) return null;

  // Memo formatted for SePay webhook matching (e.g. TCN 825197)
  const transferMemo = `TCN ${order.orderCode.replace(/[^0-9]/g, "")}`;

  const qrUrl = `https://img.vietqr.io/image/${safeBankId}-${safeAccountNumber}-compact2.png?amount=${order.finalAmount}&addInfo=${encodeURIComponent(
    transferMemo
  )}&accountName=${encodeURIComponent(safeAccountName)}`;

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-orange-600" />
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              {isPaid ? "Xác Nhận Thanh Toán" : "Quét Mã VietQR Chuyển Khoản"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MÀN HÌNH 1: ĐÃ THANH TOÁN THÀNH CÔNG (TỰ ĐỘNG BẬT KHI SEPAY NHẬN TIỀN) */}
        {isPaid ? (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">
                SePay Tự Động Xác Nhận
              </span>
              <h4 className="text-xl font-black text-slate-900 mt-2">
                Thanh Toán Thành Công!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Quán đã nhận đủ <strong>{order.finalAmount.toLocaleString("vi-VN")}đ</strong> cho đơn hàng <strong>#{order.orderCode}</strong> và đang chuẩn bị món ngay.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-slate-900">#{order.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Người nhận:</span>
                <span className="font-bold text-slate-900">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Đã thanh toán
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onPaymentSuccess(paidOrder || order)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 text-xs transition cursor-pointer active:scale-95"
            >
              <span>THEO DÕI ĐƠN HÀNG</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* MÀN HÌNH 2: ĐANG CHỜ QUÉT MÃ QR & LẮNG NGHE TỰ ĐỘNG TỪ SEPAY */
          <>
            {/* Live SePay Pulsing Banner */}
            <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <div className="text-[11px] leading-snug">
                <p className="font-bold text-amber-900">Đang chờ chuyển khoản (Tự động 24/7)</p>
                <p className="text-slate-500 text-[10px]">
                  Chuyển xong hệ thống SePay tự động duyệt đơn trong 2–5 giây.
                </p>
              </div>
            </div>

            {/* QR Image Box with instant offline VietQR rendering */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="relative w-52 h-52 mx-auto bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center p-2">
                {isGeneratingQr || !qrDataUrl ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <span className="text-[11px] text-slate-500 font-medium">Đang tạo mã VietQR...</span>
                  </div>
                ) : (
                  <img
                    src={qrDataUrl}
                    alt="VietQR Chuyển Khoản"
                    className="w-full h-full object-contain rounded-lg"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Mở App Ngân hàng hoặc MoMo quét mã</span>
              </p>
            </div>

            {/* Account Details with 1-click Copy */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-800">{safeBankId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-800">{safeAccountName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 font-mono text-sm">{safeAccountNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(safeAccountNumber);
                      setCopiedAccount(true);
                      setTimeout(() => setCopiedAccount(false), 2000);
                    }}
                    className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    {copiedAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-black text-orange-600 text-base">
                  {order.finalAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold font-mono text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    {transferMemo}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(transferMemo);
                      setCopiedMemo(true);
                      setTimeout(() => setCopiedMemo(false), 2000);
                    }}
                    className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                    title="Sao chép nội dung chuyển khoản"
                  >
                    {copiedMemo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Waiting indicator & Quick Actions */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                <span className="font-semibold">Hệ thống đang tự động lắng nghe SePay...</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
