/** Convierte un título de MediaWiki en un slug de URL estable. */
export function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_()\-./]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}
