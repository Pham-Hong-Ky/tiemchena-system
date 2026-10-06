import { prisma } from "@/lib/prisma";
import { orderEvents } from "@/lib/orderEvents";
import { emailService } from "@/services/emailService";

export interface SepayWebhookPayload {
  id?: number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  transferType?: string;
  transferAmount?: number;
  accumulated?: number;
  referenceCode?: string;
  description?: string;
}

export const sepayService = {
  async processWebhook(payload: SepayWebhookPayload, authHeader: string) {
    const anyPayload = payload as Record<string, any>;

    // 1. Verify SePay API Key (if configured in ENV)
    const configuredKey = process.env.SEPAY_WEBHOOK_KEY;
    if (configuredKey && configuredKey.trim()) {
      const expectedKey = configuredKey.trim();
      const cleanHeader = (authHeader || "").trim().replace(/^Apikey\s+/i, "");
      if (cleanHeader !== expectedKey && authHeader !== `Apikey ${expectedKey}`) {
        console.warn("[SePay Webhook] Unauthorized attempt with header:", authHeader);
        throw new Error("UNAUTHORIZED_SEPAY");
      }
    }

    const gateway = anyPayload.gateway || anyPayload.bank_brand_name || "Bank";
    const transferType = anyPayload.transferType || anyPayload.transfer_type || "in";
    const transferAmount = Number(
      anyPayload.transferAmount ||
      anyPayload.amount_in ||
      anyPayload.amountIn ||
      anyPayload.accumulated ||
      0
    );
    const referenceCode = anyPayload.referenceCode || anyPayload.reference_number || anyPayload.id || "";

    // Only process incoming transfers
    if (transferType !== "in" && transferType !== "IN" && transferType !== undefined) {
      return { success: true, message: "Ignored outgoing transfer" };
    }

    // Kết hợp tất cả các trường text mà SePay có thể gửi về
    const rawContent = `${anyPayload.content || ""} ${anyPayload.description || ""} ${anyPayload.code || ""} ${anyPayload.transaction_content || ""}`;
    const cleanContent = rawContent.toUpperCase();

    // 2. Extract potential Order Code (e.g. TCN-123456, TCN 123456, TCN123456, TCN_123456)
    let matchedOrderCode: string | null = null;
    const matchTCN = cleanContent.match(/TCN[\s-_]?(\d{5,8})/i);
    if (matchTCN) {
      matchedOrderCode = `TCN-${matchTCN[1]}`;
    }

    // 3. Find order in DB
    let order = null;
    if (matchedOrderCode) {
      order = await prisma.order.findUnique({
        where: { orderCode: matchedOrderCode },
        include: { items: true },
      });
    }

    // Fallback: search recent unpaid orders within 24h
    if (!order) {
      const recentOrders = await prisma.order.findMany({
        where: {
          paymentStatus: "UNPAID",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      for (const candidate of recentOrders) {
        const rawCode = candidate.orderCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const phoneLast4 = candidate.customerPhone.slice(-4);
        if (
          cleanContent.includes(rawCode) ||
          cleanContent.includes(candidate.orderCode.toUpperCase()) ||
          (phoneLast4 && cleanContent.includes(phoneLast4) && Math.abs(candidate.finalAmount - transferAmount) <= 1000)
        ) {
          order = candidate;
          break;
        }
      }
    }

    if (!order) {
      return {
        success: true,
        message: "No matching order found, logged for review",
      };
    }

    if (order.paymentStatus === "PAID") {
      return {
        success: true,
        message: "Order was already marked as PAID",
        orderCode: order.orderCode,
      };
    }

    // 4. Update order to PAID and auto-CONFIRM
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "VIETQR_SEPAY",
        orderStatus: order.orderStatus === "PENDING" ? "CONFIRMED" : order.orderStatus,
        note: order.note
          ? `${order.note} | [SePay: Đã nhận ${transferAmount.toLocaleString("vi-VN")}đ qua ${gateway || "Bank"} mã GD: ${referenceCode || ""}]`
          : `[SePay: Đã nhận ${transferAmount.toLocaleString("vi-VN")}đ qua ${gateway || "Bank"} mã GD: ${referenceCode || ""}]`,
      },
      include: { items: true },
    });

    await emailService.sendOrderConfirmationIfNeeded(updatedOrder.id);

    // 5. Emit real-time SSE notification
    orderEvents.emit("order_updated", updatedOrder);

    return {
      success: true,
      message: "Order payment verified successfully via SePay",
      orderCode: updatedOrder.orderCode,
      amount: transferAmount,
    };
  },
};
