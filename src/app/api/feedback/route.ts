import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { checkGenericRateLimit } from "@/lib/rateLimit";

// In-memory feedback store (starts empty for real customers)
let feedbackStore: {
  id: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  dishName: string;
  comment: string;
  reply: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
}[] = [];

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
