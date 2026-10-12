import { el } from '../utils/dom.js';

/**
 * Projet en cours (sans photo), à côté du projet vedette.
 * Si une période en années est publiée, une frise montre l'année en cours :
 * calculée uniquement à partir des années de début et de fin.
 */
export function ongoingCard(projet) {
  const year = new Date().getFullYear();
  const years = projet.startYear && projet.endYear
    ? Array.from({ length: projet.endYear - projet.startYear + 1 }, (_, i) => projet.startYear + i)
    : [];
  const rank = years.indexOf(year) + 1;

  return el('article', { class: 'ongoing-card' },
    el('p', { class: 'ongoing-card__status' }, years.length ? `En cours, période ${years[0]}–${years[years.length - 1]}` : 'En cours'),
    el('h3', { class: 'ongoing-card__title' }, projet.title),
    el('p', { class: 'ongoing-card__summary' }, projet.summary),
    years.length
      ? el('div', { class: 'yearline' },
          el('ol', { class: 'yearline__years', role: 'list' },
            years.map((y) => el('li', {
              class: `yearline__year${y < year ? ' is-done' : ''}${y === year ? ' is-now' : ''}`,
              'aria-current': y === year ? 'date' : null,
            }, el('span', { class: 'yearline__dot', 'aria-hidden': 'true' }), String(y)))),
          el('p', { class: 'yearline__label' },
            rank ? `Année ${rank} sur ${years.length}` : `${years[0]} – ${years[years.length - 1]}`,
            projet.programme ? ` du ${projet.programme}` : ''),
        )
      : null,
    el('a', { class: 'link-strong ongoing-card__more', href: `#${projet.slug}` },
      'Voir le projet', el('span', { class: 'visually-hidden' }, ` : ${projet.title}`)),
  );
}
