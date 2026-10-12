import { el } from '../utils/dom.js';
import { picture } from './picture.js';

const NUMBER = new Intl.NumberFormat('fr-FR');
const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/** Lien vers le contact, avec le sujet déjà rempli (lu par la page Contact). */
export function supportHref(projet) {
  return `/contact/?sujet=${encodeURIComponent(`Soutenir le projet « ${projet.title} »`)}`;
}

/** « a », « a et b », « a, b et c » */
export function frenchList(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

/** Ligne de reportage : lieu et période, en phrase (jamais de « · »). */
function dateline(projet) {
  const ongoing = projet.projectStatus === 'en-cours';
  const since = projet.startDate ? MONTH.format(new Date(`${projet.startDate}T12:00:00`)) : null;
  const range = projet.period && /^\d{4}-\d{4}$/.test(projet.period) ? projet.period.replace('-', '–') : null;
  const status = ongoing && since ? `en cours depuis ${since}` : ongoing ? 'en cours' : null;
  const parts = [projet.zone, status, range ? `période ${range}` : null].filter(Boolean);
  if (!parts.length) return null;
  const text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Chiffre clé en points : un point = `perDot` personnes.
 * Les personnes mises en avant (ex. les filles) sont des points pleins, les autres des anneaux :
 * la forme porte le sens, pas seulement la couleur. Le chiffre exact reste écrit en texte.
 */
function impact(figure) {
  const total = Math.round(figure.count / figure.perDot);
  const filled = figure.highlight ? Math.round(figure.highlight / figure.perDot) : total;
  const each = figure.perDot === 1 ? 'une personne' : `${NUMBER.format(figure.perDot)} ${figure.unit}`;
  const legend = [`Chaque point représente ${each}`];
  if (figure.highlight) legend.push(`les points pleins, les ${figure.highlightLabel}`);

  return el('div', { class: 'pimpact' },
    el('p', { class: 'pimpact__figure' },
      el('span', { class: 'pimpact__value' }, figure.value),
      el('span', { class: 'pimpact__label' }, figure.label),
    ),
    figure.note ? el('p', { class: 'pimpact__note' }, figure.note) : null,
    el('div', { class: 'pimpact__dots', 'aria-hidden': 'true' },
      Array.from({ length: total }, (_, i) => el('span', { class: `pimpact__dot${i < filled ? ' is-filled' : ''}`, style: `--i:${i}` })),
    ),
    el('p', { class: 'pimpact__legend' }, `${legend.join(' ; ')}.`),
  );
}

/**
 * Projet dans le catalogue, en style index imprimé : pas de cadre, un filet,
 * un grand titre. L'élément porte l'id = slug du projet, pour que les liens
 * /projets/#slug (accueil, carte) arrivent dessus.
 */
export function projectItem(projet, domainesById) {
  const domains = projet.domains.map((id) => domainesById.get(id)?.shortTitle).filter(Boolean);
  const domainText = domains.length
    ? frenchList(domains.map((d, i) => (i === 0 ? d : d.charAt(0).toLowerCase() + d.slice(1))))
    : null;
  const line = dateline(projet);

  return el('li', {
    class: `project-item${projet.keyFigure ? ' project-item--impact' : ''}${(projet.catalogImage ?? projet.coverImage) ? ' project-item--media' : ''}`,
    id: projet.slug,
    tabindex: '-1',
    dataset: { domains: projet.domains.join(' '), slug: projet.slug },
  },
    el('article', { class: 'project-item__card' },
      // Photo propre au catalogue si elle existe : évite de répéter celle du projet vedette
      (projet.catalogImage ?? projet.coverImage)
        ? picture(projet.catalogImage ?? projet.coverImage, { className: 'project-item__media', sizes: '(min-width: 64rem) 46rem, 92vw' })
        : null,
      el('div', { class: 'project-item__body' },
        domainText ? el('p', { class: 'project-item__domains' }, domainText) : null,
        el('h3', { class: 'project-item__title' }, projet.title),
        el('p', { class: 'project-item__summary' }, projet.summary),
        line ? el('p', { class: 'project-item__dateline' }, line) : null,
        el('a', { class: 'project-item__support', href: supportHref(projet) },
          'Soutenir ce projet', el('span', { class: 'visually-hidden' }, ` : ${projet.title}`)),
      ),
      projet.keyFigure ? impact(projet.keyFigure) : null,
    ),
  );
}

/** Citation de l'ONG glissée dans l'index, avec sa source. */
export function quoteItem(citation) {
  const date = citation.date
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${citation.date}T12:00:00`))
    : null;
  return el('li', { class: 'project-quote', dataset: { quote: '' } },
    el('figure', {},
      el('blockquote', { class: 'project-quote__text' }, el('p', {}, citation.text)),
      el('figcaption', { class: 'project-quote__source' },
        `${citation.author}, ${citation.context}${date ? `, ${date}` : ''}. `,
        el('a', { href: citation.source.url, rel: 'noopener noreferrer' }, 'Lire la publication'),
      ),
    ),
  );
}
