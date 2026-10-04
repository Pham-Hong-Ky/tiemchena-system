"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Trash2,
  Plus,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useCart, CartItem } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { ButtonFestiveDecorator } from "@/components/theme/ButtonFestiveDecorator";
import { createOrder, ApiError } from "@/lib/api";
import {
  validatePhoneNumber,
  validateCustomerName,
  validateCustomerAddress,
  validateOpeningHours,
} from "@/lib/orderValidation";
import { isRunningInZalo, openZaloShopChat } from "@/lib/zaloMiniApp";
import { resolveProductOptions, buildZaloOrderMessage } from "@/lib/cartHelpers";
import { SHOP_ENV } from "@/config/shopEnv";
import { CartDrawerItem } from "./cart/CartDrawerItem";
import { CartDeliveryForm } from "./cart/CartDeliveryForm";
import { VietQrPaymentModal } from "./cart/VietQrPaymentModal";
import { OrderType, ProductType, ToppingType } from "@/types";
import { toast } from "@/context/ToastContext";

interface CartDrawerProps {
  onOrderSuccess: (order: OrderType) => void;
  onEditItem?: (item: CartItem) => void;
  products?: ProductType[];
  toppingsList?: ToppingType[];
}

export function CartDrawer({
  onOrderSuccess,
  products = [],
  toppingsList = [],
}: CartDrawerProps) {
  const router = useRouter();
  const { config } = useTheme();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    updateItemNote,
    updateCartItem,
    clearCart,
    subtotal,
  } = useCart();

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [note, setNote] = useState("");
  const [websiteHp, setWebsiteHp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VIETQR">("COD");

  // Geocode, Distance & Shipping Fee State
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isOutOfRange, setIsOutOfRange] = useState<boolean>(false);
  const [rangeError, setRangeError] = useState<string>("");
  const [distanceSource, setDistanceSource] = useState<"ward" | "pin" | "gps">("ward");

  // Flow & UI states
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [showQrPaymentModal, setShowQrPaymentModal] = useState(false);
  const [currentQrOrder, setCurrentQrOrder] = useState<OrderType | null>(null);
  const [inZaloApp, setInZaloApp] = useState(false);
  const [expandedItemIdx, setExpandedItemIdx] = useState<number | null>(null);

  // Bank & Contact Info from ENV (100% dynamic, không hardcode fallback)
  const bankId = SHOP_ENV.bankId;
  const accountNumber = SHOP_ENV.accountNumber;
  const accountName = SHOP_ENV.accountName;
  const zaloPhone = SHOP_ENV.zaloPhone;

  useEffect(() => {
    setInZaloApp(isRunningInZalo());
  }, []);

  // Tính tổng tiền bao gồm phí ship
  const totalWithShipping = subtotal + shippingFee;

  // Kiểm tra các món trong giỏ hàng có món nào bị hết hàng không
  const outOfStockCartItems = useMemo(() => {
    return cart.filter((item) => {
      const p = products.find((prod) => prod.id === item.id);
      return p && p.isAvailable === false;
    });
  }, [cart, products]);

  // Kiểm tra giờ mở cửa của quán (09:00 - 22:00)
  const storeHours = validateOpeningHours();

  // Validate form
  const validateForm = (): boolean => {
    setFormError("");

    if (!storeHours.isOpen) {
      const msg = storeHours.error || "Quán chỉ nhận đơn đặt hàng từ 09:00 đến 22:00 hàng ngày.";
      setFormError(msg);
      toast.error(msg);
      return false;
    }

    if (outOfStockCartItems.length > 0) {
      const names = outOfStockCartItems.map((i) => i.name).join(", ");
      const msg = `Món "${names}" hiện đã hết hàng. Quý khách vui lòng xóa món khỏi giỏ để tiếp tục!`;
      setFormError(msg);
      toast.error(msg);
      return false;
    }

    if (isOutOfRange) {
      const msg = rangeError || "Địa chỉ nhận hàng cách quán quá xa (> 15 km), quán chưa thể nhận đơn này.";
      setFormError(msg);
      toast.error(msg);
      return false;
    }

    const nameCheck = validateCustomerName(customerName);
    if (!nameCheck.valid) {
      const msg = nameCheck.error || "Vui lòng nhập Họ và Tên người nhận";
      setFormError(msg);
      toast.warning(msg);
      return false;
    }

    const phoneCheck = validatePhoneNumber(customerPhone);
    if (!phoneCheck.valid) {
      const msg = phoneCheck.error || "Vui lòng nhập số điện thoại hợp lệ";
      setFormError(msg);
      toast.warning(msg);
      return false;
    }

    const addressCheck = validateCustomerAddress(customerAddress);
    if (!addressCheck.valid) {
      const msg = addressCheck.error || "Vui lòng nhập địa chỉ giao hàng cụ thể";
      setFormError(msg);
      toast.warning(msg);
      return false;
    }

    if (distanceKm === null) {
      const msg = "Địa chỉ chưa được xác định khoảng cách hoặc không hợp lệ. Vui lòng bấm 'Kiểm tra khoảng cách' hoặc chọn từ danh sách gợi ý.";
      setFormError(msg);
      toast.warning(msg);
      return false;
    }

    return true;
  };

  // Xử lý chốt đơn (COD Tiền Mặt hoặc SePay VietQR Tự Động)
  const handleProceedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError("");

    // LUỒNG 1: QUÉT MÃ VIETQR (SEPAY TỰ ĐỘNG DUYỆT 24/7)
    if (paymentMethod === "VIETQR") {
      try {
        const order = await createOrder({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          note: note.trim(),
          paymentMethod: "VIETQR",
          items: cart,
          website_hp: websiteHp,
          shippingFee,
          distanceKm,
          distanceSource,
        });

        setCurrentQrOrder(order);
        clearCart();
        setIsCartOpen(false);
        setShowQrPaymentModal(true);
      } catch (err: any) {
        const msg = err instanceof ApiError ? err.message : err.message || "Lỗi tạo đơn hàng VietQR, vui lòng thử lại";
        setFormError(msg);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // LUỒNG 2: CHỐT ĐƠN TIỀN MẶT TRỰC TIẾP (COD)
    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        note: note.trim(),
        paymentMethod: "COD",
        items: cart,
        website_hp: websiteHp,
        shippingFee,
        distanceKm,
        distanceSource,
      });

      clearCart();
      setIsCartOpen(false);
      onOrderSuccess(order);
      toast.success("Đặt hàng thành công! Quán đã tiếp nhận đơn của bạn.");
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err.message || "Lỗi tạo đơn hàng, vui lòng thử lại";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToMenu = () => {
    setIsCartOpen(false);
    const menuElem = document.getElementById("menu");
    if (menuElem) {
      menuElem.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#menu");
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl ${config.colors.tagColor} flex items-center justify-center font-bold`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 text-lg">Giỏ Hàng Của Bạn</h2>
                {inZaloApp && (
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Mini Zalo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{cart.length} món ăn đã chọn</p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer"
            title="Đóng giỏ hàng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-400">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Giỏ hàng đang trống</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Hãy lựa chọn các món ăn vặt nóng sốt và chè thanh mát từ thực đơn Tiệm Chè Na nhé!
              </p>
              <button
                type="button"
                onClick={handleGoToMenu}
                className={`mt-6 inline-flex items-center gap-1.5 ${config.colors.primaryBtn} py-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer shadow-md active:scale-95 transition`}
              >
                <ButtonFestiveDecorator />
                <UtensilsCrossed className="w-4 h-4" />
                <span>Xem Thực Đơn Ngay</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleProceedOrder} noValidate className="space-y-6">
              {/* 1. Món Đã Chọn */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                  <span>Món Đã Chọn ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                  {!showClearCartConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowClearCartConfirm(true)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer lowercase font-normal transition"
                    >
                      <Trash2 className="w-3 h-3" /> xóa tất cả
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                      <span className="text-[11px] text-red-700 font-bold lowercase">Xóa hết?</span>
                      <button
                        type="button"
                        onClick={() => {
                          clearCart();
                          setShowClearCartConfirm(false);
                        }}
                        className="text-[11px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded hover:bg-red-700 cursor-pointer"
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearCartConfirm(false)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>

                {!storeHours.isOpen && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-black text-amber-800">
                      <span>⏰</span>
                      <span>QUÁN ĐANG ĐÓNG CỬA (Mở: 09:00 - 22:00)</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Giờ Việt Nam hiện tại: <strong>{storeHours.currentVnTime}</strong>. Quý khách vui lòng quay lại đặt hàng trong khung giờ mở cửa (09:00 - 22:00) nhé!
                    </p>
                  </div>
                )}

                {outOfStockCartItems.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-start gap-2">
                    <span className="text-base leading-none">⚠️</span>
                    <span>
                      Có món trong giỏ hàng hiện đã <strong>hết hàng</strong>. Vui lòng xóa món đó để tiếp tục đặt hàng!
                    </span>
                  </div>
                )}

                <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-2xl p-2 border border-slate-100">
                  {cart.map((item, idx) => (
                    <CartDrawerItem
                      key={item.cartItemId}
                      item={item}
                      index={idx}
                      isExpanded={expandedItemIdx === idx}
                      isOutOfStock={products.find((p) => p.id === item.id)?.isAvailable === false}
                      availableOptions={resolveProductOptions(
                        products.find((p) => p.id === item.id),
                        toppingsList,
                        item.selectedToppings
                      )}
                      onToggleExpand={() => setExpandedItemIdx(expandedItemIdx === idx ? null : idx)}
                      onUpdateQuantity={(q) => updateQuantity(item.cartItemId, q)}
                      onRemove={() => removeFromCart(item.cartItemId)}
                      onToggleTopping={(opt) => {
                        const isSelected = item.selectedToppings.some((t) => t.id === opt.id);
                        const newToppings = isSelected
                          ? item.selectedToppings.filter((t) => t.id !== opt.id)
                          : [...item.selectedToppings, { id: opt.id, name: opt.name, price: opt.price }];

                        updateCartItem(item.cartItemId, {
                          quantity: item.quantity,
                          selectedToppings: newToppings,
                          note: item.note,
                        });
                      }}
                      onUpdateNote={(n) => updateItemNote(item.cartItemId, n)}
                    />
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleGoToMenu}
                    className={`inline-flex items-center gap-1 text-xs font-bold ${config.colors.accentText} hover:underline cursor-pointer`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Chọn thêm món khác từ thực đơn
                  </button>
                </div>
              </div>

              {/* 2. Customer Info Form (Có GPS & Tự động tính khoảng cách) */}
              <CartDeliveryForm
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerAddress={customerAddress}
                setCustomerAddress={setCustomerAddress}
                note={note}
                setNote={setNote}
                websiteHp={websiteHp}
                setWebsiteHp={setWebsiteHp}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                formError={formError}
                inZaloApp={inZaloApp}
                distanceKm={distanceKm}
                setDistanceKm={setDistanceKm}
                shippingFee={shippingFee}
                setShippingFee={setShippingFee}
                isOutOfRange={isOutOfRange}
                setIsOutOfRange={setIsOutOfRange}
                rangeError={rangeError}
                setRangeError={setRangeError}
                distanceSource={distanceSource}
                setDistanceSource={setDistanceSource}
              />

              {/* 3. Footer / Submit CTA */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} món):</span>
                  <span className="font-semibold text-slate-800">{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Phí giao hàng:</span>
                  <span className="font-semibold text-slate-800">
                    {shippingFee > 0
                      ? `${shippingFee.toLocaleString("vi-VN")}đ`
                      : distanceKm !== null
                      ? "Miễn phí"
                      : "Chưa tính"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 border-t border-slate-100 pt-2">
                  <span>Tổng cộng thanh toán:</span>
                  <span className="text-lg text-orange-600 font-black">{totalWithShipping.toLocaleString("vi-VN")}đ</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isOutOfRange || !storeHours.isOpen}
                  className={`w-full ${
                    !storeHours.isOpen
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : isOutOfRange
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : paymentMethod === "COD"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 text-white"
                      : "bg-orange-600 hover:bg-orange-700 shadow-orange-600/25 text-white"
                  } font-extrabold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition cursor-pointer disabled:opacity-60 active:scale-[0.99]`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý đơn...</span>
                    </>
                  ) : !storeHours.isOpen ? (
                    <span>QUÁN ĐANG ĐÓNG CỬA (MỞ: 09:00 - 22:00)</span>
                  ) : isOutOfRange ? (
                    <span>ĐỊA CHỈ QUÁ XA (&gt; 15KM) - KHÔNG THỂ ĐẶT</span>
                  ) : paymentMethod === "COD" ? (
                    <>
                      <span>ĐẶT HÀNG (TIỀN MẶT KHI NHẬN)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>QUÉT MÃ VIETQR ĐẶT HÀNG</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* VietQR Payment Modal (SePay Tự Động 24/7) */}
      <VietQrPaymentModal
        isOpen={showQrPaymentModal}
        onClose={() => {
          setShowQrPaymentModal(false);
          if (currentQrOrder) {
            onOrderSuccess(currentQrOrder);
          }
        }}
        order={currentQrOrder}
        bankId={bankId}
        accountName={accountName}
        accountNumber={accountNumber}
        onPaymentSuccess={(paidOrder) => {
          setShowQrPaymentModal(false);
          onOrderSuccess(paidOrder);
        }}
      />
    </>
  );
}
