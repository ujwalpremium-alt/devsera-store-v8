// Fulfillment methods - how the product is delivered to customer
export type FulfillmentMethod = 
  | 'EMAIL'           // Sent via email
  | 'CODE'            // Activation code/license key
  | 'COUPON_LINK'     // Coupon/redemption link
  | 'DASHBOARD'       // Website dashboard order section
  | 'MANUAL';         // Manual delivery by admin

export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';

// Delivery types for products
export type DeliveryType = 
  | 'CREDENTIALS'      // Admin provides username/password
  | 'COUPON_CODE'      // Admin provides coupon/license key
  | 'MANUAL_ACTIVATION' // User provides their ID/email, admin activates on their account
  | 'INSTANT_KEY';     // Pre-loaded keys that auto-deliver

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  duration: string;
  originalPrice: number;
  salePrice: number;
  costPrice?: number; // Vendor/purchase price (admin only - for profit calculation)
  stockCount: number;
  isDefault: boolean;
  sortOrder: number;
  deliveryType?: DeliveryType; // Variant-specific delivery type (overrides product's delivery type)
  features?: string[]; // Variant-specific features (overrides or extends product features)
  createdAt: string;
  updatedAt: string;
}

export interface ProductStockKey {
  id: string;
  productId: string;
  variantId?: string;
  keyType: 'LICENSE_KEY' | 'CREDENTIALS' | 'COUPON_CODE';
  keyValue: string;
  username?: string;
  password?: string;
  additionalData?: Record<string, any>;
  status: 'AVAILABLE' | 'ASSIGNED' | 'EXPIRED' | 'REVOKED';
  assignedOrderId?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type PremiumStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type PremiumPlan = '5_year' | '10_year' | 'lifetime';
export type PremiumContentType = 'trick' | 'guide' | 'offer' | 'resource';

export interface PremiumMembership {
  id: string;
  user_id: string;
  plan_type: PremiumPlan;
  price_paid: number;
  payment_proof_url?: string;
  payment_method: string;
  transaction_id?: string;
  status: PremiumStatus;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  expires_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    email: string;
    name?: string;
    full_name?: string;
  };
}

export interface PremiumProduct {
  id: string;
  product_id: string;
  is_free_for_premium: boolean;
  premium_discount_percent: number;
  premium_only: boolean;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export interface PremiumContent {
  id: string;
  title: string;
  description?: string;
  content_type: PremiumContentType;
  content_url?: string;
  content_body?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  salePrice: number;
  costPrice?: number; // Vendor/purchase price (admin only - for profit calculation)
  duration: string;
  features: string[];
  category: string;
  deliveryType: DeliveryType;
  deliveryInstructions?: string; // Instructions shown to user based on delivery type
  requiresUserInput?: boolean;   // If true, user must provide their account details
  userInputLabel?: string;       // Label for user input field (e.g., "Your Netflix Email")
  requiresPassword?: boolean;    // If true, user must provide password (for manual activation)
  fulfillmentMethod?: FulfillmentMethod; // How the product is delivered (email, whatsapp, etc.)
  fulfillmentDetails?: string;   // Additional details about fulfillment
  customRequirementsLabel?: string; // Custom label for requirements (admin side)
  customUserSeesLabel?: string;  // Custom label for what user sees
  isActive?: boolean;
  // New fields for variants and scheduling
  hasVariants?: boolean;
  variants?: ProductVariant[];
  scheduledStart?: string;
  scheduledEnd?: string;
  lowStockAlert?: number;
  stockCount?: number; // Computed from stock keys
  manualStockCount?: number; // Manual stock count (not tied to keys)
  useManualStock?: boolean; // If true, use manual stock count instead of keys
}

export interface OrderCredentials {
  // For CREDENTIALS type
  username?: string;
  password?: string;
  // For COUPON_CODE / INSTANT_KEY type
  couponCode?: string;
  licenseKey?: string;
  activationLink?: string; // Clickable link for coupon/license activation
  // For MANUAL_ACTIVATION type
  activationStatus?: string;
  activationNotes?: string;
  // Common
  expiryDate?: string;
  additionalInfo?: string;
}

export interface UserProvidedCredentials {
  email?: string;
  password?: string;
}

export interface OrderProfile {
  id: string;
  email: string;
  full_name?: string;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  variantId?: string;
  variant?: ProductVariant;
  product?: Product;
  profile?: OrderProfile;
  status: OrderStatus;
  totalAmount?: number; // Actual amount paid (may differ from product price during flash sales)
  paymentScreenshot?: string;
  // User-provided input for MANUAL_ACTIVATION (legacy - single string)
  userProvidedInput?: string;
  // User-provided credentials for MANUAL_ACTIVATION (email + password)
  userProvidedCredentials?: UserProvidedCredentials;
  // Flexible credentials based on delivery type
  credentials?: OrderCredentials;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminPermissions {
  id: string;
  admin_id: string;
  // Products
  can_view_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
  // Bundles
  can_view_bundles: boolean;
  can_edit_bundles: boolean;
  can_delete_bundles: boolean;
  // Flash Sales
  can_view_flash_sales: boolean;
  can_edit_flash_sales: boolean;
  can_delete_flash_sales: boolean;
  // Orders
  can_view_orders: boolean;
  can_edit_orders: boolean;
  can_delete_orders: boolean;
  // Customers
  can_view_customers: boolean;
  can_edit_customers: boolean;
  can_delete_customers: boolean;
  // Tickets
  can_view_tickets: boolean;
  can_edit_tickets: boolean;
  can_delete_tickets: boolean;
  // Premium
  can_view_premium: boolean;
  can_edit_premium: boolean;
  can_delete_premium: boolean;
  // Rewards
  can_view_rewards: boolean;
  can_edit_rewards: boolean;
  can_delete_rewards: boolean;
  // Community
  can_view_community: boolean;
  can_edit_community: boolean;
  can_delete_community: boolean;
  // Settings
  can_view_settings: boolean;
  can_edit_settings: boolean;
  // Admin Management
  can_manage_admins: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  admin_role?: AdminRole;
  permissions?: AdminPermissions;
  is_active?: boolean;
  created_by?: string;
}

export interface Account {
  id: string;
  productId: string;
  username: string;
  password: string;
  maxSlots: number;
  usedSlots: number;
  status: 'active' | 'blocked' | 'expired';
  expiryDate: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: string;
}

export interface Settings {
  upiId: string;
  qrCodeUrl: string;
  telegramLink: string;
  telegramUsername: string;
  contactEmail: string;
  contactPhone: string;
}
