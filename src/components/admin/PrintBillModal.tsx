"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer } from "lucide-react";
import { OrderType } from "@/types";

interface PrintBillModalProps {
  order: OrderType | null;
  onClose: () => void;
}

export function PrintBillModal({ order, onClose }: PrintBillModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!order || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      style={{ zIndex: 99999 }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-orange-400" /> Xem Trước Hóa Đơn Nhiệt
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Bill Area (Thermal 80mm styled) */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex justify-center flex-1">
          <div
            id="printable-bill"
            className="bg-white p-6 shadow-sm border border-slate-200 rounded-xl w-full text-slate-800 text-xs font-mono leading-tight space-y-3"
          >
            {/* Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h2 className="font-extrabold text-base uppercase text-slate-900">TIỆM CHÈ NA</h2>
              <p className="text-[11px] text-slate-500">Vũ Lăng, Ngũ Hiệp, Thanh Trì</p>
              <p className="text-[11px] font-bold text-slate-600">Hotline: 0986.479.285</p>
              <p className="font-extrabold text-xs uppercase pt-1 text-slate-900">
                PHIẾU BÁO CHẾ BIẾN BẾP
              </p>
            </div>

            {/* Order Info */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Mã đơn:</span>
                <span className="font-bold font-mono">{order.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="font-bold">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>SĐT:</span>
                <span className="font-bold">{order.customerPhone}</span>
              </div>
              <div>
                <span>Địa chỉ: </span>
                <span className="font-medium">{order.customerAddress}</span>
              </div>
              {order.note && (
                <div className="pt-1 text-red-600 font-bold">
                  <span>* Ghi chú: {order.note}</span>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 pt-1">
              <div className="flex justify-between font-bold text-[11px] border-b border-slate-200 pb-1">
                <span>Tên Món</span>
                <span>SL</span>
                <span>T.Tiền</span>
              </div>
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span className="truncate pr-1">{item.productName}</span>
                    <span className="px-2">x{item.quantity}</span>
                    <span>{item.itemTotal.toLocaleString("vi-VN")}</span>
                  </div>
                  {item.toppingsJson && (
                    <p className="text-[10px] text-slate-500 italic pl-2">
                      + Topping: {JSON.parse(item.toppingsJson).map((t: any) => t.name).join(", ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-[10px] text-red-600 italic pl-2">Note: {item.note}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Payment summary */}
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span>{order.totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Giảm giá ({order.voucherCode || "KM"}):</span>
                  <span>-{order.discountAmount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                <span>THANH TOÁN:</span>
                <span className="text-orange-600">{order.finalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Hình thức:</span>
                <span className="font-bold">{order.paymentMethod}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              <p>Cảm ơn quý khách & Hẹn gặp lại!</p>
              <p className="font-sans text-[9px] mt-0.5">tiemchena.life</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> In Phiếu Bếp
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
