"use client";

import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  QrCode,
  Send,
  ArrowRight,
  Loader2,
  AlertCircle,
  MapPin,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Pencil,
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
} from "@/lib/orderValidation";
import { OrderType } from "@/types";

interface CartDrawerProps {
  onOrderSuccess: (order: OrderType) => void;
  onEditItem: (item: CartItem) => void;
}

export function CartDrawer({ onOrderSuccess, onEditItem }: CartDrawerProps) {
  const { config, theme } = useTheme();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    finalTotal,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [note, setNote] = useState("");
  const [websiteHp, setWebsiteHp] = useState(""); // Honeypot trap
  const [paymentMethod, setPaymentMethod] = useState<"ZALO" | "VIETQR">("ZALO");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // Điều hướng mượt mà đến phần thực đơn (#menu) và đóng giỏ hàng
  const handleGoToMenu = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsCartOpen(false);
    setTimeout(() => {
      const menuSection = document.getElementById("menu");
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/#menu";
      }
    }, 120);
  };

  if (!isCartOpen) return null;

  // ─── Lấy vị trí GPS & Reverse Geocoding ──────────────────────────────
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Trình duyệt của bạn không hỗ trợ chức năng định vị GPS.");
      return;
    }

    setIsLocating(true);
    setFormError("");
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();

          if (data.success && data.data?.address) {
            setCustomerAddress(data.data.address);
            setLocationSuccess(true);
            setTimeout(() => setLocationSuccess(false), 4000);
          } else {
            setFormError(data.error || "Không thể tự động nhận diện địa chỉ từ GPS.");
          }
        } catch {
          setFormError("Lỗi kết nối khi lấy địa chỉ định vị. Vui lòng nhập tay địa chỉ.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setFormError("Bạn đã từ chối cấp quyền vị trí. Vui lòng cho phép trên trình duyệt hoặc nhập địa chỉ thủ công.");
        } else if (error.code === error.TIMEOUT) {
          setFormError("Quá thời gian tìm vị trí GPS. Vui lòng thử lại hoặc nhập tay địa chỉ.");
        } else {
          setFormError("Không thể xác định vị trí hiện tại. Vui lòng nhập tay địa chỉ giao hàng.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // ─── Xử lý Gửi Đơn Hàng ──────────────────────────────────────────────
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (cart.length === 0) {
      setFormError("Giỏ hàng của bạn đang trống");
      return;
    }

    // 1. Client Validate Name
    const nameCheck = validateCustomerName(customerName);
    if (!nameCheck.valid) {
      setFormError(nameCheck.error || "Tên người nhận không hợp lệ");
      return;
    }

    // 2. Client Validate Phone
    const phoneCheck = validatePhoneNumber(customerPhone);
    if (!phoneCheck.valid) {
      setFormError(phoneCheck.error || "Số điện thoại không hợp lệ");
      return;
    }

    // 3. Client Validate Address
    const addressCheck = validateCustomerAddress(customerAddress);
    if (!addressCheck.valid) {
      setFormError(addressCheck.error || "Địa chỉ giao hàng không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        note: note.trim(),
        paymentMethod,
        items: cart,
        website_hp: websiteHp, // honeypot
      });

      // Mở Zalo với nội dung soạn sẵn chi tiết nếu chọn chốt đơn qua Zalo
      if (paymentMethod === "ZALO") {
        const itemsSummary = cart
          .map((item, idx) => {
            const toppingTxt = item.selectedToppings?.length
              ? ` (+ ${item.selectedToppings.map((t) => t.name).join(", ")})`
              : "";
            const itemTotal = (item.price + item.selectedToppings.reduce((s, t) => s + t.price, 0)) * item.quantity;
            return `${idx + 1}. ${item.quantity}x ${item.name}${toppingTxt} = ${itemTotal.toLocaleString("vi-VN")}đ`;
          })
          .join("\n");

        const message =
          `🍧 [ĐƠN HÀNG TIỆM CHÈ NA]\n` +
          `Mã đơn: #${order.orderCode}\n` +
          `Khách hàng: ${customerName.trim()}\n` +
          `Số điện thoại: ${customerPhone.trim()}\n` +
          `Địa chỉ nhận: ${customerAddress.trim()}\n\n` +
          `📋 DANH SÁCH MÓN:\n${itemsSummary}\n\n` +
          `💵 TỔNG THANH TOÁN: ${finalTotal.toLocaleString("vi-VN")}đ\n` +
          `📝 Ghi chú: ${note.trim() || "Không có"}\n\n` +
          `Quán kiểm tra và xác nhận đơn giúp mình nhé!`;

        window.open(`https://zalo.me/0986479285?text=${encodeURIComponent(message)}`, "_blank");
      }

      clearCart();
      setIsCartOpen(false);
      onOrderSuccess(order);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Lỗi tạo đơn hàng, vui lòng thử lại"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Payment method options config ─────────────────────────────────────────
  const paymentOptions = [
    {
      method: "ZALO" as const,
      label: "Chốt Đơn Qua Zalo",
      sublabel: "Xác nhận 1-1, chống đơn ảo 100%",
      badge: "Khuyên Dùng ⭐",
      icon: MessageCircle,
      activeClass: "border-blue-500 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-500/30",
    },
    {
      method: "VIETQR" as const,
      label: "Quét Mã VietQR",
      sublabel: "Chuyển khoản tức thì",
      badge: "Tự Động 24/7",
      icon: QrCode,
      activeClass: "border-orange-500 bg-orange-50 text-orange-950 font-bold ring-2 ring-orange-500/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl ${config.colors.tagColor} flex items-center justify-center font-bold`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">Giỏ Hàng Của Bạn</h2>
              <p className="text-xs text-slate-500">{cart.length} món ăn đã chọn</p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer"
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
            <>
              {/* Item List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                  <span>Món Đã Chọn</span>
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:underline flex items-center gap-1 cursor-pointer lowercase font-normal"
                  >
                    <Trash2 className="w-3 h-3" /> xóa tất cả
                  </button>
                </div>

                <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-2xl p-2 border border-slate-100">
                  {cart.map((item) => {
                    const toppingTotal = item.selectedToppings.reduce((s, t) => s + t.price, 0);
                    const itemUnitTotal = item.price + toppingTotal;
                    const lineTotal = itemUnitTotal * item.quantity;

                    return (
                      <div key={item.cartItemId} className="py-3 px-2 flex items-start gap-3">
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80"
                          }
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                          <p className="text-xs font-extrabold text-orange-600">
                            {itemUnitTotal.toLocaleString("vi-VN")}đ
                          </p>

                          {item.selectedToppings.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              + {item.selectedToppings.map((t) => t.name).join(", ")}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-[11px] text-amber-700 italic mt-0.5">Note: {item.note}</p>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-md transition cursor-pointer mt-1"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Sửa tùy chọn & ghi chú</span>
                          </button>

                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                              <button
                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-xs font-bold text-slate-700 ml-auto">
                              {lineTotal.toLocaleString("vi-VN")}đ
                            </span>
                            <button
                              onClick={() => removeFromCart(item.cartItemId)}
                              className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

              {/* Customer Info Form */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Thông Tin Giao Hàng
                  </h4>
                  <span className="text-[11px] text-slate-400 italic">* Bắt buộc điền</span>
                </div>

                <div className="space-y-2.5">
                  {/* Tên người nhận */}
                  <div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formError) setFormError("");
                      }}
                      placeholder="Họ và tên người nhận *"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (formError) setFormError("");
                      }}
                      placeholder="Số điện thoại nhận hàng (10 số, VD: 0986...) *"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Địa chỉ giao hàng + Nút lấy vị trí hiện tại */}
                  <div className="space-y-1.5">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => {
                          setCustomerAddress(e.target.value);
                          if (formError) setFormError("");
                        }}
                        placeholder="Địa chỉ giao hàng (Số nhà, ngõ/đường, phường/xã...) *"
                        className="w-full pl-3.5 pr-28 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        title="Tự động lấy vị trí hiện tại của bạn"
                        className="absolute right-1.5 px-2.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold text-[11px] rounded-lg flex items-center gap-1 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLocating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-orange-600" />
                            <span>Đang định vị...</span>
                          </>
                        ) : locationSuccess ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Đã lấy vị trí</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 text-orange-600" />
                            <span>Lấy vị trí</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú thêm cho quán (VD: Ít ngọt, giao trước 18h...)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Honeypot Trap Field */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-9999px",
                      top: "-9999px",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                    aria-hidden="true"
                  >
                    <label htmlFor="website_hp">Leave this blank</label>
                    <input
                      id="website_hp"
                      type="text"
                      name="website_hp"
                      tabIndex={-1}
                      autoComplete="off"
                      value={websiteHp}
                      onChange={(e) => setWebsiteHp(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Hình thức đặt hàng */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hình Thức Chốt Đơn
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> An toàn 100%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {paymentOptions.map(({ method, label, sublabel, badge, icon: Icon, activeClass }) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 cursor-pointer relative ${
                        paymentMethod === method
                          ? activeClass
                          : "border-slate-200 hover:bg-slate-50 text-slate-700 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            method === "ZALO"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            method === "ZALO"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {badge}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 leading-tight">{label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{sublabel}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-blue-800">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    {paymentMethod === "ZALO"
                      ? "Khi bấm gửi đơn, thông tin giỏ hàng sẽ tự động chuyển sang Zalo của quán để xác nhận tức thì và hỗ trợ giao nhanh."
                      : "Quét mã VietQR trên app ngân hàng chuyển khoản tự động, không cần chờ xác nhận."}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer: Summary & CTA */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} món):</span>
                <span className="font-semibold text-slate-800">{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Tổng thanh toán:</span>
                <span className={`${config.colors.accentText} text-lg sm:text-xl font-black`}>
                  {finalTotal.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className={`w-full text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative ${
                paymentMethod === "ZALO"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25"
                  : config.colors.primaryBtn
              }`}
            >
              {paymentMethod !== "ZALO" && <ButtonFestiveDecorator />}
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tạo đơn hàng...</span>
                </>
              ) : paymentMethod === "ZALO" ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>GỬI & CHỐT ĐƠN QUA ZALO</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>XÁC NHẬN & QUÉT MÃ VIETQR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
