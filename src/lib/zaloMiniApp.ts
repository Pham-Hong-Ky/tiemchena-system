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

export function openZaloShopChat(phone: string = "0986479285", message?: string) {
  const encodedText = message ? `?text=${encodeURIComponent(message)}` : "";
  const url = `https://zalo.me/${phone}${encodedText}`;
  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}
