import { prisma } from "@/lib/prisma";
import { sendEmail, sleep, SendEmailResult } from "@/lib/email";
import { welcomeEmail, nurtureEmail, offerEmail, orderConfirmationEmail } from "@/lib/emailTemplates";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Email có "+test" (vd tenban+test@gmail.com) → gửi cả 3 email ngay, không chờ lịch */
export const isTestEmail = (email: string) => email.toLowerCase().includes("+test");

// Trạng thái coi như tiệm đã nhận đơn → gửi email xác nhận
const ACCEPTED_STATUSES = ["CONFIRMED", "PREPARING", "DELIVERING", "COMPLETED"];

export const emailService = {
  /**
   * Chuỗi chăm sóc khách mới: Email 1 ngay → Email 2 sau 2 ngày → Email 3 sau Email 2 một ngày.
   * Email 2 & 3 được hẹn giờ ngay trên Resend (scheduled_at) nên không cần cron.
   * Chế độ test (+test): gửi cả 3 ngay lập tức, cách nhau vài giây để đúng thứ tự trong hộp thư.
   */
  async startWelcomeSequence(customer: { id: string; name: string; email: string }) {
    const testMode = isTestEmail(customer.email);
    const now = Date.now();
    const steps = [
      { key: "welcome", content: welcomeEmail(customer.name), at: 0 },
      { key: "nurture", content: nurtureEmail(customer.name), at: 2 * DAY_MS },
      { key: "offer", content: offerEmail(customer.name), at: 3 * DAY_MS },
    ];

    const results: SendEmailResult[] = [];
    for (const [i, step] of steps.entries()) {
      if (testMode && i > 0) await sleep(1500);
      results.push(
        await sendEmail({
          to: customer.email,
          ...step.content,
          ...(!testMode && step.at > 0 ? { scheduledAt: new Date(now + step.at).toISOString() } : {}),
          idempotencyKey: `seq-${customer.id}-${step.key}-${now}`,
        })
      );
    }

    if (results[0]?.sent) {
      await prisma.customer.update({ where: { id: customer.id }, data: { emailSequenceAt: new Date(now) } });
    }
    return { testMode, sent: results.filter((r) => r.sent).length, errors: results.map((r) => r.error).filter(Boolean) };
  },

  /**
   * Gửi email xác nhận khi đơn chuyển sang trạng thái đã nhận (admin bấm Xác nhận/Hoàn thành, hoặc Sepay báo tiền về).
   * Mỗi đơn chỉ gửi 1 lần – "giành quyền" gửi bằng updateMany có điều kiện để không gửi trùng.
   * Không bao giờ throw: lỗi email không được làm hỏng luồng đơn hàng.
   */
  async sendOrderConfirmationIfNeeded(orderId: string) {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order?.customerEmail || !ACCEPTED_STATUSES.includes(order.orderStatus)) return;

      const claim = await prisma.order.updateMany({
        where: { id: orderId, confirmEmailSentAt: null },
        data: { confirmEmailSentAt: new Date() },
      });
      if (claim.count === 0) return;

      const result = await sendEmail({
        to: order.customerEmail,
        ...orderConfirmationEmail(order),
      });
      if (!result.sent) {
        // Gửi lỗi → mở lại để lần cập nhật sau thử gửi tiếp
        await prisma.order.update({ where: { id: orderId }, data: { confirmEmailSentAt: null } });
      }
    } catch (e) {
      console.error("[Email] Lỗi gửi email xác nhận đơn:", e);
    }
  },
};
