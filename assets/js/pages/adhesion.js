import { initSite } from '../main.js';
import { submitAdhesion, adhesionMailtoHref } from '../services/forms.js';
import { config } from '../config.js';
import { createValidator, required, email, maxLength, all } from '../components/form.js';
import { initPhoneField, phoneValue, phoneRule } from '../components/phone-field.js';
import { el } from '../utils/dom.js';

initSite();

const form = document.querySelector('[data-adhesion-form]');
initPhoneField(form);
const status = form.querySelector('[data-form-status]');
const submit = form.querySelector('[data-submit]');
const submitLabel = form.querySelector('[data-submit-label]');
const joinLine = document.querySelector('[data-join-line]');

// ---- Types d'adhésion et provenances : lus dans la configuration ----
form.querySelector('[data-types]').replaceChildren(...config.adhesionTypes.map((t) =>
  el('label', { class: 'topic' },
    el('input', { type: 'radio', name: 'type', id: `adh-type-${t.slug}`, value: t.value, required: true }),
    el('span', {}, t.value))));

form.querySelector('[data-sources]').append(...config.adhesionSources.map((s) => el('option', { value: s }, s)));

// Type pré-choisi depuis l'adresse (/adhesion/?type=benevole) : seulement s'il existe dans la liste
const presetType = new URLSearchParams(location.search).get('type');
const preset = config.adhesionTypes.find((t) => t.slug === presetType);
if (preset) form.querySelector(`#adh-type-${preset.slug}`).checked = true;

// ---- Compteur de caractères de la motivation ----
const MAX_MOTIVATION = 2000;
const MIN_MOTIVATION = 20;
const motivation = form.elements.motivation;
const counter = form.querySelector('[data-count-for="adh-motivation"]');
const fmt = new Intl.NumberFormat('fr-FR');
const updateCount = () => {
  const n = motivation.value.trim().length;
  const missing = MIN_MOTIVATION - n;
  counter.textContent = n > 0 && missing > 0
    ? `Encore ${missing} caractère${missing > 1 ? 's' : ''} pour compléter votre réponse`
    : `${fmt.format(motivation.value.length)} / ${fmt.format(MAX_MOTIVATION)} caractères`;
  counter.classList.toggle('is-short', n > 0 && missing > 0);
};
motivation.addEventListener('input', updateCount);
updateCount();

// ---- Validation ----
const validator = createValidator(form, {
  type: (v) => (config.adhesionTypes.some((t) => t.value === v)
    ? null
    : `Choisissez comment vous souhaitez nous rejoindre : ${config.adhesionTypes.map((t) => t.value.toLowerCase()).join(', ')}.`),
  name: all(required('votre nom complet'), maxLength(100, 'Le nom')),
  email,
  phone: phoneRule(),
  address: all(required('votre adresse'), maxLength(200, "L'adresse")),
  role: all(required('votre rôle ou votre occupation'), maxLength(100, 'Le rôle')),
  organisation: maxLength(150, "Le nom de l'organisation"),
  source: (v) => (config.adhesionSources.includes(v) ? null : "Indiquez comment vous avez entendu parler d'Olucos Mali."),
  motivation: all(
    (v) => (v ? null : 'Expliquez en quelques mots pourquoi vous souhaitez nous rejoindre.'),
    (v) => (v.length < MIN_MOTIVATION ? `Votre réponse doit compter au moins ${MIN_MOTIVATION} caractères : dites-nous ce qui vous motive.` : null),
    maxLength(MAX_MOTIVATION, 'La motivation'),
  ),
});

// ---- Progression : un point par champ obligatoire, il se remplit quand le champ est valide ----
const REQUIRED = ['type', 'name', 'email', 'phone', 'address', 'role', 'source', 'motivation'];
const progressBox = form.querySelector('[data-progress]');
progressBox.replaceChildren(...REQUIRED.map(() => el('span')));
const progress = [...progressBox.children];
function updateProgress() {
  REQUIRED.forEach((name, i) => progress[i].classList.toggle('is-done', validator.isValid(name)));
}
form.addEventListener('input', updateProgress);
form.addEventListener('change', updateProgress);
updateProgress();

function setBusy(busy) {
  submit.disabled = busy;
  submit.toggleAttribute('data-busy', busy);
  form.setAttribute('aria-busy', String(busy));
  submitLabel.textContent = busy ? 'Envoi en cours…' : 'Envoyer ma demande';
}

function showStatus(kind, ...content) {
  status.className = `form__status form__status--${kind}`;
  status.replaceChildren(...content);
  status.hidden = false;
  status.focus();
}

const phones = () => config.contact.phones.map((p, i) => [i ? ', ' : '', el('a', { href: `tel:${p.replace(/\s/g, '')}` }, p)]);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.hidden = true;
  if (!validator.validateAll()) return;

  const data = {
    type: validator.value('type'),
    name: validator.value('name'),
    email: validator.value('email'),
    phone: phoneValue(form),
    address: validator.value('address'),
    organisation: validator.value('organisation'),
    role: validator.value('role'),
    source: validator.value('source'),
    motivation: validator.value('motivation'),
    communications: form.elements.communications.checked,
    botcheck: form.elements.botcheck.checked,
  };

  setBusy(true);
  const result = await submitAdhesion(data);
  setBusy(false);

  if (result.status === 'sent') {
    form.reset();
    updateCount();
    updateProgress();
    joinLine?.classList.add('is-joined');
    showStatus('success',
      el('h2', { class: 'form__status-title' }, 'Demande envoyée'),
      el('p', {}, `Merci ${data.name.split(' ')[0]}. Nous avons bien reçu votre demande et nous vous répondrons à l'adresse ${data.email}.`),
    );
  } else if (result.status === 'unavailable') {
    // Aucun faux succès : la demande n'est PAS partie, on le dit et on propose une vraie solution.
    showStatus('info',
      el('h2', { class: 'form__status-title' }, "L'envoi en ligne n'est pas encore activé"),
      el('p', {}, "Votre demande n'a pas été envoyée. Vous pouvez l'envoyer depuis votre messagerie : elle est déjà rédigée."),
      el('p', {}, el('a', { class: 'button button--primary', href: adhesionMailtoHref(data) }, 'Envoyer par e-mail')),
      el('p', { class: 'form__status-alt' }, 'Ou appelez-nous : ', ...phones(), '.'),
    );
  } else {
    showStatus('error',
      el('h2', { class: 'form__status-title' }, "La demande n'a pas pu être envoyée"),
      el('p', {}, 'Vérifiez votre connexion et réessayez. Vos réponses sont conservées dans le formulaire.'),
      el('p', { class: 'form__status-alt' }, 'Vous pouvez aussi nous écrire à ',
        el('a', { href: adhesionMailtoHref(data) }, config.contact.email), ' ou appeler le ', ...phones().slice(0, 1), '.'),
    );
  }
});
