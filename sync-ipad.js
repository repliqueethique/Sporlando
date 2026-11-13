/* ============================================================
   SYNCHRONISATION LOCALE AVEC L'IPAD
   N'envoie que les informations de la séance en cours.
   ============================================================ */

(function () {
  'use strict';

  var ADRESSE_SERVEUR = 'http://127.0.0.1:8765/state';
  var intervalleSyncMinuteur = null;
  window.sporlIPadSuppressPhoneAlarm = false;

  window.publierEtatVersIPad = function (callback) {
    var callbackExecute = false;
    function terminerPublication(reponse) {
      if (callback && !callbackExecute) { callbackExecute = true; callback(reponse); }
    }
    var seance = etat && etat.seanceActive;
    var donnees = {
      connecte: true,
      date: Date.now(),
      theme: (document.documentElement.getAttribute('data-theme') || 'sombre'),
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

    var minuteurActif = donnees.minuteur.actif;
    if (minuteurActif && !intervalleSyncMinuteur) {
      intervalleSyncMinuteur = window.setInterval(function () {
        window.publierEtatVersIPad();
      }, 1000);
    } else if (!minuteurActif && intervalleSyncMinuteur) {
      window.clearInterval(intervalleSyncMinuteur);
      intervalleSyncMinuteur = null;
    }

    var requete = new XMLHttpRequest();
    requete.open('POST', ADRESSE_SERVEUR, true);
    requete.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    requete.timeout = 2000;

    requete.onload = function () {
      if (requete.status >= 200 && requete.status < 300) {
        try {
          var reponse = JSON.parse(requete.responseText);
          window.sporlIPadSuppressPhoneAlarm = !!(reponse && reponse.suppressPhoneAlarm);
          terminerPublication(reponse);
        } catch (erreurLecture) {
          window.sporlIPadSuppressPhoneAlarm = false;
          terminerPublication(null);
        }
      } else {
        window.sporlIPadSuppressPhoneAlarm = false;
        terminerPublication(null);
      }
    };
    requete.onerror = function () { window.sporlIPadSuppressPhoneAlarm = false; terminerPublication(null); };
    requete.ontimeout = function () { window.sporlIPadSuppressPhoneAlarm = false; terminerPublication(null); };

    try {
      requete.send(JSON.stringify(donnees));
    } catch (erreur) { window.sporlIPadSuppressPhoneAlarm = false; terminerPublication(null); }
  };
})();