/**
 * Chatbot Service (rule-based)
 * ---------------------------------------------------------------------------
 * Trợ lý ảo tư vấn của Tiệm Chè Na. Trả lời khách hàng dựa trên dữ liệu THẬT
 * lấy trực tiếp từ menu (productService), danh mục (categoryService) và cấu
 * hình quán (settingService): thực đơn, giá, món bán chạy, giờ mở cửa, địa
 * chỉ, giao hàng, thanh toán, khuyến mãi, đặt món, tra cứu đơn...
 *
 * Không gọi API AI bên ngoài, không phát sinh chi phí, chạy ổn định và luôn
 * phản ánh đúng dữ liệu đang bán.
 */

import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { settingService } from "@/services/settingService";
import { SHOP_ENV } from "@/config/shopEnv";
import { MAX_DELIVERY_DISTANCE_KM } from "@/services/geocodeService";

export interface ChatProductSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  image?: string | null;
  isAvailable: boolean;
}

export type ChatActionType = "menu" | "tracking" | "hotline" | "zalo" | "address";

export interface ChatAction {
  type: ChatActionType;
  label: string;
}

export interface ChatReply {
  intent: string;
  reply: string;
  quickReplies: string[];
  products: ChatProductSuggestion[];
  actions: ChatAction[];
}

interface ChatMessage {
  role: "user" | "bot";
  content: string;
}

const DEFAULT_QUICK_REPLIES = [
  "Xem thực đơn",
  "Món bán chạy",
  "Giờ mở cửa",
  "Phí giao hàng",
  "Cách đặt món",
  "Tra cứu đơn",
];

const STOP_WORDS = new Set([
  "mon", "an", "vat", "gia", "bao", "nhieu", "co", "khong", "minh", "muon",
  "dat", "cho", "cua", "hang", "nay", "la", "gi", "the", "nao", "va", "voi",
  "o", "tai", "tren", "duoi", "cac", "nhung", "mot", "hai", "ba", "bon",
  "nam", "sau", "bay", "tam", "chin", "muoi", "toi", "ban", "can", "hoi",
  "xem", "list", "menu", "shop", "quan",
]);

/** Bỏ dấu tiếng Việt để so khớp từ khoá dễ dàng hơn */
export function normalizeText(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function formatPrice(value: number): string {
  return `${Math.round(value || 0).toLocaleString("vi-VN")}đ`;
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

function toSuggestion(product: any): ChatProductSuggestion {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    originalPrice: product.originalPrice ?? null,
    image: product.image ?? null,
    isAvailable: product.isAvailable !== false,
  };
}

function shortDescription(description?: string | null): string | null {
  if (!description) return null;
  const text = String(description).replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;
  return `${text.slice(0, 157)}...`;
}

/** Danh sách món bán chạy / món hot (đã được service sắp xếp sẵn) */
function bestsellers(products: any[]): any[] {
  const marked = products.filter((p) => p.isBestseller || p.isHot);
  return (marked.length > 0 ? marked : products).slice(0, 4);
}

/** Tìm món ăn khớp nhất với câu hỏi của khách */
function matchProducts(message: string, products: any[]): any[] {
  const text = normalizeText(message);
  const textTokens = tokenize(message);
  const scored: { product: any; score: number }[] = [];

  for (const product of products) {
    const normName = normalizeText(product.name);
    let score = 0;

    if (normName.length >= 3 && text.includes(normName)) {
      score = 100 + normName.length;
    } else {
      const nameTokens = tokenize(product.name);
      if (nameTokens.length > 0) {
        const matched = nameTokens.filter((t) => textTokens.includes(t)).length;
        const ratio = matched / nameTokens.length;
        if (matched >= 1 && ratio >= 0.5) {
          score = 40 + ratio * 40 + matched;
        }
      }
    }

    if (score >= 40) scored.push({ product, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product);
}

type Intent =
  | "greeting"
  | "thanks"
  | "bye"
  | "tracking"
  | "voucher"
  | "hours"
  | "address"
  | "contact"
  | "delivery"
  | "payment"
  | "ordering"
  | "bestseller"
  | "categories"
  | "price"
  | "product"
  | "fallback";

function detectIntent(message: string, hasProductMatch: boolean): Intent {
  const text = normalizeText(message);

  if (includesAny(text, ["cam on", "thank", "thanks", "ok cam on"])) return "thanks";
  if (includesAny(text, ["tam biet", "bye", "hen gap"])) return "bye";

  const words = text.split(" ");
  const isGreeting =
    ["chao", "hello", "hi", "alo", "hey"].some((w) => words.includes(w)) ||
    includesAny(text, ["ad oi", "shop oi", "co ai", "co nguoi"]);
  if (isGreeting && text.length <= 30) return "greeting";

  if (includesAny(text, ["tra cuu don", "kiem tra don", "don hang cua toi", "xem don", "trang thai don", "ma don", "theo doi don"])) {
    return "tracking";
  }
  if (includesAny(text, ["khuyen mai", "giam gia", "voucher", "ma giam", "uu dai", "khuyen mai gi", "sale"])) {
    return "voucher";
  }
  if (includesAny(text, ["gio mo cua", "mo cua", "dong cua", "may gio", "gio lam", "thoi gian mo", "mo cua chua", "con mo", "gio hoat dong"])) {
    return "hours";
  }
  if (includesAny(text, ["dia chi", "o dau", "cho nao", "duong di", "chi duong", "ban do", "maps", "vitri", "vi tri", "toa do", "den quan"])) {
    return "address";
  }
  if (includesAny(text, ["hotline", "so dien thoai", "sdt", "lien he", "goi dien", "so dt", "phone", "zalo"])) {
    return "contact";
  }
  if (includesAny(text, ["giao hang", "ship", "phi giao", "van chuyen", "giao toi", "bao lau giao", "bao xa", "ban kinh", "giao khong"])) {
    return "delivery";
  }
  if (includesAny(text, ["thanh toan", "chuyen khoan", "tien mat", "vietqr", "cod", "tra tien", "banking", "quet ma", "qr"])) {
    return "payment";
  }
  if (includesAny(text, ["cach dat", "dat mon", "dat hang", "order", "lam sao dat", "huong dan dat", "muon dat"])) {
    return "ordering";
  }
  if (includesAny(text, ["ban chay", "best seller", "bestseller", "mon hot", "hot nhat", "dac san", "ngon nhat", "nen an gi", "an gi", "goi y", "recommend"])) {
    return "bestseller";
  }
  if (includesAny(text, ["danh muc", "loai mon", "co nhung gi", "co gi", "ban nhung mon", "thuc don", "menu", "xem mon"])) {
    return "categories";
  }

  if (hasProductMatch) return "product";

  if (includesAny(text, ["gia", "bao nhieu", "bang gia", "gia ca", "gia ban"])) return "price";

  return "fallback";
}

export const chatbotService = {
  async ask(message: string, _history: ChatMessage[] = []): Promise<ChatReply> {
    const question = (message || "").trim();

    const [catalog, categories, settings] = await Promise.all([
      productService.getProducts(),
      categoryService.getCategories(),
      settingService.getSettings().catch(() => null),
    ]);

    const products: any[] = catalog?.products || [];
    const matches = matchProducts(question, products);
    const intent = detectIntent(question, matches.length > 0);

    const openingHours = settings?.openingHours || "09:00 - 22:30";
    const address = settings?.address || "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội";
    const hotline = settings?.hotline || SHOP_ENV.hotline;
    const storeName = settings?.storeName || "Tiệm Chè Na";

    const base = (reply: string, extra?: Partial<ChatReply>): ChatReply => ({
      intent,
      reply,
      quickReplies: extra?.quickReplies ?? DEFAULT_QUICK_REPLIES,
      products: extra?.products ?? [],
      actions: extra?.actions ?? [],
    });

    switch (intent) {
      case "greeting":
        return base(
          `Xin chào 👋 ${storeName} đây ạ! Mình có thể tư vấn thực đơn, giá, giờ mở cửa, phí giao hàng hoặc hướng dẫn đặt món. Bạn cần mình giúp gì ạ?`,
          { quickReplies: ["Xem thực đơn", "Món bán chạy", "Giờ mở cửa", "Đặt món"] }
        );

      case "thanks":
        return base("Dạ cảm ơn bạn nhiều ạ 🧡 Nếu cần thêm gì cứ nhắn mình nhé!", {
          quickReplies: ["Xem thực đơn", "Tra cứu đơn", "Khuyến mãi"],
        });

      case "bye":
        return base("Dạ hẹn gặp lại bạn ở Tiệm Chè Na nhé! Chúc bạn ngon miệng 🍧", {
          quickReplies: ["Xem thực đơn", "Hotline"],
        });

      case "tracking":
        return base(
          "Bạn bấm nút bên dưới để tra cứu đơn hàng bằng mã đơn (ví dụ TCN...) nhé. Nếu quên mã, bạn để lại số điện thoại, quán kiểm tra giúp ạ.",
          {
            quickReplies: ["Xem thực đơn", "Hotline"],
            actions: [{ type: "tracking", label: "Tra cứu đơn hàng" }],
          }
        );

      case "voucher": {
        const promo = settings?.bannerAnnouncement;
        return base(
          promo
            ? `🎁 Ưu đãi hiện có: ${promo}\nBạn thêm món vào giỏ rồi nhập mã giảm giá ở bước đặt hàng nhé!`
            : "Hiện quán đang có ưu đãi khi đặt trước hoặc chốt đơn qua Zalo. Bạn nhắn Zalo hoặc gọi hotline để được tư vấn ưu đãi mới nhất ạ!",
          {
            quickReplies: ["Xem thực đơn", "Hotline", "Cách đặt món"],
            actions: [{ type: "zalo", label: "Nhắn Zalo nhận ưu đãi" }],
          }
        );
      }

      case "hours":
        return base(
          `⏰ ${storeName} mở cửa ${openingHours} hàng ngày (kể cả cuối tuần). Bạn ghé hoặc đặt giao trong khung giờ này nhé!`,
          { quickReplies: ["Xem thực đơn", "Địa chỉ quán", "Phí giao hàng"] }
        );

      case "address":
        return base(
          `📍 Địa chỉ quán: ${address} (gần chợ Ngũ Hiệp & khu Tecco).\nBạn bấm "Chỉ đường" để mở Google Maps nhé!`,
          {
            quickReplies: ["Giờ mở cửa", "Hotline", "Xem thực đơn"],
            actions: [{ type: "address", label: "Chỉ đường Google Maps" }],
          }
        );

      case "contact":
        return base(
          `☎️ Hotline/Zalo của quán: ${hotline || "xem ở phần liên hệ"}. Bạn gọi trực tiếp hoặc nhắn Zalo để được hỗ trợ nhanh nhất ạ!`,
          {
            quickReplies: ["Xem thực đơn", "Tra cứu đơn", "Giờ mở cửa"],
            actions: [
              ...(hotline ? [{ type: "hotline" as const, label: "Gọi hotline" }] : []),
              { type: "zalo", label: "Nhắn Zalo" },
            ],
          }
        );

      case "delivery":
        return base(
          `🛵 Quán giao hàng trong bán kính tối đa ${MAX_DELIVERY_DISTANCE_KM}km quanh Vũ Lăng, Ngũ Hiệp, Thanh Trì.\nPhí ship: 1km 5.000đ · 2km 10.000đ · 3km 15.000đ · 4km 20.000đ · 5km 30.000đ. Phí chính xác sẽ hiển thị khi bạn nhập địa chỉ lúc đặt hàng nhé!`,
          { quickReplies: ["Xem thực đơn", "Cách đặt món", "Địa chỉ quán"] }
        );

      case "payment":
        return base(
          "💳 Quán hỗ trợ 2 hình thức thanh toán:\n• COD – trả tiền mặt khi nhận hàng.\n• Chuyển khoản VietQR – quét mã QR ngay khi đặt để được xử lý nhanh.\nBạn chọn phương thức ở bước đặt hàng nhé!",
          { quickReplies: ["Cách đặt món", "Xem thực đơn", "Phí giao hàng"] }
        );

      case "ordering":
        return base(
          "🛒 Cách đặt món chỉ 4 bước:\n1. Chọn món & topping ở mục Thực Đơn.\n2. Bấm Thêm vào giỏ.\n3. Mở giỏ hàng, điền họ tên, SĐT và địa chỉ nhận.\n4. Chọn thanh toán (COD hoặc VietQR) rồi xác nhận. Sau đó bạn có thể tra cứu đơn bằng mã đơn ạ!",
          {
            quickReplies: ["Xem thực đơn", "Tra cứu đơn", "Phí giao hàng"],
            actions: [{ type: "menu", label: "Đến thực đơn" }],
          }
        );

      case "bestseller": {
        const top = bestsellers(products);
        return base(
          "🔥 Món bán chạy / được yêu thích nhất tại quán đây ạ, bạn tham khảo nhé:",
          { products: top.map(toSuggestion) }
        );
      }

      case "categories": {
        const catLine = (categories || [])
          .slice(0, 8)
          .map((c: any) => `• ${c.name}`)
          .join("\n");
        return base(
          `🍽️ ${storeName} có các nhóm món sau:\n${catLine || "• Nhiều món ăn vặt & chè hấp dẫn"}\nBạn muốn xem món cụ thể nào không ạ?`,
          {
            quickReplies: ["Món bán chạy", "Giá các món", "Cách đặt món"],
            products: bestsellers(products).slice(0, 3).map(toSuggestion),
            actions: [{ type: "menu", label: "Xem toàn bộ thực đơn" }],
          }
        );
      }

      case "price": {
        const top = products.slice(0, 6);
        return base(
          "💰 Đây là một số món kèm giá tại quán. Bạn muốn hỏi giá món cụ thể nào cứ nhắn tên món nhé!",
          { products: top.map(toSuggestion), actions: [{ type: "menu", label: "Xem toàn bộ thực đơn" }] }
        );
      }

      case "product": {
        if (matches.length === 1) {
          const p = matches[0];
          const desc = shortDescription(p.description);
          const stockNote =
            p.isAvailable === false
              ? "\n⚠️ Món này hiện tạm hết hàng, bạn tham khảo món khác giúp quán nhé."
              : "";
          return base(
            `${p.name} – ${formatPrice(p.price)}${p.originalPrice ? ` (giá gốc ${formatPrice(p.originalPrice)})` : ""}.${desc ? `\n${desc}` : ""}${stockNote}`,
            {
              products: [toSuggestion(p)],
              quickReplies: ["Món bán chạy", "Xem thực đơn", "Cách đặt món"],
            }
          );
        }
        return base(
          `Mình tìm thấy vài món phù hợp với "${question}":`,
          {
            products: matches.slice(0, 4).map(toSuggestion),
            quickReplies: ["Món bán chạy", "Xem thực đơn"],
          }
        );
      }

      default:
        return base(
          "Xin lỗi, mình chưa hiểu rõ câu hỏi này ạ 🙏 Bạn có thể hỏi mình về thực đơn, giá món, giờ mở cửa, phí giao hàng, thanh toán hoặc cách đặt món. Hoặc gọi hotline để được hỗ trợ trực tiếp nhé!",
          {
            actions: [
              ...(hotline ? [{ type: "hotline" as const, label: "Gọi hotline" }] : []),
              { type: "menu", label: "Xem thực đơn" },
            ],
          }
        );
    }
  },
};
