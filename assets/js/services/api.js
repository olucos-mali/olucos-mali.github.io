/**
 * Seul point d'accès aux données du site.
 * Les pages et composants n'appellent jamais fetch() directement :
 * en phase 2, seul ce fichier changera pour interroger l'API.
 */
import { config } from '../config.js';

async function fetchJson(path) {
  const response = await fetch(`${config.dataBaseUrl}/${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Chargement impossible : ${path} (${response.status})`);
  }
  return response.json();
}

const isPublished = (item) => item.status === 'published';

export async function getDomaines() {
  return (await fetchJson('domaines.json')).filter(isPublished);
}

export async function getProjets({ featured } = {}) {
  const projets = (await fetchJson('projets.json')).filter(isPublished);
  return featured === undefined ? projets : projets.filter((p) => p.featured === featured);
}

/** Formations publiées. Les sessions datées (startDate…) ne sont renseignées que lorsqu'elles sont confirmées. */
export async function getFormations() {
  return (await fetchJson('formations.json')).filter(isPublished);
}

export async function getPartenaires() {
  return (await fetchJson('partenaires.json')).filter(isPublished);
}

export async function getLieux() {
  return (await fetchJson('lieux.json')).filter(isPublished);
}

/** Actualités publiées, de la plus récente à la plus ancienne. */
export async function getActualites({ limit } = {}) {
  const items = (await fetchJson('actualites.json'))
    .filter((a) => isPublished(a) && a.publishedAt)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return limit ? items.slice(0, limit) : items;
}

/**
 * Témoignages publiés. Jamais inventés : un témoignage n'apparaît que s'il est publié
 * ET que le consentement de la personne est enregistré (consentStatus === 'obtained').
 */
export async function getTemoignages() {
  return (await fetchJson('temoignages.json')).filter((t) => isPublished(t) && t.consentStatus === 'obtained');
}

/** Citations de l'ONG, tirées de ses propres publications (source et date conservées). */
export async function getCitations() {
  return (await fetchJson('citations.json')).filter(isPublished);
}
