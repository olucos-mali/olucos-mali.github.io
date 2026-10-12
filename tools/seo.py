"""Référencement : à lancer UNE FOIS le domaine connu (et à relancer s'il change).

    python3 tools/seo.py https://exemple.org        (sans « / » final)
    python3 tools/seo.py https://exemple.org --dry  (affiche ce qui changerait, n'écrit rien)

Ce que fait le script, sur toutes les pages du site :
  - ajoute <link rel="canonical"> et og:url (sauf sur la 404, qui reste « noindex ») ;
  - rend absolues les adresses de l'image de partage (og:image, twitter:image),
    indispensable pour les aperçus Facebook, WhatsApp et X ;
  - ajoute « url » et « logo » aux données structurées de l'accueil ;
  - génère sitemap.xml et la ligne « Sitemap » de robots.txt.
Le script peut être relancé sans danger : il remplace ce qu'il a déjà écrit.
Outil de développement : il ne fait pas partie du site publié."""
import pathlib
import re
import sys

args = [a for a in sys.argv[1:] if a != '--dry']
dry = '--dry' in sys.argv
if len(args) != 1 or not re.fullmatch(r'https?://[^/\s]+', args[0]):
    sys.exit(__doc__)

domaine = args[0]
racine = pathlib.Path(__file__).resolve().parent.parent
IMAGE = f'{domaine}/assets/images/og-image.png'
EXCLUS = {'assets', 'data', 'docs', 'tools', 'MotionDesign'}

fichiers = [racine / 'index.html', racine / '404.html'] + sorted(
    p for p in racine.glob('*/index.html') if p.parent.name not in EXCLUS)

pages_indexables = []
for fichier in fichiers:
    html = fichier.read_text(encoding='utf-8')
    est_404 = fichier.name == '404.html'
    chemin = '/' if fichier.parent == racine and not est_404 else (f'/{fichier.parent.name}/' if not est_404 else '/404.html')
    url = f'{domaine}{chemin}'

    # 1. Retire ce que le script a déjà écrit, et le rappel « À CONFIRMER : domaine »
    html = re.sub(r'[ \t]*<!--\s*\[À CONFIRMER : domaine\].*?-->\n', '', html)
    html = re.sub(r'[ \t]*<link rel="canonical"[^>]*>\n', '', html)
    html = re.sub(r'[ \t]*<meta property="og:url"[^>]*>\n', '', html)

    # 2. Image de partage en adresse absolue
    html = re.sub(r'(<meta property="og:image" content=")[^"]*(")', rf'\g<1>{IMAGE}\2', html)
    html = re.sub(r'(<meta name="twitter:image" content=")[^"]*(")', rf'\g<1>{IMAGE}\2', html)
    if 'name="twitter:image"' not in html and 'property="og:image"' in html:
        html = re.sub(r'([ \t]*)(<meta property="og:image"[^>]*>\n)',
                      rf'\1\2\1<meta name="twitter:image" content="{IMAGE}">\n', html, count=1)

    # 3. canonical + og:url avant og:type (pages indexables seulement)
    if not est_404:
        html = re.sub(r'([ \t]*)(<meta property="og:type")',
                      rf'\1<link rel="canonical" href="{url}">\n\1<meta property="og:url" content="{url}">\n\1\2', html, count=1)
        pages_indexables.append(chemin)

    # 4. Données structurées de l'accueil : url et logo
    if chemin == '/' and 'application/ld+json' in html:
        html = re.sub(r'\n\s*"(url|logo)": "[^"]*",', '', html)
        html = html.replace('"name": "Olucos Mali",',
                            f'"name": "Olucos Mali",\n    "url": "{domaine}/",\n    "logo": "{domaine}/assets/images/logo/olucos-mali.png",', 1)

    if not dry:
        fichier.write_text(html, encoding='utf-8')

sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
sitemap += [f'  <url><loc>{domaine}{p}</loc></url>' for p in pages_indexables]
sitemap.append('</urlset>')

robots = (racine / 'robots.txt').read_text(encoding='utf-8')
robots = re.sub(r'\n# Le plan du site.*\n?', '\n', robots)
robots = re.sub(r'\nSitemap:.*\n?', '\n', robots).rstrip() + f'\n\nSitemap: {domaine}/sitemap.xml\n'

if not dry:
    (racine / 'sitemap.xml').write_text('\n'.join(sitemap) + '\n', encoding='utf-8')
    (racine / 'robots.txt').write_text(robots, encoding='utf-8')
print(f'{"[simulation] " if dry else ""}{len(fichiers)} pages traitées, {len(pages_indexables)} dans sitemap.xml, domaine : {domaine}')
