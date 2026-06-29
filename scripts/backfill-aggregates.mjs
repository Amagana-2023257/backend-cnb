// Backfill local (sin Firestore): rellena cp.ns / cp.cat en el checkpoint para
// las líneas YA procesadas, re-parseando el JSONL con la misma lógica que la
// ingesta. Necesario tras un resume desde un checkpoint viejo que no guardaba
// los acumuladores. Cero escrituras a Firestore → seguro aunque la cuota esté
// agotada.
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { config } from '../src/config/env.js';
import { wikitextToHtml } from '../ingest/wikitextToHtml.js';

const CHECKPOINT = resolve('ingest-checkpoint.json');
const cp = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
cp.ns ??= {};
cp.cat ??= {};

const jsonlPath = resolve(config.ingest.jsonlPath);
if (!existsSync(jsonlPath)) { console.error('No existe el JSONL:', jsonlPath); process.exit(1); }

const upTo = cp.lastLine ?? 0;
console.log(`Reconstruyendo acumuladores para las primeras ${upTo} líneas…`);

const rl = createInterface({ input: createReadStream(jsonlPath, 'utf8'), crlfDelay: Infinity });
let lineNo = 0;
let counted = 0;
for await (const line of rl) {
  lineNo += 1;
  if (lineNo > upTo) break;
  const t = line.trim();
  if (!t) continue;
  let rec;
  try { rec = JSON.parse(t); } catch { continue; }
  if (rec.pageid == null) continue;

  const { categories } = wikitextToHtml(rec.content_wikitext ?? '');
  const cats = [...new Set(categories.concat(rec.categories ?? []))];
  cp.ns[rec.ns] = (cp.ns[rec.ns] ?? 0) + 1;
  for (const c of cats) cp.cat[c] = (cp.cat[c] ?? 0) + 1;
  counted += 1;
}

writeFileSync(CHECKPOINT, JSON.stringify(cp));
console.log(`✔ Acumuladores reconstruidos: ${counted} páginas, ` +
  `${Object.keys(cp.ns).length} namespaces, ${Object.keys(cp.cat).length} categorías.`);
process.exit(0);
