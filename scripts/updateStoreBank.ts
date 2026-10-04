import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.storeSetting.findFirst();
  if (setting) {
    const updated = await prisma.storeSetting.update({
      where: { id: setting.id },
      data: {
        qrBankId: "MB",
        qrAccountNumber: "836888181",
        qrAccountName: "HO KINH DOANH TIEM CHE NA",
      },
    });
    console.log("Updated store setting:", updated);
  } else {
    const created = await prisma.storeSetting.create({
      data: {
        id: "default",
        qrBankId: "MB",
        qrAccountNumber: "836888181",
        qrAccountName: "HO KINH DOANH TIEM CHE NA",
      },
    });
    console.log("Created store setting:", created);
  }
}

main().finally(() => prisma.$disconnect());
