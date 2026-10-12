/**
 * « Cette place est pour vous » : au clic sur Adhérer ou Faire un don,
 * un point part du bouton et vient prendre la place vide de la flèche,
 * puis la page demandée s'ouvre. Le geste d'adhérer, rendu visible.
 *
 * - Ctrl/Cmd/Maj-clic (nouvel onglet) : comportement normal, rien n'est intercepté.
 * - Mouvement réduit : navigation immédiate.
 * - Filet de sécurité : la navigation a lieu au plus tard après 900 ms.
 */
export function initJoinDot(section) {
  const empty = section?.querySelector('.dot--empty');
  if (!empty) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  section.querySelectorAll('[data-join]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (reduce || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!('animate' in Element.prototype)) return;
      event.preventDefault();

      const go = () => { window.location.href = link.href; };
      const safety = setTimeout(go, 900);

      const from = link.getBoundingClientRect();
      const to = empty.getBoundingClientRect();
      const size = 14;
      const start = { x: from.left + from.width / 2 - size / 2, y: from.top + from.height / 2 - size / 2 };
      const end = { x: to.left + to.width / 2 - size / 2, y: to.top + to.height / 2 - size / 2 };
      const mid = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 60 };

      const dot = document.createElement('span');
      dot.className = 'flying-dot';
      dot.style.background = getComputedStyle(link).backgroundColor;
      document.body.append(dot);

      dot.animate([
        { transform: `translate(${start.x}px, ${start.y}px) scale(1.6)` },
        { transform: `translate(${mid.x}px, ${mid.y}px) scale(1.2)`, offset: 0.5 },
        { transform: `translate(${end.x}px, ${end.y}px) scale(${to.width / size})` },
      ], { duration: 560, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'forwards' })
        .finished.then(() => {
          empty.classList.add('is-filled');
          dot.remove();
          clearTimeout(safety);
          setTimeout(go, 200);
        }).catch(go);
    });
  });
}
