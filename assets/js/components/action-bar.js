/**
 * Barre d'action mobile : Appeler · Adhérer · Faire un don.
 * Visible seulement une fois le hero passé, et masquée quand la section
 * « Rejoignez le mouvement » ou le pied de page sont à l'écran (déjà des boutons).
 */
export function initActionBar(bar, { hideWhenVisible = [] } = {}) {
  if (!bar || !('IntersectionObserver' in window)) return;
  bar.hidden = false;
  document.body.classList.add('has-action-bar');
  const visible = new Set();
  const [hero, ...others] = hideWhenVisible.filter(Boolean);
  const update = () => bar.toggleAttribute('data-visible', !visible.size);
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      // Un élément qui ne fait que toucher le bord de l'écran ne compte pas
      if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    update();
  });
  [hero, ...others].filter(Boolean).forEach((n) => observer.observe(n));
}
