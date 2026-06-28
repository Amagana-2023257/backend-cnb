import { slugify } from './slugify.js';

/**
 * Conversor pragmático wikitext → HTML. Cubre lo común del CNB:
 * redirects, encabezados, negrita/cursiva, listas, enlaces internos/externos,
 * categorías y anotaciones SMW. NO busca fidelidad 100% con MediaWiki:
 * lo no soportado (plantillas {{...}}, módulos) se degrada con elegancia.
 *
 * Devuelve { html, categories, redirectTo, plain }.
 */
export function wikitextToHtml(wikitext = '') {
  const categories = [];
  let redirectTo = null;

  // 1) Redirección.
  const redirect = wikitext.match(/^#\s*(?:REDIREC[CT]I[ÓO]N|REDIRECT)\s*\[\[([^\]]+)\]\]/i);
  if (redirect) redirectTo = slugify(redirect[1].split('|')[0].trim());

  let s = wikitext;

  // 2) Extraer categorías [[Categoría:X]] (no se renderizan inline).
  s = s.replace(/\[\[\s*Categor[ií]a\s*:\s*([^\]|]+)(?:\|[^\]]*)?\]\]/gi, (_m, c) => {
    categories.push(c.trim());
    return '';
  });

  // 3) Anotaciones SMW [[Prop::valor|etiqueta]] → texto visible.
  s = s.replace(/\[\[[^\]:|]+::([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, val, label) => label || val);

  // 4) Enlaces internos [[Página|texto]] / [[Página]].
  s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target, label) => {
    const slug = slugify(target.trim());
    const text = (label || target).trim();
    return `<a href="/wiki/${slug}" data-internal="1">${escapeHtml(text)}</a>`;
  });

  // 5) Enlaces externos [http://url etiqueta].
  s = s.replace(/\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/g, (_m, url, label) =>
    `<a href="${url}">${escapeHtml(label || url)}</a>`);

  // 6) Encabezados ====, ===, == .
  s = s.replace(/^======\s*(.+?)\s*======$/gm, '<h6>$1</h6>');
  s = s.replace(/^=====\s*(.+?)\s*=====$/gm, '<h5>$1</h5>');
  s = s.replace(/^====\s*(.+?)\s*====$/gm, '<h4>$1</h4>');
  s = s.replace(/^===\s*(.+?)\s*===$/gm, '<h3>$1</h3>');
  s = s.replace(/^==\s*(.+?)\s*==$/gm, '<h2>$1</h2>');

  // 7) Negrita / cursiva.
  s = s.replace(/'''(.+?)'''/g, '<strong>$1</strong>');
  s = s.replace(/''(.+?)''/g, '<em>$1</em>');

  // 8) Listas (líneas que empiezan por * o #).
  s = wrapLists(s);

  // 9) Plantillas {{...}} no soportadas → se eliminan (degradado limpio).
  s = s.replace(/\{\{[^{}]*\}\}/g, '');

  // 10) Párrafos a partir de líneas en blanco.
  const html = s
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => (/^<(h\d|ul|ol|table|blockquote)/.test(block) ? block : `<p>${block.replace(/\n/g, '<br>')}</p>`))
    .join('\n');

  const plain = stripTags(html).replace(/\s+/g, ' ').trim();
  return { html, categories, redirectTo, plain };
}

function wrapLists(text) {
  const lines = text.split('\n');
  const out = [];
  let inList = null; // 'ul' | 'ol'
  for (const line of lines) {
    const m = line.match(/^([*#])\s+(.*)$/);
    if (m) {
      const tag = m[1] === '*' ? 'ul' : 'ol';
      if (inList !== tag) {
        if (inList) out.push(`</${inList}>`);
        out.push(`<${tag}>`);
        inList = tag;
      }
      out.push(`<li>${m[2]}</li>`);
    } else {
      if (inList) { out.push(`</${inList}>`); inList = null; }
      out.push(line);
    }
  }
  if (inList) out.push(`</${inList}>`);
  return out.join('\n');
}

function escapeHtml(str) {
  return str.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function stripTags(str) {
  return str.replace(/<[^>]+>/g, ' ');
}
