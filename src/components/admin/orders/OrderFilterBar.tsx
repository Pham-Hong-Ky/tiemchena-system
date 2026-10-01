"use client";

import React from "react";
import { Search, Trash2, RefreshCw, Filter } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  count: number;
}

interface OrderFilterBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  hideCancelled: boolean;
  setHideCancelled: (v: boolean) => void;
  cancelledCount: number;
  tabs: TabItem[];
  onCleanCancelled: () => void;
  onRefresh: () => void;
}

export function OrderFilterBar({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  hideCancelled,
  setHideCancelled,
  cancelledCount,
  tabs,
  onCleanCancelled,
  onRefresh,
}: OrderFilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
      {/* Top line: Search and Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Nút dọn sạch toàn bộ đơn rác / đã hủy */}
          {cancelledCount > 0 && (
            <button
              type="button"
              onClick={onCleanCancelled}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Xóa vĩnh viễn toàn bộ các đơn đã hủy để dọn sạch dữ liệu"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dọn sạch đơn rác ({cancelledCount})</span>
            </button>
          )}

          {/* Toggle Ẩn đơn đã hủy (khi xem tab Tất Cả) */}
          {filterStatus === "ALL" && (
            <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideCancelled}
                onChange={(e) => setHideCancelled(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span>Ẩn đơn đã hủy</span>
            </label>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Bottom line: Detailed Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3 text-xs scrollbar-none">
        <span className="text-slate-400 font-bold text-[11px] uppercase mr-1 shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Trạng thái:
        </span>
        {tabs.map((tab) => {
          const isCurrent = filterStatus === tab.id;
          const isCancelledTab = tab.id === "CANCELLED";

          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isCurrent
                  ? isCancelledTab
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-900 text-white shadow-xs"
                  : isCancelledTab && tab.count > 0
                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isCurrent
                    ? "bg-white/20 text-white"
                    : isCancelledTab && tab.count > 0
                    ? "bg-rose-200 text-rose-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
