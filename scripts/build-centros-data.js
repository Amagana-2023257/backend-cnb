import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { nsName } from '../src/modules/centros/centros.service.js';

/**
 * Genera el dataset estático que consume la vista /centros en PRODUCCIÓN
 * (Firebase Hosting), sin backend. Lee el slim NDJSON y emite un JSON compacto:
 *   - filas como arrays (no objetos) → menos bytes,
 *   - editores en un diccionario (se repiten mucho),
 *   - fecha como epoch en segundos,
 *   - sin `url` (se reconstruye en el cliente desde el título).
 *
 *   node scripts/build-centros-data.js   (requiere correr antes build:slim)
 */
const SLIM = resolve('data/paginas.slim.ndjson');
const OUT = resolve('../frontend/public/data/centros.min.json');

if (!existsSync(SLIM)) {
  console.error(`✖ No existe ${SLIM}. Corre antes: npm run build:slim`);
  process.exit(1);
}
mkdirSync(dirname(OUT), { recursive: true });

const editors = [];
const editorIdx = new Map();
const nsSet = new Set();
const rows = [];

for (const line of readFileSync(SLIM, 'utf8').split('\n')) {
  if (!line) continue;
  let r;
  try { r = JSON.parse(line); } catch { continue; }

  const ed = r.lastEditor || '—';
  let ei = editorIdx.get(ed);
  if (ei === undefined) { ei = editors.length; editors.push(ed); editorIdx.set(ed, ei); }

  const t = r.lastModified ? Math.floor(new Date(r.lastModified).getTime() / 1000) : 0;
  nsSet.add(r.ns);
  // [pageid, ns, title, epochSec, editorIdx, chars]
  rows.push([r.pageid, r.ns, r.title, t, ei, r.chars]);
}

const nsNames = {};
for (const ns of nsSet) nsNames[ns] = nsName(ns);

const payload = { generatedAt: Date.now(), nsNames, editors, rows };
writeFileSync(OUT, JSON.stringify(payload));

const mb = (Buffer.byteLength(JSON.stringify(payload)) / 1e6).toFixed(1);
console.log(`✔ Dataset estático: ${rows.length} filas, ${editors.length} editores → ${OUT} (${mb} MB)`);
