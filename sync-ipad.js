/* ============================================================
   SYNCHRONISATION LOCALE AVEC L'IPAD
   N'envoie que les informations de la séance en cours.
   ============================================================ */

(function () {
  'use strict';

  var ADRESSE_SERVEUR = 'http://127.0.0.1:8765/state';

  window.publierEtatVersIPad = function () {
    var seance = etat && etat.seanceActive;
    var donnees = {
      connecte: true,
      date: Date.now(),
      seance: null,
      minuteur: {
        actif: false,
        pause: false,
        finMs: null,
        resteMsPause: null
      }
    };

    if (seance) {
      var position = typeof voixPositionEnCours === 'function'
        ? voixPositionEnCours()
        : null;

      var exercice = null;
      var serie = null;

      if (position) {
        var ligne = seance.exercices[position.ex];
        serie = ligne.series[position.serie];
        exercice = trouverParId(etat.exercices, ligne.exerciceId);
      }

      donnees.seance = {
        nom: seance.nom || 'Séance en cours',
        exercice: exercice ? exercice.nom : '',
        numeroSerie: position ? position.serie + 1 : null,
        poids: serie ? serie.poids : null,
        repetitions: serie ? serie.reps : null,
        terminee: !position
      };
    }

    if (typeof compteARebours !== 'undefined') {
      donnees.minuteur.actif = !!compteARebours.actif;
      donnees.minuteur.pause = !!compteARebours.enPause;
      donnees.minuteur.finMs = compteARebours.finMs;
      donnees.minuteur.resteMsPause = compteARebours.resteMsPause;
    }

    var requete = new XMLHttpRequest();
    requete.open('POST', ADRESSE_SERVEUR, true);
    requete.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    requete.timeout = 2000;

    requete.onerror = function () {};
    requete.ontimeout = function () {};

    try {
      requete.send(JSON.stringify(donnees));
    } catch (erreur) {}
  };
})();