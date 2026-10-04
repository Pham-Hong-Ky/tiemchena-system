/**
 * Shop Contact and Payment Configuration from Environment Variables (.env)
 * 100% dynamic - Lấy toàn bộ từ .env, KHÔNG hardcode fallback
 */

export const SHOP_ENV = {
  // Hotline gọi điện
  hotline: process.env.NEXT_PUBLIC_HOTLINE ?? "",

  // Số điện thoại nhận đơn Zalo
  zaloPhone: process.env.NEXT_PUBLIC_ZALO_PHONE ?? "",

  // Cấu hình ngân hàng VietQR
  bankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID ?? "",
  accountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO ?? "",
  accountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME ?? "",

  // Maps và URL website
  mapsUrl: process.env.NEXT_PUBLIC_MAPS_URL ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
};
