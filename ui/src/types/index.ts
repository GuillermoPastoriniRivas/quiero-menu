// Enums
export enum RestaurantStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  SUSPENDED = "suspended",
}

export enum MenuItemType {
  SIMPLE = "simple",
  VARIANT = "variant",
  COMBO = "combo",
}

export enum OrderStatus {
  NEW = "new",
  PREPARING = "preparing",
  READY = "ready",
  DELIVERING = "delivering",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum DeliveryType {
  PICKUP = "pickup",
  DELIVERY = "delivery",
}

export enum CouponType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
  FREE_DELIVERY = "free_delivery",
}

export enum UserRole {
  OWNER = "owner",
  MANAGER = "manager",
  KITCHEN = "kitchen",
}

// Entities
export interface PaymentMethodsConfig {
  cashEnabled: boolean;
  cardEnabled: boolean;
  transferEnabled: boolean;
  transferBankName?: string;
  transferAccountType?: string;
  transferAccountNumber?: string;
  transferAccountHolder?: string;
  transferCbu?: string;
  transferAlias?: string;
  transferNotes?: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  address: string;
  city: string;
  category?: string;
  citySlug?: string;
  /** Provincia/departamento (display) y joins geo del directorio. API vieja = vacíos. */
  region?: string;
  regionSlug?: string;
  countrySlug?: string;
  /** false = cargado como inventario, reclamable. undefined (API vieja) = con dueño. */
  claimed?: boolean;
  /**
   * Galería de fotos de la ficha. 's3' = subida por el equipo a nuestro
   * bucket público; 'external' = link validado 200 image/* al insertarse.
   * Una imagen que falla al renderizar se oculta (el fetch es del cliente).
   */
  photoGallery?: PhotoGalleryImage[];
  country: string;
  coordinates: { lat: number; lng: number } | null;
  phone: string;
  timezone: string;
  currency: string;
  status: RestaurantStatus;
  openOverride: "open" | "closed" | null;
  customDomain: string | null;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  } | null;
  paymentMethods: PaymentMethodsConfig;
  theme: { primaryColor: string };
  createdAt: string;
  updatedAt: string;
}

export type CustomDomainState =
  | "pending"
  | "provisioning"
  | "active"
  | "failed";

export interface CustomDomainStatus {
  state: CustomDomainState;
  requestedAt?: string;
  verifiedAt?: string;
  failedReason?: string;
}

export interface CustomDomainInfo {
  domain: string | null;
  status: CustomDomainStatus | null;
}

export interface OperatingHours {
  id: string;
  restaurantId: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
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
  trackingToken: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerLatitude: number | null;
  customerLongitude: number | null;
  deliveryType: DeliveryType;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  receiptUrl: string | null;
  notes: string;
  source: string;
  createdAt: string;
  confirmedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  statusHistory?: StatusTransition[];
  /** Moneda del restaurante, la estampa ListOrders para formatear montos. */
  currency?: string;
}

export interface StatusTransition {
  status: OrderStatus;
  at: string;
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

export interface DeliveryAccessToken {
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
  itemType: "simple" | "variant" | "combo";
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
    category?: string;
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
  FREE = "free",
  PRO = "pro",
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
  items?: OrderItem[];
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
    restaurantName?: string;
    platformAdmin?: boolean;
    operating?: boolean;
  };
}

// Admin (panel interno)
export type ReadinessStep =
  | "menu"
  | "whatsapp"
  | "hours"
  | "look"
  | "location"
  | "payments"
  | "shared"
  | "firstOrder";

export type ReadinessChecks = Record<ReadinessStep, boolean>;

export interface ReadinessSummary {
  done: number;
  total: number;
  percent: number;
  missing: ReadinessStep[];
  next: ReadinessStep | null;
}

export type AdminStage = "ficha" | "invitado" | "activo" | "pro" | "pausado";
export type AdminListSort = "recent" | "demand" | "readiness" | "name";

export interface Demand {
  views: number;
  whatsapp: number;
  maps: number;
  instagram: number;
}

export interface AdminRestaurantListItem {
  id: string;
  slug: string;
  name: string;
  city: string;
  citySlug: string;
  category: string;
  logoUrl: string;
  status: string;
  claimed: boolean;
  stage: AdminStage;
  createdAt: string;
  owner: { name: string; email: string } | null;
  plan: string | null;
  invitation: { expiresAt: string; email: string | null } | null;
  menuItems: number;
  listing: ReadinessSummary;
  activation: ReadinessSummary;
  demand30d: Demand;
  orders30d: number;
  ordersWithoutOwner: boolean;
}

export interface AdminCityFacet {
  citySlug: string;
  city: string;
  count: number;
}

export interface AdminRestaurantListResponse {
  items: AdminRestaurantListItem[];
  total: number;
  page: number;
  pages: number;
  stages: Record<AdminStage | "all", number>;
  cities: AdminCityFacet[];
}

export interface AdminActivityEntry {
  id: string;
  event: string;
  createdAt: string;
  count: number;
  actor: { name: string; email: string } | null;
  restaurant: { id: string; name: string; slug: string } | null;
  metadata: Record<string, unknown> | null;
}

export interface AdminOverview {
  generatedAt: string;
  pipeline: Record<AdminStage | "all", number>;
  inventory: { withMenu: number; listingReady: number; ordersWithoutOwner: number };
  platform: { ordersLast7d: number; ordersPrev7d: number; activeRestaurants7d: number };
  pendingClaims: number;
  lists: {
    expiringInvitations: AdminRestaurantListItem[];
    readyToInvite: AdminRestaurantListItem[];
    hotLeads: AdminRestaurantListItem[];
    stalledOwners: AdminRestaurantListItem[];
    ordersWithoutOwner: AdminRestaurantListItem[];
  };
  activity: AdminActivityEntry[];
}

export type PhotoGalleryImage = { url: string; source: "s3" | "external"; alt?: string };

export interface AdminRestaurantDetail {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    description: string;
    logoUrl: string;
    bannerUrl: string;
    address: string;
    city: string;
    region: string;
    country: string;
    category: string;
    coordinates: { lat: number; lng: number } | null;
    phone: string;
    whatsapp: string | null;
    currency: string;
    timezone: string;
    status: string;
    claimed: boolean;
    openOverride: "open" | "closed" | null;
    customDomain: string | null;
    photoGallery: PhotoGalleryImage[];
    socialLinks: { instagram?: string; facebook?: string; tiktok?: string } | null;
    paymentMethods: PaymentMethodsConfig;
    createdAt: string;
    updatedAt: string;
  };
  stage: AdminStage;
  owner: { id: string; name: string; email: string; emailVerified: boolean } | null;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    paymentProvider: string;
    canceledAt: string | null;
  } | null;
  invitation: { id: string; email: string | null; expiresAt: string; createdAt: string } | null;
  readiness: {
    checks: ReadinessChecks;
    listing: ReadinessSummary;
    activation: ReadinessSummary;
  };
  stats: {
    ordersTotal: number;
    ordersLast30d: number;
    categories: number;
    products: number;
    openDays: number;
  };
  demand30d: Demand;
  pendingClaims: {
    id: string;
    name: string;
    phone: string;
    email: string;
    message: string;
    createdAt: string;
  }[];
  timeline: AdminActivityEntry[];
  flags: { ordersWithoutOwner: boolean };
}

export interface ActivationStatus {
  slug: string;
  checks: ReadinessChecks;
  summary: ReadinessSummary;
  details: {
    menuItems: number;
    openDays: number;
    orders: number;
    whatsapp: string | null;
    transferMissingAccount: boolean;
    sharedAt: string | null;
  };
}

export interface ApprovedClaim {
  restaurantId: string;
  claimant: { name: string; phone: string; email: string };
  invitation: CreatedInvitation;
}

export interface AdminAuditLogEntry {
  id: string;
  event: string;
  actorUserId: string | null;
  restaurantId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export type StoreClaimStatus = 'pending' | 'approved' | 'rejected';

export interface StoreClaimListItem {
  id: string;
  status: StoreClaimStatus;
  createdAt: string;
  reviewedAt: string | null;
  claimant: { name: string; phone: string; email: string; message: string };
  restaurant: {
    id: string;
    slug: string;
    name: string;
    city: string;
    phone: string;
    claimed: boolean;
  } | null;
  owners: { name: string; email: string }[];
}

export interface AdminCreateUnclaimedResponse {
  restaurantId: string;
  slug: string;
}

export interface ImpersonateResponse extends LoginResponse {
  impersonated: true;
}

export interface CurrentUserMeResponse {
  id: string;
  name: string;
  email: string;
  restaurants: { id: string; slug: string; name: string; role: string }[];
  platformAdmin?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; pages: number };
}

export interface FeaturedSlotRef {
  scope: 'category' | 'home';
  citySlug: string;
  category: string;
}

export interface StorefrontIndexEntry {
  slug: string;
  name: string;
  city: string;
  citySlug: string;
  /** Provincia/departamento/estado visible. Vacío = sin clasificar (API vieja). */
  region: string;
  /** Join keys geo del directorio de 3 niveles. Vacíos = API vieja. */
  countrySlug: string;
  regionSlug: string;
  category: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  phone: string;
  isOpen: boolean;
  /** false = ficha de inventario sin dueño (reclamable). Ausente = API vieja. */
  claimed?: boolean;
  /** Coordenadas del local (null/ausente = sin cargar). Para ordenar por cercanía. */
  lat?: number | null;
  lng?: number | null;
  /** Ausente en APIs viejas; false significa que no hay horario publicado. */
  hoursKnown?: boolean;
  updatedAt: string;
  /** Slots de destacado vigentes (API nueva; ausente en API vieja). */
  featured?: FeaturedSlotRef[];
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
  showPoweredByFooter: boolean;
  isOpen: boolean;
  todayHours: OperatingHours | null;
}

export interface RestaurantOperatingHoursData {
  hours: OperatingHours[];
  isOpen: boolean;
  todayHours: OperatingHours | null;
  localTime: string;
  closesAtLabel: string | null;
}

export interface StorefrontOrderResponse {
  order: Order;
  items: OrderItem[];
  whatsappUrl: string;
}

export interface TrackingOrder {
  id: string;
  code: string;
  trackingToken: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  receiptUrl: string | null;
  notes: string;
  createdAt: string;
  confirmedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
}

export interface OrderFeedbackInfo {
  confirmedAt: string;
  rating: 'up' | 'down' | null;
  onTime: boolean | null;
  couponCode: string | null;
}

export interface ConfirmDeliveryResponse {
  orderId: string;
  code: string;
  status: OrderStatus;
  confirmedAt: string;
  couponCode: string;
  rating: 'up' | 'down' | null;
  onTime: boolean | null;
}

export interface TrackingResponse {
  order: TrackingOrder;
  items: OrderItem[];
  restaurant: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string;
    currency: string;
    paymentMethods: PaymentMethodsConfig;
    phone: string;
  };
  feedback: OrderFeedbackInfo | null;
}

// Coupons
export interface Coupon {
  id: string;
  restaurantId: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface CouponValidation {
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  subtotal: number;
  discount: number;
  freeDelivery: boolean;
}

// Customers
export interface CustomerSummary {
  phone: string;
  name: string;
  address: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  lastOrderCode: string;
}

// Analytics
export interface AnalyticsOverview {
  range: number;
  summary: {
    revenue: number;
    orders: number;
    avgTicket: number;
    cancelled: number;
    cancelledRate: number;
    views: number;
    conversionRate: number;
  };
  deltas: { revenue: number; orders: number };
  daily: { date: string; revenue: number; orders: number }[];
  topItems: {
    menuItemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  byHour: { hour: number; orders: number; revenue: number }[];
  status: { status: string; count: number }[];
  events: {
    whatsapp: number;
    maps: number;
    instagram: number;
    whatsappPrev: number;
  };
  timings: {
    from: string;
    to: string;
    count: number;
    avgMinutes: number;
    minMinutes: number;
    maxMinutes: number;
  }[];
}

export type InvitationStatus = 'active' | 'accepted' | 'revoked' | 'expired';

export interface AdminInvitation {
  id: string;
  email: string | null;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedByEmail: string | null;
  revokedAt: string | null;
}

export interface CreatedInvitation {
  id: string;
  url: string;
  email: string | null;
  expiresAt: string;
  emailSent: boolean;
}

export interface InvitationPreview {
  status: InvitationStatus;
  expiresAt: string;
  emailHint: string | null;
  restaurant: {
    name: string;
    slug: string;
    description: string;
    city: string;
    category: string;
    logoUrl: string;
    bannerUrl: string;
    photos: string[];
    categories: number;
    items: number;
    hasHours: boolean;
  };
}
