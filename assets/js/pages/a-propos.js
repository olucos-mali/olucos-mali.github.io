import { initSite } from '../main.js';
import { getPartenaires } from '../services/api.js';
import { fillList } from '../components/state.js';
import { renderPartenaires } from '../components/partners.js';
import { el } from '../utils/dom.js';
import { revealOnce } from '../utils/reveal.js';

initSite();
revealOnce(document.querySelectorAll('[data-reveal]'), { threshold: 0.6 });
// Le motif de points se dessine derrière le portrait, une fois
revealOnce([document.querySelector('[data-portrait]')], { threshold: 0.3 });
revealOnce([document.querySelector('[data-milestones]')], { threshold: 0.3 });

fillList(
  document.querySelector('[data-partners]'),
  getPartenaires,
  renderPartenaires,
  {
    empty: ['Nos partenaires seront bientôt présentés.'],
    error: ['Le contenu n\'a pas pu être chargé. Consultez la page ', el('a', { href: '/partenaires/' }, 'Nos partenaires'), '.'],
  },
);
