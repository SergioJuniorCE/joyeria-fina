# Fotos e imágenes

Hay dos caminos: una foto a la vez desde el panel, o un lote completo con el seed.

## Formatos y tamaños

- JPEG, WebP o PNG. Para fotos de producto usa JPEG/WebP.
- Productos: vertical, proporción aproximada 7:8. 800–1200 px de ancho es suficiente.
- Hero e historia: horizontal, 1600–2000 px de ancho.
- Apunta a menos de 300–500 KB por imagen. El catálogo actual pesa ~3.4 MB en 56 archivos.
- Nombres sin espacios ni acentos si van a un host estático. El nombre debe coincidir exactamente (mayúsculas incluidas).

## Opción 1: una foto desde el panel

1. Tienda → **Administrar** → producto → **Editar**.
2. Pega una URL pública en **Imagen**, o usa el botón de subida.
3. Guarda.

Sobre el botón de subida:

- En local (`lakebed dev`) funciona sin cuenta.
- En el deploy hosteado falla con "A guest session or sign-in is required". Lakebed solo acepta subidas de un usuario de la app con Google verificado, y este panel no tiene login con Google.
- En producción, la vía práctica es pegar una URL pública.

La URL debe ser `https://...` (o una ruta `/storage/...` del propio deploy). El servidor rechaza esquemas raros y limita el largo a 2048 caracteres.

## Opción 2: lote con el seed

Útil para cargar las 54 fotos o para reemplazar el catálogo completo.

1. Copia las fotos a `seed-assets/`.
2. Agrega o edita las entradas en `shared/catalog.ts` (`SEED_PRODUCTS`, `SEED_MEDIA`).
3. Publica la carpeta `seed-assets/` en un host estático público.
4. Corre el seed con `--image-base`.

Host actual del catálogo:

```txt
https://raw.githubusercontent.com/SergioJuniorCE/joyeria-fina/master/seed-assets
```

```sh
bun scripts/seed.ts --target=https://frosted-signal-808252a92b.lakebed.app \
  --image-base=https://raw.githubusercontent.com/SergioJuniorCE/joyeria-fina/master/seed-assets
```

Ese repo debe existir, ser **público** y tener las fotos en `seed-assets/` sobre la rama `master`. Si no existe, es privado o cambia la rama, las imágenes dan 404 y la tienda se ve con fotos rotas. En ese caso crea el repo, sube la carpeta y vuelve a correr el seed (o corrige las URLs desde el panel).

El seed construye cada URL como `--image-base` + `/` + nombre del archivo. Por eso:

- Todos los archivos deben estar planos dentro de la carpeta publicada.
- El host debe servir el archivo exacto, con su contenido de imagen.
- Si falta un archivo, la tarjeta queda con imagen rota.

Para reemplazar todo el catálogo agrega `--force`. Ojo: borra los productos y reescribe los ajustes con `DEFAULT_SETTINGS` (ver [catalog.md](catalog.md)).

### Dónde publicar `seed-assets/`

Cualquier host estático público y estable sirve:

- **GitHub**: sube la carpeta a un repo público y usa los raw URLs:
  `https://raw.githubusercontent.com/<usuario>/<repo>/<rama>/seed-assets`
- **GitHub Pages**: activa Pages en el repo y usa
  `https://<usuario>.github.io/<repo>/seed-assets`
- **Cloudflare Pages / Vercel / Netlify**: sube la carpeta como sitio estático.
- **S3 / R2 / bucket público**: usa la URL base del bucket.

Requisitos: HTTPS, acceso público sin login, y que las URLs no cambien. Si el catálogo crece, mantén el mismo host para no re-sembrar todo.

### GitHub rápido

El catálogo actual espera las fotos en:

```txt
https://raw.githubusercontent.com/SergioJuniorCE/joyeria-fina/master/seed-assets
```

Basta con que el repo `SergioJuniorCE/joyeria-fina` sea público y tenga `seed-assets/` en `master`. No necesita contener el código de la app: puede ser un repo solo de fotos.

Si usas otro repo, corre el seed otra vez con el nuevo `--image-base` o ajusta las URLs desde el panel. Cambiar de host sin actualizar la base deja todas las fotos rotas.

## Opción 3: reemplazar fotos existentes

- **Un producto**: edita la URL desde el panel. Es el método más simple.
- **Misma URL**: si sobrescribes el archivo en el host, la foto cambia sin tocar la base. Lakebed cachea storage público 1 h; un host externo puede cachear más. Si necesitas el cambio inmediato, usa un nombre nuevo.
- **Lote**: vuelve a correr el seed con `--force`.

## Hero e imagen de historia

- Se editan en el panel, pestaña **Ajustes** (`heroImageUrl`, `storyImageUrl`).
- El seed las toma de `SEED_MEDIA` (`heroFile`, `storyFile`) en `shared/catalog.ts`.
- También deben ser URLs públicas; aplican las mismas reglas.

## Si una foto no se ve

1. Abre la URL directamente en el navegador. Debe mostrar la imagen, no un 404 ni HTML.
2. Revisa mayúsculas y extensión del archivo.
3. Confirma que el host no requiere login ni bloquea hotlinking.
4. En el deploy, revisa `npx --yes lakebed logs dep_YpfCKyDZHsnha-M5`.
5. Si acabas de sobrescribir el archivo, espera el cache o cambia el nombre.

## ¿Y subir fotos al storage de Lakebed en producción?

No es posible con credenciales del CLI ni con la contraseña del panel. Lakebed exige un usuario de la app con Google verificado. Si más adelante quieres usar el botón de subida en producción, hay que agregar `SignInWithGoogle` al panel; hoy no existe y por eso el flujo hosteado es por URL.
