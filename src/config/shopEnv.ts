export const SHOP_ENV = {
  // Hotline gọi điện
  hotline: process.env.NEXT_PUBLIC_HOTLINE || process.env.NEXT_PUBLIC_ZALO_PHONE || "",

  // Số điện thoại nhận đơn Zalo
  zaloPhone: process.env.NEXT_PUBLIC_ZALO_PHONE || process.env.NEXT_PUBLIC_HOTLINE || "",

  // Cấu hình ngân hàng VietQR
  bankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || "MB",
  accountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || "0986479285",
  accountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "TIEM CHE NA",

  // Maps và URL website
  mapsUrl: process.env.NEXT_PUBLIC_MAPS_URL || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
};

