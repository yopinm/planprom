// ProductCard — Search Result Card
// No 'use client' — runs on server (pure display, no browser APIs)
// Used by: app/search/page.tsx

import type { ReactElement } from "react";
import type { SearchResultItem } from "@/features/engine/search-pipeline";
import { calculateBuyOrWait } from "@/features/engine/buy-or-wait";
import { BuyOrWaitBadge } from "@/components/search/BuyOrWaitBadge";
import { buildSubId } from "@/lib/sub-id";
import type { FreshnessInfo } from "@/lib/freshness";
import { SafeImage } from "@/components/product/SafeImage";
import { PriceDropBadge } from "@/components/search/PriceDropBadge";
import { CouponCTAButton } from "@/components/search/CouponCTAButton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_LABEL: Record<string, string> = {
  shopee: "Shopee",
  lazada: "Lazada",
};

const DATA_SOURCE_BADGE: Record<
  string,
  { label: string; cls: string } | undefined
> = {
  manual: { label: "คัดโดยทีม", cls: "bg-indigo-100 text-indigo-700" },
  mock: { label: "ข้อมูลสาธิต", cls: "bg-amber-100 text-amber-700" },
  involve_asia: { label: "ดีลพิเศษ", cls: "bg-green-100 text-green-700" },
  accesstrade: { label: "ดีลพิเศษ", cls: "bg-sky-100 text-sky-700" },
};

const PLATFORM_BADGE_CLASS: Record<string, string> = {
  shopee: "bg-orange-500 text-white",
  lazada: "bg-blue-600 text-white",
  tiktok: "bg-black text-white",
};

const DEAL_LABEL_TH: Record<string, string> = {
  "Best Value": "คุ้มสุด",
  "Good Deal": "ดีลดี",
  "Fair Deal": "ดีลทั่วไป",
};

const DEAL_SCORE_BAR: Record<string, string> = {
  "Best Value": "bg-green-500",
  "Good Deal": "bg-yellow-400",
  "Fair Deal": "bg-neutral-300",
};

const DEAL_LABEL_BADGE: Record<string, string> = {
  "Best Value": "bg-green-100 text-green-700",
  "Good Deal": "bg-yellow-100 text-yellow-700",
  "Fair Deal": "bg-neutral-100 text-neutral-600",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString("th-TH");
}

interface ReceiptRow {
  label: string;
  value: number;
  tone: "base" | "add" | "subtract" | "final";
}

function buildReceiptRows(item: SearchResultItem): ReceiptRow[] {
  const promoSaving = item.cashbackSaving + item.bankSaving;
  const rows: ReceiptRow[] = [
    { label: "ราคาสินค้า", value: item.originalPrice, tone: "base" },
  ];

  if (item.itemDiscount > 0) {
    rows.push({
      label: "คูปองสินค้า/ร้าน",
      value: item.itemDiscount,
      tone: "subtract",
    });
  }

  if (item.shippingFee > 0) {
    rows.push({
      label: "ค่าส่ง",
      value: item.shippingFee,
      tone: "add",
    });
  }

  if (item.shippingDiscount > 0) {
    rows.push({
      label: "โค้ดส่งฟรี",
      value: item.shippingDiscount,
      tone: "subtract",
    });
  }

  if (promoSaving > 0) {
    rows.push({
      label: "แคชแบ็ก/โปรธนาคาร",
      value: promoSaving,
      tone: "subtract",
    });
  }

  rows.push({ label: "ราคาสุทธิ", value: item.effectiveNet, tone: "final" });
  return rows;
}

function formatReceiptValue(row: ReceiptRow): string {
  if (row.tone === "subtract") return `-${fmt(row.value)}`;
  if (row.tone === "add") return `+${fmt(row.value)}`;
  return fmt(row.value);
}

function receiptValueClass(tone: ReceiptRow["tone"]): string {
  switch (tone) {
    case "subtract":
      return "text-green-700";
    case "add":
      return "text-neutral-700";
    case "final":
      return "text-black";
    case "base":
      return "text-neutral-700";
  }
}

function getPriceCheckedLabel(checkedAt: string | null): string | null {
  if (!checkedAt) return null
  const diffMs = Date.now() - new Date(checkedAt).getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  if (diffH > 48) return null
  if (diffH < 1) return "ตรวจสอบแล้ว < 1ชม."
  return `ตรวจสอบแล้ว ${diffH}ชม.`
}

function getFreshnessBadgeClass(status: FreshnessInfo["status"]): string {
  switch (status) {
    case "fresh":
      return "bg-green-100 text-green-700";
    case "aging":
      return "bg-yellow-100 text-yellow-700";
    case "stale":
      return "bg-red-100 text-red-700";
    case "unknown":
      return "bg-neutral-100 text-neutral-600";
  }
}

// TRUST-1: only show verification badge when data is confirmed — hide when unknown.
function PriceConfidenceBadge({ isReliable }: { isReliable: boolean }) {
  if (!isReliable) return null
  return (
    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
      ✓ ยืนยันแล้ว
    </span>
  )
}

function FreshnessMeta({
  info,
  label,
}: {
  info: FreshnessInfo;
  label: string;
}) {
  if (info.status === 'unknown') return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <span
        className={`rounded-full px-2 py-0.5 font-bold ${getFreshnessBadgeClass(info.status)}`}
      >
        {label}: {info.badgeLabel}
      </span>
      <span className="block text-neutral-500 sm:hidden">
        {info.mobileLabel}
      </span>
      <span className="hidden text-neutral-500 sm:block">
        {info.desktopLabel}
      </span>
    </div>
  )
}

// COUPON-FIRST-1: Coupon hero banner — primary visual element of the card.
// Shows coupon code(s) + discount amount prominently before product details.
function CouponHeroBanner({ item }: { item: SearchResultItem }) {
  const codeCoupons = item.usedCombination.filter(c => c.code !== null)
  const actualSavings = item.originalPrice - item.effectiveNet

  if (item.usedCombination.length === 0) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
        <span className="text-base">🏷️</span>
        <p className="text-xs font-semibold text-neutral-500">ดีลพิเศษ — ไม่ต้องใช้โค้ด</p>
      </div>
    )
  }

  if (codeCoupons.length === 0) {
    const dealParts = item.usedCombination.map(c => {
      if (c.type === 'shipping') return 'ส่งฟรี'
      if (c.type === 'cashback') return `แคชแบ็ก ${c.discount_value}%`
      if (c.type === 'fixed') return `ลด ฿${c.discount_value}`
      if (c.type === 'percent') return `ลด ${c.discount_value}%`
      return c.title
    })
    return (
      <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-green-600">🎁 ดีลพิเศษ — ไม่ต้องใช้โค้ด</p>
        <p className="mt-1 text-sm font-bold text-green-800">{dealParts.join(' + ')}</p>
        {actualSavings > 0 && item.savingsReliable && (
          <p className="mt-1 text-xs font-semibold text-green-600">ประหยัดได้ ฿{fmt(actualSavings)}</p>
        )}
      </div>
    )
  }

  const hasExtraShipping = item.usedCombination.some(c => c.code === null && c.type === 'shipping')
  const hasExtraCashback = item.usedCombination.some(c => c.code === null && c.type === 'cashback')

  return (
    <div className="mt-3 rounded-2xl border-2 border-dashed border-orange-400 bg-orange-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-wider text-orange-500">✂️ ใช้โค้ดนี้ก่อนกดซื้อ</p>
        {actualSavings > 0 && item.savingsReliable && (
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-black text-white">
            ลด ฿{fmt(actualSavings)}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {codeCoupons.map((c, i) => (
          <span
            key={i}
            className="rounded-lg bg-white px-4 py-2 text-sm font-black tracking-widest text-orange-900 shadow-sm ring-2 ring-orange-300 sm:text-base"
          >
            {c.code}
          </span>
        ))}
        {hasExtraShipping && (
          <span className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 ring-1 ring-green-200">
            + ส่งฟรี
          </span>
        )}
        {hasExtraCashback && (
          <span className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 ring-1 ring-green-200">
            + แคชแบ็ก
          </span>
        )}
      </div>
      {item.couponFreshness && item.couponFreshness.status !== 'unknown' && (
        <p className={`mt-2 text-[10px] font-semibold ${
          item.couponFreshness.status === 'fresh' ? 'text-green-600' :
          item.couponFreshness.status === 'aging' ? 'text-amber-600' :
          'text-red-600'
        }`}>
          อัปเดตคูปอง: {item.couponFreshness.badgeLabel}
        </p>
      )}
    </div>
  )
}

function SavingsReceipt({ item, reliable }: { item: SearchResultItem; reliable: boolean }): ReactElement {
  const rawRows = buildReceiptRows(item);
  const rows = reliable
    ? rawRows
    : rawRows.map(r => r.tone === 'final' ? { ...r, label: 'ราคาอ้างอิง' } : r)
  const shippingChip =
    item.shipping_fee_known && item.shippingFee === 0
      ? { label: "ส่งฟรี", cls: "bg-green-100 text-green-700" }
      : item.shipping_fee_known
        ? { label: "ค่าส่งจากร้านค้า", cls: "bg-neutral-100 text-neutral-500" }
        : null

  return (
    <div className={`mt-3 rounded-2xl border bg-white p-3 ${reliable ? 'border-orange-100' : 'border-neutral-200'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${reliable ? 'text-orange-600' : 'text-neutral-400'}`}>
          ใบเสร็จความคุ้ม
        </p>
        {shippingChip && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${shippingChip.cls}`}>
            {shippingChip.label}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1.5 text-xs">
        {rows.map((row) => (
          <div
            key={`${row.label}-${row.tone}`}
            className={`flex items-center justify-between gap-3 ${
              row.tone === "final"
                ? "border-t border-dashed border-neutral-100 pt-2 font-black"
                : "font-semibold"
            }`}
          >
            <span className={row.tone === "final" ? "text-neutral-800" : "text-neutral-500"}>
              {row.label}
            </span>
            <span className={receiptValueClass(row.tone)}>
              {formatReceiptValue(row)} บาท
            </span>
          </div>
        ))}
      </div>
      {!reliable && (
        <p className="mt-2 text-[10px] text-amber-600">
          * ราคาอ้างอิงจากข้อมูลล่าสุด กรุณาตรวจสอบราคาจริงก่อนซื้อ
        </p>
      )}
    </div>
  );
}

interface UrgencyBadge {
  text: string;
  cls: string;
}

function getUrgencyBadge(item: SearchResultItem): UrgencyBadge | null {
  const now = Date.now();

  for (const coupon of item.usedCombination) {
    if (!coupon.expire_at) continue;
    const msLeft = new Date(coupon.expire_at).getTime() - now;
    if (msLeft > 0 && msLeft < 24 * 3_600_000) {
      return { text: "คูปองหมดวันนี้", cls: "bg-red-500 text-white" };
    }
    if (msLeft > 0 && msLeft < 3 * 24 * 3_600_000) {
      return { text: "คูปองหมดเร็ว", cls: "bg-orange-400 text-white" };
    }
  }

  if (item.sold_count >= 10_000) {
    return { text: "ขายดีมาก", cls: "bg-blue-500 text-white" };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sub-components (inline — used only here)
// ---------------------------------------------------------------------------

function ShopTypeBadge({ type }: { type: string | null }) {
  if (type === "mall") {
    return (
      <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
        Shopee Mall
      </span>
    );
  }
  if (type === "official") {
    return (
      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-700">
        Official Store
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ProductCardProps {
  item: SearchResultItem;
  /** 1-based rank in the result set */
  rank: number;
  /** Original search query — passed as ?q= to /go/[id] for attribution */
  query: string;
  /** 30-day moving average price from price_history (optional — omit for LOW_CONFIDENCE) */
  movingAvg30d?: number;
}

export function ProductCard({
  item,
  rank,
  query,
  movingAvg30d,
}: ProductCardProps) {
  const savings = item.originalPrice - item.effectiveNet;
  const savingsPct =
    item.originalPrice > 0
      ? Math.round((savings / item.originalPrice) * 100)
      : 0;

  // effectiveNet < payNow means cashback or bank promotion was applied.
  const hasCashback = item.effectiveNet < item.payNow;
  const isBestDeal = rank === 1 && item.dealScore.label === "Best Value";

  // Prefer coupon with code (Tier 1) for the intermediate page pre-fill
  const primaryCoupon = item.usedCombination.find((c) => c.code !== null);

  const goParams = new URLSearchParams({
    source: "search",
    sub_id: buildSubId("search", { rank }),
    platform: item.platform,
  });
  if (primaryCoupon?.code) goParams.set("coupon", primaryCoupon.code);
  if (query) goParams.set("q", query);

  const goUrl = `/go/${item.id}?${goParams.toString()}`;
  const urgency = getUrgencyBadge(item);
  const platLabel = PLATFORM_LABEL[item.platform] ?? item.platform;

  const buyOrWait = calculateBuyOrWait({
    movingAvg30d,
    currentPrice: item.price_current,
    dealScore: item.dealScore.total,
    hasCoupons: item.usedCombination.length > 0,
  });

  return (
    <article className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm">
      {/* ── Badge row ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${PLATFORM_BADGE_CLASS[item.platform] ?? "bg-neutral-500 text-white"}`}
        >
          {platLabel}
        </span>

        <ShopTypeBadge type={item.shop_type} />

        {urgency && (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${urgency.cls}`}
          >
            {urgency.text}
          </span>
        )}

        {isBestDeal && (
          <span className="inline-flex rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-black text-white">
            คุ้มสุดตอนนี้
          </span>
        )}

        {DATA_SOURCE_BADGE[item.data_source] && (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${DATA_SOURCE_BADGE[item.data_source]!.cls}`}
          >
            {DATA_SOURCE_BADGE[item.data_source]!.label}
          </span>
        )}

        {savingsPct > 0 && item.savingsReliable && (
          <span className="ml-auto inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
            ลด {savingsPct}%
          </span>
        )}
      </div>

      {/* ── Coupon Hero — PRIMARY value proposition ── */}
      <CouponHeroBanner item={item} />

      {/* ── Product info ── */}
      <div className="mt-3 flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
          <SafeImage
            src={item.image_url}
            alt={item.name}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-extrabold leading-snug text-black">
            {item.name}
          </p>
          {item.shop_name && (
            <p className="mt-1 truncate text-xs text-neutral-500">
              {item.shop_name}
            </p>
          )}

          {/* Trust signals */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {item.rating !== null && (
              <span className="text-xs font-semibold text-amber-500">
                ★ {item.rating.toFixed(1)}
              </span>
            )}
            {item.sold_count > 0 && (
              <span className="text-xs text-neutral-500">
                ขายแล้ว {fmt(item.sold_count)} ชิ้น
              </span>
            )}
            {item.click_count >= 5 && (
              <span className="text-xs font-semibold text-orange-500">
                🔥 {fmt(item.click_count)} คนใช้แล้ว
              </span>
            )}
            {getPriceCheckedLabel(item.price_checked_at) && (
              <span className="text-xs font-semibold text-green-600">
                ✅ {getPriceCheckedLabel(item.price_checked_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Price section ── */}
      <div className="mt-4 rounded-2xl bg-orange-50 p-4">
        {item.originalPrice > item.payNow && (
          <p className="text-xs text-neutral-400 line-through">
            ราคาปกติ {fmt(item.originalPrice)} บาท
          </p>
        )}

        {/* Effective net — large bold */}
        <p className={`mt-0.5 text-3xl font-black ${item.savingsReliable ? 'text-black' : 'text-neutral-500'}`}>
          {fmt(item.effectiveNet)}
          <span className="ml-1 text-base font-bold text-neutral-400">บาท</span>
        </p>
        <PriceDropBadge id={item.id} currentPrice={item.effectiveNet} name={item.name} />
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-neutral-500">
            {item.savingsReliable ? 'ราคาสุทธิ' : 'ราคาอ้างอิง'}
          </p>
          <PriceConfidenceBadge isReliable={item.priceFreshness.isReliable} />
        </div>

        <FreshnessMeta info={item.priceFreshness} label="อัปเดตล่าสุด" />

        <SavingsReceipt item={item} reliable={item.savingsReliable} />

        {/* Pay now (shown only when cashback makes effective net cheaper) */}
        {hasCashback && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm font-extrabold text-neutral-700">
              จ่ายหน้าเช็กเอาต์ {fmt(item.payNow)} บาท
            </p>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
              เหลือตามราคาสุทธิหลังแคชแบ็ก
            </span>
          </div>
        )}

        {/* ── ประหยัดไปกี่บาท ── */}
        {item.effectiveNet <= 0 && item.savingsReliable ? (
          <p className="mt-2 text-sm font-extrabold text-green-600">
            ฟรีเลย! 🎉
          </p>
        ) : savings > 0 && item.savingsReliable ? (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1">
            <span className="text-xs font-black text-green-700">ประหยัด {fmt(savings)} บาท</span>
            {savingsPct >= 10 && (
              <span className="text-xs font-bold text-green-600">({savingsPct}%)</span>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Deal Score + Composite Confidence (DEAL-CONFIDENCE-1) ── */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${DEAL_LABEL_BADGE[item.dealScore.label] ?? "bg-neutral-100 text-neutral-600"}`}
        >
          {DEAL_LABEL_TH[item.dealScore.label] ?? item.dealScore.label}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-1.5 rounded-full transition-all ${DEAL_SCORE_BAR[item.dealScore.label] ?? "bg-neutral-300"}`}
            style={{ width: `${item.dealScore.total}%` }}
          />
        </div>
        <span className="text-xs font-bold text-neutral-400">
          {item.dealScore.total} คะแนน
        </span>
        {/* Composite confidence: only show when high or medium — hide ต่ำ from UI */}
        {item.dealConfidence !== "ต่ำ" && (
          <span
            className={`ml-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
              item.dealConfidence === "สูง"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            ความเชื่อมั่น {item.dealConfidence}
          </span>
        )}
      </div>

      {/* ── Buy or Wait signal — hidden when no price history ── */}
      {buyOrWait.signal !== "LOW_CONFIDENCE" && (
        <BuyOrWaitBadge
          signal={buyOrWait.signal}
          label={buyOrWait.label}
          reason={buyOrWait.reason}
          priceDrop={buyOrWait.priceDrop}
        />
      )}

      {/* ── Urgency warning from explanation ── */}
      {item.explanation.alternative && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          ⚡ {item.explanation.alternative}
        </p>
      )}

      {/* ── CTA ── */}
      {item.has_affiliate_url ? (
        <CouponCTAButton
          goUrl={goUrl}
          couponCode={primaryCoupon?.code ?? null}
          isBestDeal={isBestDeal}
        />
      ) : (
        <div className="mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-neutral-100 px-6 py-4 text-sm font-semibold text-neutral-400">
          ยังไม่มีลิงก์สินค้า
        </div>
      )}
    </article>
  );
}
