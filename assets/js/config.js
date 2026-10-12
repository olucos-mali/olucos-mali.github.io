/**
 * Réglages du site.
 * Phase 1 : les données viennent des fichiers JSON de /data.
 * Phase 2 : remplacer dataBaseUrl par l'adresse de l'API. Rien d'autre à changer.
 */
export const config = {
  dataBaseUrl: '/data',

  // Clé Web3Forms (publique par conception, ce n'est pas un secret).
  // [À CONFIRMER] à créer par l'ONG avec olucosmali@gmail.com.
  web3formsKey: null,

  /**
   * Indicatifs proposés dans les champs téléphone (le premier est sélectionné par défaut).
   * digits : nombre de chiffres du numéro (sans l'indicatif) ; [min, max] si variable.
   * keepZero : le 0 initial fait partie du numéro (ne pas le retirer), ex. Côte d'Ivoire.
   */
  phoneCountries: [
    { code: '+223', country: 'Mali', digits: 8 },
    { code: '+221', country: 'Sénégal', digits: 9 },
    { code: '+225', country: "Côte d'Ivoire", digits: 10, keepZero: true },
    { code: '+226', country: 'Burkina Faso', digits: 8 },
    { code: '+224', country: 'Guinée', digits: 9 },
    { code: '+227', country: 'Niger', digits: 8 },
    { code: '+222', country: 'Mauritanie', digits: 8 },
    { code: '+213', country: 'Algérie', digits: 9 },
    { code: '+212', country: 'Maroc', digits: 9 },
    { code: '+33', country: 'France', digits: 9 },
    { code: '+32', country: 'Belgique', digits: [8, 9] },
    { code: '+34', country: 'Espagne', digits: 9 },
    { code: '+39', country: 'Italie', digits: [9, 11] },
    { code: '+49', country: 'Allemagne', digits: [10, 11] },
    { code: '+44', country: 'Royaume-Uni', digits: 10 },
    { code: '+1', country: 'États-Unis / Canada', digits: 10 },
    { code: '+86', country: 'Chine', digits: 11 },
  ],

  /** Formulaire d'adhésion : types et provenances proposés (listes lues ici, jamais écrites dans le HTML). */
  adhesionTypes: [
    { value: 'Membre', slug: 'membre' },
    { value: 'Bénévole', slug: 'benevole' },
    { value: 'Stagiaire', slug: 'stagiaire' },
  ],
  adhesionSources: [
    'Facebook',
    'X (Twitter)',
    'Un proche, un ami ou un collègue',
    "Une activité ou un événement d'Olucos Mali",
    'Un partenaire',
    'Une recherche sur Internet',
    'Autre',
  ],

  contact: {
    email: 'olucosmali@gmail.com',
    phones: ['+223 65 88 05 88', '+223 91 50 50 29', '+223 76 15 98 28'],
  },
};
