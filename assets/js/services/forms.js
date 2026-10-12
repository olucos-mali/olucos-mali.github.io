/**
 * Envoi des formulaires. Seul fichier qui sait OÙ partent les données.
 * Phase 1 : Web3Forms (si la clé existe dans config.js), sinon aucun envoi.
 * Phase 2 : remplacer le corps de send() par un appel à l'API de l'ONG.
 *
 * Retour : { status: 'sent' } | { status: 'unavailable' } | { status: 'error', message }
 * Jamais de faux succès : sans clé, on renvoie 'unavailable'.
 */
import { config } from '../config.js';

const ENDPOINT = 'https://api.web3forms.com/submit';

async function send(subjectPrefix, fields) {
  if (!config.web3formsKey) return { status: 'unavailable' };
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: config.web3formsKey,
        subject: `${subjectPrefix} ${fields.subject ?? ''}`.trim(),
        from_name: 'Site Olucos Mali',
        ...fields,
      }),
    });
    const data = await response.json().catch(() => ({}));
    return response.ok && data.success !== false
      ? { status: 'sent' }
      : { status: 'error', message: data.message };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/** Formulaire de contact. `botcheck` est le champ piège anti-robots : rempli = robot. */
export async function submitContact({ name, email, phone, subject, message, botcheck }) {
  if (botcheck) return { status: 'sent' }; // On ne signale rien au robot
  return send('[Contact]', {
    name, email, phone, subject, message,
    consent: `Accepté le ${new Date().toISOString()}`,
  });
}

/** Lien mailto prêt à l'emploi : solution de repli tant que l'envoi en ligne n'est pas actif. */
export function mailtoHref({ name, email, phone, subject, message }) {
  const body = `${message}\n\n— ${name}\n${email}${phone ? `\n${phone}` : ''}`;
  return `mailto:${config.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Demande d'adhésion. `communications` : case facultative, jamais précochée ; si cochée,
 * on enregistre la date et l'heure du consentement (révocable sur simple demande).
 */
export async function submitAdhesion({ type, name, email, phone, address, organisation, role, source, motivation, communications, botcheck }) {
  if (botcheck) return { status: 'sent' };
  return send('[Adhésion]', {
    subject: `${type} — ${name}`,
    type, name, email, phone, address,
    organisation: organisation || 'Non renseignée',
    role, source, motivation,
    communications: communications ? `Accepté le ${new Date().toISOString()}` : 'Non',
  });
}

/** Lien mailto de repli pour l'adhésion : la demande est déjà rédigée. */
export function adhesionMailtoHref({ type, name, email, phone, address, organisation, role, source, motivation }) {
  const lines = [
    `Type d'adhésion : ${type}`,
    `Nom complet : ${name}`,
    `E-mail : ${email}`,
    `Téléphone : ${phone}`,
    `Adresse : ${address}`,
    organisation ? `Organisation ou entreprise : ${organisation}` : null,
    `Rôle ou occupation : ${role}`,
    `Connaissance d'Olucos Mali : ${source}`,
    '',
    'Motivation :',
    motivation,
  ].filter((l) => l !== null);
  return `mailto:${config.contact.email}?subject=${encodeURIComponent(`Adhésion — ${type} — ${name}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
