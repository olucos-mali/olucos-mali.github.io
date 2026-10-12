import { initSite } from '../main.js';
import { getTemoignages } from '../services/api.js';
import { el } from '../utils/dom.js';

initSite();

/** Un témoignage publié : citation, puis la personne (ou « Anonyme ») et son contexte. */
function renderTestimonial(t) {
  const who = t.anonymized ? 'Témoignage anonyme' : t.personName;
  return el('li', { class: 'testimonial' },
    el('blockquote', { class: 'testimonial__quote' }, el('p', {}, t.quote)),
    el('p', { class: 'testimonial__who' }, who, t.roleOrContext ? el('span', {}, t.roleOrContext) : null),
  );
}

/** Aucun témoignage publié : un état vide soigné, jamais de faux contenu. */
const empty = () => el('li', { class: 'testimonials__empty' },
  el('span', { class: 'testimonials__dots', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
  el('h2', { class: 'testimonials__title' }, 'Les premiers témoignages arrivent'),
  el('p', {}, "Nous ne publions un témoignage qu'avec l'accord de la personne, qui peut aussi choisir de rester anonyme."),
  el('p', { class: 'testimonials__cta' },
    el('a', { class: 'button button--primary', href: '/projets/' }, 'Découvrir nos projets'),
    el('a', { class: 'button button--outline', href: '/actualites/' }, 'Lire les actualités'),
  ),
);

const box = document.querySelector('[data-testimonials]');
try {
  const items = await getTemoignages();
  box.replaceChildren(...(items.length ? items.map(renderTestimonial) : [empty()]));
} catch {
  box.replaceChildren(el('li', { class: 'state-message' }, "Les témoignages n'ont pas pu être chargés. Retrouvez-nous sur ",
    el('a', { href: 'https://www.facebook.com/OlucosMali/', rel: 'noopener noreferrer' }, 'Facebook'), '.'));
} finally {
  box.removeAttribute('aria-busy');
}
