if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(function (reg) {
      console.log('Service Worker enregistré, scope: ' + reg.scope);
    })
    .catch(function (err) {
      console.error('Erreur enregistrement SW:', err);
    });

  navigator.serviceWorker.addEventListener('message', function (event) {
    if (event.data && event.data.action === 'aller-ressenti') {
      allerVersRessentiJour();
    }
  });
}

window.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'ressenti') {
    allerVersRessentiJour();
  }
});

/* ============================================================
   BLOC 17 : ROUTAGE DES CLICS (délégation d'événements)
   ============================================================ */

ajouterEcouteurClicDelegue(document.body, function (cible) {
  var action = cible.getAttribute('data-action');
  var id = cible.getAttribute('data-id');

  if (action === 'aller-page') { allerVersPage(cible.getAttribute('data-page')); return; }
  if (action === 'fermer-modal') { fermerModal(); return; }
  if (action === 'confirmation-valider') { validerConfirmation(); return; }
  if (action === 'confirmation-annuler') { annulerConfirmation(); return; }
  if (action === 'choisir-echauffement') { choisirEchauffement(cible.getAttribute('data-type')); return; }
  if (action === 'passer-echauffement') { passerEchauffement(); return; }
  if (action === 'echauffement-retour') { demanderEchauffement(callbackApresEchauffement); return; }
  if (action === 'terminer-echauffement') { terminerEchauffement(); return; }
  if (action === 'ouvrir-reglages') { ouvrirReglages(); return; }
  if (action === 'reglages-ouvrir-section') { rendreReglages(cible.getAttribute('data-section'), 'avant'); return; }
  if (action === 'reglages-retour') { rendreReglages('menu', 'arriere'); return; }
  if (action === 'enregistrer-meteo-profil') { enregistrerMeteoProfil(); return; }
  if (action === 'enregistrer-personnalisation') { enregistrerPersonnalisation(); return; }
  if (action === 'tester-sonnerie-minuteur') { testerSonnerieMinuteur(); return; }
  if (action === 'ouvrir-export-donnees') { ouvrirExportDonnees(); return; }
  if (action === 'tenter-telechargement-json') { tenterTelechargementJson(); return; }
  if (action === 'ouvrir-import-donnees') { ouvrirImportDonnees(); return; }
  if (action === 'lancer-import-json') { lancerImportJson(); return; }
  if (action === 'ouvrir-notice') { ouvrirNotice(); return; }
  if (action === 'ouvrir-guide-types') { ouvrirGuideTypes(); return; }
  if (action === 'ouvrir-notes') { ouvrirNotes(); return; }
  if (action === 'nouvelle-note') { ouvrirEditionNote(null); return; }
  if (action === 'editer-note') { ouvrirEditionNote(id); return; }
  if (action === 'enregistrer-note') { enregistrerNote(id || null); return; }
  if (action === 'supprimer-note') { supprimerNote(id); return; }
  if (action === 'ouvrir-verif-objectif') { ouvrirVerificationObjectif(); return; }
  if (action === 'confirmer-objectif') { confirmerObjectif(); return; }
  if (action === 'enregistrer-profil') { enregistrerProfil(); return; }
  if (action === 'choisir-option') { choisirOptionReglage(cible); return; }
  if (action === 'enregistrer-reglages-sync') { enregistrerReglagesSync(); return; }
  if (action === 'enregistrer-ipad') { enregistrerAdresseIpad(); return; }
  if (action === 'tester-ipad') { testerConnexionIpad(); return; }
  if (action === 'creer-gist') { creerNouveauGist(); return; }
  if (action === 'synchroniser-maintenant') { synchroniserMaintenant(); return; }
  if (action === 'basculer-token') { basculerAffichageToken(); return; }
  if (action === 'aller-vers-ressenti') {
    allerVersRessentiJour();
    return;
  }
  if (action === 'basculer-booleen-ressenti') {
    basculerBooleenRessenti(cible.getAttribute('data-champ'), cible);
    return;
  }  
  if (action === 'valider-poids-jour') { validerPoidsJour(); return; }
  if (action === 'heure-prete-pas') { ajusterHeurePrete(parseInt(cible.getAttribute('data-delta'), 10)); return; }
  if (action === 'enregistrer-heure-prete') { validerHeurePrete(); return; }
  if (action === 'effacer-heure-prete') { effacerPrete(heureEdition.cle); return; }
  if (action === 'tester-notif') {
    demanderPermissionNotif().then(function (accorde) {
      if (accorde) {
        envoyerNotification('Carnet Muscu', 'Ceci est un test 🔔');
      } else {
        afficherToast('Notifications refusées ou non supportées.');
      }
    });
    return;
  }
  if (action === 'changer-periode-etat') { changerPeriodeEtat(cible.getAttribute('data-periode')); return; }
  if (action === 'toggle-rappel-actif') { toggleRappelActif(parseInt(cible.getAttribute('data-index'), 10)); return; }
  if (action === 'marquer-rappel-fait') { marquerRappelFaitEtRafraichir(cible.getAttribute('data-rappel-id')); return; }
  if (action === 'aller-vers-ressenti') { allerVersRessentiJour(); return; }
  if (action === 'sous-onglet') {
    var groupe = cible.getAttribute('data-groupe');
    var boutonsGroupe = document.querySelectorAll('.sous-onglet[data-groupe="' + groupe + '"]');
    for (var i = 0; i < boutonsGroupe.length; i++) { boutonsGroupe[i].classList.remove('sous-onglet-actif'); }
    cible.classList.add('sous-onglet-actif');
    var barreOnglets = cible.parentNode;
    barreOnglets.scrollLeft = cible.offsetLeft - (barreOnglets.clientWidth - cible.offsetWidth) / 2;
    if (groupe === 'hist') { window.scrollTo(0, 0); }
    var sectionsGroupe = document.querySelectorAll('.section-' + groupe);
    for (var j = 0; j < sectionsGroupe.length; j++) { sectionsGroupe[j].style.display = 'none'; }
    var sousOnglet = cible.getAttribute('data-cible');
    document.getElementById(groupe + '-' + sousOnglet).style.display = 'block';

    if (groupe === 'hist' && sousOnglet === 'seances') {
      rendreHistoriqueSeances();
    }
    if (groupe === 'hist' && sousOnglet === 'etat') {
      rendreGraphiqueEtat();
    }
    return;
  }
  if (action === 'voir-detail-historique') { ouvrirDetailHistorique(id); return; }
  if (action === 'basculer-serie-historique') {
    basculerSerieFaiteHistorique(cible.getAttribute('data-entree'), parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10));
    return;
  }
  if (action === 'tout-marquer-fait-historique') { toutMarquerHistorique(id, true); return; }
  if (action === 'tout-marquer-non-fait-historique') { toutMarquerHistorique(id, false); return; }

  if (action === 'ouvrir-selecteur-exercice-progression') { ouvrirSelecteurExerciceProgression(); return; }
  if (action === 'choisir-exercice-progression') { changerExerciceProgression(id); fermerModal(); return; }

  if (action === 'toggle-vue-combinee-etat') { basculerVueCombineeEtat(); return; }
  if (action === 'toggle-courbe-etat') { basculerCourbeEtat(cible.getAttribute('data-courbe')); return; }

  if (action === 'nouvel-exercice') { ouvrirFormulaireExercice(null); return; }
  if (action === 'nouvel-aliment') { ouvrirFormulaireAliment(null); return; }
  if (action === 'editer-aliment') { ouvrirFormulaireAliment(id); return; }
  if (action === 'enregistrer-aliment') { enregistrerAliment(id || null); return; }
  if (action === 'supprimer-aliment') { supprimerAliment(id); return; }
  if (action === 'charger-aliments-base') { chargerAlimentsDeBase(); return; }
  if (action === 'basculer-groupe-aliments') { basculerGroupeAliments(cible.getAttribute('data-groupe')); return; }
  if (action === 'jour-nutrition-precedent') { changerJourNutrition(-1); return; }
  if (action === 'jour-nutrition-suivant') { changerJourNutrition(1); return; }
  if (action === 'ajouter-aliment-journal') { ouvrirFormulaireAjoutJournal(); return; }
  if (action === 'confirmer-ajout-journal') { confirmerAjoutJournal(); return; }
  if (action === 'retirer-aliment-journal') { retirerAlimentDuJournal(id); return; }
  if (action === 'editer-entree-journal') { ouvrirEditionEntreeJournal(id); return; }
  if (action === 'enregistrer-entree-journal') { enregistrerEditionJournal(); return; }
  if (action === 'supprimer-entree-journal') { retirerAlimentDuJournal(id); fermerModal(); return; }
  if (action === 'charger-aliments-base') { chargerAlimentsDeBase(); return; }
  if (action === 'basculer-groupe-aliments') { basculerGroupeAliments(cible.getAttribute('data-groupe')); return; }
  if (action === 'calculer-objectifs-nutrition') { calculerObjectifsNutritionAuto(); return; }
  if (action === 'basculer-categorie-selecteur') { basculerCategorieSelecteur(cible.getAttribute('data-groupe')); return; }

  if (action === 'nouveau-plat') { ouvrirFormulairePlat(null); return; }
  if (action === 'editer-plat') { ouvrirFormulairePlat(id); return; }
  if (action === 'enregistrer-plat') { enregistrerPlat(id || null); return; }
  if (action === 'supprimer-plat') { supprimerPlat(id); return; }
  if (action === 'ajouter-ingredient-plat') { ajouterIngredientPlat(); return; }
  if (action === 'retirer-ingredient-plat') { retirerIngredientPlat(parseInt(cible.getAttribute('data-index'), 10)); return; }
  if (action === 'type-ajout-journal') { basculerTypeAjoutJournal(cible.getAttribute('data-type')); return; }

  if (action === 'changer-ingredient-plat') { ouvrirSelecteurAliment('plat-changer', parseInt(cible.getAttribute('data-index'), 10)); return; }
  if (action === 'selecteur-aliment-retour') { rendreFormulairePlat('arriere'); return; }
  if (action === 'choisir-aliment-selecteur') { choisirAlimentSelecteur(id); return; }
  if (action === 'plat-portions-delta') { ajusterPortionsPlat(parseFloat(cible.getAttribute('data-delta'))); return; }
  if (action === 'appliquer-kcal-aliment') { appliquerKcalAliment(cible.getAttribute('data-valeur')); return; }
  if (action === 'choisir-plat-journal') { choisirPlatJournal(id); return; }
  if (action === 'journal-retour-choix') { rendreEtapeChoixJournal('arriere'); return; }
  if (action === 'journal-chip') { appliquerChipJournal(parseFloat(cible.getAttribute('data-valeur'))); return; }
  if (action === 'confirmer-ajout-journal-encore') { confirmerAjoutJournal(true); return; }

  if (action === 'jour-nutrition-precedent') { changerJourNutrition(-1); return; }
  if (action === 'basculer-groupe-exercices') { basculerGroupeExercices(cible.getAttribute('data-groupe')); return; }
  if (action === 'charger-exercices-base') { chargerExercicesDeBase(); return; }
  if (action === 'editer-exercice') { ouvrirFormulaireExercice(id); return; }
  if (action === 'enregistrer-exercice') { enregistrerExercice(id || null); return; }
  if (action === 'supprimer-exercice') { supprimerExercice(id); return; }

  if (action === 'nouvelle-seance') { ouvrirFormulaireSeance(null); return; }
  if (action === 'editer-seance') { ouvrirFormulaireSeance(id); return; }
  if (action === 'aide-type-seance') { ouvrirAideTypeSeance(parseInt(cible.getAttribute('data-index'), 10), cible.getAttribute('data-champ')); return; }
  if (action === 'retour-formulaire-seance') { rendreFormulaireSeance('arriere'); return; }
  if (action === 'ajouter-exercice-a-seance') { ajouterExerciceASeance(); return; }
  if (action === 'retirer-exercice-seance') { retirerExerciceDeSeance(parseInt(cible.getAttribute('data-index'), 10)); return; }
  if (action === 'enregistrer-seance') { enregistrerSeance(); return; }
  if (action === 'supprimer-seance') { supprimerSeance(id); return; }

  if (action === 'nouveau-programme') { ouvrirFormulaireProgramme(null); return; }
  if (action === 'editer-programme') { ouvrirFormulaireProgramme(id); return; }
  if (action === 'enregistrer-programme') { enregistrerProgramme(); return; }
  if (action === 'supprimer-programme') { supprimerProgramme(id); return; }
  if (action === 'demarrer-programme') { demarrerProgramme(id); return; }
  if (action === 'arreter-programme') { arreterProgrammeActif(); return; }

  if (action === 'mois-precedent') { changerMois(-1); return; }
  if (action === 'semaine-precedente') { changerSemaine(-1); return; }
  if (action === 'semaine-suivante') { changerSemaine(1); return; }
  if (action === 'mois-suivant') { changerMois(1); return; }
  if (action === 'selectionner-jour') { selectionnerJour(cible.getAttribute('data-date')); return; }
  if (action === 'basculer-piscine') { basculerPiscine(); return; }
  if (action === 'planifier-jour') { ouvrirFormulairePlanification(); return; }
  if (action === 'confirmer-planification') { confirmerPlanification(); return; }
  if (action === 'annuler-agenda') { annulerAgenda(id); return; }
  if (action === 'demarrer-depuis-agenda') { demarrerDepuisAgenda(id); return; }

  if (action === 'demarrer-seance-libre') { demarrerSeanceLibre(id); return; }
  if (action === 'terminer-seance') { terminerSeance(); return; }
  if (action === 'choisir-rpe-seance') { rpeSeanceChoisi = parseInt(cible.getAttribute('data-valeur'), 10); rendreModalFinSeance(); return; }
  if (action === 'valider-fin-seance') { validerFinSeance(); return; }
  if (action === 'basculer-voix') { if (voixActive) { desactiverCommandeVocale(); } else { activerCommandeVocale(); } return; }
  if (action === 'annuler-seance') { annulerSeance(); }
  if (action === 'ajouter-serie') { ajouterSerieLive(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'choisir-rer') { choisirRer(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-valeur'), 10)); return; }
  if (action === 'ajouter-serie-echauffement') { ajouterSerieEchauffementLive(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'ajouter-serie-degressive') { ajouterSerieDegressive(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'supprimer-serie') { supprimerSerieLive(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'basculer-serie-faite') { basculerSerieFaite(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'basculer-note-serie') { basculerNoteSerie(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'appliquer-suggestion-fourchette') { appliquerSuggestionFourchette(parseInt(cible.getAttribute('data-ex'), 10), parseFloat(cible.getAttribute('data-poids')), parseInt(cible.getAttribute('data-reps'), 10)); return; }
  if (action === 'mini-serie') { ajouterMiniSerie(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'retirer-mini-serie') { retirerMiniSerie(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'grappe-faite') { grappeFaite(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'grappe-moins') { grappeMoins(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'chrono-maintien') { basculerChronoMaintien(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'ajouter-lest') { ajouterLest(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'choisir-style-exercice') { ouvrirChoixStyleExercice(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'choisir-style-seance') { choisirStyleSeance(cible.getAttribute('data-champ'), cible.getAttribute('data-valeur')); return; }
  if (action === 'aide-style-seance') { ouvrirGuideTypes(id, 'style'); return; }
  if (action === 'retour-choix-style') { ouvrirChoixStyleExercice(exerciceStyleEnCours); return; }
  if (action === 'style-par-defaut') { definirStyleParDefaut(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'appliquer-suggestion') { appliquerSuggestionSerie(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10), parseFloat(cible.getAttribute('data-poids'))); return; }
  if (action === 'ajouter-pause') { ouvrirFormulairePause(); return; }
  if (action === 'enregistrer-pause') { enregistrerPause(); return; }
  if (action === 'supprimer-pause') { supprimerPause(id); return; }
  if (action === 'ajuster-serie') { ajusterSerieLive(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10), cible.getAttribute('data-champ'), parseFloat(cible.getAttribute('data-delta'))); return; }
  if (action === 'basculer-exercice') { basculerExercice(parseInt(cible.getAttribute('data-ex'), 10), cible.getAttribute('data-ouvert') === '1'); return; }

  if (action === 'lancer-cdr') { lancerCompteARebours(); return; }

  if (action === 'toggle-checklist') {
    var tache = cible.getAttribute('data-tache');
    basculerTacheChecklist(tache);
  }
  if (action === 'etirement-passer') { passerEtapeEtirementSuivante(); return; }
  if (action === 'etirement-quitter') { quitterSeanceEtirement(); return; }
  if (action === 'etirement-toggle-pause') { togglePauseChronoEtirement(); return; }
  if (action === 'ouvrir-etirement') { ouvrirSeanceEtirement(); return; }
});

document.body.addEventListener('change', function (evt) {
  var role = evt.target.getAttribute && evt.target.getAttribute('data-role');
  if (role === 'live-poids' || role === 'live-reps' || role === 'live-note' || role === 'live-distance') {
    var exIndex = parseInt(evt.target.getAttribute('data-ex'), 10);
    var serieIndex = parseInt(evt.target.getAttribute('data-serie'), 10);
    modifierValeurSerieLive(role, exIndex, serieIndex, evt.target.value);
  }
  if (role === 'live-mini') {
    modifierMiniSerie(parseInt(evt.target.getAttribute('data-ex'), 10), parseInt(evt.target.getAttribute('data-serie'), 10), parseInt(evt.target.getAttribute('data-mini'), 10), evt.target.value);
  }
  if (role === 'live-rer') {
    modifierRerExercice(parseInt(evt.target.getAttribute('data-ex'), 10), evt.target.value);
  }
  if (evt.target.id === 'champ-ex-groupe') { rafraichirDiagrammeMuscles(); }
  if (role === 'se-structure') { memoriserChampsSeanceEnCours(); rendreFormulaireSeance(); }
  if (evt.target.id === 'champ-import-fichier') { chargerFichierImport(); }
  if (role === 'hist-poids' || role === 'hist-reps') {
    modifierValeurSerieHistorique(
      role,
      evt.target.getAttribute('data-entree'),
      parseInt(evt.target.getAttribute('data-ex'), 10),
      parseInt(evt.target.getAttribute('data-serie'), 10),
      evt.target.value
    );
  }
}, false);

document.body.addEventListener('input', function (evt) {
  if (evt.target.id === 'champ-recherche-exercices') {
    texteRechercheExercices = evt.target.value;
    rendreExercices();
  }
  var roleRessenti = evt.target.getAttribute && evt.target.getAttribute('data-role');
  if (roleRessenti === 'ressenti-sommeil') {
    modifierRessenti('sommeil', evt.target.value);
    document.getElementById('ligne-ressenti-sommeil').style.color = couleurSommeil(evt.target.value);
  }
  if (roleRessenti === 'ressenti-fatigue') { modifierRessenti('fatigue', evt.target.value); }
  if (roleRessenti === 'ressenti-stress') { modifierRessenti('stress', evt.target.value); }
  if (roleRessenti === 'ressenti-humeur') { modifierRessenti('humeur', evt.target.value); }
}, false);

document.body.addEventListener('change', function (evt) {
  var roleRessenti = evt.target.getAttribute && evt.target.getAttribute('data-role');
  if (roleRessenti === 'ressenti-colere') { modifierRessentiBooleen('colere', evt.target.checked); }
  if (roleRessenti === 'ressenti-blessure') { modifierRessentiBooleen('blessure', evt.target.checked); }
  if (roleRessenti === 'ressenti-maladie') { modifierRessentiBooleen('maladie', evt.target.checked); }
}, false);

document.body.addEventListener('input', function (evt) {
  var role = evt.target.getAttribute && evt.target.getAttribute('data-role');
  if (!role) { return; }
  if (role === 'macro-aliment') { majHintKcalAliment(); }
  if (role === 'plat-nom') { platEnConstruction.nom = evt.target.value; }
  if (role === 'plat-portions') { platEnConstruction.portions = lireNombre(evt.target.value); majApercuPlat(); }
  if (role === 'plat-qte') {
    var ligne = ingredientsPlatEnCours[parseInt(evt.target.getAttribute('data-index'), 10)];
    if (ligne) { ligne.quantiteGrammes = lireNombre(evt.target.value); majApercuPlat(); }
  }
  if (role === 'journal-valeur') {
    var v = lireNombre(evt.target.value);
    if (journalEnConstruction.type === 'plat') { journalEnConstruction.portions = v; } else { journalEnConstruction.quantite = v; }
    rafraichirChipsJournal();
    majApercuJournal();
  }
  if (role === 'edition-valeur') { majApercuEdition(); }
}, false);

document.getElementById('modal-overlay').addEventListener('click', function (evt) {
  if (evt.target.id === 'modal-overlay') { fermerModal(); }
}, false);


/* BLOC 18 : INITIALISATION */

function mettreAJourDateEntete() {
  var zoneDateEntete = document.getElementById('entete-date');
  if (zoneDateEntete) {
    zoneDateEntete.innerHTML = formaterDateLisible(formaterDateISO(new Date()));
  }
}

appliquerTheme();
mettreAJourDateEntete();
creerFondParallaxe();
allerVersPage('accueil');

if (syncEstConfiguree()) {
  mettreAJourIndicateurSync('cours');
  tirerDepuisGist(function (succes) {
    mettreAJourIndicateurSync(succes ? 'ok' : 'erreur');
  });
}

setInterval(function () {
  verifierResetQuotidien();
  rendreChecklistQuotidienne();
  mettreAJourDateEntete();
  rendrePrete();
}, 60000);

/* La barre d'onglets de l'historique suit le header quand il sort de l'écran */
(function () {
  var entete = document.querySelector('.entete');
  var attente = false;
  var minTop = null;

  function mesurerMin() {
    var sonde = document.createElement('div');
    sonde.style.cssText = 'position:absolute;visibility:hidden;height:0;padding-top:env(safe-area-inset-top);';
    document.body.appendChild(sonde);
    minTop = sonde.offsetHeight + 8;
    document.body.removeChild(sonde);
  }

  function maj() {
    attente = false;
    var barre = document.querySelector('#page-historique > .sous-onglets');
    if (!entete || !barre) { return; }
    if (minTop === null) { mesurerMin(); }
    var bas = entete.getBoundingClientRect().bottom;
    barre.style.top = Math.max(bas, minTop) + 'px';
  }

  function planifier() {
    if (attente) { return; }
    attente = true;
    (window.requestAnimationFrame || function (f) { return window.setTimeout(f, 16); })(maj);
  }

  window.addEventListener('scroll', planifier, false);
  window.addEventListener('resize', planifier, false);
  window.addEventListener('load', planifier, false);
  planifier();
})();

/* BLOC 19 : NOTIFICATIONS */

document.addEventListener('change', function (e) {
  if (e.target.getAttribute('data-action') === 'changer-heure-rappel') {
    changerHeureRappel(parseInt(e.target.getAttribute('data-index'), 10), e.target.value);
  }
});


