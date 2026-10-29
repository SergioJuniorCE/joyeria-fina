import { Link } from "lakebed/client";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  buildWhatsappUrl,
  CATEGORY_DESC,
  CATEGORY_LABEL,
  COLLECTIONS,
  DEFAULT_SETTINGS,
  formatMoney,
  formatPhone,
  normalizeSearch,
  type SiteSettings
} from "../shared/config";
import { client } from "./api";
import { Brand, DISPLAY_FONT, Icon, Modal, SANS_FONT, Toast, useFonts } from "./ui";

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

type CartLine = { id: string; qty: number };

const CART_KEY = "jf-lakebed-cart-v1";
const MAX_QTY = 10;
const PAGE_SIZE = 12;

function readCart(): CartLine[] {
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

function ProductImage({
  src,
  alt,
  class: className,
  loading = "lazy"
}: {
  src: string;
  alt: string;
  class?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span class={`grid place-items-center bg-[#e8e7e1] text-[#565b64] ${className ?? ""}`}>
        <Icon name="image" class="h-8 w-8 opacity-50" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      class={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function HeroProducts({
  products,
  settings,
  onQuick
}: {
  products: Product[];
  settings: SiteSettings;
  onQuick: (id: string) => void;
}) {
  const heroProduct = products.find((product) => product.featured) ?? products[0];
  const heroImage = settings.heroImageUrl || heroProduct?.imageUrl || "";
  const headlineLines = settings.heroHeadline
    .split(".")
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = headlineLines[0] ? `${headlineLines[0]}.` : "Piezas pequeñas.";
  const secondLine = headlineLines.length > 1 ? `${headlineLines.slice(1).join(". ")}.` : "Brillo que dura.";

  return (
    <section class="relative overflow-hidden" aria-labelledby="hero-title">
      <div class="mx-auto grid w-full max-w-[1320px] items-center gap-10 px-5 py-10 sm:px-7 sm:py-14 lg:grid-cols-[1.03fr_.97fr] lg:gap-16 lg:px-9 lg:py-20 xl:gap-24">
        <div class="max-w-[560px]">
          <p class="mb-5 text-[11px] uppercase tracking-[0.2em] text-[#565b64]" style={SANS_FONT}>
            {settings.heroEyebrow}
          </p>
          <h1
            id="hero-title"
            class="font-semibold leading-[0.98] tracking-[-0.025em]"
            style={{ ...DISPLAY_FONT, fontSize: "clamp(3rem, 5.8vw, 5rem)" }}
          >
            <span class="block">{firstLine}</span>
            <span class="mt-1 block font-normal italic leading-[1.08]">{secondLine}</span>
          </h1>
          <p class="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-[#565b64] sm:text-[17px]">
            {settings.heroSubtext}
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <a
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-[#203a6b] px-6 py-3 text-[13.5px] font-medium leading-none tracking-[0.02em] text-[#f7f6f1] transition hover:bg-[#16294d] active:scale-[0.99]"
              href="#coleccion"
            >
              Ver la colección
            </a>
            <a
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#14171c]/80 px-6 py-3 text-[13.5px] font-medium leading-none tracking-[0.02em] text-[#14171c] transition hover:bg-[#14171c] hover:text-[#f2f1ec] active:scale-[0.99]"
              href="#como-comprar"
            >
              Cómo comprar
            </a>
          </div>
        </div>

        <div class="relative mx-auto w-full max-w-[540px] lg:mr-0">
          <span class="absolute -bottom-4 -left-4 h-3/4 w-3/4 border border-[#14171c]/15 bg-[#e8e7e1]/70" aria-hidden="true" />
          <figure class="relative aspect-[4/5] overflow-hidden rounded-b-[2px] rounded-t-[999px] border border-[#14171c]/10 bg-[#e8e7e1]">
            {heroImage ? (
              <ProductImage
                src={heroImage}
                alt="Broqueles de oro de 10 kt"
                class="h-full w-full object-cover object-[50%_38%]"
                loading="eager"
              />
            ) : (
              <span class="grid h-full w-full place-items-center text-[#565b64]">
                <Icon name="image" class="h-12 w-12 opacity-30" />
              </span>
            )}
          </figure>
          {heroProduct ? (
            <button
              class="absolute -left-2 bottom-5 w-[132px] border border-[#14171c]/16 bg-[#faf9f5] p-2 text-left shadow-[0_24px_50px_-30px_rgba(20,23,28,.55)] transition hover:-translate-y-1 sm:-left-8 sm:bottom-8 sm:w-[172px] sm:p-2.5"
              type="button"
              onClick={() => onQuick(heroProduct.id)}
              aria-label={`Ver ${heroProduct.name}, ${formatMoney(heroProduct.price)}`}
            >
              <ProductImage src={heroProduct.imageUrl} alt="" class="aspect-[7/8] w-full object-cover" />
              <span class="flex items-baseline justify-between gap-2 pt-2">
                <span class="text-[15px] font-semibold leading-tight sm:text-[17px]" style={DISPLAY_FONT}>
                  {heroProduct.name.replace(/^Broquel /, "")}
                </span>
                <span class="text-[11px] font-medium sm:text-xs">{formatMoney(heroProduct.price)}</span>
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TrustStrip({ settings }: { settings: SiteSettings }) {
  const items = [
    { icon: "check" as const, label: "Oro de 10 kt" },
    { icon: "bag" as const, label: settings.shippingNote },
    { icon: "whatsapp" as const, label: "Pedidos por WhatsApp" },
    { icon: "heart" as const, label: "Piezas seleccionadas" }
  ];

  return (
    <section class="border-y border-[#14171c]/15 bg-[#f2f1ec]" aria-label="Información de compra">
      <div class="mx-auto grid w-full max-w-[1320px] grid-cols-2 gap-x-5 gap-y-3 px-5 py-4 text-[12px] text-[#565b64] sm:flex sm:items-center sm:justify-between sm:px-7 sm:py-5 lg:px-9">
        {items.map((item) => (
          <span class="inline-flex items-center gap-2" key={item.label}>
            <Icon name={item.icon} class="h-4 w-4 text-[#203a6b]" />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, onQuick, onAdd }: { product: Product; onQuick: (id: string) => void; onAdd: (id: string) => void }) {
  return (
    <article class="group flex flex-col">
      <div class="relative aspect-[7/8] overflow-hidden rounded-[2px] bg-[#e8e7e1]">
        <button class="block h-full w-full cursor-zoom-in" type="button" onClick={() => onQuick(product.id)} aria-label={`Ver ${product.name}`}>
          <ProductImage
            src={product.imageUrl}
            alt=""
            class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
        </button>
        <button
          class="absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full border border-[#14171c]/15 bg-[#faf9f5]/95 text-[#14171c] shadow-sm transition duration-300 hover:bg-white active:scale-95 sm:bottom-3 sm:right-3 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          type="button"
          onClick={() => onAdd(product.id)}
          aria-label={`Añadir ${product.name} a la selección`}
        >
          <Icon name="bag" class="h-[18px] w-[18px]" />
        </button>
      </div>
      <div class="pt-3">
        <p class="text-[11px] text-[#565b64]">{CATEGORY_LABEL[product.collection] ?? "Joyería"}</p>
        <button
          class="mt-1 block text-left text-[19px] font-semibold leading-[1.15] tracking-[-0.01em] transition hover:text-[#203a6b] sm:text-[21px]"
          style={DISPLAY_FONT}
          type="button"
          onClick={() => onQuick(product.id)}
        >
          {product.name}
        </button>
        <p class="mt-1 text-[13px] font-medium">{formatMoney(product.price)}</p>
      </div>
    </article>
  );
}

function QuickView({
  product,
  qty,
  onClose,
  onQty,
  onAdd
}: {
  product: Product | null;
  qty: number;
  onClose: () => void;
  onQty: (next: number) => void;
  onAdd: () => void;
}) {
  return (
    <Modal open={Boolean(product)} onClose={onClose} label={product ? product.name : "Producto"} class="max-w-[960px]">
      {product ? (
        <div class="relative grid md:grid-cols-2">
          <button
            class="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-[#14171c]/15 bg-[#f2f1ec]/90 text-[#14171c] transition hover:border-[#14171c]"
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista del producto"
          >
            <Icon name="x" />
          </button>
          <div class="bg-[#e8e7e1]">
            <ProductImage src={product.imageUrl} alt={product.name} class="aspect-[7/8] h-full w-full object-cover" />
          </div>
          <div class="p-6 sm:p-8 lg:p-10">
            <p class="text-[11px] uppercase tracking-[0.16em] text-[#565b64]">{CATEGORY_LABEL[product.collection] ?? "Joyería"}</p>
            <h2 class="mt-2 text-[clamp(2rem,3.4vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT}>
              {product.name}
            </h2>
            <p class="mt-3 text-[15px] font-medium">{formatMoney(product.price)} MXN</p>
            <p class="mt-4 max-w-[40ch] text-[14.5px] leading-relaxed text-[#565b64]">
              {product.description || CATEGORY_DESC[product.collection] || "Broquel en oro de 10 kt. Se vende por par."}
            </p>
            <ul class="mt-6 space-y-2 text-[13.5px] text-[#565b64]">
              <li class="flex items-center gap-2"><Icon name="check" class="h-4 w-4 text-[#203a6b]" /> Oro de 10 kt</li>
              <li class="flex items-center gap-2"><Icon name="check" class="h-4 w-4 text-[#203a6b]" /> Se vende por par</li>
              <li class="flex items-center gap-2"><Icon name="check" class="h-4 w-4 text-[#203a6b]" /> Envío a todo México</li>
            </ul>
            <div class="mt-8 flex flex-wrap items-center gap-3">
              <div class="inline-flex h-11 items-center rounded-full border border-[#14171c]/15" aria-label="Cantidad">
                <button
                  class="grid h-11 w-10 place-items-center rounded-full transition hover:text-[#203a6b] disabled:opacity-30"
                  type="button"
                  onClick={() => onQty(qty - 1)}
                  disabled={qty <= 1}
                  aria-label="Quitar uno"
                >
                  <Icon name="minus" class="h-3.5 w-3.5" />
                </button>
                <span class="w-8 text-center text-[14px]">{qty}</span>
                <button
                  class="grid h-11 w-10 place-items-center rounded-full transition hover:text-[#203a6b] disabled:opacity-30"
                  type="button"
                  onClick={() => onQty(qty + 1)}
                  disabled={qty >= MAX_QTY}
                  aria-label="Añadir uno"
                >
                  <Icon name="plus" class="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                class="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#203a6b] px-6 py-3 text-[13.5px] font-medium text-[#f7f6f1] transition hover:bg-[#16294d] sm:flex-none"
                type="button"
                onClick={onAdd}
              >
                Añadir a la selección
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function CartDrawer({
  open,
  lines,
  products,
  onClose,
  onQty,
  onRemove,
  onCheckout,
  whatsapp
}: {
  open: boolean;
  lines: CartLine[];
  products: Product[];
  onClose: () => void;
  onQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  whatsapp: string;
}) {
  const detailed = lines
    .map((line) => ({ ...line, product: products.find((product) => product.id === line.id) }))
    .filter((line): line is CartLine & { product: Product } => Boolean(line.product));
  const total = detailed.reduce((sum, line) => sum + line.product.price * line.qty, 0);

  if (!open) return null;

  return (
    <div
      class="fixed inset-0 z-50 flex justify-end bg-[#090b0f]/60 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside class="flex h-full w-full max-w-[440px] flex-col bg-[#f2f1ec] text-[#14171c]" role="dialog" aria-modal="true" aria-label="Tu selección">
        <div class="flex items-center justify-between border-b border-[#14171c]/15 px-5 py-5 sm:px-6">
          <h2 class="text-[28px] font-semibold leading-none" style={DISPLAY_FONT}>Tu selección</h2>
          <button
            class="grid h-10 w-10 place-items-center rounded-full border border-[#14171c]/15 transition hover:border-[#14171c]"
            type="button"
            onClick={onClose}
            aria-label="Cerrar selección"
          >
            <Icon name="x" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {detailed.length === 0 ? (
            <div class="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
              <p class="text-[30px] font-semibold leading-none" style={DISPLAY_FONT}>Tu selección está vacía.</p>
              <p class="max-w-[28ch] text-[13.5px] leading-relaxed text-[#565b64]">
                Explora la colección y guarda tus piezas favoritas aquí.
              </p>
              <a class="inline-flex items-center justify-center rounded-full border border-[#14171c]/15 px-6 py-3 text-[13.5px] font-medium transition hover:border-[#14171c]" href="#coleccion" onClick={onClose}>
                Ver la colección
              </a>
            </div>
          ) : (
            detailed.map((line) => (
              <div class="flex gap-4 border-b border-[#14171c]/15 py-4 first:pt-0" key={line.id}>
                <ProductImage src={line.product.imageUrl} alt={line.product.name} class="h-[72px] w-16 shrink-0 rounded-[2px] bg-[#e8e7e1] object-cover" />
                <div class="flex min-w-0 flex-1 flex-col">
                  <div class="flex items-start justify-between gap-3">
                    <p class="text-[18px] font-semibold leading-tight" style={DISPLAY_FONT}>{line.product.name}</p>
                    <button class="shrink-0 text-[11px] text-[#565b64] underline underline-offset-4 transition hover:text-[#14171c]" type="button" onClick={() => onRemove(line.id)}>
                      Quitar
                    </button>
                  </div>
                  <p class="mt-1 text-[12.5px] text-[#565b64]">{formatMoney(line.product.price)} c/u</p>
                  <div class="mt-auto flex items-center justify-between gap-3 pt-3">
                    <div class="inline-flex h-9 items-center rounded-full border border-[#14171c]/15">
                      <button class="grid h-9 w-8 place-items-center rounded-full transition hover:text-[#203a6b]" type="button" onClick={() => onQty(line.id, -1)} aria-label={`Quitar uno de ${line.product.name}`}>
                        <Icon name="minus" class="h-3.5 w-3.5" />
                      </button>
                      <span class="w-6 text-center text-[12px]">{line.qty}</span>
                      <button class="grid h-9 w-8 place-items-center rounded-full transition hover:text-[#203a6b] disabled:opacity-30" type="button" onClick={() => onQty(line.id, 1)} disabled={line.qty >= MAX_QTY} aria-label={`Añadir uno de ${line.product.name}`}>
                        <Icon name="plus" class="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span class="text-[13px] font-medium">{formatMoney(line.product.price * line.qty)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div class="border-t border-[#14171c]/15 px-5 py-5 sm:px-6">
          {detailed.length === 0 ? (
            <p class="text-center text-[11px] leading-relaxed text-[#565b64]">{whatsapp ? "Pago por transferencia, depósito o efectivo. Envíos a todo México." : ""}</p>
          ) : (
            <div class="space-y-4">
              <div class="flex items-baseline justify-between border-b border-[#14171c]/15 pb-4">
                <span class="text-[11px] uppercase tracking-[0.14em] text-[#565b64]">Subtotal</span>
                <span class="text-[28px] font-semibold leading-none" style={DISPLAY_FONT}>
                  {formatMoney(total)} <span class="text-[11px] font-normal text-[#565b64]" style={SANS_FONT}>MXN</span>
                </span>
              </div>
              <p class="text-[12px] leading-relaxed text-[#565b64]">El envío se coordina por WhatsApp. Pago por transferencia, depósito o efectivo.</p>
              <button
                class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#203a6b] px-6 py-3 text-[13.5px] font-medium text-[#f7f6f1] transition hover:bg-[#16294d]"
                type="button"
                onClick={onCheckout}
              >
                <Icon name="whatsapp" class="h-[1.15em] w-[1.15em]" /> Pedir por WhatsApp
              </button>
              <button
                class="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#14171c]/15 px-6 py-3 text-[13.5px] font-medium transition hover:border-[#14171c]"
                type="button"
                onClick={onClose}
              >
                Seguir explorando
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function MenuSheet({ open, onClose, whatsapp, instagram }: { open: boolean; onClose: () => void; whatsapp: string; instagram: string }) {
  if (!open) return null;
  return (
    <div class="fixed inset-0 z-50 flex flex-col bg-[#f2f1ec] text-[#14171c]" role="dialog" aria-modal="true" aria-label="Menú">
      <div class="flex items-center justify-between border-b border-[#14171c]/15 px-5 py-5 sm:px-6">
        <Brand />
        <button class="grid h-10 w-10 place-items-center rounded-full border border-[#14171c]/15" type="button" onClick={onClose} aria-label="Cerrar menú">
          <Icon name="x" />
        </button>
      </div>
      <nav class="flex flex-1 flex-col px-5 py-6 sm:px-6" aria-label="Navegación móvil">
        {[
          ["#coleccion", "Colección"],
          ["#favoritos", "Favoritos"],
          ["#como-comprar", "Cómo comprar"],
          ["#contacto", "Contacto"]
        ].map(([href, label]) => (
          <a class="border-b border-[#14171c]/15 py-5 text-[34px] font-semibold leading-none tracking-[-0.02em] transition hover:text-[#203a6b]" style={DISPLAY_FONT} href={href} onClick={onClose} key={href}>
            {label}
          </a>
        ))}
      </nav>
      <div class="flex flex-col items-start gap-4 border-t border-[#14171c]/15 px-5 py-6 sm:px-6">
        <a class="inline-flex items-center justify-center rounded-full bg-[#203a6b] px-6 py-3 text-[13.5px] font-medium text-[#f7f6f1]" href="#coleccion" onClick={onClose}>
          Ver la colección
        </a>
        <a class="inline-flex items-center gap-2 text-[13px] text-[#565b64] transition hover:text-[#14171c]" href={buildWhatsappUrl(whatsapp, "Hola, me gustaría saber más de la colección.")} target="_blank" rel="noopener">
          <Icon name="whatsapp" /> WhatsApp {formatPhone(whatsapp)}
        </a>
        <a class="inline-flex items-center gap-2 text-[13px] text-[#565b64] transition hover:text-[#14171c]" href={`https://www.instagram.com/${instagram}/`} target="_blank" rel="noopener">
          <Icon name="instagram" /> @{instagram}
        </a>
      </div>
    </div>
  );
}

export function Shop() {
  useFonts();
  const productsQuery = client.useQuery("products");
  const settingsQuery = client.useQuery("settings");
  const products: Product[] = productsQuery ?? [];
  const productsLoaded = productsQuery !== undefined;
  const settings: SiteSettings = { ...DEFAULT_SETTINGS, ...(settingsQuery ?? {}) };

  const [cart, setCart] = useState<CartLine[]>(readCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickId, setQuickId] = useState<string | null>(null);
  const [quickQty, setQuickQty] = useState(1);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);
  const [collection, setCollection] = useState("todos");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("destacados");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* storage can be unavailable */
    }
  }, [cart]);

  useEffect(() => {
    if (!productsLoaded) return;
    setCart((previous) => {
      const next = previous.filter((line) => products.some((product) => product.id === line.id));
      return next.length === previous.length ? previous : next;
    });
  }, [productsLoaded, productsQuery]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCartOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = cartOpen || menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, menuOpen]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  }

  function addToCart(id: string, qty = 1) {
    const product = products.find((item) => item.id === id);
    if (!product) return false;
    const existing = cart.find((item) => item.id === id);
    if (existing && existing.qty >= MAX_QTY) {
      showToast("Máximo 10 piezas por diseño.");
      return false;
    }
    setCart((previous) => {
      const line = previous.find((item) => item.id === id);
      if (line) {
        return previous.map((item) => (item.id === id ? { ...item, qty: Math.min(item.qty + qty, MAX_QTY) } : item));
      }
      return [...previous, { id, qty: Math.min(qty, MAX_QTY) }];
    });
    showToast(`${product.name} se añadió a tu selección.`);
    return true;
  }

  function changeQty(id: string, delta: number) {
    setCart((previous) =>
      previous
        .map((line) => (line.id === id ? { ...line, qty: Math.min(MAX_QTY, Math.max(0, line.qty + delta)) } : line))
        .filter((line) => line.qty > 0)
    );
  }

  function removeFromCart(id: string) {
    const product = products.find((item) => item.id === id);
    setCart((previous) => previous.filter((line) => line.id !== id));
    if (product) showToast(`Quitaste ${product.name}.`);
  }

  const featured = products.filter((product) => product.featured);
  const heroProducts = (featured.length >= 3 ? featured : [...featured, ...products.filter((product) => !product.featured)]).slice(0, 3);

  const normalizedQuery = normalizeSearch(query);
  let filtered = products.filter((product) => {
    const matchesCollection = collection === "todos" || product.collection === collection;
    const haystack = normalizeSearch(`${product.name} ${CATEGORY_LABEL[product.collection] ?? ""}`);
    return matchesCollection && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  if (sort === "precio-asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sort === "precio-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sort === "nombre") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "es"));
  else filtered = [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured));

  const shown = filtered.slice(0, visible);
  const quickProduct = products.find((product) => product.id === quickId) ?? null;
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const cartTotal = cart.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.id);
    return sum + (product ? product.price * line.qty : 0);
  }, 0);

  function checkout() {
    const lines = cart
      .map((line) => {
        const product = products.find((item) => item.id === line.id);
        return product ? `- ${line.qty} x ${product.name}: ${formatMoney(product.price * line.qty)}` : "";
      })
      .filter(Boolean);
    if (lines.length === 0) return;
    const message = ["Hola, quiero pedir:", "", ...lines, "", `Subtotal: ${formatMoney(cartTotal)} MXN`, "", "¿Me ayudan a coordinar el envío?"].join("\n");
    window.open(buildWhatsappUrl(settings.whatsapp, message), "_blank", "noopener");
  }

  return (
    <div style={SANS_FONT} class="min-h-screen bg-[#f2f1ec] text-[#14171c]">
      <div class="bg-[#111419] text-[#f2f0ea]">
        <div class="mx-auto flex h-9 w-full max-w-[1320px] items-center justify-center gap-4 px-5 text-[10px] uppercase tracking-[0.16em] sm:gap-8 sm:px-7 lg:px-9">
          <span>Oro de 10 kt</span>
          <span class="h-3 w-px bg-[#f2f0ea]/25" aria-hidden="true" />
          <span>{settings.shippingNote}</span>
          <span class="hidden h-3 w-px bg-[#f2f0ea]/25 sm:block" aria-hidden="true" />
          <span class="hidden sm:inline">Pedidos por WhatsApp</span>
        </div>
      </div>

      <header class="sticky top-0 z-40 border-b border-[#14171c]/15 bg-[#f2f1ec]/90 backdrop-blur-md">
        <div class="relative mx-auto flex h-[72px] w-full max-w-[1320px] items-center gap-3 px-5 sm:px-7 lg:px-9">
          <button class="grid h-10 w-10 place-items-center rounded-full border border-[#14171c]/15 lg:hidden" type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Icon name="menu" />
          </button>
          <Link to="/" class="no-underline" aria-label="Joyería Fina, inicio">
            <Brand />
          </Link>
          <nav class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[13px] font-medium tracking-[0.02em] lg:flex" aria-label="Navegación principal">
            <a class="text-[#565b64] transition hover:text-[#14171c]" href="#coleccion">Colección</a>
            <a class="text-[#565b64] transition hover:text-[#14171c]" href="#favoritos">Favoritos</a>
            <a class="text-[#565b64] transition hover:text-[#14171c]" href="#como-comprar">Cómo comprar</a>
          </nav>
          <div class="ml-auto flex items-center gap-1 sm:gap-2">
            <a
              class="grid h-10 w-10 place-items-center rounded-full border border-[#14171c]/15 transition hover:border-[#14171c]"
              href={buildWhatsappUrl(settings.whatsapp, "Hola, me gustaría saber más de la colección.")}
              target="_blank"
              rel="noopener"
              aria-label="Escríbenos por WhatsApp"
            >
              <Icon name="whatsapp" />
            </a>
            <button
              class="ml-1 inline-flex h-10 items-center gap-2 rounded-full border border-[#14171c]/15 px-2.5 text-[12px] font-medium transition hover:border-[#14171c] active:scale-[0.97] sm:px-4"
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir tu selección, ${cartCount} piezas`}
            >
              <Icon name="bag" />
              <span class="hidden sm:inline">Selección</span>
              <span class="grid h-5 min-w-5 place-items-center rounded-full bg-[#203a6b] px-1 text-[10px] font-semibold text-[#f7f6f1]">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <HeroProducts products={products} settings={settings} onQuick={(id) => { setQuickId(id); setQuickQty(1); }} />
        <TrustStrip settings={settings} />

        <section class="py-16 sm:py-20 lg:py-28" id="coleccion" aria-labelledby="collection-title">
          <div class="mx-auto w-full max-w-[1320px] px-5 sm:px-7 lg:px-9">
            <div class="max-w-[640px]">
              <h2 class="text-[clamp(2.4rem,4.4vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT} id="collection-title">
                La colección
              </h2>
              <p class="mt-3 text-[15px] leading-relaxed text-[#565b64]">
                {productsLoaded ? `${products.length} broqueles en oro de 10 kt.` : "Broqueles en oro de 10 kt."} Elige tu favorito y escríbenos para coordinar el envío.
              </p>
            </div>

            <div class="mt-10 flex flex-col gap-5 border-b border-[#14171c]/15 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex items-center gap-2 border-b border-[#14171c]/15 pb-2 lg:w-[280px]">
                <Icon name="search" class="h-4 w-4 text-[#565b64]" />
                <label class="sr-only" for="search">Buscar una pieza</label>
                <input
                  class="w-full bg-transparent py-1 text-[14px] outline-none placeholder:text-[#565b64]/80"
                  id="search"
                  type="search"
                  placeholder="Buscar por nombre o forma"
                  autocomplete="off"
                  value={query}
                  onInput={(event) => {
                    setQuery((event.target as HTMLInputElement).value.trim());
                    setVisible(PAGE_SIZE);
                  }}
                />
              </div>

              <div class="flex gap-2 overflow-x-auto pb-1 lg:pb-0" role="group" aria-label="Filtrar por colección">
                {COLLECTIONS.map((item) => (
                  <button
                    class={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[12px] font-medium tracking-[0.02em] transition active:scale-[0.97] ${
                      collection === item.id
                        ? "border-[#14171c] bg-[#14171c] text-[#f2f1ec]"
                        : "border-[#14171c]/15 text-[#565b64] hover:border-[#14171c] hover:text-[#14171c]"
                    }`}
                    type="button"
                    aria-pressed={collection === item.id}
                    onClick={() => {
                      setCollection(item.id);
                      setVisible(PAGE_SIZE);
                    }}
                    key={item.id}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div class="relative flex items-center gap-2 text-[13px] text-[#565b64]">
                <label class="sr-only" for="sort">Ordenar por</label>
                <select
                  class="appearance-none bg-transparent py-2 pr-6 text-[13px] text-[#14171c] outline-none"
                  id="sort"
                  value={sort}
                  onChange={(event) => {
                    setSort((event.target as HTMLSelectElement).value);
                    setVisible(PAGE_SIZE);
                  }}
                >
                  <option value="destacados">Destacados</option>
                  <option value="precio-asc">Precio: menor a mayor</option>
                  <option value="precio-desc">Precio: mayor a menor</option>
                  <option value="nombre">Nombre</option>
                </select>
                <Icon name="caret" class="pointer-events-none absolute right-0 h-3.5 w-3.5" />
              </div>
            </div>

            <p class="mt-4 text-[12px] tracking-[0.02em] text-[#565b64]" aria-live="polite">
              {!productsLoaded ? "" : filtered.length === 0 ? "0 piezas" : shown.length === filtered.length ? `${filtered.length} piezas` : `Mostrando ${shown.length} de ${filtered.length} piezas`}
            </p>

            {!productsLoaded ? (
              <div class="mt-6 min-h-[240px]" aria-hidden="true" />
            ) : shown.length === 0 ? (
              <div class="mt-6 flex flex-col items-start gap-4 border border-[#14171c]/15 bg-[#e8e7e1]/50 px-6 py-12">
                <p class="text-[32px] font-semibold leading-none" style={DISPLAY_FONT}>
                  {products.length === 0 ? "El catálogo está vacío." : "No encontramos esa pieza."}
                </p>
                <p class="max-w-[42ch] text-[14px] leading-relaxed text-[#565b64]">
                  {products.length === 0 ? "Entra al panel para agregar la primera pieza." : "Prueba con otra palabra o vuelve a ver toda la colección."}
                </p>
                {products.length === 0 ? (
                  <Link class="inline-flex items-center justify-center rounded-full border border-[#14171c]/15 px-6 py-3 text-[13.5px] font-medium transition hover:border-[#14171c]" to="/admin">
                    Abrir panel
                  </Link>
                ) : (
                  <button
                    class="inline-flex items-center justify-center rounded-full border border-[#14171c]/15 px-6 py-3 text-[13.5px] font-medium transition hover:border-[#14171c]"
                    type="button"
                    onClick={() => {
                      setCollection("todos");
                      setQuery("");
                      setSort("destacados");
                      setVisible(PAGE_SIZE);
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div class="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
                {shown.map((product) => (
                  <ProductCard
                    product={product}
                    onQuick={(id) => {
                      setQuickId(id);
                      setQuickQty(1);
                    }}
                    onAdd={(id) => addToCart(id)}
                    key={product.id}
                  />
                ))}
              </div>
            )}

            {shown.length < filtered.length ? (
              <div class="mt-12 flex justify-center">
                <button
                  class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#14171c]/15 px-6 py-3 text-[13.5px] font-medium transition hover:border-[#14171c]"
                  type="button"
                  onClick={() => setVisible((value) => value + PAGE_SIZE)}
                >
                  Cargar más piezas
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {heroProducts.length > 0 ? (
          <section class="border-y border-[#14171c]/15 bg-[#e8e7e1] py-16 sm:py-20 lg:py-24" id="favoritos" aria-labelledby="featured-title">
            <div class="mx-auto w-full max-w-[1320px] px-5 sm:px-7 lg:px-9">
              <div class="max-w-[620px]">
                <h2 class="text-[clamp(2.4rem,4.4vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT} id="featured-title">
                  Favoritos de la casa
                </h2>
                <p class="mt-3 text-[15px] leading-relaxed text-[#565b64]">Tres piezas que combinan con todo, solas o en capas.</p>
              </div>

              <div class="mt-10 grid gap-4 lg:grid-cols-[1.18fr_.82fr] lg:gap-6">
                {heroProducts[0] ? (
                  <button class="group block w-full text-left" type="button" onClick={() => { setQuickId(heroProducts[0].id); setQuickQty(1); }} aria-label={`Ver ${heroProducts[0].name}`}>
                    <span class="block aspect-[7/8] overflow-hidden rounded-[2px] bg-[#faf9f5]">
                      <ProductImage src={heroProducts[0].imageUrl} alt={heroProducts[0].name} class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                    </span>
                    <span class="mt-3 flex items-baseline justify-between gap-4">
                      <span class="text-[24px] font-semibold leading-none" style={DISPLAY_FONT}>{heroProducts[0].name.replace(/^Broquel /, "")}</span>
                      <span class="text-[13px] font-medium">{formatMoney(heroProducts[0].price)}</span>
                    </span>
                  </button>
                ) : null}

                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-6">
                  {heroProducts.slice(1).map((product) => (
                    <button
                      class="group grid grid-cols-[1fr_1.1fr] items-center gap-4 text-left sm:grid-cols-1 sm:items-stretch lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
                      type="button"
                      onClick={() => { setQuickId(product.id); setQuickQty(1); }}
                      aria-label={`Ver ${product.name}`}
                      key={product.id}
                    >
                      <span class="block aspect-[7/8] overflow-hidden rounded-[2px] bg-[#faf9f5] sm:h-full sm:aspect-auto">
                        <ProductImage src={product.imageUrl} alt={product.name} class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                      </span>
                      <span class="flex flex-col justify-center gap-1">
                        <span class="text-[22px] font-semibold leading-none" style={DISPLAY_FONT}>{product.name.replace(/^Broquel /, "")}</span>
                        <span class="text-[12.5px] font-medium">{formatMoney(product.price)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div class="mt-8">
                <a class="inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.02em] text-[#14171c] underline-offset-4 transition hover:text-[#203a6b] hover:underline" href="#coleccion">
                  Ver toda la colección
                  <Icon name="arrow" class="h-[1.15em] w-[1.15em]" />
                </a>
              </div>
            </div>
          </section>
        ) : null}

        <section class="py-16 sm:py-24 lg:py-28" aria-labelledby="story-title">
          <div class="mx-auto grid w-full max-w-[1320px] items-center gap-10 px-5 sm:px-7 lg:grid-cols-[.85fr_1.15fr] lg:gap-20 lg:px-9">
            <figure class="overflow-hidden rounded-[2px] border border-[#14171c]/10 bg-[#e8e7e1]">
              {settings.storyImageUrl || products[1]?.imageUrl ? (
                <ProductImage
                  src={settings.storyImageUrl || products[1]?.imageUrl || ""}
                  alt="Broqueles pequeños de oro sostenidos en la palma de la mano"
                  class="aspect-[4/5] h-full w-full object-cover object-[50%_45%]"
                />
              ) : (
                <span class="grid aspect-[4/5] w-full place-items-center text-[#565b64]"><Icon name="image" class="h-10 w-10 opacity-30" /></span>
              )}
            </figure>
            <div>
              <h2 class="text-[clamp(2.4rem,4.4vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT} id="story-title">
                Oro de 10 kt, todos los días.
              </h2>
              <p class="mt-5 max-w-[54ch] text-[15.5px] leading-relaxed text-[#565b64]">
                Los broqueles de la colección están hechos en oro de 10 kt. Son ligeros, brillantes y fáciles de combinar entre sí.
              </p>
              <p class="mt-4 max-w-[54ch] text-[15.5px] leading-relaxed text-[#565b64]">
                Úsalos solos para un detalle discreto o reúne varios en la misma oreja. No hay una forma correcta.
              </p>
              <ul class="mt-8 grid grid-cols-3 gap-4 border-t border-[#14171c]/15 pt-6">
                <li class="flex flex-col gap-1">
                  <span class="text-[30px] font-semibold leading-none" style={DISPLAY_FONT}>10 kt</span>
                  <span class="text-[11.5px] text-[#565b64]">Pureza del oro</span>
                </li>
                <li class="flex flex-col gap-1">
                  <span class="text-[30px] font-semibold leading-none" style={DISPLAY_FONT}>Par</span>
                  <span class="text-[11.5px] text-[#565b64]">Se vende por par</span>
                </li>
                <li class="flex flex-col gap-1">
                  <span class="text-[30px] font-semibold leading-none" style={DISPLAY_FONT}>MX</span>
                  <span class="text-[11.5px] text-[#565b64]">Envíos a todo el país</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section class="border-t border-[#14171c]/15 bg-[#f2f1ec] py-16 sm:py-20 lg:py-24" id="como-comprar" aria-labelledby="how-title">
          <div class="mx-auto w-full max-w-[1320px] px-5 sm:px-7 lg:px-9">
            <div class="max-w-[600px]">
              <h2 class="text-[clamp(2.4rem,4.4vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT} id="how-title">
                Cómo comprar
              </h2>
              <p class="mt-3 text-[15px] leading-relaxed text-[#565b64]">Sin cuentas ni formularios. Elegimos contigo y coordinamos todo por WhatsApp.</p>
            </div>
            <div class="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
              {[
                ["Elige", "Encuentra tu par en la colección. Cada pieza está disponible en el color que ves."],
                ["Escríbenos", "Mándanos tu selección por WhatsApp. Te confirmamos disponibilidad y envío."],
                ["Recibe", "Coordinamos el pago por transferencia, depósito o efectivo y enviamos a todo México."]
              ].map(([title, copy]) => (
                <article class="border-t border-[#14171c]/30 pt-5" key={title}>
                  <h3 class="text-[32px] font-semibold leading-none" style={DISPLAY_FONT}>{title}</h3>
                  <p class="mt-3 max-w-[32ch] text-[14.5px] leading-relaxed text-[#565b64]">{copy}</p>
                </article>
              ))}
            </div>
            <p class="mt-10 text-[14px] text-[#565b64]">
              Pedidos por WhatsApp al{" "}
              <a class="font-medium text-[#14171c] underline underline-offset-4 hover:text-[#203a6b]" href={buildWhatsappUrl(settings.whatsapp, "Hola, quiero hacer un pedido.")} target="_blank" rel="noopener">
                {formatPhone(settings.whatsapp)}
              </a>
              .
            </p>
          </div>
        </section>

        <section class="bg-[#111419] text-[#f2f0ea]" id="contacto" aria-labelledby="contact-title">
          <div class="mx-auto grid w-full max-w-[1320px] gap-8 px-5 py-14 sm:px-7 sm:py-16 lg:grid-cols-[1.25fr_.75fr] lg:items-end lg:gap-16 lg:px-9 lg:py-20">
            <div>
              <h2 class="text-[clamp(2.4rem,4.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT} id="contact-title">
                ¿Te ayudamos a elegir?
              </h2>
              <p class="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-[#f2f0ea]/70">Escríbenos y te compartimos disponibilidad, medidas y opciones de envío.</p>
            </div>
            <div class="flex flex-col items-start gap-4 lg:items-end">
              <a
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f2f1ec] px-6 py-3 text-[13.5px] font-medium text-[#14171c] transition hover:bg-white"
                href={buildWhatsappUrl(settings.whatsapp, "Hola, me gustaría saber más de la colección.")}
                target="_blank"
                rel="noopener"
              >
                <Icon name="whatsapp" /> Escríbenos por WhatsApp
              </a>
              <a class="inline-flex items-center gap-2 text-[13px] text-[#f2f0ea]/70 transition hover:text-[#f2f0ea]" href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noopener">
                <Icon name="instagram" /> @{settings.instagram}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer class="border-t border-[#f2f0ea]/10 bg-[#111419] text-[#f2f0ea]">
        <div class="mx-auto grid w-full max-w-[1320px] gap-10 px-5 py-14 sm:grid-cols-2 sm:px-7 lg:grid-cols-[1.5fr_.7fr_1fr_1fr] lg:px-9 lg:py-16">
          <div>
            <a href="#top" class="inline-flex items-center gap-2.5 no-underline" aria-label="Joyería Fina, inicio">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#f2f0ea]/60 text-[15px] font-semibold leading-none tracking-[0.04em]" style={DISPLAY_FONT} aria-hidden="true">JF</span>
              <span class="text-[24px] font-semibold leading-none tracking-[-0.01em]" style={DISPLAY_FONT}>Joyería Fina</span>
            </a>
            <p class="mt-4 max-w-[34ch] text-[13px] leading-relaxed text-[#f2f0ea]/60">Broqueles de oro de 10 kt. Una selección de joyería fina para todos los días.</p>
          </div>
          <div>
            <h3 class="text-[11px] uppercase tracking-[0.16em] text-[#f2f0ea]/45">Tienda</h3>
            <div class="mt-4 flex flex-col items-start">
              <a class="block py-1 text-[13.5px] text-[#f2f0ea]/75 transition hover:text-[#f2f0ea]" href="#coleccion">Colección</a>
              <a class="block py-1 text-[13.5px] text-[#f2f0ea]/75 transition hover:text-[#f2f0ea]" href="#favoritos">Favoritos</a>
              <a class="block py-1 text-[13.5px] text-[#f2f0ea]/75 transition hover:text-[#f2f0ea]" href="#como-comprar">Cómo comprar</a>
            </div>
          </div>
          <div>
            <h3 class="text-[11px] uppercase tracking-[0.16em] text-[#f2f0ea]/45">Contacto</h3>
            <div class="mt-4 flex flex-col items-start">
              <a class="block py-1 text-[13.5px] text-[#f2f0ea]/75 transition hover:text-[#f2f0ea]" href={buildWhatsappUrl(settings.whatsapp, "Hola, me gustaría saber más de la colección.")} target="_blank" rel="noopener">WhatsApp {formatPhone(settings.whatsapp)}</a>
              <a class="block py-1 text-[13.5px] text-[#f2f0ea]/75 transition hover:text-[#f2f0ea]" href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noopener">@{settings.instagram}</a>
            </div>
          </div>
          <div>
            <h3 class="text-[11px] uppercase tracking-[0.16em] text-[#f2f0ea]/45">Pagos y envíos</h3>
            <p class="mt-4 text-[13px] leading-relaxed text-[#f2f0ea]/60">{settings.paymentNote}</p>
            <p class="mt-2 text-[13px] leading-relaxed text-[#f2f0ea]/60">{settings.shippingNote}</p>
          </div>
        </div>
        <div class="mx-auto flex w-full max-w-[1320px] flex-col gap-2 border-t border-[#f2f0ea]/10 px-5 py-6 text-[11px] text-[#f2f0ea]/45 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-9">
          <span>© 2026 Joyería Fina</span>
          <span class="inline-flex items-center gap-3">
            <span>Oro de 10 kt · Hecho para brillar</span>
            <Link class="text-[#f2f0ea]/45 underline-offset-4 transition hover:text-[#f2f0ea] hover:underline" to="/admin">Administrar</Link>
          </span>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        lines={cart}
        products={products}
        onClose={() => setCartOpen(false)}
        onQty={changeQty}
        onRemove={removeFromCart}
        onCheckout={checkout}
        whatsapp={settings.whatsapp}
      />

      <QuickView
        product={quickProduct}
        qty={quickQty}
        onClose={() => setQuickId(null)}
        onQty={(next) => setQuickQty(Math.min(MAX_QTY, Math.max(1, next)))}
        onAdd={() => {
          if (quickProduct && addToCart(quickProduct.id, quickQty)) setQuickId(null);
        }}
      />

      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} whatsapp={settings.whatsapp} instagram={settings.instagram} />
      <Toast message={toast} />
    </div>
  );
}
