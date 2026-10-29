export type CartLine = { id: string; qty: number };

export const CART_KEY = "jf-lakebed-cart-v1";
export const MAX_QTY = 10;

export function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line) => line && typeof line.id === "string" && Number.isInteger(line.qty) && line.qty > 0)
      .map((line) => ({ id: line.id, qty: Math.min(line.qty, MAX_QTY) }));
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* storage can be unavailable */
  }
}
