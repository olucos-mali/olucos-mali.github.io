import { initSite } from '../main.js';
import { getDomaines, getProjets, getPartenaires, getLieux, getActualites, getCitations } from '../services/api.js';
import { newsLead, newsRow } from '../components/news-list.js';
import { fillList } from '../components/state.js';
import { renderDomaines, initDomainsDisclosure } from '../components/domains.js';
import { projectFeature } from '../components/project-feature.js';
import { projectIndex } from '../components/project-index.js';
import { renderPartenaires } from '../components/partners.js';
import { renderWaffle } from '../components/waffle.js';
import { renderMap, renderPlaces, linkPlacesToMap, pauseMapWhenHidden } from '../components/mali-map.js';
import { initActionBar } from '../components/action-bar.js';
import { initJoinDot } from '../components/join-dot.js';
import { el } from '../utils/dom.js';
import { revealOnce } from '../utils/reveal.js';

initSite();
renderWaffle(document.querySelector('[data-waffle]'));
initJoinDot(document.querySelector('#rejoindre'));

// Une seule animation par section, déclenchée à l'arrivée à l'écran
revealOnce(document.querySelectorAll('[data-reveal]'), { threshold: 0.6 });
revealOnce([document.querySelector('.stats')], { threshold: 0.4 });
revealOnce([document.querySelector('#rejoindre')], { threshold: 0.35 });
initActionBar(document.querySelector('[data-action-bar]'), {
  hideWhenVisible: [
    document.querySelector('.hero'),
    document.querySelector('#rejoindre'),
    document.querySelector('.site-footer'),
  ],
});

const errorMessage = (page, href) => [
  'Le contenu n\'a pas pu être chargé. Vérifiez votre connexion ou consultez la page ',
  el('a', { href }, page), '.',
];

const domainesPromise = getDomaines();
const projetsPromise = getProjets();

// ---- Lieux + carte ----
const placesList = document.querySelector('[data-places]');
const mapCanvas = document.querySelector('[data-map]');
fillList(
  placesList,
  async () => {
    const [lieux, projets] = await Promise.all([getLieux(), projetsPromise.catch(() => [])]);
    renderMap(mapCanvas, lieux);
    return renderPlaces(lieux, new Map(projets.map((p) => [p.slug, p])));
  },
  (nodes) => nodes,
  { empty: ['Nos lieux d\'intervention seront bientôt présentés.'], error: errorMessage('Nos projets', '/projets/') },
).then(() => {
  linkPlacesToMap(placesList, mapCanvas);
  revealOnce([mapCanvas], { threshold: 0.4 });
  pauseMapWhenHidden(mapCanvas);
});

// ---- Domaines ----
const domainsList = document.querySelector('[data-domains]');
fillList(
  domainsList,
  () => domainesPromise,
  renderDomaines,
  { empty: ['Nos domaines d\'intervention seront bientôt présentés.'], error: errorMessage('À propos', '/a-propos/') },
).then(() => initDomainsDisclosure(domainsList));

// ---- Projets : un projet en cours en grand + un index des autres ----
const featureBox = document.querySelector('[data-project-feature]');
const indexList = document.querySelector('[data-project-index]');
const projetsHome = Promise.all([projetsPromise, domainesPromise.catch(() => [])]).then(([projets, domaines]) => {
  const byId = new Map(domaines.map((d) => [d.id, d]));
  const featured = projets.filter((p) => p.featured);
  const lead = featured.find((p) => p.projectStatus === 'en-cours' && p.coverImage) ?? featured[0];
  return { byId, lead, others: featured.filter((p) => p !== lead).slice(0, 6) };
});

fillList(
  featureBox,
  async () => {
    const { lead } = await projetsHome;
    return lead ? [projectFeature(lead)] : [];
  },
  (nodes) => nodes,
  { empty: ['Les projets seront bientôt présentés ici.'], error: errorMessage('Nos projets', '/projets/') },
).then(() => revealOnce([featureBox.querySelector('.ptimeline')], { threshold: 0.6 }));

fillList(
  indexList,
  async () => {
    const { byId, others } = await projetsHome;
    return projectIndex(others, byId);
  },
  (nodes) => nodes,
  { empty: ['D\'autres projets seront bientôt présentés.'], error: errorMessage('Nos projets', '/projets/') },
).then(() => revealOnce([indexList], { threshold: 0.15 }));

// ---- Actualités : la plus récente en grand, les suivantes en lignes ----
const newsBox = document.querySelector('[data-news]');
fillList(
  newsBox,
  async () => {
    const [lead, ...others] = await getActualites({ limit: 3 });
    if (!lead) return [];
    return [newsLead(lead), others.length ? el('ul', { class: 'news-rows', role: 'list' }, others.map(newsRow)) : null].filter(Boolean);
  },
  (nodes) => nodes,
  {
    empty: ['Les premières actualités arriveront bientôt. En attendant, suivez-nous sur ', el('a', { href: 'https://www.facebook.com/OlucosMali/', rel: 'noopener noreferrer' }, 'Facebook'), '.'],
    error: ['Les actualités n\'ont pas pu être chargées. Retrouvez-les sur ', el('a', { href: 'https://www.facebook.com/OlucosMali/', rel: 'noopener noreferrer' }, 'notre page Facebook'), '.'],
  },
).then(() => revealOnce([newsBox], { threshold: 0.15 }));

// ---- Citation de l'ONG (tirée de ses propres publications) ----
getCitations().then(([citation]) => {
  const box = document.querySelector('[data-home-quote]');
  if (!citation || !box) return;
  box.replaceChildren(el('figure', { class: 'home-quote__figure' },
    el('blockquote', {}, el('p', {}, citation.text)),
    el('figcaption', {}, `${citation.author}, ${citation.context}. `,
      el('a', { href: citation.source.url, rel: 'noopener noreferrer' }, 'Lire la publication')),
  ));
}).catch(() => {});

// ---- Partenaires ----
fillList(
  document.querySelector('[data-partners]'),
  getPartenaires,
  renderPartenaires,
  { empty: ['Nos partenaires seront bientôt présentés.'], error: errorMessage('Nos partenaires', '/partenaires/') },
);
