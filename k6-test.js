import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ─── CẤU HÌNH THỜI GIAN VÀ MỨC ĐỘ CHỊU TẢI (STAGES) ─────────────────────────
export const options = {
  stages: [
    { duration: '20s', target: 20 },  // Giai đoạn 1: Khởi động 20 khách cùng lúc
    { duration: '40s', target: 100 }, // Giai đoạn 2: Giờ cao điểm 100 khách đồng thời
    { duration: '30s', target: 200 }, // Giai đoạn 3: Bão đơn đột biến 200 khách
    { duration: '15s', target: 0 },   // Giai đoạn 4: Giảm tải kết thúc test
  ],
  thresholds: {
    // 95% số yêu cầu phải hoàn thành dưới 800ms
    http_req_duration: ['p(95)<800'],
    // Tỷ lệ lỗi toàn hệ thống không được vượt quá 1%
    http_req_failed: ['rate<0.01'],
  },
};

// URL mục tiêu (chạy local hoặc truyền -e TARGET_URL=https://domain-cua-ban.vercel.app)
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  let productsList = [];

  // ─── SCENARIO 1: KHÁCH HÀNG VÀO XEM THỰC ĐƠN (80% Lưu lượng) ──────────────
  group('1. Lướt Xem Thực Đơn', () => {
    // 1.1 Tải danh mục
    const catRes = http.get(`${BASE_URL}/api/categories`);
    check(catRes, {
      'Categories 200': (r) => r.status === 200,
    });

    // 1.2 Tải danh sách món ăn (đã kích hoạt Edge Cache)
    const prodRes = http.get(`${BASE_URL}/api/products`);
    const isProdOk = check(prodRes, {
      'Products 200': (r) => r.status === 200,
      'Has products': (r) => {
        try {
          const body = JSON.parse(r.body);
          if (body.data?.products?.length > 0) {
            productsList = body.data.products;
            return true;
          }
        } catch (e) {}
        return false;
      },
    });

    // 1.3 Tải thông tin cửa hàng & tài khoản VietQR
    const settingRes = http.get(`${BASE_URL}/api/settings`);
    check(settingRes, {
      'Settings 200': (r) => r.status === 200,
    });

    sleep(1 + Math.random() * 2); // Khách xem thực đơn từ 1 - 3 giây
  });

  // ─── SCENARIO 2: KHÁCH HÀNG TIẾN HÀNH ĐẶT ĐƠN (20% Lưu lượng) ─────────────
  // Chỉ 20% người dùng thực hiện tạo đơn để phản ánh đúng hành vi thực tế
  if (Math.random() < 0.20 && productsList.length > 0) {
    group('2. Tạo Đơn Hàng & Tra Cứu', () => {
      // Chọn ngẫu nhiên 1 - 2 món từ thực đơn thật
      const randomProduct = productsList[Math.floor(Math.random() * productsList.length)];
      const randomPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);

      const orderPayload = JSON.stringify({
        customerName: 'Khách Test K6',
        customerPhone: randomPhone,
        customerAddress: 'Số 10 Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội',
        note: 'Đơn test tự động k6 load-testing',
        paymentMethod: 'COD',
        items: [
          {
            id: randomProduct.id,
            name: randomProduct.name,
            price: randomProduct.price,
            quantity: 1 + Math.floor(Math.random() * 3),
            selectedToppings: [],
          },
        ],
      });

      const orderParams = {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'k6-load-tester',
        },
      };

      const orderRes = http.post(`${BASE_URL}/api/orders`, orderPayload, orderParams);
      const isOrderSuccess = check(orderRes, {
        'Order status 200': (r) => r.status === 200,
        'Has orderCode': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Boolean(body.data?.orderCode);
          } catch (e) {
            return false;
          }
        },
      });

      // ─── SCENARIO 3: TRA CỨU ĐƠN HÀNG VỪA TẠO ─────────────────────────────
      if (isOrderSuccess) {
        try {
          const body = JSON.parse(orderRes.body);
          const orderCode = body.data?.orderCode;

          if (orderCode) {
            sleep(1); // Chờ 1 giây trước khi tra cứu
            const trackRes = http.get(`${BASE_URL}/api/orders/track?code=${orderCode}`);
            check(trackRes, {
              'Track status 200': (r) => r.status === 200,
              'Correct order matched': (r) => {
                const b = JSON.parse(r.body);
                return b.data?.orderCode === orderCode;
              },
            });
          }
        } catch (e) {}
      }

      sleep(2);
    });
  }
}
