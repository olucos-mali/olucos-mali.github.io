import { el } from '../utils/dom.js';
import { picture } from './picture.js';

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Carte d'actualité. Sans photo, le motif de points de la marque prend la place. */
export function newsCard(article) {
  // On affiche la date de l'événement (connue) plutôt qu'une date de publication supposée
  const day = article.eventDate ?? article.publishedAt;
  const date = day ? new Date(`${day}T12:00:00`) : null;
  return el('article', { class: 'news-card' },
    article.coverImage
      ? picture(article.coverImage, { className: 'news-card__media', sizes: '(min-width: 64rem) 24rem, (min-width: 48rem) 45vw, 86vw' })
      : el('div', { class: 'news-card__media news-card__media--pattern', 'aria-hidden': 'true' }),
    el('div', { class: 'news-card__body' },
      date ? el('time', { class: 'news-card__date', datetime: day }, DATE.format(date)) : null,
      el('h3', { class: 'news-card__title' },
        el('a', { href: `/actualites/#${article.slug}` }, article.title),
      ),
      el('p', { class: 'news-card__excerpt' }, article.excerpt),
      article.source
        ? el('a', { class: 'news-card__source', href: article.source.url, rel: 'noopener noreferrer' },
            'Voir sur Facebook', el('span', { class: 'visually-hidden' }, ` : ${article.title}`))
        : null,
    ),
  );
}
