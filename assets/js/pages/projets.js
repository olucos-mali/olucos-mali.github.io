import { initSite } from '../main.js';
import { getProjets, getDomaines, getLieux, getCitations } from '../services/api.js';
import { fillList } from '../components/state.js';
import { projectFeature } from '../components/project-feature.js';
import { ongoingCard } from '../components/ongoing-card.js';
import { projectItem, quoteItem } from '../components/project-item.js';
import { renderMap, pauseMapWhenHidden } from '../components/mali-map.js';
import { el } from '../utils/dom.js';
import { revealOnce } from '../utils/reveal.js';
import { frenchTypo } from '../utils/typo.js';

initSite();
revealOnce(document.querySelectorAll('[data-reveal]'), { threshold: 0.6 });

const PARAM = 'domaine';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const filtersBox = document.querySelector('[data-filters]');
const list = document.querySelector('[data-project-list]');
const countLine = document.querySelector('[data-count]');
const mapCanvas = document.querySelector('[data-map]');
const mapNote = document.querySelector('[data-map-note]');

const data = Promise.all([getProjets(), getDomaines()]).then(([projets, domaines]) => ({
  projets,
  domaines,
  byId: new Map(domaines.map((d) => [d.id, d])),
}));

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// Petits nombres en toutes lettres, comme en édition (« sept domaines »)
const WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt'];
const inWords = (n) => WORDS[n] ?? String(n);

// ---- Repères chiffrés (calculés à partir des données, rien d'écrit à la main) ----
data.then(({ projets, domaines }) => {
  const ongoing = projets.filter((p) => p.projectStatus === 'en-cours').length;
  const sentence = `${inWords(projets.length).replace(/^./, (c) => c.toUpperCase())} projets et actions, dans ${inWords(domaines.length)} domaines d'intervention.`
    + (ongoing ? ` ${inWords(ongoing).replace(/^./, (c) => c.toUpperCase())} ${ongoing > 1 ? 'sont' : 'est'} en cours aujourd'hui.` : '');
  document.querySelector('[data-project-facts]').textContent = frenchTypo(sentence);
}).catch(() => document.querySelector('[data-project-facts]').replaceChildren());

// ---- Projets en cours : un en grand, les autres à côté ----
const ongoingBox = document.querySelector('[data-ongoing]');
fillList(
  ongoingBox,
  async () => {
    const { projets } = await data;
    const ongoing = projets.filter((p) => p.projectStatus === 'en-cours');
    const lead = ongoing.find((p) => p.coverImage) ?? ongoing[0];
    if (!lead) return [];
    const others = ongoing.filter((p) => p !== lead);
    return [
      projectFeature(lead, { quiet: true }),
      others.length ? el('div', { class: 'ongoing__others' }, others.map((p) => ongoingCard(p))) : null,
    ].filter(Boolean);
  },
  (nodes) => nodes,
  {
    empty: ['Aucun projet en cours pour le moment.'],
    error: ['Les projets n\'ont pas pu être chargés. Vérifiez votre connexion.'],
  },
).then(() => revealOnce([ongoingBox.querySelector('.ptimeline')], { threshold: 0.6 }));

// ---- Carte : quels lieux pour quels projets (d'après data/lieux.json) ----
let placesBySlug = new Map();

function syncMap(visibleSlugs, filtered = false) {
  if (!mapCanvas) return;
  mapCanvas.querySelectorAll('.map-marker').forEach((marker) => {
    const lit = [...visibleSlugs].some((slug) => placesBySlug.get(slug)?.includes(marker.dataset.place));
    marker.classList.toggle('is-dim', !lit);
  });
  if (mapNote) {
    const names = [...mapCanvas.querySelectorAll('.map-marker:not(.is-dim)')].map((m) => m.textContent);
    const hint = window.matchMedia('(hover: hover)').matches
      ? 'Survolez un projet pour voir où il se déroule.'
      : 'Le siège est à Bamako ; les autres points marquent nos lieux d\'intervention.';
    restingNote = !filtered
      ? hint
      : names.length
        ? `Lieux concernés : ${names.join(', ')}.`
        : 'Aucun lieu associé à cette sélection.';
    mapNote.textContent = frenchTypo(restingNote);
  }
}

let titlesBySlug = new Map();
let restingNote = '';

/** Survol d'un projet : son lieu s'allume nettement, les autres s'estompent, la légende le nomme. */
function highlightPlaces(slug) {
  if (!mapCanvas) return;
  mapCanvas.setAttribute('data-ready', '');
  const places = slug ? placesBySlug.get(slug) ?? [] : [];
  mapCanvas.toggleAttribute('data-focus', !!slug);
  mapCanvas.querySelectorAll('.map-marker').forEach((m) => m.toggleAttribute('data-active', places.includes(m.dataset.place)));
  if (!mapNote) return;
  if (!slug) { mapNote.textContent = frenchTypo(restingNote); return; }
  const names = [...mapCanvas.querySelectorAll('.map-marker[data-active]')].map((m) => m.textContent);
  mapNote.textContent = frenchTypo(`${titlesBySlug.get(slug)} : ${names.length ? names.join(', ') : 'lieu non précisé'}.`);
}

/** Survol d'un lieu : les projets qui s'y déroulent ressortent dans la liste. */
function highlightProjects(placeId) {
  const slugs = placeId ? [...placesBySlug].filter(([, ids]) => ids.includes(placeId)).map(([slug]) => slug) : [];
  list.querySelectorAll('.project-item').forEach((item) => item.classList.toggle('is-linked', slugs.includes(item.dataset.slug)));
  return slugs;
}

// ---- Catalogue filtrable ----
let current = new URLSearchParams(location.search).get(PARAM) ?? 'tous';

/** Filtrage animé (FLIP) : les cartes restantes glissent vers leur nouvelle place. */
function applyFilter({ projets, domaines }, slug, { updateUrl = true, animate = true } = {}) {
  const domain = domaines.find((d) => d.slug === slug);
  current = domain ? slug : 'tous';
  const visible = projets.filter((p) => !domain || p.domains.includes(domain.id));

  filtersBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.slug === current)));
  const select = document.querySelector('[data-filter-select]');
  if (select) select.value = current;

  const items = [...list.querySelectorAll('.project-item')];
  const before = new Map(items.filter((i) => !i.hidden).map((i) => [i, i.getBoundingClientRect()]));

  items.forEach((item) => {
    item.hidden = !!domain && !item.dataset.domains.split(' ').includes(domain.id);
  });

  if (animate && !reduceMotion) {
    let entering = 0;
    items.filter((i) => !i.hidden).forEach((item) => {
      const from = before.get(item);
      const to = item.getBoundingClientRect();
      if (from) {
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (dx || dy) item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 480, easing: EASE });
      } else {
        item.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
          { duration: 420, easing: EASE, delay: Math.min(entering++, 8) * 45, fill: 'backwards' });
      }
    });
  }

  list.querySelector('.project-list__empty')?.remove();
  if (!visible.length) {
    list.append(el('li', { class: 'project-list__empty state-message' },
      el('p', {}, `Aucun projet n'est encore présenté dans le domaine « ${domain.title} ». Pour en savoir plus sur nos actions dans ce domaine, contactez-nous.`),
      el('p', {},
        el('button', { class: 'button button--outline', type: 'button', dataset: { reset: '' } }, 'Voir tous les projets'),
        ' ', el('a', { href: '/contact/' }, 'Nous contacter'),
      ),
    ));
  }

  countLine.textContent = frenchTypo(domain
    ? `${domain.shortTitle ?? domain.title} : ${plural(visible.length, 'projet', 'projets')}`
    : `${plural(visible.length, 'projet', 'projets')} et actions`);

  // Les citations rythment l'index complet ; elles s'effacent quand on filtre
  list.querySelectorAll('[data-quote]').forEach((q) => { q.hidden = !!domain; });

  syncMap(new Set(visible.map((p) => p.slug)), !!domain);

  if (updateUrl) {
    const url = new URL(location.href);
    if (domain) url.searchParams.set(PARAM, slug); else url.searchParams.delete(PARAM);
    url.hash = '';
    history.replaceState(null, '', url);
  }
}

fillList(
  list,
  async () => {
    const { projets, byId } = await data;
    const citations = await getCitations().catch(() => []);
    const items = projets.map((p) => projectItem(p, byId));
    // Une citation après le 3e projet, une autre après le 9e
    [3, 10].forEach((at, i) => { if (citations[i] && items.length > at) items.splice(at, 0, quoteItem(citations[i])); });
    return items;
  },
  (nodes) => nodes,
  {
    empty: ['Les projets seront bientôt présentés ici.'],
    error: ['Le catalogue n\'a pas pu être chargé. Vérifiez votre connexion ou contactez-nous au +223 65 88 05 88.'],
  },
).then(async () => {
  const d = await data.catch(() => null);
  if (!d) return;

  // Carte : lieux publiés, reliés aux projets
  const lieux = await getLieux().catch(() => []);
  placesBySlug = new Map();
  for (const lieu of lieux) {
    for (const item of lieu.items) {
      if (!item.project) continue;
      placesBySlug.set(item.project, [...(placesBySlug.get(item.project) ?? []), lieu.id]);
    }
  }
  renderMap(mapCanvas, lieux);
  revealOnce([mapCanvas], { threshold: 0.3 });
  pauseMapWhenHidden(mapCanvas);

  titlesBySlug = new Map(d.projets.map((p) => [p.slug, p.title]));

  // Survol ou focus d'un projet → son lieu s'allume sur la carte
  list.addEventListener('pointerover', (e) => highlightPlaces(e.target.closest('.project-item')?.dataset.slug));
  list.addEventListener('pointerleave', () => highlightPlaces(null));
  list.addEventListener('focusin', (e) => highlightPlaces(e.target.closest('.project-item')?.dataset.slug));
  list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget)) highlightPlaces(null); });

  // Survol d'un lieu → ses projets ressortent ; clic → on va au premier
  mapCanvas?.addEventListener('pointerover', (e) => {
    const marker = e.target.closest('.map-marker');
    if (!marker) return;
    mapCanvas.setAttribute('data-ready', '');
    const slugs = highlightProjects(marker.dataset.place);
    mapCanvas.querySelectorAll('.map-marker').forEach((m) => m.toggleAttribute('data-active', m === marker));
    mapCanvas.setAttribute('data-focus', '');
    if (mapNote) mapNote.textContent = frenchTypo(`${marker.textContent} : ${slugs.map((s) => titlesBySlug.get(s)).join(' ; ')}.`);
  });
  mapCanvas?.addEventListener('pointerout', (e) => {
    if (e.relatedTarget?.closest?.('.map-marker')) return;
    highlightProjects(null);
    highlightPlaces(null);
  });
  mapCanvas?.addEventListener('click', (e) => {
    const marker = e.target.closest('.map-marker');
    if (!marker) return;
    const first = list.querySelector('.project-item.is-linked:not([hidden])');
    first?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  // Boutons de filtre : « Tous » + chaque domaine, avec le nombre de projets
  const count = (domain) => d.projets.filter((p) => p.domains.includes(domain.id)).length;
  filtersBox.replaceChildren(
    el('button', { class: 'filter', type: 'button', 'aria-pressed': 'false', dataset: { slug: 'tous' } },
      'Tous', el('span', { class: 'filter__count' }, String(d.projets.length))),
    ...d.domaines.map((domain) =>
      el('button', { class: 'filter', type: 'button', 'aria-pressed': 'false', dataset: { slug: domain.slug } },
        domain.shortTitle ?? domain.title, el('span', { class: 'filter__count' }, String(count(domain))))),
  );

  // Mobile : la même liste de filtres sous forme de liste déroulante native
  const select = el('select', { class: 'filter-select__control', id: 'filtre-domaine', dataset: { filterSelect: '' } },
    el('option', { value: 'tous' }, `Tous les domaines (${d.projets.length})`),
    ...d.domaines.map((domain) => el('option', { value: domain.slug }, `${domain.shortTitle ?? domain.title} (${count(domain)})`)),
  );
  filtersBox.before(el('div', { class: 'filter-select' },
    el('label', { class: 'filter-select__label', for: 'filtre-domaine' }, 'Domaine'),
    select,
  ));
  select.addEventListener('change', () => applyFilter(d, select.value));

  filtersBox.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-slug]');
    if (b) applyFilter(d, b.dataset.slug);
  });
  list.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) {
      applyFilter(d, 'tous');
      filtersBox.querySelector('[data-slug="tous"]').focus();
    }
  });

  // Arrivée sur un projet précis (/projets/#slug) : on l'affiche et on le met en évidence
  const goToHash = () => {
    const id = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    const target = id ? document.getElementById(id) : null;
    if (!target || !target.classList.contains('project-item')) return false;
    if (target.hidden) applyFilter(d, 'tous', { updateUrl: false, animate: false });
    list.querySelectorAll('.is-target').forEach((n) => n.classList.remove('is-target'));
    target.classList.add('is-target');
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    target.focus({ preventScroll: true });
    highlightPlaces(target.dataset.slug);
    return true;
  };
  applyFilter(d, current, { updateUrl: false, animate: false });
  goToHash();
  // Liens internes à la page (« Découvrir le projet », cartes en cours)
  window.addEventListener('hashchange', goToHash);
  revealOnce([list], { threshold: 0, rootMargin: '0px' });
});
