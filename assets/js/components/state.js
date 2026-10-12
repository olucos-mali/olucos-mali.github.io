import { el } from '../utils/dom.js';

/**
 * Remplit un conteneur de liste en gérant les états chargement / vide / erreur.
 * render(items) doit renvoyer un tableau de nœuds.
 */
export async function fillList(container, load, render, messages) {
  if (!container) return;
  container.setAttribute('aria-busy', 'true');
  try {
    const items = await load();
    container.replaceChildren(...(items.length ? render(items) : [emptyState(container, messages.empty)]));
  } catch (error) {
    console.error(error);
    container.replaceChildren(emptyState(container, messages.error));
  } finally {
    container.removeAttribute('aria-busy');
  }
}

function emptyState(container, content) {
  const tag = container.tagName === 'UL' || container.tagName === 'OL' ? 'li' : 'div';
  return el(tag, { class: 'state-message' }, ...content);
}
