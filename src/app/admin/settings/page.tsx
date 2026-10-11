"use client";

import React, { useState, useEffect } from "react";
import { Save, CheckCircle2, QrCode, Store, Lock, ShieldCheck, Send, Bell, Search, Copy } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  getSettings,
  saveSettings,
  getTelegramStatus,
  sendTelegramTest,
  detectTelegramChats,
  TelegramDetectResult,
} from "@/lib/api";
import { StoreSettingType } from "@/types";
import { toast } from "@/context/ToastContext";
import { ThemeSelector } from "@/components/admin/ThemeSelector";
import { SHOP_ENV } from "@/config/shopEnv";

const DEFAULT_SETTINGS: StoreSettingType = {
  id: "default",
  storeName: "Tiệm Chè Na",
  hotline: SHOP_ENV.hotline || "",
  address: "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội",
  openingHours: "09:00 - 22:30",
  bannerAnnouncement:
    "GIẢM NGAY 10% tổng hóa đơn khi đặt trước hoặc chốt đơn qua Zalo hôm nay!",
  qrBankId: SHOP_ENV.bankId || "MB",
  qrAccountNumber: SHOP_ENV.accountNumber || "",
  qrAccountName: SHOP_ENV.accountName || "TIEM CHE NA",
  zaloUrl: SHOP_ENV.zaloPhone ? `https://zalo.me/${SHOP_ENV.zaloPhone}` : "",
  isAcceptingOrders: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingType>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [telegram, setTelegram] = useState<{ configured: boolean; hasToken: boolean; chatCount: number } | null>(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [detectResult, setDetectResult] = useState<TelegramDetectResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => console.error("Fetch settings error:", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    getTelegramStatus()
      .then(setTelegram)
      .catch(() => setTelegram({ configured: false, hasToken: false, chatCount: 0 }));
  }, []);

  const handleDetectTelegram = async () => {
    setIsDetecting(true);
    setDetectResult(null);
    try {
      const result = await detectTelegramChats();
      setDetectResult(result);
      if (result.chats.length === 0 && !result.error) {
        toast.info("Chưa thấy chat nào. Hãy mở bot, bấm Start và gửi thử 1 tin nhắn rồi dò lại.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không dò được chat id");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCopyChatId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Không copy được, bạn hãy chọn và copy thủ công");
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    try {
      await sendTelegramTest();
      toast.success("Đã gửi tin nhắn thử về Telegram!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không gửi được tin nhắn thử");
    } finally {
      setIsTestingTelegram(false);
    }
  };

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

      {/* 2. Thông Báo Telegram */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bell className="w-4 h-4 text-sky-600" />
          <span>Thông Báo Đơn Hàng Qua Telegram</span>
        </h3>

        <p className="text-slate-500 leading-relaxed">
          Khi có đơn mới, bot Telegram sẽ tự động nhắn về các chat đã cấu hình. Cần điền{" "}
          <code className="px-1 py-0.5 bg-slate-100 rounded">TELEGRAM_BOT_TOKEN</code> và{" "}
          <code className="px-1 py-0.5 bg-slate-100 rounded">TELEGRAM_CHAT_ID</code> vào biến môi trường
          (nhiều người nhận thì ngăn cách bằng dấu phẩy).
        </p>

        <ol className="list-decimal list-inside space-y-1 text-slate-500 leading-relaxed">
          <li>Tạo bot với <b>@BotFather</b> → dán token vào <code className="px-1 py-0.5 bg-slate-100 rounded">TELEGRAM_BOT_TOKEN</code>.</li>
          <li>Mở bot, bấm <b>Start</b> và gửi thử một tin nhắn (hoặc thêm bot vào nhóm rồi nhắn trong nhóm).<br />
            <span className="text-amber-600 font-semibold">Chưa chat với bot thì getUpdates sẽ rỗng, không có chat id.</span></li>
          <li>Bấm <b>Dò Chat ID</b> bên dưới để lấy ID, rồi dán vào <code className="px-1 py-0.5 bg-slate-100 rounded">TELEGRAM_CHAT_ID</code>.</li>
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-full ${
              telegram?.configured
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${telegram?.configured ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            {telegram?.configured
              ? `Đã kết nối • ${telegram.chatCount} người nhận`
              : telegram?.hasToken
                ? "Đã có token • chưa có Chat ID"
                : "Chưa cấu hình bot Telegram"}
          </span>

          <button
            type="button"
            onClick={handleDetectTelegram}
            disabled={isDetecting || !telegram?.hasToken}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-slate-800/20 transition cursor-pointer disabled:opacity-50"
          >
            {isDetecting ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Dò Chat ID</span>
          </button>

          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={isTestingTelegram || !telegram?.configured}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {isTestingTelegram ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Gửi Tin Nhắn Thử</span>
          </button>
        </div>

        {detectResult && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            {detectResult.error ? (
              <p className="text-rose-600 font-semibold">⚠️ {detectResult.error}</p>
            ) : detectResult.webhookUrl ? (
              <p className="text-amber-700 font-semibold">
                ⚠️ Bot đang đặt webhook nên getUpdates không trả về chat. Hãy xóa webhook{" "}
                (<code className="px-1 py-0.5 bg-white rounded">deleteWebhook</code>) rồi dò lại.
              </p>
            ) : detectResult.chats.length === 0 ? (
              <p className="text-slate-600">
                Chưa tìm thấy chat nào. Hãy mở bot, bấm <b>Start</b>, gửi thử 1 tin nhắn rồi bấm{" "}
                <b>Dò Chat ID</b> lần nữa.
              </p>
            ) : (
              <>
                <p className="font-bold text-slate-700">
                  Tìm thấy {detectResult.chats.length} chat — copy ID dán vào{" "}
                  <code className="px-1 py-0.5 bg-white rounded">TELEGRAM_CHAT_ID</code>:
                </p>
                <ul className="space-y-1.5">
                  {detectResult.chats.map((chat) => (
                    <li
                      key={chat.id}
                      className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200"
                    >
                      <span className="min-w-0">
                        <span className="font-bold text-slate-800">{chat.title}</span>
                        <span className="text-slate-400"> · {chat.type}</span>
                        <br />
                        <code className="text-slate-700 select-all">{chat.id}</code>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyChatId(chat.id)}
                        className="shrink-0 inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedId === chat.id ? "Đã copy" : "Copy"}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Chủ Đề Giao Diện Lễ Hội (Ở DƯỚI) */}
      <ThemeSelector />
    </div>
  );
}
