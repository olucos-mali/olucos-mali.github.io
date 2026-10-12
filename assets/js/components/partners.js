import { el } from '../utils/dom.js';

/**
 * Un partenaire : son logo (si le fichier a été trouvé) ou un point de la marque, puis son nom en texte.
 * Le nom reste toujours affiché : le logo est décoratif (alt vide).
 */
export function renderPartenaires(partenaires) {
  return partenaires.map((p) =>
    el('li', { class: `partner-item${p.logo ? ' partner-item--logo' : ''}` },
      el('span', { class: 'partner-item__logo', 'aria-hidden': 'true' },
        p.logo
          ? el('img', { src: p.logo.src, width: p.logo.width, height: p.logo.height, alt: '', loading: 'lazy', decoding: 'async' })
          : el('i', { class: 'partner-item__dot' })),
      el('span', { class: 'partner-item__name' }, p.name),
      p.detail ? el('span', { class: 'partner-item__detail' }, p.detail) : null,
    ),
  );
}
