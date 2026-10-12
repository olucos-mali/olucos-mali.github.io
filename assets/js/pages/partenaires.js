import { initSite } from '../main.js';
import { getPartenaires } from '../services/api.js';
import { fillList } from '../components/state.js';
import { renderPartenaires } from '../components/partners.js';
import { revealOnce } from '../utils/reveal.js';
import { el } from '../utils/dom.js';

initSite();

const messages = {
  empty: ['Nos partenaires seront bientôt présentés.'],
  error: ["Le contenu n'a pas pu être chargé. Retrouvez-nous sur ", el('a', { href: 'https://www.facebook.com/OlucosMali/', rel: 'noopener noreferrer' }, 'Facebook'), '.'],
};

const boxes = [
  [document.querySelector('[data-partners-djiguiya]'), (p) => p.group === 'djiguiya'],
  [document.querySelector('[data-partners-others]'), (p) => p.group !== 'djiguiya'],
];

// Une seule lecture des données, puis chaque liste prend sa part
const loaded = getPartenaires();
await Promise.all(boxes.map(([box, keep]) =>
  fillList(box, () => loaded.then((all) => all.filter(keep)), renderPartenaires, messages)));
boxes.forEach(([box]) => { if (box.querySelector('.partner-item')) { box.dataset.ready = ''; revealOnce([box], { threshold: 0.1 }); } });
