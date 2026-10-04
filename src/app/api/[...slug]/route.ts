import { NextRequest, NextResponse } from "next/server";
import { orderController } from "@/controllers/orderController";
import { productController } from "@/controllers/productController";
import { categoryController } from "@/controllers/categoryController";
import { customerController } from "@/controllers/customerController";
import { settingController } from "@/controllers/settingController";
import { statController } from "@/controllers/statController";
import { sepayController } from "@/controllers/sepayController";
import { voucherController } from "@/controllers/voucherController";
import { authController } from "@/controllers/authController";
import { geocodeController } from "@/controllers/geocodeController";
import { adminController } from "@/controllers/adminController";
import { uploadController } from "@/controllers/uploadController";
import { proxyImageController } from "@/controllers/proxyImageController";
import { sseController } from "@/controllers/sseController";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ slug: string[] }> };

// ==========================================
// GET Dispatcher
// ==========================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug = [] } = await params;
  const [p1, p2, p3] = slug;

  // 1. Orders
  if (p1 === "orders") {
    if (!p2) return orderController.list(request);
    if (p2 === "track") return orderController.track(request);
    return orderController.getById(request, p2);
  }

  // 2. Products
  if (p1 === "products") {
    if (!p2) return productController.get(request);
    return productController.get(request, p2);
  }

  // 3. Customers
  if (p1 === "customers") {
    if (!p2) return customerController.get(request);
    if (p2 === "lookup") return customerController.get(request, ["lookup"]);
  }

  // 4. Categories
  if (p1 === "categories" && !p2) {
    return categoryController.get(request);
  }

  // 5. Settings
  if (p1 === "settings" && !p2) {
    return settingController.get();
  }

  // 6. Stats
  if (p1 === "stats" && !p2) {
    return statController.get();
  }

  // 7. Geocode
  if (p1 === "geocode") {
    if (p2 === "estimate" || p2 === "direction") {
      return geocodeController.estimate(request);
    }
    if (!p2 || p2 === "reverse") {
      return geocodeController.reverse(request);
    }
  }

  // 8. Admin auth / me
  if (p1 === "admin" && p2 === "auth" && p3 === "me") {
    return authController.me();
  }

  // 9. Admin sync-categories
  if (p1 === "admin" && p2 === "sync-categories") {
    return adminController.syncCategories();
  }

  // 10. Proxy image
  if (p1 === "proxy-image" && !p2) {
    return proxyImageController.proxy(request);
  }

  // 11. SSE orders
  if (p1 === "sse" && p2 === "orders") {
    return sseController.streamOrders(request);
  }

  return NextResponse.json({ success: false, error: "API Route not found" }, { status: 404 });
}

// ==========================================
// POST Dispatcher
// ==========================================
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug = [] } = await params;
  const [p1, p2, p3] = slug;

  // 1. Orders: POST /api/orders
  if (p1 === "orders" && !p2) {
    return orderController.post(request);
  }

  // 2. Products: POST /api/products
  if (p1 === "products" && !p2) {
    return productController.post(request);
  }

  // 3. Categories: POST /api/categories
  if (p1 === "categories" && !p2) {
    return categoryController.post(request);
  }

  // 4. SePay Webhook: POST /api/sepay
  if (p1 === "sepay" && !p2) {
    return sepayController.webhook(request);
  }

  // 5. Vouchers: POST /api/vouchers/apply
  if (p1 === "vouchers" && p2 === "apply") {
    return voucherController.apply(request);
  }

  // 6. Admin Auth: POST /api/admin/auth/login
  if (p1 === "admin" && p2 === "auth" && p3 === "login") {
    return authController.login(request);
  }

  // 7. Admin Auth: POST /api/admin/auth/logout
  if (p1 === "admin" && p2 === "auth" && p3 === "logout") {
    return authController.logout();
  }

  // 8. Admin: POST /api/admin/reset-banner
  if (p1 === "admin" && p2 === "reset-banner") {
    return adminController.resetBanner();
  }

  // 9. Upload: POST /api/upload
  if (p1 === "upload" && !p2) {
    return uploadController.upload(request);
  }

  // 10. Geocode: POST /api/geocode/estimate
  if (p1 === "geocode" && (p2 === "estimate" || p2 === "direction" || !p2)) {
    return geocodeController.estimate(request);
  }

  return NextResponse.json({ success: false, error: "API Route not found" }, { status: 404 });
}

// ==========================================
// PUT Dispatcher
// ==========================================
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { slug = [] } = await params;
  const [p1, p2] = slug;

  // 1. Products: PUT /api/products/:id
  if (p1 === "products" && p2) {
    return productController.put(request, p2);
  }

  // 2. Categories: PUT /api/categories
  if (p1 === "categories" && !p2) {
    return categoryController.put(request);
  }

  // 3. Settings: PUT /api/settings
  if (p1 === "settings" && !p2) {
    return settingController.put(request);
  }

  return NextResponse.json({ success: false, error: "API Route not found" }, { status: 404 });
}

// ==========================================
// PATCH Dispatcher
// ==========================================
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { slug = [] } = await params;
  const [p1, p2] = slug;

  // 1. Orders: PATCH /api/orders/:id
  if (p1 === "orders" && p2) {
    return orderController.patch(request, p2);
  }

  return NextResponse.json({ success: false, error: "API Route not found" }, { status: 404 });
}

// ==========================================
// DELETE Dispatcher
// ==========================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { slug = [] } = await params;
  const [p1, p2] = slug;

  // 1. Orders: DELETE /api/orders/cleanup or DELETE /api/orders/:id
  if (p1 === "orders" && p2 === "cleanup") {
    return orderController.cleanCancelled(request);
  }
  if (p1 === "orders" && p2) {
    return orderController.delete(request, p2);
  }

  // 2. Products: DELETE /api/products/:id
  if (p1 === "products" && p2) {
    return productController.delete(request, p2);
  }

  // 3. Categories: DELETE /api/categories
  if (p1 === "categories" && !p2) {
    return categoryController.delete(request);
  }

  return NextResponse.json({ success: false, error: "API Route not found" }, { status: 404 });
}
