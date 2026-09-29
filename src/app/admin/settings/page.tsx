"use client";

import React, { useState, useEffect } from "react";
import { Save, CheckCircle2, QrCode, Store, Lock, ShieldCheck } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getSettings, saveSettings } from "@/lib/api";
import { StoreSettingType } from "@/types";
import { toast } from "@/context/ToastContext";
import { ThemeSelector } from "@/components/admin/ThemeSelector";

const DEFAULT_SETTINGS: StoreSettingType = {
  id: "default",
  storeName: "Tiệm Chè Na",
  hotline: "0986.479.285",
  address: "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội",
  openingHours: "09:00 - 22:30",
  bannerAnnouncement:
    "GIẢM NGAY 10% tổng hóa đơn khi đặt trước hoặc chốt đơn qua Zalo hôm nay!",
  qrBankId: "MB",
  qrAccountNumber: "0986479285",
  qrAccountName: "TIEM CHE NA",
  zaloUrl: "https://zalo.me/0986479285",
  isAcceptingOrders: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingType>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => console.error("Fetch settings error:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange =
    (field: keyof StoreSettingType) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setSettings((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveSettings(settings);
      setSaveSuccess(true);
      toast.success("Đã lưu cấu hình cửa hàng thành công!");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
      toast.error("Không thể lưu cấu hình cửa hàng");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Cài Đặt Cửa Hàng 
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tùy chỉnh thông tin liên hệ, hotline, thông báo ưu đãi và chủ đề giao diện
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu toàn bộ cấu hình thành công!</span>
        </div>
      )}

      {/* 1. Thông Tin Quán Ăn (Ở TRÊN) */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-orange-600" />
            <span>Thông Tin Quán Ăn</span>
          </h3>

          <div className="space-y-3">
            <FormInput
              label="Tên Quán"
              type="text"
              value={settings.storeName || ""}
              onChange={handleChange("storeName")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                label="Hotline Đặt Hàng"
                type="text"
                value={settings.hotline || ""}
                onChange={handleChange("hotline")}
              />
              <FormInput
                label="Giờ Mở Cửa"
                type="text"
                value={settings.openingHours || ""}
                onChange={handleChange("openingHours")}
              />
            </div>

            <FormInput
              label="Địa Chỉ Quán"
              type="text"
              value={settings.address || ""}
              onChange={handleChange("address")}
            />

            <FormInput
              label="Link Zalo OA / Cá Nhân"
              type="url"
              value={settings.zaloUrl || ""}
              onChange={handleChange("zaloUrl")}
            />

            <FormInput
              label="Dòng Chữ Thông Báo Khuyến Mãi Đầu Trang (Banner Bar)"
              type="text"
              value={settings.bannerAnnouncement || ""}
              onChange={handleChange("bannerAnnouncement")}
            />
          </div>
        </div>

        {/* Nút lưu cài đặt */}
        <div className="flex justify-end sm:justify-start">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-orange-600/25 transition cursor-pointer disabled:opacity-50 text-xs"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Lưu Thông Tin Cửa Hàng</span>
          </button>
        </div>
      </form>

      {/* 2. Chủ Đề Giao Diện Lễ Hội (Ở DƯỚI) */}
      <ThemeSelector />
    </div>
  );
}
