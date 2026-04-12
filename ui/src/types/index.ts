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
  DRAFT = 'draft',
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
}

export interface StorefrontOrderResponse {
  order: Order;
  items: OrderItem[];
  whatsappUrl: string;
}
