"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquareHeart,
  Star,
  Search,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Trash2,
  Loader2,
  X,
  Filter,
  HeartHandshake
} from "lucide-react";
import { FeedbackType } from "@/types";
import { getFeedbacks, updateFeedback, deleteFeedback } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "@/context/ToastContext";

export default function AdminFeedbackPage() {
  const [mounted, setMounted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Reply modal state
  const [replyingFeedback, setReplyingFeedback] = useState<FeedbackType | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getFeedbacks();
      setFeedbacks(data);
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

  const openReplyModal = (fb: FeedbackType) => {
    setReplyingFeedback(fb);
    setReplyText(
      fb.reply || `Dạ cảm ơn bạn ${fb.customerName} đã ủng hộ Tiệm Chè Na nhiều nha! Chúc bạn ngon miệng ạ ❤️`
    );
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingFeedback) return;

    setIsSaving(true);
    try {
      await updateFeedback({
        id: replyingFeedback.id,
        reply: replyText.trim(),
        status: "APPROVED",
      });
      setReplyingFeedback(null);
      toast.success("Đã phản hồi đánh giá thành công");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi lưu phản hồi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (fb: FeedbackType) => {
    const newStatus = fb.status === "APPROVED" ? "PENDING" : "APPROVED";
    try {
      await updateFeedback({
        id: fb.id,
        status: newStatus,
      });
      toast.success(`Đã chuyển trạng thái sang ${newStatus === "APPROVED" ? "Hiển thị" : "Chờ duyệt"}`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi cập nhật trạng thái đánh giá");
    }
  };

  const handleDelete = async (fb: FeedbackType) => {
    try {
      await deleteFeedback(fb.id);
      toast.success("Đã xóa đánh giá thành công");
      loadData();
    } catch (err) {
      toast.error("Không thể xóa đánh giá");
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchSearch =
      f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.comment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchRating = filterRating === "ALL" || f.rating === filterRating;
    const matchStatus = filterStatus === "ALL" || f.status === filterStatus;

    return matchSearch && matchRating && matchStatus;
  });

  const totalPages = Math.ceil(filteredFeedbacks.length / pageSize) || 1;
  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : "5.0";

  const fiveStarCount = feedbacks.filter((f) => f.rating === 5).length;
  const pendingCount = feedbacks.filter((f) => f.status === "PENDING").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquareHeart className="w-7 h-7 text-orange-600" />
            <span>Quản Lý Đánh Giá & Phản Hồi (Feedback)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lắng nghe nhận xét của khách hàng, trả lời phản hồi và kiểm duyệt hiển thị
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Điểm Đánh Giá TB</p>
            <p className="text-2xl font-black text-slate-900 flex items-center gap-1">
              <span>{avgRating}</span>
              <span className="text-xs font-bold text-amber-500">/ 5.0 ⭐</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tổng Lượt Nhận Xét</p>
            <p className="text-2xl font-black text-slate-900">{feedbacks.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Đánh Giá 5 Sao</p>
            <p className="text-2xl font-black text-amber-600">{fiveStarCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Chờ Quán Trả Lời</p>
            <p className="text-2xl font-black text-blue-600">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên khách, món ăn, nội dung..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Rating Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(["ALL", 5, 4, 3] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setFilterRating(r);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterRating === r ? "bg-white text-orange-600 shadow-xs" : "text-slate-600"
                  }`}
                >
                  {r === "ALL" ? "Tất Cả Sao" : `${r} ⭐`}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(
                [
                  { key: "ALL", label: "Tất Cả" },
                  { key: "APPROVED", label: "Đã Duyệt" },
                  { key: "PENDING", label: "Chờ Duyệt" },
                ] as const
              ).map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setFilterStatus(s.key);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterStatus === s.key ? "bg-white text-orange-600 shadow-xs" : "text-slate-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <MessageSquareHeart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Chưa có đánh giá nào phù hợp</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedFeedbacks.map((fb) => (
              <div key={fb.id} className="p-5 hover:bg-slate-50/60 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 text-white font-black flex items-center justify-center text-xs shadow-xs">
                      {fb.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">{fb.customerName}</h4>
                        {fb.customerPhone && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({fb.customerPhone})
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-orange-600">{fb.dishName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stars */}
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < fb.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Status badge */}
                    <button
                      onClick={() => handleToggleStatus(fb)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition ${
                        fb.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {fb.status === "APPROVED" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Đã Duyệt</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-amber-600" />
                          <span>Chờ Duyệt</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-slate-400">
                      {new Date(fb.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Comment body */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/90 p-3 rounded-xl border border-slate-100">
                  {fb.comment}
                </p>

                {/* Reply section */}
                {fb.reply ? (
                  <div className="bg-orange-50/70 border border-orange-200/60 p-3 rounded-xl text-xs text-orange-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-orange-800 flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-orange-600" />
                        <span>Phản hồi của Tiệm Chè Na:</span>
                      </span>
                      <button
                        onClick={() => openReplyModal(fb)}
                        className="text-[11px] text-orange-700 hover:underline font-bold cursor-pointer"
                      >
                        Sửa phản hồi
                      </button>
                    </div>
                    <p className="leading-relaxed">{fb.reply}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => openReplyModal(fb)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Trả Lời Khách Hàng</span>
                    </button>

                    <button
                      onClick={() => handleDelete(fb)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Xóa đánh giá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredFeedbacks.length}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      {/* Modal Reply */}
      {replyingFeedback && mounted &&
        createPortal(
          <div
            style={{ zIndex: 99999 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                Trả Lời Nhận Xét Khách Hàng
              </h2>
              <button
                onClick={() => setReplyingFeedback(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                Khách: {replyingFeedback.customerName} ({replyingFeedback.dishName})
              </p>
              <p className="text-slate-600 italic">&ldquo;{replyingFeedback.comment}&rdquo;</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nội Dung Trả Lời Của Quán *
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập lời cảm ơn hoặc giải đáp thắc mắc..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplyingFeedback(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/25 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <span>Lưu & Đăng Trả Lời</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
