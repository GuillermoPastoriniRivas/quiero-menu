// Enums
export enum RestaurantStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  SUSPENDED = 'suspended',
}

export enum MenuItemType {
  SIMPLE = 'simple',
  VARIANT = 'variant',
  COMBO = 'combo',
}

export enum OrderStatus {
  NEW = 'new',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  KITCHEN = 'kitchen',
}

// Entities
export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  address: string;
  city: string;
  country: string;
  coordinates: { lat: number; lng: number } | null;
  phone: string;
  timezone: string;
  currency: string;
  status: RestaurantStatus;
  customDomain: string | null;
  socialLinks: { instagram?: string; facebook?: string; tiktok?: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperatingHours {
  id: string;
  restaurantId: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

export interface DeliveryZone {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  displayOrder: number;
  isAvailable: boolean;
  isVisible: boolean;
  itemType: MenuItemType;
}

export interface MenuItemVariant {
  id: string;
  itemId: string;
  name: string;
  priceOverride: number | null;
  maxSelections: number;
  displayOrder: number;
}

export interface MenuItemOption {
  id: string;
  itemId: string;
  variantId: string | null;
  name: string;
  priceDelta: number;
  optionGroup: string;
  isAvailable: boolean;
}

export interface Order {
  id: string;
  restaurantId: string;
  code: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerLatitude: number | null;
  customerLongitude: number | null;
  deliveryType: DeliveryType;
  deliveryZoneId: string | null;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  notes: string;
  source: string;
  createdAt: string;
  confirmedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedOptions: { optionId: string; name: string; priceDelta: number }[];
  notes: string;
}

export interface KitchenAccessToken {
  id: string;
  restaurantId: string;
  token: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

// AI Menu Vision
export interface MenuVisionItem {
  name: string;
  description: string;
  basePrice: number;
  itemType: 'simple' | 'variant' | 'combo';
  variants?: { name: string; priceOverride: number | null }[];
  options?: { name: string; priceDelta: number; optionGroup: string }[];
}

export interface MenuVisionCategory {
  name: string;
  description: string;
  items: MenuVisionItem[];
}

export interface MenuVisionOutput {
  restaurant: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    currency?: string;
  };
  operatingHours?: {
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
    isClosed: boolean;
  }[];
  categories: MenuVisionCategory[];
}

export interface BulkImportResult {
  categories: number;
  items: number;
  variants: number;
  options: number;
}

// Billing
export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
}

export interface Subscription {
  id: string;
  restaurantId: string;
  plan: PlanTier;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  paymentProvider: string;
  externalCustomerId: string | null;
  externalSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  maxOrdersPerMonth: number;
  showPoweredByFooter: boolean;
  customDomain: boolean;
  priceMonthly: number;
}

export interface SubscriptionInfo {
  subscription: Subscription | null;
  plan: PlanTier;
  limits: PlanLimits;
  usage: { ordersThisMonth: number };
}

export interface BillingRecord {
  id: string;
  restaurantId: string;
  eventType: string;
  plan: string;
  amountCents: number;
  description: string;
  createdAt: string;
}

export interface PlanInfo {
  plan: PlanTier;
  ordersUsed: number;
  ordersLimit: number;
  redactedCount: number;
}

export interface OrderWithRedaction extends Order {
  redacted: boolean;
}

export interface OrderListResponse {
  data: OrderWithRedaction[];
  meta: { total: number; page: number; pages: number };
  planInfo: PlanInfo;
}

// API responses
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    restaurantId: string;
    restaurantSlug: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; pages: number };
}

export interface StorefrontData {
  restaurant: Restaurant;
  categories: (MenuCategory & {
    items: (MenuItem & {
      variants: MenuItemVariant[];
      options: MenuItemOption[];
    })[];
  })[];
  operatingHours: OperatingHours[];
  deliveryZones: DeliveryZone[];
  showPoweredByFooter: boolean;
}

export interface StorefrontOrderResponse {
  order: Order;
  items: OrderItem[];
  whatsappUrl: string;
}
