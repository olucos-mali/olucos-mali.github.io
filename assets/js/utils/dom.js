import { frenchTypo } from './typo.js';

/**
 * Crée un élément sans jamais passer par innerHTML :
 * les textes venant des données sont toujours insérés avec textContent.
 *
 *   el('p', { class: 'note' }, 'Texte', el('a', { href: '/' }, 'lien'))
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    // Tout texte inséré passe par la typographie française
    node.append(child instanceof Node ? child : document.createTextNode(frenchTypo(String(child))));
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Icône décorative tirée du sprite /assets/images/icons.svg */
export function icon(name, className = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `/assets/images/icons.svg#i-${name}`);
  svg.append(use);
  return svg;
}

export function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
