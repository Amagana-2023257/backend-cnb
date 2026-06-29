import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { config } from '../src/config/env.js';
import { db, collections } from '../src/config/firebaseAdmin.js';
import { wikitextToHtml } from './wikitextToHtml.js';
import { sanitize } from './sanitize.js';
import { slugify } from './slugify.js';
import { buildClassifier } from './classify.js';
import { tokenize } from '../src/modules/search/search.service.js';

/**
 * Ingesta JSONL → Firestore. Idempotente (pageid como ID de doc) y reanudable
 * (checkpoint en ingest-checkpoint.json: si se corta, vuelve a correr y sigue).
 *
 *   npm run ingest
 */
const CHECKPOINT = resolve('ingest-checkpoint.json');

// Nombres legibles de los namespaces de MediaWiki (los del CNB).
const NS_NAMES = {
  0: '(Principal)', 1: 'Discusión', 2: 'Usuario', 3: 'Usuario discusión',
  4: 'CNB', 5: 'CNB discusión', 6: 'Archivo', 7: 'Archivo discusión',
  8: 'MediaWiki', 9: 'MediaWiki discusión', 10: 'Plantilla', 11: 'Plantilla discusión',
  12: 'Ayuda', 13: 'Ayuda discusión', 14: 'Categoría', 15: 'Categoría discusión',
  274: 'Widget', 828: 'Módulo',
};

function loadCheckpoint() {
  if (existsSync(CHECKPOINT)) {
    try {
      const cp = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
      // Compatibilidad con checkpoints viejos (sin acumuladores).
      cp.processed ??= 0;
      cp.lastLine ??= 0;
      cp.ns ??= {};
      cp.cat ??= {};
      cp.done ??= false;
      return cp;
    } catch { /* */ }
  }
  return { processed: 0, lastLine: 0, ns: {}, cat: {}, done: false };
}
function saveCheckpoint(cp) {
  writeFileSync(CHECKPOINT, JSON.stringify(cp));
}

function buildDoc(rec, classify) {
  const { html, categories, redirectTo, plain } = wikitextToHtml(rec.content_wikitext ?? '');
  const safeHtml = sanitize(html);
  const { flagged, spamCategory } = classify(rec);
  const summary = plain.slice(0, 280);
  return {
    pageid: rec.pageid,
    ns: rec.ns,
    title: rec.title,
    slug: slugify(rec.title),
    html: safeHtml,
    summary,
    plain,
    categories: [...new Set(categories.concat(rec.categories ?? []))],
    redirectTo,
    tokens: tokenize(`${rec.title} ${summary}`),
    lastModified: rec.last_modified ?? null,
    lastEditor: rec.last_editor ?? null,
    flagged,
    spamCategory,
  };
}

/**
 * Escribe las colecciones de navegación a partir de los acumuladores.
 * - namespaces: doc id = número de ns, con nombre legible y conteo.
 * - categories: doc id = nombre codificado (evita '/' inválido en Firestore).
 */
async function writeAggregates(nsCounts, catCounts) {
  // nsCounts/catCounts son objetos planos (persistidos en el checkpoint),
  // acumulados a lo largo de TODAS las corridas → conteos totales correctos.
  const nsEntries = Object.entries(nsCounts);
  const catEntries = Object.entries(catCounts);

  // Namespaces.
  let batch = db.batch();
  let n = 0;
  for (const [ns, count] of nsEntries) {
    const nsNum = Number(ns);
    batch.set(collections.namespaces.doc(String(nsNum)), {
      id: nsNum,
      name: NS_NAMES[nsNum] ?? `ns${nsNum}`,
      count,
    });
    if (++n >= config.ingest.batchSize) { await batch.commit(); batch = db.batch(); n = 0; }
  }
  if (n > 0) await batch.commit();

  // Categorías.
  batch = db.batch();
  n = 0;
  for (const [name, count] of catEntries) {
    const id = encodeURIComponent(name).slice(0, 1500); // doc id seguro
    batch.set(collections.categories.doc(id), { name, count });
    if (++n >= config.ingest.batchSize) { await batch.commit(); batch = db.batch(); n = 0; }
  }
  if (n > 0) await batch.commit();

  console.log(`  Navegación: ${nsEntries.length} namespaces, ${catEntries.length} categorías`);
}

async function run() {
  const jsonlPath = resolve(config.ingest.jsonlPath);
  if (!existsSync(jsonlPath)) {
    console.error(`✖ No existe el JSONL: ${jsonlPath} (revisa JSONL_PATH en .env)`);
    process.exit(1);
  }
  console.log(`▶ Ingesta desde: ${jsonlPath}`);
  const classify = buildClassifier(config.ingest.hallazgosPath && resolve(config.ingest.hallazgosPath));

  const cp = loadCheckpoint();
  console.log(`  Reanudando desde la línea ${cp.lastLine} (${cp.processed} ya procesadas)`);

  const rl = createInterface({ input: createReadStream(jsonlPath, 'utf8'), crlfDelay: Infinity });

  // Acumuladores PERSISTIDOS en el checkpoint (cp.ns / cp.cat). Se suman a lo
  // largo de TODAS las corridas, así una ingesta partida en chunks diarios
  // (p. ej. por la cuota gratuita de Firestore) termina con conteos correctos.
  const nsCounts = cp.ns;
  const catCounts = cp.cat;

  // Límite opcional de páginas a procesar en esta corrida (INGEST_LIMIT).
  // 0 = sin límite. Útil para cortar bajo la cuota diaria (p. ej. 19000) o
  // para una prueba pequeña.
  const limit = Number(process.env.INGEST_LIMIT ?? 0);
  let processedThisRun = 0;
  let stoppedByLimit = false;

  let lineNo = 0;
  let batch = db.batch();
  let inBatch = 0;
  const flush = async () => {
    if (inBatch > 0) { await batch.commit(); batch = db.batch(); inBatch = 0; }
  };

  for await (const line of rl) {
    lineNo += 1;
    if (lineNo <= cp.lastLine) continue;          // saltar lo ya hecho
    const trimmed = line.trim();
    if (!trimmed) continue;

    let rec;
    try { rec = JSON.parse(trimmed); } catch { continue; }
    if (rec.pageid == null) continue;

    const doc = buildDoc(rec, classify);
    batch.set(collections.pages.doc(String(rec.pageid)), doc, { merge: true });
    inBatch += 1;
    cp.processed += 1;
    processedThisRun += 1;

    nsCounts[rec.ns] = (nsCounts[rec.ns] ?? 0) + 1;
    for (const c of doc.categories) catCounts[c] = (catCounts[c] ?? 0) + 1;

    if (inBatch >= config.ingest.batchSize) {
      await flush();
      cp.lastLine = lineNo;
      saveCheckpoint(cp);                 // persiste páginas + acumuladores
      if (cp.processed % 5000 === 0) console.log(`  … ${cp.processed} páginas`);
    }

    if (limit && processedThisRun >= limit) { stoppedByLimit = true; break; }
  }
  await flush();
  cp.lastLine = lineNo;

  // Solo cuando se consumió TODO el archivo (no por INGEST_LIMIT) poblamos la
  // navegación y los metadatos, con los acumuladores totales del checkpoint.
  if (!stoppedByLimit) {
    cp.done = true;
    saveCheckpoint(cp);
    await writeAggregates(nsCounts, catCounts);
    await collections.meta.doc('content').set({
      version: Date.now(),
      pages: cp.processed,
      ingestedAt: new Date().toISOString(),
    });
    console.log(`✔ Ingesta completa: ${cp.processed} páginas en Firestore.`);
  } else {
    saveCheckpoint(cp);
    console.log(`⏸ Corte por INGEST_LIMIT: ${cp.processed} páginas acumuladas. ` +
      `Vuelve a correr para continuar (la navegación se escribe al terminar el archivo).`);
  }
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
