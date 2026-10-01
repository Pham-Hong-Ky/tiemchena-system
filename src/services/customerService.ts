import { prisma } from "@/lib/prisma";
import { validatePhoneNumber } from "@/lib/orderValidation";

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

  // Danh sách khách hàng (cho Admin)
  async getCustomers() {
    const orders = await prisma.order.findMany({
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
    });

    const customerMap = new Map<string, any>();

    for (const ord of orders) {
      const phoneKey = ord.customerPhone.trim() || "unknown";
      const existing = customerMap.get(phoneKey);

      if (!existing) {
        customerMap.set(phoneKey, {
          phone: ord.customerPhone,
          name: ord.customerName,
          address: ord.customerAddress,
          totalOrders: 1,
          totalSpent: ord.finalAmount,
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
        existing.totalOrders += 1;
        existing.totalSpent += ord.finalAmount;
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

    customers.sort((a, b) => b.totalSpent - a.totalSpent);
    return customers;
  },
};
