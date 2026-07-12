// /app/lib/slugify.js
// Small pure-JS slugify used by the admin form to derive slugs from titles.
// Lowercase, hyphens only, ASCII fallback for common accented chars.

const DIACRITICS_RE = /[\u0300-\u036f]/g

export function slugify(input) {
  if (!input) return ''
  return String(input)
    .normalize('NFKD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

/** Return true if `s` is a valid slug: lowercase alnum + hyphens, 1-160 chars. */
export function isValidSlug(s) {
  return typeof s === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 160
}
