export const COLLECTIONS = [
  { id: 'todos', label: 'Todo' },
  { id: 'clasicos', label: 'Clásicos' },
  { id: 'corazones', label: 'Corazones' },
  { id: 'estrellas', label: 'Estrellas' },
  { id: 'formas', label: 'Formas' },
  { id: 'musica', label: 'Música' },
  { id: 'letras', label: 'Letras' }
] as const;

export const COLLECTION_IDS = COLLECTIONS.filter((collection) => collection.id !== 'todos').map(
  (collection) => collection.id
);

export const CATEGORY_LABEL: Record<string, string> = {
  clasicos: 'Clásicos',
  corazones: 'Corazones',
  estrellas: 'Estrellas',
  formas: 'Formas',
  musica: 'Música',
  letras: 'Letras'
};

export const CATEGORY_DESC: Record<string, string> = {
  clasicos: 'Un clásico en oro de 10 kt con acabado pulido. Una pieza ligera para usar todos los días.',
  corazones: 'Un corazón en oro de 10 kt. Un detalle romántico que no necesita ocasión.',
  estrellas: 'Una estrella en oro de 10 kt. Brillo discreto para acompañarte de día y de noche.',
  formas: 'Un diseño en oro de 10 kt. Una forma singular para sumar carácter al look.',
  musica: 'Una nota musical en oro de 10 kt. Para quien lleva el ritmo en la piel.',
  letras: 'Una letra en oro de 10 kt. Tu inicial, o la de alguien especial.'
};

export type ProductRecord = {
  id: string;
  name: string;
  price: number;
  collection: string;
  imageUrl: string;
  description: string;
  available: boolean;
  featured: boolean;
  position: number;
};

export type ProductInput = {
  id?: string;
  name: string;
  price: number;
  collection: string;
  imageUrl: string;
  description: string;
  available: boolean;
  featured: boolean;
  position: number;
};

export type SiteSettings = {
  whatsapp: string;
  instagram: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  heroImageUrl: string;
  storyImageUrl: string;
  shippingNote: string;
  paymentNote: string;
};

export const SETTINGS_KEYS = [
  'whatsapp',
  'instagram',
  'heroEyebrow',
  'heroHeadline',
  'heroSubtext',
  'heroImageUrl',
  'storyImageUrl',
  'shippingNote',
  'paymentNote'
] as const;

export type SettingKey = (typeof SETTINGS_KEYS)[number];

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp: '526444616545',
  instagram: 'joyeriafina_broqueles',
  heroEyebrow: 'Joyería fina · Oro de 10 kt',
  heroHeadline: 'Piezas pequeñas. Brillo que dura.',
  heroSubtext: 'Broqueles de oro de 10 kt, elegidos uno a uno para acompañarte sin esfuerzo.',
  heroImageUrl: '',
  storyImageUrl: '',
  shippingNote: 'Envíos a todo México.',
  paymentNote: 'Transferencia, depósito bancario y efectivo.'
};

export function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function cleanPrice(value: unknown): number | null {
  const price = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(price) || price < 0 || price > 1000000) return null;
  return Math.round(price * 100) / 100;
}

export function cleanCollection(value: unknown): string {
  return typeof value === 'string' && COLLECTION_IDS.includes(value as never) ? value : 'clasicos';
}

export function cleanImageUrl(value: unknown): string {
  const raw = cleanText(value, 2048);
  if (!raw) return '';
  if (raw.startsWith('/storage/')) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? raw : '';
  } catch {
    return '';
  }
}

export function sanitizeProduct(input: unknown): ProductInput | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const name = cleanText(raw.name, 90);
  const price = cleanPrice(raw.price);
  if (!name || price === null) return null;

  return {
    id: cleanText(raw.id, 80) || undefined,
    name,
    price,
    collection: cleanCollection(raw.collection),
    imageUrl: cleanImageUrl(raw.imageUrl),
    description: cleanText(raw.description, 600),
    available: raw.available !== false,
    featured: raw.featured === true,
    position: Number.isFinite(Number(raw.position)) ? Math.max(0, Math.trunc(Number(raw.position))) : 0
  };
}

export function sanitizeSettings(input: unknown): Partial<SiteSettings> | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const result: Partial<SiteSettings> = {};

  for (const key of SETTINGS_KEYS) {
    if (!(key in raw)) continue;
    const value = cleanText(raw[key], key === 'heroImageUrl' || key === 'storyImageUrl' ? 2048 : 300);
    if (key === 'heroImageUrl' || key === 'storyImageUrl') {
      result[key] = cleanImageUrl(value);
    } else if (key === 'whatsapp') {
      result[key] = value.replace(/[^\d]/g, '').slice(0, 20);
    } else if (key === 'instagram') {
      result[key] = value.replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 80);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function normalizeProduct(row: ProductRecord): ProductRecord {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    collection: row.collection,
    imageUrl: row.imageUrl,
    description: row.description,
    available: row.available,
    featured: row.featured,
    position: row.position
  };
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(value);
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  const local = digits.startsWith('52') ? digits.slice(2) : digits;
  return local.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
