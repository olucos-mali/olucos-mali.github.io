"""Serveur local de développement : comme `python3 -m http.server`, mais sans cache navigateur.
Évite les erreurs « does not provide an export named … » quand un module JavaScript change.
Usage : python3 serve.py [port]   (8765 par défaut). Hors du site publié : ne sert qu'en local."""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    http.server.test(HandlerClass=NoCacheHandler, port=int(sys.argv[1]) if len(sys.argv) > 1 else 8765)
