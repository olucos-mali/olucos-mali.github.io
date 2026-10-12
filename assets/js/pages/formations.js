import { initSite } from '../main.js';
import { getFormations, getProjets } from '../services/api.js';
import { el, icon } from '../utils/dom.js';
import { picture } from '../components/picture.js';
import { revealOnce } from '../utils/reveal.js';

initSite();
revealOnce(document.querySelectorAll('[data-strip]'), { threshold: 0.2 });

// Photo de l'en-tête : celle du projet DJIGUIYA, lue dans les données
const heroPhoto = document.querySelector('[data-hero-photo]');
getProjets().then((projets) => {
  const image = projets.find((p) => p.slug === 'projet-djiguiya')?.coverImage;
  if (image) heroPhoto.append(picture(image, { sizes: '(min-width: 56rem) 34rem, 92vw', loading: 'eager' }));
  else heroPhoto.hidden = true;
}).catch(() => { heroPhoto.hidden = true; });

const formationsBox = document.querySelector('[data-formations]');
const projectsBox = document.querySelector('[data-projects]');
const failure = (box) => box.replaceChildren(el('li', { class: 'formation' },
  el('p', {}, "Le contenu n'a pas pu être chargé. Consultez la page ", el('a', { href: '/projets/' }, 'Nos projets'), '.')));

try {
  const formations = await getFormations();
  formationsBox.replaceChildren(...formations.map((f) =>
    el('li', { class: 'formation' },
      // Sans photo : un panneau de points de la marque, pour garder des cartes de même hauteur
      f.coverImage
        ? el('div', { class: 'formation__photo' }, picture(f.coverImage, { sizes: '(min-width: 48rem) 22rem, 92vw' }))
        : el('div', { class: 'formation__photo formation__photo--empty', 'aria-hidden': 'true' }, icon('graduation-cap')),
      el('h3', { class: 'formation__title' }, f.title),
      f.location && el('p', { class: 'formation__meta' }, f.location))));
  formationsBox.dataset.ready = '';
  revealOnce([formationsBox], { threshold: 0.15 });
  if (!formations.length) formationsBox.closest('section').hidden = true;
} catch { failure(formationsBox); }

try {
  const formationProjects = (await getProjets()).filter((p) => p.domains?.includes('formation') && p.slug !== 'projet-djiguiya');
  projectsBox.replaceChildren(...formationProjects.map((p) =>
    el('li', { class: `formation formation--project${p.coverImage ? ' formation--photo' : ''}` },
      p.coverImage && el('div', { class: 'formation__photo' }, picture(p.coverImage, { sizes: '(min-width: 48rem) 28rem, 92vw' })),
      el('h3', { class: 'formation__title' }, el('a', { href: `/projets/#${p.slug}` }, p.title)),
      el('p', {}, p.summary))));
  if (!formationProjects.length) projectsBox.closest('section').hidden = true;
} catch { failure(projectsBox); }
