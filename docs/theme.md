# Tema visual

El sitio sigue el catálogo original: beige cálido, marrón, dorado y tipografía condensada en mayúsculas.

## Paleta

| Uso | Token | Color |
| --- | --- | --- |
| Fondo de página | `--paper` | `#fbf9f6` |
| Superficies claras | `--surface` | `#f7f1e9` |
| Tarjetas / blanco | `--card` | `#fffdfb` |
| Neutro de imagen | `--neutral` | `#f0e6db` |
| Texto principal | `--ink` | `#3f3a34` |
| Texto secundario | `--muted` | `#6f675f` |
| Encabezados | `--taupe` | `#946b57` |
| Acento / botones | `--accent` | `#96684f` |
| Hover de acento | `--accent-strong` | `#7a5440` |
| Texto de botón | `--button-ink` | `#fffdf9` |
| Dorado | `--gold` | `#866126` |
| Oscuro (contacto) | `--dark` | `#403b35` |
| Texto sobre oscuro | `--dark-ink` | `#fbf8f3` |
| Borde de campos | `--field-edge` | `#7d766d` |
| Error | `--danger` | `#9a3a2b` |
| Backdrop | `--backdrop` | `#2f2b26` |

## Tipografía

- **Oswald** (`DISPLAY_FONT`): títulos, nombres de producto, navegación, folios. Se aplica `text-transform: uppercase` desde el objeto, así que todo lo que use `DISPLAY_FONT` sale en mayúsculas.
- **Great Vibes** (`SCRIPT_FONT`): acento caligráfico; hoy se usa en la segunda línea del hero.
- **Jost** (`SANS_FONT`): texto corrido, formularios y botones.
- Las tres se cargan en `client/ui.tsx` (`useFonts`). No hay archivos CSS ni build de Tailwind aparte.

## Tokens

`client/theme.ts` define la paleta, las fuentes y las variantes con alfa en un bloque `:root`, y `useFonts` lo inyecta una sola vez. En el código se usan clases con los tokens, por ejemplo `bg-[var(--paper)]`, `text-[var(--ink)]`, `border-[var(--field-edge)]` o `bg-[var(--ink-15)]`.

Si necesitas un nuevo tono, agrégalo al bloque de `client/theme.ts` y úsalo por su token. No pongas hex directos en las clases.

## Detalles del catálogo

- Tarjetas de producto con marco blanco y banda de título blanca, como el catálogo (`ProductCard` en `client/shop.tsx`).
- Precio en círculo blanco sobre la foto del producto; en fondos claros el círculo lleva un borde fino.
- Categorías en dorado, 12 px, minúsculas y sin tracking.
- Destello (`Icon name="sparkle"`) como ornamento en el hero y flecha de flujo en "Cómo comprar".
- Botones primarios `--accent` con texto `--button-ink`.

## Dónde cambiarlo

- `client/theme.ts` — tokens de color, fuentes y base de accesibilidad.
- `client/ui.tsx` — fuentes, marca, modal y toast.
- `client/shop.tsx` — tienda, tarjetas y drawer.
- `client/checkout.tsx` — checkout.
- `client/admin.tsx` — panel.
- `client/index.tsx` — página 404.
