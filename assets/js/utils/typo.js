/**
 * Typographie française : les signes doubles et les nombres ne se séparent
 * jamais de ce qui les précède en fin de ligne.
 *   « : » et guillemets → espace insécable (U+00A0)
 *   « ; ! ? » et milliers (1 500) → espace fine insécable (U+202F)
 */
export function frenchTypo(text) {
  return text
    .replace(/ ([:])/g, ' $1')
    .replace(/ ([;!?])/g, ' $1')
    .replace(/« /g, '« ')
    .replace(/ »/g, ' »')
    .replace(/(\d) (?=\d{3}\b)/g, '$1 ');
}
