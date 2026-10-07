/**
 * Xuất 4 email (3 email chăm sóc + xác nhận đơn) ra file HTML để xem trước trên trình duyệt.
 * Chạy: npx tsx scripts/previewEmails.ts [thư-mục-xuất]
 */
import fs from "fs";
import path from "path";
import { welcomeEmail, nurtureEmail, offerEmail, orderConfirmationEmail } from "../src/lib/emailTemplates";

const outDir = process.argv[2] || path.join(process.cwd(), "email-preview");
fs.mkdirSync(outDir, { recursive: true });

const emails = {
  "1-chao-mung": welcomeEmail("Nguyễn Thị Lan"),
  "2-nurture": nurtureEmail("Nguyễn Thị Lan"),
  "3-chot": offerEmail("Nguyễn Thị Lan"),
  "4-xac-nhan-don": orderConfirmationEmail({
    orderCode: "TCN-123456",
    customerName: "Nguyễn Thị Lan",
    customerPhone: "0912345678",
    customerAddress: "Ngõ 12 Vũ Lăng, Ngũ Hiệp, Thanh Trì",
    paymentStatus: "PAID",
    totalAmount: 65000,
    discountAmount: 3250,
    finalAmount: 61750,
    items: [
      { productName: "Nem nướng Nha Trang", quantity: 1, itemTotal: 35000 },
      { productName: "Chè xoài caramen", quantity: 1, itemTotal: 30000 },
    ],
  }),
};

for (const [file, e] of Object.entries(emails)) {
  fs.writeFileSync(path.join(outDir, `${file}.html`), e.html.replace("<body", `<body data-subject="${e.subject}"`));
  console.log(`${file}: ${e.subject}`);
}
console.log(`→ ${outDir}`);
