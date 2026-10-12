/**
 * Ajoute la classe .is-in à chaque élément quand il entre à l'écran, une seule fois.
 * Le CSS décrit l'état « avant » (sous .js … :not(.is-in)) et l'animation.
 *
 * Sécurité : si le mouvement est réduit ou si IntersectionObserver n'existe pas,
 * tout est révélé immédiatement. Aucun contenu ne peut rester caché.
 */
export function revealOnce(targets, { threshold = 0.25, rootMargin = '0px 0px -8% 0px' } = {}) {
  const list = [...targets].filter(Boolean);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    list.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  }, { threshold, rootMargin });
  list.forEach((el) => observer.observe(el));
}
