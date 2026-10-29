import { action, boolean, capsule, endpoint, json, mutation, number, query, string, table } from "lakebed/server";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEYS,
  cleanPromoCode,
  sanitizeProduct,
  sanitizePromotion,
  sanitizeSettings,
  type ProductInput,
  type PromotionInput,
  type PromotionKind,
  type SiteSettings
} from "../shared/config";

const SESSION_TTL = 12 * 60 * 60 * 1000;

declare const crypto: { randomUUID: () => string };

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

function safeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function settingsFromRows(rows: Array<{ key: string; value: string }>): SiteSettings {
  const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if ((SETTINGS_KEYS as readonly string[]).includes(row.key)) {
      settings[row.key] = row.value;
    }
  }
  return settings as SiteSettings;
}

async function upsertSetting(ctx: any, key: string, value: string): Promise<void> {
  const existing = await ctx.db.settings.withIndex("by_key", (q: any) => q.eq("key", key)).first();
  if (existing) {
    await ctx.db.settings.update(existing.id, { value });
    return;
  }
  await ctx.db.settings.insert({ key, value });
}

export default capsule({
  name: "Joyería Fina",
  favicon: "favicon.svg",

  schema: {
    products: table({
      name: string(),
      price: number(),
      collection: string(),
      imageUrl: string().default(""),
      description: string().default(""),
      available: boolean().default(true),
      featured: boolean().default(false),
      position: number().default(0)
    }).index("by_position", ["position"]),

    settings: table({
      key: string(),
      value: string()
    }).index("by_key", ["key"]),

    promotions: table({
      code: string(),
      kind: string(),
      value: number(),
      minSubtotal: number().default(0),
      active: boolean().default(true)
    }).index("by_code", ["code"]),

    adminSessions: table({
      token: string(),
      expiresAt: number()
    })
      .index("by_token", ["token"])
      .index("by_expiry", ["expiresAt"])
  },

  queries: {
    products: query(async (ctx) => {
      const rows = await ctx.db.products
        .withIndex("by_position", (q) => q.gte("position", 0))
        .order("asc")
        .collect();

      return rows
        .filter((row) => row.available)
        .map((row) => ({
          id: row.id,
          name: row.name,
          price: row.price,
          collection: row.collection,
          imageUrl: row.imageUrl,
          description: row.description,
          featured: row.featured,
          position: row.position
        }));
    }),

    settings: query(async (ctx) => {
      const rows = await ctx.db.settings
        .withIndex("by_key", (q) => q.gte("key", ""))
        .collect();
      return settingsFromRows(rows);
    }),

    adminProducts: query(async (ctx, token: string) => {
      if (!token) return { authorized: false, products: [] as ProductInput[] };

      const session = await ctx.db.adminSessions
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      if (!session || session.expiresAt <= Date.now()) {
        return { authorized: false, products: [] as ProductInput[] };
      }

      const rows = await ctx.db.products
        .withIndex("by_position", (q) => q.gte("position", 0))
        .order("asc")
        .collect();

      return {
        authorized: true,
        products: rows.map((row) => ({
          id: row.id,
          name: row.name,
          price: row.price,
          collection: row.collection,
          imageUrl: row.imageUrl,
          description: row.description,
          available: row.available,
          featured: row.featured,
          position: row.position
        }))
      };
    }),

    adminPromotions: query(async (ctx, token: string) => {
      if (!token) return { authorized: false, promotions: [] as PromotionInput[] };

      const session = await ctx.db.adminSessions
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      if (!session || session.expiresAt <= Date.now()) {
        return { authorized: false, promotions: [] as PromotionInput[] };
      }

      const rows = await ctx.db.promotions
        .withIndex("by_code", (q) => q.gte("code", ""))
        .collect();

      return {
        authorized: true,
        promotions: rows.map((row) => ({
          id: row.id,
          code: row.code,
          kind: (row.kind === "fixed" ? "fixed" : "percent") as PromotionKind,
          value: row.value,
          minSubtotal: row.minSubtotal,
          active: row.active
        }))
      };
    })
  },

  mutations: {
    adminLogin: mutation(async (ctx, password: string) => {
      const expected = ctx.env.ADMIN_PASSWORD;
      if (!expected) {
        return { ok: false, error: "El panel no está configurado." };
      }

      const value = typeof password === "string" ? password : "";
      if (!value || !safeEqual(value, expected)) {
        return { ok: false, error: "Contraseña incorrecta." };
      }

      const now = Date.now();
      const expired = await ctx.db.adminSessions
        .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
        .collect();
      for (const session of expired) {
        await ctx.db.adminSessions.delete(session.id);
      }

      const token = randomToken();
      const expiresAt = now + SESSION_TTL;
      await ctx.db.adminSessions.insert({ token, expiresAt });
      return { ok: true, token, expiresAt };
    }),

    adminLogout: mutation(async (ctx, token: string) => {
      if (!token) return { ok: true };
      const session = await ctx.db.adminSessions
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      if (session) await ctx.db.adminSessions.delete(session.id);
      return { ok: true };
    }),

    adminSaveProduct: mutation(async (ctx, args: { token: string; product: ProductInput }) => {
      const token = typeof args?.token === "string" ? args.token : "";
      const session = token
        ? await ctx.db.adminSessions.withIndex("by_token", (q) => q.eq("token", token)).first()
        : null;

      if (!session || session.expiresAt <= Date.now()) {
        return { ok: false, error: "Tu sesión expiró. Vuelve a entrar." };
      }

      const product = sanitizeProduct(args?.product);
      if (!product) {
        return { ok: false, error: "Revisa el nombre y el precio." };
      }

      const values = {
        name: product.name,
        price: product.price,
        collection: product.collection,
        imageUrl: product.imageUrl,
        description: product.description,
        available: product.available,
        featured: product.featured,
        position: product.position
      };

      if (product.id) {
        const existing = await ctx.db.products.get(product.id);
        if (!existing) return { ok: false, error: "Ese producto ya no existe." };
        await ctx.db.products.update(product.id, values);
        return { ok: true, id: product.id };
      }

      const row = await ctx.db.products.insert(values);
      return { ok: true, id: row.id };
    }),

    adminDeleteProduct: mutation(async (ctx, args: { token: string; id: string }) => {
      const token = typeof args?.token === "string" ? args.token : "";
      const session = token
        ? await ctx.db.adminSessions.withIndex("by_token", (q) => q.eq("token", token)).first()
        : null;

      if (!session || session.expiresAt <= Date.now()) {
        return { ok: false, error: "Tu sesión expiró. Vuelve a entrar." };
      }

      const id = typeof args?.id === "string" ? args.id : "";
      if (!id) return { ok: false, error: "Falta el producto." };
      await ctx.db.products.delete(id);
      return { ok: true };
    }),

    adminSaveSettings: mutation(async (ctx, args: { token: string; settings: Partial<SiteSettings> }) => {
      const token = typeof args?.token === "string" ? args.token : "";
      const session = token
        ? await ctx.db.adminSessions.withIndex("by_token", (q) => q.eq("token", token)).first()
        : null;

      if (!session || session.expiresAt <= Date.now()) {
        return { ok: false, error: "Tu sesión expiró. Vuelve a entrar." };
      }

      const settings = sanitizeSettings(args?.settings);
      if (!settings) return { ok: false, error: "No se recibieron ajustes." };

      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === "string") await upsertSetting(ctx, key, value);
      }

      return { ok: true };
    }),

    adminSavePromotion: mutation(async (ctx, args: { token: string; promotion: PromotionInput }) => {
      const token = typeof args?.token === "string" ? args.token : "";
      const session = token
        ? await ctx.db.adminSessions.withIndex("by_token", (q) => q.eq("token", token)).first()
        : null;

      if (!session || session.expiresAt <= Date.now()) {
        return { ok: false, error: "Tu sesión expiró. Vuelve a entrar." };
      }

      const promotion = sanitizePromotion(args?.promotion);
      if (!promotion) {
        return { ok: false, error: "Revisa el código y el descuento." };
      }

      const duplicate = await ctx.db.promotions
        .withIndex("by_code", (q) => q.eq("code", promotion.code))
        .first();
      if (duplicate && duplicate.id !== promotion.id) {
        return { ok: false, error: "Ya existe una promoción con ese código." };
      }

      const values = {
        code: promotion.code,
        kind: promotion.kind,
        value: promotion.value,
        minSubtotal: promotion.minSubtotal,
        active: promotion.active
      };

      if (promotion.id) {
        const existing = await ctx.db.promotions.get(promotion.id);
        if (!existing) return { ok: false, error: "Esa promoción ya no existe." };
        await ctx.db.promotions.update(promotion.id, values);
        return { ok: true, id: promotion.id };
      }

      const row = await ctx.db.promotions.insert(values);
      return { ok: true, id: row.id };
    }),

    adminDeletePromotion: mutation(async (ctx, args: { token: string; id: string }) => {
      const token = typeof args?.token === "string" ? args.token : "";
      const session = token
        ? await ctx.db.adminSessions.withIndex("by_token", (q) => q.eq("token", token)).first()
        : null;

      if (!session || session.expiresAt <= Date.now()) {
        return { ok: false, error: "Tu sesión expiró. Vuelve a entrar." };
      }

      const id = typeof args?.id === "string" ? args.id : "";
      if (!id) return { ok: false, error: "Falta la promoción." };
      await ctx.db.promotions.delete(id);
      return { ok: true };
    })
  },

  actions: {
    applyPromotion: action(async (ctx, code: string) => {
      const normalized = cleanPromoCode(code);
      if (!normalized) return { ok: false, error: "Escribe un código." };

      const row = await ctx.db.promotions
        .withIndex("by_code", (q) => q.eq("code", normalized))
        .first();

      if (!row || !row.active) {
        return { ok: false, error: "Ese código no existe o ya no está activo." };
      }

      return {
        ok: true,
        promotion: {
          code: row.code,
          kind: (row.kind === "fixed" ? "fixed" : "percent") as PromotionKind,
          value: row.value,
          minSubtotal: row.minSubtotal
        }
      };
    })
  },

  endpoints: {
    health: endpoint({ method: "GET", path: "/api/health", readOnly: true }, () => json({ ok: true })),

    catalogCount: endpoint({ method: "GET", path: "/api/catalog-count", readOnly: true }, async (ctx, req) => {
      const secret = ctx.env.SEED_TOKEN;
      if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return json({ error: "unauthorized" }, { status: 401 });
      }
      const count = await ctx.db.products
        .withIndex("by_position", (q) => q.gte("position", 0))
        .count();
      return json({ count });
    }),

    seed: endpoint({ method: "POST", path: "/api/seed" }, async (ctx, req) => {
      const secret = ctx.env.SEED_TOKEN;
      if (!secret) {
        return json({ ok: false, error: "seed-disabled" }, { status: 503 });
      }
      if (req.headers.get("authorization") !== `Bearer ${secret}`) {
        return json({ ok: false, error: "unauthorized" }, { status: 401 });
      }

      const payload = await req.json<{
        products?: unknown[];
        settings?: unknown;
        promotions?: unknown[];
        replace?: boolean;
      }>();

      const products: ProductInput[] = [];
      if (Array.isArray(payload.products)) {
        for (const raw of payload.products) {
          const product = sanitizeProduct(raw);
          if (product) products.push(product);
        }
      }

      const promotions: PromotionInput[] = [];
      if (Array.isArray(payload.promotions)) {
        for (const raw of payload.promotions) {
          const promotion = sanitizePromotion(raw);
          if (promotion) promotions.push(promotion);
        }
      }

      if (products.length === 0 && promotions.length === 0) {
        return json({ ok: false, error: "no-products" }, { status: 400 });
      }

      if (products.length > 0) {
        const existing = await ctx.db.products
          .withIndex("by_position", (q) => q.gte("position", 0))
          .count();

        if (existing > 0 && payload.replace !== true) {
          return json({ ok: false, error: "already-seeded", count: existing }, { status: 409 });
        }

        if (payload.replace === true && existing > 0) {
          const rows = await ctx.db.products
            .withIndex("by_position", (q) => q.gte("position", 0))
            .collect();
          for (const row of rows) {
            await ctx.db.products.delete(row.id);
          }
        }

        for (const product of products) {
          await ctx.db.products.insert({
            name: product.name,
            price: product.price,
            collection: product.collection,
            imageUrl: product.imageUrl,
            description: product.description,
            available: product.available,
            featured: product.featured,
            position: product.position
          });
        }
      }

      const settings = sanitizeSettings(payload.settings);
      if (settings) {
        for (const [key, value] of Object.entries(settings)) {
          if (typeof value === "string") await upsertSetting(ctx, key, value);
        }
      }

      for (const promotion of promotions) {
        const existing = await ctx.db.promotions
          .withIndex("by_code", (q) => q.eq("code", promotion.code))
          .first();
        const values = {
          code: promotion.code,
          kind: promotion.kind,
          value: promotion.value,
          minSubtotal: promotion.minSubtotal,
          active: promotion.active
        };
        if (existing) {
          await ctx.db.promotions.update(existing.id, values);
        } else {
          await ctx.db.promotions.insert(values);
        }
      }

      return json({ ok: true, count: products.length, promotions: promotions.length });
    })
  }
});
