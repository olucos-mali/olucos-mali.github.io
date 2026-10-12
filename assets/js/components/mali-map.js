import { el } from '../utils/dom.js';

/**
 * Carte du Mali en points (assets/images/carte-mali-points.svg)
 * et liste des lieux d'intervention documentés (data/lieux.json).
 *
 * La projection reprend exactement celle qui a servi à générer la carte :
 * équirectangulaire, corrigée par cos(latitude moyenne).
 */
const MAP = { lon0: -12.25, lat1: 25.05, k: 0.953585652308238, width: 1582.952, height: 1505 };

function position(lat, lon) {
  return {
    left: `${(((lon - MAP.lon0) * MAP.k * 100) / MAP.width) * 100}%`,
    top: `${(((MAP.lat1 - lat) * 100) / MAP.height) * 100}%`,
  };
}

export function renderMap(canvas, lieux) {
  if (!canvas) return;
  canvas.querySelectorAll('.map-marker').forEach((n) => n.remove());
  lieux.forEach((lieu, index) => {
    const marker = el('span', {
      class: `map-marker map-marker--${lieu.kind} map-marker--label-${lieu.label}`,
      'aria-hidden': 'true',
      dataset: { place: lieu.id },
    },
      el('span', { class: 'map-marker__dot' }),
      el('span', { class: 'map-marker__label' }, lieu.name),
    );
    Object.assign(marker.style, position(lieu.lat, lieu.lon));
    // Les lieux s'allument un à un, dans l'ordre des données (le siège d'abord)
    marker.style.setProperty('--mdelay', `${200 + index * 380}ms`);
    canvas.append(marker);
  });
}

export function renderPlaces(lieux, projetsBySlug) {
  return lieux.map((lieu) =>
    el('li', { class: `place place--${lieu.kind}`, dataset: { place: lieu.id } },
      el('h3', { class: 'place__name' },
        el('span', { class: 'place__dot', 'aria-hidden': 'true' }),
        lieu.name,
      ),
      el('ul', { class: 'place__items', role: 'list' },
        lieu.items.map((item) => {
          const projet = item.project && projetsBySlug.get(item.project);
          return el('li', {},
            item.text,
            projet ? [' ', el('a', { class: 'place__link', href: `/projets/#${projet.slug}` },
              'Voir le projet', el('span', { class: 'visually-hidden' }, ` ${projet.title}`))] : null,
          );
        }),
      ),
    ),
  );
}

/** Survol ou focus d'un lieu dans la liste → son point s'allume sur la carte. */
export function linkPlacesToMap(list, canvas) {
  if (!list || !canvas) return;
  const highlight = (id) => canvas.querySelectorAll('.map-marker').forEach((m) => m.toggleAttribute('data-active', m.dataset.place === id));
  list.addEventListener('pointerover', (e) => highlight(e.target.closest('[data-place]')?.dataset.place));
  list.addEventListener('pointerleave', () => highlight(null));
  list.addEventListener('focusin', (e) => highlight(e.target.closest('[data-place]')?.dataset.place));
  list.addEventListener('focusout', () => highlight(null));
}

/** Met en pause la pulsation des lieux quand la carte n'est pas à l'écran. */
export function pauseMapWhenHidden(canvas) {
  if (!canvas || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    canvas.toggleAttribute('data-offscreen', !entry.isIntersecting);
  }).observe(canvas);
}
