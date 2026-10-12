/**
 * Navigation : menu mobile (panneau plein écran) et sous-menus.
 * - mobile : les sous-menus se déplient en accordéon ;
 * - bureau : ils s'ouvrent en liste déroulante, se ferment au clic extérieur,
 *   à la touche Échap ou quand le focus quitte le groupe.
 */
const DESKTOP = window.matchMedia('(min-width: 64rem)');

export function initNav() {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!header || !nav) return;

  const triggers = [...nav.querySelectorAll('[data-submenu-toggle]')];

  const setSubmenu = (trigger, open) => trigger.setAttribute('aria-expanded', String(open));
  const closeSubmenus = (except) => triggers.forEach((t) => t !== except && setSubmenu(t, false));

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const open = trigger.getAttribute('aria-expanded') !== 'true';
      if (DESKTOP.matches) closeSubmenus(trigger);
      setSubmenu(trigger, open);
    });

    // Bureau : fermer quand le focus quitte le groupe
    trigger.parentElement.addEventListener('focusout', (event) => {
      if (DESKTOP.matches && !trigger.parentElement.contains(event.relatedTarget)) setSubmenu(trigger, false);
    });
  });

  // ---- Menu mobile ----
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.nav-toggle__label').textContent = open ? 'Fermer' : 'Menu';
    nav.toggleAttribute('data-open', open);
    document.body.toggleAttribute('data-nav-open', open);
    if (open) nav.querySelector('a, button')?.focus();
  };

  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openTrigger = triggers.find((t) => t.getAttribute('aria-expanded') === 'true');
    if (DESKTOP.matches && openTrigger) {
      setSubmenu(openTrigger, false);
      openTrigger.focus();
    } else if (toggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (DESKTOP.matches && !nav.contains(event.target)) closeSubmenus();
  });

  // Mobile : garder le focus dans le panneau ouvert (bouton Fermer + liens)
  nav.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || DESKTOP.matches || !nav.hasAttribute('data-open')) return;
    const focusables = [toggle, ...nav.querySelectorAll('a[href], button')].filter((n) => n.offsetParent !== null);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  toggle?.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && event.shiftKey && nav.hasAttribute('data-open') && !DESKTOP.matches) {
      event.preventDefault();
      [...nav.querySelectorAll('a[href], button')].filter((n) => n.offsetParent !== null).pop()?.focus();
    }
  });

  // Passage mobile ↔ bureau : repartir d'un état propre
  DESKTOP.addEventListener('change', () => { setMenu(false); closeSubmenus(); });

  // En-tête : filet discret dès que la page défile
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => header.toggleAttribute('data-scrolled', !entry.isIntersecting)).observe(sentinel);
}
