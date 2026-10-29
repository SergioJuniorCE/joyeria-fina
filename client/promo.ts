import type { AppliedPromotion } from "../shared/config";

const PROMO_KEY = "jf-lakebed-promo-v1";

export function readPromo(): AppliedPromotion | null {
  try {
    const raw = localStorage.getItem(PROMO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.code !== "string" || !parsed.code) return null;
    if (parsed.kind !== "percent" && parsed.kind !== "fixed") return null;
    if (typeof parsed.value !== "number" || !Number.isFinite(parsed.value)) return null;
    return {
      code: parsed.code,
      kind: parsed.kind,
      value: parsed.value,
      minSubtotal: typeof parsed.minSubtotal === "number" && Number.isFinite(parsed.minSubtotal) ? parsed.minSubtotal : 0
    };
  } catch {
    return null;
  }
}

export function writePromo(promotion: AppliedPromotion | null): void {
  try {
    if (promotion) localStorage.setItem(PROMO_KEY, JSON.stringify(promotion));
    else localStorage.removeItem(PROMO_KEY);
  } catch {
    /* storage can be unavailable */
  }
}
