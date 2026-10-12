import { el } from '../utils/dom.js';
import { picture } from './picture.js';

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** « Bamako, 22 septembre 2026. Projet DJIGUIYA. » — lieu seulement s'il est connu. */
export function dateline(article) {
  const day = article.eventDate ?? article.publishedAt;
  const date = day ? DATE.format(new Date(`${day}T12:00:00`)) : null;
  const where = [article.place, date].filter(Boolean).join(', ');
  return el('p', { class: 'news__dateline' },
    date ? el('time', { datetime: day }, where) : where,
    article.projectName ? `. Projet ${article.projectName}.` : '.',
  );
}

const source = (article) => (article.source
  ? el('a', { class: 'news__source', href: article.source.url, rel: 'noopener noreferrer' },
      'Lire sur Facebook', el('span', { class: 'visually-hidden' }, ` : ${article.title}`))
  : null);

/** Actualité principale : grande photo, titre, chapô. */
export function newsLead(article) {
  return el('article', { class: 'news-lead' },
    article.coverImage
      ? picture(article.coverImage, { className: 'news-lead__media', sizes: '(min-width: 64rem) 40rem, 92vw' })
      : null,
    el('div', { class: 'news-lead__body' },
      dateline(article),
      el('h3', { class: 'news-lead__title' }, el('a', { href: `/actualites/#${article.slug}` }, article.title)),
      el('p', { class: 'news-lead__excerpt' }, article.excerpt),
      source(article),
    ),
  );
}

/** Actualités suivantes : une ligne de texte, une petite vignette. */
export function newsRow(article) {
  return el('li', { class: 'news-row' },
    el('div', { class: 'news-row__body' },
      dateline(article),
      el('h3', { class: 'news-row__title' }, el('a', { href: `/actualites/#${article.slug}` }, article.title)),
      source(article),
    ),
    article.coverImage
      ? picture(article.coverImage, { className: 'news-row__media', sizes: '7rem' })
      : null,
  );
}
