# Documentación de la app

Guías para operar el catálogo, las fotos y el deploy de Joyería Fina en Lakebed.

## Datos rápidos

| Dato | Valor |
| --- | --- |
| App publicada | https://frosted-signal-808252a92b.lakebed.app |
| Deploy ID | `dep_YpfCKyDZHsnha-M5` |
| Estado | Reclamado, no expira |
| Proyecto local | `C:\Users\sergi\.t3\projects\joyeria-fina` |
| Panel | Tienda → **Administrar** en el pie (no recargues `/admin` directo) |
| Fotos | `https://raw.githubusercontent.com/SergioJuniorCE/joyeria-fina/master/seed-assets` (el repo debe existir y ser público, rama `master`) |
| Runtime | Lakebed `0.0.41`, base de datos API v1 |

## Guías

- [Deploy y operación](deploy.md) — publicar cambios, logs, base de datos, dominios, apagar/restaurar.
- [Catálogo y panel](catalog.md) — productos, precios, colecciones, textos, contraseña del panel.
- [Fotos e imágenes](images.md) — agregar, reemplazar y publicar fotos de productos, hero e historia.
- [Problemas comunes](troubleshooting.md) — errores típicos y cómo resolverlos.

## Mapa del repo

```txt
server/index.ts        API del capsule: tablas, queries, mutations, endpoints
client/index.tsx       Router y entrada de la app
client/shop.tsx        Tienda
client/admin.tsx       Panel de administración
client/ui.tsx          Piezas visuales compartidas
client/api.ts          Cliente tipado de Lakebed
shared/config.ts       Tipos, colecciones y ajustes por defecto
shared/catalog.ts      Catálogo inicial (solo lo usa el seed)
scripts/seed.ts        Carga inicial del catálogo y las fotos
seed-assets/           Fotos originales para el seed
lakebed.json           Deploy ID que usa el CLI
.env.lakebed.server    Secretos del servidor (gitignored)
.lakebed/              Artefactos locales del CLI (gitignored)
```

## Regla de oro

La base de datos de Lakebed es la fuente de verdad una vez que sembraste el catálogo. `shared/catalog.ts` y `scripts/seed.ts` solo sirven para la carga inicial o para reemplazar todo el catálogo de golpe. Los cambios del día a día se hacen desde el panel.
