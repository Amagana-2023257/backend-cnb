import sanitizeHtml from 'sanitize-html';

/**
 * Sanea el HTML producido por el parser de wikitext (allowlist anti-XSS).
 * Se ejecuta UNA vez en la ingesta, así el cliente renderiza HTML ya seguro.
 */
export function sanitize(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
      'b', 'i', 'strong', 'em', 'blockquote', 'code', 'pre', 'hr', 'br',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'data-internal'],
      span: ['class'],
      div: ['class'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => {
        const out = { tagName, attribs: { ...attribs } };
        if (out.attribs.href && /^https?:\/\//.test(out.attribs.href)) {
          out.attribs.rel = 'noopener noreferrer nofollow';
          out.attribs.target = '_blank';
        }
        return out;
      },
    },
  });
}
