import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
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

    // Aggregate by phone number
    const customerMap = new Map<
      string,
      {
        phone: string;
        name: string;
        address: string;
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: string;
        isVip: boolean;
        note?: string;
        recentOrders: {
          orderCode: string;
          finalAmount: number;
          orderStatus: string;
          createdAt: string;
        }[];
      }
    >();

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
          isVip: false, // will compute below
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

    // Sort by total spent descending
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error("GET customers error:", error);
    return NextResponse.json({ success: false, error: "Không thể lấy danh sách khách hàng" }, { status: 500 });
  }
}
