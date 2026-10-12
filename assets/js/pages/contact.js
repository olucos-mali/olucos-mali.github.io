import { initSite } from '../main.js';
import { submitContact, mailtoHref } from '../services/forms.js';
import { config } from '../config.js';
import { createValidator, required, email, maxLength, all } from '../components/form.js';
import { initPhoneField, phoneValue, phoneRule } from '../components/phone-field.js';
import { el } from '../utils/dom.js';

initSite();

const form = document.querySelector('[data-contact-form]');
initPhoneField(form);
const status = form.querySelector('[data-form-status]');
const submit = form.querySelector('[data-submit]');
const submitLabel = form.querySelector('[data-submit-label]');

// ---- « Votre message concerne… » : un choix remplit le sujet ----
const subjectInput = form.elements.subject;
const topics = [...form.querySelectorAll('input[name="topic"]')];
topics.forEach((radio) => radio.addEventListener('change', () => {
  if (radio.value) {
    subjectInput.value = radio.value;
  } else {
    subjectInput.value = '';
    subjectInput.focus();
  }
  subjectInput.dispatchEvent(new Event('input'));
}));
// Si le visiteur réécrit le sujet, le choix correspondant reste coché seulement s'il correspond
subjectInput.addEventListener('input', () => {
  const match = topics.find((r) => r.value && r.value === subjectInput.value);
  if (match) match.checked = true;
  else if (subjectInput.value) topics.find((r) => !r.value).checked = true;
});

// ---- Sujet pré-rempli depuis l'adresse (/contact/?sujet=…), inséré en texte brut ----
const preset = new URLSearchParams(location.search).get('sujet');
if (preset) {
  subjectInput.value = preset.slice(0, 150);
  subjectInput.dispatchEvent(new Event('input'));
}

// ---- Compteur de caractères du message ----
const message = form.elements.message;
const counter = form.querySelector('[data-count-for="contact-message"]');
const fmt = new Intl.NumberFormat('fr-FR');
const MIN_MESSAGE = 10;
const updateCount = () => {
  const n = message.value.trim().length;
  const missing = MIN_MESSAGE - n;
  counter.textContent = n > 0 && missing > 0
    ? `Encore ${missing} caractère${missing > 1 ? 's' : ''} pour compléter le message`
    : `${fmt.format(message.value.length)} / ${fmt.format(3000)} caractères`;
  counter.classList.toggle('is-short', n > 0 && missing > 0);
};
message.addEventListener('input', updateCount);
updateCount();

// ---- Validation ----
const validator = createValidator(form, {
  name: all(required('votre nom'), maxLength(100, 'Le nom')),
  email,
  phone: phoneRule({ optional: true }),
  subject: all(required('le sujet de votre message'), maxLength(150, 'Le sujet')),
  message: all(
    (v) => (v ? null : 'Écrivez votre message.'),
    (v) => (v.length < MIN_MESSAGE ? `Votre message doit compter au moins ${MIN_MESSAGE} caractères : précisez votre demande.` : null),
    maxLength(3000, 'Le message'),
  ),
  consent: (checked) => (checked ? null : "Cochez la case pour nous permettre d'utiliser vos informations et vous répondre."),
});

// ---- Progression : un point par élément obligatoire, il se remplit quand l'élément est valide ----
const progress = [...form.querySelectorAll('[data-progress] span')];
const REQUIRED = ['subject', 'name', 'email', 'message', 'consent'];
function updateProgress() {
  REQUIRED.forEach((name, i) => progress[i]?.classList.toggle('is-done', validator.isValid(name)));
}
form.addEventListener('input', updateProgress);
form.addEventListener('change', updateProgress);
updateProgress();

function setBusy(busy) {
  submit.disabled = busy;
  submit.toggleAttribute('data-busy', busy);
  form.setAttribute('aria-busy', String(busy));
  submitLabel.textContent = busy ? 'Envoi en cours…' : 'Envoyer le message';
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
    name: validator.value('name'),
    email: validator.value('email'),
    phone: phoneValue(form),
    subject: validator.value('subject'),
    message: validator.value('message'),
    botcheck: form.elements.botcheck.checked,
  };

  setBusy(true);
  const result = await submitContact(data);
  setBusy(false);

  if (result.status === 'sent') {
    form.reset();
    updateCount();
    updateProgress();
    showStatus('success',
      el('h2', { class: 'form__status-title' }, 'Message envoyé'),
      el('p', {}, `Merci ${data.name.split(' ')[0]}. Nous vous répondrons à l'adresse ${data.email}.`),
    );
  } else if (result.status === 'unavailable') {
    // Aucun faux succès : le message n'est PAS parti, on le dit et on propose une vraie solution.
    showStatus('info',
      el('h2', { class: 'form__status-title' }, "L'envoi en ligne n'est pas encore activé"),
      el('p', {}, "Votre message n'a pas été envoyé. Vous pouvez l'envoyer depuis votre messagerie : il est déjà rédigé."),
      el('p', {}, el('a', { class: 'button button--primary', href: mailtoHref(data) }, 'Envoyer par e-mail')),
      el('p', { class: 'form__status-alt' }, 'Ou appelez-nous : ', ...phones(), '.'),
    );
  } else {
    showStatus('error',
      el('h2', { class: 'form__status-title' }, "Le message n'a pas pu être envoyé"),
      el('p', {}, 'Vérifiez votre connexion et réessayez. Votre texte est conservé dans le formulaire.'),
      el('p', { class: 'form__status-alt' }, 'Vous pouvez aussi nous écrire à ',
        el('a', { href: mailtoHref(data) }, config.contact.email), ' ou appeler le ', ...phones().slice(0, 1), '.'),
    );
  }
});
