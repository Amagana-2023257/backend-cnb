import { readFileSync, existsSync } from 'node:fs';

/**
 * Carga hallazgos.json (si existe) y devuelve una función que indica si un
 * pageid/título está marcado como spam, junto a su categoría. Si no hay
 * archivo, todo entra como no-marcado (flagged=false).
 */
export function buildClassifier(hallazgosPath) {
  const byId = new Map();

  if (hallazgosPath && existsSync(hallazgosPath)) {
    try {
      const raw = JSON.parse(readFileSync(hallazgosPath, 'utf8'));
      // hallazgos.json: estructura por categoría → lista de {pageid|title,...}.
      for (const [categoria, items] of Object.entries(raw)) {
        if (!Array.isArray(items)) continue;
        for (const it of items) {
          const key = it.pageid ?? it.title;
          if (key != null) byId.set(String(key), categoria);
        }
      }
    } catch {
      /* archivo malformado → sin clasificación */
    }
  }

  return function classify({ pageid, title, ns }) {
    const cat = byId.get(String(pageid)) ?? byId.get(title);
    // Heurística de respaldo: páginas de Usuario (ns2) con enlaces = spam.
    const flagged = Boolean(cat) || ns === 2;
    return { flagged, spamCategory: cat ?? (ns === 2 ? 'USUARIO' : null) };
  };
}
