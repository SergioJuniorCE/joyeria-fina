# Problemas comunes

## El CLI dice "Not authenticated"

```sh
npx --yes lakebed auth login
npx --yes lakebed auth status
```

Completa la aprobación en el navegador. Si el navegador no abre, copia la URL y el código que imprime el comando.

## El deploy muestra "Claim required"

El deploy es anónimo. No tiene secretos ni `fetch` saliente y expira.

```sh
npx --yes lakebed claim
npx --yes lakebed deploy
```

Con sesión iniciada antes del primer deploy no aparece.

## `/admin` da 404 al recargar

Es un 404 del servidor, no del router. Lakebed sirve las rutas del cliente solo desde `/`.

- Entra desde la tienda: pie → **Administrar**.
- No guardes `/admin` como marcador ni la recargues.

## La tienda está vacía en el deploy

La base hosteada no tiene productos. Carga el catálogo:

```sh
bun scripts/seed.ts --target=https://frosted-signal-808252a92b.lakebed.app \
  --image-base=https://<host-publico>/seed-assets
```

El `--image-base` es obligatorio en hosteado. Ver [images.md](images.md).

## El seed responde 401

`SEED_TOKEN` no coincide.

- Local: revisa `.env.lakebed.server` y reinicia `lakebed dev` después de cambiarlo.
- Hosteado: el env solo se sincroniza en un deploy reclamado. Vuelve a desplegar:

```sh
npx --yes lakebed deploy
```

## El seed responde 409 already-seeded

Ya hay productos. Si de verdad quieres reemplazarlos:

```sh
bun scripts/seed.ts --force
```

Ojo: `--force` borra todos los productos y reescribe los ajustes con `DEFAULT_SETTINGS`.

## El seed dice "Hosted uploads require a signed-in app user"

Estás sembrando un deploy sin `--image-base`. Lakebed no acepta subidas del CLI en hosteado. Publica `seed-assets/` en un host estático y pasa la URL base. Ver [images.md](images.md).

## No puedo subir fotos desde el panel en producción

El botón de subida usa `client.storage`, que en hosteado exige un usuario con Google verificado. El panel no tiene ese login. Pega una URL pública en el campo **Imagen**.

En local el botón sí funciona.

## Las fotos salen rotas

1. Abre la URL de la imagen en el navegador.
2. Revisa nombre, extensión y mayúsculas.
3. Confirma que el host es público y no bloquea hotlinking.
4. Si cambiaste el archivo en el mismo URL, espera el cache (1 h en storage de Lakebed; puede ser más en un host externo).

### Las URLs de `raw.githubusercontent.com` dan 404

El catálogo actual apunta a:

```txt
https://raw.githubusercontent.com/SergioJuniorCE/joyeria-fina/master/seed-assets
```

Un 404 ahí significa que el repo no existe, es privado, la rama no es `master` o la carpeta no está en esa ruta. Arreglo:

1. Crea el repo público `SergioJuniorCE/joyeria-fina` (puede tener solo `seed-assets/`).
2. Sube las 56 fotos a `seed-assets/` en la rama `master`.
3. Verifica una URL en el navegador.
4. Si cambiaste de host o de ruta, vuelve a correr el seed con el nuevo `--image-base` (o corrige pocas URLs desde el panel).

Nota: GitHub raw no sirve para repos privados desde un `<img>` público.

## "Contraseña incorrecta" en el panel

- La contraseña es `ADMIN_PASSWORD` de `.env.lakebed.server`.
- Si la cambiaste, falta desplegar: `npx --yes lakebed deploy`.
- En local, reinicia `lakebed dev` para que lea el archivo de nuevo.

## "Tu sesión expiró"

Las sesiones duran 12 h. Vuelve a entrar. Las sesiones vencidas se limpian solas en el siguiente login.

## Los datos locales desaparecieron

`lakebed dev` borra base de datos y storage al reiniciar. Vuelve a correr:

```sh
bun scripts/seed.ts
```

## El puerto 3000 está ocupado

```sh
npx --yes lakebed dev --port 3001
bun scripts/seed.ts --port=3001
```

## Cambié código y el deploy no cambia

1. `npx --yes lakebed build` para ver errores de compilación.
2. `npx --yes lakebed deploy`.
3. `npx --yes lakebed inspect dep_YpfCKyDZHsnha-M5` y revisa `Updated`.
4. Confirma que `lakebed.json` apunta al deploy correcto.

## Quiero ver errores del servidor

```sh
npx --yes lakebed logs dep_YpfCKyDZHsnha-M5
```

Agrega `ctx.log.error(...)` en un handler si necesitas más detalle.

## Lakebed responde con límites o 429

Revisa https://docs.lakebed.dev/limits/. El plan gratuito topa requests, mutations, filas y bytes. Para un catálogo de 54 productos no debería ser problema salvo mucho tráfico.
