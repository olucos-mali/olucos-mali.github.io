import { initSite } from '../main.js';
import { getDomaines, getProjets } from '../services/api.js';
import { el } from '../utils/dom.js';

initSite();

const root = document.querySelector('[data-dons]');
const list = root.querySelector('[data-domains]');
const text = root.querySelector('[data-detail-text]');
const projectsList = root.querySelector('[data-projects]');
const cta = root.querySelector('[data-dons-cta]');

const DEFAULT_TEXT = text.textContent;
const sujet = (label) => `/contact/?sujet=${encodeURIComponent(label ? `Faire un don : ${label}` : 'Faire un don')}`;

try {
  const [domaines, projets] = await Promise.all([getDomaines(), getProjets()]);

  list.append(...domaines.map((d) =>
    el('label', { class: 'topic' },
      el('input', { type: 'radio', name: 'domain', value: d.id }),
      el('span', {}, d.shortTitle ?? d.title))));

  const show = (id) => {
    const domaine = domaines.find((d) => d.id === id);
    cta.href = sujet(domaine?.title);
    text.textContent = domaine ? domaine.summary : DEFAULT_TEXT;
    const concernes = domaine ? projets.filter((p) => p.domains?.includes(id)) : [];
    projectsList.replaceChildren(...concernes.map((p) =>
      el('li', {}, el('a', { href: `/projets/#${p.slug}` }, p.title))));
    projectsList.hidden = concernes.length === 0;
  };

  root.addEventListener('change', (e) => { if (e.target.name === 'domain') show(e.target.value); });
} catch {
  // Sans les données, le choix par défaut reste utilisable : le bouton mène au formulaire de contact.
}
