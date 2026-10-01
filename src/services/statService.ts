import { prisma } from "@/lib/prisma";

export const statService = {
  async getStats() {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        customerPhone: true,
        customerAddress: true,
        orderStatus: true,
        paymentStatus: true,
        finalAmount: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            itemTotal: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let revenueToday = 0;
    let revenueTotal = 0;
    let ordersToday = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const productSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};

    for (const order of orders) {
      const isCancelled = order.orderStatus === "CANCELLED";

      if (!isCancelled) {
        revenueTotal += order.finalAmount;
        if (new Date(order.createdAt) >= todayStart) {
          revenueToday += order.finalAmount;
          ordersToday += 1;
        }
      }

      if (order.orderStatus === "PENDING") pendingCount++;
      if (order.orderStatus === "COMPLETED") completedCount++;
      if (order.orderStatus === "CANCELLED") cancelledCount++;

      if (!isCancelled) {
        for (const item of order.items) {
          if (!productSalesMap[item.productName]) {
            productSalesMap[item.productName] = { name: item.productName, count: 0, revenue: 0 };
          }
          productSalesMap[item.productName].count += item.quantity;
          productSalesMap[item.productName].revenue += item.itemTotal;
        }
      }
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      revenueToday,
      revenueTotal,
      ordersToday,
      totalOrders: orders.length,
      pendingCount,
      completedCount,
      cancelledCount,
      topProducts,
      recentOrders: orders.slice(0, 10),
    };
  },
};
