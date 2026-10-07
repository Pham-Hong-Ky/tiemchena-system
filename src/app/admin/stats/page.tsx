"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Award,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getStats } from "@/lib/api";
import { StatsType } from "@/types";

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  subLabel: string;
  icon: LucideIcon;
  colorClass: string;  // e.g. "text-orange-600 bg-orange-50"
  subColorClass: string;
}

function MetricCard({ label, value, subLabel, icon: Icon, colorClass, subColorClass }: MetricCardProps) {
  const [textColor, bgColor] = colorClass.split(" ");
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className={`flex items-center justify-between ${textColor}`}>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
      <span className={`text-[11px] font-bold mt-1 inline-block ${subColorClass}`}>{subLabel}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => console.error("Failed to load stats", e))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (!stats) return null;

  const metrics: MetricCardProps[] = [
    {
      label: "Doanh Thu Hôm Nay",
      value: `${stats.revenueToday.toLocaleString("vi-VN")}đ`,
      subLabel: `${stats.ordersToday} đơn hàng phát sinh`,
      icon: DollarSign,
      colorClass: "text-orange-600 bg-orange-50",
      subColorClass: "text-emerald-600",
    },
    {
      label: "Tổng Giá Trị Đơn",
      value: `${stats.revenueTotal.toLocaleString("vi-VN")}đ`,
      subLabel: `${stats.totalOrders} đơn (gồm cả đơn chưa trả tiền)`,
      icon: TrendingUp,
      colorClass: "text-blue-600 bg-blue-50",
      subColorClass: "text-slate-400",
    },
    {
      label: "Đơn Thành Công",
      value: String(stats.completedCount),
      subLabel: "Tỷ lệ hoàn thành cao",
      icon: CheckCircle2,
      colorClass: "text-emerald-600 bg-emerald-50",
      subColorClass: "text-emerald-600",
    },
    {
      label: "Đơn Đang Chờ Xử Lý",
      value: String(stats.pendingCount),
      subLabel: "Cần bếp tiếp nhận ngay",
      icon: Clock,
      colorClass: "text-amber-600 bg-amber-50",
      subColorClass: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Báo Cáo & Thống Kê Doanh Thu
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi tổng quan tài chính, số lượng đơn hàng và top món ăn bán chạy
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Đối soát số liệu thật */}
      {stats.reconciliation && (
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Đối Soát Số Liệu Thật</h3>
            <span className="text-[11px] text-slate-400">
              (đến {new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })})
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              ["Khách trong CRM", `${stats.reconciliation.customerCount}`, `${stats.reconciliation.customersWithEmail} khách có email`],
              ["Danh sách chờ (tự đăng ký)", `${stats.reconciliation.waitlistCount}`, `${stats.reconciliation.emailSequenceCount} khách đã nhận chuỗi email`],
              ["Đơn đã nhận tiền (Sepay)", `${stats.reconciliation.paidCount} / ${stats.totalOrders}`, "trên tổng số đơn"],
              ["Tiền thật đã nhận", `${stats.reconciliation.revenuePaid.toLocaleString("vi-VN")}đ`, `+ ${stats.reconciliation.completedCodCount} đơn tiền mặt đã giao: ${stats.reconciliation.revenueCompletedCod.toLocaleString("vi-VN")}đ`],
            ].map(([label, value, sub]) => (
              <div key={label} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <p className="font-bold text-slate-500">{label}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-sm">Top 5 Món Bán Chạy Nhất</h3>
          </div>

          <div className="space-y-3">
            {stats.topProducts?.map((prod, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{prod.name}</h4>
                    <p className="text-[11px] text-slate-400">Đã bán {prod.count} suất</p>
                  </div>
                </div>
                <span className="font-extrabold text-orange-600 text-xs">
                  {prod.revenue.toLocaleString("vi-VN")}đ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            <h3 className="font-extrabold text-slate-900 text-sm">Đơn Hàng Gần Đây</h3>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {stats.recentOrders?.slice(0, 5).map((order) => (
              <div key={order.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900">{order.orderCode}</span>
                  <p className="text-[11px] text-slate-400">
                    {order.customerName} •{" "}
                    {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-orange-600">
                    {order.finalAmount.toLocaleString("vi-VN")}đ
                  </span>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">
                    {order.orderStatus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
