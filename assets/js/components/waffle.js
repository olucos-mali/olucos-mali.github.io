import { svgEl } from '../utils/dom.js';

/**
 * Grille de points 10 × 10 : un point = une personne.
 *
 * Métamorphose (une seule fois, quand la grille entre à l'écran) :
 *   1. les 22 points de la flèche du logo sont là, à leur place dans la flèche ;
 *   2. ils glissent chacun vers une case de la grille ;
 *   3. les 78 autres points apparaissent en partant du groupe ;
 *   4. les points mis en avant se remplissent, en vague, ligne par ligne.
 *
 * La forme porte le sens (plein / anneau), pas seulement la couleur.
 * Les chiffres restent écrits dans le HTML : la grille est décorative (aria-hidden).
 * Mouvement réduit : l'état final est affiché directement.
 */

// Points de la flèche du logo (repère du symbole : x 388 → 520, y 14 → 146)
const ARROW = [
  [399.5, 137, 'o', 1], [400.5, 28, 'o', 1], [427, 26, 't', 1], [428.5, 137.5, 't', 1],
  [448.5, 43.5, 't', 1], [456, 29, 'o', 1], [457, 137, 'o', 1], [460.5, 67.5, 'o', 0.6],
  [462, 88.5, 'o', 0.6], [466, 105.5, 't', 1], [466.5, 54, 't', 1], [470.5, 76.5, 'o', 0.6],
  [472.5, 39, 't', 1], [473.5, 124, 't', 1], [478, 64.5, 't', 1], [479.5, 92.5, 't', 1],
  [484.5, 109.5, 'o', 1], [485, 52, 'o', 1], [491, 77, 't', 1], [499, 66.5, 't', 1],
  [499.5, 94, 't', 1], [508.5, 79, 'o', 1],
];

const COLS = 10;
const STEP = 10;

export function renderWaffle(figure) {
  const grid = figure?.querySelector('[data-waffle-grid]');
  if (!grid) return;
  const total = Number(figure.dataset.total);
  const highlight = Number(figure.dataset.highlight);
  const rows = Math.ceil(total / COLS);

  const cells = Array.from({ length: total }, (_, i) => ({
    i,
    x: (i % COLS) * STEP + STEP / 2,
    y: Math.floor(i / COLS) * STEP + STEP / 2,
  }));

  // Chaque point de la flèche prend la case libre la plus proche
  const scale = (COLS * STEP * 0.86) / 132;
  const arrow = ARROW.map(([x, y, color, size]) => ({ x: (x - 388) * scale + 7, y: (y - 14) * scale + 7, color, size }));
  const taken = new Map();
  for (const dot of [...arrow].sort((a, b) => a.x - b.x)) {
    let best = null;
    for (const cell of cells) {
      if (taken.has(cell.i)) continue;
      const d = (cell.x - dot.x) ** 2 + (cell.y - dot.y) ** 2;
      if (!best || d < best.d) best = { cell, d };
    }
    taken.set(best.cell.i, dot);
  }
  const cx = arrow.reduce((s, d) => s + d.x, 0) / arrow.length;
  const cy = arrow.reduce((s, d) => s + d.y, 0) / arrow.length;

  const svg = svgEl('svg', { viewBox: `0 0 ${COLS * STEP} ${rows * STEP}`, focusable: 'false' });
  let k = 0;
  for (const cell of cells) {
    const from = taken.get(cell.i);
    const row = Math.floor(cell.i / COLS);
    const col = cell.i % COLS;
    const classes = ['waffle__dot'];
    if (cell.i < highlight) classes.push('is-target-filled');
    let style;
    if (from) {
      classes.push('is-arrow', from.color === 'o' ? 'is-olive' : 'is-teal');
      style = `--from: translate(${(from.x - cell.x).toFixed(2)}px, ${(from.y - cell.y).toFixed(2)}px) scale(${from.size});` +
              `--d: ${k++ * 18}ms;`;
    } else {
      const dist = Math.hypot(cell.x - cx, cell.y - cy);
      style = `--from: translate(${((cx - cell.x) * 0.35).toFixed(2)}px, ${((cy - cell.y) * 0.35).toFixed(2)}px) scale(0);` +
              `--d: ${Math.round(650 + dist * 7)}ms;`;
      classes.push('is-new');
    }
    style += `--fd: ${1500 + row * 70 + col * 14}ms;`;
    svg.append(svgEl('circle', { cx: cell.x, cy: cell.y, r: 2.6, class: classes.join(' '), style }));
  }
  grid.replaceChildren(svg);

  const play = () => svg.classList.add('is-grid');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    play();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      // Laisser un temps pour voir la flèche avant qu'elle ne se transforme
      setTimeout(play, 350);
      observer.disconnect();
    }
  }, { threshold: 0.45 });
  observer.observe(svg);
}
