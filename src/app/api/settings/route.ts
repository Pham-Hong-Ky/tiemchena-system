import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET() {
  try {
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

    // Luôn ưu tiên thông tin tài khoản ngân hàng từ file .env máy chủ (Bảo mật tài chính)
    const secureSetting = {
      ...setting,
      qrBankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || setting.qrBankId || "MB",
      qrAccountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || setting.qrAccountNumber || "0986479285",
      qrAccountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || setting.qrAccountName || "TIEM CHE NA",
      isBankLocked: true, // Báo cho client biết tài khoản đã khóa cứng bởi server
    };

    return NextResponse.json({ success: true, data: secureSetting });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ success: false, error: "Lỗi cấu hình cửa hàng" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();

    // 2. Chặn tuyệt đối việc thay đổi STK qua API (Bảo mật: chỉ sửa được trong file .env trên server)
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

    const secureResponse = {
      ...updated,
      qrBankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || updated.qrBankId,
      qrAccountNumber: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || updated.qrAccountNumber,
      qrAccountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || updated.qrAccountName,
      isBankLocked: true,
    };

    return NextResponse.json({ success: true, data: secureResponse });
  } catch (error) {
    console.error("PUT settings error:", error);
    return NextResponse.json({ success: false, error: "Không thể cập nhật cấu hình" }, { status: 500 });
  }
}
