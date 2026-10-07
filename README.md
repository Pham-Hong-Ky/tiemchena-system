# Tiệm Chè Na – App đặt món, thanh toán & CRM

Live: **https://datmon.tiemchena.life** · Quản lý: **/admin** · Form khách quen: **/dang-ky**

| Phần | Làm gì |
|---|---|
| Trang chủ `/` | Menu, giỏ hàng, đặt món (tiền mặt hoặc quét VietQR) |
| `/thanh-toan` | Thanh toán nhanh 1 món bằng QR, Sepay tự xác nhận |
| `/dang-ky` | Form khách quen → lưu CRM + chuỗi 3 email chăm sóc (Resend) |
| `/admin` | Đơn hàng, menu, khách hàng (CRM), thống kê, cài đặt |
| `POST /api/sepay` | Webhook Sepay: tiền về → đơn chuyển "Đã thanh toán" + gửi email xác nhận |
| `POST /api/waitlist` | Form khách quen (gọi được cả từ trang chủ tiemchena.life) |

Công nghệ: Next.js 16 · Prisma 6 + PostgreSQL · Tailwind · Resend (email) · Sepay (đối soát chuyển khoản) · Cloudinary (ảnh).

---

## Chạy trên máy

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị thật
npx prisma db push           # tạo bảng trong database
npm run dev                  # mở http://localhost:3000
```

## Biến môi trường

Không bao giờ viết khóa/mật khẩu thẳng vào code. Mọi bí mật nằm trong `.env.local` (máy) hoặc Vercel → Settings → Environment Variables (server). Các file `.env*`, `resend_config.txt` đã được `.gitignore` chặn.

| Biến | Bắt buộc | Ý nghĩa |
|---|:-:|---|
| `DATABASE_URL` | ✅ | Chuỗi kết nối PostgreSQL |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | ✅ | Tài khoản đăng nhập /admin |
| `ADMIN_SECRET` | ✅ | Chuỗi ngẫu nhiên ≥ 32 ký tự để ký phiên đăng nhập |
| `SEPAY_WEBHOOK_KEY` | ✅ | API Key đặt trong Sepay → Webhook (chặn người lạ giả webhook báo "đã chuyển tiền") |
| `RESEND_API_KEY` | ✅ | Khóa Resend (loại Sending access) |
| `EMAIL_FROM` | ✅ | `Tiệm Chè Na <hi@tiemchena.life>` – domain phải verify trên Resend |
| `EMAIL_REPLY_TO` | | Địa chỉ nhận thư trả lời |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | | Lưu ảnh món |
| `NEXT_PUBLIC_SITE_URL` | | `https://datmon.tiemchena.life` |
| `NEXT_PUBLIC_HOTLINE`, `NEXT_PUBLIC_ZALO_PHONE` | | `0986479285` |
| `NEXT_PUBLIC_VIETQR_BANK_ID`, `NEXT_PUBLIC_VIETQR_ACCOUNT_NO`, `NEXT_PUBLIC_VIETQR_ACCOUNT_NAME` | | Tài khoản nhận tiền (MB · 836888181) |

## Deploy lên Vercel

1. Push code lên nhánh `main` của repo → Vercel tự build (lệnh `vercel-build`: `prisma generate && prisma db push && next build`, tự thêm cột mới vào database).
2. Lần đầu: Vercel → Add New Project → chọn repo → **Root Directory** là thư mục này → khai đủ biến môi trường ở bảng trên → Deploy.
3. Tên miền: Vercel → Settings → Domains → thêm `datmon.tiemchena.life`, rồi ở name.com thêm bản ghi **CNAME** `datmon` trỏ về giá trị Vercel đưa.
4. Đổi biến môi trường xong phải **Redeploy** thì mới có tác dụng.

## Kết nối dịch vụ ngoài

**Sepay** – Sepay → Webhooks → URL `https://datmon.tiemchena.life/api/sepay`, kiểu xác thực **API Key** = đúng giá trị `SEPAY_WEBHOOK_KEY`. Nội dung chuyển khoản chứa mã đơn `TCN-xxxxxx` là đơn tự khớp.

**Resend** – resend.com → Domains → thêm `tiemchena.life` → copy các bản ghi DNS (TXT `resend._domainkey`, CNAME `send`, CNAME `rsend`) sang name.com → bấm Verify. Chưa verify thì không gửi được từ `hi@tiemchena.life`.

## Kiểm tra sau khi deploy

1. `/dang-ky` với email `tenban+test@gmail.com` → nhận đủ 3 email ngay, người gửi `hi@tiemchena.life`.
2. `/thanh-toan` → chọn món → quét QR chuyển khoản → màn hình báo thanh toán thành công, đơn trong /admin chuyển "Đã thanh toán", có email xác nhận đơn.
3. `/admin` → Khách hàng → thấy khách vừa đăng ký.

Email mẫu xem trước: `npx tsx scripts/previewEmails.ts` (xuất HTML ra thư mục `email-preview/`).
