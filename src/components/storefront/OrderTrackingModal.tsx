"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Clock,
  ChefHat,
  Bike,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Loader2,
  PackageCheck,
  Phone,
  Calendar,
  MapPin,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { OrderType } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";
import { SHOP_ENV } from "@/config/shopEnv";

interface OrderTrackingModalProps {
  initialPhone?: string;
  initialOrderCode?: string;
  onClose: () => void;
}

export function OrderTrackingModal({
  initialPhone = "",
  initialOrderCode = "",
  onClose,
}: OrderTrackingModalProps) {
  const { config } = useTheme();
  const initialQuery = initialPhone || initialOrderCode || "";
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setOrders([]);
    setSelectedOrder(null);

    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Không tìm thấy đơn hàng nào liên kết với số điện thoại này");
      }

      const orderList: OrderType[] = Array.isArray(data.data) ? data.data : [data.data];
      setOrders(orderList);
      if (orderList.length > 0) {
        setSelectedOrder(orderList[0]);
      }
    } catch (err: any) {
      setError(err.message || "Không tìm thấy đơn hàng tương ứng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const steps = [
    { key: "PENDING", label: "Tiếp Nhận", desc: "Quán đã nhận đơn", icon: Clock },
    { key: "PREPARING", label: "Đang Làm", desc: "Bếp đang chế biến", icon: ChefHat },
    { key: "DELIVERING", label: "Đang Giao", desc: "Shipper đang mang tới", icon: Bike },
    { key: "COMPLETED", label: "Hoàn Thành", desc: "Giao món thành công", icon: CheckCircle2 },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING":
      case "CONFIRMED":
        return 0;
      case "PREPARING":
        return 1;
      case "DELIVERING":
        return 2;
      case "COMPLETED":
        return 3;
      default:
        return 0;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Tiếp Nhận</span>;
      case "CONFIRMED":
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Đã Xác Nhận</span>;
      case "PREPARING":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Đang Làm</span>;
      case "DELIVERING":
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Đang Giao</span>;
      case "COMPLETED":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Hoàn Thành</span>;
      case "CANCELLED":
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Đã Hủy</span>;
      default:
        return null;
    }
  };

  const currentStep = selectedOrder ? getStepIndex(selectedOrder.orderStatus) : 0;
  const isCancelled = selectedOrder?.orderStatus === "CANCELLED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 border border-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight">Tra Cứu Đơn Hàng</h3>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Nhập số điện thoại đã dùng để theo dõi tiến độ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input bar by Phone Number */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchInput);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nhập số điện thoại ..."
                autoFocus
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className={`${config.colors.primaryBtn} disabled:opacity-50 disabled:shadow-none text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0 relative`}
            >
              <ButtonFestiveDecorator />
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Đang tìm...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Tra Cứu</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-1 animate-in fade-in">
              <p className="text-xs sm:text-sm text-rose-700 font-bold">{error}</p>
              <p className="text-[11px] text-rose-500">
                Nếu cần hỗ trợ gấp, vui lòng gọi trực tiếp hotline{" "}
                <a href={`tel:${SHOP_ENV.hotline}`} className="font-extrabold underline text-rose-700">
                  {SHOP_ENV.hotline}
                </a>
              </p>
            </div>
          )}

          {!selectedOrder && !error && !isLoading && (
            <div className="text-center py-10 sm:py-12 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-orange-500">
                <Phone className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="text-sm font-bold text-slate-700">Tra cứu bằng số điện thoại</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhập số điện thoại quý khách đã điền khi đặt hàng để xem tình trạng làm món và giao hàng theo thời gian thực.
                </p>
              </div>
            </div>
          )}

          {/* Multiple orders found selector */}
          {orders.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">
                  Các đơn hàng gần đây ({orders.length} đơn):
                </span>
                <span className="text-[11px] text-slate-400">Chọn đơn để xem tiến độ</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {orders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  const dateStr = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : "";

                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className={`text-left p-3 rounded-2xl border transition shrink-0 w-48 sm:w-52 cursor-pointer ${
                        isSelected
                          ? "bg-orange-50/80 border-orange-400 ring-2 ring-orange-400/20 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-black text-slate-900">{ord.orderCode}</span>
                        {getStatusBadge(ord.orderStatus)}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{dateStr}</span>
                      </div>
                      <div className="font-extrabold text-xs text-orange-600">
                        {ord.finalAmount.toLocaleString("vi-VN")}đ
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Order Details */}
          {selectedOrder && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Order summary banner */}
              <div className="bg-gradient-to-br from-slate-50 to-orange-50/40 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                      {selectedOrder.orderCode}
                    </span>
                    {getStatusBadge(selectedOrder.orderStatus)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Khách: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerPhone})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tổng Thanh Toán
                  </span>
                  <p className="font-black text-orange-600 text-base sm:text-lg">
                    {selectedOrder.finalAmount.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>

              {/* Status Stepper */}
              {isCancelled ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700">
                  <XCircle className="w-6 h-6 shrink-0 text-rose-600" />
                  <div>
                    <h4 className="font-bold text-sm">Đơn hàng này đã bị hủy</h4>
                    <p className="text-xs text-rose-600 mt-0.5">
                      Nếu có bất kỳ thắc mắc nào, quý khách vui lòng liên hệ hotline của quán để được hỗ trợ.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2 px-1">
                  <div className="grid grid-cols-4 relative">
                    {/* Connecting line */}
                    <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 z-0" />
                    <div
                      className="absolute top-5 left-8 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 z-0"
                      style={{ width: `${(currentStep / 3) * 75}%` }}
                    />

                    {steps.map((step, idx) => {
                      const Icon = step.icon;
                      const isDone = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isDone
                                ? "bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/30 ring-4 ring-orange-100"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            } ${isCurrent ? "scale-110" : ""}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-xs font-bold mt-2 ${
                              isDone ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                            {step.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items in order */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Món trong đơn:
                </h4>
                <div className="divide-y divide-slate-100 bg-slate-50/80 rounded-2xl p-3.5 text-xs border border-slate-100">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="py-2.5 first:pt-1 last:pb-1 flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800">
                          {item.quantity}x {item.productName}
                        </span>
                        {item.toppingsJson && (
                          <p className="text-[11px] text-orange-600/80 mt-0.5">
                            +{" "}
                            {(() => {
                              try {
                                const tops = JSON.parse(item.toppingsJson);
                                return tops.map((t: any) => t.name).join(", ");
                              } catch {
                                return "";
                              }
                            })()}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>
                      <span className="font-extrabold text-slate-800 shrink-0">
                        {item.itemTotal?.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery address info */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">Địa chỉ nhận món: </span>
                    <span>{selectedOrder.customerAddress}</span>
                  </div>
                </div>
                {selectedOrder.note && (
                  <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700">Ghi chú đơn: </span>
                    <span className="italic">{selectedOrder.note}</span>
                  </div>
                )}
              </div>

              {/* Quick Contact Bar */}
              <div className="bg-amber-50/80 rounded-2xl p-3 sm:p-3.5 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-amber-900 font-medium">
                  Cần thay đổi món hoặc địa chỉ giao?
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${SHOP_ENV.hotline}`}
                    className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Gọi {SHOP_ENV.hotline}
                  </a>
                  <a
                    href={`https://zalo.me/${SHOP_ENV.zaloPhone}?text=${encodeURIComponent(
                      `Chào quán, mình muốn kiểm tra đơn hàng số điện thoại ${selectedOrder.customerPhone} (Mã: ${selectedOrder.orderCode})`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat Zalo
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
