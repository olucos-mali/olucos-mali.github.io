import { initSite } from '../main.js';
import { getDomaines, getProjets, getActualites } from '../services/api.js';
import { el, icon } from '../utils/dom.js';
import { revealOnce } from '../utils/reveal.js';

initSite();

// Domaines directement liés aux drogues (identifiants de data/domaines.json)
const DOMAIN_IDS = ['prevention', 'reinsertion', 'protection'];

const domainsBox = document.querySelector('[data-domains]');
const projectsBox = document.querySelector('[data-projects]');
const failure = (box, label) => box.replaceChildren(el('li', { class: 'verite-project' },
  el('p', {}, `${label} n'a pas pu être chargé. Consultez la page `, el('a', { href: '/projets/' }, 'Nos projets'), '.')));

try {
  const domaines = await getDomaines();
  domainsBox.replaceChildren(...DOMAIN_IDS.map((id) => domaines.find((d) => d.id === id)).filter(Boolean).map((d) =>
    el('li', { class: 'verite-domain' },
      el('span', { class: 'verite-domain__icon' }, icon(d.icon)),
      el('h3', { class: 'verite-domain__title' }, d.title),
      el('p', {}, d.summary))));
  revealOnce([domainsBox], { threshold: 0.15 });
} catch { failure(domainsBox, 'Le contenu'); }

try {
  const projets = (await getProjets()).filter((p) => p.domains?.includes('prevention'));
  projectsBox.replaceChildren(...projets.map((p) =>
    el('li', { class: 'verite-project' },
      el('h3', { class: 'verite-project__title' }, el('a', { href: `/projets/#${p.slug}` }, p.title)),
      el('p', {}, p.summary))));
  if (!projets.length) projectsBox.hidden = true;
  revealOnce([projectsBox], { threshold: 0.1 });
} catch { failure(projectsBox, 'Le contenu'); }

// Actions de prévention récentes : actualités publiées de catégorie « Prévention »
const recent = document.querySelector('[data-recent]');
const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
try {
  const items = (await getActualites()).filter((a) => a.themes?.includes('prevention'));
  if (items.length) {
    recent.querySelector('[data-recent-list]').replaceChildren(...items.map((a) => {
      const day = a.eventDate ?? a.publishedAt;
      return el('li', { class: 'verite-project' },
        day && el('p', { class: 'verite-project__date' }, el('time', { datetime: day }, DATE.format(new Date(`${day}T12:00:00`)))),
        el('h3', { class: 'verite-project__title' }, el('a', { href: `/actualites/#${a.slug}` }, a.title)),
        el('p', {}, a.excerpt));
    }));
    recent.hidden = false;
    revealOnce([recent.querySelector('[data-recent-list]')], { threshold: 0.1 });
  }
} catch { /* section facultative : masquée si les actualités ne se chargent pas */ }
