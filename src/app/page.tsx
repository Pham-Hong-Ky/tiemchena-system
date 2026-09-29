"use client";

import React, { useState, useEffect } from "react";
import { CartProvider, CartItem } from "@/context/CartContext";
import { Header } from "@/components/storefront/Header";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { SignatureDishes } from "@/components/storefront/SignatureDishes";
import { MenuSection } from "@/components/storefront/MenuSection";
import { ProductCustomizeModal } from "@/components/storefront/ProductCustomizeModal";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { OrderSuccessModal } from "@/components/storefront/OrderSuccessModal";
import { OrderTrackingModal } from "@/components/storefront/OrderTrackingModal";
import { TrustSection } from "@/components/storefront/TrustSection";
import { Footer } from "@/components/storefront/Footer";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { ProductType, CategoryType, ToppingType, OrderType } from "@/types";

export default function Home() {
  const { config } = useTheme();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [toppings, setToppings] = useState<ToppingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [customizingProduct, setCustomizingProduct] = useState<ProductType | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderType | null>(null);
  const [trackingOrderCode, setTrackingOrderCode] = useState<string | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.success) {
          setProducts(prodData.data.products);
          setToppings(prodData.data.toppings);
        }
        if (catData.success) {
          setCategories(catData.data);
        }
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSelectHeroTag = (keyword: string) => {
    setSearchQuery(keyword);
    const menuElem = document.getElementById("menu");
    if (menuElem) {
      menuElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenTracking = (orderCode?: string) => {
    if (orderCode) {
      setTrackingOrderCode(orderCode);
    }
    setIsTrackingModalOpen(true);
  };

  const handleEditCartItem = (cartItem: CartItem) => {
    const matchedProduct = products.find((p) => p.id === cartItem.id) || {
      id: cartItem.id,
      name: cartItem.name,
      slug: cartItem.slug,
      price: cartItem.price,
      image: cartItem.image,
      isHot: false,
      isBestseller: false,
      isAvailable: true,
      categoryId: "",
    };

    setEditingCartItem(cartItem);
    setCustomizingProduct(matchedProduct);
  };

  return (
    <CartProvider>
      <div
        className="min-h-screen flex flex-col transition-colors duration-500"
        style={{ backgroundColor: config.colors.sectionBg }}
      >
        {/* Header */}
        <Header onOpenTracking={() => handleOpenTracking()} />

        {/* Main Content */}
        <main className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-orange-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-500">Đang tải thực đơn Tiệm Chè Na...</p>
            </div>
          ) : (
            <>
              {/* Hero Banner */}
              <HeroBanner products={products} onSelectTag={handleSelectHeroTag} />

              {/* 2 Signature Bestseller Dishes */}
              <SignatureDishes
                products={products}
                onOpenCustomize={(p) => {
                  setEditingCartItem(null);
                  setCustomizingProduct(p);
                }}
              />

              {/* Main Full Menu */}
              <MenuSection
                categories={categories}
                products={products}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onOpenCustomize={(p) => {
                  setEditingCartItem(null);
                  setCustomizingProduct(p);
                }}
              />

              {/* Trust & Guarantees */}
              <TrustSection />
            </>
          )}
        </main>

        {/* Footer */}
        <Footer />

        {/* Modals & Slide-overs */}
        <ProductCustomizeModal
          product={customizingProduct}
          editingCartItem={editingCartItem}
          toppingsList={toppings}
          onClose={() => {
            setCustomizingProduct(null);
            setEditingCartItem(null);
          }}
        />

        <CartDrawer
          onEditItem={handleEditCartItem}
          onOrderSuccess={(order) => {
            setSuccessOrder(order);
          }}
        />

        <OrderSuccessModal
          order={successOrder}
          onClose={() => setSuccessOrder(null)}
          onTrackOrder={(code) => handleOpenTracking(code)}
        />

        {isTrackingModalOpen && (
          <OrderTrackingModal
            initialOrderCode={trackingOrderCode || ""}
            onClose={() => {
              setIsTrackingModalOpen(false);
              setTrackingOrderCode(null);
            }}
          />
        )}
      </div>
    </CartProvider>
  );
}
