import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Service de "centros" (registros del CNB). Lee el NDJSON slim generado por
 * `scripts/build-paginas-slim.js` y lo sirve paginado/filtrado/buscado DESDE
 * MEMORIA — no depende de Firestore, así la vista funciona en local sin
 * credenciales. Carga perezosa y única (singleton).
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const SLIM = resolve(HERE, '../../../data/paginas.slim.ndjson');

// Nombres legibles de los espacios de nombres de MediaWiki (los del CNB).
const NS_NAMES = {
  0: '(Principal)', 1: 'Discusión', 2: 'Usuario', 3: 'Usuario discusión',
  4: 'CNB', 5: 'CNB discusión', 6: 'Archivo', 7: 'Archivo discusión',
  8: 'MediaWiki', 9: 'MediaWiki discusión', 10: 'Plantilla', 11: 'Plantilla discusión',
  12: 'Ayuda', 13: 'Ayuda discusión', 14: 'Categoría', 15: 'Categoría discusión',
  274: 'Widget', 828: 'Módulo',
};
export const nsName = (ns) => NS_NAMES[ns] ?? `ns${ns}`;

const SORTABLE = new Set(['pageid', 'title', 'lastModified', 'chars']);

let cache = null;

function load() {
  if (cache) return cache;
  if (!existsSync(SLIM)) {
    throw new Error(
      `No existe ${SLIM}. Genera los datos con: npm run build:slim (backend)`,
    );
  }
  const rows = [];
  for (const line of readFileSync(SLIM, 'utf8').split('\n')) {
    if (!line) continue;
    try {
      const r = JSON.parse(line);
      r._t = (r.title || '').toLowerCase(); // índice para búsqueda rápida
      rows.push(r);
    } catch { /* ignora líneas corruptas */ }
  }

  // Agregados para las tarjetas resumen.
  const counts = new Map();
  let totalChars = 0;
  let lastModified = null;
  for (const r of rows) {
    counts.set(r.ns, (counts.get(r.ns) ?? 0) + 1);
    totalChars += r.chars || 0;
    if (r.lastModified && (!lastModified || r.lastModified > lastModified)) {
      lastModified = r.lastModified;
    }
  }
  const namespaces = [...counts.entries()]
    .map(([ns, count]) => ({ ns, name: nsName(ns), count }))
    .sort((a, b) => b.count - a.count);

  cache = { rows, stats: { total: rows.length, namespaces, totalChars, lastModified } };
  return cache;
}

export const centrosService = {
  stats() {
    return load().stats;
  },

  query({ ns, q, sort = 'lastModified', order = 'desc', limit = 25, offset = 0 } = {}) {
    const { rows } = load();
    const needle = (q ?? '').trim().toLowerCase();
    const byNs = ns !== undefined && ns !== '' && ns !== null;
    const nsNum = Number(ns);

    let items = rows;
    if (byNs || needle) {
      items = rows.filter((r) => {
        if (byNs && r.ns !== nsNum) return false;
        if (needle && !r._t.includes(needle) && String(r.pageid) !== needle) return false;
        return true;
      });
    }

    const total = items.length;
    const field = SORTABLE.has(sort) ? sort : 'lastModified';
    const dir = order === 'asc' ? 1 : -1;
    // Copia para no mutar el orden del cache.
    items = items.slice().sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    const page = items.slice(offset, offset + limit).map(toDTO);
    return { items: page, total };
  },
};

function toDTO(r) {
  return {
    pageid: r.pageid,
    ns: r.ns,
    nsName: nsName(r.ns),
    title: r.title,
    url: r.url,
    lastModified: r.lastModified,
    lastEditor: r.lastEditor || '—',
    chars: r.chars,
  };
}
