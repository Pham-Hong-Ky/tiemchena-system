"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Plus,
  Phone,
  SearchCode,
  UtensilsCrossed,
  Navigation,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/context/ToastContext";
import { SHOP_ENV } from "@/config/shopEnv";
import type { ChatAction, ChatProductSuggestion } from "@/services/chatbotService";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  products?: ChatProductSuggestion[];
  actions?: ChatAction[];
  quickReplies?: string[];
}

interface ChatWidgetProps {
  /** Cuộn tới thực đơn và điền từ khoá tìm kiếm (do trang chủ cung cấp) */
  onSelectKeyword?: (keyword: string) => void;
  /** Mở modal tra cứu đơn hàng */
  onOpenTracking?: () => void;
}

const STORAGE_KEY = "tiemchena_chat_history_v1";

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "bot",
  content:
    "Xin chào 👋 Mình là trợ lý ảo của Tiệm Chè Na. Mình có thể tư vấn thực đơn, giá món, giờ mở cửa, phí giao hàng và hướng dẫn đặt món. Bạn cần hỏi gì ạ?",
  quickReplies: ["Xem thực đơn", "Món bán chạy", "Giờ mở cửa", "Phí giao hàng", "Cách đặt món"],
};

function formatPrice(value: number): string {
  return `${Math.round(value || 0).toLocaleString("vi-VN")}đ`;
}

export function ChatWidget({ onSelectKeyword, onOpenTracking }: ChatWidgetProps) {
  const { addToCart } = useCart();
  const { config } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [unread, setUnread] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Khôi phục hội thoại đã lưu
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ChatMessage[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Bỏ qua nếu dữ liệu lưu bị lỗi
    }
    setHasLoaded(true);
  }, []);

  // Lưu hội thoại (giới hạn 30 tin gần nhất)
  useEffect(() => {
    if (!hasLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Bỏ qua lỗi quota
    }
  }, [messages, hasLoaded]);

  // Tự cuộn xuống tin mới nhất
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isSending, isOpen]);

  // Focus ô nhập khi mở khung chat
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isSending) return;

      setInput("");
      const history = messages
        .filter((m) => m.role === "user" || m.role === "bot")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, { id: createId(), role: "user", content: text }]);
      setIsSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Không thể kết nối trợ lý ảo");
        }
        const d = data.data;
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "bot",
            content: d.reply,
            products: d.products || [],
            actions: d.actions || [],
            quickReplies: d.quickReplies || [],
          },
        ]);
        if (!isOpen) setUnread((u) => u + 1);
      } catch (error: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "bot",
            content:
              error?.message ||
              "Trợ lý ảo đang bận, bạn thử lại sau ít giây hoặc gọi hotline giúp quán nhé!",
            quickReplies: ["Thử lại", "Hotline"],
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, messages, isOpen]
  );

  const handleAddToCart = (product: ChatProductSuggestion) => {
    if (product.isAvailable === false) {
      toast.error(`Món "${product.name}" hiện tạm hết hàng!`);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      isHot: false,
      isBestseller: false,
      isAvailable: true,
      categoryId: "",
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleAction = (action: ChatAction) => {
    switch (action.type) {
      case "menu":
        onSelectKeyword?.("");
        document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
        setIsOpen(false);
        break;
      case "tracking":
        setIsOpen(false);
        onOpenTracking?.();
        break;
      case "hotline":
        if (SHOP_ENV.hotline) window.location.href = `tel:${SHOP_ENV.hotline}`;
        break;
      case "zalo":
        if (SHOP_ENV.zaloPhone) window.open(`https://zalo.me/${SHOP_ENV.zaloPhone}`, "_blank");
        break;
      case "address":
        window.open(
          SHOP_ENV.mapsUrl || "https://www.google.com/maps/place/Ti%E1%BB%87m+Ch%C3%A8+Na",
          "_blank"
        );
        break;
    }
  };

  const handleQuickReply = (text: string) => {
    if (text === "Hotline") {
      handleAction({ type: "hotline", label: "Hotline" });
      return;
    }
    sendMessage(text);
  };

  const lastBotMessage = [...messages].reverse().find((m) => m.role === "bot");
  const quickReplies = !isSending && lastBotMessage?.quickReplies?.length
    ? lastBotMessage.quickReplies
    : [];

  return (
    <div className="fixed bottom-5 right-4 z-[45] flex flex-col items-end gap-3">
      {/* Khung chat */}
      {isOpen && (
        <div className="flex h-[min(72vh,560px)] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-chat-pop">
          {/* Header */}
          <div
            className="relative flex items-center gap-3 px-4 py-3.5 text-white"
            style={{ background: config.colors.heroGradientStyle }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold leading-tight">Trợ lý Tiệm Chè Na</p>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/85">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Thường trả lời ngay
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng khung chat"
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nội dung hội thoại */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3.5">
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {msg.role === "bot" ? (
                  <div className="max-w-[88%] space-y-2">
                    <div className="whitespace-pre-line rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium leading-relaxed text-slate-700 shadow-sm">
                      {msg.content}
                    </div>

                    {/* Gợi ý món ăn */}
                    {!!msg.products?.length && (
                      <div className="space-y-2">
                        {msg.products.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                          >
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                loading="lazy"
                                className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
                                🍧
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-800">
                                {p.name}
                              </p>
                              <p className="mt-0.5 text-sm font-extrabold text-orange-600">
                                {formatPrice(p.price)}
                                {p.originalPrice ? (
                                  <span className="ml-1.5 text-[11px] font-medium text-slate-400 line-through">
                                    {formatPrice(p.originalPrice)}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(p)}
                              disabled={p.isAvailable === false}
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition active:scale-95 ${
                                p.isAvailable === false
                                  ? "cursor-not-allowed bg-slate-300"
                                  : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                              }`}
                              aria-label={`Thêm ${p.name} vào giỏ`}
                              title={p.isAvailable === false ? "Tạm hết hàng" : "Thêm vào giỏ"}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Nút hành động nhanh */}
                    {!!msg.actions?.length && (
                      <div className="flex flex-wrap gap-2">
                        {msg.actions.map((action, idx) => (
                          <ActionButton
                            key={`${action.type}-${idx}`}
                            action={action}
                            onClick={() => handleAction(action)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="max-w-[82%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm"
                    style={{ background: config.colors.heroGradientStyle }}
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {/* Đang nhập */}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-orange-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Câu trả lời nhanh */}
          {!!quickReplies.length && (
            <div className="scrollbar-none flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2.5">
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => handleQuickReply(qr)}
                  className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Ô nhập */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              maxLength={500}
              disabled={isSending}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md transition hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
              aria-label="Gửi tin nhắn"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Nút bong bóng nổi */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105 active:scale-95 ${
          isOpen ? "bg-slate-800" : `bg-gradient-to-br ${config.colors.primaryGradient} shadow-orange-500/30 animate-chat-ring`
        }`}
        aria-label={isOpen ? "Đóng trợ lý ảo" : "Mở trợ lý ảo"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-black text-white shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}

function ActionButton({ action, onClick }: { action: ChatAction; onClick: () => void }) {
  const icon =
    action.type === "tracking" ? (
      <SearchCode className="h-4 w-4" />
    ) : action.type === "hotline" ? (
      <Phone className="h-4 w-4" />
    ) : action.type === "zalo" ? (
      <MessageCircle className="h-4 w-4" />
    ) : action.type === "address" ? (
      <Navigation className="h-4 w-4" />
    ) : (
      <UtensilsCrossed className="h-4 w-4" />
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 active:scale-95"
    >
      {icon}
      {action.label}
    </button>
  );
}
