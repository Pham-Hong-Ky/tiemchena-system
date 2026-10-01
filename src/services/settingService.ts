import { prisma } from "@/lib/prisma";

export const settingService = {
  async getSettings() {
    let setting = await prisma.storeSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.storeSetting.create({
        data: {
          id: "default",
          storeName: "Tiệm Chè Na",
          hotline: "0986.479.285",
          address: "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội",
          openingHours: "09:00 - 22:30",
          bannerAnnouncement: "GIẢM NGAY 10% tổng hóa đơn khi đặt trước hoặc chốt đơn qua Zalo hôm nay!",
          qrBankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || "MB",
          qrAccountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || "0986479285",
          qrAccountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "TIEM CHE NA",
          zaloUrl: "https://zalo.me/0986479285",
          isAcceptingOrders: true,
        },
      });
    }

    return {
      ...setting,
      qrBankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || setting.qrBankId || "MB",
      qrAccountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || setting.qrAccountNumber || "0986479285",
      qrAccountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || setting.qrAccountName || "TIEM CHE NA",
      isBankLocked: true,
    };
  },

  async updateSettings(body: any) {
    const { qrBankId, qrAccountNumber, qrAccountName, id, ...safeUpdateData } = body;

    const updated = await prisma.storeSetting.upsert({
      where: { id: "default" },
      update: safeUpdateData,
      create: {
        id: "default",
        ...safeUpdateData,
        qrBankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || "MB",
        qrAccountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || "0986479285",
        qrAccountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "TIEM CHE NA",
      },
    });

    return {
      ...updated,
      qrBankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || updated.qrBankId,
      qrAccountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || updated.qrAccountNumber,
      qrAccountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || updated.qrAccountName,
      isBankLocked: true,
    };
  },
};
