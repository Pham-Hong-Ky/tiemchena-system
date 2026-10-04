/**
 * Zalo Mini App SDK Integration Helper for Tiệm Chè Na
 */

export interface ZaloUser {
  id?: string;
  name?: string;
  avatar?: string;
  phone?: string;
}

export function isRunningInZalo(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes("zalo") || ua.includes("zmp");
}

export async function getZaloProfile(): Promise<ZaloUser | null> {
  if (!isRunningInZalo()) return null;
  try {
    // Dynamic import if zmp-sdk exists in runtime
    const zmp = (window as any).ZMP || (window as any).zmp;
    if (zmp && zmp.getUserInfo) {
      const res = await zmp.getUserInfo();
      return {
        id: res.userInfo?.id,
        name: res.userInfo?.name,
        avatar: res.userInfo?.avatar,
      };
    }
  } catch (err) {
    console.warn("Zalo SDK get profile error:", err);
  }
  return null;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text || typeof window === "undefined") return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("navigator.clipboard error, fallback to execCommand:", err);
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("execCommand fallback failed:", err);
    return false;
  }
}

import { SHOP_ENV } from "@/config/shopEnv";

export function openZaloShopChat(
  phone: string = SHOP_ENV.zaloPhone,
  message?: string
) {
  const cleanPhone = (phone || SHOP_ENV.zaloPhone).replace(/[^0-9]/g, "");

  // Tự động sao chép nội dung vào Clipboard nếu có tin nhắn
  if (message) {
    copyTextToClipboard(message);
  }

  // Zalo cá nhân CHỈ hỗ trợ đường dẫn chuẩn https://zalo.me/{số_điện_thoại}
  // Gắn ?text=... sẽ khiến máy chủ Zalo lỗi định tuyến và chuyển hướng sang https://zalo.me/vi/
  const url = `https://zalo.me/${cleanPhone}`;
  if (typeof window !== "undefined") {
    const win = window.open(url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = url;
    }
  }
}
