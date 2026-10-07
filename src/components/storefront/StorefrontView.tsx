"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CartProvider, CartItem } from "@/context/CartContext";
import { Header } from "@/components/storefront/Header";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { SignatureDishes } from "@/components/storefront/SignatureDishes";
import { ExclusiveSetsSection } from "@/components/storefront/ExclusiveSetsSection";
import { FullMenuGallerySection } from "@/components/storefront/FullMenuGallerySection";
import { MenuSection } from "@/components/storefront/MenuSection";
import { ProductCustomizeModal } from "@/components/storefront/ProductCustomizeModal";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { OrderSuccessModal } from "@/components/storefront/OrderSuccessModal";
import { OrderTrackingModal } from "@/components/storefront/OrderTrackingModal";
import { TrustSection } from "@/components/storefront/TrustSection";
import { Footer } from "@/components/storefront/Footer";
import { ChatWidget } from "@/components/storefront/ChatWidget";
import { Loader2, RefreshCw } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { ProductType, CategoryType, ToppingType, OrderType } from "@/types";

interface StorefrontViewProps {
  initialProducts?: ProductType[];
  initialCategories?: CategoryType[];
  initialToppings?: ToppingType[];
}

export function StorefrontView({
  initialProducts = [],
  initialCategories = [],
  initialToppings = [],
}: StorefrontViewProps) {
  const { config } = useTheme();

  const hasInitialData = initialProducts.length > 0;
  const [products, setProducts] = useState<ProductType[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryType[]>(initialCategories);
  const [toppings, setToppings] = useState<ToppingType[]>(initialToppings);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [loadError, setLoadError] = useState(false);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [customizingProduct, setCustomizingProduct] = useState<ProductType | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderType | null>(null);
  const [trackingOrderCode, setTrackingOrderCode] = useState<string | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const fetchCatalogData = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout to prevent hanging

    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products", { signal: controller.signal }),
        fetch("/api/categories", { signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success && prodData.data?.products) {
        setProducts(prodData.data.products);
        setToppings(prodData.data.toppings || []);
      }
      if (catData.success && catData.data) {
        setCategories(catData.data);
      }

      if (prodData.success && catData.success) {
        try {
          localStorage.setItem(
            "tiemchena_catalog_cache",
            JSON.stringify({
              products: prodData.data.products,
              toppings: prodData.data.toppings || [],
              categories: catData.data,
              updatedAt: Date.now(),
            })
          );
        } catch {
          // ignore storage quota errors
        }
      }
      setLoadError(false);
    } catch (e: any) {
      console.warn("Background revalidate or fetch error:", e?.message);
      if (!hasInitialData) {
        setLoadError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasInitialData]);

  useEffect(() => {
    // If we don't have server-rendered data, try client-side localStorage cache first
    if (!hasInitialData) {
      try {
        const cached = localStorage.getItem("tiemchena_catalog_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.products?.length && parsed?.categories?.length) {
            setProducts(parsed.products);
            setToppings(parsed.toppings || []);
            setCategories(parsed.categories);
            setIsLoading(false);
          }
        }
      } catch {
        // ignore
      }
    }

    // Always revalidate in background once mounted
    fetchCatalogData();
  }, [fetchCatalogData, hasInitialData]);

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
          {isLoading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-4">
              {loadError ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-rose-600 mb-3">
                    Không thể kết nối đến máy chủ thực đơn. Vui lòng kiểm tra kết nối mạng.
                  </p>
                  <button
                    onClick={() => {
                      setIsLoading(true);
                      setLoadError(false);
                      fetchCatalogData();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Thử tải lại
                  </button>
                </div>
              ) : (
                <>
                  <Loader2 className="w-10 h-10 text-orange-600 animate-spin mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Đang tải thực đơn Tiệm Chè Na...</p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Hero Banner */}
              <HeroBanner products={products} onSelectTag={handleSelectHeroTag} />

              {/* Hai Bộ Tứ Món Độc Quyền Tiệm Chè Na */}
              <ExclusiveSetsSection onSelectCategory={(slug) => setSelectedCategory(slug)} />

              {/* 2 Signature Bestseller Dishes */}
              <SignatureDishes
                products={products}
                onOpenCustomize={(p) => {
                  setEditingCartItem(null);
                  setCustomizingProduct(p);
                }}
              />

              {/* Main Full Menu with Smart Pagination */}
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

              {/* Bảng Menu Gốc Đầy Đủ & Chi Tiết Từng Topping */}
              <FullMenuGallerySection />

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
          products={products}
          toppingsList={toppings}
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

        {/* Trợ lý ảo tư vấn (bong bóng nổi toàn trang) */}
        <ChatWidget
          onSelectKeyword={handleSelectHeroTag}
          onOpenTracking={() => handleOpenTracking()}
        />
      </div>
    </CartProvider>
  );
}
