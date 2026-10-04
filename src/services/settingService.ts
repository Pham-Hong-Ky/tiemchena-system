import { prisma } from "@/lib/prisma";
import { SHOP_ENV } from "@/config/shopEnv";

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
          hotline: SHOP_ENV.hotline || "Tiệm Chè Na",
          address: "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội",
          openingHours: "09:00 - 22:30",
          bannerAnnouncement: "GIẢM NGAY 10% tổng hóa đơn khi đặt trước hoặc chốt đơn qua Zalo hôm nay!",
          qrBankId: SHOP_ENV.bankId,
          qrAccountNumber: SHOP_ENV.accountNumber,
          qrAccountName: SHOP_ENV.accountName,
          zaloUrl: SHOP_ENV.zaloPhone ? `https://zalo.me/${SHOP_ENV.zaloPhone}` : "",
          isAcceptingOrders: true,
        },
      });
    }

    return {
      ...setting,
      hotline: SHOP_ENV.hotline || setting.hotline,
      qrBankId: SHOP_ENV.bankId || setting.qrBankId,
      qrAccountNumber: SHOP_ENV.accountNumber || setting.qrAccountNumber,
      qrAccountName: SHOP_ENV.accountName || setting.qrAccountName,
      zaloUrl: SHOP_ENV.zaloPhone ? `https://zalo.me/${SHOP_ENV.zaloPhone}` : setting.zaloUrl,
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
        qrBankId: SHOP_ENV.bankId,
        qrAccountNumber: SHOP_ENV.accountNumber,
        qrAccountName: SHOP_ENV.accountName,
      },
    });

    return {
      ...updated,
      hotline: SHOP_ENV.hotline || updated.hotline,
      qrBankId: SHOP_ENV.bankId || updated.qrBankId,
      qrAccountNumber: SHOP_ENV.accountNumber || updated.qrAccountNumber,
      qrAccountName: SHOP_ENV.accountName || updated.qrAccountName,
      zaloUrl: SHOP_ENV.zaloPhone ? `https://zalo.me/${SHOP_ENV.zaloPhone}` : updated.zaloUrl,
      isBankLocked: true,
    };
  },
};
