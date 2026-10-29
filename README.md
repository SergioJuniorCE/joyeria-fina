# Joyería Fina · Lakebed capsule

Storefront y panel de administración para 54 broqueles de oro de 10 kt. Corre como un capsule de Lakebed: Preact, Tailwind, base de datos, storage y hosting incluidos.

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

Panel: abre el enlace **Administrar** en el pie de la tienda. La ruta se sirve dentro del router del cliente. En el servidor local, recargar directamente `/admin` puede dar 404; navega desde la tienda. En un deploy hosteado la ruta se sirve como el resto de las rutas del cliente.

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

En un deploy hosteado, Lakebed solo acepta subidas de un usuario de la app con Google verificado, no de las credenciales del desarrollador. Para mantener el panel con contraseña y evitar un login, publica `seed-assets/` en un host estático público y pásalo al seed:

```sh
bun scripts/seed.ts --target=https://<tu-deploy>.lakebed.app --image-base=https://<host-publico>/seed-assets
```

Cualquier host estático sirve: GitHub raw, Cloudflare Pages, Vercel o un bucket público. Si el repo es público, GitHub raw es la opción más directa.

La alternativa es subir cada imagen desde el panel con una sesión de Lakebed con Google. El panel acepta tanto una URL pública como una subida directa. En local la subida funciona sin cuenta; en producción el botón de subida pide esa sesión. El CRUD y la contraseña del panel no dependen de Google.

## Deploy

```sh
npx --yes lakebed auth login
npx --yes lakebed deploy
```

El primer comando crea o usa tu app propia en Lakebed. El deploy imprime la URL. Después publica `seed-assets/` en un host estático y carga el catálogo hosteado:

```sh
bun scripts/seed.ts --target=https://<tu-deploy>.lakebed.app --image-base=https://<host-publico>/seed-assets
```

Si haces un deploy anónimo primero:

```sh
npx --yes lakebed deploy
npx --yes lakebed claim
npx --yes lakebed deploy
```

Las variables del servidor solo se sincronizan después de reclamar el deploy. Los deploys anónimos expiran; los reclamados no.

## Modelo de datos

- `products`: nombre, precio, colección, imagen, descripción, disponibilidad, favorito y orden.
- `settings`: WhatsApp, Instagram, textos e imágenes del hero, envíos y pagos.
- `adminSessions`: token y expiración del panel.

## Alcance actual de Lakebed

Lakebed está en alpha pública. No incluye dominios personalizados y el plan es gratuito con límites de requests, mutations, filas y bytes. Para este catálogo de 54 productos es suficiente, pero no es una plataforma de producción a gran escala.
