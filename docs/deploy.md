# Deploy y operación

Todo se ejecuta desde la raíz del repo.

## Requisitos

- Node con `npx`.
- Sesión de Lakebed: `npx --yes lakebed auth login`.
- Comprobar la sesión: `npx --yes lakebed auth status`.

El CLI guarda el deploy en `lakebed.json` (`deployId`). Ese archivo sí se commitea: permite que cualquier checkout actualice el mismo deploy.

## Publicar cambios

```sh
npx --yes lakebed deploy
```

El comando compila, sube el artefacto y actualiza la URL existente. No borra la base de datos ni los archivos.

Qué se publica:

- `server/`, `client/`, `shared/` y `favicon.svg`.
- No se publican `seed-assets/`, `scripts/` ni `.env.lakebed.server` como archivos estáticos.
- Los secretos del servidor se sincronizan desde `.env.lakebed.server` (ver abajo).

## Primera vez y deploys anónimos

Si no hay sesión, `deploy` puede crear un deploy anónimo. Ese deploy:

- Muestra una página "Claim required" en vez de la app.
- No tiene secretos de servidor ni `fetch` saliente.
- Expira (~1 semana).

Solución:

```sh
npx --yes lakebed auth login
npx --yes lakebed claim
npx --yes lakebed deploy
npx --yes lakebed deploy
```

Con sesión iniciada antes del primer deploy no hace falta reclamar. El deploy actual (`dep_YpfCKyDZHsnha-M5`) ya está reclamado y no expira.

## Secretos y variables del servidor

Archivo: `.env.lakebed.server` (ignorado por git).

```env
ADMIN_PASSWORD=...
SEED_TOKEN=...
```

- Solo existen en el servidor (`ctx.env`), nunca en el cliente.
- La sincronización es **reemplazo**: si borras una clave del archivo y despliegas, se borra del deploy.
- Solo se sincronizan en deploys reclamados.
- Para rotar la contraseña del panel: edita el archivo, despliega y vuelve a entrar. Las sesiones abiertas siguen vivas hasta 12 h (viven en la tabla `adminSessions`).
- `SEED_TOKEN` protege `GET /api/catalog-count` y `POST /api/seed`.

## Verificar el deploy

```sh
npx --yes lakebed deploy list
npx --yes lakebed inspect dep_YpfCKyDZHsnha-M5
npx --yes lakebed logs dep_YpfCKyDZHsnha-M5
npx --yes lakebed db dump dep_YpfCKyDZHsnha-M5
npx --yes lakebed storage list dep_YpfCKyDZHsnha-M5
```

- `inspect` muestra URL, runtime, tablas, índices, queries y mutations. Requiere estar en la carpeta del proyecto para encontrar `lakebed.json`.
- `logs` muestra los errores del servidor y lo que escribas con `ctx.log`.
- `db dump` baja un JSON con todas las filas; útil para respaldar o revisar.
- `storage list` lista las imágenes subidas (en este deploy no hay porque las imágenes hosteadas van por URL externa).

## Backups

La base de datos vive en Lakebed. Antes de cambios grandes:

```sh
npx --yes lakebed db export dep_YpfCKyDZHsnha-M5 --out backup.json
```

`db export` escribe un archivo; `db dump` solo imprime.

## Dominio

El deploy usa un subdominio de Lakebed. Los deploys reclamados pueden reservar uno propio:

```sh
npx --yes lakebed domains add joyeria-fina.lakebed.app
npx --yes lakebed domains status joyeria-fina.lakebed.app
npx --yes lakebed domains list
```

Nombres reservados como `admin`, `api`, `docs` o `www` no se pueden registrar. En la alpha, los dominios personalizados dependen de lo que permita Lakebed; revisa `npx lakebed domains add <hostname>` para tu caso.

## Apagar, archivar y borrar

```sh
npx --yes lakebed deploy archive dep_YpfCKyDZHsnha-M5
npx --yes lakebed deploy restore dep_YpfCKyDZHsnha-M5
npx --yes lakebed deploy terminate dep_YpfCKyDZHsnha-M5 --yes
```

- `archive` deja de servir tráfico pero conserva datos, logs, env y dominio.
- `restore` lo vuelve a activar.
- `terminate` es irreversible y no permite más deploys sobre ese ID. No borra los datos retenidos.

## CI o automatización

```sh
npx --yes lakebed token create --name ci
LAKEBED_TOKEN=<token> npx --yes lakebed deploy
```

`LAKEBED_TOKEN` sustituye la sesión guardada. Si usas `--api`, define también `LAKEBED_TOKEN_API` con el mismo origen.

## Límites

Lakebed está en alpha pública y el plan es gratuito. Antes de crecer:

- https://docs.lakebed.dev/limits/
- https://docs.lakebed.dev/reference/

Requests, mutations, filas y bytes tienen topes. El catálogo actual (54 productos, 9 ajustes) queda muy por debajo, pero un catálogo masivo o muchas visitas pueden chocar con el límite.
