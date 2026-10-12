# Olucos Mali — Site web

Site institutionnel de l'ONG **Olucos Mali**.

> « Unissons nos forces pour transformer des vies. Ensemble, bâtissons un avenir digne et solidaire. »

## Technologies

HTML, CSS et JavaScript natifs. Aucun framework, aucune étape de compilation, aucune dépendance à installer.

## Lancer le site en local

Le site doit être servi par un serveur local (les modules JavaScript et les fichiers de données ne se chargent pas en ouvrant le fichier directement) :

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>.

Dans VS Code, l'extension « Live Server » fonctionne aussi.

## Documentation

| Document                                                                     | Contenu                                           |
|------------------------------------------------------------------------------|---------------------------------------------------|
| [Cahier des charges](docs/Cahier_des_charges_site_Olucos_Mali.md)            | Contenus, pages et fonctionnalités attendus       |
| [Cadrage technique](docs/cadrage-technique.md)                               | Structure du code, phases, conventions            |
| [Charte graphique](docs/charte-graphique.md)                                 | Logo, couleurs, typographie, motif des points     |
| [Motion design](MotionDesign/README.md)                                      | Briefs d'animation V1 → V3                        |
| [Décisions et questions](docs/questions-client.md)                           | Décisions provisoires, informations à obtenir     |
| [CLAUDE.md](CLAUDE.md)                                                       | Règles de travail pour Claude Code                |

## État du projet

- **Phase 1 (en cours)** : site statique. Les contenus des projets, partenaires, formations, actualités et témoignages sont dans `data/*.json`.
- **Phase 2 (prévue)** : serveur, base de données et administration pour que l'équipe mette le site à jour sans toucher au code.

## Contact de l'ONG

Bamako, Baco Djicoroni, à côté de SOS Village Enfants
+223 65 88 05 88 · +223 91 50 50 29 · +223 76 15 98 28
olucosmali@gmail.com — du lundi au samedi, 08h00 à 16h00
