"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  ChefHat,
  FolderTree,
  Users,
  Tag,
  MessageSquareHeart,
  TrendingUp,
  Settings,
  Store,
  Volume2,
  VolumeX,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from "lucide-react";
import { AdminThemeQuickToggle } from "@/components/admin/AdminThemeQuickToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Sidebar toggle state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?")) return;
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error(e);
      router.push("/admin/login");
      router.refresh();
    }
  };

  // If on login page, do not render admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/admin", label: "Đơn Hàng ", icon: ChefHat },
    { href: "/admin/menu", label: "Quản Lý Món Ăn", icon: UtensilsCrossed },
    { href: "/admin/categories", label: "Danh Mục Món", icon: FolderTree },
    { href: "/admin/users", label: "Khách Hàng", icon: Users },
    { href: "/admin/tags", label: "Quản Lý Thẻ (Tags)", icon: Tag },
    { href: "/admin/feedback", label: "Đánh Giá & Feedback", icon: MessageSquareHeart },
    { href: "/admin/stats", label: "Báo Cáo Doanh Thu", icon: TrendingUp },
    { href: "/admin/settings", label: "Cấu Hình Quán", icon: Settings },
  ];

  return (
    <div className="h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar - Sticky & Fixed on Desktop */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-2xl border-r border-slate-800 transition-all duration-300 ease-in-out overflow-y-auto scrollbar-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-64"} w-72`}
      >
        <div>
          {/* Brand & Close/Collapse Button */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
            <Link
              href="/admin"
              className={`flex items-center gap-3 overflow-hidden transition-all ${
                isCollapsed ? "md:justify-center md:w-full" : ""
              }`}
            >
              <img
                src="/logo.png"
                alt="Tiệm Chè Na"
                className="w-10 h-10 rounded-full object-cover shadow-md shadow-orange-500/20 border border-amber-400/30 shrink-0"
              />
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <span className="font-black text-base text-white tracking-tight truncate block">
                    TIỆM CHÈ NA
                  </span>
                  <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider truncate">
                    Admin
                  </p>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition group ${
                    isActive
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/25"
                      : "hover:bg-slate-800 hover:text-white text-slate-400"
                  } ${isCollapsed ? "md:justify-center md:px-0" : ""}`}
                >
                  <Icon className="w-4 h-4 shrink-0 transition group-hover:scale-110" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800 space-y-2 sticky bottom-0 bg-slate-900/95 backdrop-blur-md">
          {/* Desktop Toggle Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex items-center gap-2.5 w-full py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer ${
              isCollapsed ? "justify-center px-0" : "justify-between"
            }`}
            title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-orange-400" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <PanelLeftClose className="w-4 h-4 text-orange-400" />
                  <span>Thu Gọn Menu</span>
                </div>
              </>
            )}
          </button>

          {/* Open Storefront */}
          <Link
            href="/"
            target="_blank"
            title={isCollapsed ? "Mở Web Khách Hàng" : undefined}
            className={`flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition border border-slate-700 ${
              isCollapsed ? "md:px-0" : ""
            }`}
          >
            <Store className="w-4 h-4 text-orange-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Web Khách Hàng</span>}
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Đăng xuất" : undefined}
            className={`flex items-center justify-center gap-2 w-full py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl text-xs font-bold transition border border-red-800/40 cursor-pointer ${
              isCollapsed ? "md:px-0" : ""
            }`}
          >
            <LogOut className="w-4 h-4 text-red-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Đăng Xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header - Fixed at Top */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-xs z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Quick Toggle Sidebar Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 transition cursor-pointer"
              title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Hệ Thống Trực Tuyến</span>
            </span>

            {currentTime && (
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                🕒 {currentTime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Theme Festival Switcher */}
            <AdminThemeQuickToggle />

            {/* Audio notification toggle */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={soundEnabled ? "Đang bật chuông thông báo đơn" : "Đã tắt chuông"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                soundEnabled
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? "Chuông: BẬT" : "Chuông: TẮT"}</span>
            </button>

            {/* Header Logout button */}
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi trang quản trị"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="hidden sm:inline">Đăng Xuất</span>
            </button>
          </div>
        </header>

        {/* Page Content - Scrolls independently */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-0">{children}</main>
      </div>
    </div>
  );
}
