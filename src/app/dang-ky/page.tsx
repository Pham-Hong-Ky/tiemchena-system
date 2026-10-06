"use client";

/**
 * Form khách quen (Ngày 11): khách để lại tên + SĐT + email →
 * lưu vào CRM (/admin → Khách hàng) và tự nhận chuỗi 3 email chăm sóc qua Resend.
 */

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { validatePhoneNumber, validateCustomerName, validateEmail } from "@/lib/orderValidation";

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [websiteHp, setWebsiteHp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState<{ name: string; testMode: boolean } | null>(null);

  const validate = () => {
    const next: Record<string, string> = {};
    const n = validateCustomerName(name);
    if (!n.valid) next.name = n.error || "Tên không hợp lệ";
    const p = validatePhoneNumber(phone);
    if (!p.valid) next.phone = p.error || "Số điện thoại không hợp lệ";
    const e = validateEmail(email);
    if (!email.trim()) next.email = "Vui lòng nhập email để nhận ưu đãi khách quen";
    else if (!e.valid) next.email = e.error || "Email không hợp lệ";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, note, website_hp: websiteHp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Không thể đăng ký, vui lòng thử lại");
      setDone({ name: data.data.name, testMode: Boolean(data.data.emails?.testMode) });
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = (key: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
      errors[key] ? "border-red-400" : "border-slate-200"
    }`;

  if (done) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-7 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-black text-slate-900">Cảm ơn {done.name} nha!</h1>
          <p className="text-sm text-slate-600">
            Na vừa gửi thư chào vào email của bạn. Không thấy thì xem thử mục <b>Quảng cáo</b> hoặc <b>Spam</b> giúp Na nha.
          </p>
          {done.testMode && (
            <p className="text-xs font-semibold text-orange-700 bg-orange-50 rounded-xl px-3 py-2">
              Chế độ test (+test): cả 3 email được gửi ngay, không chờ lịch.
            </p>
          )}
          <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold">
            Xem menu & đặt món
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center space-y-1">
          <Link href="/" className="text-xs font-bold text-orange-600">
            ← Tiệm Chè Na
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Đăng ký khách quen</h1>
          <p className="text-sm text-slate-600">
            Để lại email, Na gửi bạn mẹo ăn đồ ship vẫn ngon + ưu đãi riêng cho khách quen. Không spam đâu ak.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 space-y-4">
          <div className="space-y-1">
            <label htmlFor="wl-name" className="text-xs font-bold text-slate-700">Họ tên *</label>
            <input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Thị Hoa" className={inputCls("name")} />
            {errors.name && <p className="text-[11px] text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="wl-phone" className="text-xs font-bold text-slate-700">Số điện thoại / Zalo *</label>
            <input
              id="wl-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="numeric"
              placeholder="09xx xxx xxx"
              className={inputCls("phone")}
            />
            {errors.phone && <p className="text-[11px] text-red-600">{errors.phone}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="wl-email" className="text-xs font-bold text-slate-700">Email *</label>
            <input
              id="wl-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              placeholder="tenban@gmail.com"
              className={inputCls("email")}
            />
            {errors.email && <p className="text-[11px] text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="wl-note" className="text-xs font-bold text-slate-700">Bạn hay thèm món gì? (không bắt buộc)</label>
            <input id="wl-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nem nướng, chè xoài..." className={inputCls("note")} />
          </div>

          {/* Honeypot chống bot */}
          <input
            type="text"
            value={websiteHp}
            onChange={(e) => setWebsiteHp(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {formError && <p className="text-xs font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
            {isSubmitting ? "Đang gửi..." : "Giơ tay làm khách quen"}
          </button>
        </form>
      </div>
    </main>
  );
}
