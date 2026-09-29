import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for Tiệm Chè Na...");

  // Clean old data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.storeSetting.deleteMany();

  // 1. Store Settings
  await prisma.storeSetting.create({
    data: {
      id: "default",
      storeName: "Tiệm Chè Na",
      hotline: "0986.479.285",
      address: "Vũ Lăng, Ngũ Hiệp, Thanh Trì, Hà Nội",
      openingHours: "09:00 - 22:30 hàng ngày",
      bannerAnnouncement: "GIẢM NGAY 10% tổng hóa đơn khi đặt trước hoặc chốt đơn qua Zalo hôm nay!",
      qrBankId: "MB",
      qrAccountNumber: "0986479285",
      qrAccountName: "TIEM CHE NA",
      zaloUrl: "https://zalo.me/0986479285",
      isAcceptingOrders: true,
    },
  });

  // 2. Toppings
  const tRam = await prisma.topping.create({ data: { name: "Thêm Ram giòn rụm", price: 5000 } });
  const tSot = await prisma.topping.create({ data: { name: "Thêm Sốt chấm thịt băm gia truyền", price: 5000 } });
  const tTrung = await prisma.topping.create({ data: { name: "Trứng ốp la lòng đào", price: 6000 } });
  const tXucXich = await prisma.topping.create({ data: { name: "Xúc xích nướng/chiên", price: 8000 } });
  const tTranChau = await prisma.topping.create({ data: { name: "Trân châu hoàng kim dẻo dai", price: 5000 } });
  const tCaramen = await prisma.topping.create({ data: { name: "Thêm 1 hũ Caramen ngậy béo", price: 8000 } });
  const tThachDua = await prisma.topping.create({ data: { name: "Thạch dừa non giòn mát", price: 5000 } });

  // 3. Categories & Products
  const catAnVat = await prisma.category.create({
    data: {
      name: "Ăn Vặt Nóng Hổi",
      slug: "an-vat-hot",
      icon: "Flame",
      sortOrder: 1,
      isActive: true,
    },
  });

  const catChe = await prisma.category.create({
    data: {
      name: "Chè Ngon Thanh Mát",
      slug: "che-truyen-thong",
      icon: "IceCream",
      sortOrder: 2,
      isActive: true,
    },
  });

  const catDoUong = await prisma.category.create({
    data: {
      name: "Trà & Đồ Uống Mát Lạnh",
      slug: "do-uong-tra",
      icon: "Coffee",
      sortOrder: 3,
      isActive: true,
    },
  });

  const catCombo = await prisma.category.create({
    data: {
      name: "Combo Tiết Kiệm",
      slug: "combo-tiet-kiem",
      icon: "Sparkles",
      sortOrder: 4,
      isActive: true,
    },
  });

  // Products
  await prisma.product.createMany({
    data: [
      {
        name: "Nem Nướng Nha Trang Đặc Biệt",
        slug: "nem-nuong-nha-trang",
        description: "Nem nướng thơm lừng than hoa, ram giòn rụm, bánh tráng, dưa leo, xoài xanh, rau thơm cùng nước sốt thịt băm gia truyền béo bùi.",
        price: 35000,
        originalPrice: 40000,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        isHot: true,
        isBestseller: true,
        isAvailable: true,
        categoryId: catAnVat.id,
        toppingsJson: JSON.stringify([tRam.id, tSot.id]),
      },
      {
        name: "Mỳ Trộn Sốt Cay Trứng Xúc Xích",
        slug: "my-tron-cay",
        description: "Sợi mỳ dai ngấm đẫm sốt cay ngọt đậm đà, ăn kèm xúc xích nướng, trứng ốp la, dưa leo và rau thơm thanh mát.",
        price: 35000,
        originalPrice: 38000,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        isHot: true,
        isBestseller: true,
        isAvailable: true,
        categoryId: catAnVat.id,
        toppingsJson: JSON.stringify([tTrung.id, tXucXich.id]),
      },
      {
        name: "Chân Gà Sốt Thái Chua Cay",
        slug: "chan-ga-sot-thai",
        description: "Chân gà rút xương giòn sần sật, thấm đẫm sốt Thái cay tê, xoài non và cóc non chua giòn rụm khó cưỡng.",
        price: 35000,
        originalPrice: 40000,
        image: "https://images.unsplash.com/photo-1527477378731-d85f81a7428f?auto=format&fit=crop&w=600&q=80",
        isHot: true,
        isBestseller: false,
        isAvailable: true,
        categoryId: catAnVat.id,
        toppingsJson: JSON.stringify([]),
      },
      {
        name: "Chè Xoài Caramen Thạch Dừa",
        slug: "che-xoai-caramen",
        description: "Caramen mềm tan béo ngậy kết hợp xoài cát chín thơm lừng, thạch dừa giòn sần sật và nước cốt dừa sánh mịn.",
        price: 30000,
        originalPrice: 35000,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
        isHot: true,
        isBestseller: true,
        isAvailable: true,
        categoryId: catChe.id,
        toppingsJson: JSON.stringify([tCaramen.id, tThachDua.id, tTranChau.id]),
      },
      {
        name: "Chè Bưởi An Giang Cốt Dừa",
        slug: "che-buoi-an-giang",
        description: "Cùi bưởi giòn sần sật khử đắng kỹ lưỡng, đỗ xanh bùi béo kết hợp cốt dừa béo thơm chuẩn vị miền Tây.",
        price: 28000,
        originalPrice: 30000,
        image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80",
        isHot: false,
        isBestseller: false,
        isAvailable: true,
        categoryId: catChe.id,
        toppingsJson: JSON.stringify([tTranChau.id]),
      },
      {
        name: "Caramen Trân Châu Cốt Dừa",
        slug: "caramen-tran-chau",
        description: "Hũ caramen vàng óng, mềm mướt không rỗ, thơm nức mùi cafe và nước cốt dừa béo ngậy kèm trân châu dẻo.",
        price: 22000,
        originalPrice: 25000,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
        isHot: false,
        isBestseller: false,
        isAvailable: true,
        categoryId: catChe.id,
        toppingsJson: JSON.stringify([tTranChau.id, tCaramen.id]),
      },
      {
        name: "Trà Sữa Thái Đỏ Trân Châu",
        slug: "tra-sua-thai-do",
        description: "Hương vị trà Thái đậm đà quyện cùng sữa thơm ngọt dịu, thêm trân châu hoàng kim dai dẻo mát lạnh sảng khoái.",
        price: 25000,
        originalPrice: 30000,
        image: "https://images.unsplash.com/photo-1558857563-b37d1d234d31?auto=format&fit=crop&w=600&q=80",
        isHot: false,
        isBestseller: true,
        isAvailable: true,
        categoryId: catDoUong.id,
        toppingsJson: JSON.stringify([tTranChau.id, tThachDua.id]),
      },
      {
        name: "Trà Đào Cam Sả Mát Lạnh",
        slug: "tra-dao-cam-sa",
        description: "Thanh mát giải nhiệt với vị sả tươi thơm nồng, nước cam chua ngọt dịu nhẹ và miếng đào giòn thơm.",
        price: 25000,
        originalPrice: 28000,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
        isHot: false,
        isBestseller: false,
        isAvailable: true,
        categoryId: catDoUong.id,
        toppingsJson: JSON.stringify([tThachDua.id]),
      },
      {
        name: "Combo Chiều Vàng: Nem Nướng + Trà Thái Đỏ",
        slug: "combo-nem-nuong-tra-thai",
        description: "1 Suất Nem Nướng Nha Trang Đặc Biệt + 1 Ly Trà Sữa Thái Đỏ trân châu. Tiết kiệm ngay 10.000đ!",
        price: 50000,
        originalPrice: 60000,
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        isHot: true,
        isBestseller: true,
        isAvailable: true,
        categoryId: catCombo.id,
        toppingsJson: JSON.stringify([]),
      },
      {
        name: "Combo Ăn No: Mỳ Trộn Cay + Chè Xoài Caramen",
        slug: "combo-my-tron-che-xoai",
        description: "1 Tô Mỳ Trộn Cay Xúc Xích Trứng + 1 Bát Chè Xoài Caramen thơm béo mát lạnh. Cặp đôi hoàn hảo cho bữa chiều!",
        price: 58000,
        originalPrice: 65000,
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
        isHot: true,
        isBestseller: true,
        isAvailable: true,
        categoryId: catCombo.id,
        toppingsJson: JSON.stringify([]),
      },
    ],
  });

  // 4. Vouchers
  await prisma.voucher.createMany({
    data: [
      {
        code: "TIEMCHENA10",
        discountType: "PERCENT",
        discountValue: 10,
        minOrderValue: 0,
        maxDiscount: 30000,
        usageLimit: 500,
        isActive: true,
      },
      {
        code: "BANMOI15K",
        discountType: "FIXED",
        discountValue: 15000,
        minOrderValue: 70000,
        usageLimit: 200,
        isActive: true,
      },
      {
        code: "FREESHIP",
        discountType: "FIXED",
        discountValue: 10000,
        minOrderValue: 60000,
        usageLimit: 300,
        isActive: true,
      },
    ],
  });

  // 5. Sample Orders for Dashboard Demo
  const o1 = await prisma.order.create({
    data: {
      orderCode: "TCN-" + Math.floor(100000 + Math.random() * 900000),
      customerName: "Nguyễn Thu Hà",
      customerPhone: "0912345678",
      customerAddress: "Số 15 Vũ Lăng, Ngũ Hiệp, Thanh Trì",
      note: "Cho nhiều sốt chấm nem, giao trước 17h nhé quán",
      paymentMethod: "VIETQR",
      paymentStatus: "PAID",
      orderStatus: "PREPARING",
      totalAmount: 100000,
      discountAmount: 10000,
      finalAmount: 90000,
      voucherCode: "TIEMCHENA10",
      items: {
        create: [
          {
            productName: "Nem Nướng Nha Trang Đặc Biệt",
            productPrice: 35000,
            quantity: 2,
            itemTotal: 70000,
            note: "Thêm rau",
          },
          {
            productName: "Chè Xoài Caramen Thạch Dừa",
            productPrice: 30000,
            quantity: 1,
            itemTotal: 30000,
          },
        ],
      },
    },
  });

  const o2 = await prisma.order.create({
    data: {
      orderCode: "TCN-" + Math.floor(100000 + Math.random() * 900000),
      customerName: "Trần Anh Quân",
      customerPhone: "0988776655",
      customerAddress: "Chung cư Tecco Skyville Thanh Trì, Phòng 1208",
      note: "Gọi trước khi lên sảnh nhận hàng",
      paymentMethod: "COD",
      paymentStatus: "UNPAID",
      orderStatus: "PENDING",
      totalAmount: 116000,
      discountAmount: 11600,
      finalAmount: 104400,
      voucherCode: "TIEMCHENA10",
      items: {
        create: [
          {
            productName: "Combo Chiều Vàng: Nem Nướng + Trà Thái Đỏ",
            productPrice: 50000,
            quantity: 2,
            itemTotal: 100000,
          },
          {
            productName: "Caramen Trân Châu Cốt Dừa",
            productPrice: 22000,
            quantity: 1,
            itemTotal: 22000,
          },
        ],
      },
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
