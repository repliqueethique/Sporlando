# -*- coding: utf-8 -*-
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

DOSSIER = os.path.dirname(os.path.abspath(__file__))
FICHIER_ETAT = os.path.join(DOSSIER, "ipad-etat.json")
PORT = 8765

ETAT_DEFAUT = {
    "connecte": False,
    "seance": None,
    "minuteur": {
        "actif": False,
        "pause": False,
        "finMs": None,
        "resteMsPause": None
    }
}


class Serveur(BaseHTTPRequestHandler):

    def envoyer(self, code, contenu, type_contenu="application/json; charset=utf-8"):
        donnees = contenu.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", type_contenu)
        self.send_header("Content-Length", str(len(donnees)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(donnees)

    def do_OPTIONS(self):
        self.envoyer(204, "")

    def do_GET(self):
        if self.path == "/" or self.path.startswith("/?"):
            chemin = os.path.join(DOSSIER, "ipad-recepteur.html")
            try:
                with open(chemin, "r", encoding="utf-8") as fichier:
                    self.envoyer(200, fichier.read(), "text/html; charset=utf-8")
            except OSError:
                self.envoyer(404, "Fichier ipad-recepteur.html introuvable", "text/plain; charset=utf-8")
            return

        if self.path == "/health":
            self.envoyer(200, '{"serveur":"ok"}')
            return

        if self.path == "/state":
            try:
                with open(FICHIER_ETAT, "r", encoding="utf-8") as fichier:
                    contenu = fichier.read()
            except (OSError, ValueError):
                contenu = json.dumps(ETAT_DEFAUT, ensure_ascii=False)

            self.envoyer(200, contenu)
            return

        self.envoyer(404, '{"erreur":"introuvable"}')

    def do_POST(self):
        if self.path != "/state":
            self.envoyer(404, '{"erreur":"introuvable"}')
            return

        try:
            longueur = int(self.headers.get("Content-Length", "0"))
            if longueur <= 0 or longueur > 100000:
                raise ValueError("Taille incorrecte")

            contenu = self.rfile.read(longueur).decode("utf-8")
            donnees = json.loads(contenu)

            # On ne conserve que les champs utiles à l'écran iPad.
            seance = donnees.get("seance")
            minuteur = donnees.get("minuteur", {})

            etat = {
                "connecte": True,
                "date": donnees.get("date"),
                "seance": seance,
                "minuteur": {
                    "actif": bool(minuteur.get("actif")),
                    "pause": bool(minuteur.get("pause")),
                    "finMs": minuteur.get("finMs"),
                    "resteMsPause": minuteur.get("resteMsPause")
                }
            }

            with open(FICHIER_ETAT, "w", encoding="utf-8") as fichier:
                json.dump(etat, fichier, ensure_ascii=False)

            self.envoyer(200, '{"ok":true}')

        except Exception as erreur:
            print("Erreur de réception :", erreur)
            self.envoyer(400, '{"erreur":"donnees invalides"}')

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


if __name__ == "__main__":
    serveur = HTTPServer(("0.0.0.0", PORT), Serveur)
    print("Serveur Sporlando actif sur le port %s" % PORT)
    print("Laisse cette fenêtre ouverte pendant la séance.")
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur.")
        serveur.server_close()