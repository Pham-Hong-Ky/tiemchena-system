/**
 * Gửi email qua Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Gọi thẳng REST API bằng fetch – không cần cài thêm thư viện.
 *
 * ENV:
 *  - RESEND_API_KEY: khóa API Resend (bắt buộc, thiếu thì bỏ qua gửi mail và ghi log)
 *  - EMAIL_FROM:     người gửi, phải thuộc domain đã verify trên Resend
 *  - EMAIL_REPLY_TO: (tùy chọn) địa chỉ nhận thư trả lời
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Tiệm Chè Na <hi@tiemchena.life>";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** ISO 8601 – Resend tự gửi vào thời điểm này (tối đa 30 ngày tới) */
  scheduledAt?: string;
  /** Chống gửi trùng khi request bị lặp lại */
  idempotencyKey?: string;
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  error?: string;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Gửi có thử lại: lỗi tạm thời (quá giới hạn tốc độ 429, lỗi máy chủ 5xx, mất kết nối) thì đợi rồi gửi lại tối đa 3 lần */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  let result: SendEmailResult & { retryable?: boolean } = { sent: false };
  for (let attempt = 1; attempt <= 3; attempt++) {
    result = await sendEmailOnce(input);
    if (result.sent || !result.retryable) break;
    await sleep(1200 * attempt);
  }
  const { retryable: _retryable, ...rest } = result;
  return rest;
}

async function sendEmailOnce(input: SendEmailInput): Promise<SendEmailResult & { retryable?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(`[Email] RESEND_API_KEY chưa cấu hình – bỏ qua email "${input.subject}" tới ${input.to}`);
    return { sent: false, error: "RESEND_API_KEY chưa cấu hình" };
  }

  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(input.scheduledAt ? { scheduled_at: input.scheduledAt } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = data?.message || `Resend trả về lỗi ${res.status}`;
      console.error(`[Email] Gửi "${input.subject}" tới ${input.to} thất bại (${res.status}):`, error);
      return { sent: false, error, retryable: res.status === 429 || res.status >= 500 };
    }
    return { sent: true, id: data?.id };
  } catch (e: any) {
    console.error(`[Email] Không kết nối được Resend:`, e);
    return { sent: false, error: e?.message || "Không kết nối được Resend", retryable: true };
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
