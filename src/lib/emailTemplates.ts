/**
 * Nội dung email – đồng bộ với my-brain/email_sequence.md (giọng Tiệm Chè Na trong brain.db).
 * Sửa lời văn ở email_sequence.md trước, rồi cập nhật lại đây.
 */

const SITE_URL = "https://datmon.tiemchena.life";
const ZALO = "0986.479.285";
const ZALO_URL = "https://zalo.me/0986479285";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")}đ`;

/** Tên gọi thân mật: lấy chữ cuối của họ tên ("Nguyễn Thị Lan" → "Lan") */
export function firstName(fullName: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || "bạn";
}

function layout(preheader: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff7ed;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#ea580c;padding:18px 24px;color:#ffffff;font-size:20px;font-weight:bold;">🍧 Tiệm Chè Na</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.65;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px;background:#fffbeb;font-size:12px;color:#6b7280;line-height:1.6;">
Tiệm Chè Na · Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội · Mở 9h – 22h30<br>
Zalo/Hotline <a href="${ZALO_URL}" style="color:#ea580c;">${ZALO}</a> · <a href="${SITE_URL}" style="color:#ea580c;">datmon.tiemchena.life</a><br>
Không muốn nhận thư nữa? Trả lời thư này chữ "dừng" là Na gỡ tên bạn ngay nha.
</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;">${html}</p>`;
const ul = (items: string[]) =>
  `<ul style="margin:0 0 14px;padding-left:20px;">${items.map((i) => `<li style="margin-bottom:6px;">${i}</li>`).join("")}</ul>`;
const ol = (items: string[]) =>
  `<ol style="margin:0 0 14px;padding-left:20px;">${items.map((i) => `<li style="margin-bottom:8px;">${i}</li>`).join("")}</ol>`;
const button = (href: string, label: string) =>
  `<p style="margin:20px 0;"><a href="${href}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;">${label}</a></p>`;
const sign = `<p style="margin:18px 0 0;">Na – Tiệm Chè Na</p>`;

// ─── Email 1 – Chào mừng (gửi ngay) ─────────────────────────────────────────
export function welcomeEmail(name: string): EmailContent {
  const n = esc(firstName(name));
  const subject = "Na đây – cảm ơn khách yêu đã giơ tay nha 🥰";
  const html = layout(
    "Tiệm nhỏ thôi, nhưng có 3 điều Na giữ từ ngày đầu.",
    p(`Chào ${n} ơi,`) +
      p("Na là chủ Tiệm Chè Na ở Vũ Lăng, Ngũ Hiệp đây ạ. Cảm ơn bạn đã để lại email cho tiệm nha.") +
      p("Thật ra tiệm nhỏ thôi, bán ăn vặt với chè. Nhưng có 3 điều Na giữ từ ngày đầu mở bán:") +
      ul([
        "<b>Dầu chiên thay mới mỗi ngày.</b> Không chiên lại dầu cũ.",
        "<b>Chè nấu mới mỗi sáng.</b> Không để qua đêm.",
        "<b>Chỉ làm khi có đơn</b>, ship 20–30 phút quanh Ngũ Hiệp. Đồ nóng hộp riêng, đá túi riêng.",
      ]) +
      p("Mấy hôm tới Na gửi bạn thêm 2 thư: 1 mẹo nhỏ để đồ ăn ship về vẫn ngon, và 1 ưu đãi riêng cho khách quen. Không spam đâu, hứa ak.") +
      p(`Còn đang đói ngay bây giờ thì đơn giản thôi: đặt ở <a href="${SITE_URL}" style="color:#ea580c;font-weight:bold;">datmon.tiemchena.life</a> hoặc nhắn Zalo <a href="${ZALO_URL}" style="color:#ea580c;font-weight:bold;">${ZALO}</a>.`) +
      sign
  );
  const text = `Chào ${firstName(name)} ơi,

Na là chủ Tiệm Chè Na ở Vũ Lăng, Ngũ Hiệp đây ạ. Cảm ơn bạn đã để lại email cho tiệm nha.

Thật ra tiệm nhỏ thôi, bán ăn vặt với chè. Nhưng có 3 điều Na giữ từ ngày đầu mở bán:
- Dầu chiên thay mới mỗi ngày. Không chiên lại dầu cũ.
- Chè nấu mới mỗi sáng. Không để qua đêm.
- Chỉ làm khi có đơn, ship 20–30 phút quanh Ngũ Hiệp. Đồ nóng hộp riêng, đá túi riêng.

Mấy hôm tới Na gửi bạn thêm 2 thư: 1 mẹo nhỏ để đồ ăn ship về vẫn ngon, và 1 ưu đãi riêng cho khách quen. Không spam đâu, hứa ak.

Còn đang đói ngay bây giờ thì đơn giản thôi: đặt ở ${SITE_URL} hoặc nhắn Zalo ${ZALO}.

Na – Tiệm Chè Na`;
  return { subject, html, text };
}

// ─── Email 2 – Nurture (sau 2 ngày) ─────────────────────────────────────────
export function nurtureEmail(name: string): EmailContent {
  const n = esc(firstName(name));
  const subject = "Vì sao đồ ship về hay nguội, chè thì tan hết đá?";
  const tips = [
    "<b>Đồ chiên:</b> nhận hàng là mở nắp hộp ngay, để hơi nước thoát ra. Đừng để nguyên trong túi nilon buộc kín.",
    "<b>Chè:</b> đá để riêng, ăn tới đâu đổ đá tới đó. Đổ hết 1 lần là 10 phút sau chè thành nước.",
    "<b>Nem nướng nguội:</b> cho vào nồi chiên không dầu 160 độ khoảng 3 phút là giòn lại. Đừng dùng lò vi sóng, nem dai lắm.",
    "<b>Đặt sớm hơn giờ cao điểm:</b> 17h30 – 19h shipper chạy kín đơn. Đặt trước 17h hoặc sau 19h đồ về nhanh hơn hẳn.",
  ];
  const html = layout(
    "4 mẹo nhỏ, áp dụng được cho cả đồ đặt quán khác.",
    p(`Chào ${n},`) +
      p("Hôm nay Na không bán gì cả. Chỉ kể bạn nghe 1 chuyện Na học được sau mấy trăm đơn ship.") +
      p("Đồ ăn ship về dở đi thường không phải tại món. Mà tại <b>đồ nóng với đồ lạnh nằm chung 1 túi</b>. Hơi nóng làm đá tan, hơi nước làm đồ chiên mềm oặt. Thế là 2 món ngon thành 2 món dở.") +
      p("4 mẹo nhỏ, đặt quán nào cũng dùng được:") +
      ol(tips) +
      p("Ở tiệm, Na làm sẵn mấy cái này luôn: đồ nóng hộp giấy riêng, chè đậy kín, đá túi riêng. Nhưng thật ra bạn biết mẹo rồi thì đặt ở đâu cũng ăn ngon hơn.") +
      p("Thử xem nha, rồi kể Na nghe.") +
      sign
  );
  const text = `Chào ${firstName(name)},

Hôm nay Na không bán gì cả. Chỉ kể bạn nghe 1 chuyện Na học được sau mấy trăm đơn ship.

Đồ ăn ship về dở đi thường không phải tại món. Mà tại đồ nóng với đồ lạnh nằm chung 1 túi. Hơi nóng làm đá tan, hơi nước làm đồ chiên mềm oặt. Thế là 2 món ngon thành 2 món dở.

4 mẹo nhỏ, đặt quán nào cũng dùng được:
${tips.map((t, i) => `${i + 1}. ${t.replace(/<\/?b>/g, "")}`).join("\n")}

Ở tiệm, Na làm sẵn mấy cái này luôn: đồ nóng hộp giấy riêng, chè đậy kín, đá túi riêng. Nhưng thật ra bạn biết mẹo rồi thì đặt ở đâu cũng ăn ngon hơn.

Thử xem nha, rồi kể Na nghe.

Na – Tiệm Chè Na`;
  return { subject, html, text };
}

// ─── Email 3 – Chốt (sau Email 2 một ngày) ──────────────────────────────────
export function offerEmail(name: string): EmailContent {
  const n = esc(firstName(name));
  const subject = "Thèm mặn hay thèm ngọt? Đặt 1 đơn là đủ cả 2 nha";
  const perks = [
    "Nem nướng than nóng giòn, <b>sốt chấm tặng kèm</b>, không tính thêm.",
    "Chè xoài caramen nấu mới trong ngày, <b>đá đóng túi riêng</b>. Về tới nhà chè vẫn còn đá.",
    "1 đơn, 1 lần ship, 20–30 phút quanh Ngũ Hiệp. Khỏi đặt 2 quán, khỏi chờ 2 lần.",
    "<b>Đặt online giảm 5%, còn khoảng 62k.</b> Freeship trong 2km.",
  ];
  const html = layout(
    "Combo Nóng – Lạnh 65k, đặt online còn khoảng 62k.",
    p(`Chào ${n},`) +
      p("Hôm trước Na kể chuyện đồ nóng – đồ lạnh rồi. Hôm nay Na mời bạn thử luôn cái combo tiệm làm ra từ chính chuyện đó.") +
      `<p style="margin:0 0 14px;padding:14px 16px;background:#fff7ed;border-left:4px solid #ea580c;border-radius:8px;font-size:16px;"><b>Combo Nóng – Lạnh: Nem nướng Nha Trang + Chè xoài caramen = 65k</b></p>` +
      ul(perks) +
      p("Muốn đổi món cũng được nha. Mỳ trộn sốt cay, chân gà sốt Thái, mẹt đồ chiên… menu đủ cả nóng lẫn lạnh.") +
      button(SITE_URL, "👉 Đặt món & thanh toán ngay") +
      p("Chuyển khoản quét mã QR là tiệm tự nhận, không cần gửi ảnh chụp.") +
      p(`Không quen đặt web thì nhắn Zalo <a href="${ZALO_URL}" style="color:#ea580c;font-weight:bold;">${ZALO}</a>, Na chốt đơn cho ak.`) +
      sign
  );
  const text = `Chào ${firstName(name)},

Hôm trước Na kể chuyện đồ nóng – đồ lạnh rồi. Hôm nay Na mời bạn thử luôn cái combo tiệm làm ra từ chính chuyện đó.

COMBO NÓNG – LẠNH: Nem nướng Nha Trang + Chè xoài caramen = 65k
${perks.map((t) => `- ${t.replace(/<\/?b>/g, "")}`).join("\n")}

Muốn đổi món cũng được nha. Mỳ trộn sốt cay, chân gà sốt Thái, mẹt đồ chiên… menu đủ cả nóng lẫn lạnh.

👉 Đặt món & thanh toán: ${SITE_URL}
Chuyển khoản quét mã QR là tiệm tự nhận, không cần gửi ảnh chụp.

Không quen đặt web thì nhắn Zalo ${ZALO}, Na chốt đơn cho ak.

Na – Tiệm Chè Na`;
  return { subject, html, text };
}

// ─── Email xác nhận đơn hàng ────────────────────────────────────────────────
export interface OrderEmailData {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentStatus: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  items: { productName: string; quantity: number; itemTotal: number }[];
}

export function orderConfirmationEmail(order: OrderEmailData): EmailContent {
  const n = esc(firstName(order.customerName));
  const code = esc(order.orderCode);
  const isPaid = order.paymentStatus === "PAID";
  const isDigitalOnly = order.customerAddress.startsWith("Sản phẩm số");
  const subject = `Na nhận đơn ${order.orderCode} rồi nha – cảm ơn khách yêu 🥰`;

  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">${esc(i.productName)} × ${i.quantity}</td><td align="right" style="padding:6px 0;border-bottom:1px solid #f3f4f6;white-space:nowrap;">${vnd(i.itemTotal)}</td></tr>`
    )
    .join("");
  const shipFee = Math.max(0, order.finalAmount + order.discountAmount - order.totalAmount);
  const extraRows =
    (shipFee > 0 ? `<tr><td style="padding:6px 0;">Phí ship</td><td align="right">${vnd(shipFee)}</td></tr>` : "") +
    (order.discountAmount > 0 ? `<tr><td style="padding:6px 0;">Giảm giá</td><td align="right">-${vnd(order.discountAmount)}</td></tr>` : "");
  const paymentLine = isPaid ? "Đã chuyển khoản ✅" : "Trả tiền khi nhận hàng";

  const guide = isDigitalOnly
    ? [
        "Đơn này là sản phẩm số / dịch vụ, không cần giao hàng.",
        `Na sẽ gửi nội dung qua Zalo số ${esc(order.customerPhone)} trong ngày.`,
        `Cần hỏi gì thì nhắn Zalo ${ZALO}, nhớ báo mã đơn <b>${code}</b>.`,
      ]
    : [
        `Ship 20–30 phút tới <b>${esc(order.customerAddress)}</b>. Shipper gọi số ${esc(order.customerPhone)} trước khi tới.`,
        "Đồ nóng hộp riêng, đá túi riêng: nhận hàng mở nắp đồ chiên ngay, chè ăn tới đâu đổ đá tới đó.",
        isPaid ? "Bạn chuyển khoản rồi, shipper không thu thêm gì nha." : "Gửi tiền mặt cho shipper là được, hoặc chuyển khoản theo mã QR trên web.",
        `Cần đổi gì thì nhắn Zalo ${ZALO}, nhớ báo mã đơn <b>${code}</b>.`,
      ];

  const html = layout(
    `Đơn ${order.orderCode} – ${vnd(order.finalAmount)}. Bếp đang làm luôn đây ạ.`,
    p(`Chào ${n},`) +
      p("Tiệm nhận đơn của bạn rồi nha. Bếp đang làm luôn đây ạ.") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;">
<tr><td colspan="2" style="padding:0 0 6px;font-weight:bold;font-size:15px;">Đơn ${code}</td></tr>
${rows}${extraRows}
<tr><td style="padding:10px 0 0;font-weight:bold;">Tổng cộng</td><td align="right" style="padding:10px 0 0;font-weight:bold;color:#ea580c;font-size:17px;">${vnd(order.finalAmount)}</td></tr>
<tr><td colspan="2" style="padding:4px 0 0;color:#6b7280;">Thanh toán: ${paymentLine}</td></tr>
</table>` +
      p("<b>Nhận hàng thế nào?</b>") +
      ul(guide) +
      p("Cảm ơn bạn đã chọn Tiệm Chè Na. Ăn ngon thì quay lại với Na nha!") +
      sign
  );

  const text = `Chào ${firstName(order.customerName)},

Tiệm nhận đơn của bạn rồi nha. Bếp đang làm luôn đây ạ.

Đơn ${order.orderCode}
${order.items.map((i) => `- ${i.productName} × ${i.quantity}: ${vnd(i.itemTotal)}`).join("\n")}
${shipFee > 0 ? `Phí ship: ${vnd(shipFee)}\n` : ""}${order.discountAmount > 0 ? `Giảm giá: -${vnd(order.discountAmount)}\n` : ""}Tổng cộng: ${vnd(order.finalAmount)}
Thanh toán: ${paymentLine}

Nhận hàng thế nào?
${guide.map((g) => `- ${g.replace(/<\/?b>/g, "")}`).join("\n")}

Cảm ơn bạn đã chọn Tiệm Chè Na. Ăn ngon thì quay lại với Na nha!

Na – Tiệm Chè Na`;
  return { subject, html, text };
}
