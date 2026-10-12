import { el } from '../utils/dom.js';
import { picture } from './picture.js';

const STATUS_LABELS = { 'en-cours': 'En cours', termine: 'Terminé' };

/**
 * Carte projet. Les fiches détaillées n'existent pas encore :
 * le lien mène à l'ancre du projet sur la page Nos projets.
 */
export function projectCard(projet, domainesById, { feature = false } = {}) {
  const tags = projet.domains
    .map((id) => domainesById.get(id))
    .filter(Boolean)
    .map((d) => el('li', { class: 'tag' }, d.shortTitle ?? d.title));

  const meta = [
    projet.projectStatus && el('span', { class: 'tag tag--status' }, STATUS_LABELS[projet.projectStatus]),
    projet.period && el('span', {}, `Période : ${projet.period}`),
    projet.zone && el('span', {}, projet.zone),
  ].filter(Boolean);

  return el('article', { class: `project-card${feature ? ' project-card--feature' : ''}${projet.coverImage ? ' project-card--media' : ''}` },
    projet.coverImage
      ? picture(projet.coverImage, { className: 'project-card__media', sizes: '(min-width: 64rem) 36rem, 86vw' })
      : null,
    tags.length ? el('ul', { class: 'tag-list', role: 'list', 'aria-label': 'Domaines' }, tags) : null,
    el('h3', { class: 'project-card__title' },
      el('a', { href: `/projets/#${projet.slug}` }, projet.title),
    ),
    el('p', { class: 'project-card__summary' }, projet.summary),
    meta.length ? el('div', { class: 'project-card__meta' }, meta) : null,
  );
}
