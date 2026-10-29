import { Link } from "lakebed/client";
import { useEffect, useState } from "preact/hooks";
import {
  DEFAULT_SETTINGS,
  buildWhatsappUrl,
  discountFor,
  formatMoney,
  parseShipping,
  shippingCostFor,
  type AppliedPromotion,
  type SiteSettings
} from "../shared/config";
import { client } from "./api";
import { readCart, writeCart, type CartLine } from "./cart";
import { PromoField } from "./promo-field";
import { readPromo, writePromo } from "./promo";
import { Brand, DISPLAY_FONT, Icon, SANS_FONT, useFonts } from "./ui";

type Product = {
  id: string;
  name: string;
  price: number;
  collection: string;
  imageUrl: string;
  description: string;
  featured: boolean;
  position: number;
};

type Address = {
  name: string;
  phone: string;
  email: string;
  street: string;
  interior: string;
  colony: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

type Method = "card" | "paypal" | "transfer";

type OrderItem = { name: string; qty: number; total: number };

type Order = {
  id: string;
  method: Method;
  subtotal: number;
  discount: number;
  promoCode: string;
  shipping: number;
  total: number;
  items: OrderItem[];
};

const ADDRESS_KEY = "jf-lakebed-address-v1";

const EMPTY_ADDRESS: Address = {
  name: "",
  phone: "",
  email: "",
  street: "",
  interior: "",
  colony: "",
  city: "",
  state: "",
  zip: "",
  notes: ""
};

const EMPTY_CARD = { number: "", name: "", expiry: "", cvv: "" };

const METHODS: Array<{ id: Method; label: string; hint: string }> = [
  { id: "card", label: "Tarjeta", hint: "Débito o crédito" },
  { id: "paypal", label: "PayPal", hint: "Pago simulado" },
  { id: "transfer", label: "Transferencia", hint: "SPEI / depósito" }
];

const METHOD_LABEL: Record<Method, string> = {
  card: "Tarjeta",
  paypal: "PayPal",
  transfer: "Transferencia bancaria"
};

const INPUT_CLASS =
  "mt-2 w-full rounded-[2px] border border-[var(--field-edge)] bg-transparent px-4 py-3 text-[14px] outline-none transition focus:border-[var(--accent)]";
const LABEL_CLASS = "block text-[12px] font-medium tracking-[0.02em] text-[var(--muted)]";

function readAddress(): Address {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    if (!raw) return { ...EMPTY_ADDRESS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_ADDRESS };
    const next = { ...EMPTY_ADDRESS };
    for (const key of Object.keys(EMPTY_ADDRESS) as Array<keyof Address>) {
      const value = parsed[key];
      if (typeof value === "string") next[key] = value;
    }
    return next;
  } catch {
    return { ...EMPTY_ADDRESS };
  }
}

function onlyDigits(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max);
}

function formatCardNumber(value: string): string {
  return onlyDigits(value, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = onlyDigits(value, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function OrderThumb({ src }: { src: string }) {
  if (!src) {
    return (
      <span class="grid h-16 w-14 shrink-0 place-items-center rounded-[2px] bg-[var(--neutral)] text-[var(--muted)]">
        <Icon name="image" class="h-5 w-5 opacity-40" />
      </span>
    );
  }
  return <img class="h-16 w-14 shrink-0 rounded-[2px] bg-[var(--neutral)] object-cover" src={src} alt="" decoding="async" />;
}

export function Checkout() {
  useFonts();
  const productsQuery = client.useQuery("products");
  const settingsQuery = client.useQuery("settings");
  const products: Product[] = productsQuery ?? [];
  const settings: SiteSettings = { ...DEFAULT_SETTINGS, ...(settingsQuery ?? {}) };

  const [cart] = useState<CartLine[]>(readCart);
  const [address, setAddress] = useState<Address>(readAddress);
  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState(EMPTY_CARD);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [promoCode, setPromoCode] = useState(() => readPromo()?.code ?? "");
  const [promotion, setPromotion] = useState<AppliedPromotion | null>(readPromo);
  const [promoError, setPromoError] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const applyPromotion = client.useAction("applyPromotion");

  useEffect(() => {
    try {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
    } catch {
      /* storage can be unavailable */
    }
  }, [address]);

  const lines = cart
    .map((line) => {
      const product = products.find((item) => item.id === line.id);
      return product ? { ...line, product } : null;
    })
    .filter((line): line is CartLine & { product: Product } => Boolean(line));

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const discount = promotion && subtotal >= promotion.minSubtotal ? discountFor(subtotal, promotion) : 0;
  const netSubtotal = subtotal - discount;
  const shipping = shippingCostFor(netSubtotal, settings);
  const total = netSubtotal + shipping;
  const { freeFrom } = parseShipping(settings);

  function setField(key: keyof Address, value: string) {
    setAddress((current) => ({ ...current, [key]: value }));
  }

  async function onApplyPromo(event: SubmitEvent) {
    event.preventDefault();
    if (applyingPromo) return;
    const code = promoCode.trim();
    setPromoError("");

    if (!code) {
      setPromotion(null);
      writePromo(null);
      return;
    }

    setApplyingPromo(true);
    try {
      const result = await applyPromotion(code);
      if (!result.ok) {
        setPromotion(null);
        writePromo(null);
        setPromoError(result.error ?? "Código no válido.");
        return;
      }

      if (subtotal < result.promotion.minSubtotal) {
        setPromotion(null);
        writePromo(null);
        setPromoError(`Este código aplica desde ${formatMoney(result.promotion.minSubtotal)}.`);
        return;
      }

      setPromotion(result.promotion);
      setPromoCode(result.promotion.code);
      writePromo(result.promotion);
    } catch {
      setPromotion(null);
      writePromo(null);
      setPromoError("No pudimos validar el código.");
    } finally {
      setApplyingPromo(false);
    }
  }

  function removePromo() {
    setPromotion(null);
    setPromoCode("");
    setPromoError("");
    writePromo(null);
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (processing || order) return;
    setError("");

    if (lines.length === 0) {
      setError("Tu selección está vacía.");
      return;
    }

    if (method === "card") {
      if (onlyDigits(card.number, 16).length < 15) {
        setError("Revisa el número de tarjeta.");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
        setError("Revisa la fecha de vencimiento (MM/AA).");
        return;
      }
      if (onlyDigits(card.cvv, 4).length < 3) {
        setError("Revisa el CVV.");
        return;
      }
      if (!card.name.trim()) {
        setError("Escribe el nombre como aparece en la tarjeta.");
        return;
      }
    }

    const snapshot: Order = {
      id: `JF-${Math.floor(100000 + Math.random() * 900000)}`,
      method,
      subtotal,
      discount,
      promoCode: promotion?.code ?? "",
      shipping,
      total,
      items: lines.map((line) => ({
        name: line.product.name,
        qty: line.qty,
        total: line.product.price * line.qty
      }))
    };

    setProcessing(true);
    window.setTimeout(() => {
      setOrder(snapshot);
      writeCart([]);
      writePromo(null);
      setCard(EMPTY_CARD);
      setProcessing(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
  }

  const orderMessage = order
    ? [
        `Hola, acabo de hacer el pedido ${order.id} por ${formatMoney(order.total)} MXN.`,
        `Pago: ${METHOD_LABEL[order.method]}.`,
        order.discount > 0 ? `Descuento (${order.promoCode}): -${formatMoney(order.discount)} MXN.` : "",
        address.street
          ? `Envío a: ${address.street}${address.interior ? `, ${address.interior}` : ""}, ${address.colony}, ${address.city}, ${address.state}, CP ${address.zip}.`
          : "",
        "¿Me ayudan a coordinar la entrega?"
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div class="min-h-screen bg-[var(--paper)] text-[var(--ink)]" style={SANS_FONT}>
      <header class="sticky top-0 z-40 border-b border-[var(--ink-15)] bg-[var(--paper-95)] backdrop-blur-md">
        <div class="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-7 lg:px-9">
          <Link to="/" class="no-underline">
            <Brand />
          </Link>
          <Link class="text-[12.5px] text-[var(--muted)] underline-offset-4 transition hover:text-[var(--ink)] hover:underline" to="/">
            Volver a la tienda
          </Link>
        </div>
      </header>

      <main class="mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-7 lg:px-9 lg:py-14">
        {order ? (
          <section class="mx-auto max-w-[680px]">
            <span class="grid h-12 w-12 place-items-center rounded-full border border-[var(--accent-25)] text-[var(--accent)]">
              <Icon name="check" class="h-5 w-5" />
            </span>
            <h1 class="mt-6 text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT}>
              Pedido confirmado.
            </h1>
            <p class="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
              Gracias{address.name ? `, ${address.name.split(" ")[0]}` : ""}. Tu pedido <strong>{order.id}</strong> quedó registrado con pago por {METHOD_LABEL[order.method].toLowerCase()}.
            </p>
            <p class="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
              {order.method === "transfer"
                ? "Te compartiremos los datos bancarios por WhatsApp para completar la transferencia."
                : order.method === "paypal"
                  ? "Este es un pago de demostración: no se abrió PayPal ni se realizó ningún cargo."
                  : "Este es un pago de demostración: no se realizó ningún cargo a la tarjeta."}
            </p>

            <div class="mt-8 border-y border-[var(--ink-15)] py-5">
              <ul class="space-y-3">
                {order.items.map((item) => (
                  <li class="flex items-baseline justify-between gap-4 text-[13.5px]" key={`${item.name}-${item.qty}`}>
                    <span>{item.qty} × {item.name}</span>
                    <span class="font-medium">{formatMoney(item.total)}</span>
                  </li>
                ))}
              </ul>
              <dl class="mt-4 space-y-2 border-t border-[var(--ink-15)] pt-4 text-[13px]">
                <div class="flex items-baseline justify-between">
                  <dt class="text-[var(--muted)]">Subtotal</dt>
                  <dd>{formatMoney(order.subtotal)}</dd>
                </div>
                {order.discount > 0 ? (
                  <div class="flex items-baseline justify-between">
                    <dt class="text-[var(--muted)]">Descuento ({order.promoCode})</dt>
                    <dd class="text-[var(--accent)]">−{formatMoney(order.discount)}</dd>
                  </div>
                ) : null}
                <div class="flex items-baseline justify-between">
                  <dt class="text-[var(--muted)]">Envío</dt>
                  <dd>{order.shipping === 0 ? "Gratis" : formatMoney(order.shipping)}</dd>
                </div>
                <div class="flex items-baseline justify-between pt-2 text-[16px] font-semibold">
                  <dt>Total</dt>
                  <dd>{formatMoney(order.total)} MXN</dd>
                </div>
              </dl>
            </div>

            <div class="mt-8 flex flex-wrap items-center gap-3">
              <a
                class="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--accent)] px-6 py-3 text-[14px] font-medium text-[var(--button-ink)] transition-colors duration-200 hover:bg-[var(--accent-strong)]"
                href={buildWhatsappUrl(settings.whatsapp, orderMessage)}
                target="_blank"
                rel="noopener"
              >
                <Icon name="whatsapp" class="h-[1.15em] w-[1.15em]" /> Enviar por WhatsApp
              </a>
              <Link class="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--ink-15)] px-6 py-3 text-[13.5px] font-medium transition hover:border-[var(--ink)]" to="/">
                Volver a la tienda
              </Link>
            </div>
          </section>
        ) : productsQuery === undefined ? (
          <p class="py-16 text-center text-[14px] text-[var(--muted)]">Cargando tu selección…</p>
        ) : lines.length === 0 ? (
          <section class="mx-auto max-w-[560px] py-16 text-center">
            <h1 class="text-[clamp(2.2rem,5vw,3.2rem)] font-semibold leading-none" style={DISPLAY_FONT}>
              Tu selección está vacía.
            </h1>
            <p class="mt-4 text-[14px] leading-relaxed text-[var(--muted)]">
              Agrega una o varias piezas antes de finalizar la compra.
            </p>
            <Link class="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-[13.5px] font-medium text-[var(--button-ink)]" to="/">
              Ver la colección
            </Link>
          </section>
        ) : (
          <>
            <h1 class="text-[clamp(2.6rem,5.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT}>
              Finalizar compra
            </h1>
            <p class="mt-3 max-w-[52ch] text-[14px] leading-relaxed text-[var(--muted)]">
              Completa tus datos de envío y elige cómo pagar. Los pagos son de demostración: no se cobra nada.
            </p>

            <div class="mt-9 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
              <form class="space-y-9" onSubmit={(event) => onSubmit(event)}>
                <section aria-labelledby="shipping-title">
                  <h2 class="text-[22px] font-semibold leading-none" style={DISPLAY_FONT} id="shipping-title">
                    1. Datos de envío
                  </h2>
                  <div class="mt-5 grid gap-4 sm:grid-cols-2">
                    <div class="sm:col-span-2">
                      <label class={LABEL_CLASS} for="ship-name">Nombre completo</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-name"
                        autoComplete="name"
                        value={address.name}
                        onInput={(event) => setField("name", (event.target as HTMLInputElement).value)}
                        required
                        maxLength={90}
                      />
                    </div>
                    <div>
                      <label class={LABEL_CLASS} for="ship-phone">Teléfono</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={address.phone}
                        onInput={(event) => setField("phone", (event.target as HTMLInputElement).value)}
                        required
                        maxLength={24}
                      />
                    </div>
                    <div>
                      <label class={LABEL_CLASS} for="ship-email">Correo (opcional)</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-email"
                        type="email"
                        autoComplete="email"
                        value={address.email}
                        onInput={(event) => setField("email", (event.target as HTMLInputElement).value)}
                        maxLength={120}
                      />
                    </div>
                    <div class="sm:col-span-2">
                      <label class={LABEL_CLASS} for="ship-street">Calle y número</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-street"
                        autoComplete="address-line1"
                        value={address.street}
                        onInput={(event) => setField("street", (event.target as HTMLInputElement).value)}
                        required
                        maxLength={120}
                      />
                    </div>
                    <div>
                      <label class={LABEL_CLASS} for="ship-interior">Interior / depto (opcional)</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-interior"
                        autoComplete="address-line2"
                        value={address.interior}
                        onInput={(event) => setField("interior", (event.target as HTMLInputElement).value)}
                        maxLength={40}
                      />
                    </div>
                    <div>
                      <label class={LABEL_CLASS} for="ship-colony">Colonia</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-colony"
                        autoComplete="address-level3"
                        value={address.colony}
                        onInput={(event) => setField("colony", (event.target as HTMLInputElement).value)}
                        required
                        maxLength={80}
                      />
                    </div>
                    <div>
                      <label class={LABEL_CLASS} for="ship-city">Ciudad</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-city"
                        autoComplete="address-level2"
                        value={address.city}
                        onInput={(event) => setField("city", (event.target as HTMLInputElement).value)}
                        required
                        maxLength={80}
                      />
                    </div>
                    <div>
                      <label class={LABEL_CLASS} for="ship-state">Estado</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-state"
                        autoComplete="address-level1"
                        value={address.state}
                        onInput={(event) => setField("state", (event.target as HTMLInputElement).value)}
                        required
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <label class={LABEL_CLASS} for="ship-zip">Código postal</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-zip"
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        value={address.zip}
                        onInput={(event) => setField("zip", onlyDigits((event.target as HTMLInputElement).value, 5))}
                        required
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label class={LABEL_CLASS} for="ship-notes">Referencias (opcional)</label>
                      <input
                        class={INPUT_CLASS}
                        id="ship-notes"
                        value={address.notes}
                        onInput={(event) => setField("notes", (event.target as HTMLInputElement).value)}
                        maxLength={120}
                      />
                    </div>
                  </div>
                  <p class="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
                    Guardamos estos datos solo en este navegador para tu próxima compra.
                  </p>
                </section>

                <section aria-labelledby="payment-title">
                  <h2 class="text-[22px] font-semibold leading-none" style={DISPLAY_FONT} id="payment-title">
                    2. Pago
                  </h2>
                  <div class="mt-5 grid gap-3 sm:grid-cols-3">
                    {METHODS.map((item) => (
                      <button
                        class={`rounded-[2px] border px-4 py-3 text-left transition ${
                          method === item.id
                            ? "border-[var(--accent)] bg-[var(--accent-5)]"
                            : "border-[var(--ink-15)] hover:border-[var(--ink-40)]"
                        }`}
                        type="button"
                        aria-pressed={method === item.id}
                        onClick={() => {
                          setMethod(item.id);
                          setError("");
                        }}
                        key={item.id}
                      >
                        <span class="block text-[13.5px] font-medium">{item.label}</span>
                        <span class="mt-0.5 block text-[11px] text-[var(--muted)]">{item.hint}</span>
                      </button>
                    ))}
                  </div>

                  {method === "card" ? (
                    <div class="mt-5 grid gap-4 sm:grid-cols-2">
                      <div class="sm:col-span-2">
                        <label class={LABEL_CLASS} for="card-number">Número de tarjeta</label>
                        <input
                          class={INPUT_CLASS}
                          id="card-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="0000 0000 0000 0000"
                          value={card.number}
                          onInput={(event) => setCard({ ...card, number: formatCardNumber((event.target as HTMLInputElement).value) })}
                          required
                          maxLength={19}
                        />
                      </div>
                      <div class="sm:col-span-2">
                        <label class={LABEL_CLASS} for="card-name">Nombre en la tarjeta</label>
                        <input
                          class={INPUT_CLASS}
                          id="card-name"
                          autoComplete="off"
                          value={card.name}
                          onInput={(event) => setCard({ ...card, name: (event.target as HTMLInputElement).value })}
                          required
                          maxLength={80}
                        />
                      </div>
                      <div>
                        <label class={LABEL_CLASS} for="card-expiry">Vencimiento</label>
                        <input
                          class={INPUT_CLASS}
                          id="card-expiry"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="MM/AA"
                          value={card.expiry}
                          onInput={(event) => setCard({ ...card, expiry: formatExpiry((event.target as HTMLInputElement).value) })}
                          required
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label class={LABEL_CLASS} for="card-cvv">CVV</label>
                        <input
                          class={INPUT_CLASS}
                          id="card-cvv"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="123"
                          value={card.cvv}
                          onInput={(event) => setCard({ ...card, cvv: onlyDigits((event.target as HTMLInputElement).value, 4) })}
                          required
                          maxLength={4}
                        />
                      </div>
                      <p class="sm:col-span-2 text-[11px] leading-relaxed text-[var(--muted)]">
                        Pago de demostración. No uses datos reales: la tarjeta no se guarda ni se envía a ningún lado.
                      </p>
                    </div>
                  ) : method === "paypal" ? (
                    <p class="mt-5 rounded-[2px] border border-[var(--ink-15)] bg-[var(--card)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
                      Al confirmar se simula el pago con PayPal. No se abre una ventana ni se realiza ningún cargo.
                    </p>
                  ) : (
                    <p class="mt-5 rounded-[2px] border border-[var(--ink-15)] bg-[var(--card)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
                      Al confirmar, tu pedido queda reservado y te compartimos los datos bancarios por WhatsApp para la transferencia o el depósito (SPEI).
                    </p>
                  )}
                </section>

                {error ? <p class="text-[13px] text-[var(--danger)]" role="alert">{error}</p> : null}

                <button
                  class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-[14px] font-medium text-[var(--button-ink)] transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
                  type="submit"
                  disabled={processing}
                >
                  {processing
                    ? "Procesando…"
                    : method === "transfer"
                      ? `Confirmar pedido · ${formatMoney(total)} MXN`
                      : `Pagar ${formatMoney(total)} MXN`}
                </button>
                <p class="-mt-4 text-center text-[11px] text-[var(--muted)]">
                  Pago seguro de demostración. No se realizan cargos reales.
                </p>
              </form>

              <aside class="h-fit lg:sticky lg:top-24">
                <div class="border border-[var(--ink-15)] bg-[var(--card)] p-5 sm:p-6">
                  <div class="flex items-baseline justify-between gap-4">
                    <h2 class="text-[24px] font-semibold leading-none" style={DISPLAY_FONT}>Tu pedido</h2>
                    <Link class="text-[11.5px] text-[var(--muted)] underline underline-offset-4 hover:text-[var(--ink)]" to="/">
                      Editar
                    </Link>
                  </div>
                  <ul class="mt-5 space-y-4">
                    {lines.map((line) => (
                      <li class="flex gap-3" key={line.id}>
                        <OrderThumb src={line.product.imageUrl} />
                        <div class="flex min-w-0 flex-1 flex-col">
                          <p class="text-[15px] font-semibold leading-tight" style={DISPLAY_FONT}>{line.product.name}</p>
                          <p class="mt-1 text-[11.5px] text-[var(--muted)]">
                            {line.qty} × {formatMoney(line.product.price)}
                          </p>
                        </div>
                        <span class="whitespace-nowrap text-[12.5px] font-medium">
                          {formatMoney(line.product.price * line.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <PromoField
                    class="mt-5"
                    value={promoCode}
                    promotion={promotion}
                    discount={discount}
                    error={promoError}
                    applying={applyingPromo}
                    onApply={onApplyPromo}
                    onChange={(value) => {
                      setPromoCode(value);
                      setPromoError("");
                      if (promotion) {
                        setPromotion(null);
                        writePromo(null);
                      }
                    }}
                    onRemove={removePromo}
                  />
                  <div class="mt-5 space-y-2 border-t border-[var(--ink-15)] pt-4 text-[13px]">
                    <div class="flex items-baseline justify-between">
                      <span class="text-[var(--muted)]">Subtotal</span>
                      <span class="font-medium">{formatMoney(subtotal)}</span>
                    </div>
                    {discount > 0 ? (
                      <div class="flex items-baseline justify-between">
                        <span class="text-[var(--muted)]">Descuento ({promotion?.code})</span>
                        <span class="font-medium text-[var(--accent)]">−{formatMoney(discount)}</span>
                      </div>
                    ) : null}
                    <div class="flex items-baseline justify-between">
                      <span class="text-[var(--muted)]">Envío</span>
                      <span class="font-medium">{shipping === 0 ? "Gratis" : formatMoney(shipping)}</span>
                    </div>
                    {shipping > 0 && freeFrom > 0 && netSubtotal < freeFrom ? (
                      <p class="text-[11px] leading-relaxed text-[var(--muted)]">
                        Te faltan {formatMoney(freeFrom - netSubtotal)} para envío gratis.
                      </p>
                    ) : null}
                    <div class="flex items-baseline justify-between border-t border-[var(--ink-15)] pt-3">
                      <span class="text-[12px] text-[var(--muted)]">Total</span>
                      <span class="text-[24px] font-semibold leading-none" style={DISPLAY_FONT}>
                        {formatMoney(total)} <span class="text-[10.5px] font-normal text-[var(--muted)]" style={SANS_FONT}>MXN</span>
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
