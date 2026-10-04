"use client";

import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Clock,
  Bike,
  CheckCircle2,
  Volume2,
  Ban,
} from "lucide-react";
import { PrintBillModal } from "@/components/admin/PrintBillModal";
import { StatusCard } from "@/components/admin/StatusCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AdminOrderCard } from "@/components/admin/orders/AdminOrderCard";
import { OrderFilterBar } from "@/components/admin/orders/OrderFilterBar";
import { getOrders, patchOrder, deleteOrder, cleanCancelledOrders, blacklistOrder } from "@/lib/api";
import { OrderType } from "@/types";
import { toast } from "@/context/ToastContext";
import { playOrderNotificationSound } from "@/lib/notificationSound";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CARDS = [
  {
    status: "PENDING",
    label: "Chờ Duyệt (Mới)",
    icon: Clock,
    activeStyle: "bg-amber-500 text-white border-amber-600",
  },
  {
    status: "CONFIRMED",
    label: "Đã Nhận Đơn",
    icon: ChefHat,
    activeStyle: "bg-blue-600 text-white border-blue-700",
  },
  {
    status: "COMPLETED",
    label: "Đã Hoàn Thành",
    icon: CheckCircle2,
    activeStyle: "bg-emerald-600 text-white border-emerald-700",
  },
  {
    status: "CANCELLED",
    label: "Đã Hủy / Đơn Rác",
    icon: Ban,
    activeStyle: "bg-rose-600 text-white border-rose-700",
  },
] as const;

export default function AdminKdsPage() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [hideCancelled, setHideCancelled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBillOrder, setSelectedBillOrder] = useState<OrderType | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  // Modals confirmation state
  const [orderToDelete, setOrderToDelete] = useState<OrderType | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderType | null>(null);
  const [orderToBlacklist, setOrderToBlacklist] = useState<OrderType | null>(null);
  const [isCleanModalOpen, setIsCleanModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Lưu danh sách order IDs đã biết để phát chuông chính xác khi có đơn mới
  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());
  const isInitialLoadRef = React.useRef(true);

  const fetchOrdersList = async (isPoll = false) => {
    try {
      const data = await getOrders();

      if (!isInitialLoadRef.current && isPoll) {
        // Tìm các đơn mới chưa từng thấy
        const newOrders = data.filter(
          (o) => !knownOrderIdsRef.current.has(o.id) && o.orderStatus === "PENDING"
        );
        if (newOrders.length > 0) {
          playOrderNotificationSound();
          const first = newOrders[0];
          setNewOrderAlert(`Đơn mới: ${first.orderCode} - ${first.customerName}`);
          setTimeout(() => setNewOrderAlert(null), 6000);
        }
      }

      data.forEach((o) => knownOrderIdsRef.current.add(o.id));
      isInitialLoadRef.current = false;
      setOrders(data);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersList(false);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/sse/orders");
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "NEW_ORDER" && payload.data) {
            const isNew = !knownOrderIdsRef.current.has(payload.data.id);
            knownOrderIdsRef.current.add(payload.data.id);
            setOrders((prev) => [payload.data, ...prev.filter((o) => o.id !== payload.data.id)]);
            
            if (isNew) {
              playOrderNotificationSound();
              setNewOrderAlert(`Đơn mới: ${payload.data.orderCode} - ${payload.data.customerName}`);
              setTimeout(() => setNewOrderAlert(null), 6000);
            }
          } else if (payload.type === "ORDER_UPDATED" && payload.data) {
            setOrders((prev) => prev.map((o) => (o.id === payload.data.id ? payload.data : o)));
          }
        } catch {}
      };
    } catch (e) {
      console.warn("SSE init warning", e);
    }

    // Polling nhanh mỗi 5s để đảm bảo 100% không bao giờ bị miss chuông
    const fallbackPollInterval = setInterval(() => {
      fetchOrdersList(true);
    }, 5000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(fallbackPollInterval);
    };
  }, []);

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

  const handleConfirmBlacklistOrder = async () => {
    if (!orderToBlacklist) return;
    setIsActionLoading(true);
    try {
      const res = await blacklistOrder(orderToBlacklist.id, "Bom hàng / Đơn ảo");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderToBlacklist.id ? res.data : o))
      );
      toast.success(`Đã chặn SĐT ${orderToBlacklist.customerPhone} vào danh sách đen và hủy đơn!`);
      setOrderToBlacklist(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Không thể chặn số điện thoại này");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsActionLoading(true);
    try {
      await deleteOrder(orderToDelete.id);
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      toast.success(`Đã xóa vĩnh viễn đơn hàng ${orderToDelete.orderCode}`);
      setOrderToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error("Không thể xóa đơn hàng");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmCleanCancelled = async () => {
    setIsActionLoading(true);
    try {
      const res = await cleanCancelledOrders();
      setOrders((prev) => prev.filter((o) => o.orderStatus !== "CANCELLED"));
      toast.success(res.message || `Đã dọn dẹp ${res.count || 0} đơn hàng rác/đã hủy!`);
      setIsCleanModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Không thể dọn dẹp đơn hàng đã hủy");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsActionLoading(true);
    try {
      await handlePatchOrder(orderToCancel.id, { orderStatus: "CANCELLED" });
      setOrderToCancel(null);
      toast.success(`Đã hủy đơn ${orderToCancel.orderCode}. Đơn đã được chuyển vào mục Đã Hủy`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    let matchStatus = true;
    if (filterStatus === "ACTIVE") {
      matchStatus = o.orderStatus !== "CANCELLED";
    } else if (filterStatus === "ALL") {
      matchStatus = !hideCancelled || o.orderStatus !== "CANCELLED";
    } else if (filterStatus === "CONFIRMED") {
      matchStatus = o.orderStatus === "CONFIRMED" || o.orderStatus === "PREPARING" || o.orderStatus === "DELIVERING";
    } else {
      matchStatus = o.orderStatus === filterStatus;
    }

    const matchSearch =
      !searchQuery.trim() ||
      o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery.trim());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const countByStatus = (s: string) => {
    if (s === "CONFIRMED") {
      return orders.filter((o) => o.orderStatus === "CONFIRMED" || o.orderStatus === "PREPARING" || o.orderStatus === "DELIVERING").length;
    }
    return orders.filter((o) => o.orderStatus === s).length;
  };
  const activeOrdersCount = orders.filter((o) => o.orderStatus !== "CANCELLED").length;
  const cancelledOrdersCount = countByStatus("CANCELLED");

  const filterTabs = [
    { id: "ACTIVE", label: "Đang Hoạt Động", count: activeOrdersCount },
    { id: "PENDING", label: "Chờ Duyệt", count: countByStatus("PENDING") },
    { id: "CONFIRMED", label: "Đã Nhận Đơn", count: countByStatus("CONFIRMED") },
    { id: "COMPLETED", label: "Đã Hoàn Thành", count: countByStatus("COMPLETED") },
    { id: "CANCELLED", label: "Đã Hủy (Đơn Rác)", count: cancelledOrdersCount },
    { id: "ALL", label: "Toàn Bộ", count: orders.length },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Alert toast */}
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

      {/* Metric cards */}
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
      <OrderFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        hideCancelled={hideCancelled}
        setHideCancelled={setHideCancelled}
        cancelledCount={cancelledOrdersCount}
        tabs={filterTabs}
        onCleanCancelled={() => setIsCleanModalOpen(true)}
        onRefresh={fetchOrdersList}
      />

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-2">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">Chưa có đơn hàng nào trong mục này</p>
          {filterStatus === "CANCELLED" && (
            <p className="text-xs text-slate-400">Tuyệt vời! Không có đơn rác nào bị hủy trong hệ thống.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedOrders.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              onPrintBill={() => setSelectedBillOrder(order)}
              onQuickDelete={() => setOrderToDelete(order)}
              onCancelOrder={() => setOrderToCancel(order)}
              onBlacklistOrder={() => setOrderToBlacklist(order)}
              onPatchOrder={(patch) => handlePatchOrder(order.id, patch)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
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

      {/* Modals */}
      {selectedBillOrder && (
        <PrintBillModal
          order={selectedBillOrder}
          onClose={() => setSelectedBillOrder(null)}
        />
      )}

      {orderToBlacklist && (
        <ConfirmModal
          isOpen={true}
          title={`🚫 Chặn SĐT & IP: ${orderToBlacklist.customerPhone}`}
          message={`Bạn có chắc chắn muốn đưa số điện thoại "${orderToBlacklist.customerPhone}" (${orderToBlacklist.customerName}) và địa chỉ thiết bị này vào DANH SÁCH ĐEN? Người này sẽ bị chặn vĩnh viễn không thể đặt hàng trên hệ thống nữa. Đơn hàng này cũng sẽ tự động bị hủy.`}
          confirmText="Xác nhận Chặn & Hủy đơn"
          cancelText="Bỏ qua"
          isDanger={true}
          isLoading={isActionLoading}
          onConfirm={handleConfirmBlacklistOrder}
          onClose={() => setOrderToBlacklist(null)}
        />
      )}

      {orderToCancel && (
        <ConfirmModal
          isOpen={true}
          title={`Hủy đơn hàng ${orderToCancel.orderCode}`}
          message={`Bạn có chắc chắn muốn hủy đơn hàng của khách "${orderToCancel.customerName}" không? Đơn sau khi hủy sẽ tự động ẩn khỏi danh sách bếp/giao hàng để tránh làm rối.`}
          confirmText="Xác nhận hủy đơn"
          cancelText="Giữ lại đơn"
          isDanger={true}
          isLoading={isActionLoading}
          onConfirm={handleConfirmCancelOrder}
          onClose={() => setOrderToCancel(null)}
        />
      )}

      {orderToDelete && (
        <ConfirmModal
          isOpen={true}
          title={`Xóa vĩnh viễn đơn rác ${orderToDelete.orderCode}`}
          message={`Hành động này sẽ xóa hoàn toàn đơn hàng này khỏi cơ sở dữ liệu. Dữ liệu sẽ không thể khôi phục lại. Bạn có chắc chắn muốn xóa không?`}
          confirmText="Xóa vĩnh viễn"
          cancelText="Hủy bỏ"
          isDanger={true}
          isLoading={isActionLoading}
          onConfirm={handleConfirmDeleteOrder}
          onClose={() => setOrderToDelete(null)}
        />
      )}

      <ConfirmModal
        isOpen={isCleanModalOpen}
        title="Dọn sạch toàn bộ đơn rác / đã hủy"
        message={`Bạn có chắc muốn xóa vĩnh viễn toàn bộ ${cancelledOrdersCount} đơn hàng đã hủy? Thao tác này sẽ giải phóng dữ liệu và không thể hoàn tác.`}
        confirmText={`Xóa ${cancelledOrdersCount} đơn rác`}
        cancelText="Đóng"
        isDanger={true}
        isLoading={isActionLoading}
        onConfirm={handleConfirmCleanCancelled}
        onClose={() => setIsCleanModalOpen(false)}
      />
    </div>
  );
}
