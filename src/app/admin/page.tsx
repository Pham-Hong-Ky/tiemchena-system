"use client";

import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Clock,
  Bike,
  CheckCircle2,
  Printer,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Volume2,
} from "lucide-react";
import { PrintBillModal } from "@/components/admin/PrintBillModal";
import { StatusCard } from "@/components/admin/StatusCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { getOrders, patchOrder } from "@/lib/api";
import { OrderType } from "@/types";
import { toast } from "@/context/ToastContext";

// ─── Sound chime ──────────────────────────────────────────────────────────────

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.warn("Audio chime prevented or unsupported", e);
  }
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CARDS = [
  {
    status: "PENDING",
    label: "Chờ Duyệt (Mới)",
    icon: Clock,
    activeStyle: "bg-amber-500 text-white border-amber-600",
  },
  {
    status: "PREPARING",
    label: "Bếp Đang Làm",
    icon: ChefHat,
    activeStyle: "bg-orange-600 text-white border-orange-700",
  },
  {
    status: "DELIVERING",
    label: "Đang Giao Hàng",
    icon: Bike,
    activeStyle: "bg-blue-600 text-white border-blue-700",
  },
  {
    status: "COMPLETED",
    label: "Đã Hoàn Thành",
    icon: CheckCircle2,
    activeStyle: "bg-emerald-600 text-white border-emerald-700",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminKdsPage() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBillOrder, setSelectedBillOrder] = useState<OrderType | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  const fetchOrdersList = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersList();

    // 1. SSE real-time connection for instant updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/sse/orders");
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "NEW_ORDER") {
            setOrders((prev) => [payload.data, ...prev.filter((o) => o.id !== payload.data.id)]);
            playNotificationSound();
            setNewOrderAlert(`Đơn mới: ${payload.data.orderCode} - ${payload.data.customerName}`);
            setTimeout(() => setNewOrderAlert(null), 5000);
          } else if (payload.type === "ORDER_UPDATED") {
            setOrders((prev) => prev.map((o) => (o.id === payload.data.id ? payload.data : o)));
          }
        } catch {}
      };
    } catch (e) {
      console.warn("SSE init warning", e);
    }

    // 2. Fallback polling every 30s in case SSE drops or tab is backgrounded
    const fallbackPollInterval = setInterval(() => {
      fetchOrdersList();
    }, 30000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(fallbackPollInterval);
    };
  }, []);

  // ── Merged patch handler (replaces handleUpdateStatus + handleUpdatePaymentStatus)
  const handlePatchOrder = async (
    orderId: string,
    patch: { orderStatus?: string; paymentStatus?: string }
  ) => {
    try {
      const updated = await patchOrder(orderId, patch);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast.success("Cập nhật đơn hàng thành công");
    } catch {
      toast.error("Không thể cập nhật đơn hàng");
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // ── Filtered list
  const filteredOrders = orders.filter((o) => {
    const matchStatus = filterStatus === "ALL" || o.orderStatus === filterStatus;
    const matchSearch =
      !searchQuery.trim() ||
      o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery.trim());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const countByStatus = (s: string) => orders.filter((o) => o.orderStatus === s).length;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* New order alert toast */}
      {newOrderAlert && (
        <div className="p-4 bg-orange-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span>🔔 TING TING! {newOrderAlert}</span>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            className="text-xs bg-black/20 hover:bg-black/30 px-3 py-1 rounded-lg cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Status metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_CARDS.map(({ status, label, icon, activeStyle }) => (
          <StatusCard
            key={status}
            status={status}
            label={label}
            icon={icon}
            count={countByStatus(status)}
            activeStyle={activeStyle}
            isActive={filterStatus === status}
            onClick={() => setFilterStatus(status)}
          />
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, SĐT, tên khách..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Tất Cả ({orders.length})
          </button>
          <button
            onClick={fetchOrdersList}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">Chưa có đơn hàng nào trong mục này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedOrders.map((order) => {
            const isPending = order.orderStatus === "PENDING";
            const isPreparing = order.orderStatus === "PREPARING";
            const isDelivering = order.orderStatus === "DELIVERING";
            const isCompleted = order.orderStatus === "COMPLETED";
            const isCancelled = order.orderStatus === "CANCELLED";

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden transition hover:shadow-md ${
                  isPending
                    ? "border-amber-400 ring-2 ring-amber-400/20"
                    : isPreparing
                    ? "border-orange-400"
                    : isDelivering
                    ? "border-blue-400"
                    : "border-slate-200"
                }`}
              >
                {/* Card Top */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-slate-900">
                        {order.orderCode}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          isPending
                            ? "bg-amber-100 text-amber-800"
                            : isPreparing
                            ? "bg-orange-100 text-orange-800"
                            : isDelivering
                            ? "bg-blue-100 text-blue-800"
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isPending && "Chờ Duyệt"}
                        {isPreparing && "Bếp Đang Làm"}
                        {isDelivering && "Đang Giao"}
                        {isCompleted && "Hoàn Thành"}
                        {isCancelled && "Đã Hủy"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedBillOrder(order)}
                    title="In Phiếu Bếp / Hóa Đơn"
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-orange-600" />
                  </button>
                </div>

                {/* Customer Details */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-orange-500" />
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="hover:underline font-semibold text-orange-600"
                      >
                        {order.customerPhone}
                      </a>
                    </p>
                    <p className="text-slate-600 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.customerAddress}</span>
                    </p>
                    {order.note && (
                      <p className="bg-amber-50 text-amber-900 p-2 rounded-lg font-medium border border-amber-200/60 mt-1">
                        ⚠️ Note: {order.note}
                      </p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="font-bold uppercase text-[10px] text-slate-400">
                      Món ({order.items?.length}):
                    </span>
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-baseline text-xs">
                          <span className="font-bold text-slate-800">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {item.itemTotal.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="flex items-center justify-between pt-1 font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">PT:</span>
                      <span className="text-slate-800">{order.paymentMethod}</span>
                      <button
                        onClick={() =>
                          handlePatchOrder(order.id, {
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
                  {isPending && (
                    <button
                      onClick={() => handlePatchOrder(order.id, { orderStatus: "PREPARING" })}
                      className="col-span-2 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4" /> Nhận Đơn & Bếp Làm
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => handlePatchOrder(order.id, { orderStatus: "DELIVERING" })}
                      className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Bike className="w-4 h-4" /> Đã Làm Xong ➔ Giao Hàng
                    </button>
                  )}

                  {isDelivering && (
                    <button
                      onClick={() =>
                        handlePatchOrder(order.id, {
                          orderStatus: "COMPLETED",
                          paymentStatus: "PAID",
                        })
                      }
                      className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Hoàn Thành Đơn
                    </button>
                  )}

                  {isCompleted && (
                    <div className="col-span-2 text-center text-emerald-600 text-xs font-bold py-1.5 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Đơn hàng hoàn tất
                    </div>
                  )}

                  {isCancelled && (
                    <div className="col-span-2 text-center text-red-600 text-xs font-bold py-1.5">
                      Đơn hàng đã hủy
                    </div>
                  )}

                  {!isCompleted && !isCancelled && (
                    <button
                      onClick={() => {
                        handlePatchOrder(order.id, { orderStatus: "CANCELLED" });
                      }}
                      className="col-span-2 text-slate-400 hover:text-red-500 py-1 text-[11px] font-normal cursor-pointer"
                    >
                      Hủy đơn hàng này
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Orders Pagination */}
      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
          />
        </div>
      )}

      {/* Bill Print Modal */}
      {selectedBillOrder && (
        <PrintBillModal
          order={selectedBillOrder}
          onClose={() => setSelectedBillOrder(null)}
        />
      )}
    </div>
  );
}
