/** Initialisation commune à toutes les pages. */
import { initNav } from './components/nav.js';

export function initSite() {
  initNav();
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}
