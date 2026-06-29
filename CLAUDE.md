# CLAUDE.md — backend (Wiki CNB API)

Guía para Claude Code al trabajar en `backend/`. Complementa el `CLAUDE.md` de la raíz
(arquitectura general del monorepo). Código, comentarios y commits en **español**.

## Qué es

API serverless (Express en Vercel) + Firestore que sirve el contenido del CNB:
lectura pública (páginas, búsqueda, categorías, namespaces, sync offline) y un panel admin
protegido (Firebase Auth + allowlist). Es la fuente que consume el frontend.

## ⚠️ LÍMITE CRÍTICO: cuota de Firestore (plan Spark)

El proyecto Firebase `cnb-test-61a1a` está en **plan Spark (gratis)**:
**20,000 escrituras de documento por día**. La ingesta completa son **~199,400 páginas**
(`contenido_paginas.jsonl`, ~155 MB), así que **NO entra en un solo día**.

- 2026-06-28: la ingesta se detuvo en **20,500 páginas** con `8 RESOURCE_EXHAUSTED: Quota exceeded`.
- Decisión actual del usuario: **esperar el reset diario** (medianoche hora del Pacífico),
  NO subir a Blaze. A ~19k/día → ~10 días para cargar todo.
- Alternativa para terminar en minutos: subir el proyecto a **Blaze** (~$0.36 una vez) y reanudar.

### Cómo cargar las páginas por chunks (flujo diario)

```bash
# Cada día, tras el reset de cuota:
INGEST_LIMIT=19000 npm -w backend run ingest
```

- `INGEST_LIMIT=19000` corta limpio **bajo** la cuota. Sin él, al agotarse la cuota el cliente
  de Firestore reintenta ~10 min antes de morir (cuelgue inútil).
- El pipeline es **reanudable**: el progreso vive en `ingest-checkpoint.json` (gitignored).
  Cada corrida continúa desde la última línea.
- Los conteos de `namespaces`/`categories` se **acumulan en el checkpoint** entre corridas.
  Las colecciones `categories`/`namespaces`/`meta` se escriben **solo cuando se consume todo
  el archivo** (corrida sin `INGEST_LIMIT` o que llega al EOF) → navegación correcta aunque la
  carga vaya partida en días.
- Si reanudas desde un checkpoint **viejo** (sin acumuladores `ns`/`cat`), corre primero el
  backfill (solo local, **sin** escrituras a Firestore, seguro con cuota agotada):
  ```bash
  node scripts/backfill-aggregates.mjs
  ```
- Reiniciar todo desde cero: poner `ingest-checkpoint.json` en `{"processed":0,"lastLine":0}`.

Estado al 2026-06-28: **20,500 / 199,400** páginas en Firestore. Checkpoint con acumuladores
ya reconstruidos (3 namespaces, 142 categorías de esas 20,500).

## Comandos

```bash
npm -w backend run dev      # local (node --watch src/server.js)
npm -w backend run start    # local sin watch
npm -w backend run ingest   # ingesta JSONL → Firestore (ver INGEST_LIMIT arriba)
npm -w backend run deploy   # vercel --prod
```

No hay test runner ni linter configurados (no inventar `npm test` / `npm run lint`).

## Entorno (`backend/.env`, gitignored — copiar de `.env.example`)

- `FIREBASE_PROJECT_ID=cnb-test-61a1a`
- **Local**: `GOOGLE_APPLICATION_CREDENTIALS` = ruta al service-account JSON.
  **Vercel**: `FIREBASE_SERVICE_ACCOUNT` = el JSON pegado inline (nunca commitear el archivo).
- `ADMIN_EMAILS`, `CORS_ORIGIN`.
- `JSONL_PATH=./contenido_paginas.jsonl` (ruta al volcado; el `.jsonl` está gitignored).
- `INGEST_BATCH_SIZE` (≤500), `INGEST_LIMIT` (0 = sin límite), `HALLAZGOS_PATH` (opcional, spam).

`src/config/env.js` es el **único** módulo que lee `process.env`; el resto importa `config`.

## Arquitectura

Factory `createApp()` en `src/app.js` (sin escuchar), reusada por `src/server.js` (local) y
`api/index.js` (Vercel). Todas las rutas montan bajo `/api` vía `src/routes/index.js`.

Módulos por feature en `src/modules/<name>/`, en capas estrictas:
`model · repository · service · controller · routes · validation`.

- **repository**: única capa que toca Firestore (DIP). `src/config/firebaseAdmin.js` es el único
  punto privilegiado (singleton) y exporta `db`, `auth` y el mapa `collections`
  (`pages`, `categories`, `namespaces`, `meta`, `subscribers`) — sin strings mágicos.
- **validation**: Zod vía middleware `validate(schema, 'query'|'params'|'body')`.
- Módulos: `page`, `search`, `category`, `namespace`, `subscriber`, + route-only `sync` y `admin`,
  + `centros` (opcional, sirve NDJSON en memoria; no usa Firestore; el front desplegado usa el
  JSON estático, no este endpoint).
- **Auth** (`src/middlewares/auth.js`): `Authorization: Bearer <Firebase ID token>`.
  `requireAuth` verifica; `requireAdmin` además valida el email contra `config.adminEmails`.
- **Search** (`src/modules/search/search.service.js`): `array-contains-any` sobre `tokens[]`.
  `tokenize()` es el tokenizador canónico (la ingesta lo importa para que indexado y query coincidan).

## Ingesta (`backend/ingest/`)

`ingest.js` streamea el JSONL → Firestore. **Idempotente** (`pageid` como doc id) y **reanudable**
(checkpoint). Por registro: `wikitextToHtml` → `sanitize` → `classify` → `slugify` + `tokenize`.
Acumula `namespaces`/`categories` y escribe `meta/content` (version + count) para el sync.

## Robustez / cambios aplicados (2026-06-28)

- **`page.validation.js`**: `MAX_OFFSET=10000` en `/api/pages`. Firestore factura una lectura por
  cada doc saltado con `.offset()`; sin tope, un offset enorme sobre 199k dispara el costo.
  Para recorrer TODO el contenido usar `/api/sync/bundle` (cursor por `pageid`, sin saltos).
- **`ingest.js`**: acumuladores persistentes en el checkpoint + escritura de agregados solo al EOF
  (ver sección de cuota). `scripts/backfill-aggregates.mjs` reconstruye acumuladores tras reanudar.

## Pendientes / recordatorios

- **Desplegar índices compuestos** para que las queries `where+where+orderBy` funcionen en prod:
  `npm -w frontend run deploy:rules` (los índices viven en `frontend/firestore.indexes.json` y ya
  cubren todas las queries; falta desplegarlos).
- Terminar de cargar las ~179k páginas restantes (chunks diarios o subir a Blaze).

## Deploy

Vercel serverless (`vercel.json`; `api/index.js` maneja todo vía rewrite, 30s máx). Credenciales
por `FIREBASE_SERVICE_ACCOUNT` (nunca archivo commiteado).
