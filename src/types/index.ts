export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
}

export interface ToppingType {
  id: string;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface ProductOptionType {
  id: string;
  name: string;
  price: number;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  image?: string | null;
  isHot: boolean;
  isBestseller: boolean;
  isOnBanner?: boolean;
  isAvailable: boolean;
  categoryId: string;
  category?: CategoryType;
  toppingsJson?: string | null;
  /** physical = hàng vật lý (trừ kho) · digital = sản phẩm số · service = dịch vụ (không trừ kho) */
  productType?: "physical" | "digital" | "service" | string;
  /** Tồn kho – chỉ áp dụng cho physical; null = không theo dõi */
  stock?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItemType {
  id?: string;
  orderId?: string;
  productId?: string | null;
  productName: string;
  productPrice: number;
  quantity: number;
  toppingsJson?: string | null;
  selectedToppings?: ToppingType[];
  itemTotal: number;
  note?: string | null;
}

export interface OrderType {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string | null;
  note?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  voucherCode?: string | null;
  items?: OrderItemType[];
  completedOrdersCount?: number;
  isLoyalCustomer?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreSettingType {
  id?: string;
  storeName?: string;
  hotline?: string;
  address?: string;
  openingHours?: string;
  bannerAnnouncement?: string;
  qrBankId?: string;
  qrAccountNumber?: string;
  qrAccountName?: string;
  zaloUrl?: string;
  isAcceptingOrders?: boolean;
  isBankLocked?: boolean;
}

export interface StatsType {
  revenueToday: number;
  revenueTotal: number;
  ordersToday: number;
  totalOrders: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  topProducts: { name: string; count: number; revenue: number }[];
  recentOrders: OrderType[];
}

export interface CustomerType {
  /** id trong bảng Customer (CRM); không có nếu khách chỉ xuất hiện trong đơn hàng */
  id?: string;
  email?: string | null;
  zalo?: string | null;
  /** order | waitlist | manual */
  source?: string;
  createdAt?: string;
  phone: string;
  name: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  isVip: boolean;
  note?: string;
  recentOrders?: {
    orderCode: string;
    finalAmount: number;
    orderStatus: string;
    createdAt: string;
  }[];
}

export interface TagType {
  id: string;
  code: string;
  name: string;
  icon: string;
  badgeColor: string;
  textColor: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  appliedCount?: number;
}

export interface FeedbackType {
  id: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  dishName: string;
  comment: string;
  reply?: string;
  status: "APPROVED" | "PENDING";
  createdAt: string;
}
