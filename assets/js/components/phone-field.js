/**
 * Champ téléphone en deux parties : l'indicatif pays (liste) + le numéro (saisie).
 * La liste vient de config.phoneCountries. Réutilisable (contact, adhésion…).
 *
 * HTML attendu dans le formulaire :
 *   <select name="phoneCountry" data-phone-country>…</select>
 *   <input name="phone" type="tel">
 */
import { config } from '../config.js';
import { el } from '../utils/dom.js';

const countryFor = (code) => config.phoneCountries.find((c) => c.code === code);
const onlyDigits = (v) => v.replace(/\D/g, '');

/** Remplit la liste des indicatifs (sans drapeaux emoji : ils s'affichent mal sous Windows). */
export function initPhoneField(form) {
  const select = form.querySelector('[data-phone-country]');
  if (!select) return;
  select.replaceChildren(...config.phoneCountries.map((c) =>
    el('option', { value: c.code }, `${c.code} ${c.country}`)));
  select.value = config.phoneCountries[0].code;

  // L'indicatif choisi s'affiche seul dans le champ (le nom du pays reste dans la liste)
  const code = form.querySelector('[data-phone-code]');
  const showCode = () => { if (code) code.textContent = select.value; };
  select.addEventListener('change', showCode);
  showCode();

  // Si l'on colle un numéro complet (« +221 77 … »), on choisit l'indicatif et on garde le reste
  const input = form.elements.phone;
  input.addEventListener('paste', () => setTimeout(() => {
    const raw = input.value.trim().replace(/^00/, '+');
    const match = [...config.phoneCountries].sort((a, b) => b.code.length - a.code.length)
      .find((c) => raw.replace(/\s/g, '').startsWith(c.code));
    if (match) {
      select.value = match.code;
      showCode();
      input.value = raw.replace(/\s/g, '').slice(match.code.length);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }));
  // Changer de pays revalide le numéro déjà saisi
  select.addEventListener('change', () => input.dispatchEvent(new Event('input', { bubbles: true })));
}

/** Chiffres du numéro national : le 0 de préfixe est retiré, sauf pour les pays où il fait partie du numéro. */
function nationalDigits(value, country) {
  const digits = onlyDigits(value);
  return country?.keepZero ? digits : digits.replace(/^0/, '');
}

/** Numéro complet au format international : « +223 65880588 » (vide si rien n'est saisi). */
export function phoneValue(form) {
  const number = nationalDigits(form.elements.phone.value, countryFor(form.elements.phoneCountry.value));
  return number ? `${form.elements.phoneCountry.value} ${number}` : '';
}

/** Règle de validation : longueur attendue selon le pays choisi. */
export const phoneRule = ({ optional = false } = {}) => (v, form) => {
  if (!v) return optional ? null : 'Indiquez votre numéro de téléphone.';
  if (/[^\d\s.\-()]/.test(v)) return 'Saisissez uniquement des chiffres (l\'indicatif se choisit dans la liste).';
  const country = countryFor(form.elements.phoneCountry.value);
  const n = nationalDigits(v, country).length;
  const [min, max] = Array.isArray(country?.digits) ? country.digits : [country?.digits ?? 6, country?.digits ?? 14];
  if (n >= min && n <= max) return null;
  const expected = min === max ? `${min} chiffres` : `${min} à ${max} chiffres`;
  return `Pour ${country.country}, le numéro compte ${expected} (vous en avez saisi ${n}).`;
};
