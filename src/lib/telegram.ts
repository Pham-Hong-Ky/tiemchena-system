/**
 * Gửi tin nhắn qua Telegram Bot API (https://core.telegram.org/bots/api#sendmessage).
 * Gọi thẳng REST API bằng fetch – không cần cài thêm thư viện.
 *
 * ENV:
 *  - TELEGRAM_BOT_TOKEN: token bot lấy từ @BotFather (bắt buộc, thiếu thì bỏ qua và ghi log)
 *  - TELEGRAM_CHAT_ID:   ID nhận tin. Có thể nhập nhiều nơi, cách nhau dấu phẩy.
 *                        Lấy ID bằng cách chat với bot rồi mở:
 *                        https://api.telegram.org/bot<TOKEN>/getUpdates
 */

const TELEGRAM_API = "https://api.telegram.org";
const REQUEST_TIMEOUT_MS = 8000;

export interface SendTelegramResult {
  sent: boolean;
  error?: string;
}

/** Bot đã được cấu hình token + chat id chưa */
export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && getChatIds().length > 0);
}

/** Danh sách chat id nhận tin (hỗ trợ nhiều người/nhóm, ngăn cách bởi dấu phẩy) */
export function getChatIds(): string[] {
  return (process.env.TELEGRAM_CHAT_ID || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Đã có token bot chưa (chưa cần chat id) */
export function hasTelegramToken() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
}

export interface TelegramChat {
  id: string;
  type: string;
  title: string;
}

export interface DetectChatsResult {
  chats: TelegramChat[];
  error?: string;
  /** Nếu bot đang đặt webhook thì getUpdates không chạy được */
  webhookUrl?: string;
}

/**
 * Dò các chat id bot đã "gặp" – dựa trên getUpdates.
 * Người dùng phải chat/mở bot (bấm Start, gửi 1 tin) hoặc thêm bot vào nhóm trước.
 */
export async function fetchTelegramChats(): Promise<DetectChatsResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return { chats: [], error: "Chưa cấu hình TELEGRAM_BOT_TOKEN trong biến môi trường." };
  }

  try {
    // Nếu bot đang set webhook, getUpdates sẽ rỗng/lỗi → báo cho người dùng biết
    let webhookUrl = "";
    try {
      const wh = await fetch(`${TELEGRAM_API}/bot${token}/getWebhookInfo`).then((r) => r.json());
      webhookUrl = wh?.result?.url || "";
    } catch {
      /* bỏ qua */
    }

    const res = await fetch(`${TELEGRAM_API}/bot${token}/getUpdates`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return { chats: [], webhookUrl: webhookUrl || undefined, error: data?.description || `Telegram trả về lỗi ${res.status}` };
    }

    const map = new Map<string, TelegramChat>();
    for (const update of (data.result || []) as any[]) {
      const chat =
        update?.message?.chat ||
        update?.edited_message?.chat ||
        update?.channel_post?.chat ||
        update?.my_chat_member?.chat ||
        update?.callback_query?.message?.chat;
      if (!chat) continue;
      const title =
        chat.title ||
        [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
        (chat.username ? `@${chat.username}` : "") ||
        String(chat.id);
      map.set(String(chat.id), { id: String(chat.id), type: chat.type || "private", title });
    }

    return { chats: [...map.values()], webhookUrl: webhookUrl || undefined };
  } catch (e: any) {
    return { chats: [], error: e?.message || "Không kết nối được Telegram" };
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gửi 1 tin nhắn HTML tới TẤT CẢ chat id đã cấu hình.
 * Có thử lại khi lỗi tạm thời (429 / 5xx / mất kết nối). Không bao giờ throw.
 */
export async function sendTelegramMessage(text: string): Promise<SendTelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatIds = getChatIds();

  if (!token || chatIds.length === 0) {
    console.warn("[Telegram] Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID – bỏ qua thông báo.");
    return { sent: false, error: "Chưa cấu hình Telegram" };
  }

  const results = await Promise.all(
    chatIds.map((chatId) => sendToChat(token, chatId, text))
  );

  const firstError = results.find((r) => !r.sent)?.error;
  return { sent: results.some((r) => r.sent), ...(firstError ? { error: firstError } : {}) };
}

async function sendToChat(
  token: string,
  chatId: string,
  text: string
): Promise<SendTelegramResult & { retryable?: boolean }> {
  let last: SendTelegramResult & { retryable?: boolean } = { sent: false };
  for (let attempt = 1; attempt <= 3; attempt++) {
    last = await sendOnce(token, chatId, text);
    if (last.sent || !last.retryable) break;
    await sleep(1000 * attempt);
  }
  const { retryable: _retryable, ...rest } = last;
  return rest;
}

async function sendOnce(
  token: string,
  chatId: string,
  text: string
): Promise<SendTelegramResult & { retryable?: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      const error = data?.description || `Telegram trả về lỗi ${res.status}`;
      console.error(`[Telegram] Gửi tới ${chatId} thất bại (${res.status}):`, error);
      return { sent: false, error, retryable: res.status === 429 || res.status >= 500 };
    }
    return { sent: true };
  } catch (e: any) {
    console.error("[Telegram] Không kết nối được Telegram:", e?.message || e);
    return { sent: false, error: e?.message || "Không kết nối được Telegram", retryable: true };
  } finally {
    clearTimeout(timer);
  }
}
