# Tema visual

El sitio sigue el catálogo original: beige cálido, marrón, dorado y tipografía condensada en mayúsculas.

## Paleta

| Uso | Color | Notas |
| --- | --- | --- |
| Fondo de página | `#fbf9f6` | Blanco cálido, casi neutro |
| Superficies claras | `#f7f1e9` | Secciones alternas, modales |
| Encabezados | `#a67f6c` | Rosa-taupe para títulos grandes |
| Tarjetas / blanco | `#fffdfb` | Fichas, círculo de precio, inputs |
| Texto principal | `#3f3a34` | Carbón cálido |
| Texto secundario | `#6f675f` | Gris cálido |
| Acento / botones | `#96684f` | Rosa-marrón polvoriento |
| Hover de acento | `#7a5440` | Rosa-marrón más oscuro |
| Dorado | `#96702f` | Categorías y detalles |
| Oscuro (footer) | `#403b35` | Carbón de la barra superior, contacto y pie |
| Error | `#9a3a2b` | Óxido |
| Backdrop | `#2f2b26` | Modales y carrito |
| Neutro de imagen | `#f0e6db` | Placeholders |

## Tipografía

- **Oswald** (`DISPLAY_FONT`): títulos, nombres de producto, navegación, folios. Se aplica `text-transform: uppercase` desde el objeto, así que todo lo que use `DISPLAY_FONT` sale en mayúsculas.
- **Great Vibes** (`SCRIPT_FONT`): acento caligráfico; hoy se usa en la segunda línea del hero.
- **Jost** (`SANS_FONT`): texto corrido, formularios y botones.
- Las tres se cargan en `client/ui.tsx` (`useFonts`). No hay archivos CSS ni build de Tailwind aparte.

## Detalles del catálogo

- Tarjetas de producto con marco blanco y banda de título blanca, como el catálogo (`ProductCard` en `client/shop.tsx`).
- Precio en círculo blanco sobre la foto del producto.
- Categorías en dorado con mayúsculas y tracking amplio.
- Destello (`Icon name="sparkle"`) como ornamento en el hero.
- Botones primarios marrón cálido; el texto claro es `#fff9f0`.

## Dónde cambiarlo

- `client/ui.tsx` — fuentes, marca, modal y toast.
- `client/shop.tsx` — tienda, tarjetas, drawer y fondo texturizado.
- `client/checkout.tsx` — checkout y fondo texturizado.
- `client/admin.tsx` — panel.
- `client/index.tsx` — página 404.

Si cambias un color, hazlo en todos los archivos para no dejar restos de la paleta anterior. Las clases usan valores arbitrarios (`bg-[#...]`), así que no hay un token central.
