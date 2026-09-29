"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UtensilsCrossed,
  Home
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("from") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(redirectUrl);
        router.refresh();
      } else {
        setErrorMsg(data.error || "Tên đăng nhập hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setErrorMsg("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 p-7 sm:p-9 relative z-10 animate-in fade-in zoom-in-95 duration-300">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-3.5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 p-1 shadow-xl shadow-orange-600/30 flex items-center justify-center mx-auto">
            <img
              src="/logo.png"
              alt="Tiệm Chè Na"
              className="w-full h-full object-cover rounded-[22px] bg-white"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-yellow-400 flex items-center justify-center text-xs shadow-md border-2 border-white">
            <Lock className="w-3.5 h-3.5" />
          </span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          HỆ THỐNG QUẢN TRỊ
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Tiệm Chè Na • Quản lý bếp KDS, thực đơn & đơn hàng
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span className="font-semibold leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Tài Khoản Quản Trị
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Nhập tài khoản quản trị..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Mật Khẩu Truy Cập
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Nhập mật khẩu quản trị..."
              className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-orange-600/25 transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang kiểm tra...</span>
            </>
          ) : (
            <>
              <span>Đăng Nhập Quản Trị</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Back to storefront link */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Quay lại trang khách hàng</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience & Grid */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white/95 rounded-3xl p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-2" />
            <span className="text-xs text-slate-500 font-bold">Đang tải giao diện đăng nhập...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
