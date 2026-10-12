import { el, icon } from '../utils/dom.js';

/** Index des projets (accueil) : une ligne par projet, toute la ligne est un lien. */
export function projectIndex(projets, domainesById) {
  return projets.map((p) => {
    const first = domainesById.get(p.domains[0]);
    const domain = first?.shortTitle;
    let meta = domain ?? '';
    if (p.zone) meta += meta ? ` à ${p.zone}` : p.zone;
    if (p.projectStatus === 'en-cours') meta += meta ? ', en cours' : 'En cours';
    return el('li', { class: 'pindex__item' },
      el('a', { class: 'pindex__link', href: `/projets/#${p.slug}` },
        el('span', { class: 'pindex__icon' }, icon(first?.icon ?? 'sprout')),
        el('span', { class: 'pindex__text' },
          el('span', { class: 'pindex__title' }, p.title),
          meta ? el('span', { class: 'pindex__meta' }, meta) : null,
        ),
        icon('arrow-right', 'icon pindex__arrow'),
      ),
    );
  });
}
