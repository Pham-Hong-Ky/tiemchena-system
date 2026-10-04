"use client";

import React from "react";
import {
  ChefHat,
  Bike,
  CheckCircle2,
  Printer,
  Phone,
  MapPin,
  Trash2,
  Ban,
  ShieldAlert,
} from "lucide-react";
import { OrderType } from "@/types";

interface AdminOrderCardProps {
  order: OrderType;
  onPrintBill: () => void;
  onQuickDelete: () => void;
  onCancelOrder: () => void;
  onBlacklistOrder?: () => void;
  onPatchOrder: (patch: { orderStatus?: string; paymentStatus?: string }) => void;
}

export function AdminOrderCard({
  order,
  onPrintBill,
  onQuickDelete,
  onCancelOrder,
  onBlacklistOrder,
  onPatchOrder,
}: AdminOrderCardProps) {
  const isPending = order.orderStatus === "PENDING";
  const isConfirmed = order.orderStatus === "CONFIRMED" || order.orderStatus === "PREPARING" || order.orderStatus === "DELIVERING";
  const isCompleted = order.orderStatus === "COMPLETED";
  const isCancelled = order.orderStatus === "CANCELLED";
  const isPaid = order.paymentStatus === "PAID";

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden transition hover:shadow-md ${
        isPending
          ? "border-amber-400 ring-2 ring-amber-400/20"
          : isConfirmed
          ? "border-blue-400 ring-2 ring-blue-400/20"
          : isCancelled
          ? "border-rose-300 bg-rose-50/15 opacity-90"
          : "border-slate-200"
      }`}
    >
      {/* Card Top */}
      <div
        className={`p-4 border-b flex items-center justify-between ${
          isCancelled ? "border-rose-100 bg-rose-50/50" : "border-slate-100 bg-slate-50/70"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm text-slate-900">
              {order.orderCode}
            </span>
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-800"
                  : isCancelled
                  ? "bg-rose-100 text-rose-800"
                  : isConfirmed
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isCompleted ? "Đã Hoàn Thành" : isCancelled ? "Đã Hủy / Rác" : isConfirmed ? "Đã Nhận Đơn" : "Chờ Duyệt"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -{" "}
            {new Date(order.createdAt).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrintBill}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer shadow-xs"
            title="In hóa đơn"
          >
            <Printer className="w-4 h-4" />
          </button>

          {isCancelled && (
            <button
              onClick={onQuickDelete}
              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-600 transition cursor-pointer shadow-xs"
              title="Xóa vĩnh viễn đơn rác này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-2.5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-slate-900 text-sm">{order.customerName}</span>
              {order.isLoyalCustomer || ((order.completedOrdersCount ?? 0) >= 2) ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/90 flex items-center gap-1 shadow-2xs">
                  ⭐ Khách Quen
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center gap-1">
                  🌱 Khách Mới
                </span>
              )}
            </div>
            <p className="text-slate-500 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-slate-400" />
              <a href={`tel:${order.customerPhone}`} className="hover:underline text-orange-600">
                {order.customerPhone}
              </a>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400">
              {(order.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} phần
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-relaxed font-medium">
            {order.customerAddress}
          </span>
        </div>

        {order.note && (
          <div className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-snug">
            <span className="font-bold">Ghi chú:</span> {order.note}
          </div>
        )}

        {/* Items List */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {(order.items || []).map((item: any) => {
            let selectedToppings: Array<{ name: string; price: number }> = [];
            if (item.selectedToppings) {
              try {
                selectedToppings =
                  typeof item.selectedToppings === "string"
                    ? JSON.parse(item.selectedToppings)
                    : item.selectedToppings;
              } catch {}
            }

            const itemName = item.productName || item.name || "Món ăn";
            const itemPrice = item.productPrice ?? item.price ?? 0;
            const totalItemPrice = item.itemTotal ?? itemPrice * item.quantity;

            return (
              <div
                key={item.id}
                className="flex justify-between items-start text-xs py-1 border-b border-slate-50 last:border-0"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-orange-600 text-sm">
                      {item.quantity}x
                    </span>
                    <span className="font-extrabold text-slate-800">{itemName}</span>
                  </div>
                  {selectedToppings.length > 0 && (
                    <div className="text-[11px] text-slate-500 pl-5">
                      + {selectedToppings.map((t) => t.name).join(", ")}
                    </div>
                  )}
                  {item.note && (
                    <div className="text-[11px] text-amber-600 pl-5 italic">
                      * {item.note}
                    </div>
                  )}
                </div>
                <span className="font-medium text-slate-600 font-mono shrink-0">
                  {totalItemPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>
            );
          })}
        </div>

        {/* Price & Payment */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">PT:</span>
            <span className="text-slate-800">{order.paymentMethod}</span>
            <button
              onClick={() =>
                onPatchOrder({
                  paymentStatus: order.paymentStatus === "PAID" ? "UNPAID" : "PAID",
                })
              }
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase cursor-pointer ${
                order.paymentStatus === "PAID"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {order.paymentStatus === "PAID" ? "Đã Thu" : "Chưa Thu"}
            </button>
          </div>
          <span className="text-orange-600 font-extrabold text-sm">
            {order.finalAmount.toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>

      {/* Workflow Actions */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-bold">
        {/* Bước 1: Chờ Duyệt ➔ Nhận Đơn */}
        {isPending && (
          <button
            onClick={() => onPatchOrder({ orderStatus: "CONFIRMED" })}
            className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold shadow-xs active:scale-95"
          >
            <span>👨‍🍳 Nhận Đơn Hàng</span>
          </button>
        )}

        {/* Bước 2: Đã Nhận Đơn ➔ Đã Thanh Toán & Hoàn Thành */}
        {isConfirmed && (
          <>
            {!isPaid ? (
              <>
                <button
                  onClick={() => onPatchOrder({ paymentStatus: "PAID" })}
                  className="bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer font-bold shadow-xs active:scale-95"
                  title="Xác nhận khách đã trả tiền mặt"
                >
                  <span>💵 Đã Thu Tiền</span>
                </button>
                <button
                  onClick={() =>
                    onPatchOrder({
                      orderStatus: "COMPLETED",
                      paymentStatus: "PAID",
                    })
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer font-bold shadow-xs active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn Thành</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onPatchOrder({ orderStatus: "COMPLETED" })}
                className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold shadow-xs active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn Thành Đơn Hàng</span>
              </button>
            )}
          </>
        )}

        {isCompleted && (
          <div className="col-span-2 text-center text-emerald-600 text-xs font-bold py-1.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Đơn hàng đã hoàn tất
          </div>
        )}

        {isCancelled && (
          <div className="col-span-2 flex items-center justify-between gap-2">
            <span className="text-rose-600 text-xs font-bold flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> Đơn hàng đã hủy
            </span>
            <div className="flex items-center gap-1.5">
              {onBlacklistOrder && !order.note?.includes("ĐÃ CHẶN BOM HÀNG") && (
                <button
                  onClick={onBlacklistOrder}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Chặn số điện thoại này vào danh sách đen"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Chặn SĐT
                </button>
              )}
              <button
                onClick={onQuickDelete}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa
              </button>
            </div>
          </div>
        )}

        {!isCompleted && !isCancelled && (
          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-200/50">
            <button
              onClick={onCancelOrder}
              className="text-slate-400 hover:text-slate-600 py-0.5 text-[11px] font-medium cursor-pointer flex items-center gap-1 transition"
            >
              <Ban className="w-3 h-3" /> Hủy đơn
            </button>
            {onBlacklistOrder && (
              <button
                onClick={onBlacklistOrder}
                className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 transition border border-rose-200/60"
                title="Chặn số điện thoại này vào danh sách đen và hủy đơn"
              >
                <ShieldAlert className="w-3 h-3" /> 🚫 Chặn Bom Hàng
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
