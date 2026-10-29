# Catálogo y panel

La base de datos de Lakebed es la fuente de verdad. `shared/catalog.ts` solo alimenta el seed.

## Entrar al panel

1. Abre la tienda: https://frosted-signal-808252a92b.lakebed.app
2. Baja al pie y pulsa **Administrar**.
3. Escribe la contraseña de `ADMIN_PASSWORD` (`.env.lakebed.server`).

Notas:

- La ruta `/admin` vive en el router del cliente. Recargar esa URL directo responde 404, incluso en el deploy; entra siempre desde el enlace del pie.
- La sesión dura 12 h y se guarda en `sessionStorage` del navegador. Al expirar, vuelve a entrar.
- No hay cuentas de usuario. Es una sola contraseña para todos.
- Cambiar la contraseña: edita `.env.lakebed.server`, ejecuta `npx --yes lakebed deploy` y vuelve a entrar. Las sesiones ya abiertas siguen hasta que expiren.

## Productos

Cada producto tiene:

| Campo | Qué hace |
| --- | --- |
| Nombre | Se muestra en la tarjeta y el detalle. |
| Precio | Número en pesos. Se usa en la tienda y en el mensaje de WhatsApp. |
| Colección | `clasicos`, `corazones`, `estrellas`, `formas`, `musica`, `letras`. |
| Imagen | URL pública o subida desde el panel. Ver [images.md](images.md). |
| Descripción | Texto largo del detalle. |
| Disponible | Si está apagado, se oculta de la tienda. |
| Favorito | Lo marca para la selección destacada. |
| Orden | Número; menor aparece primero. Un producto nuevo toma `productos + 1`. |

Desde el panel puedes crear, editar, ocultar y eliminar. Los cambios se ven en la tienda al instante (la query se invalida al guardar).

El nombre y el precio son obligatorios. El servidor recorta textos y rechaza precios fuera de rango (`0` a `1,000,000`).

## Ajustes del sitio

Pestaña **Ajustes**:

- WhatsApp (solo dígitos con lada, ej. `526444616545`).
- Instagram (sin `@`).
- Textos del hero: eyebrow, titular, subtítulo.
- Imagen del hero y de la historia (URL pública).
- Nota de envíos y nota de pagos.

Los ajustes se guardan como filas clave/valor en la tabla `settings`. Borrar una clave desde el panel no está expuesto: se escribe el valor vacío.

## Cambios masivos con el seed

El seed sirve para dos cosas: cargar el catálogo desde cero y reemplazarlo completo.

1. Edita `shared/catalog.ts`:
   - `SEED_PRODUCTS`: nombre, precio, colección, archivo de imagen, favorito.
   - `SEED_DESCRIPTIONS`: descripción por colección.
   - `SEED_MEDIA`: foto del hero y de la historia.
2. Copia las fotos nuevas a `seed-assets/`.
3. Ejecuta el seed (ver [images.md](images.md) para el host de imágenes).

Advertencia: usar `--force` borra **todos** los productos y vuelve a escribir los ajustes con `DEFAULT_SETTINGS`. Se pierden los textos y precios editados desde el panel. Úsalo solo cuando quieras reemplazar el catálogo completo.

Sin `--force`, el seed se niega a correr si ya hay productos (`409 already-seeded`).

### Local

```sh
npx --yes lakebed dev
# en otra terminal
bun scripts/seed.ts
```

La base y los archivos locales se borran al reiniciar `lakebed dev`. Vuelve a correr el seed después de cada reinicio.

Si el puerto no es 3000:

```sh
npx --yes lakebed dev --port 3001
bun scripts/seed.ts --port=3001
```

### Hosteado

```sh
bun scripts/seed.ts --target=https://frosted-signal-808252a92b.lakebed.app \
  --image-base=https://raw.githubusercontent.com/SergioJuniorCE/joyeria-fina/master/seed-assets
```

`--image-base` es obligatorio en hosteado: Lakebed no acepta subidas del CLI. Detalles en [images.md](images.md).

## Dónde vive cada cosa

| Tabla | Contenido |
| --- | --- |
| `products` | Catálogo y orden. |
| `settings` | WhatsApp, Instagram, textos e imágenes del sitio. |
| `adminSessions` | Tokens del panel con expiración. |

Para inspeccionar o respaldar:

```sh
npx --yes lakebed db dump dep_YpfCKyDZHsnha-M5
npx --yes lakebed db export dep_YpfCKyDZHsnha-M5 --out backup.json
```

Las sesiones vencidas se limpian solas al iniciar sesión.
