import { Link } from "lakebed/client";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  CATEGORY_LABEL,
  COLLECTIONS,
  DEFAULT_SETTINGS,
  formatMoney,
  type ProductInput,
  type PromotionInput,
  type SiteSettings
} from "../shared/config";
import { client } from "./api";
import { Brand, DISPLAY_FONT, Icon, Modal, SANS_FONT, Toast, useFonts } from "./ui";

const TOKEN_KEY = "jf-admin-token";

type AdminProduct = ProductInput & { id?: string };
type Tab = "products" | "promotions" | "settings";

const emptyPromotion = (): PromotionInput => ({
  code: "",
  kind: "percent",
  value: 10,
  minSubtotal: 0,
  active: true
});

function promotionSummary(promotion: PromotionInput): string {
  const discount =
    promotion.kind === "percent"
      ? `${promotion.value}% de descuento`
      : `${formatMoney(promotion.value)} de descuento`;
  return promotion.minSubtotal > 0
    ? `${discount} · mínimo ${formatMoney(promotion.minSubtotal)}`
    : discount;
}

const emptyProduct = (position: number): AdminProduct => ({
  name: "",
  price: 0,
  collection: "clasicos",
  imageUrl: "",
  description: "",
  available: true,
  featured: false,
  position
});

const settingFields: Array<{ key: keyof SiteSettings; label: string; hint?: string; multiline?: boolean; numeric?: boolean }> = [
  { key: "whatsapp", label: "WhatsApp", hint: "Solo dígitos, con lada de país. Ej. 526444616545" },
  { key: "instagram", label: "Instagram", hint: "Sin @." },
  { key: "heroEyebrow", label: "Texto superior del hero" },
  { key: "heroHeadline", label: "Titular del hero", hint: "Separa las dos líneas con un punto." },
  { key: "heroSubtext", label: "Subtítulo del hero", multiline: true },
  { key: "heroImageUrl", label: "Imagen del hero", hint: "URL pública de la imagen." },
  { key: "storyImageUrl", label: "Imagen de la historia", hint: "URL pública de la imagen." },
  { key: "shippingNote", label: "Nota de envíos" },
  { key: "shippingFlat", label: "Costo de envío (MXN)", hint: "Se suma al subtotal en la selección. Usa 0 para no cobrar envío.", numeric: true },
  { key: "shippingFreeFrom", label: "Envío gratis desde (MXN)", hint: "Cuando el subtotal alcanza este monto, el envío es gratis. Usa 0 para desactivarlo.", numeric: true },
  { key: "paymentNote", label: "Nota de pagos", multiline: true }
];

export function Admin() {
  useFonts();
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("products");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const [editingPromo, setEditingPromo] = useState<PromotionInput | null>(null);
  const [promoError, setPromoError] = useState("");
  const [savingPromo, setSavingPromo] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);

  const adminQuery = client.useQuery("adminProducts", token);
  const settingsQuery = client.useQuery("settings");
  const login = client.useMutation("adminLogin");
  const logoutMutation = client.useMutation("adminLogout");
  const saveProduct = client.useMutation("adminSaveProduct");
  const deleteProduct = client.useMutation("adminDeleteProduct");
  const saveSettings = client.useMutation("adminSaveSettings");
  const promotionsQuery = client.useQuery("adminPromotions", token);
  const savePromotion = client.useMutation("adminSavePromotion");
  const deletePromotion = client.useMutation("adminDeletePromotion");

  const authorized = Boolean(token) && adminQuery?.authorized === true;
  const products = adminQuery?.authorized ? adminQuery.products : [];
  const promotions = promotionsQuery?.authorized ? promotionsQuery.promotions : [];
  const settings = settingsQuery ?? DEFAULT_SETTINGS;

  useEffect(() => {
    if (!settingsQuery) return;
    setSettingsDraft((current) => current ?? { ...DEFAULT_SETTINGS, ...settingsQuery });
  }, [settingsQuery]);

  useEffect(() => {
    if (!token || !adminQuery || adminQuery.authorized) return;
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken("");
    setLoginError("Tu sesión expiró. Vuelve a entrar.");
  }, [adminQuery, token]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  }

  async function onLogin(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setLoginError("");
    try {
      const result = await login(password);
      if (result.ok && result.token) {
        try {
          sessionStorage.setItem(TOKEN_KEY, result.token);
        } catch {
          /* ignore */
        }
        setToken(result.token);
        setPassword("");
      } else {
        setLoginError(result.error ?? "No se pudo entrar.");
      }
    } catch {
      setLoginError("No se pudo conectar con el panel.");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    try {
      await logoutMutation(token);
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken("");
    setTab("products");
  }

  async function onSaveProduct(event: SubmitEvent) {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    setFormError("");
    try {
      const result = await saveProduct({ token, product: editing });
      if (result.ok) {
        setEditing(null);
        showToast("Producto guardado.");
      } else {
        setFormError(result.error ?? "No se pudo guardar.");
      }
    } catch {
      setFormError("No se pudo guardar. Revisa tu sesión.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(product: AdminProduct) {
    if (!product.id) return;
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const result = await deleteProduct({ token, id: product.id });
      if (result.ok) showToast("Producto eliminado.");
      else showToast(result.error ?? "No se pudo eliminar.");
    } catch {
      showToast("No se pudo eliminar.");
    }
  }

  async function onSavePromo(event: SubmitEvent) {
    event.preventDefault();
    if (!editingPromo || savingPromo) return;
    setSavingPromo(true);
    setPromoError("");
    try {
      const result = await savePromotion({ token, promotion: editingPromo });
      if (result.ok) {
        setEditingPromo(null);
        showToast("Promoción guardada.");
      } else {
        setPromoError(result.error ?? "No se pudo guardar.");
      }
    } catch {
      setPromoError("No se pudo guardar. Revisa tu sesión.");
    } finally {
      setSavingPromo(false);
    }
  }

  async function onDeletePromo(promotion: PromotionInput) {
    if (!promotion.id) return;
    if (!window.confirm(`¿Eliminar el código "${promotion.code}"?`)) return;
    try {
      const result = await deletePromotion({ token, id: promotion.id });
      if (result.ok) showToast("Promoción eliminada.");
      else showToast(result.error ?? "No se pudo eliminar.");
    } catch {
      showToast("No se pudo eliminar.");
    }
  }

  async function onUpload(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !editing) return;
    setFormError("");
    try {
      const uploaded = await client.storage.upload(file, { public: true });
      setEditing({ ...editing, imageUrl: uploaded.url });
      showToast("Imagen subida.");
    } catch {
      setFormError("La subida directa requiere una sesión de Lakebed con Google. También puedes pegar una URL pública.");
    } finally {
      input.value = "";
    }
  }

  async function onSaveSettings(event: SubmitEvent) {
    event.preventDefault();
    if (!settingsDraft) return;
    setSaving(true);
    setSettingsError("");
    try {
      const result = await saveSettings({ token, settings: settingsDraft });
      if (result.ok) showToast("Ajustes guardados.");
      else setSettingsError(result.error ?? "No se pudieron guardar.");
    } catch {
      setSettingsError("No se pudieron guardar. Revisa tu sesión.");
    } finally {
      setSaving(false);
    }
  }

  if (!authorized) {
    return (
      <div class="min-h-screen bg-[#f7f1e9] text-[#3f3a34]" style={SANS_FONT}>
        <header class="border-b border-[#3f3a34]/15">
          <div class="mx-auto flex h-[72px] w-full max-w-[1320px] items-center justify-between px-5 sm:px-7 lg:px-9">
            <Link to="/" class="no-underline">
              <Brand />
            </Link>
            <Link class="text-[13px] text-[#6f675f] underline-offset-4 transition hover:text-[#3f3a34] hover:underline" to="/">
              Volver a la tienda
            </Link>
          </div>
        </header>
        <main class="mx-auto flex w-full max-w-[480px] flex-col items-start px-5 py-16 sm:py-24">
          <span class="grid h-12 w-12 place-items-center rounded-full border border-[#3f3a34]/15 text-[#96684f]">
            <Icon name="lock" class="h-5 w-5" />
          </span>
          <h1 class="mt-6 text-[clamp(2.6rem,6vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT}>
            Panel de la tienda
          </h1>
          <p class="mt-3 text-[14.5px] leading-relaxed text-[#6f675f]">
            Entra con la contraseña del panel para editar productos, precios y ajustes.
          </p>
          <form class="mt-8 w-full" onSubmit={(event) => void onLogin(event)}>
            <label class="block text-[12px] font-medium tracking-[0.02em] text-[#6f675f]" for="admin-password">
              Contraseña
            </label>
            <input
              class="mt-2 w-full rounded-full border border-[#3f3a34]/20 bg-transparent px-5 py-3 text-[15px] outline-none transition focus:border-[#96684f]"
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onInput={(event) => setPassword((event.target as HTMLInputElement).value)}
              required
            />
            {loginError ? <p class="mt-3 text-[13px] text-[#9a3a2b]" role="alert">{loginError}</p> : null}
            <button
              class="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#96684f] px-6 py-3 text-[13.5px] font-medium text-[#fffdf9] transition hover:bg-[#7a5440] disabled:opacity-50"
              type="submit"
              disabled={busy}
            >
              {busy ? "Entrando..." : "Entrar al panel"}
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-[#f7f1e9] text-[#3f3a34]" style={SANS_FONT}>
      <header class="sticky top-0 z-40 border-b border-[#3f3a34]/15 bg-[#f7f1e9]/95 backdrop-blur-md">
        <div class="mx-auto flex h-[72px] w-full max-w-[1320px] items-center gap-3 px-5 sm:px-7 lg:px-9">
          <Link to="/" class="no-underline">
            <Brand />
          </Link>
          <span class="hidden text-[11px] uppercase tracking-[0.16em] text-[#6f675f] sm:inline">Panel</span>
          <div class="ml-auto flex items-center gap-2">
            <Link class="hidden items-center gap-2 rounded-full border border-[#3f3a34]/15 px-4 py-2 text-[12.5px] font-medium transition hover:border-[#3f3a34] sm:inline-flex" to="/">
              Ver tienda
            </Link>
            <button class="rounded-full border border-[#3f3a34]/15 px-4 py-2 text-[12.5px] font-medium transition hover:border-[#3f3a34]" type="button" onClick={() => void onLogout()}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-[1320px] px-5 py-10 sm:px-7 sm:py-12 lg:px-9">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-[clamp(2.4rem,4.4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT}>
              Tu tienda
            </h1>
            <p class="mt-2 text-[14px] text-[#6f675f]">{products.length} productos en el catálogo.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              class={`rounded-full border px-4 py-2 text-[12.5px] font-medium transition ${tab === "products" ? "border-[#3f3a34] bg-[#3f3a34] text-[#f7f1e9]" : "border-[#3f3a34]/15 text-[#6f675f] hover:border-[#3f3a34]"}`}
              type="button"
              onClick={() => setTab("products")}
            >
              Productos
            </button>
            <button
              class={`rounded-full border px-4 py-2 text-[12.5px] font-medium transition ${tab === "promotions" ? "border-[#3f3a34] bg-[#3f3a34] text-[#f7f1e9]" : "border-[#3f3a34]/15 text-[#6f675f] hover:border-[#3f3a34]"}`}
              type="button"
              onClick={() => setTab("promotions")}
            >
              Promociones
            </button>
            <button
              class={`rounded-full border px-4 py-2 text-[12.5px] font-medium transition ${tab === "settings" ? "border-[#3f3a34] bg-[#3f3a34] text-[#f7f1e9]" : "border-[#3f3a34]/15 text-[#6f675f] hover:border-[#3f3a34]"}`}
              type="button"
              onClick={() => setTab("settings")}
            >
              Ajustes
            </button>
          </div>
        </div>

        {tab === "products" ? (
          <section class="mt-8">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#3f3a34]/15 pb-4">
              <p class="text-[12px] uppercase tracking-[0.14em] text-[#6f675f]">Catálogo</p>
              <button
                class="inline-flex items-center gap-2 rounded-full bg-[#96684f] px-4 py-2.5 text-[12.5px] font-medium text-[#fffdf9] transition hover:bg-[#7a5440]"
                type="button"
                onClick={() => {
                  setFormError("");
                  setEditing(emptyProduct(products.length + 1));
                }}
              >
                <Icon name="plus" class="h-3.5 w-3.5" /> Nuevo producto
              </button>
            </div>

            {adminQuery === undefined ? null : products.length === 0 ? (
              <div class="mt-8 border border-dashed border-[#3f3a34]/20 px-6 py-12 text-center">
                <p class="text-[26px] font-semibold" style={DISPLAY_FONT}>Aún no hay productos.</p>
                <p class="mt-2 text-[13.5px] text-[#6f675f]">Crea el primero o corre el seed para cargar el catálogo original.</p>
              </div>
            ) : (
              <div class="mt-2 divide-y divide-[#3f3a34]/10">
                {products.map((product) => (
                  <div class="grid grid-cols-[56px_1fr] items-center gap-4 py-4 sm:grid-cols-[64px_1fr_120px_100px_auto]" key={product.id ?? product.name}>
                    <div class="h-16 w-14 overflow-hidden rounded-[2px] bg-[#f0e6db] sm:h-[72px] sm:w-16">
                      {product.imageUrl ? (
                        <img class="h-full w-full object-cover" src={product.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <span class="grid h-full w-full place-items-center text-[#6f675f]"><Icon name="image" class="h-5 w-5 opacity-40" /></span>
                      )}
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-[18px] font-semibold leading-tight" style={DISPLAY_FONT}>{product.name}</p>
                      <p class="mt-1 text-[11.5px] text-[#6f675f]">
                        {CATEGORY_LABEL[product.collection] ?? product.collection}
                        {product.featured ? " · Favorito" : ""}
                        {product.available ? "" : " · Oculto"}
                      </p>
                      <p class="mt-1 text-[13px] font-medium sm:hidden">{formatMoney(product.price)}</p>
                    </div>
                    <p class="hidden text-[13px] font-medium sm:block">{formatMoney(product.price)}</p>
                    <span class={`hidden w-fit rounded-full border px-2.5 py-1 text-[10.5px] font-medium sm:inline-flex ${product.available ? "border-[#96684f]/30 text-[#96684f]" : "border-[#3f3a34]/15 text-[#6f675f]"}`}>
                      {product.available ? "Visible" : "Oculto"}
                    </span>
                    <div class="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end">
                      <button
                        class="inline-flex items-center gap-1.5 rounded-full border border-[#3f3a34]/15 px-3 py-1.5 text-[11.5px] font-medium transition hover:border-[#3f3a34]"
                        type="button"
                        onClick={() => {
                          setFormError("");
                          setEditing({ ...product });
                        }}
                      >
                        <Icon name="edit" class="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        class="inline-flex items-center gap-1.5 rounded-full border border-[#9a3a2b]/25 px-3 py-1.5 text-[11.5px] font-medium text-[#9a3a2b] transition hover:border-[#9a3a2b]"
                        type="button"
                        onClick={() => void onDelete(product)}
                      >
                        <Icon name="trash" class="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : tab === "promotions" ? (
          <section class="mt-8 max-w-[860px]">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#3f3a34]/15 pb-4">
              <div>
                <p class="text-[12px] uppercase tracking-[0.14em] text-[#6f675f]">Promociones</p>
                <p class="mt-1 text-[12.5px] text-[#6f675f]">Códigos de descuento que se aplican en el checkout.</p>
              </div>
              <button
                class="inline-flex items-center gap-2 rounded-full bg-[#96684f] px-4 py-2.5 text-[12.5px] font-medium text-[#fffdf9] transition hover:bg-[#7a5440]"
                type="button"
                onClick={() => {
                  setPromoError("");
                  setEditingPromo(emptyPromotion());
                }}
              >
                <Icon name="plus" class="h-3.5 w-3.5" /> Nueva promoción
              </button>
            </div>

            {promotionsQuery === undefined ? null : promotions.length === 0 ? (
              <div class="mt-8 border border-dashed border-[#3f3a34]/20 px-6 py-12 text-center">
                <p class="text-[26px] font-semibold" style={DISPLAY_FONT}>Aún no hay códigos.</p>
                <p class="mt-2 text-[13.5px] text-[#6f675f]">Crea el primero para usarlo en el checkout.</p>
              </div>
            ) : (
              <div class="mt-2 divide-y divide-[#3f3a34]/10">
                {promotions.map((promotion) => (
                  <div class="flex flex-wrap items-center gap-3 py-4" key={promotion.id ?? promotion.code}>
                    <div class="min-w-0 flex-1">
                      <p class="text-[18px] font-semibold leading-tight" style={DISPLAY_FONT}>{promotion.code}</p>
                      <p class="mt-1 text-[12px] text-[#6f675f]">{promotionSummary(promotion)}</p>
                    </div>
                    <span class={`rounded-full border px-2.5 py-1 text-[10.5px] font-medium ${promotion.active ? "border-[#96684f]/30 text-[#96684f]" : "border-[#3f3a34]/15 text-[#6f675f]"}`}>
                      {promotion.active ? "Activa" : "Inactiva"}
                    </span>
                    <div class="flex items-center gap-2">
                      <button
                        class="inline-flex items-center gap-1.5 rounded-full border border-[#3f3a34]/15 px-3 py-1.5 text-[11.5px] font-medium transition hover:border-[#3f3a34]"
                        type="button"
                        onClick={() => {
                          setPromoError("");
                          setEditingPromo({ ...promotion });
                        }}
                      >
                        <Icon name="edit" class="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        class="inline-flex items-center gap-1.5 rounded-full border border-[#9a3a2b]/25 px-3 py-1.5 text-[11.5px] font-medium text-[#9a3a2b] transition hover:border-[#9a3a2b]"
                        type="button"
                        onClick={() => void onDeletePromo(promotion)}
                      >
                        <Icon name="trash" class="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section class="mt-8 max-w-[760px]">
            <form class="space-y-5" onSubmit={(event) => void onSaveSettings(event)}>
              <div class="border-b border-[#3f3a34]/15 pb-4">
                <p class="text-[12px] uppercase tracking-[0.14em] text-[#6f675f]">Contenido y contacto</p>
                <p class="mt-2 text-[13.5px] leading-relaxed text-[#6f675f]">Estos textos aparecen en la tienda y en el mensaje de WhatsApp.</p>
              </div>
              {settingsDraft
                ? settingFields.map((field) => (
                    <div key={field.key}>
                      <label class="block text-[12px] font-medium tracking-[0.02em] text-[#6f675f]" for={`setting-${field.key}`}>
                        {field.label}
                      </label>
                      {field.multiline ? (
                        <textarea
                          class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none transition focus:border-[#96684f]"
                          id={`setting-${field.key}`}
                          rows={3}
                          value={settingsDraft[field.key]}
                          onInput={(event) => setSettingsDraft({ ...settingsDraft, [field.key]: (event.target as HTMLTextAreaElement).value })}
                        />
                      ) : field.numeric ? (
                        <input
                          class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none transition focus:border-[#96684f]"
                          id={`setting-${field.key}`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          value={settingsDraft[field.key]}
                          onInput={(event) => setSettingsDraft({ ...settingsDraft, [field.key]: (event.target as HTMLInputElement).value })}
                        />
                      ) : (
                        <input
                          class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none transition focus:border-[#96684f]"
                          id={`setting-${field.key}`}
                          type="text"
                          value={settingsDraft[field.key]}
                          onInput={(event) => setSettingsDraft({ ...settingsDraft, [field.key]: (event.target as HTMLInputElement).value })}
                        />
                      )}
                      {field.hint ? <p class="mt-1.5 text-[11px] text-[#6f675f]">{field.hint}</p> : null}
                    </div>
                  ))
                : null}
              {settingsError ? <p class="text-[13px] text-[#9a3a2b]" role="alert">{settingsError}</p> : null}
              <button
                class="inline-flex min-h-11 items-center justify-center rounded-full bg-[#96684f] px-6 py-3 text-[13.5px] font-medium text-[#fffdf9] transition hover:bg-[#7a5440] disabled:opacity-50"
                type="submit"
                disabled={saving || !settingsDraft}
              >
                {saving ? "Guardando..." : "Guardar ajustes"}
              </button>
            </form>
          </section>
        )}
      </main>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} label={editing?.id ? "Editar producto" : "Nuevo producto"} class="max-w-[720px]">
        {editing ? (
          <form class="max-h-[90vh] overflow-y-auto p-6 sm:p-8" onSubmit={(event) => void onSaveProduct(event)}>
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.16em] text-[#6f675f]">{editing.id ? "Editar pieza" : "Nueva pieza"}</p>
                <h2 class="mt-1 text-[32px] font-semibold leading-none" style={DISPLAY_FONT}>{editing.name || "Producto sin nombre"}</h2>
              </div>
              <button class="grid h-10 w-10 place-items-center rounded-full border border-[#3f3a34]/15 transition hover:border-[#3f3a34]" type="button" onClick={() => setEditing(null)} aria-label="Cerrar formulario">
                <Icon name="x" />
              </button>
            </div>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-medium text-[#6f675f]" for="product-name">Nombre</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="product-name"
                  value={editing.name}
                  onInput={(event) => setEditing({ ...editing, name: (event.target as HTMLInputElement).value })}
                  required
                  maxLength={90}
                />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-[#6f675f]" for="product-price">Precio MXN</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="product-price"
                  type="number"
                  min="0"
                  step="1"
                  value={editing.price}
                  onInput={(event) => setEditing({ ...editing, price: Number((event.target as HTMLInputElement).value) })}
                  required
                />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-[#6f675f]" for="product-collection">Colección</label>
                <select
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="product-collection"
                  value={editing.collection}
                  onChange={(event) => setEditing({ ...editing, collection: (event.target as HTMLSelectElement).value })}
                >
                  {COLLECTIONS.filter((collection) => collection.id !== "todos").map((collection) => (
                    <option value={collection.id} key={collection.id}>{collection.label}</option>
                  ))}
                </select>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-medium text-[#6f675f]" for="product-image">Imagen</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="product-image"
                  type="text"
                  inputMode="url"
                  placeholder="https://..."
                  value={editing.imageUrl}
                  onInput={(event) => setEditing({ ...editing, imageUrl: (event.target as HTMLInputElement).value })}
                />
                <div class="mt-2 flex flex-wrap items-center gap-3">
                  <label class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#3f3a34]/15 px-3 py-1.5 text-[11.5px] font-medium transition hover:border-[#3f3a34]">
                    <Icon name="image" class="h-3.5 w-3.5" /> Subir imagen
                    <input class="sr-only" type="file" accept="image/*" onChange={(event) => void onUpload(event)} />
                  </label>
                  <span class="text-[11px] leading-relaxed text-[#6f675f]">En producción, la subida directa requiere iniciar sesión con Google en Lakebed. También puedes pegar una URL pública.</span>
                </div>
                {editing.imageUrl ? (
                  <img class="mt-4 aspect-[7/8] w-32 rounded-[2px] bg-[#f0e6db] object-cover" src={editing.imageUrl} alt="" />
                ) : null}
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-medium text-[#6f675f]" for="product-description">Descripción</label>
                <textarea
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="product-description"
                  rows={3}
                  maxLength={600}
                  value={editing.description}
                  onInput={(event) => setEditing({ ...editing, description: (event.target as HTMLTextAreaElement).value })}
                />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-[#6f675f]" for="product-position">Orden</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="product-position"
                  type="number"
                  min="0"
                  step="1"
                  value={editing.position}
                  onInput={(event) => setEditing({ ...editing, position: Number((event.target as HTMLInputElement).value) })}
                />
              </div>
              <div class="flex flex-wrap items-center gap-5 pt-1">
                <label class="inline-flex items-center gap-2 text-[13px]">
                  <input
                    class="h-4 w-4 accent-[#96684f]"
                    type="checkbox"
                    checked={editing.available}
                    onChange={(event) => setEditing({ ...editing, available: (event.target as HTMLInputElement).checked })}
                  />
                  Visible en la tienda
                </label>
                <label class="inline-flex items-center gap-2 text-[13px]">
                  <input
                    class="h-4 w-4 accent-[#96684f]"
                    type="checkbox"
                    checked={editing.featured}
                    onChange={(event) => setEditing({ ...editing, featured: (event.target as HTMLInputElement).checked })}
                  />
                  Favorito de la casa
                </label>
              </div>
            </div>

            {formError ? <p class="mt-4 text-[13px] text-[#9a3a2b]" role="alert">{formError}</p> : null}

            <div class="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#3f3a34]/15 pt-5">
              <button class="rounded-full border border-[#3f3a34]/15 px-5 py-2.5 text-[12.5px] font-medium transition hover:border-[#3f3a34]" type="button" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-full bg-[#96684f] px-5 py-2.5 text-[12.5px] font-medium text-[#fffdf9] transition hover:bg-[#7a5440] disabled:opacity-50"
                type="submit"
                disabled={saving}
              >
                <Icon name="check" class="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar producto"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editingPromo)}
        onClose={() => setEditingPromo(null)}
        label={editingPromo?.id ? "Editar promoción" : "Nueva promoción"}
        class="max-w-[560px]"
      >
        {editingPromo ? (
          <form class="p-6 sm:p-8" onSubmit={(event) => void onSavePromo(event)}>
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-[28px] font-semibold leading-none" style={DISPLAY_FONT}>
                  {editingPromo.id ? "Editar promoción" : "Nueva promoción"}
                </h2>
                <p class="mt-2 text-[12.5px] text-[#6f675f]">Se aplica escribiendo el código en el checkout.</p>
              </div>
              <button
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#3f3a34]/15 transition hover:border-[#3f3a34]"
                type="button"
                onClick={() => setEditingPromo(null)}
                aria-label="Cerrar formulario"
              >
                <Icon name="x" />
              </button>
            </div>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-medium text-[#6f675f]" for="promo-code">Código</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] uppercase outline-none focus:border-[#96684f]"
                  id="promo-code"
                  value={editingPromo.code}
                  onInput={(event) => setEditingPromo({ ...editingPromo, code: (event.target as HTMLInputElement).value.toUpperCase() })}
                  placeholder="VERANO10"
                  maxLength={24}
                  required
                />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-[#6f675f]" for="promo-kind">Tipo</label>
                <select
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="promo-kind"
                  value={editingPromo.kind}
                  onChange={(event) => setEditingPromo({ ...editingPromo, kind: (event.target as HTMLSelectElement).value === "fixed" ? "fixed" : "percent" })}
                >
                  <option value="percent">Porcentaje</option>
                  <option value="fixed">Monto fijo</option>
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-medium text-[#6f675f]" for="promo-value">
                  {editingPromo.kind === "percent" ? "Descuento (%)" : "Descuento (MXN)"}
                </label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="promo-value"
                  type="number"
                  min="1"
                  max={editingPromo.kind === "percent" ? 100 : 1000000}
                  step="1"
                  value={editingPromo.value}
                  onInput={(event) => setEditingPromo({ ...editingPromo, value: Number((event.target as HTMLInputElement).value) })}
                  required
                />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-[#6f675f]" for="promo-min">Compra mínima (MXN)</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#3f3a34]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#96684f]"
                  id="promo-min"
                  type="number"
                  min="0"
                  step="1"
                  value={editingPromo.minSubtotal}
                  onInput={(event) => setEditingPromo({ ...editingPromo, minSubtotal: Number((event.target as HTMLInputElement).value) })}
                />
              </div>
              <label class="inline-flex items-center gap-2 self-end pb-2 text-[13px]">
                <input
                  class="h-4 w-4 accent-[#96684f]"
                  type="checkbox"
                  checked={editingPromo.active}
                  onChange={(event) => setEditingPromo({ ...editingPromo, active: (event.target as HTMLInputElement).checked })}
                />
                Activa
              </label>
            </div>

            {promoError ? <p class="mt-4 text-[13px] text-[#9a3a2b]" role="alert">{promoError}</p> : null}

            <div class="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#3f3a34]/15 pt-5">
              <button class="rounded-full border border-[#3f3a34]/15 px-5 py-2.5 text-[12.5px] font-medium transition hover:border-[#3f3a34]" type="button" onClick={() => setEditingPromo(null)}>
                Cancelar
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-full bg-[#96684f] px-5 py-2.5 text-[12.5px] font-medium text-[#fffdf9] transition hover:bg-[#7a5440] disabled:opacity-50"
                type="submit"
                disabled={savingPromo}
              >
                <Icon name="check" class="h-3.5 w-3.5" /> {savingPromo ? "Guardando..." : "Guardar promoción"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
