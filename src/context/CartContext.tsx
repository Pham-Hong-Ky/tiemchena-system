"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ProductType } from "@/types";

export interface CartTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // product id
  cartItemId: string; // unique item id including specific topping combinations
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  quantity: number;
  selectedToppings: CartTopping[];
  note?: string;
}

export interface VoucherApplied {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
}

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: ProductType, quantity?: number, selectedToppings?: CartTopping[], note?: string) => void;
  updateCartItem: (
    cartItemId: string,
    updated: { quantity: number; selectedToppings: CartTopping[]; note?: string }
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemNote: (cartItemId: string, note: string) => void;
  clearCart: () => void;
  appliedVoucher: VoucherApplied | null;
  applyVoucher: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeVoucher: () => void;
  totalItemCount: number;
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherApplied | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved cart & voucher from localStorage after client hydration
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("tiemchena_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedVoucher = localStorage.getItem("tiemchena_voucher");
      if (savedVoucher) {
        setAppliedVoucher(JSON.parse(savedVoucher));
      }
    } catch (e) {
      console.warn("Could not load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage only after initial client hydration is complete
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("tiemchena_cart", JSON.stringify(cart));
      if (appliedVoucher) {
        localStorage.setItem("tiemchena_voucher", JSON.stringify(appliedVoucher));
      } else {
        localStorage.removeItem("tiemchena_voucher");
      }
    } catch (e) {
      console.warn("Could not save cart", e);
    }
  }, [cart, appliedVoucher, isLoaded]);

  const addToCart = (product: ProductType, quantity = 1, selectedToppings: CartTopping[] = [], note = "") => {
    const toppingIds = selectedToppings.map((t) => t.id).sort().join("-");
    const cartItemId = `${product.id}_${toppingIds}_${note.trim().toLowerCase()}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            cartItemId,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.image,
            quantity,
            selectedToppings,
            note: note.trim(),
          },
        ];
      }
    });

    setIsCartOpen(true);
  };

  const updateCartItem = (
    cartItemId: string,
    updated: { quantity: number; selectedToppings: CartTopping[]; note?: string }
  ) => {
    if (updated.quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart((prev) => {
      const index = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (index === -1) return prev;

      const currentItem = prev[index];
      const toppingIds = updated.selectedToppings.map((t) => t.id).sort().join("-");
      const newCartItemId = `${currentItem.id}_${toppingIds}_${(updated.note || "").trim().toLowerCase()}`;

      // If new ID matches another existing item in cart, merge quantities
      if (newCartItemId !== cartItemId) {
        const otherIndex = prev.findIndex((item, i) => i !== index && item.cartItemId === newCartItemId);
        if (otherIndex > -1) {
          const newCart = prev.filter((_, i) => i !== index);
          newCart[otherIndex].quantity += updated.quantity;
          return newCart;
        }
      }

      const newCart = [...prev];
      newCart[index] = {
        ...currentItem,
        cartItemId: newCartItemId,
        quantity: updated.quantity,
        selectedToppings: updated.selectedToppings,
        note: (updated.note || "").trim(),
      };
      return newCart;
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
    );
  };

  const updateItemNote = (cartItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, note } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedVoucher(null);
  };

  // Calculations
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce((sum, item) => {
    const toppingSum = item.selectedToppings.reduce((tsum, t) => tsum + t.price, 0);
    return sum + (item.price + toppingSum) * item.quantity;
  }, 0);

  const applyVoucher = async (code: string) => {
    if (!code.trim()) return { success: false, message: "Vui lòng nhập mã" };
    try {
      const res = await fetch("/api/vouchers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), totalAmount: subtotal }),
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, message: data.error };
      }
      setAppliedVoucher(data.data);
      return { success: true };
    } catch {
      return { success: false, message: "Lỗi kết nối máy chủ" };
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  // Calculate discount
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === "PERCENT") {
      discountAmount = (subtotal * appliedVoucher.discountValue) / 100;
    } else {
      discountAmount = appliedVoucher.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateCartItem,
        removeFromCart,
        updateQuantity,
        updateItemNote,
        clearCart,
        appliedVoucher,
        applyVoucher,
        removeVoucher,
        totalItemCount,
        subtotal,
        discountAmount,
        finalTotal,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
