"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  ChefHat,
  FolderTree,
  Users,
  TrendingUp,
  Settings,
  Store,
  Volume2,
  VolumeX,
  Menu,
  X,
  LogOut,
  BellRing,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { isSoundEnabled, setSoundEnabledStorage, playOrderNotificationSound } from "@/lib/notificationSound";
import { toast } from "@/context/ToastContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Sidebar toggle state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMenuSubOpen, setIsMenuSubOpen] = useState(true);

  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
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
    try {
      toast.info("Đang đăng xuất khỏi hệ thống...");
      await fetch("/api/admin/auth/logout", { method: "POST" });
      toast.success("Đã đăng xuất thành công");
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi đăng xuất");
      router.push("/admin/login");
      router.refresh();
    }
  };

  // If on login page, do not render admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const isMenuSectionActive = pathname.startsWith("/admin/menu");

  const menuSubItems = [
    { href: "/admin/menu/an-vat", label: "Đồ Ăn Vặt" },
    { href: "/admin/menu/che", label: "Món Chè" },
    { href: "/admin/menu/do-uong", label: "Đồ Uống" },
    { href: "/admin/menu", label: "Tất Cả Món" },
  ];

  const navItems = [
    { href: "/admin", label: "Đơn Hàng", icon: ChefHat },
    {
      href: "/admin/menu",
      label: "Quản Lý Món Ăn",
      icon: UtensilsCrossed,
      isSubMenu: true,
      subItems: menuSubItems,
    },
    { href: "/admin/categories", label: "Danh Mục Món", icon: FolderTree },
    { href: "/admin/users", label: "Khách Hàng", icon: Users },
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
              const isSub = Boolean(item.isSubMenu);
              const isActive = isSub ? isMenuSectionActive : pathname === item.href;

              if (isSub) {
                return (
                  <div key={item.label} className="space-y-1">
                    <div
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition group cursor-pointer ${
                        isActive
                          ? "bg-slate-800 text-orange-400 border border-slate-700/60"
                          : "hover:bg-slate-800/70 hover:text-white text-slate-400"
                      } ${isCollapsed ? "md:justify-center md:px-0" : ""}`}
                      onClick={() => !isCollapsed && setIsMenuSubOpen(!isMenuSubOpen)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          if (!isCollapsed) {
                            // allow normal navigation
                          }
                        }}
                        className={`flex items-center gap-3 flex-1 ${
                          isCollapsed ? "justify-center" : ""
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 transition group-hover:scale-110 text-orange-500" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>

                      {!isCollapsed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuSubOpen(!isMenuSubOpen);
                          }}
                          className="p-1 text-slate-500 hover:text-white transition"
                        >
                          {isMenuSubOpen ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Submenu Items */}
                    {!isCollapsed && isMenuSubOpen && (
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-5 my-1">
                        {menuSubItems.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                                isSubActive
                                  ? "bg-orange-600 text-white shadow-xs shadow-orange-600/30"
                                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

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

        {/* Bottom Actions - Clean & compact */}
        <div className="p-3 border-t border-slate-800 space-y-2 sticky bottom-0 bg-slate-900/95 backdrop-blur-md">
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

            {/* Desktop Unified Toggle Sidebar Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 transition cursor-pointer text-xs font-bold"
              title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
            >
              <Menu className="w-4 h-4" />
              <span className="text-[11px]">{isCollapsed ? "Mở menu" : "Thu gọn"}</span>
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
            {/* Audio notification toggle + Test sound */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  setSoundEnabledStorage(next);
                  if (next) {
                    playOrderNotificationSound();
                    toast.success("Đã bật chuông báo đơn mới");
                  } else {
                    toast.info("Đã tắt chuông báo");
                  }
                }}
                title={soundEnabled ? "Đang bật chuông thông báo đơn" : "Đã tắt chuông"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  soundEnabled
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{soundEnabled ? "Chuông: BẬT" : "Chuông: TẮT"}</span>
              </button>

              {soundEnabled && (
                <button
                  type="button"
                  onClick={() => playOrderNotificationSound()}
                  title="Bấm để nghe thử tiếng chuông báo đơn"
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-orange-600 hover:bg-white rounded-md transition cursor-pointer flex items-center gap-1"
                >
                  <BellRing className="w-3 h-3 text-orange-500" />
                  <span className="hidden md:inline">Thử chuông</span>
                </button>
              )}
            </div>

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
