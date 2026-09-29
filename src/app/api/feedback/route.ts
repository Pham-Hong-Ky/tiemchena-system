import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { checkGenericRateLimit } from "@/lib/rateLimit";

// Default feedbacks list
let feedbackStore = [
  {
    id: "fb-1",
    customerName: "Minh Anh",
    customerPhone: "0912***456",
    rating: 5,
    dishName: "Nem Nướng Nha Trang",
    comment: "Nem nướng thơm phức than hoa, sốt chấm thịt băm gia truyền siêu ngon béo ngậy. Giao hàng nóng hổi trong 25 phút!",
    reply: "Dạ cảm ơn bạn Minh Anh đã ủng hộ Tiệm Chè Na nhiều nha! Chúc bạn ngon miệng ạ ❤️",
    status: "APPROVED" as const,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "fb-2",
    customerName: "Hoàng Nam",
    customerPhone: "0988***123",
    rating: 5,
    dishName: "Mỳ Trộn Sốt Cay Trứng Lòng Đào",
    comment: "Sốt cay vừa miệng, trứng ốp la lòng đào chảy béo ngậy. Topping xúc xích với rau thơm rất đầy đặn.",
    reply: "Cảm ơn bạn Nam nhiều nhé! Lần sau ghé quán lại nha!",
    status: "APPROVED" as const,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "fb-3",
    customerName: "Thu Trang",
    customerPhone: "0976***789",
    rating: 5,
    dishName: "Chè Xoài Caramen Thạch Dừa",
    comment: "Caramen mềm mướt không bị rỗ tí nào, xoài ngọt thơm mát lịm. Đóng gói hộp giấy sạch sẽ tinh tươm.",
    reply: "",
    status: "APPROVED" as const,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "fb-4",
    customerName: "Đức Huy",
    customerPhone: "0904***321",
    rating: 4,
    dishName: "Chân Gà Sốt Thái",
    comment: "Chân gà giòn sần sật, cóc xoài chua cay đã miệng. Quán cho thêm nhiều sốt hơn xíu nữa thì tuyệt vời.",
    reply: "Dạ quán ghi nhận ý kiến của bạn Huy để chuẩn bị đẫm sốt hơn cho đơn sau nha ạ!",
    status: "APPROVED" as const,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "fb-5",
    customerName: "Khách Ẩn Danh",
    customerPhone: "0933***888",
    rating: 5,
    dishName: "Trà Sữa Thái Đỏ",
    comment: "Trà sữa đậm vị thơm ngọt dịu, trân châu dai dẻo chuẩn bài.",
    reply: "",
    status: "PENDING" as const,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: feedbackStore });
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : realIp) || "127.0.0.1";

    const rateCheck = checkGenericRateLimit("feedback_post", clientIp.trim(), {
      maxRequests: 3,
      windowMs: 10 * 60 * 1000, // 10 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes block
      errorMessage: "Bạn đã gửi đánh giá quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    });

    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: rateCheck.error }, { status: 429 });
    }

    const body = await request.json();
    const { customerName, customerPhone, rating, dishName, comment } = body;

    if (!customerName || !comment) {
      return NextResponse.json({ success: false, error: "Tên khách và nội dung đánh giá là bắt buộc" }, { status: 400 });
    }

    const newFeedback = {
      id: "fb-" + Date.now(),
      customerName,
      customerPhone: customerPhone || "",
      rating: rating ? parseInt(String(rating)) : 5,
      dishName: dishName || "Tổng quan món ăn",
      comment,
      reply: "",
      status: "APPROVED" as const,
      createdAt: new Date().toISOString(),
    };

    feedbackStore.unshift(newFeedback);
    return NextResponse.json({ success: true, data: newFeedback });
  } catch (error) {
    console.error("POST feedback error:", error);
    return NextResponse.json({ success: false, error: "Không thể gửi đánh giá" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { id, reply, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID phản hồi" }, { status: 400 });
    }

    const idx = feedbackStore.findIndex((f) => f.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy phản hồi" }, { status: 404 });
    }

    feedbackStore[idx] = {
      ...feedbackStore[idx],
      reply: reply !== undefined ? reply : feedbackStore[idx].reply,
      status: status !== undefined ? status : feedbackStore[idx].status,
    };

    return NextResponse.json({ success: true, data: feedbackStore[idx] });
  } catch (error) {
    console.error("PUT feedback error:", error);
    return NextResponse.json({ success: false, error: "Không thể cập nhật phản hồi" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID phản hồi" }, { status: 400 });
    }

    feedbackStore = feedbackStore.filter((f) => f.id !== id);
    return NextResponse.json({ success: true, message: "Đã xóa phản hồi thành công" });
  } catch (error) {
    console.error("DELETE feedback error:", error);
    return NextResponse.json({ success: false, error: "Không thể xóa phản hồi" }, { status: 500 });
  }
}
