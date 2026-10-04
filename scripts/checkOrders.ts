import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("DANH SACH DON HANG MOI NHAT:");
  console.log(JSON.stringify(orders, null, 2));
}

main().finally(() => prisma.$disconnect());
