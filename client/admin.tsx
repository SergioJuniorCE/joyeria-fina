import { Link } from "lakebed/client";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  CATEGORY_LABEL,
  COLLECTIONS,
  DEFAULT_SETTINGS,
  formatMoney,
  type ProductInput,
  type SiteSettings
} from "../shared/config";
import { client } from "./api";
import { Brand, DISPLAY_FONT, Icon, Modal, SANS_FONT, Toast, useFonts } from "./ui";

const TOKEN_KEY = "jf-admin-token";

type AdminProduct = ProductInput & { id?: string };
type Tab = "products" | "settings";

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

const settingFields: Array<{ key: keyof SiteSettings; label: string; hint?: string; multiline?: boolean }> = [
  { key: "whatsapp", label: "WhatsApp", hint: "Solo dígitos, con lada de país. Ej. 526444616545" },
  { key: "instagram", label: "Instagram", hint: "Sin @." },
  { key: "heroEyebrow", label: "Texto superior del hero" },
  { key: "heroHeadline", label: "Titular del hero", hint: "Separa las dos líneas con un punto." },
  { key: "heroSubtext", label: "Subtítulo del hero", multiline: true },
  { key: "heroImageUrl", label: "Imagen del hero", hint: "URL pública de la imagen." },
  { key: "storyImageUrl", label: "Imagen de la historia", hint: "URL pública de la imagen." },
  { key: "shippingNote", label: "Nota de envíos" },
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
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);

  const adminQuery = client.useQuery("adminProducts", token);
  const settingsQuery = client.useQuery("settings");
  const login = client.useMutation("adminLogin");
  const logoutMutation = client.useMutation("adminLogout");
  const saveProduct = client.useMutation("adminSaveProduct");
  const deleteProduct = client.useMutation("adminDeleteProduct");
  const saveSettings = client.useMutation("adminSaveSettings");

  const authorized = Boolean(token) && adminQuery?.authorized === true;
  const products = adminQuery?.authorized ? adminQuery.products : [];
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
      <div class="min-h-screen bg-[#f2f1ec] text-[#14171c]" style={SANS_FONT}>
        <header class="border-b border-[#14171c]/15">
          <div class="mx-auto flex h-[72px] w-full max-w-[1320px] items-center justify-between px-5 sm:px-7 lg:px-9">
            <Link to="/" class="no-underline">
              <Brand />
            </Link>
            <Link class="text-[13px] text-[#565b64] underline-offset-4 transition hover:text-[#14171c] hover:underline" to="/">
              Volver a la tienda
            </Link>
          </div>
        </header>
        <main class="mx-auto flex w-full max-w-[480px] flex-col items-start px-5 py-16 sm:py-24">
          <span class="grid h-12 w-12 place-items-center rounded-full border border-[#14171c]/15 text-[#203a6b]">
            <Icon name="lock" class="h-5 w-5" />
          </span>
          <h1 class="mt-6 text-[clamp(2.6rem,6vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={DISPLAY_FONT}>
            Panel de la tienda
          </h1>
          <p class="mt-3 text-[14.5px] leading-relaxed text-[#565b64]">
            Entra con la contraseña del panel para editar productos, precios y ajustes.
          </p>
          <form class="mt-8 w-full" onSubmit={(event) => void onLogin(event)}>
            <label class="block text-[12px] font-medium tracking-[0.02em] text-[#565b64]" for="admin-password">
              Contraseña
            </label>
            <input
              class="mt-2 w-full rounded-full border border-[#14171c]/20 bg-transparent px-5 py-3 text-[15px] outline-none transition focus:border-[#203a6b]"
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onInput={(event) => setPassword((event.target as HTMLInputElement).value)}
              required
            />
            {loginError ? <p class="mt-3 text-[13px] text-[#9c2b2b]" role="alert">{loginError}</p> : null}
            <button
              class="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#203a6b] px-6 py-3 text-[13.5px] font-medium text-[#f7f6f1] transition hover:bg-[#16294d] disabled:opacity-50"
              type="submit"
              disabled={busy}
            >
              {busy ? "Entrando..." : "Entrar al panel"}
            </button>
          </form>
          <p class="mt-6 text-[11px] leading-relaxed text-[#565b64]">
            La contraseña se configura en <code class="rounded bg-[#e8e7e1] px-1.5 py-0.5">ADMIN_PASSWORD</code> dentro de <code class="rounded bg-[#e8e7e1] px-1.5 py-0.5">.env.lakebed.server</code>.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-[#f2f1ec] text-[#14171c]" style={SANS_FONT}>
      <header class="sticky top-0 z-40 border-b border-[#14171c]/15 bg-[#f2f1ec]/95 backdrop-blur-md">
        <div class="mx-auto flex h-[72px] w-full max-w-[1320px] items-center gap-3 px-5 sm:px-7 lg:px-9">
          <Link to="/" class="no-underline">
            <Brand />
          </Link>
          <span class="hidden text-[11px] uppercase tracking-[0.16em] text-[#565b64] sm:inline">Panel</span>
          <div class="ml-auto flex items-center gap-2">
            <Link class="hidden items-center gap-2 rounded-full border border-[#14171c]/15 px-4 py-2 text-[12.5px] font-medium transition hover:border-[#14171c] sm:inline-flex" to="/">
              Ver tienda
            </Link>
            <button class="rounded-full border border-[#14171c]/15 px-4 py-2 text-[12.5px] font-medium transition hover:border-[#14171c]" type="button" onClick={() => void onLogout()}>
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
            <p class="mt-2 text-[14px] text-[#565b64]">{products.length} productos en el catálogo.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              class={`rounded-full border px-4 py-2 text-[12.5px] font-medium transition ${tab === "products" ? "border-[#14171c] bg-[#14171c] text-[#f2f1ec]" : "border-[#14171c]/15 text-[#565b64] hover:border-[#14171c]"}`}
              type="button"
              onClick={() => setTab("products")}
            >
              Productos
            </button>
            <button
              class={`rounded-full border px-4 py-2 text-[12.5px] font-medium transition ${tab === "settings" ? "border-[#14171c] bg-[#14171c] text-[#f2f1ec]" : "border-[#14171c]/15 text-[#565b64] hover:border-[#14171c]"}`}
              type="button"
              onClick={() => setTab("settings")}
            >
              Ajustes
            </button>
          </div>
        </div>

        {tab === "products" ? (
          <section class="mt-8">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#14171c]/15 pb-4">
              <p class="text-[12px] uppercase tracking-[0.14em] text-[#565b64]">Catálogo</p>
              <button
                class="inline-flex items-center gap-2 rounded-full bg-[#203a6b] px-4 py-2.5 text-[12.5px] font-medium text-[#f7f6f1] transition hover:bg-[#16294d]"
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
              <div class="mt-8 border border-dashed border-[#14171c]/20 px-6 py-12 text-center">
                <p class="text-[26px] font-semibold" style={DISPLAY_FONT}>Aún no hay productos.</p>
                <p class="mt-2 text-[13.5px] text-[#565b64]">Crea el primero o corre el seed para cargar el catálogo original.</p>
              </div>
            ) : (
              <div class="mt-2 divide-y divide-[#14171c]/10">
                {products.map((product) => (
                  <div class="grid grid-cols-[56px_1fr] items-center gap-4 py-4 sm:grid-cols-[64px_1fr_120px_100px_auto]" key={product.id ?? product.name}>
                    <div class="h-16 w-14 overflow-hidden rounded-[2px] bg-[#e8e7e1] sm:h-[72px] sm:w-16">
                      {product.imageUrl ? (
                        <img class="h-full w-full object-cover" src={product.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <span class="grid h-full w-full place-items-center text-[#565b64]"><Icon name="image" class="h-5 w-5 opacity-40" /></span>
                      )}
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-[18px] font-semibold leading-tight" style={DISPLAY_FONT}>{product.name}</p>
                      <p class="mt-1 text-[11.5px] text-[#565b64]">
                        {CATEGORY_LABEL[product.collection] ?? product.collection}
                        {product.featured ? " · Favorito" : ""}
                        {product.available ? "" : " · Oculto"}
                      </p>
                      <p class="mt-1 text-[13px] font-medium sm:hidden">{formatMoney(product.price)}</p>
                    </div>
                    <p class="hidden text-[13px] font-medium sm:block">{formatMoney(product.price)}</p>
                    <span class={`hidden w-fit rounded-full border px-2.5 py-1 text-[10.5px] font-medium sm:inline-flex ${product.available ? "border-[#203a6b]/30 text-[#203a6b]" : "border-[#14171c]/15 text-[#565b64]"}`}>
                      {product.available ? "Visible" : "Oculto"}
                    </span>
                    <div class="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end">
                      <button
                        class="inline-flex items-center gap-1.5 rounded-full border border-[#14171c]/15 px-3 py-1.5 text-[11.5px] font-medium transition hover:border-[#14171c]"
                        type="button"
                        onClick={() => {
                          setFormError("");
                          setEditing({ ...product });
                        }}
                      >
                        <Icon name="edit" class="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        class="inline-flex items-center gap-1.5 rounded-full border border-[#9c2b2b]/25 px-3 py-1.5 text-[11.5px] font-medium text-[#9c2b2b] transition hover:border-[#9c2b2b]"
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
        ) : (
          <section class="mt-8 max-w-[760px]">
            <form class="space-y-5" onSubmit={(event) => void onSaveSettings(event)}>
              <div class="border-b border-[#14171c]/15 pb-4">
                <p class="text-[12px] uppercase tracking-[0.14em] text-[#565b64]">Contenido y contacto</p>
                <p class="mt-2 text-[13.5px] leading-relaxed text-[#565b64]">Estos textos aparecen en la tienda y en el mensaje de WhatsApp.</p>
              </div>
              {settingsDraft
                ? settingFields.map((field) => (
                    <div key={field.key}>
                      <label class="block text-[12px] font-medium tracking-[0.02em] text-[#565b64]" for={`setting-${field.key}`}>
                        {field.label}
                      </label>
                      {field.multiline ? (
                        <textarea
                          class="mt-2 w-full rounded-[2px] border border-[#14171c]/20 bg-transparent px-4 py-3 text-[14px] outline-none transition focus:border-[#203a6b]"
                          id={`setting-${field.key}`}
                          rows={3}
                          value={settingsDraft[field.key]}
                          onInput={(event) => setSettingsDraft({ ...settingsDraft, [field.key]: (event.target as HTMLTextAreaElement).value })}
                        />
                      ) : (
                        <input
                          class="mt-2 w-full rounded-[2px] border border-[#14171c]/20 bg-transparent px-4 py-3 text-[14px] outline-none transition focus:border-[#203a6b]"
                          id={`setting-${field.key}`}
                          type="text"
                          value={settingsDraft[field.key]}
                          onInput={(event) => setSettingsDraft({ ...settingsDraft, [field.key]: (event.target as HTMLInputElement).value })}
                        />
                      )}
                      {field.hint ? <p class="mt-1.5 text-[11px] text-[#565b64]">{field.hint}</p> : null}
                    </div>
                  ))
                : null}
              {settingsError ? <p class="text-[13px] text-[#9c2b2b]" role="alert">{settingsError}</p> : null}
              <button
                class="inline-flex min-h-11 items-center justify-center rounded-full bg-[#203a6b] px-6 py-3 text-[13.5px] font-medium text-[#f7f6f1] transition hover:bg-[#16294d] disabled:opacity-50"
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
                <p class="text-[11px] uppercase tracking-[0.16em] text-[#565b64]">{editing.id ? "Editar pieza" : "Nueva pieza"}</p>
                <h2 class="mt-1 text-[32px] font-semibold leading-none" style={DISPLAY_FONT}>{editing.name || "Producto sin nombre"}</h2>
              </div>
              <button class="grid h-10 w-10 place-items-center rounded-full border border-[#14171c]/15 transition hover:border-[#14171c]" type="button" onClick={() => setEditing(null)} aria-label="Cerrar formulario">
                <Icon name="x" />
              </button>
            </div>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-medium text-[#565b64]" for="product-name">Nombre</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#14171c]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#203a6b]"
                  id="product-name"
                  value={editing.name}
                  onInput={(event) => setEditing({ ...editing, name: (event.target as HTMLInputElement).value })}
                  required
                  maxLength={90}
                />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-[#565b64]" for="product-price">Precio MXN</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#14171c]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#203a6b]"
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
                <label class="block text-[12px] font-medium text-[#565b64]" for="product-collection">Colección</label>
                <select
                  class="mt-2 w-full rounded-[2px] border border-[#14171c]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#203a6b]"
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
                <label class="block text-[12px] font-medium text-[#565b64]" for="product-image">Imagen</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#14171c]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#203a6b]"
                  id="product-image"
                  type="text"
                  inputMode="url"
                  placeholder="https://..."
                  value={editing.imageUrl}
                  onInput={(event) => setEditing({ ...editing, imageUrl: (event.target as HTMLInputElement).value })}
                />
                <div class="mt-2 flex flex-wrap items-center gap-3">
                  <label class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#14171c]/15 px-3 py-1.5 text-[11.5px] font-medium transition hover:border-[#14171c]">
                    <Icon name="image" class="h-3.5 w-3.5" /> Subir imagen
                    <input class="sr-only" type="file" accept="image/*" onChange={(event) => void onUpload(event)} />
                  </label>
                  <span class="text-[11px] leading-relaxed text-[#565b64]">En producción, la subida directa requiere iniciar sesión con Google en Lakebed. También puedes pegar una URL pública.</span>
                </div>
                {editing.imageUrl ? (
                  <img class="mt-4 aspect-[7/8] w-32 rounded-[2px] bg-[#e8e7e1] object-cover" src={editing.imageUrl} alt="" />
                ) : null}
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-medium text-[#565b64]" for="product-description">Descripción</label>
                <textarea
                  class="mt-2 w-full rounded-[2px] border border-[#14171c]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#203a6b]"
                  id="product-description"
                  rows={3}
                  maxLength={600}
                  value={editing.description}
                  onInput={(event) => setEditing({ ...editing, description: (event.target as HTMLTextAreaElement).value })}
                />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-[#565b64]" for="product-position">Orden</label>
                <input
                  class="mt-2 w-full rounded-[2px] border border-[#14171c]/20 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[#203a6b]"
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
                    class="h-4 w-4 accent-[#203a6b]"
                    type="checkbox"
                    checked={editing.available}
                    onChange={(event) => setEditing({ ...editing, available: (event.target as HTMLInputElement).checked })}
                  />
                  Visible en la tienda
                </label>
                <label class="inline-flex items-center gap-2 text-[13px]">
                  <input
                    class="h-4 w-4 accent-[#203a6b]"
                    type="checkbox"
                    checked={editing.featured}
                    onChange={(event) => setEditing({ ...editing, featured: (event.target as HTMLInputElement).checked })}
                  />
                  Favorito de la casa
                </label>
              </div>
            </div>

            {formError ? <p class="mt-4 text-[13px] text-[#9c2b2b]" role="alert">{formError}</p> : null}

            <div class="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#14171c]/15 pt-5">
              <button class="rounded-full border border-[#14171c]/15 px-5 py-2.5 text-[12.5px] font-medium transition hover:border-[#14171c]" type="button" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-full bg-[#203a6b] px-5 py-2.5 text-[12.5px] font-medium text-[#f7f6f1] transition hover:bg-[#16294d] disabled:opacity-50"
                type="submit"
                disabled={saving}
              >
                <Icon name="check" class="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar producto"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
