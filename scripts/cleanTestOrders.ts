import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const countBefore = await prisma.order.count();
  console.log(`Tong so don hang hien tai: ${countBefore}`);

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderCode: true,
      customerName: true,
      customerPhone: true,
      finalAmount: true,
      orderStatus: true,
      paymentStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("Danh sach don hang:");
  console.table(orders);

  // Xóa toàn bộ đơn hàng test
  const deleted = await prisma.order.deleteMany({});
  console.log(`Da xoa thanh cong ${deleted.count} don hang test!`);
}

main()
  .catch((e) => {
    console.error("Loi khi xoa don:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
