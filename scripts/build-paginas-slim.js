import { createReadStream, existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve, dirname } from 'node:path';

/**
 * Convierte el dump pesado `contenido_paginas.jsonl` (~148 MB, con el wikitext
 * completo) en un NDJSON "slim" de solo metadatos, apto para cargarse en memoria
 * y servirse paginado desde /api/centros sin tocar Firestore.
 *
 * Cada línea de salida: { pageid, ns, title, url, lastModified, lastEditor, chars }
 *   - `chars` es el tamaño del wikitext → lo usamos como "volumen de material".
 *
 *   node scripts/build-paginas-slim.js
 */
const SRC = resolve(process.env.JSONL_PATH ?? '../contenido_paginas.jsonl');
const OUT = resolve('data/paginas.slim.ndjson');

if (!existsSync(SRC)) {
  console.error(`✖ No existe el JSONL: ${SRC} (ajusta JSONL_PATH)`);
  process.exit(1);
}
mkdirSync(dirname(OUT), { recursive: true });

const rl = createInterface({ input: createReadStream(SRC, 'utf8'), crlfDelay: Infinity });
const out = createWriteStream(OUT, 'utf8');

let read = 0;
let written = 0;

console.log(`▶ Origen: ${SRC}`);
for await (const line of rl) {
  read += 1;
  const trimmed = line.trim();
  if (!trimmed) continue;
  let rec;
  try { rec = JSON.parse(trimmed); } catch { continue; }
  if (rec.pageid == null) continue;

  const slim = {
    pageid: Number(rec.pageid),
    ns: Number(rec.ns ?? 0),
    title: rec.title ?? '',
    url: rec.url ?? '',
    lastModified: rec.last_modified ?? null,
    lastEditor: (rec.last_editor ?? '').replace(/^imported>/, ''),
    chars: (rec.content_wikitext ?? '').length,
  };
  out.write(`${JSON.stringify(slim)}\n`);
  written += 1;
  if (written % 25000 === 0) console.log(`  … ${written} registros`);
}

out.end();
await new Promise((res) => out.on('finish', res));
console.log(`✔ Slim listo: ${written}/${read} registros → ${OUT}`);
