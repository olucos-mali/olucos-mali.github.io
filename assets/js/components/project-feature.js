import { el, icon } from '../utils/dom.js';
import { picture } from './picture.js';

const DAY = 24 * 60 * 60 * 1000;
const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/**
 * Calendrier d'un projet, calculé uniquement à partir des faits publiés
 * (date de lancement + durée annoncée). Une semaine = un point.
 */
export function projectWeeks(projet, today = new Date()) {
  if (!projet.startDate || !projet.durationMonths) return null;
  const start = new Date(`${projet.startDate}T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + projet.durationMonths);
  const total = Math.round((end - start) / (7 * DAY));
  const elapsed = Math.floor((today - start) / (7 * DAY)) + 1;
  return { start, total, current: Math.max(0, Math.min(total, elapsed)), before: today < start, after: today >= end };
}

function weeksLabel(w) {
  const launched = `lancé le ${DATE.format(w.start)}`;
  if (w.before) return `Démarrage prévu le ${DATE.format(w.start)}`;
  if (w.after) return `${w.total} semaines, ${launched}`;
  return `Semaine ${w.current} sur ${w.total}, ${launched}.`;
}

/** Bloc vedette : la photo en grand, le chiffre clé, et la frise qui montre le projet avancer. */
export function projectFeature(projet, { quiet = false } = {}) {
  const weeks = projectWeeks(projet);

  return el('article', { class: 'pfeature' },
    el('div', { class: 'pfeature__media', style: `view-transition-name: photo-${projet.slug};` },
      picture(projet.coverImage, { className: 'pfeature__picture', sizes: '(min-width: 64rem) 40rem, 100vw' }),
    ),
    el('div', { class: 'pfeature__body on-dark' },
      projet.projectStatus === 'en-cours' && !quiet
        ? el('p', { class: 'pfeature__status' }, el('span', { class: 'pfeature__live', 'aria-hidden': 'true' }), 'En cours')
        : null,
      el('h3', { class: 'pfeature__title' },
        el('a', { href: `/projets/#${projet.slug}` }, projet.title),
      ),
      // Version sobre (page Projets) : le statut en texte, sous le titre, hors de la photo
      projet.projectStatus === 'en-cours' && quiet && weeks
        ? el('p', { class: 'pfeature__status pfeature__status--quiet' }, `En cours depuis ${MONTH.format(weeks.start)}`)
        : null,
      projet.keyFigure
        ? el('p', { class: 'pfeature__figure' },
            el('span', { class: 'pfeature__value' }, projet.keyFigure.value),
            el('span', { class: 'pfeature__label' }, projet.keyFigure.label),
          )
        : el('p', { class: 'pfeature__summary' }, projet.summary),
      projet.consortium ? el('p', { class: 'pfeature__partners' }, projet.consortium) : null,
      weeks
        ? el('div', { class: 'ptimeline', dataset: { current: weeks.current } },
            el('div', { class: 'ptimeline__dots', 'aria-hidden': 'true' },
              Array.from({ length: weeks.total }, (_, i) =>
                el('span', {
                  class: `ptimeline__dot${i < weeks.current ? ' is-done' : ''}${i === weeks.current - 1 ? ' is-now' : ''}`,
                  style: `--i:${i}`,
                }),
              ),
            ),
            el('p', { class: 'ptimeline__label' }, weeksLabel(weeks)),
          )
        : null,
      el('a', { class: 'pfeature__more', href: `/projets/#${projet.slug}` },
        'Découvrir le projet', el('span', { class: 'visually-hidden' }, ` ${projet.title}`), icon('arrow-right')),
    ),
  );
}
