import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { StorefrontView } from "@/components/storefront/StorefrontView";

export const revalidate = 60; // Cache static page on edge/server for 60s (ISR)

export default async function Home() {
  let initialProducts: any[] = [];
  let initialToppings: any[] = [];
  let initialCategories: any[] = [];

  try {
    const [prodData, catData] = await Promise.all([
      productService.getProducts(),
      categoryService.getCategories(),
    ]);

    initialProducts = JSON.parse(JSON.stringify(prodData?.products || []));
    initialToppings = JSON.parse(JSON.stringify(prodData?.toppings || []));
    initialCategories = JSON.parse(JSON.stringify(catData || []));
  } catch (error) {
    console.error("Home page SSR fetch error:", error);
  }

  return (
    <StorefrontView
      initialProducts={initialProducts}
      initialCategories={initialCategories}
      initialToppings={initialToppings}
    />
  );
}
