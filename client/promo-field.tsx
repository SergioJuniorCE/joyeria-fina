import { formatMoney, type AppliedPromotion } from "../shared/config";

export function PromoField({
  value,
  promotion,
  discount,
  error,
  applying,
  onApply,
  onChange,
  onRemove,
  class: className = ""
}: {
  value: string;
  promotion: AppliedPromotion | null;
  discount: number;
  error: string;
  applying: boolean;
  onApply: (event: SubmitEvent) => void;
  onChange: (value: string) => void;
  onRemove: () => void;
  class?: string;
}) {
  return (
    <form class={className} onSubmit={onApply}>
      <label class="block text-[12px] font-medium text-[var(--muted)]" for="promo-code">
        Código de descuento
      </label>
      <div class="mt-2 flex gap-2">
        <input
          class="min-w-0 flex-1 rounded-full border border-[var(--field-edge)] bg-transparent px-4 py-2.5 text-[14px] uppercase outline-none transition focus:border-[var(--accent)]"
          id="promo-code"
          value={value}
          placeholder="PROMO10"
          autoComplete="off"
          maxLength={24}
          onInput={(event) => onChange((event.target as HTMLInputElement).value.toUpperCase())}
        />
        <button
          class="rounded-full border border-[var(--ink-20)] px-4 py-2.5 text-[12px] font-medium transition hover:border-[var(--ink)] disabled:opacity-50"
          type="submit"
          disabled={applying}
        >
          {applying ? "…" : "Aplicar"}
        </button>
      </div>
      {error ? <p class="mt-2 text-[12px] text-[var(--danger)]" role="alert">{error}</p> : null}
      {promotion ? (
        <p class="mt-2 text-[12px] text-[var(--accent)]">
          {promotion.code} aplicado: −{formatMoney(discount)}.
          <button class="ml-2 underline underline-offset-4" type="button" onClick={onRemove}>
            Quitar
          </button>
        </p>
      ) : null}
    </form>
  );
}
