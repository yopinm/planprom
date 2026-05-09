// Global TypeScript type definitions for couponkum.com
// Feature-specific types live in their own feature module

// =============================================================
// Enums / Union Types
// =============================================================

export type Platform = 'shopee' | 'lazada' | 'tiktok'

export type DataSource = 'api' | 'manual' | 'mock' | 'involve_asia' | 'accesstrade' | 'shopee_affiliate'

export type CouponTier = 1 | 2 | 3 | 4

export type CouponType = 'fixed' | 'percent' | 'shipping' | 'cashback'

export type ShopType = 'official' | 'normal' | 'mall'

export type UserSegment = 'all' | 'new_user' | 'member' | 'premium'

export type QueryType = 'budget' | 'product_name' | 'url'

export type SourcePage = 'search' | 'landing' | 'comparison' | 'tiktok_organic' | 'unknown'

// =============================================================
// Database Row Types (mirrors Supabase tables)
// =============================================================

export interface Product {
  id: string
  platform: Platform
  platform_id: string
  name: string
  url: string
  affiliate_url: string | null
  category: string | null
  price_current: number
  price_original: number | null
  suspicious_discount?: boolean
  suspicious_discount_reason?: string | null
  suspicious_discount_checked_at?: string | null
  price_min: number | null
  price_max: number | null
  shop_id: string | null
  shop_name: string | null
  shop_type: ShopType | null
  rating: number | null
  sold_count: number
  image_url: string | null
  is_active: boolean
  price_checked_at?: string | null
  /** NULL=unknown→40 baht fallback; 0=free; >0=actual fee (baht) */
  shipping_fee?: number | null
  created_at: string
  updated_at: string
  data_source?: DataSource
}

export interface Coupon {
  id: string
  code: string | null
  title: string
  description: string | null
  platform: Platform | 'all'
  tier: CouponTier
  type: CouponType
  discount_value: number
  max_discount: number | null
  min_spend: number
  applicable_categories: string[]   // empty = all categories
  can_stack: boolean
  user_segment: UserSegment
  expire_at: string | null
  is_active: boolean
  source: string | null
  source_checked_at?: string | null
  created_at: string
  updated_at: string
}

export interface CouponStackRule {
  id: string
  name: string
  description: string | null
  platform: Platform | 'all'
  tier_order: CouponTier[]          // e.g. [1,2,3,4]
  allowed_tiers: CouponTier[]
  max_stack: number
  conditions: Record<string, unknown>
  is_active: boolean
  created_at: string
}

export interface ClickLog {
  id: string
  product_id: string | null
  platform: Platform
  source_page: SourcePage
  query: string | null
  sub_id: string | null
  session_id: string | null
  user_agent: string | null
  ip_hash: string | null
  clicked_at: string
}

export interface SearchLog {
  id: string
  query: string
  query_type: QueryType
  parsed_intent: ParsedIntent
  results_count: number
  top_product_id: string | null
  session_id: string | null
  user_agent: string | null
  response_time_ms: number | null
  searched_at: string
}

export type BankName = 'KBank' | 'SCB' | 'KTC' | 'AEON' | 'BBL' | 'TTB' | 'Krungsri'

export interface BankPromotion {
  id: string
  bank_name: BankName
  /** Platform the promotion applies to; 'all' = both Shopee + Lazada */
  platform: Platform | 'all'
  /** Product category this promo applies to; null = all categories */
  category: string | null
  /**
   * Day of week this promo is active (0=Sun, 1=Mon, …, 6=Sat).
   * null = applies every day.
   */
  day_of_week: number | null
  discount_type: 'percent' | 'fixed' | 'cashback'
  discount_value: number
  max_discount: number | null
  min_spend: number
  description: string
  valid_from: string | null   // ISO date string
  valid_until: string | null  // ISO date string
  is_active: boolean
  created_at: string
}

// =============================================================
// Engine / Domain Types
// =============================================================

export interface ParsedIntent {
  budget?: number
  category?: string
  platform?: Platform
  query_type: QueryType
  product_id?: string
  query?: string
}

export interface PriceResult {
  payNow: number
  effectiveNet: number
  originalPrice: number
  usedCombination: Coupon[]
  /** Shipping fee before shipping coupons; currently may be a platform estimate. */
  shippingFee?: number
  /** Item subtotal after item coupons, before shipping and cashback. */
  itemSubtotal?: number
  /** Remaining shipping fee after shipping coupons. */
  shippingFinal?: number
  /** Total fixed/percent coupon reduction against item price. */
  itemDiscount?: number
  /** Total shipping coupon reduction. */
  shippingDiscount?: number
  /** Cashback coupon saving applied after payNow. */
  cashbackSaving?: number
  /** Additional saving from bank credit card promotion (TASK 1.6.2) */
  bankSaving?: number
  /** Bank promotion ID applied on top of coupon combination */
  bankPromotionId?: string
}

// =============================================================
// Phase 2 — Intelligence (TASK 2.1)
// =============================================================

export interface PriceHistory {
  id: string
  product_id: string
  price: number
  platform: Platform | null
  captured_at: string
}

export interface ProductView {
  product_id: string
  viewed_at: string
}

export type Phase6BaselineSignalType =
  | 'price_snapshot'
  | 'product_view'
  | 'conversion'
  | 'conversion_adjustment'

export interface Phase6BaselineEvent {
  signal_type: Phase6BaselineSignalType
  product_id: string | null
  platform: Platform | null
  sub_id: string | null
  metric_value: number
  occurred_at: string
  metadata: Record<string, unknown>
}

export interface UserProfile {
  id: string                // references auth.users.id
  full_name: string | null
  interests: string[]       // array of category strings
  line_notify_token: string | null
  line_notify_status: 'active' | 'expired' | 'error' | null
  line_notify_error: string | null
  line_notify_checked_at: string | null
  owned_media_email_opt_in?: boolean
  owned_media_email_consented_at?: string | null
  owned_media_email_source?: string | null
  owned_media_line_opt_in?: boolean
  owned_media_line_consented_at?: string | null
  owned_media_line_source?: string | null
  created_at: string
  updated_at: string
}

export type WalletDiscountType = 'fixed' | 'percent' | 'shipping' | 'cashback'

export interface CouponWallet {
  id: string
  user_ref: string
  code: string
  title: string
  discount_type: WalletDiscountType
  discount_value: number
  min_spend: number
  platform: Platform | 'all' | null
  expire_at: string | null
  is_used: boolean
  created_at: string
}

export type AlertType = 'price_drop' | 'coupon_expiry' | 'target_deal' | 'rare_item'

export type AlertChannel = 'email' | 'line' | 'push' | 'line_notify'

export interface Alert {
  id: string
  user_ref: string
  product_id: string | null
  target_price: number | null
  rare_score_threshold: number | null
  alert_type: AlertType
  channel: AlertChannel
  is_active: boolean
  last_triggered_at: string | null
  cooldown_minutes: number
  created_at: string
}

export type AlertLogEvent =
  | 'triggered'
  | 'skipped_cooldown'
  | 'skipped_disabled'
  | 'skipped_not_rare'
  | 'skipped_rate_limited'
  | 'line_notify_sent'
  | 'line_notify_failed'
  | 'line_notify_token_expired'

export interface AlertLog {
  id: string
  alert_id: string
  product_id: string | null
  current_price: number | null
  target_price: number | null
  rare_score_threshold: number | null
  event: AlertLogEvent
  channel: AlertChannel | null
  created_at: string
}

/** TASK 2.9: rare = หายาก | ready_to_ship = พร้อมส่ง | low_stock = เหลือน้อย */
export type RareItemBadge = 'rare' | 'ready_to_ship' | 'low_stock'

export interface RareItemScore {
  id: string
  product_id: string
  rare_score: number
  deal_score: number
  trend_score: number
  final_score: number
  badge: RareItemBadge | null
  last_calculated_at: string
}

// =============================================================
// Phase 5 — Analytics Pipeline (TASK 5.2)
// =============================================================

export type AnalyticsEventName =
  | 'page_view'
  | 'intermediate_view'
  | 'intermediate_continue'
  | 'control_blocked'
  | 'coupon_copy'

export interface AnalyticsEvent {
  id:         string
  event_name: AnalyticsEventName
  properties: Record<string, unknown>
  session_id: string | null
  path:       string | null
  referrer:   string | null
  user_agent: string | null
  ip_hash:    string | null
  created_at: string
}

// =============================================================
// Phase 4-Ext — Revenue Tracking (TASK 4.10a)
// =============================================================

export type RevenueEventType = 'conversion' | 'cancellation' | 'return'

export interface RevenueTracking {
  id: string
  platform: Platform
  sub_id: string | null
  order_id: string | null
  commission: number | null
  event_type: RevenueEventType
  raw_payload: Record<string, unknown>
  received_at: string
}

// =============================================================
// Phase 2.5 — Facebook Post Preparation (TASK 2.5.1)
// =============================================================

/** Status lifecycle: draft → scored → approved → copied → published → sunset */
export type FbPostStatus = 'draft' | 'scored' | 'approved' | 'copied' | 'published' | 'sunset'

export type FbCampaignContextType = 'double_date' | 'payday' | 'month_start' | 'peak_traffic' | 'normal'

export interface FacebookPost {
  id: string
  product_id: string
  caption_short: string
  caption_long: string
  image_url: string | null
  campaign_context: FbCampaignContextType
  post_score: number | null
  status: FbPostStatus
  approved_by: string | null
  approved_at: string | null
  published_at: string | null
  webhook_response: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface FacebookPostLog {
  id: string
  post_id: string
  event: string
  meta: Record<string, unknown> | null
  created_at: string
}

export type FacebookCommentReceiptStatus = 'processing' | 'replied' | 'skipped' | 'failed'

export interface FacebookCommentReceipt {
  id: string
  post_id: string
  fb_post_id: string
  comment_id: string
  commenter_id: string | null
  status: FacebookCommentReceiptStatus
  first_seen_at: string
  processed_at: string | null
  meta: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface FacebookSettings {
  id: 1
  // Weekday (Mon–Fri)
  max_per_day: number
  min_gap_hours: number
  prime_time_slots: string[]
  // Weekend (Sat–Sun)
  max_per_day_weekend: number
  prime_time_slots_weekend: string[]
  // Campaign mode (overrides weekend/weekday when enabled)
  campaign_mode_enabled: boolean
  max_per_day_campaign: number
  min_gap_hours_campaign: number
  prime_time_slots_campaign: string[]
  // Shared
  keyword_blacklist: string[]
  disclosure_template: string
  graph_api_posting_enabled?: boolean | null
  auto_reply_enabled?: boolean | null
  tos_reviewed_at: string | null
  tos_reviewed_by: string | null
  updated_at: string
}

// =============================================================
// Task T — TikTok Automation (TASK T.5)
// =============================================================

export interface TikTokTrend {
  id: string
  keyword: string
  score: number           // 0-100 (engagement/viral level)
  category: string | null
  is_active: boolean
  discovered_at: string
  updated_at: string
}
