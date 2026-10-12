import { initSite } from '../main.js';
import { getActualites } from '../services/api.js';
import { fillList } from '../components/state.js';
import { dateline } from '../components/news-list.js';
import { picture } from '../components/picture.js';
import { revealOnce } from '../utils/reveal.js';
import { el } from '../utils/dom.js';

initSite();

/** Le texte d'une actualité est coupé en paragraphes aux fins de phrases, sans rien ajouter. */
function paragraphs(text) {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÝŒ0-9])/);
  const groups = [];
  for (const sentence of sentences) {
    const last = groups.at(-1);
    if (last && last.length + sentence.length < 280) groups[groups.length - 1] = `${last} ${sentence}`;
    else groups.push(sentence);
  }
  return groups.map((g) => el('p', {}, g));
}

function renderArticle(article) {
  return el('article', { class: 'journal__item', id: article.slug, 'aria-labelledby': `${article.slug}-titre` },
    el('span', { class: 'journal__dot', 'aria-hidden': 'true' }),
    article.coverImage
      ? el('div', { class: 'journal__media' },
        picture(article.coverImage, { sizes: '(min-width: 60rem) 24rem, 92vw' }))
      : null,
    el('div', { class: 'journal__body' },
      dateline(article),
      el('h2', { class: 'journal__title', id: `${article.slug}-titre` }, article.title),
      ...paragraphs(article.content ?? article.excerpt),
      article.source
        ? el('a', { class: 'news__source', href: article.source.url, rel: 'noopener noreferrer' },
          'Lire la publication sur Facebook', el('span', { class: 'visually-hidden' }, ` : ${article.title}`))
        : null,
    ),
  );
}

const journal = document.querySelector('[data-journal]');
fillList(
  journal,
  () => getActualites(),
  (items) => items.map(renderArticle),
  {
    empty: ['Les premières actualités arriveront bientôt. En attendant, suivez-nous sur ', el('a', { href: 'https://www.facebook.com/OlucosMali/', rel: 'noopener noreferrer' }, 'Facebook'), '.'],
    error: ["Les actualités n'ont pas pu être chargées. Retrouvez-les sur ", el('a', { href: 'https://www.facebook.com/OlucosMali/', rel: 'noopener noreferrer' }, 'notre page Facebook'), '.'],
  },
).then(() => {
  const items = [...journal.querySelectorAll('.journal__item')];
  if (!items.length) return;
  journal.dataset.ready = '';
  revealOnce(items, { threshold: 0.2 });
  // Lien /actualites/#slug : le navigateur a défilé avant l'affichage des articles, on y retourne
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
});
