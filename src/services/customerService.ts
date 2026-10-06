import { prisma } from "@/lib/prisma";
import { validatePhoneNumber, validateCustomerName, validateEmail } from "@/lib/orderValidation";
import { emailService, isTestEmail } from "@/services/emailService";

const cleanPhoneOf = (p: unknown) => String(p || "").trim().replace(/[\s.-]/g, "");

export interface CustomerInput {
  name?: string;
  phone?: string;
  zalo?: string;
  email?: string;
  address?: string;
  note?: string;
}

function validateCustomerInput(body: CustomerInput) {
  const name = String(body.name || "").trim();
  const phone = cleanPhoneOf(body.phone);
  const nameCheck = validateCustomerName(name);
  if (!nameCheck.valid) throw new Error(nameCheck.error);
  const phoneCheck = validatePhoneNumber(phone);
  if (!phoneCheck.valid) throw new Error(phoneCheck.error);
  const email = String(body.email || "").trim().toLowerCase();
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) throw new Error(emailCheck.error);
  return {
    name,
    phone,
    zalo: body.zalo ? cleanPhoneOf(body.zalo) : phone,
    email: email || null,
    address: body.address ? String(body.address).trim().slice(0, 300) : null,
    note: body.note ? String(body.note).trim().slice(0, 500) : null,
  };
}

export const customerService = {
  // Tra cứu nhanh tên khách theo số điện thoại (cho khách hàng)
  async lookupByPhone(phone: string) {
    const cleanPhone = phone.replace(/[\s.-]/g, "");
    const check = validatePhoneNumber(cleanPhone);
    if (!check.valid) throw new Error(check.error || "Số điện thoại không hợp lệ");

    const latestOrder = await prisma.order.findFirst({
      where: { customerPhone: cleanPhone },
      orderBy: { createdAt: "desc" },
      select: { customerName: true },
    });

    if (latestOrder?.customerName) {
      return { exists: true, customerName: latestOrder.customerName.trim() };
    }
    return { exists: false };
  },

  // Danh sách khách hàng (cho Admin) = bảng Customer (CRM) + khách chỉ có trong đơn hàng, kèm thống kê
  async getCustomers() {
    const [records, orders] = await Promise.all([
      prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderCode: true,
          customerName: true,
          customerPhone: true,
          customerAddress: true,
          finalAmount: true,
          orderStatus: true,
          paymentStatus: true,
          note: true,
          createdAt: true,
        },
      }),
    ]);

    const customerMap = new Map<string, any>();

    for (const c of records) {
      customerMap.set(c.phone, {
        id: c.id,
        phone: c.phone,
        name: c.name,
        address: c.address || "",
        email: c.email,
        zalo: c.zalo,
        source: c.source,
        createdAt: c.createdAt.toISOString(),
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: c.createdAt.toISOString(),
        isVip: false,
        note: c.note || undefined,
        recentOrders: [],
      });
    }

    for (const ord of orders) {
      const phoneKey = cleanPhoneOf(ord.customerPhone) || "unknown";
      const existing = customerMap.get(phoneKey);

      if (!existing) {
        customerMap.set(phoneKey, {
          phone: ord.customerPhone,
          name: ord.customerName,
          address: ord.customerAddress,
          source: "order",
          totalOrders: 1,
          totalSpent: ord.orderStatus === "CANCELLED" ? 0 : ord.finalAmount,
          lastOrderDate: ord.createdAt.toISOString(),
          isVip: false,
          note: ord.note || undefined,
          recentOrders: [
            {
              orderCode: ord.orderCode,
              finalAmount: ord.finalAmount,
              orderStatus: ord.orderStatus,
              createdAt: ord.createdAt.toISOString(),
            },
          ],
        });
      } else {
        if (existing.totalOrders === 0) existing.lastOrderDate = ord.createdAt.toISOString();
        existing.totalOrders += 1;
        if (ord.orderStatus !== "CANCELLED") existing.totalSpent += ord.finalAmount;
        if (existing.recentOrders.length < 5) {
          existing.recentOrders.push({
            orderCode: ord.orderCode,
            finalAmount: ord.finalAmount,
            orderStatus: ord.orderStatus,
            createdAt: ord.createdAt.toISOString(),
          });
        }
      }
    }

    const customers = Array.from(customerMap.values()).map((c) => ({
      ...c,
      isVip: c.totalOrders >= 3 || c.totalSpent >= 150000,
    }));

    customers.sort((a, b) => b.totalSpent - a.totalSpent || b.lastOrderDate.localeCompare(a.lastOrderDate));
    return customers;
  },

  // Thêm 1 khách (Admin)
  async createCustomer(body: CustomerInput) {
    const data = validateCustomerInput(body);
    const exists = await prisma.customer.findUnique({ where: { phone: data.phone } });
    if (exists) throw new Error("Số điện thoại này đã có trong danh sách khách");
    return prisma.customer.create({ data: { ...data, source: "manual" } });
  },

  // Nhập hàng loạt từ danh sách chờ – số đã có thì gắn nguồn "danh sách chờ" + bổ sung ô còn trống
  async importCustomers(rows: CustomerInput[], source: "waitlist" | "manual" = "waitlist") {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (const raw of rows.slice(0, 500)) {
      let data;
      try {
        data = validateCustomerInput(raw);
      } catch (e: any) {
        errors.push(`${raw?.name || "?"} (${raw?.phone || "?"}): ${e.message}`);
        continue;
      }
      const exists = await prisma.customer.findUnique({ where: { phone: data.phone } });
      if (exists) {
        const patch = {
          ...(source === "waitlist" && exists.source === "order" && { source }),
          ...(!exists.address && data.address && { address: data.address }),
          ...(!exists.note && data.note && { note: data.note }),
          ...(!exists.email && data.email && { email: data.email }),
        };
        if (Object.keys(patch).length > 0) {
          await prisma.customer.update({ where: { id: exists.id }, data: patch });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }
      await prisma.customer.create({ data: { ...data, source } });
      created++;
    }
    return { created, updated, skipped, errors };
  },

  // Khách tự điền form khách quen (/dang-ky) → lưu CRM + bắt đầu chuỗi 3 email chăm sóc
  async joinWaitlist(body: CustomerInput) {
    const data = validateCustomerInput(body);
    if (!data.email) throw new Error("Vui lòng nhập email để nhận ưu đãi khách quen");

    const exists = await prisma.customer.findUnique({ where: { phone: data.phone } });
    const customer = exists
      ? await prisma.customer.update({
          where: { id: exists.id },
          data: {
            email: data.email,
            ...(exists.source === "order" && { source: "waitlist" }),
            ...(!exists.address && data.address && { address: data.address }),
            ...(!exists.note && data.note && { note: data.note }),
          },
        })
      : await prisma.customer.create({ data: { ...data, source: "waitlist" } });

    // Khách đã nhận chuỗi email rồi thì không gửi lại (trừ email test "+test")
    const alreadyStarted = exists?.emailSequenceAt && exists.email === data.email;
    if (alreadyStarted && !isTestEmail(data.email)) {
      return { customer, emails: { testMode: false, sent: 0, alreadyStarted: true } };
    }
    const emails = await emailService.startWelcomeSequence({ id: customer.id, name: customer.name, email: data.email });
    return { customer, emails };
  },

  // Sửa khách (Admin)
  async updateCustomer(id: string, body: CustomerInput) {
    if (!id) throw new Error("Thiếu id khách hàng");
    const data = validateCustomerInput(body);
    const duplicate = await prisma.customer.findFirst({ where: { phone: data.phone, id: { not: id } } });
    if (duplicate) throw new Error("Số điện thoại này đã thuộc khách khác");
    return prisma.customer.update({ where: { id }, data });
  },

  // Xóa khách khỏi CRM (đơn hàng cũ giữ nguyên)
  async deleteCustomer(id: string) {
    if (!id) throw new Error("Thiếu id khách hàng");
    return prisma.customer.delete({ where: { id } });
  },
};
