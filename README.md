# Joyería Fina · Lakebed capsule

Storefront y panel de administración para 54 broqueles de oro de 10 kt. Corre como un capsule de Lakebed: Preact, Tailwind, base de datos, storage y hosting incluidos.

## App publicada

- **URL:** https://frosted-signal-808252a92b.lakebed.app
- **Deploy:** `dep_YpfCKyDZHsnha-M5` (reclamado, no expira)
- **Panel:** abre la tienda y usa **Administrar** en el pie.
- **Deploy ID en el repo:** [lakebed.json](lakebed.json).

La ruta `/admin` vive en el router del cliente. Recargar esa URL directo responde 404, también en el deploy; entra siempre desde el enlace del pie.

Para publicar cambios:

```sh
npx --yes lakebed deploy
```

Guía completa de deploy, env, logs y dominios: [docs/deploy.md](docs/deploy.md).

## Documentación

- [docs/README.md](docs/README.md) — índice y mapa del repo.
- [docs/deploy.md](docs/deploy.md) — publicar, logs, base de datos, dominios, apagar/restaurar.
- [docs/catalog.md](docs/catalog.md) — productos, precios, colecciones, ajustes y contraseña.
- [docs/images.md](docs/images.md) — agregar y reemplazar fotos, hero e historia.
- [docs/troubleshooting.md](docs/troubleshooting.md) — errores comunes.

## Actualizar fotos y catálogo

**Un producto o una foto:** entra al panel, edita el producto y guarda. No hace falta deploy ni seed.

**Todo el catálogo:** edita `shared/catalog.ts`, copia las fotos a `seed-assets/`, publica esa carpeta en un host estático y corre el seed con `--force`. Esto reemplaza productos y ajustes; los cambios hechos en el panel se pierden. Detalle paso a paso en [docs/images.md](docs/images.md) y [docs/catalog.md](docs/catalog.md).

**Fotos en producción:** pega una URL pública en el campo **Imagen**. El botón de subida del panel no funciona en el deploy hosteado porque Lakebed exige un usuario con Google verificado y el panel no tiene ese login.

## Correr localmente

Copia el ejemplo de variables y define una contraseña y un token:

```sh
cp .env.lakebed.server.example .env.lakebed.server
```

Después:

```sh
npx --yes lakebed dev
```

En otra terminal, carga el catálogo y las imágenes:

```sh
bun scripts/seed.ts
```

El seed sube las fotos a Lakebed storage, crea los 54 productos y guarda los ajustes del sitio. La base de datos y los archivos locales se borran al reiniciar `lakebed dev`, así que vuelve a correr el seed después de cada reinicio.

Tienda: `http://127.0.0.1:3000/`

## Panel

- Una sola contraseña, sin cuentas de usuario.
- Se configura en `.env.lakebed.server` como `ADMIN_PASSWORD`.
- La sesión vive 12 horas y se guarda en `sessionStorage`.
- Permite crear, editar, ocultar y eliminar productos, cambiar precios, colección, orden, favoritos, imagen y descripción.
- Los ajustes permiten editar WhatsApp, Instagram, textos e imágenes del hero y de la historia.
- `SEED_TOKEN` protege el endpoint de carga inicial del catálogo.

Cambia `ADMIN_PASSWORD` y `SEED_TOKEN` antes de desplegar. El archivo `.env.lakebed.server` está ignorado por git.

### Imágenes

En local, el seed sube las fotos a Lakebed storage y guarda las URLs en la base de datos.

En un deploy hosteado, Lakebed solo acepta subidas de un usuario de la app con Google verificado, no de las credenciales del desarrollador ni del panel con contraseña. Para cargar el catálogo, publica `seed-assets/` en un host estático público y pásalo al seed:

```sh
bun scripts/seed.ts --target=https://frosted-signal-808252a92b.lakebed.app \
  --image-base=https://raw.githubusercontent.com/SergioJuniorCE/joyeria-fina/master/seed-assets
```

Ese es el host que usa el catálogo actual. Requisitos: el repo `SergioJuniorCE/joyeria-fina` debe existir, ser público y tener las fotos en `seed-assets/` sobre la rama `master`. Si el repo no existe o es privado, las URLs dan 404 y la tienda muestra imágenes rotas. Cualquier otro host estático sirve igual (GitHub Pages, Cloudflare Pages, Vercel, bucket público). Más detalle en [docs/images.md](docs/images.md).

## Deploy

```sh
npx --yes lakebed auth login
npx --yes lakebed deploy
```

El primer comando crea o usa tu app propia en Lakebed. El deploy imprime la URL y escribe `lakebed.json` con el `deployId`; commitea ese archivo para que otros checkouts actualicen el mismo deploy.

Si haces un deploy anónimo primero:

```sh
npx --yes lakebed deploy
npx --yes lakebed claim
npx --yes lakebed deploy
```

Las variables del servidor solo se sincronizan después de reclamar el deploy, y la sincronización es por reemplazo. Los deploys anónimos expiran; los reclamados no.

Verificación y operación:

```sh
npx --yes lakebed inspect dep_YpfCKyDZHsnha-M5
npx --yes lakebed logs dep_YpfCKyDZHsnha-M5
npx --yes lakebed db dump dep_YpfCKyDZHsnha-M5
```

## Modelo de datos

- `products`: nombre, precio, colección, imagen, descripción, disponibilidad, favorito y orden.
- `settings`: WhatsApp, Instagram, textos e imágenes del hero, envíos y pagos.
- `adminSessions`: token y expiración del panel.

## Alcance actual de Lakebed

Lakebed está en alpha pública. Incluye subdominios `*.lakebed.app` y no es una plataforma de producción a gran escala. El plan es gratuito con límites de requests, mutations, filas y bytes. Para este catálogo de 54 productos es suficiente. Revisa https://docs.lakebed.dev/limits/ antes de crecer.
