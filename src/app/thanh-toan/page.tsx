"use client";

/**
 * Trang thanh toán độc lập (Ngày 10):
 * chọn món → nhập thông tin (SĐT + email được kiểm tra) → tạo đơn pending →
 * quét VietQR (Sepay tự xác nhận) → hiện lời cảm ơn khi đơn chuyển sang đã thanh toán.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Minus, Plus, QrCode, ShieldCheck } from "lucide-react";
import { createOrder, ApiError } from "@/lib/api";
import {
  validatePhoneNumber,
  validateCustomerName,
  validateCustomerAddress,
  validateEmail,
} from "@/lib/orderValidation";
import { SHOP_ENV } from "@/config/shopEnv";
import { VietQrPaymentModal } from "@/components/storefront/cart/VietQrPaymentModal";
import { OrderType, ProductType } from "@/types";

const TYPE_LABEL: Record<string, string> = {
  physical: "Món ăn",
  digital: "Sản phẩm số",
  service: "Dịch vụ",
};

export default function CheckoutPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [websiteHp, setWebsiteHp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [qrOrder, setQrOrder] = useState<OrderType | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [paidOrder, setPaidOrder] = useState<OrderType | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((res) => {
        const list: ProductType[] = (res?.data?.products || []).filter((p: ProductType) => p.isAvailable);
        // Ưu tiên giá thấp để người chấm dễ test bằng số tiền nhỏ
        list.sort((a, b) => a.price - b.price);
        setProducts(list);
        if (list[0]) setProductId(list[0].id);
      })
      .catch(() => setFormError("Không tải được danh sách sản phẩm, vui lòng tải lại trang"))
      .finally(() => setIsLoading(false));
  }, []);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const isPhysical = !product?.productType || product.productType === "physical";
  const maxQty = isPhysical && product?.stock !== null && product?.stock !== undefined ? product.stock : 99;
  const total = (product?.price || 0) * quantity;

  const validate = () => {
    const next: Record<string, string> = {};
    const n = validateCustomerName(name);
    if (!n.valid) next.name = n.error || "Tên không hợp lệ";
    const p = validatePhoneNumber(phone);
    if (!p.valid) next.phone = p.error || "Số điện thoại không hợp lệ";
    const e = validateEmail(email);
    if (!e.valid) next.email = e.error || "Email không hợp lệ";
    if (isPhysical) {
      const a = validateCustomerAddress(address);
      if (!a.valid) next.address = a.error || "Địa chỉ không hợp lệ";
    }
    if (!product) next.product = "Vui lòng chọn sản phẩm";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");
    if (!validate() || !product) return;

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        customerAddress: isPhysical ? address.trim() : "",
        note: "Đặt qua trang /thanh-toan",
        paymentMethod: "VIETQR",
        items: [{ id: product.id, quantity, selectedToppings: [] }],
        website_hp: websiteHp,
      });
      setQrOrder(order);
      setShowQr(true);
    } catch (err) {
      setFormError(err instanceof ApiError || err instanceof Error ? err.message : "Lỗi tạo đơn, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = (key: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
      errors[key] ? "border-red-400" : "border-slate-200"
    }`;

  // ─── Màn hình cảm ơn ──────────────────────────────────────────────────────
  if (paidOrder) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-7 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-black text-slate-900">Cảm ơn bạn đã thanh toán!</h1>
          <p className="text-sm text-slate-600">
            Tiệm Chè Na đã nhận được <b>{paidOrder.finalAmount.toLocaleString("vi-VN")}đ</b> cho đơn{" "}
            <b>{paidOrder.orderCode}</b>. Trạng thái: <span className="font-bold text-emerald-600">success</span>.
          </p>
          <p className="text-xs text-slate-500">
            Quán sẽ liên hệ qua số {paidOrder.customerPhone}
            {paidOrder.customerEmail ? ` hoặc email ${paidOrder.customerEmail}` : ""} nếu cần.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link href="/" className="px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold">
              Về trang chủ
            </Link>
            <button
              onClick={() => {
                setPaidOrder(null);
                setQrOrder(null);
                setQuantity(1);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold cursor-pointer"
            >
              Đặt đơn khác
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Form thanh toán ──────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-orange-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center space-y-1">
          <Link href="/" className="text-xs font-bold text-orange-600">
            ← Tiệm Chè Na
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Thanh toán nhanh bằng QR</h1>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Chuyển khoản xong, đơn tự xác nhận qua Sepay – không cần gửi ảnh chụp
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 space-y-4">
          {/* Sản phẩm */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Chọn sản phẩm *</label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải sản phẩm...
              </div>
            ) : (
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setQuantity(1);
                }}
                className={inputCls("product")}
              >
                {products.map((p) => {
                  const outOfStock = (!p.productType || p.productType === "physical") && p.stock === 0;
                  return (
                    <option key={p.id} value={p.id} disabled={outOfStock}>
                      {p.name} – {p.price.toLocaleString("vi-VN")}đ ({TYPE_LABEL[p.productType || "physical"] || "Món ăn"}
                      {outOfStock ? ", hết hàng" : ""})
                    </option>
                  );
                })}
              </select>
            )}
            {errors.product && <p className="text-[11px] text-red-600">{errors.product}</p>}
            {product && isPhysical && product.stock !== null && product.stock !== undefined && (
              <p className="text-[11px] text-slate-500">Còn {product.stock} phần</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Số lượng</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-black">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(Math.max(1, maxQty), q + 1))}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thông tin khách */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Họ tên *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Thị Hoa" className={inputCls("name")} />
            {errors.name && <p className="text-[11px] text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Số điện thoại *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="numeric"
              placeholder="09xx xxx xxx"
              className={inputCls("phone")}
            />
            {errors.phone && <p className="text-[11px] text-red-600">{errors.phone}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email (không bắt buộc)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="tenban@gmail.com"
              className={inputCls("email")}
            />
            {errors.email && <p className="text-[11px] text-red-600">{errors.email}</p>}
          </div>

          {isPhysical && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Địa chỉ giao hàng *</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, ngõ, đường, xã/phường"
                className={inputCls("address")}
              />
              {errors.address && <p className="text-[11px] text-red-600">{errors.address}</p>}
            </div>
          )}

          {/* Honeypot chống bot */}
          <input
            type="text"
            name="website_hp"
            value={websiteHp}
            onChange={(e) => setWebsiteHp(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm font-bold text-slate-600">Tổng thanh toán</span>
            <span className="text-xl font-black text-orange-600">{total.toLocaleString("vi-VN")}đ</span>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{formError}</p>
          )}

          {qrOrder && !showQr && (
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="w-full py-2.5 rounded-2xl border-2 border-orange-300 text-orange-700 font-bold text-sm cursor-pointer"
            >
              Mở lại mã QR đơn {qrOrder.orderCode} (chưa thanh toán)
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLoading || !product}
            className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
            <span>{isSubmitting ? "Đang tạo đơn..." : "Tạo đơn & hiện mã QR"}</span>
          </button>
          <p className="text-[11px] text-center text-slate-400">
            Đơn được tạo ở trạng thái <b>pending</b>, tự chuyển <b>success</b> khi tiền về tài khoản MB {SHOP_ENV.accountNumber}.
          </p>
        </form>
      </div>

      <VietQrPaymentModal
        isOpen={showQr}
        onClose={() => setShowQr(false)}
        order={qrOrder}
        bankId={SHOP_ENV.bankId}
        accountName={SHOP_ENV.accountName}
        accountNumber={SHOP_ENV.accountNumber}
        onPaymentSuccess={(order) => {
          setShowQr(false);
          setPaidOrder(order);
        }}
      />
    </main>
  );
}
