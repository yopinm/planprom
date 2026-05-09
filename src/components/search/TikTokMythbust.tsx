// TT-MYTHBUST-1: TikTok Mythbusting component
// Shows "TikTok claimed X฿ → actual net price after coupon stacking = Y฿"
"use client";

import { buildMythbustSummary } from "@/lib/tiktok-mythbust";
import type { MythbustEntry } from "@/lib/tiktok-mythbust";

interface Props {
  entry: MythbustEntry;
}

export function TikTokMythbust({ entry }: Props) {
  const summary = buildMythbustSummary(entry);

  const verdictColor =
    summary.verdict === "cheaper"
      ? "border-green-300 bg-green-50"
      : summary.verdict === "pricier"
        ? "border-red-200 bg-red-50"
        : "border-neutral-200 bg-white";

  const verdictBadge =
    summary.verdict === "cheaper"
      ? { text: "ถูกกว่า TikTok บอก", cls: "bg-green-500 text-white" }
      : summary.verdict === "pricier"
        ? { text: "แพงกว่า TikTok บอก", cls: "bg-red-500 text-white" }
        : { text: "ราคาตรงกัน", cls: "bg-neutral-400 text-white" };

  return (
    <div className={`rounded-3xl border-2 ${verdictColor} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎬</span>
        <span className="text-xs font-black uppercase tracking-widest text-neutral-500">
          TikTok Mythbust — {entry.product_name}
        </span>
        <span
          className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-black ${verdictBadge.cls}`}
        >
          {verdictBadge.text}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white border border-neutral-100 p-3 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">
            TikTok บอกว่า
          </p>
          <p className="text-xl font-black text-red-500 line-through">
            {entry.viral_price.toLocaleString("th-TH")}
            <span className="text-sm ml-0.5">฿</span>
          </p>
        </div>

        <div className="rounded-xl bg-white border border-green-200 p-3 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-green-600 mb-1">
            จ่ายจริง
          </p>
          <p className="text-xl font-black text-green-600">
            {entry.actual_net.toLocaleString("th-TH")}
            <span className="text-sm ml-0.5">฿</span>
          </p>
        </div>
      </div>

      {entry.coupons_applied.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {entry.coupons_applied.slice(0, 3).map((c, i) => (
            <span
              key={i}
              className="rounded-full border border-dashed border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-black text-orange-600"
            >
              {c}
            </span>
          ))}
          {entry.coupons_applied.length > 3 && (
            <span className="rounded-full border border-dashed border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-black text-orange-400">
              +{entry.coupons_applied.length - 3} คูปอง
            </span>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500 leading-5">
        {summary.reality}
      </p>

      {entry.saving_vs_viral > 0 && (
        <p className="mt-2 text-sm font-black text-green-600">
          ประหยัดกว่าที่ TikTok บอก{" "}
          {entry.saving_vs_viral.toLocaleString("th-TH")} บาท
        </p>
      )}
    </div>
  );
}
