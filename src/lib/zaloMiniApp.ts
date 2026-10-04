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

import { SHOP_ENV } from "@/config/shopEnv";

export function openZaloShopChat(
  phone: string = SHOP_ENV.zaloPhone,
  message?: string
) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedText = message ? `?text=${encodeURIComponent(message)}` : "";
  const url = `https://zalo.me/${cleanPhone}${encodedText}`;
  if (typeof window !== "undefined") {
    const win = window.open(url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = url;
    }
  }
}
