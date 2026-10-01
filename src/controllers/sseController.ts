import { NextRequest, NextResponse } from "next/server";
import { orderEvents } from "@/lib/orderEvents";
import { requireAdmin } from "@/lib/apiAuth";

export const sseController = {
  async streamOrders(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", timestamp: Date.now() })}\n\n`));

        const handleNewOrder = (order: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "NEW_ORDER", data: order })}\n\n`));
        };

        const handleOrderUpdated = (order: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ORDER_UPDATED", data: order })}\n\n`));
        };

        orderEvents.on("new_order", handleNewOrder);
        orderEvents.on("order_updated", handleOrderUpdated);

        const interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch {
            clearInterval(interval);
          }
        }, 20000);

        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          orderEvents.off("new_order", handleNewOrder);
          orderEvents.off("order_updated", handleOrderUpdated);
          try {
            controller.close();
          } catch {}
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  },
};
