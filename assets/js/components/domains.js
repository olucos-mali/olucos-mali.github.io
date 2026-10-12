import { el, icon } from '../utils/dom.js';

/**
 * Domaines d'intervention.
 * Mobile : liste compacte, le texte se déplie au toucher (<details>).
 * Bureau : tout est déplié (initDomainsDisclosure).
 */
export function renderDomaines(domaines) {
  return domaines.map((d) =>
    el('li', { id: `domaine-${d.slug}` },
      el('details', { class: 'domain-item' },
        el('summary', { class: 'domain-item__summary' },
          el('span', { class: 'domain-item__icon' }, icon(d.icon)),
          el('h3', { class: 'domain-item__title' }, d.title),
          icon('chevron-down', 'icon domain-item__chevron'),
        ),
        el('p', { class: 'domain-item__text' }, d.summary),
      ),
    ),
  );
}

const DESKTOP = window.matchMedia('(min-width: 48rem)');

export function initDomainsDisclosure(list) {
  if (!list) return;
  const sync = () => list.querySelectorAll('details').forEach((d) => { d.open = DESKTOP.matches; });
  sync();
  DESKTOP.addEventListener('change', sync);
  // Sur bureau, le texte reste toujours visible
  list.addEventListener('click', (e) => {
    if (DESKTOP.matches && e.target.closest('summary')) e.preventDefault();
  });
}
