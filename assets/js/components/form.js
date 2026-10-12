/**
 * Validation de formulaire accessible, réutilisable (contact, adhésion…).
 * - erreur sous chaque champ, reliée par aria-describedby, aria-invalid ;
 * - récapitulatif en haut, qui reçoit le focus après un envoi raté ;
 * - après un premier envoi, chaque champ se revalide quand on le quitte.
 *
 * rules : { nomDuChamp: (valeur, form) => message d'erreur | null }
 */
import { el } from '../utils/dom.js';

export function createValidator(form, rules) {
  const summary = form.querySelector('[data-error-summary]');
  let submittedOnce = false;

  const field = (name) => form.elements[name];
  // Un groupe de boutons radio : l'erreur se rattache au <fieldset>, le lien du récapitulatif mène au premier choix.
  const isGroup = (name) => field(name) instanceof RadioNodeList;
  const anchor = (name) => (isGroup(name) ? field(name)[0] : field(name));
  const host = (name) => (isGroup(name) ? anchor(name).closest('fieldset') : field(name));
  const value = (name) => {
    const f = field(name);
    return f.type === 'checkbox' ? f.checked : f.value.trim();
  };

  function setError(name, message) {
    const input = host(name);
    const errorId = `${input.id}-erreur`;
    let error = form.querySelector(`#${errorId}`);
    if (!error) {
      error = el('p', { class: 'field__error', id: errorId });
      (isGroup(name) ? input : input.closest('.field')).append(error);
    }
    error.textContent = message ?? '';
    error.hidden = !message;
    if (!isGroup(name)) input.toggleAttribute('aria-invalid', !!message);
    const described = (input.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id && id !== errorId);
    if (message) described.push(errorId);
    if (described.length) input.setAttribute('aria-describedby', described.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  function check(name) {
    const message = rules[name](value(name), form) ?? null;
    setError(name, message);
    return message;
  }

  function validateAll() {
    submittedOnce = true;
    const errors = Object.keys(rules).map((name) => [name, check(name)]).filter(([, m]) => m);
    if (!summary) return errors.length === 0;
    if (!errors.length) { summary.hidden = true; return true; }
    summary.replaceChildren(
      el('h2', { class: 'error-summary__title', tabindex: '-1' },
        errors.length > 1 ? `${errors.length} champs sont à corriger` : 'Un champ est à corriger'),
      el('ul', { role: 'list' }, errors.map(([name, message]) =>
        el('li', {}, el('a', { href: `#${anchor(name).id}` }, message)))),
    );
    summary.hidden = false;
    summary.querySelector('h2').focus();
    return false;
  }

  for (const name of Object.keys(rules)) {
    const recheck = () => { if (submittedOnce) check(name); };
    for (const input of isGroup(name) ? field(name) : [field(name)]) {
      const choice = input.type === 'checkbox' || input.type === 'radio' || input.tagName === 'SELECT';
      input.addEventListener(choice ? 'change' : 'blur', recheck);
      if (!choice) input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) check(name); });
    }
  }

  /** Vrai si le champ est valide, sans afficher d'erreur (pour l'indicateur de progression). */
  const isValid = (name) => !rules[name](value(name), form);

  return { validateAll, value, isValid };
}

// ---- Règles courantes ----
export const required = (label) => (v) => (v ? null : `Indiquez ${label}.`);

export const email = (v) => {
  if (!v) return 'Indiquez votre adresse e-mail.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : "L'adresse e-mail n'est pas valide (exemple : nom@exemple.com).";
};

/** Téléphone : malien (+223 et 8 chiffres, ou 8 chiffres) ou international (+ et 8 à 15 chiffres). */
export const phone = ({ optional = false } = {}) => (v) => {
  if (!v) return optional ? null : 'Indiquez votre numéro de téléphone.';
  const digits = v.replace(/[\s.\-()]/g, '');
  const ok = /^(\+223)?\d{8}$/.test(digits) || /^\+\d{8,15}$/.test(digits) || /^00\d{8,15}$/.test(digits);
  return ok ? null : 'Le numéro n\'est pas valide (exemple : +223 65 88 05 88).';
};

export const maxLength = (max, label) => (v) => (v && v.length > max ? `${label} ne doit pas dépasser ${max} caractères.` : null);

export const all = (...rules) => (v, form) => {
  for (const rule of rules) { const m = rule(v, form); if (m) return m; }
  return null;
};
