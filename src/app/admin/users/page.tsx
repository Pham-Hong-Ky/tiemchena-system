"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Search,
  Crown,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
  ExternalLink,
  X,
  FileText,
  UserCheck,
  TrendingUp,
  DollarSign,
  Plus,
  Upload,
  Pencil,
  Trash2,
} from "lucide-react";
import { CustomerType } from "@/types";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomers,
  CustomerPayload,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "@/context/ToastContext";

const SOURCE_LABEL: Record<string, { text: string; cls: string }> = {
  waitlist: { text: "Danh sách chờ", cls: "bg-purple-100 text-purple-700" },
  order: { text: "Đặt đơn", cls: "bg-emerald-100 text-emerald-700" },
  manual: { text: "Thêm tay", cls: "bg-slate-200 text-slate-700" },
};

const EMPTY_FORM: CustomerPayload = { name: "", phone: "", zalo: "", email: "", address: "", note: "" };

/**
 * Đọc dữ liệu dán từ Google Sheets (mỗi dòng 1 khách, các ô cách nhau bằng Tab hoặc dấu phẩy).
 * Tự tìm ô số điện thoại; tên = ô chữ đứng trước số điện thoại (bỏ qua ô ngày giờ).
 */
function parseWaitlistPaste(text: string): CustomerPayload[] {
  const rows: CustomerPayload[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
    const phoneIdx = cells.findIndex((c) => /^0\d{9}$/.test(c.replace(/[\s.-]/g, "")));
    if (phoneIdx === -1) continue;
    const name = cells
      .slice(0, phoneIdx)
      .reverse()
      .find((c) => c && !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(c) && !/^\d/.test(c));
    if (!name) continue;
    const rest = cells.slice(phoneIdx + 1).filter(Boolean);
    rows.push({
      name,
      phone: cells[phoneIdx].replace(/[\s.-]/g, ""),
      address: rest[0] || "",
      note: rest.length > 1 ? `Khảo sát: ${rest.slice(1).join(" | ")}`.slice(0, 500) : "",
    });
  }
  return rows;
}

export default function AdminUsersPage() {
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVip, setFilterVip] = useState<"ALL" | "VIP" | "REGULAR">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);

  // Thêm / sửa khách
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerPayload>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Nhập danh sách chờ
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const importPreview = parseWaitlistPaste(importText);

  const openCreate = (prefill?: CustomerType) => {
    setEditingId(null);
    setForm(
      prefill
        ? { ...EMPTY_FORM, name: prefill.name, phone: prefill.phone, address: prefill.address || "" }
        : EMPTY_FORM
    );
    setFormOpen(true);
  };

  const openEdit = (c: CustomerType) => {
    if (!c.id) return;
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      zalo: c.zalo || "",
      email: c.email || "",
      address: c.address || "",
      note: c.note || "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
        toast.success("Đã cập nhật khách hàng");
      } else {
        await createCustomer(form);
        toast.success("Đã thêm khách hàng");
      }
      setFormOpen(false);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể lưu khách hàng");
    } finally {
      setIsSaving(false);
    }
  };

  // Bấm Xóa 2 lần trong 4 giây mới xóa thật
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = async (c: CustomerType) => {
    if (!c.id) return;
    if (pendingDeleteId !== c.id) {
      setPendingDeleteId(c.id);
      toast.warning(`Bấm "Xóa" lần nữa để xóa "${c.name}" (đơn hàng cũ vẫn giữ nguyên)`);
      setTimeout(() => setPendingDeleteId((cur) => (cur === c.id ? null : cur)), 4000);
      return;
    }
    setPendingDeleteId(null);
    try {
      await deleteCustomer(c.id);
      toast.success("Đã xóa khách hàng");
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xóa khách hàng");
    }
  };

  const handleImport = async () => {
    if (importPreview.length === 0) {
      toast.warning("Chưa đọc được dòng nào có Tên + Số điện thoại");
      return;
    }
    setIsSaving(true);
    try {
      const res = await importCustomers(importPreview);
      toast.success(
        `Đã nhập ${res.created} khách mới, cập nhật ${res.updated} khách đã có, bỏ qua ${res.skipped} số trùng`
      );
      if (res.errors.length) toast.warning(`${res.errors.length} dòng lỗi: ${res.errors[0]}`);
      setImportOpen(false);
      setImportText("");
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể nhập danh sách");
    } finally {
      setIsSaving(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.address || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchFilter =
      filterVip === "ALL" ||
      (filterVip === "VIP" && c.isVip) ||
      (filterVip === "REGULAR" && !c.isVip);

    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const vipCount = customers.filter((c) => c.isVip).length;
  const avgOrders =
    customers.length > 0
      ? (customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-orange-600" />
            <span>Quản Lý Khách Hàng & Người Dùng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi danh sách khách hàng, tần suất đặt món, chi tiêu và phân hạng khách quen VIP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Nhập Danh Sách Chờ</span>
          </button>
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khách</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tổng Khách Hàng</p>
            <p className="text-2xl font-black text-slate-900">{customers.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Khách Thân Thiết (VIP)</p>
            <p className="text-2xl font-black text-amber-600">{vipCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tổng Chi Tiêu Đã Ghi Nhận</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">
              {totalRevenue.toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Đơn Trung Bình / Khách</p>
            <p className="text-2xl font-black text-slate-900">{avgOrders} đơn</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, SĐT, địa chỉ..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {(
              [
                { key: "ALL", label: "Tất Cả" },
                { key: "VIP", label: "🌟 Khách VIP" },
                { key: "REGULAR", label: "Khách Mới" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilterVip(f.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterVip === f.key
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Chưa có khách hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Số Điện Thoại</th>
                  <th className="py-3.5 px-4">Địa Chỉ Đơn Gần Nhất</th>
                  <th className="py-3.5 px-4">Số Đơn Hàng</th>
                  <th className="py-3.5 px-4">Tổng Chi Tiêu</th>
                  <th className="py-3.5 px-4">Đơn Gần Nhất</th>
                  <th className="py-3.5 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.phone} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 text-white font-black flex items-center justify-center text-xs shadow-xs">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{customer.name}</span>
                            {customer.isVip && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> VIP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {customer.source && SOURCE_LABEL[customer.source] && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SOURCE_LABEL[customer.source].cls}`}>
                                {SOURCE_LABEL[customer.source].text}
                              </span>
                            )}
                            {customer.email && (
                              <span className="text-[10px] font-medium text-slate-400">{customer.email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex items-center gap-1 hover:text-orange-600 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-orange-500" />
                        <span>{customer.phone}</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.address || "Chưa cập nhật"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full font-bold">
                        {customer.totalOrders} đơn
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-orange-600 text-sm">
                      {customer.totalSpent.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {customer.totalOrders > 0
                            ? new Date(customer.lastOrderDate).toLocaleDateString("vi-VN")
                            : "Chưa có đơn"}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lịch Sử</span>
                      </button>
                      {customer.id ? (
                        <>
                          <button
                            onClick={() => openEdit(customer)}
                            title="Sửa khách"
                            className="inline-flex items-center p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer)}
                            title="Xóa khách"
                            className={`inline-flex items-center p-1.5 rounded-lg transition cursor-pointer ${
                              pendingDeleteId === customer.id
                                ? "bg-red-600 text-white"
                                : "bg-slate-100 hover:bg-red-50 hover:text-red-600"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openCreate(customer)}
                          title="Lưu khách này vào danh sách CRM để sửa / ghi chú"
                          className="inline-flex items-center p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCustomers.length}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      {/* Modal View Customer Details & Order History */}
      {selectedCustomer && mounted &&
        createPortal(
          <div
            style={{ zIndex: 99999 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{selectedCustomer.name}</span>
                    {selectedCustomer.isVip && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" /> VIP
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick stats in modal */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Tổng Số Đơn</p>
                <p className="text-lg font-black text-slate-900">
                  {selectedCustomer.totalOrders} đơn hàng
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Tổng Chi Tiêu</p>
                <p className="text-lg font-black text-orange-600">
                  {selectedCustomer.totalSpent.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Địa Chỉ Đơn Gần Nhất (Thay đổi theo từng đơn)
              </p>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedCustomer.address || "Chưa có thông tin địa chỉ"}
              </p>
            </div>

            {/* Recent Orders List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Đơn Hàng Gần Đây ({selectedCustomer.recentOrders?.length || 0})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedCustomer.recentOrders?.map((ord) => (
                  <div
                    key={ord.orderCode}
                    className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{ord.orderCode}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-orange-600">
                        {ord.finalAmount.toLocaleString("vi-VN")}đ
                      </p>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {ord.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Thêm / Sửa khách */}
      {formOpen && mounted &&
        createPortal(
          <div
            style={{ zIndex: 99999 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900">
                  {editingId ? "Sửa Thông Tin Khách" : "Thêm Khách Hàng"}
                </h2>
                <button
                  onClick={() => setFormOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(
                [
                  { key: "name", label: "Họ tên *", placeholder: "Nguyễn Thị Hoa" },
                  { key: "phone", label: "Số điện thoại *", placeholder: "09xx xxx xxx" },
                  { key: "zalo", label: "Zalo", placeholder: "Để trống = trùng SĐT" },
                  { key: "email", label: "Email", placeholder: "tenban@gmail.com" },
                  { key: "address", label: "Địa chỉ", placeholder: "Ngõ, đường, xã/phường" },
                  { key: "note", label: "Ghi chú", placeholder: "Khẩu vị, món hay đặt…" },
                ] as const
              ).map((f) => (
                <div key={f.key}>
                  <label className="block font-bold text-slate-700 mb-1">{f.label}</label>
                  <input
                    value={form[f.key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    type={f.key === "email" ? "email" : f.key === "phone" || f.key === "zalo" ? "tel" : "text"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Nhập danh sách chờ */}
      {importOpen && mounted &&
        createPortal(
          <div
            style={{ zIndex: 99999 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900">Nhập Khách Từ Danh Sách Chờ</h2>
                <button
                  onClick={() => setImportOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-600">
                Mở Google Sheets danh sách chờ → bôi đen các dòng khách (không cần dòng tiêu đề) →
                <b> Ctrl+C</b> → dán vào ô dưới. Số điện thoại đã có sẽ tự bỏ qua.
              </p>
              <textarea
                rows={7}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"04/10/2026 12:34:48\tTên khách\t09xxxxxxxx\tĐịa chỉ\t..."}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 max-h-40 overflow-y-auto">
                <p className="font-bold text-slate-700 mb-1">Đọc được {importPreview.length} khách:</p>
                {importPreview.map((r, i) => (
                  <p key={i} className="text-slate-600">
                    {i + 1}. <b>{r.name}</b> – {r.phone} {r.address && `– ${r.address}`}
                  </p>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setImportOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleImport}
                  disabled={isSaving || importPreview.length === 0}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? "Đang nhập..." : `Nhập ${importPreview.length} khách`}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
