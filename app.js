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

(function () {
'use strict';
window.formaterDateISO = formaterDateISO;
window.completerZero = completerZero;
window.echapperHtml = echapperHtml;
window.allerVersPage = allerVersPage;

var EMOJIS_HUMEUR = ['😭', '😢', '😟', '😕', '😐', '🙂', '😊', '😁', '🤩'];
var EMOJIS_FATIGUE = ['😴', '😪', '🫩', '🥱', '🤭', '😌', '🤗', '😀', '🤪'];
var EMOJIS_STRESS = ['😤', '😖', '😬', '😰', '😥', '😗', '☺️', '😋', '🥰'];
var COULEURS_NIVEAU = ['#000000', '#7a0000', '#e30000', '#ff8c00', '#ffd700', '#c6e600', '#4caf50', '#00e676', '#1de9b6'];


/* ============================================================
   BLOC SEANCE ETIREMENT — LOGIQUE
   ============================================================ */

var SEANCE_ETIREMENT_MATIN = {
  id: 'reveil-articulaire-matin',
  titre: 'Réveil Articulaire & Mobilité Dynamique',
  dureeEstimeeMin: 7,
  etapes: [
    {
      id: 'cervical-epaules',
      titre: 'Déverrouillage Cervical & Épaules',
      dureeSec: 90,
      position: 'Debout',
      consignes: [
        'Rotations de nuque : 5 demi-cercles lents d\'une épaule à l\'autre (passer par le bas, ne pas projeter la tête en arrière)',
        'Grands cercles d\'épaules : 10 cercles vers l\'arrière, puis 10 vers l\'avant',
        'Rotations des poignets : 15 secondes dans chaque sens'
      ]
    },
    {
      id: 'chat-chameau',
      titre: 'Le Chat-Chameau / Cat-Cow',
      dureeSec: 90,
      position: 'Au sol à 4 pattes',
      consignes: [
        'Mains sous les épaules, genoux sous les hanches',
        'Inspiration : laisse le ventre descendre doucement, regarde vers l\'avant',
        'Expiration : arrondis le dos vers le plafond, rentre le nombril, relâche la tête',
        '10 à 12 aller-retours très lents'
      ]
    },
    {
      id: 'torsions-thoraciques',
      titre: 'Torsions Thoraciques en Quadrupédie',
      dureeSec: 90,
      position: 'Au sol',
      consignes: [
        'À quatre pattes, main droite derrière la tête',
        'Amène le coude droit vers le poignet gauche, puis pivote le buste vers la droite, coude vers le plafond, bassin fixe',
        '8 répétitions à droite, puis 8 à gauche'
      ]
    },
    {
      id: 'psoas-dynamique',
      titre: 'Déverrouillage des Hanches / Psoas Dynamique',
      dureeSec: 90,
      position: 'Au sol',
      consignes: [
        'Position de fente, un genou au sol sur un tapis moelleux',
        'Serre le fessier arrière pour basculer le bassin en rétroversion',
        'Avance doucement le bassin de 3 à 5 cm jusqu\'à légère tension sur l\'avant de cuisse/hanche, tiens 2 secondes',
        '6 à 8 petites impulsions douces par côté, jamais d\'étirement fixe prolongé'
      ]
    },
    {
      id: 'squat-lent',
      titre: 'Squat à Vide Très Lent',
      dureeSec: 60,
      position: 'Debout',
      consignes: [
        'Pieds largeur d\'épaules, talons bien à plat',
        'Descends en 3 secondes, pause 1 seconde en bas, remonte',
        '5 répétitions uniquement'
      ]
    }
  ]
};

var etatSeanceEtirement = {
  enCours: false,
  indexEtape: 0,
  chronoRestantSec: 0,
  dureeTotaleSec: 0,
  minuteurId: null,
  enPause: false,
  timestampFin: null
};

function ouvrirSeanceEtirement() {
  etatSeanceEtirement.enCours = true;
  etatSeanceEtirement.indexEtape = 0;
  allerVersPage('etirement');
  demarrerEtapeEtirement();
}

function demarrerEtapeEtirement() {
  var etape = SEANCE_ETIREMENT_MATIN.etapes[etatSeanceEtirement.indexEtape];
  etatSeanceEtirement.chronoRestantSec = etape.dureeSec;
  etatSeanceEtirement.dureeTotaleSec = etape.dureeSec;
  etatSeanceEtirement.enPause = false;
  rendreEtapeEtirement();
  lancerMinuteurEtirement();
}

function lancerMinuteurEtirement() {
  if (etatSeanceEtirement.minuteurId) { clearInterval(etatSeanceEtirement.minuteurId); }

  etatSeanceEtirement.timestampFin = Date.now() + (etatSeanceEtirement.chronoRestantSec * 1000);

  etatSeanceEtirement.minuteurId = setInterval(function () {
    var msRestantes = etatSeanceEtirement.timestampFin - Date.now();
    etatSeanceEtirement.chronoRestantSec = Math.max(0, Math.round(msRestantes / 1000));
    rendreChronoEtirement();

    if (msRestantes <= 0) {
      passerEtapeEtirementSuivante();
    }
  }, 250);
}

function togglePauseChronoEtirement() {
  if (etatSeanceEtirement.enPause) {
    // reprise
    etatSeanceEtirement.enPause = false;
    lancerMinuteurEtirement();
  } else {
    // pause
    etatSeanceEtirement.enPause = true;
    clearInterval(etatSeanceEtirement.minuteurId);
    etatSeanceEtirement.minuteurId = null;
  }
  rendreChronoEtirement();
}

function passerEtapeEtirementSuivante() {
  clearInterval(etatSeanceEtirement.minuteurId);
  etatSeanceEtirement.minuteurId = null;
  etatSeanceEtirement.enPause = false;
  etatSeanceEtirement.indexEtape++;

  if (etatSeanceEtirement.indexEtape >= SEANCE_ETIREMENT_MATIN.etapes.length) {
    terminerSeanceEtirement();
    return;
  }
  demarrerEtapeEtirement();
}

function terminerSeanceEtirement() {
  etatSeanceEtirement.enCours = false;

  var dateReference = obtenirDateJourReference();
  var checklist = checklistDuJour(dateReference);
  checklist.etirements = true;
  sauvegarderEtat();

  afficherToast(messageTheme('etirementsTermines', 'Séance d\'étirements terminée !'));
  allerVersPage('accueil');
  rendreChecklistQuotidienne();

  if (checklistEstComplete(dateReference)) {
    fermerCarteChecklistAvecAnimation();
  }
}

function rendreEtapeEtirement() {
  var conteneur = document.getElementById('page-etirement');
  if (!conteneur) { return; }
  var etape = SEANCE_ETIREMENT_MATIN.etapes[etatSeanceEtirement.indexEtape];
  var numero = etatSeanceEtirement.indexEtape + 1;
  var total = SEANCE_ETIREMENT_MATIN.etapes.length;

  var html = '';
  html += '<div class="etirement-conteneur">';
  html += '<div class="etirement-entete"><span class="etirement-progression">Étape ' + numero + ' / ' + total + '</span></div>';
  html += '<h2 class="etirement-titre-etape">' + etape.titre + '</h2>';
  html += '<p class="etirement-position">' + etape.position + '</p>';

  html += '<div class="etirement-chrono-zone">';
  html += '<span id="etirement-chrono" class="etirement-chrono" data-action="etirement-toggle-pause">' + etape.dureeSec + '</span>';
  html += '</div>';

  html += '<div class="etirement-barre-progression"><div id="etirement-barre-remplissage" class="etirement-barre-remplissage" style="width:100%;"></div></div>';

  html += '<details class="etirement-explications">';
  html += '<summary>Explications</summary>';
  html += '<div class="etirement-explications-contenu"><ul>';
  for (var i = 0; i < etape.consignes.length; i++) {
    html += '<li>' + etape.consignes[i] + '</li>';
  }
  html += '</ul></div>';
  html += '</details>';

  html += '</div>'; // fin .etirement-conteneur

  html += '<div class="etirement-actions">';
  html += '<button class="etirement-bouton-quitter" data-action="etirement-quitter">Quitter</button>';
  html += '<button class="etirement-bouton-passer" data-action="etirement-passer">Passer l\'étape</button>';
  html += '</div>';

  conteneur.innerHTML = html;
}

function rendreChronoEtirement() {
  var chrono = document.getElementById('etirement-chrono');
  if (chrono) {
    chrono.textContent = etatSeanceEtirement.chronoRestantSec;
    chrono.classList.toggle('etirement-chrono-pause', etatSeanceEtirement.enPause);
  }

  var barre = document.getElementById('etirement-barre-remplissage');
  if (barre) {
    var pourcentage = (etatSeanceEtirement.chronoRestantSec / etatSeanceEtirement.dureeTotaleSec) * 100;
    barre.style.width = pourcentage + '%';
    barre.classList.toggle('pause-active', etatSeanceEtirement.enPause);
  }
}

function quitterSeanceEtirement() {
  clearInterval(etatSeanceEtirement.minuteurId);
  etatSeanceEtirement.minuteurId = null;
  etatSeanceEtirement.enCours = false;
  etatSeanceEtirement.enPause = false;
  allerVersPage('accueil');
}
/* ============================================================
   BLOC CHECKLIST QUOTIDIENNE
   ============================================================ */

function heureLimiteResetAtteinte(date) {
  return date.getHours() >= 5;
}

function obtenirDateJourReference() {
  var maintenant = new Date();
  if (!heureLimiteResetAtteinte(maintenant)) {
    maintenant.setDate(maintenant.getDate() - 1);
  }
  return formaterDateISO(maintenant);
}

function checklistDuJour(dateISO) {
  etat.checklistParDate = etat.checklistParDate || {};
  if (!etat.checklistParDate[dateISO]) {
    etat.checklistParDate[dateISO] = { eau: false, etirements: false, pesee: false };
  }
  return etat.checklistParDate[dateISO];
}

function checklistEstComplete(dateISO) {
  etat.checklistParDate = etat.checklistParDate || {};
  var c = etat.checklistParDate[dateISO];
  if (!c) { return false; }
  return c.eau && c.etirements && c.pesee;
}

function verifierResetQuotidien() {
  // Ne fait plus rien de destructeur : chaque date a sa propre entrée.
  // On s'assure juste que l'entrée du jour courant existe.
  var dateReference = obtenirDateJourReference();
  checklistDuJour(dateReference);
}

function obtenirIconeChecklist(tache) {
  if (tache === 'eau') { return '💧'; }
  if (tache === 'etirements') { return '🤸'; }
  if (tache === 'pesee') { return '⚖️'; }
  return '';
}

function rendreChecklistQuotidienne() {
  var carte = document.getElementById('carte-checklist-quotidienne');
  if (!carte) { return; }

  verifierResetQuotidien();
  var dateReference = obtenirDateJourReference();
  var checklist = checklistDuJour(dateReference);

  if (checklistEstComplete(dateReference)) {
    carte.style.display = 'none';
    return;
  }

  carte.style.display = '';
  carte.classList.remove('carte-checklist-disparition');

  var boutons = carte.querySelectorAll('.todo-bouton');
  var nbFaites = 0;
  boutons.forEach(function (bouton) {
    var tache = bouton.getAttribute('data-tache');
    if (checklist[tache]) {
      bouton.classList.add('todo-fait');
      nbFaites++;
    } else {
      bouton.classList.remove('todo-fait');
    }
  });

  var remplie = document.getElementById('todo-progression-remplie');
  if (remplie) { remplie.style.width = Math.round((nbFaites / 3) * 100) + '%'; }
}

function fermerCarteChecklistAvecAnimation() {
  var carte = document.getElementById('carte-checklist-quotidienne');
  if (!carte) { return; }
  carte.classList.add('carte-checklist-disparition');
  setTimeout(function () { carte.style.display = 'none'; }, 350);
}

function basculerTacheChecklist(tache) {
  var dateReference = obtenirDateJourReference();
  var checklist = checklistDuJour(dateReference);
  var dejaFaite = checklist[tache];

  if (!dejaFaite) {
    if (tache === 'etirements') {
      ouvrirSeanceEtirement();
      return; // la validation se fait à la fin de la séance
    }
    if (tache === 'pesee') {
      ouvrirPopupPoids();
      return;
    }
  }

  checklist[tache] = !dejaFaite;
  sauvegarderEtat();
  rendreChecklistQuotidienne();

  if (checklistEstComplete(dateReference)) {
    fermerCarteChecklistAvecAnimation();
  }
}

function ouvrirPopupPoids() {
  var dates = Object.keys(etat.poidsCorporelHistorique).sort();
  var dernierPoids = dates.length ? etat.poidsCorporelHistorique[dates[dates.length - 1]] : '';

  var html = '';
  html += '<div class="modal-entete"><h2>Me peser</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><label>Poids du jour (kg)</label><input type="number" step="0.1" inputmode="decimal" id="champ-poids-jour" value="' + dernierPoids + '"></div>';
  html += '<button class="btn btn-plein btn-bloc" style="margin-top:10px;" data-action="valider-poids-jour">Valider</button>';

  ouvrirModal(html);
}

function validerPoidsJour() {
  var champ = document.getElementById('champ-poids-jour');
  if (!champ) { return; }

  var valeur = parseFloat(champ.value.replace(',', '.'));
  if (isNaN(valeur) || valeur <= 0) {
    afficherToast('Poids invalide');
    return;
  }

  var dateReference = obtenirDateJourReference();
  etat.poidsCorporelHistorique[dateReference] = valeur;

  // Synchronise le poids "courant" utilisé dans Réglages et les calculs
  etat.profil.poidsCorporel = valeur;

  var checklist = checklistDuJour(dateReference);
  checklist.pesee = true;
  sauvegarderEtat();

  fermerModal();
  afficherToast(messageTheme('poidsEnregistre', 'Poids enregistré'));
  rendreChecklistQuotidienne();

  if (typeof rendreGraphiquePoidsCorporel === 'function') {
    rendreGraphiquePoidsCorporel();
  }

  if (checklistEstComplete(dateReference)) {
    fermerCarteChecklistAvecAnimation();
  }
}

function echapperHtml(texte) {
  if (texte === null || texte === undefined) { return ''; }
  var div = document.createElement('div');
  div.textContent = String(texte);
  return div.innerHTML;
}

function trouverParId(liste, id) {
  for (var i = 0; i < liste.length; i++) {
    if (liste[i].id === id) { return liste[i]; }
  }
  return null;
}

function retirerParId(liste, id) {
  var resultat = [];
  for (var i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) { resultat.push(liste[i]); }
  }
  return resultat;
}

function trouverAncetreAction(element) {
  var courant = element;
  while (courant && courant !== document.body) {
    if (courant.getAttribute && courant.getAttribute('data-action')) {
      return courant;
    }
    courant = courant.parentNode;
  }
  return null;
}

function ajouterEcouteurClicDelegue(conteneur, gestionnaire) {
  conteneur.addEventListener('click', function (evt) {
    var cible = trouverAncetreAction(evt.target);
    if (!cible) { return; }
    try {
      gestionnaire(cible, evt);
    } catch (erreur) {
      afficherToast('Une action a échoué (' + (cible.getAttribute('data-action') || '?') + ') : ' + erreur.message);
    }
  }, false);
}

/* ============================================================
   BLOC 4 : ETAT & PERSISTANCE (localStorage)
   ============================================================ */

var CLE_STOCKAGE = 'carnetMusculationDonnees_v1';

function etatParDefaut() {
  return {
    profil: {
      poidsCorporel: 75, objectifProteines: 150, objectifGlucides: 250, objectifLipides: 70,
      latitudeGym: 44.558, longitudeGym: 4.750, seuilTempMax: null, seuilTempMin: null,
      theme: 'sombre', sonnerieMinuteur: 'classique'
    },
    exercices: [],
    seances: [],
    programmes: [],
    agenda: [],
    seanceActive: null,
    derniereMiseAJour: 0,
    programmeActif: null,
    historiqueProgrammes: [],
    ressentiQuotidien: {},
    aliments: [],
    plats: [],
    journalAlimentaire: {},
    piscine: {},
    poidsCorporelHistorique: {},
    checklistQuotidienne: { date: '', eau: false, etirements: false, pesee: false }
  };
}

function completerChampsEtat(donnees) {
  if (!donnees.profil) { donnees.profil = {}; }
  if (!donnees.profil.poidsCorporel) { donnees.profil.poidsCorporel = 75; }
  if (!donnees.profil.objectifProteines) { donnees.profil.objectifProteines = 150; }
  if (!donnees.profil.objectifGlucides) { donnees.profil.objectifGlucides = 250; }
  if (!donnees.profil.objectifLipides) { donnees.profil.objectifLipides = 70; }
  if (!donnees.profil.age) { donnees.profil.age = 30; }
  if (!donnees.profil.sexe) { donnees.profil.sexe = 'homme'; }
  if (donnees.profil.latitudeGym === undefined) { donnees.profil.latitudeGym = 44.558; }
  if (donnees.profil.longitudeGym === undefined) { donnees.profil.longitudeGym = 4.750; }
  if (donnees.profil.seuilTempMax === undefined) { donnees.profil.seuilTempMax = null; }
  if (donnees.profil.seuilTempMin === undefined) { donnees.profil.seuilTempMin = null; }
  if (donnees.profil.theme === undefined) { donnees.profil.theme = 'sombre'; }
  if (donnees.profil.sonnerieMinuteur === undefined) { donnees.profil.sonnerieMinuteur = 'classique'; }
  if (!donnees.exercices) { donnees.exercices = []; }
  if (!donnees.seances) { donnees.seances = []; }
  if (!donnees.programmes) { donnees.programmes = []; }
  if (!donnees.agenda) { donnees.agenda = []; }
  if (donnees.seanceActive === undefined) { donnees.seanceActive = null; }
  if (!donnees.derniereMiseAJour) { donnees.derniereMiseAJour = 0; }
  if (donnees.programmeActif === undefined) { donnees.programmeActif = null; }
  if (!donnees.historiqueProgrammes) { donnees.historiqueProgrammes = []; }
  if (!donnees.ressentiQuotidien) { donnees.ressentiQuotidien = {}; }
  if (!donnees.aliments) { donnees.aliments = []; }
  if (!donnees.journalAlimentaire) { donnees.journalAlimentaire = {}; }
  if (!donnees.piscine) { donnees.piscine = {}; }
  if (!donnees.poidsCorporelHistorique) { donnees.poidsCorporelHistorique = {}; }
  if (!donnees.aliments) { donnees.aliments = []; }
  if (!donnees.plats) { donnees.plats = []; }
  if (!donnees.journalAlimentaire) { donnees.journalAlimentaire = {}; }
  if (!donnees.checklistQuotidienne) {
    donnees.checklistQuotidienne = { date: '', eau: false, etirements: false, pesee: false };
  }
  if (!donnees.ressentiQuotidien) { donnees.ressentiQuotidien = {}; }
  for (var dateRessenti in donnees.ressentiQuotidien) {
    var entree = donnees.ressentiQuotidien[dateRessenti];

    if (entree.humeur === undefined) { entree.humeur = 4; }
    if (entree.colere === undefined) { entree.colere = false; }
    if (entree.blessure === undefined) { entree.blessure = false; }
    if (entree.maladie === undefined) { entree.maladie = false; }
    if (entree.insomnie === undefined) { entree.insomnie = false; }
  }
  if (donnees.checklistQuotidienne.date === undefined) { donnees.checklistQuotidienne.date = ''; }
  if (donnees.checklistQuotidienne.eau === undefined) { donnees.checklistQuotidienne.eau = false; }
  if (donnees.checklistQuotidienne.etirements === undefined) { donnees.checklistQuotidienne.etirements = false; }
  if (donnees.checklistQuotidienne.pesee === undefined) { donnees.checklistQuotidienne.pesee = false; }
  return donnees;
}

function chargerEtat() {
  var brut = null;
  try {
    brut = window.localStorage.getItem(CLE_STOCKAGE);
  } catch (erreur) {
    brut = null;
  }
  if (!brut) { return etatParDefaut(); }
  try {
    var donnees = JSON.parse(brut);
    return completerChampsEtat(donnees);
  } catch (erreur) {
    return etatParDefaut();
  }
}

var etat = chargerEtat();
var alerteStockageAffichee = false;

function sauvegarderEtat() {
  etat.derniereMiseAJour = Date.now();
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
  } catch (erreur) {
    if (!alerteStockageAffichee) {
      alerteStockageAffichee = true;
      afficherToast('Attention : la sauvegarde a échoué (stockage plein ou navigateur en mode privé).');
    }
  }
  programmerEnvoiDiffere();
}

/* ============================================================
   BLOC 5 : NAVIGATION ENTRE PAGES
   ============================================================ */

var pageCourante = 'accueil';

/* Sous-titres en direct des tuiles de l'accueil */
/* Sous-titres en direct des tuiles de l'accueil */
function rendreTuilesAccueil() {
  var aujourdHui = formaterDateISO(new Date());
  var el;

  /* Nutrition : protéines restantes pour atteindre l'objectif du jour, avec une petite jauge */
  el = document.getElementById('tuile-nutrition-sous');
  if (el) {
    var objP = etat.profil.objectifProteines || 0;
    var pris = calculerTotauxJour(aujourdHui).proteines;
    var reste = Math.max(0, Math.round(objP - pris));
    var pct = objP > 0 ? Math.min(100, Math.round(pris / objP * 100)) : 0;
    if (objP > 0 && reste === 0) {
      el.innerHTML = 'Objectif atteint' + '<span class="tuile-jauge"><i style="width:100%"></i></span>';
    } else {
      el.innerHTML = '<span class="tuile-val">' + reste + '</span> g restants' + '<span class="tuile-jauge"><i style="width:' + pct + '%"></i></span>';
    }
  }

  /* Bibliothèque : objectif du programme en cours */
  el = document.getElementById('tuile-biblio-sous');
  if (el) {
    var prog = obtenirProgrammeActif();
    var objectif = prog && prog.objectif ? prog.objectif.trim() : '';
    el.className = 'texte-att tuile-objectif';
    el.innerHTML = objectif ? echapperHtml(objectif) : 'Aucun objectif';
  }

  /* Historique : nombre de séances faites */
  el = document.getElementById('tuile-histo-sous');
  if (el) {
    var nb = etat.agenda.filter(function (a) { return a.statut === 'termine'; }).length;
    el.innerHTML = '<span class="tuile-val">' + nb + '</span> séance' + (nb > 1 ? 's' : '') + ' faite' + (nb > 1 ? 's' : '');
  }
}

function allerVersPage(nomPage) {
  var anciennePage = pageCourante;
  pageCourante = nomPage;
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) { pages[i].classList.remove('page-active'); }
  var cible = document.getElementById('page-' + nomPage);
  if (cible) { cible.classList.add('page-active'); }

  var onglets = document.querySelectorAll('.nav-onglet');
  for (var j = 0; j < onglets.length; j++) { onglets[j].classList.remove('nav-onglet-actif'); }
  var ongletCible = document.querySelector('.nav-onglet[data-page="' + nomPage + '"]');
  if (ongletCible) { ongletCible.classList.add('nav-onglet-actif'); }

  if (window.NavBas) { window.NavBas.maj(nomPage, anciennePage); }
  majFondParallaxe(nomPage);

  if (nomPage === 'accueil') {
    rendreBanniereObjectif();
    rendreBanniereMeteo();
    try { afficherBanniereRappels(verifierRappelsDus()); } catch (e) { console.error('Erreur rappels:', e); }
    rendreChecklistQuotidienne();
    rendreCarteSeanceJour();
    rendreTuilesAccueil();
  }
  if (nomPage === 'seance') { rendreSeance(); }
  if (nomPage === 'nutrition') { rendreNutrition(); }
  if (nomPage === 'bibliotheque') { rendreExercices(); rendreSeancesBib(); rendreProgrammesBib(); rendreAliments(); rendrePlats(); }
  if (nomPage === 'historique') {
    rendreProgrammeActif();
    rendreCalendrier(); rendreJourSelectionne(); rendreAVenir();
    rendreGraphiquePoidsCorporel();
    rendreSelectProgression(); rendreGraphiqueProgression(); rendreGraphiqueVolume(); rendreGraphiqueCalories();
    rendreGraphiquesNutrition();
    rendreEquilibre();
    rendreSuggestions();
  }
}

function afficherBanniereRappels(rappelsDus) {
  var zone = document.getElementById('zone-banniere-rappels');
  if (!zone) { return; }
  if (!rappelsDus || rappelsDus.length === 0) { zone.innerHTML = ''; return; }

  var html = '<div class="carte-checklist">';
  html += '<div class="checklist-entete"><span class="titre-affichage">À noter aujourd\'hui</span></div>';
  rappelsDus.forEach(function (rappel) {
    var estRessenti = (rappel.id === 'sommeil' || rappel.id === 'fatigue' || rappel.id === 'stress');
    html += '<div class="checklist-ligne"' + (estRessenti ? ' data-action="aller-vers-ressenti" style="cursor:pointer;"' : '') + '>';
    html += '<button class="bulle-validation checklist-bouton" data-action="marquer-rappel-fait" data-rappel-id="' + rappel.id + '" title="Marquer comme fait">✓</button>';
    html += '<span class="checklist-texte">' + echapperHtml(rappel.label) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  zone.innerHTML = html;
}

function allerVersRessentiJour() {
  allerVersPage('seance');
  // Si tu as un onglet/section dédiée dans la page séance, remplace 'ressenti' par le bon sélecteur.
  var section = document.getElementById('seance-zone-inactive');
  if (section) { section.scrollIntoView({ behavior: 'smooth' }); }
  // Focus optionnel sur le premier champ
  var champ = document.getElementById('champ-ressenti-sommeil');
  if (champ) { champ.focus(); }
}

/* ============================================================
   BLOC : ECHAUFFEMENT
   ============================================================ */

var DONNEES_ECHAUFFEMENT = {
  hautDuCorps: {
    titre: 'Haut du corps',
    icone: '💪',
    exercices: [
      { nom: 'Jumping Jacks', duree: '45 s' },
      { nom: 'Shadow Boxing', duree: '45 s' },
      { nom: 'Tirage élastique', duree: '30 s' },
      { nom: 'Rotations d\'épaules', duree: '30 s' }
    ]
  },
  basDuCorps: {
    titre: 'Bas du corps',
    icone: '🦵',
    exercices: [
      { nom: 'Jumping Jacks', duree: '45 s' },
      { nom: 'Air Squats', duree: '45 s' },
      { nom: 'Fentes marchées', duree: '45 s' },
      { nom: 'Talons-fesses', duree: '30 s' }
    ]
  }
};

var callbackApresEchauffement = null;

/* Étape 1 : choix du type (volontairement sans détail des exercices) */
function demanderEchauffement(callbackSuite) {
  callbackApresEchauffement = callbackSuite;

  var html = '';
  html += '<div class="echauf-entete">';
  html += '<div><h2 class="echauf-titre">Échauffement</h2>';
  html += '<p class="echauf-sous-titre">3 à 4 min pour monter en température</p></div>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button>';
  html += '</div>';

  html += '<div class="echauf-choix">';
  ['hautDuCorps', 'basDuCorps'].forEach(function (type) {
    var d = DONNEES_ECHAUFFEMENT[type];
    html += '<button class="echauf-carte" data-action="choisir-echauffement" data-type="' + type + '">';
    html += '<span class="echauf-carte-icone">' + d.icone + '</span>';
    html += '<span class="echauf-carte-titre">' + echapperHtml(d.titre) + '</span>';
    html += '</button>';
  });
  html += '</div>';

  html += '<button class="echauf-passer" data-action="passer-echauffement">Passer l\'échauffement</button>';
  ouvrirModal(html);
}

/* Étape 2 : liste à cocher, tap sur une ligne pour valider */
function choisirEchauffement(type) {
  var data = DONNEES_ECHAUFFEMENT[type];
  if (!data) { return; }

  var html = '';
  html += '<div class="echauf-entete">';
  html += '<button class="echauf-retour" data-action="echauffement-retour">&#8249;</button>';
  html += '<h2 class="echauf-titre echauf-titre-centre">' + echapperHtml(data.titre) + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button>';
  html += '</div>';

  html += '<div class="echauf-compteur donnee-num"><span class="echauf-flamme" id="echauf-flamme">&#128293;</span> <span id="echauf-compteur">0 / ' + data.exercices.length + '</span></div>';
  html += '<div class="echauf-progression"><div class="echauf-barre" id="echauf-barre"></div></div>';

  html += '<ul class="echauf-liste">';
  data.exercices.forEach(function (ex) {
    html += '<li class="echauf-ligne">';
    html += '<span class="echauf-check">&#10003;</span>';
    html += '<span class="echauf-nom">' + echapperHtml(ex.nom) + '</span>';
    html += '<span class="echauf-duree donnee-num">' + echapperHtml(ex.duree) + '</span>';
    html += '</li>';
  });
  html += '</ul>';

  html += '<button class="btn btn-plein btn-bloc" data-action="terminer-echauffement">Démarrer la séance</button>';
  ouvrirModal(html);
  var lignes = document.querySelectorAll('.echauf-ligne');
  for (var i = 0; i < lignes.length; i++) {
    lignes[i].addEventListener('click', function () {
      basculerEtapeEchauffement(this);
    });
  }
}

function basculerEtapeEchauffement(ligne) {
  ligne.classList.toggle('echauf-ligne-faite');
  var total = document.querySelectorAll('.echauf-ligne').length;
  var faites = document.querySelectorAll('.echauf-ligne-faite').length;
  var compteur = document.getElementById('echauf-compteur');
  var barre = document.getElementById('echauf-barre');
  if (compteur) { compteur.innerHTML = faites + ' / ' + total; }
  if (barre) { barre.style.width = (total > 0 ? Math.round(faites / total * 100) : 0) + '%'; }
  var flamme = document.getElementById('echauf-flamme');
  if (flamme) {
    var pct = total > 0 ? (faites / total) : 0;
    var filtre = 'grayscale(' + Math.round((1 - pct) * 100) + '%) opacity(' + (0.35 + 0.65 * pct).toFixed(2) + ')';
    flamme.style.webkitFilter = filtre;
    flamme.style.filter = filtre;
    flamme.style.webkitTransform = 'scale(' + (1 + 0.3 * pct).toFixed(2) + ')';
    flamme.style.transform = 'scale(' + (1 + 0.3 * pct).toFixed(2) + ')';
  }
}

function passerEchauffement() {
  fermerModal();
  var cb = callbackApresEchauffement;
  callbackApresEchauffement = null;
  if (cb) { cb(); }
}

function terminerEchauffement() {
  fermerModal();
  var cb = callbackApresEchauffement;
  callbackApresEchauffement = null;
  if (cb) { cb(); }
}

/* ============================================================
   BLOC 7 : GROUPES MUSCULAIRES & CONSTANTES
   ============================================================ */

var GROUPES_MUSCULAIRES = ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Abdominaux', 'Cardio', 'Autre'];

var CATEGORIES_ALIMENTS = [
  'Protéines végétales',
  'Céréales et féculents',
  'Fruits',
  'Légumes',
  'Matières grasses',
  'Produits laitiers végétaux',
  'Autre'
];




/* Structures de séries : comment poids/reps évoluent série après série sur UN exercice */
/* Types de mésocycle pour la périodisation des programmes */
var TYPES_MESOCYCLE = [
  { valeur: 'hypertrophie', libelle: 'Hypertrophie' },
  { valeur: 'force', libelle: 'Force' },
  { valeur: 'decharge', libelle: 'Décharge (deload)' },
  { valeur: 'personnalise', libelle: 'Personnalisé' }
];

var STRUCTURES_SERIES = [
  { valeur: 'lineaire', libelle: 'Linéaire (classique)' },
  { valeur: 'pyramide_montante', libelle: 'Pyramide montante' },
  { valeur: 'pyramide_descendante', libelle: 'Pyramide descendante' },
  { valeur: 'echelle', libelle: 'Échelle' },
  { valeur: 'cluster', libelle: 'Cluster' }
];

/* Techniques d'intensification : appliquées en pratique sur la DERNIERE serie de l'exercice */
var TECHNIQUES_INTENSIFICATION = [
  { valeur: 'aucune', libelle: 'Aucune' },
  { valeur: 'drop_set', libelle: 'Série dégressive (drop set)' },
  { valeur: 'rest_pause', libelle: 'Rest-pause' },
  { valeur: 'myo_reps', libelle: 'Myo-reps' },
  { valeur: 'partielles', libelle: 'Répétitions partielles' },
  { valeur: 'forcees', libelle: 'Répétitions forcées' },
  { valeur: 'negatives', libelle: 'Répétitions négatives' }
];

function libelleDepuisValeur(liste, valeur) {
  for (var i = 0; i < liste.length; i++) {
    if (liste[i].valeur === valeur) { return liste[i].libelle; }
  }
  return valeur;
}

function optionsListeValeurLibelle(liste, valeurSelectionnee) {
  var html = '';
  for (var i = 0; i < liste.length; i++) {
    var selectionne = (liste[i].valeur === valeurSelectionnee) ? ' selected' : '';
    html += '<option value="' + liste[i].valeur + '"' + selectionne + '>' + echapperHtml(liste[i].libelle) + '</option>';
  }
  return html;
}

/* Arrondit au 1,25 kg le plus proche (plus petit incrément de disque courant) */
function arrondirPoids(valeur) {
  return Math.round(valeur / 1.25) * 1.25;
}

/* Génère les séries (poids/reps) d'un exercice de séance active selon la structure choisie.
   Le poids/reps de base représentent la série de référence (la plus lourde pour les pyramides). */
function genererSeriesSelonStructure(structure, poidsBase, repsBase, nbSeries) {
  var series = [];
  var i;
  if (!nbSeries || nbSeries < 1) { nbSeries = 1; }

  if (structure === 'pyramide_montante' || structure === 'pyramide_descendante') {
    for (i = 0; i < nbSeries; i++) {
      var fraction;
      if (nbSeries === 1) {
        fraction = 1;
      } else if (structure === 'pyramide_montante') {
        fraction = 0.6 + 0.4 * (i / (nbSeries - 1));
      } else {
        fraction = 1 - 0.4 * (i / (nbSeries - 1));
      }
      var poidsSerie = arrondirPoids(poidsBase * fraction);
      var repsSupplementaires = Math.round((1 - fraction) * 8);
      var repsSerie = Math.max(1, repsBase + repsSupplementaires);
      series.push({ poids: poidsSerie, reps: repsSerie, fait: false, note: '' });
    }
    return series;
  }

  if (structure === 'echelle') {
    for (i = 0; i < nbSeries; i++) {
      series.push({ poids: poidsBase, reps: i + 1, fait: false, note: '' });
    }
    return series;
  }

  /* lineaire, cluster (les mini-pauses internes du cluster ne changent pas poids/reps affichés) */
  for (i = 0; i < nbSeries; i++) {
    series.push({ poids: poidsBase, reps: repsBase, fait: false, note: '' });
  }
  return series;
}



function chargerExercicesDeBase() {
  var ajoutes = 0;
  var ignores = 0;
  for (var i = 0; i < EXERCICES_DE_BASE.length; i++) {
    var modele = EXERCICES_DE_BASE[i];
    var dejaPresent = false;
    for (var j = 0; j < etat.exercices.length; j++) {
      if (etat.exercices[j].nom.toLowerCase() === modele.nom.toLowerCase()) { dejaPresent = true; break; }
    }
    if (dejaPresent) { ignores++; continue; }
    etat.exercices.push({
      id: genererId(),
      nom: modele.nom,
      groupe: modele.groupe,
      poidsDefaut: modele.poidsDefaut,
      repsDefaut: modele.repsDefaut,
      seriesDefaut: modele.seriesDefaut,
      met: modele.met,
      variantes: modele.variantes || ''
    });
    ajoutes++;
  }
  sauvegarderEtat();
  rendreExercices();
  var message = ajoutes + ' exercice(s) ajouté(s).';
  if (ignores > 0) { message += ' ' + ignores + ' déjà présent(s) ignoré(s) (aucun doublon créé).'; }
  afficherToast(message);
}

function optionsGroupesMusculaires(valeurSelectionnee) {
  var html = '';
  for (var i = 0; i < GROUPES_MUSCULAIRES.length; i++) {
    var g = GROUPES_MUSCULAIRES[i];
    var selectionne = (g === valeurSelectionnee) ? ' selected' : '';
    html += '<option value="' + echapperHtml(g) + '"' + selectionne + '>' + echapperHtml(g) + '</option>';
  }
  return html;
}

/* Construit des <optgroup> par groupe musculaire à partir d'une liste d'objets {id, nom, groupe} */
function optionsExercicesGroupeesDepuisListe(liste, idSelectionne) {
  var html = '';
  for (var g = 0; g < GROUPES_MUSCULAIRES.length; g++) {
    var nomGroupe = GROUPES_MUSCULAIRES[g];
    var sousListe = liste.filter(function (ex) { return ex.groupe === nomGroupe; });
    if (sousListe.length === 0) { continue; }
    sousListe.sort(function (a, b) { return a.nom.localeCompare(b.nom); });
    html += '<optgroup label="' + echapperHtml(nomGroupe) + '">';
    for (var i = 0; i < sousListe.length; i++) {
      var selectionne = (idSelectionne && sousListe[i].id === idSelectionne) ? ' selected' : '';
      html += '<option value="' + sousListe[i].id + '"' + selectionne + '>' + echapperHtml(sousListe[i].nom) + '</option>';
    }
    html += '</optgroup>';
  }
  return html;
}

function optionsExercicesGroupees(idSelectionne) {
  return optionsExercicesGroupeesDepuisListe(etat.exercices, idSelectionne);
}

/* ============================================================
   BLOC 8 : EXERCICES (bibliothèque)
   ============================================================ */

/* Calcule, pour un exercice donné, le nombre de fois réalisé et le poids max atteint dans chaque mode (structure) */
function statistiquesExercice(exerciceId) {
  var statsParStructure = {};
  var nombreDeFois = 0;
  var sommeRpe = 0;
  var nombreRpe = 0;
  var entreesTerminees = etat.agenda.filter(function (a) { return a.statut === 'termine' && a.resultat; });
  for (var i = 0; i < entreesTerminees.length; i++) {
    var resultat = entreesTerminees[i].resultat;
    for (var j = 0; j < resultat.exercices.length; j++) {
      var ligneEx = resultat.exercices[j];
      if (ligneEx.exerciceId !== exerciceId) { continue; }
      nombreDeFois++;
      if (ligneEx.rpe !== undefined && ligneEx.rpe !== null) { sommeRpe += ligneEx.rpe; nombreRpe++; }
      var structure = ligneEx.structure || 'lineaire';
      var maxPoidsCetteSeance = null;
      for (var s = 0; s < ligneEx.series.length; s++) {
        if (ligneEx.series[s].echauffement) { continue; }
        if (maxPoidsCetteSeance === null || ligneEx.series[s].poids > maxPoidsCetteSeance) {
          maxPoidsCetteSeance = ligneEx.series[s].poids;
        }
      }
      if (maxPoidsCetteSeance !== null) {
        if (statsParStructure[structure] === undefined || maxPoidsCetteSeance > statsParStructure[structure]) {
          statsParStructure[structure] = maxPoidsCetteSeance;
        }
      }
    }
  }
  return {
    nombreDeFois: nombreDeFois,
    statsParStructure: statsParStructure,
    rpeMoyen: nombreRpe > 0 ? (sommeRpe / nombreRpe) : null
  };
}

/* Meilleur poids toutes structures confondues, pour repérer un nouveau record en direct */
function meilleurPoidsHistorique(exerciceId) {
  var stats = statistiquesExercice(exerciceId);
  var maxToutModes = null;
  for (var cle in stats.statsParStructure) {
    if (stats.statsParStructure.hasOwnProperty(cle)) {
      if (maxToutModes === null || stats.statsParStructure[cle] > maxToutModes) {
        maxToutModes = stats.statsParStructure[cle];
      }
    }
  }
  return maxToutModes;
}

/* La série la plus lourde jamais enregistrée pour cet exercice (poids ET reps correspondantes),
   toutes séances confondues, hors séries d'échauffement. Sert à préremplir automatiquement les
   champs poids/reps quand on démarre une séance, pour ne plus avoir à les ajuster à la main. */
function meilleureSerieHistorique(exerciceId) {
  var entreesTerminees = etat.agenda.filter(function (a) { return a.statut === 'termine' && a.resultat; });
  var meilleure = null;
  for (var i = 0; i < entreesTerminees.length; i++) {
    var resultat = entreesTerminees[i].resultat;
    for (var j = 0; j < resultat.exercices.length; j++) {
      var ligneEx = resultat.exercices[j];
      if (ligneEx.exerciceId !== exerciceId) { continue; }
      for (var s = 0; s < ligneEx.series.length; s++) {
        var serie = ligneEx.series[s];
        if (serie.echauffement) { continue; }
        if (meilleure === null || serie.poids > meilleure.poids ||
          (serie.poids === meilleure.poids && serie.reps > meilleure.reps)) {
          meilleure = { poids: serie.poids, reps: serie.reps };
        }
      }
    }
  }
  return meilleure;
}

/* Dernière séance terminée (avant aujourd'hui) où cet exercice apparaît */
function derniereOccurrenceExercice(exerciceId) {
  var entreesTerminees = etat.agenda.filter(function (a) { return a.statut === 'termine' && a.resultat; });
  entreesTerminees.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  for (var i = 0; i < entreesTerminees.length; i++) {
    var resultat = entreesTerminees[i].resultat;
    for (var j = 0; j < resultat.exercices.length; j++) {
      if (resultat.exercices[j].exerciceId === exerciceId) {
        return { date: entreesTerminees[i].date, ligneEx: resultat.exercices[j] };
      }
    }
  }
  return null;
}

function construireDiagrammeMuscles(groupe) {
  var actif = '#1FD9C4';
  var inactif = '#10141A';
  var bordure = '#2A313B';
  function c(estActif) { return estActif ? actif : inactif; }
  var pec = (groupe === 'Pectoraux'), abs = (groupe === 'Abdominaux'), dos = (groupe === 'Dos'),
    epaules = (groupe === 'Épaules'), bras = (groupe === 'Bras'), jambes = (groupe === 'Jambes');

  var svg = '<svg viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg">';
  svg += '<text x="50" y="12" font-size="9" fill="#8996A3" text-anchor="middle">FACE</text>';
  svg += '<circle cx="50" cy="30" r="14" fill="none" stroke="' + bordure + '" stroke-width="2"/>';
  svg += '<circle cx="30" cy="53" r="8" fill="' + c(epaules) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<circle cx="70" cy="53" r="8" fill="' + c(epaules) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="33" y="48" width="34" height="32" rx="8" fill="' + c(pec) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="36" y="80" width="28" height="28" rx="6" fill="' + c(abs) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="15" y="55" width="13" height="52" rx="6.5" fill="' + c(bras) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="72" y="55" width="13" height="52" rx="6.5" fill="' + c(bras) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="34" y="108" width="32" height="16" rx="5" fill="' + c(jambes) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="35" y="124" width="13" height="65" rx="6.5" fill="' + c(jambes) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="52" y="124" width="13" height="65" rx="6.5" fill="' + c(jambes) + '" stroke="' + bordure + '" stroke-width="1.5"/>';

  svg += '<text x="170" y="12" font-size="9" fill="#8996A3" text-anchor="middle">DOS</text>';
  svg += '<circle cx="170" cy="30" r="14" fill="none" stroke="' + bordure + '" stroke-width="2"/>';
  svg += '<circle cx="150" cy="53" r="8" fill="' + c(epaules) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<circle cx="190" cy="53" r="8" fill="' + c(epaules) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="153" y="48" width="34" height="60" rx="8" fill="' + c(dos) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="135" y="55" width="13" height="52" rx="6.5" fill="' + c(bras) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="192" y="55" width="13" height="52" rx="6.5" fill="' + c(bras) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="154" y="108" width="32" height="16" rx="5" fill="' + c(jambes) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="155" y="124" width="13" height="65" rx="6.5" fill="' + c(jambes) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '<rect x="172" y="124" width="13" height="65" rx="6.5" fill="' + c(jambes) + '" stroke="' + bordure + '" stroke-width="1.5"/>';
  svg += '</svg>';
  return '<div class="svg-conteneur">' + svg + '</div>';
}

function rafraichirDiagrammeMuscles() {
  var zone = document.getElementById('diagramme-muscles-zone');
  var select = document.getElementById('champ-ex-groupe');
  if (!zone || !select) { return; }
  zone.innerHTML = construireDiagrammeMuscles(select.value);
}

function ouvrirFormulaireExercice(idExercice) {
  var exercice = idExercice ? trouverParId(etat.exercices, idExercice) : null;
  var estModif = !!exercice;
  if (!exercice) {
    exercice = { id: null, nom: '', groupe: 'Autre', poidsDefaut: 20, repsDefaut: 10, seriesDefaut: 3, met: 5, variantes: '' };
  }
  var html = '';
  html += '<div class="modal-entete"><h2>' + (estModif ? 'Modifier l\'exercice' : 'Nouvel exercice') + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  if (estModif) {
    var stats = statistiquesExercice(exercice.id);
    html += '<div class="carte" style="margin-bottom:14px;">';
    html += '<h2 class="carte-titre">Historique</h2>';
    if (stats.nombreDeFois === 0) {
      html += '<div class="texte-att">Pas encore réalisé.</div>';
    } else {
      html += '<div class="texte-att" style="margin-bottom:8px;">Réalisé ' + stats.nombreDeFois + ' fois.</div>';
      for (var m = 0; m < STRUCTURES_SERIES.length; m++) {
        var valeurMode = STRUCTURES_SERIES[m].valeur;
        if (stats.statsParStructure[valeurMode] === undefined) { continue; }
        html += '<div class="ligne" style="padding:3px 0;"><span class="texte-att">' + echapperHtml(STRUCTURES_SERIES[m].libelle) + '</span><span class="donnee-num">' + stats.statsParStructure[valeurMode] + ' kg</span></div>';
      }
      if (stats.rpeMoyen !== null) {
        html += '<div class="ligne" style="padding:3px 0;"><span class="texte-att">RPE moyen ressenti</span><span class="donnee-num">' + stats.rpeMoyen.toFixed(1) + '/10</span></div>';
      }
    }
    html += '</div>';
  }
  html += '<div class="champ"><label>Nom</label><input type="text" id="champ-ex-nom" value="' + echapperHtml(exercice.nom) + '" placeholder="ex. Développé couché"></div>';
  html += '<div class="champ"><label>Groupe musculaire</label><select id="champ-ex-groupe">' + optionsGroupesMusculaires(exercice.groupe) + '</select></div>';
  html += '<div class="champ"><label>Poids par défaut (kg)</label><input type="number" step="0.5" id="champ-ex-poids" value="' + exercice.poidsDefaut + '"></div>';
  html += '<div class="champ"><label>Répétitions par défaut</label><input type="number" step="1" id="champ-ex-reps" value="' + exercice.repsDefaut + '"></div>';
  html += '<div class="champ"><label>Séries par défaut</label><input type="number" step="1" id="champ-ex-series" value="' + exercice.seriesDefaut + '"></div>';
  html += '<div class="champ"><label>Intensité (MET, sert au calcul des calories — 5 = musculation générale)</label><input type="number" step="0.5" id="champ-ex-met" value="' + exercice.met + '"></div>';
  html += '<div class="champ"><label>Variantes (prise, position...)</label><textarea id="champ-ex-variantes" placeholder="ex. Prise sumo : jambes écartées, accentue adducteurs et fessiers">' + echapperHtml(exercice.variantes || '') + '</textarea></div>';
  html += '<div class="champ"><label>Muscles ciblés</label><div id="diagramme-muscles-zone" class="diagramme-muscles-petit"></div></div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-exercice" data-id="' + (exercice.id || '') + '">Enregistrer</button>';
  if (estModif) {
    html += '<button class="btn btn-alerte btn-bloc" style="margin-top:8px;" data-action="supprimer-exercice" data-id="' + exercice.id + '">Supprimer cet exercice</button>';
  }
  ouvrirModal(html);
  rafraichirDiagrammeMuscles();
}

function enregistrerExercice(idExistant) {
  var nom = document.getElementById('champ-ex-nom').value.trim();
  if (!nom) { afficherToast('Le nom de l\'exercice est obligatoire.'); return; }
  var donnees = {
    nom: nom,
    groupe: document.getElementById('champ-ex-groupe').value,
    poidsDefaut: parseFloat(document.getElementById('champ-ex-poids').value) || 0,
    repsDefaut: parseInt(document.getElementById('champ-ex-reps').value, 10) || 0,
    seriesDefaut: parseInt(document.getElementById('champ-ex-series').value, 10) || 1,
    met: parseFloat(document.getElementById('champ-ex-met').value) || 5,
    variantes: document.getElementById('champ-ex-variantes').value
  };
  if (idExistant) {
    var exercice = trouverParId(etat.exercices, idExistant);
    exercice.nom = donnees.nom;
    exercice.groupe = donnees.groupe;
    exercice.poidsDefaut = donnees.poidsDefaut;
    exercice.repsDefaut = donnees.repsDefaut;
    exercice.seriesDefaut = donnees.seriesDefaut;
    exercice.met = donnees.met;
    exercice.variantes = donnees.variantes;
  } else {
    donnees.id = genererId();
    etat.exercices.push(donnees);
  }
  sauvegarderEtat();
  fermerModal();
  rendreExercices();
}

function supprimerExercice(id) {
  demanderConfirmation('Supprimer définitivement cet exercice ? Il sera aussi retiré des séances qui l\'utilisent.', function () {
    etat.exercices = retirerParId(etat.exercices, id);
    for (var i = 0; i < etat.seances.length; i++) {
      var nouveauxExercices = [];
      for (var j = 0; j < etat.seances[i].exercices.length; j++) {
        if (etat.seances[i].exercices[j].exerciceId !== id) { nouveauxExercices.push(etat.seances[i].exercices[j]); }
      }
      etat.seances[i].exercices = nouveauxExercices;
    }
    sauvegarderEtat();
    fermerModal();
    rendreExercices();
  }, function () {
    ouvrirFormulaireExercice(id);
  });
}

var groupesExercicesDeplies = {};
var texteRechercheExercices = '';

function basculerGroupeExercices(nomGroupe) {
  groupesExercicesDeplies[nomGroupe] = !groupesExercicesDeplies[nomGroupe];
  rendreExercices();
}

function normaliserTexteRecherche(texte) {
  if (!texte) { return ''; }
  return String(texte).toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n');
}

/* Un terme correspond si le nom OU le groupe musculaire de l'exercice le contient (recherche partielle, insensible a la casse et aux accents) */
function termeRechercheCorrespond(exercice, terme) {
  var t = normaliserTexteRecherche(terme);
  if (t === '') { return true; }
  var nom = normaliserTexteRecherche(exercice.nom);
  var groupe = normaliserTexteRecherche(exercice.groupe);
  return nom.indexOf(t) !== -1 || groupe.indexOf(t) !== -1;
}

/* Analyse une requete avec des connecteurs ET / OU : OU separe des blocs (au moins un doit correspondre),
   ET a l'interieur d'un bloc (tous les termes doivent correspondre) - comme "(A ET B) OU C" */
function exerciceCorrespondARecherche(exercice, requete) {
  var texteRequete = requete.trim();
  if (texteRequete === '') { return true; }
  var blocsOu = texteRequete.split(/\bou\b/i);
  for (var i = 0; i < blocsOu.length; i++) {
    var termesEt = blocsOu[i].split(/\bet\b/i);
    var blocValide = true;
    for (var j = 0; j < termesEt.length; j++) {
      var terme = termesEt[j].trim();
      if (terme === '') { continue; }
      if (!termeRechercheCorrespond(exercice, terme)) { blocValide = false; break; }
    }
    if (blocValide) { return true; }
  }
  return false;
}

function rendreExercices() {
  var conteneur = document.getElementById('liste-exercices');
  if (etat.exercices.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucun exercice pour l\'instant. Ajoute ton premier exercice pour pouvoir construire une séance.</li>';
    return;
  }
  var rechercheActive = texteRechercheExercices.trim() !== '';
  var exercicesFiltres = etat.exercices;
  if (rechercheActive) {
    exercicesFiltres = etat.exercices.filter(function (ex) { return exerciceCorrespondARecherche(ex, texteRechercheExercices); });
  }
  if (exercicesFiltres.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucun exercice ne correspond à cette recherche.</li>';
    return;
  }
  var html = '';
  for (var g = 0; g < GROUPES_MUSCULAIRES.length; g++) {
    var nomGroupe = GROUPES_MUSCULAIRES[g];
    var exercicesDuGroupe = exercicesFiltres.filter(function (ex) { return ex.groupe === nomGroupe; });
    if (exercicesDuGroupe.length === 0) { continue; }
    exercicesDuGroupe.sort(function (a, b) { return a.nom.localeCompare(b.nom); });
    var deplie = rechercheActive ? true : !!groupesExercicesDeplies[nomGroupe];
    html += '<li class="groupe-entete" data-action="basculer-groupe-exercices" data-groupe="' + echapperHtml(nomGroupe) + '">';
    html += '<span class="groupe-entete-chevron">' + (deplie ? '▾' : '▸') + '</span>';
    html += echapperHtml(nomGroupe) + '&nbsp;<span class="groupe-entete-nb">(' + exercicesDuGroupe.length + ')</span>';
    html += '</li>';
    if (!deplie) { continue; }
    for (var i = 0; i < exercicesDuGroupe.length; i++) {
      var ex = exercicesDuGroupe[i];
      html += '<li class="carte" data-action="editer-exercice" data-id="' + ex.id + '">';
      html += '<div class="ligne"><strong>' + echapperHtml(ex.nom) + '</strong></div>';
      html += '<div class="texte-att donnee-num" style="margin-top:4px;">' + ex.poidsDefaut + ' kg · ' + ex.repsDefaut + ' reps · ' + ex.seriesDefaut + ' séries</div>';
      html += '</li>';
    }
  }
  conteneur.innerHTML = html;
}

/* ============================================================
   BLOC 8bis : ALIMENTS (bibliothèque nutrition)
   ============================================================ */

var groupesAlimentsDeplies = {};

function basculerGroupeAliments(nomCategorie) {
  groupesAlimentsDeplies[nomCategorie] = !groupesAlimentsDeplies[nomCategorie];
  rendreAliments();
}

function chargerAlimentsDeBase() {
  var ajoutes = 0;
  var ignores = 0;
  for (var i = 0; i < ALIMENTS_DE_BASE.length; i++) {
    var modele = ALIMENTS_DE_BASE[i];
    var dejaPresent = false;
    for (var j = 0; j < etat.aliments.length; j++) {
      if (etat.aliments[j].nom.toLowerCase() === modele.nom.toLowerCase()) { dejaPresent = true; break; }
    }
    if (dejaPresent) { ignores++; continue; }
    etat.aliments.push({
      id: genererId(),
      nom: modele.nom,
      categorie: modele.categorie,
      caloriesPour100g: modele.caloriesPour100g,
      proteinesPour100g: modele.proteinesPour100g,
      glucidesPour100g: modele.glucidesPour100g,
      lipidesPour100g: modele.lipidesPour100g
    });
    ajoutes++;
  }
  sauvegarderEtat();
  rendreAliments();
  var message = ajoutes + ' aliment(s) ajouté(s).';
  if (ignores > 0) { message += ' ' + ignores + ' déjà présent(s) ignoré(s).'; }
  afficherToast(message);
}

/* ============================================================
   ALIMENTS, PLATS ET JOURNAL : fenêtres refondues
   ============================================================ */

function arrondi1(v) { return String(Math.round((v || 0) * 10) / 10); }
function lireNombre(valeur) { var v = parseFloat(String(valeur).replace(',', '.')); return isNaN(v) ? 0 : v; }
function lireChampNombre(id) { var c = document.getElementById(id); return c ? lireNombre(c.value) : 0; }

function macrosAliment(aliment, grammes) {
  var f = (grammes || 0) / 100;
  return {
    calories: (aliment.caloriesPour100g || 0) * f,
    proteines: (aliment.proteinesPour100g || 0) * f,
    glucides: (aliment.glucidesPour100g || 0) * f,
    lipides: (aliment.lipidesPour100g || 0) * f
  };
}

function texteMacros(m) {
  return '<strong>' + Math.round(m.calories) + ' kcal</strong> · P ' + arrondi1(m.proteines) + ' g · G ' + arrondi1(m.glucides) + ' g · L ' + arrondi1(m.lipides) + ' g';
}

/* ---------- Fenêtre ALIMENT ---------- */

function champMacro(libelle, unite, id, valeur, couleur) {
  return '<div class="champ champ-macro" style="--m:' + couleur + ';"><label><i class="macro-pastille"></i>' + echapperHtml(libelle) + ' <span class="macro-unite">' + unite + '</span></label>' +
    '<input type="number" inputmode="decimal" step="0.1" min="0" id="' + id + '" data-role="macro-aliment" value="' + echapperHtml(valeur) + '" placeholder="0"></div>';
}

function ouvrirFormulaireAliment(idAliment) {
  var aliment = idAliment ? trouverParId(etat.aliments, idAliment) : null;
  var estModif = !!aliment;
  if (!aliment) {
    aliment = { id: null, nom: '', categorie: 'Autre', caloriesPour100g: '', proteinesPour100g: '', glucidesPour100g: '', lipidesPour100g: '' };
  }
  var html = '<div class="modal-entete"><h2>' + (estModif ? 'Modifier l\'aliment' : 'Nouvel aliment') + '</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';

  var base = '<div class="champ"><label>Nom</label><input type="text" id="champ-al-nom" value="' + echapperHtml(aliment.nom) + '" placeholder="ex. Tofu ferme" autocomplete="off"></div>';
  base += '<div class="champ"><label>Catégorie</label><select id="champ-al-categorie">';
  for (var i = 0; i < CATEGORIES_ALIMENTS.length; i++) {
    base += '<option value="' + echapperHtml(CATEGORIES_ALIMENTS[i]) + '"' + (CATEGORIES_ALIMENTS[i] === aliment.categorie ? ' selected' : '') + '>' + echapperHtml(CATEGORIES_ALIMENTS[i]) + '</option>';
  }
  base += '</select></div>';
  html += sectionReglages('', base);

  var macros = '<div class="reglages-grille">';
  macros += champMacro('Calories', 'kcal', 'champ-al-calories', aliment.caloriesPour100g, 'var(--couleur-pevue)');
  macros += champMacro('Protéines', 'g', 'champ-al-proteines', aliment.proteinesPour100g, 'var(--couleur-turquoise)');
  macros += champMacro('Glucides', 'g', 'champ-al-glucides', aliment.glucidesPour100g, 'var(--couleur-avertissement)');
  macros += champMacro('Lipides', 'g', 'champ-al-lipides', aliment.lipidesPour100g, 'var(--couleur-nutrition)');
  macros += '</div><div id="al-hint-kcal" class="reglages-note"></div>';
  html += sectionReglages('Pour 100 g', macros);

  if (estModif) {
    var nbPlats = etat.plats.filter(function (p) {
      return p.ingredients.some(function (l) { return l.alimentId === aliment.id; });
    }).length;
    if (nbPlats > 0) { html += '<p class="reglages-note" style="margin:0 2px 12px;">Utilisé dans ' + nbPlats + ' plat' + (nbPlats > 1 ? 's' : '') + '.</p>'; }
    html += '<button class="btn btn-alerte btn-bloc" data-action="supprimer-aliment" data-id="' + aliment.id + '">Supprimer cet aliment</button>';
  }
  html += '<div class="modal-pied"><button class="btn btn-plein btn-bloc" data-action="enregistrer-aliment" data-id="' + (aliment.id || '') + '">Enregistrer</button></div>';

  ouvrirModal(html);
  majHintKcalAliment();
  if (!estModif) {
    window.setTimeout(function () { var c = document.getElementById('champ-al-nom'); if (c) { c.focus(); } }, 450);
  }
}

/* Les calories se déduisent des macros : 4 · P + 4 · G + 9 · L */
function majHintKcalAliment() {
  var zone = document.getElementById('al-hint-kcal');
  if (!zone) { return; }
  var calcule = Math.round(4 * lireChampNombre('champ-al-proteines') + 4 * lireChampNombre('champ-al-glucides') + 9 * lireChampNombre('champ-al-lipides'));
  var saisi = Math.round(lireChampNombre('champ-al-calories'));
  if (calcule === 0) {
    zone.innerHTML = 'Les calories peuvent se déduire des macros (4 · P + 4 · G + 9 · L).';
  } else if (Math.abs(calcule - saisi) > Math.max(10, calcule * 0.12)) {
    zone.innerHTML = 'Les macros donnent environ <strong class="donnee-num">' + calcule + ' kcal</strong>. <button class="btn btn-petit btn-contour" data-action="appliquer-kcal-aliment" data-valeur="' + calcule + '">Utiliser</button>';
  } else {
    zone.innerHTML = 'Calories cohérentes avec les macros.';
  }
}

function appliquerKcalAliment(valeur) {
  var champ = document.getElementById('champ-al-calories');
  if (champ) { champ.value = valeur; }
  majHintKcalAliment();
}

/* ---------- Sélecteur d'aliment (recherche, récents, catégories) ---------- */

var selecteurAliment = { mode: 'plat-ajout', index: -1 };

function alimentsRecents(max) {
  var dates = Object.keys(etat.journalAlimentaire).sort().reverse();
  var ids = [], resultat = [];
  for (var d = 0; d < dates.length && resultat.length < max; d++) {
    var entrees = etat.journalAlimentaire[dates[d]] || [];
    for (var e = entrees.length - 1; e >= 0 && resultat.length < max; e--) {
      var id = entrees[e].alimentId;
      if (entrees[e].type === 'plat' || !id || ids.indexOf(id) !== -1) { continue; }
      var al = trouverParId(etat.aliments, id);
      if (al) { ids.push(id); resultat.push(al); }
    }
  }
  return resultat;
}

function derniereQuantiteAliment(id) {
  var dates = Object.keys(etat.journalAlimentaire).sort().reverse();
  for (var d = 0; d < dates.length; d++) {
    var entrees = etat.journalAlimentaire[dates[d]] || [];
    for (var e = entrees.length - 1; e >= 0; e--) {
      if (entrees[e].type !== 'plat' && entrees[e].alimentId === id && entrees[e].quantiteGrammes > 0) { return entrees[e].quantiteGrammes; }
    }
  }
  return null;
}

function alimentEstActifSelecteur(id) {
  var m = selecteurAliment.mode;
  if (m === 'plat-ajout') { return ingredientsPlatEnCours.some(function (l) { return l.alimentId === id; }); }
  if (m === 'plat-changer') { var l = ingredientsPlatEnCours[selecteurAliment.index]; return !!l && l.alimentId === id; }
  return journalEnConstruction.alimentId === id;
}

function ligneSelecteurAliment(al) {
  var meta = Math.round(al.caloriesPour100g || 0) + ' kcal · P ' + arrondi1(al.proteinesPour100g) + ' g (/100 g)';
  var marque = (selecteurAliment.mode === 'journal') ? '<span class="selecteur-fleche">&#8250;</span>' : '<span class="selecteur-coche">&#10003;</span>';
  return '<button class="selecteur-ligne' + (alimentEstActifSelecteur(al.id) ? ' selecteur-ligne-active' : '') + '" data-action="choisir-aliment-selecteur" data-id="' + al.id + '">' +
    '<span class="selecteur-ligne-textes"><span class="selecteur-ligne-nom">' + echapperHtml(al.nom) + '</span><span class="selecteur-ligne-meta donnee-num">' + meta + '</span></span>' + marque + '</button>';
}

var categorieSelecteurOuverte = '';   /* une seule catégorie ouverte à la fois */

function dessinerListeSelecteurAliment(filtre) {
  var zone = document.getElementById('selecteur-aliment-liste');
  if (!zone) { return; }
  if (etat.aliments.length === 0) { zone.innerHTML = '<div class="etat-vide">Aucun aliment dans la bibliothèque.</div>'; return; }
  var mots = normaliserTexteRecherche((filtre || '').trim()).split(/\s+/);
  var recherche = mots.join('') !== '';
  var html = '', i;

  /* Recherche : liste à plat, limitée à 30 résultats */
  if (recherche) {
    var trouves = etat.aliments.filter(function (al) {
      var texte = normaliserTexteRecherche(al.nom) + ' ' + normaliserTexteRecherche(al.categorie);
      return mots.every(function (m) { return texte.indexOf(m) !== -1; });
    });
    if (trouves.length === 0) { zone.innerHTML = '<div class="etat-vide">Aucun aliment ne correspond.</div>'; return; }
    trouves.sort(function (a, b) { return a.nom.localeCompare(b.nom); });
    for (i = 0; i < trouves.length && i < 30; i++) { html += ligneSelecteurAliment(trouves[i]); }
    if (trouves.length > 30) { html += '<div class="texte-att selecteur-plus">' + (trouves.length - 30) + ' autres résultats : précise ta recherche.</div>'; }
    zone.innerHTML = html;
    return;
  }

  /* Sans recherche : récents, puis catégories repliées */
  var recents = alimentsRecents(5);
  if (recents.length > 0) {
    html += '<div class="selecteur-groupe">Récents</div>';
    for (i = 0; i < recents.length; i++) { html += ligneSelecteurAliment(recents[i]); }
  }
  html += '<div class="selecteur-groupe">Catégories</div>';
  for (var c = 0; c < CATEGORIES_ALIMENTS.length; c++) {
    var cat = CATEGORIES_ALIMENTS[c];
    var sous = etat.aliments.filter(function (al) { return al.categorie === cat; });
    if (sous.length === 0) { continue; }
    var ouverte = (categorieSelecteurOuverte === cat);
    var choisis = sous.filter(function (al) { return alimentEstActifSelecteur(al.id); }).length;
    html += '<button class="selecteur-cat' + (ouverte ? ' selecteur-cat-ouverte' : '') + '" data-action="basculer-categorie-selecteur" data-groupe="' + echapperHtml(cat) + '">' +
      '<span class="selecteur-cat-chevron">' + (ouverte ? '&#9662;' : '&#9656;') + '</span><span class="selecteur-cat-nom">' + echapperHtml(cat) + '</span>' +
      '<span class="selecteur-cat-nb donnee-num">' + (choisis > 0 ? '<i>' + choisis + ' choisi' + (choisis > 1 ? 's' : '') + '</i>' : '') + sous.length + '</span></button>';
    if (ouverte) {
      sous.sort(function (a, b) { return a.nom.localeCompare(b.nom); });
      for (i = 0; i < sous.length; i++) { html += ligneSelecteurAliment(sous[i]); }
    }
  }
  zone.innerHTML = html;
}

function basculerCategorieSelecteur(nom) {
  categorieSelecteurOuverte = (categorieSelecteurOuverte === nom) ? '' : nom;
  var champ = document.getElementById('champ-selecteur-aliment');
  dessinerListeSelecteurAliment(champ ? champ.value : '');
  if (categorieSelecteurOuverte) {   /* l'en-tête remonte juste sous la barre de recherche */
    var entete = document.querySelector('.selecteur-cat-ouverte');
    var modal = document.getElementById('modal-contenu');
    var barre = document.querySelector('.selecteur-recherche');
    if (entete && modal && barre) {
      modal.scrollTop += entete.getBoundingClientRect().top - barre.getBoundingClientRect().bottom - 4;
    }
  }
}

function brancherRechercheAliment() {
  var champ = document.getElementById('champ-selecteur-aliment');
  if (!champ) { return; }
  var minuteur = null;
  champ.addEventListener('input', function () {   /* attend la fin de la frappe */
    if (minuteur) { window.clearTimeout(minuteur); }
    minuteur = window.setTimeout(function () { dessinerListeSelecteurAliment(champ.value); }, 150);
  });
}

function majBoutonTermineSelecteur() {
  var b = document.getElementById('selecteur-aliment-termine');
  if (!b) { return; }
  var n = ingredientsPlatEnCours.length;
  b.innerHTML = n === 0 ? 'Terminé' : 'Terminé · ' + n + ' ingrédient' + (n > 1 ? 's' : '');
}

/* mode : 'plat-ajout' (plusieurs à la suite) ou 'plat-changer' (remplace l'ingrédient n° index) */
function ouvrirSelecteurAliment(mode, index) {
  selecteurAliment = { mode: mode, index: (index === undefined ? -1 : index) };
  categorieSelecteurOuverte = '';
  if (mode === 'plat-changer' && ingredientsPlatEnCours[selecteurAliment.index]) {   /* ouvre la catégorie de l'aliment à remplacer */
    var actuel = trouverParId(etat.aliments, ingredientsPlatEnCours[selecteurAliment.index].alimentId);
    if (actuel) { categorieSelecteurOuverte = actuel.categorie; }
  }
  var multi = (mode === 'plat-ajout');
  var html = '<div class="modal-entete"><div class="modal-entete-gauche"><button class="bouton-retour" data-action="selecteur-aliment-retour">&#8249;</button><h2>' + (multi ? 'Ajouter des ingrédients' : 'Changer d\'aliment') + '</h2></div><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="selecteur-recherche"><input type="search" id="champ-selecteur-aliment" placeholder="Rechercher un aliment" autocomplete="off"></div>';
  html += '<div id="selecteur-aliment-liste"></div>';
  if (multi) { html += '<div class="modal-pied"><button class="btn btn-plein btn-bloc" id="selecteur-aliment-termine" data-action="selecteur-aliment-retour"></button></div>'; }
  ouvrirModal(html, 'avant');
  dessinerListeSelecteurAliment('');
  brancherRechercheAliment();
  majBoutonTermineSelecteur();
}

function choisirAlimentSelecteur(id) {
  var mode = selecteurAliment.mode, i;
  if (mode === 'plat-ajout') {
    var pos = -1;
    for (i = 0; i < ingredientsPlatEnCours.length; i++) { if (ingredientsPlatEnCours[i].alimentId === id) { pos = i; } }
    if (pos === -1) { ingredientsPlatEnCours.push({ alimentId: id, quantiteGrammes: 100 }); } else { ingredientsPlatEnCours.splice(pos, 1); }
    var lignes = document.querySelectorAll('.selecteur-ligne[data-id="' + id + '"]');
    for (i = 0; i < lignes.length; i++) { lignes[i].classList.toggle('selecteur-ligne-active', pos === -1); }
    majBoutonTermineSelecteur();
    return;
  }
  if (mode === 'plat-changer') {
    if (ingredientsPlatEnCours[selecteurAliment.index]) { ingredientsPlatEnCours[selecteurAliment.index].alimentId = id; }
    rendreFormulairePlat('arriere');
    return;
  }
  journalEnConstruction.alimentId = id;
  journalEnConstruction.quantite = derniereQuantiteAliment(id) || 100;   /* reprend la dernière quantité utilisée */
  rendreEtapeQuantiteJournal('avant');
}

/* ---------- Fenêtre PLAT ---------- */

var platEnConstruction = { id: null, nom: '', portions: 4 };

/* Redessine seulement la liste : la fenêtre ne remonte pas, le clavier reste ouvert */
function rendreListeIngredientsPlat() {
  var zone = document.getElementById('plat-liste-ingredients');
  if (!zone) { return; }
  if (ingredientsPlatEnCours.length === 0) {
    zone.innerHTML = '<div class="texte-att plat-vide">Aucun ingrédient pour l\'instant.</div>';
  } else {
    var html = '';
    for (var i = 0; i < ingredientsPlatEnCours.length; i++) {
      var ligne = ingredientsPlatEnCours[i];
      var al = trouverParId(etat.aliments, ligne.alimentId);
      html += '<div class="plat-ing">';
      html += '<button class="plat-ing-nom" data-action="changer-ingredient-plat" data-index="' + i + '"><span class="plat-ing-titre">' + echapperHtml(al ? al.nom : '(aliment supprimé)') + '</span><span class="plat-ing-sous donnee-num" data-sous="' + i + '"></span></button>';
      html += '<input class="plat-ing-qte" type="number" inputmode="decimal" step="1" min="0" data-role="plat-qte" data-index="' + i + '" value="' + ligne.quantiteGrammes + '">';
      html += '<span class="plat-ing-unite">g</span>';
      html += '<button class="serie-suppr" data-action="retirer-ingredient-plat" data-index="' + i + '" aria-label="Retirer">&times;</button>';
      html += '</div>';
    }
    zone.innerHTML = html;
  }
  majApercuPlat();
}

function majApercuPlat() {
  var i;
  var sous = document.querySelectorAll('[data-sous]');
  for (i = 0; i < sous.length; i++) {
    var ligne = ingredientsPlatEnCours[parseInt(sous[i].getAttribute('data-sous'), 10)];
    var al = ligne ? trouverParId(etat.aliments, ligne.alimentId) : null;
    if (al) {
      var m = macrosAliment(al, ligne.quantiteGrammes);
      sous[i].innerHTML = Math.round(m.calories) + ' kcal · P ' + arrondi1(m.proteines) + ' g';
    }
  }
  var zone = document.getElementById('apercu-plat-macros');
  if (zone) {
    var portions = platEnConstruction.portions > 0 ? platEnConstruction.portions : 1;
    var mp = calculerMacrosPortionPlat({ ingredients: ingredientsPlatEnCours, portions: portions });
    zone.innerHTML = 'Par portion · ' + texteMacros(mp);
  }
}

function ajusterPortionsPlat(delta) {
  var champ = document.getElementById('champ-plat-portions');
  if (!champ) { return; }
  var v = Math.max(0.5, Math.round((lireNombre(champ.value) + delta) * 2) / 2);
  champ.value = v;
  platEnConstruction.portions = v;
  majApercuPlat();
}

function ajouterIngredientPlat() { ouvrirSelecteurAliment('plat-ajout', -1); }

function retirerIngredientPlat(index) {
  ingredientsPlatEnCours.splice(index, 1);
  rendreListeIngredientsPlat();
}

function enregistrerPlat(idExistant) {
  var nom = platEnConstruction.nom.trim();
  if (!nom) { afficherToast('Le nom du plat est obligatoire.'); return; }
  if (ingredientsPlatEnCours.length === 0) { afficherToast('Ajoute au moins un ingrédient.'); return; }
  for (var i = 0; i < ingredientsPlatEnCours.length; i++) {
    if (!(ingredientsPlatEnCours[i].quantiteGrammes > 0)) { afficherToast('Vérifie les quantités des ingrédients.'); return; }
  }
  var donnees = {
    nom: nom,
    portions: platEnConstruction.portions > 0 ? platEnConstruction.portions : 1,
    ingredients: ingredientsPlatEnCours.map(function (l) { return { alimentId: l.alimentId, quantiteGrammes: l.quantiteGrammes }; })
  };
  if (idExistant) {
    var plat = trouverParId(etat.plats, idExistant);
    plat.nom = donnees.nom;
    plat.portions = donnees.portions;
    plat.ingredients = donnees.ingredients;
  } else {
    donnees.id = genererId();
    etat.plats.push(donnees);
  }
  sauvegarderEtat();
  fermerModal();
  rendrePlats();
}

/* ---------- Fenêtre JOURNAL : choix, puis quantité ---------- */

var journalEnConstruction = { type: 'aliment', alimentId: null, platId: null, quantite: 100, portions: 1 };

function ouvrirFormulaireAjoutJournal() {
  if (etat.aliments.length === 0 && etat.plats.length === 0) {
    afficherToast('Ajoute d\'abord des aliments ou des plats dans Bibliothèque.');
    return;
  }
  journalEnConstruction = { type: etat.aliments.length > 0 ? 'aliment' : 'plat', alimentId: null, platId: null, quantite: 100, portions: 1 };
  categorieSelecteurOuverte = '';
  rendreEtapeChoixJournal();
}

function basculerTypeAjoutJournal(type) {
  journalEnConstruction.type = type;
  rendreEtapeChoixJournal();
}

function htmlListePlatsJournal() {
  if (etat.plats.length === 0) { return '<div class="etat-vide">Aucun plat. Crées-en dans Bibliothèque > Plats.</div>'; }
  var tries = etat.plats.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); });
  var html = '';
  for (var i = 0; i < tries.length; i++) {
    var m = calculerMacrosPortionPlat(tries[i]);
    html += '<button class="selecteur-ligne" data-action="choisir-plat-journal" data-id="' + tries[i].id + '"><span class="selecteur-ligne-textes"><span class="selecteur-ligne-nom">' + echapperHtml(tries[i].nom) + '</span>' +
      '<span class="selecteur-ligne-meta donnee-num">' + Math.round(m.calories) + ' kcal · P ' + arrondi1(m.proteines) + ' g / portion</span></span><span class="selecteur-fleche">&#8250;</span></button>';
  }
  return html;
}

function rendreEtapeChoixJournal(sens) {
  selecteurAliment = { mode: 'journal', index: -1 };
  var j = journalEnConstruction;
  var html = '<div class="modal-entete"><h2>Ajouter au journal</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<p class="reglages-note" style="margin:-6px 2px 12px;">' + echapperHtml(formaterDateLisible(dateNutritionAffichee)) + '</p>';
  html += '<div class="sous-onglets" style="margin-bottom:12px;">';
  html += '<button class="sous-onglet' + (j.type === 'aliment' ? ' sous-onglet-actif' : '') + '" data-action="type-ajout-journal" data-type="aliment">Aliment</button>';
  html += '<button class="sous-onglet' + (j.type === 'plat' ? ' sous-onglet-actif' : '') + '" data-action="type-ajout-journal" data-type="plat">Plat</button>';
  html += '</div>';
  if (j.type === 'aliment') {
    html += '<div class="selecteur-recherche"><input type="search" id="champ-selecteur-aliment" placeholder="Rechercher un aliment" autocomplete="off"></div><div id="selecteur-aliment-liste"></div>';
  } else {
    html += htmlListePlatsJournal();
  }
  ouvrirModal(html, sens);
  if (j.type === 'aliment') { dessinerListeSelecteurAliment(''); brancherRechercheAliment(); }
}

function choisirPlatJournal(id) {
  journalEnConstruction.platId = id;
  journalEnConstruction.portions = 1;
  rendreEtapeQuantiteJournal('avant');
}

function htmlChipsJournal() {
  var estPlat = journalEnConstruction.type === 'plat';
  var valeurs = estPlat ? [0.5, 1, 1.5, 2, 3] : [50, 100, 150, 200, 250];
  var libelles = estPlat ? ['½', '1', '1½', '2', '3'] : ['50 g', '100 g', '150 g', '200 g', '250 g'];
  var courante = estPlat ? journalEnConstruction.portions : journalEnConstruction.quantite;
  var h = '';
  for (var i = 0; i < valeurs.length; i++) {
    h += '<button class="chip-rapide' + (valeurs[i] === courante ? ' chip-actif' : '') + '" data-action="journal-chip" data-valeur="' + valeurs[i] + '">' + libelles[i] + '</button>';
  }
  return h;
}

function rafraichirChipsJournal() {
  var zone = document.getElementById('journal-chips');
  if (zone) { zone.innerHTML = htmlChipsJournal(); }
}

function majApercuJournal() {
  var zone = document.getElementById('journal-apercu');
  if (!zone) { return; }
  var j = journalEnConstruction, m;
  if (j.type === 'plat') {
    var plat = trouverParId(etat.plats, j.platId);
    if (!plat) { return; }
    var mp = calculerMacrosPortionPlat(plat);
    m = { calories: mp.calories * j.portions, proteines: mp.proteines * j.portions, glucides: mp.glucides * j.portions, lipides: mp.lipides * j.portions };
  } else {
    var al = trouverParId(etat.aliments, j.alimentId);
    if (!al) { return; }
    m = macrosAliment(al, j.quantite);
  }
  zone.innerHTML = 'Total · ' + texteMacros(m);
}

function appliquerChipJournal(valeur) {
  if (journalEnConstruction.type === 'plat') { journalEnConstruction.portions = valeur; } else { journalEnConstruction.quantite = valeur; }
  var champ = document.getElementById('champ-journal-valeur');
  if (champ) { champ.value = valeur; }
  rafraichirChipsJournal();
  majApercuJournal();
}

function rendreEtapeQuantiteJournal(sens) {
  var j = journalEnConstruction;
  var estPlat = (j.type === 'plat');
  var item = estPlat ? trouverParId(etat.plats, j.platId) : trouverParId(etat.aliments, j.alimentId);
  if (!item) { rendreEtapeChoixJournal(); return; }

  var html = '<div class="modal-entete"><div class="modal-entete-gauche"><button class="bouton-retour" data-action="journal-retour-choix">&#8249;</button><h2>' + (estPlat ? 'Portions' : 'Quantité') + '</h2></div><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  var sous = estPlat ? texteMacros(calculerMacrosPortionPlat(item)) + ' / portion' : texteMacros(macrosAliment(item, 100)) + ' / 100 g';
  html += '<div class="journal-resume"><span class="journal-resume-nom">' + echapperHtml(item.nom) + '</span><span class="journal-resume-sous donnee-num">' + sous + '</span></div>';
  html += '<div class="champ champ-gros"><label>' + (estPlat ? 'Nombre de portions' : 'Quantité (grammes)') + '</label>';
  html += '<input type="number" inputmode="decimal" step="' + (estPlat ? '0.5' : '1') + '" min="0" id="champ-journal-valeur" data-role="journal-valeur" value="' + (estPlat ? j.portions : j.quantite) + '"></div>';
  html += '<div class="chips-rapides" id="journal-chips">' + htmlChipsJournal() + '</div>';
  html += '<div class="journal-apercu donnee-num" id="journal-apercu"></div>';
  html += '<div class="modal-pied modal-pied-ligne"><button class="btn btn-contour" style="flex:1;" data-action="confirmer-ajout-journal-encore">+ Un autre</button><button class="btn btn-plein" style="flex:1.4;" data-action="confirmer-ajout-journal">Ajouter</button></div>';
  ouvrirModal(html, sens);
  majApercuJournal();
}

function confirmerAjoutJournal(encore) {
  var j = journalEnConstruction;
  if (!etat.journalAlimentaire[dateNutritionAffichee]) { etat.journalAlimentaire[dateNutritionAffichee] = []; }
  var nom;
  if (j.type === 'aliment') {
    if (!j.alimentId || !(j.quantite > 0)) { afficherToast('Choisis une quantité valide.'); return; }
    etat.journalAlimentaire[dateNutritionAffichee].push({ id: genererId(), type: 'aliment', alimentId: j.alimentId, quantiteGrammes: j.quantite });
    nom = (trouverParId(etat.aliments, j.alimentId) || {}).nom;
  } else {
    if (!j.platId || !(j.portions > 0)) { afficherToast('Choisis un nombre de portions valide.'); return; }
    etat.journalAlimentaire[dateNutritionAffichee].push({ id: genererId(), type: 'plat', platId: j.platId, portions: j.portions });
    nom = (trouverParId(etat.plats, j.platId) || {}).nom;
  }
  sauvegarderEtat();
  rendreNutrition();
  if (encore) {
    afficherToast((nom || 'Ajouté') + ' ajouté');
    journalEnConstruction.alimentId = null;
    journalEnConstruction.platId = null;
    rendreEtapeChoixJournal('arriere');
  } else {
    fermerModal();
  }
}

function enregistrerAliment(idExistant) {
  var nom = document.getElementById('champ-al-nom').value.trim();
  if (!nom) { afficherToast('Le nom de l\'aliment est obligatoire.'); return; }
  var donnees = {
    nom: nom,
    categorie: document.getElementById('champ-al-categorie').value,
    caloriesPour100g: parseFloat(document.getElementById('champ-al-calories').value) || 0,
    proteinesPour100g: parseFloat(document.getElementById('champ-al-proteines').value) || 0,
    glucidesPour100g: parseFloat(document.getElementById('champ-al-glucides').value) || 0,
    lipidesPour100g: parseFloat(document.getElementById('champ-al-lipides').value) || 0
  };
  if (idExistant) {
    var aliment = trouverParId(etat.aliments, idExistant);
    aliment.nom = donnees.nom;
    aliment.categorie = donnees.categorie;
    aliment.caloriesPour100g = donnees.caloriesPour100g;
    aliment.proteinesPour100g = donnees.proteinesPour100g;
    aliment.glucidesPour100g = donnees.glucidesPour100g;
    aliment.lipidesPour100g = donnees.lipidesPour100g;
  } else {
    donnees.id = genererId();
    etat.aliments.push(donnees);
  }
  sauvegarderEtat();
  fermerModal();
  rendreAliments();
}

function supprimerAliment(id) {
  demanderConfirmation('Supprimer définitivement cet aliment ?', function () {
    etat.aliments = retirerParId(etat.aliments, id);
    sauvegarderEtat();
    fermerModal();
    rendreAliments();
  }, function () {
    ouvrirFormulaireAliment(id);
  });
}

function rendreAliments() {
  var conteneur = document.getElementById('liste-aliments');
  if (etat.aliments.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucun aliment pour l\'instant.</li>';
    return;
  }
  var html = '';
  for (var c = 0; c < CATEGORIES_ALIMENTS.length; c++) {
    var nomCategorie = CATEGORIES_ALIMENTS[c];
    var alimentsDuGroupe = etat.aliments.filter(function (al) { return al.categorie === nomCategorie; });
    if (alimentsDuGroupe.length === 0) { continue; }
    alimentsDuGroupe.sort(function (a, b) { return a.nom.localeCompare(b.nom); });
    var deplie = !!groupesAlimentsDeplies[nomCategorie];
    html += '<li class="groupe-entete" data-action="basculer-groupe-aliments" data-groupe="' + echapperHtml(nomCategorie) + '">';
    html += '<span class="groupe-entete-chevron">' + (deplie ? '▾' : '▸') + '</span>';
    html += echapperHtml(nomCategorie) + '&nbsp;<span class="groupe-entete-nb">(' + alimentsDuGroupe.length + ')</span>';
    html += '</li>';
    if (!deplie) { continue; }
    for (var i = 0; i < alimentsDuGroupe.length; i++) {
      var al = alimentsDuGroupe[i];
      html += '<li class="carte" data-action="editer-aliment" data-id="' + al.id + '">';
      html += '<div class="ligne"><strong>' + echapperHtml(al.nom) + '</strong></div>';
      html += '<div class="texte-att donnee-num" style="margin-top:4px;">' + al.caloriesPour100g + ' kcal · P ' + al.proteinesPour100g + 'g · G ' + al.glucidesPour100g + 'g · L ' + al.lipidesPour100g + 'g (/100g)</div>';
      html += '</li>';
    }
  }
  conteneur.innerHTML = html;
}

/* ============================================================
   BLOC 8ter : JOURNAL ALIMENTAIRE (page Nutrition)
   ============================================================ */

var dateNutritionAffichee = formaterDateISO(new Date());

function changerJourNutrition(delta) {
  var d = dateDepuisISO(dateNutritionAffichee);
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
  dateNutritionAffichee = formaterDateISO(d);
  rendreNutrition();
}

function calculerTotauxJour(dateISO) {
  var entrees = etat.journalAlimentaire[dateISO] || [];
  var totaux = { calories: 0, proteines: 0, glucides: 0, lipides: 0 };
  for (var i = 0; i < entrees.length; i++) {
    var entree = entrees[i];
    if (entree.type === 'plat') {
      var plat = trouverParId(etat.plats, entree.platId);
      if (!plat) { continue; }
      var macrosPortion = calculerMacrosPortionPlat(plat);
      totaux.calories += macrosPortion.calories * entree.portions;
      totaux.proteines += macrosPortion.proteines * entree.portions;
      totaux.glucides += macrosPortion.glucides * entree.portions;
      totaux.lipides += macrosPortion.lipides * entree.portions;
    } else {
      var aliment = trouverParId(etat.aliments, entree.alimentId);
      if (!aliment) { continue; }
      var facteur = entree.quantiteGrammes / 100;
      totaux.calories += (aliment.caloriesPour100g || 0) * facteur;
      totaux.proteines += (aliment.proteinesPour100g || 0) * facteur;
      totaux.glucides += (aliment.glucidesPour100g || 0) * facteur;
      totaux.lipides += (aliment.lipidesPour100g || 0) * facteur;
    }
  }
  return totaux;
}

function retirerAlimentDuJournal(entreeId) {
  var liste = etat.journalAlimentaire[dateNutritionAffichee];
  if (!liste) { return; }
  etat.journalAlimentaire[dateNutritionAffichee] = liste.filter(function (e) { return e.id !== entreeId; });
  sauvegarderEtat();
  rendreNutrition();
}

function barreProgressionMacro(consomme, objectif) {
  if (!objectif || objectif <= 0) { return 0; }
  return Math.min(100, Math.round((consomme / objectif) * 100));
}

function rendreNutrition() {
  var zoneDate = document.getElementById('nutrition-libelle-jour');
  if (!zoneDate) { return; }
  zoneDate.innerHTML = formaterDateLisible(dateNutritionAffichee);

  var totaux = calculerTotauxJour(dateNutritionAffichee);
  var objCal = etat.profil.objectifCalories || 0;
  var objP = etat.profil.objectifProteines || 0;
  var objG = etat.profil.objectifGlucides || 0;
  var objL = etat.profil.objectifLipides || 0;

  var htmlMacros = '';
  htmlMacros += '<div class="macro-ligne"><div class="ligne"><span>Calories</span><span class="donnee-num">' + Math.round(totaux.calories) + ' / ' + objCal + ' kcal</span></div>';
  htmlMacros += '<div class="macro-barre-fond"><div class="macro-barre-remplie macro-barre-calories" style="width:' + barreProgressionMacro(totaux.calories, objCal) + '%;"></div></div></div>';
  htmlMacros += '<div class="macro-ligne"><div class="ligne"><span>Protéines</span><span class="donnee-num">' + totaux.proteines.toFixed(1) + ' / ' + objP + ' g</span></div>';
  htmlMacros += '<div class="macro-barre-fond"><div class="macro-barre-remplie macro-barre-proteines" style="width:' + barreProgressionMacro(totaux.proteines, objP) + '%;"></div></div></div>';
  htmlMacros += '<div class="macro-ligne"><div class="ligne"><span>Glucides</span><span class="donnee-num">' + totaux.glucides.toFixed(1) + ' / ' + objG + ' g</span></div>';
  htmlMacros += '<div class="macro-barre-fond"><div class="macro-barre-remplie macro-barre-glucides" style="width:' + barreProgressionMacro(totaux.glucides, objG) + '%;"></div></div></div>';
  htmlMacros += '<div class="macro-ligne" style="margin-bottom:0;"><div class="ligne"><span>Lipides</span><span class="donnee-num">' + totaux.lipides.toFixed(1) + ' / ' + objL + ' g</span></div>';
  htmlMacros += '<div class="macro-barre-fond"><div class="macro-barre-remplie macro-barre-lipides" style="width:' + barreProgressionMacro(totaux.lipides, objL) + '%;"></div></div></div>';
  document.getElementById('nutrition-zone-macros').innerHTML = htmlMacros;

  var entrees = etat.journalAlimentaire[dateNutritionAffichee] || [];
  var conteneurListe = document.getElementById('nutrition-liste-journal');
  if (entrees.length === 0) {
    conteneurListe.innerHTML = '<li class="etat-vide">Rien noté ce jour-là.</li>';
    return;
  }
  var html = '';
  for (var i = 0; i < entrees.length; i++) {
    var entree = entrees[i];
    var libelle, details;
    if (entree.type === 'plat') {
      var plat = trouverParId(etat.plats, entree.platId);
      libelle = plat ? plat.nom : '(plat supprimé)';
      details = entree.portions + ' portion(s)';
    } else {
      var aliment = trouverParId(etat.aliments, entree.alimentId);
      libelle = aliment ? aliment.nom : '(aliment supprimé)';
      details = entree.quantiteGrammes + ' g';
    }
    html += '<li class="carte">';
    html += '<div class="ligne"><span><strong>' + echapperHtml(libelle) + '</strong> — ' + details + '</span>';
    html += '<button class="serie-suppr" data-action="retirer-aliment-journal" data-id="' + entree.id + '">&times;</button></div>';
    html += '</li>';
  }
  conteneurListe.innerHTML = html;
}

/* ============================================================
   BLOC 8quater : PLATS (recettes composées d'ingrédients)
   ============================================================ */

function calculerMacrosPlat(plat) {
  var totaux = { calories: 0, proteines: 0, glucides: 0, lipides: 0 };
  for (var i = 0; i < plat.ingredients.length; i++) {
    var ligne = plat.ingredients[i];
    var aliment = trouverParId(etat.aliments, ligne.alimentId);
    if (!aliment) { continue; }
    var facteur = ligne.quantiteGrammes / 100;
    totaux.calories += (aliment.caloriesPour100g || 0) * facteur;
    totaux.proteines += (aliment.proteinesPour100g || 0) * facteur;
    totaux.glucides += (aliment.glucidesPour100g || 0) * facteur;
    totaux.lipides += (aliment.lipidesPour100g || 0) * facteur;
  }
  return totaux;
}

function calculerMacrosPortionPlat(plat) {
  var totaux = calculerMacrosPlat(plat);
  var nb = plat.portions > 0 ? plat.portions : 1;
  return {
    calories: totaux.calories / nb,
    proteines: totaux.proteines / nb,
    glucides: totaux.glucides / nb,
    lipides: totaux.lipides / nb
  };
}

function optionsAlimentsHtml(alimentIdSelectionne) {
  var alimentsTries = etat.aliments.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); });
  var html = '';
  for (var i = 0; i < alimentsTries.length; i++) {
    var selectionne = (String(alimentsTries[i].id) === String(alimentIdSelectionne)) ? ' selected' : '';
    html += '<option value="' + alimentsTries[i].id + '"' + selectionne + '>' + echapperHtml(alimentsTries[i].nom) + '</option>';
  }
  return html;
}

function ouvrirFormulairePlat(idPlat) {
  if (etat.aliments.length === 0) {
    afficherToast('Ajoute d\'abord des aliments dans Bibliothèque > Aliments.');
    return;
  }
  var plat = idPlat ? trouverParId(etat.plats, idPlat) : null;
  var estModif = !!plat;
  if (!plat) { plat = { id: null, nom: '', portions: 4, ingredients: [] }; }
  ingredientsPlatEnCours = plat.ingredients.length > 0
    ? plat.ingredients.slice()
    : [{ alimentId: etat.aliments[0].id, quantiteGrammes: 100 }];
  rendreFormulairePlat(plat.id, plat.nom, plat.portions, estModif);
}

function rendreFormulairePlat(idPlat, nomActuel, portionsActuelles, estModif) {
  var portions = portionsActuelles || 4;
  var html = '';
  html += '<div class="modal-entete"><h2>' + (estModif ? 'Modifier le plat' : 'Nouveau plat') + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><label>Nom du plat</label><input type="text" id="champ-plat-nom" value="' + echapperHtml(nomActuel || '') + '" placeholder="ex. Curry de lentilles"></div>';
  html += '<div class="champ"><label>Nombre de portions</label><input type="number" step="0.5" min="0.5" id="champ-plat-portions" value="' + portions + '" onchange="mettreAJourApercuPlat()"></div>';
  html += '<h3 style="margin:14px 0 6px;">Ingrédients</h3>';
  for (var i = 0; i < ingredientsPlatEnCours.length; i++) {
    var ligne = ingredientsPlatEnCours[i];
    html += '<div class="ligne" style="gap:6px; margin-bottom:6px;">';
    html += '<select style="flex:2;" onchange="changerIngredientPlat(' + i + ', this.value)">' + optionsAlimentsHtml(ligne.alimentId) + '</select>';
    html += '<input type="number" step="1" min="1" style="flex:1;" value="' + ligne.quantiteGrammes + '" placeholder="g" onchange="changerQuantiteIngredientPlat(' + i + ', this.value)">';
    html += '<button class="serie-suppr" data-action="retirer-ingredient-plat" data-index="' + i + '">&times;</button>';
    html += '</div>';
  }
  html += '<button class="btn btn-contour btn-bloc" data-action="ajouter-ingredient-plat" style="margin:8px 0 14px;">+ Ajouter un ingrédient</button>';

  var apercu = calculerMacrosPortionPlat({ ingredients: ingredientsPlatEnCours, portions: parseFloat(portions) || 1 });
  html += '<div id="apercu-plat-macros" class="texte-att donnee-num" style="margin-bottom:14px;">Par portion : ' + Math.round(apercu.calories) + ' kcal · P ' + apercu.proteines.toFixed(1) + 'g · G ' + apercu.glucides.toFixed(1) + 'g · L ' + apercu.lipides.toFixed(1) + 'g</div>';

  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-plat" data-id="' + (idPlat || '') + '">Enregistrer</button>';
  if (estModif) {
    html += '<button class="btn btn-alerte btn-bloc" style="margin-top:8px;" data-action="supprimer-plat" data-id="' + idPlat + '">Supprimer ce plat</button>';
  }
  ouvrirModal(html);
}

function supprimerPlat(id) {
  demanderConfirmation('Supprimer définitivement ce plat ?', function () {
    etat.plats = retirerParId(etat.plats, id);
    sauvegarderEtat();
    fermerModal();
    rendrePlats();
  }, function () {
    ouvrirFormulairePlat(id);
  });
}

function rendrePlats() {
  var conteneur = document.getElementById('liste-plats');
  if (!conteneur) { return; }
  if (etat.plats.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucun plat pour l\'instant.</li>';
    return;
  }
  var platsTries = etat.plats.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); });
  var html = '';
  for (var i = 0; i < platsTries.length; i++) {
    var plat = platsTries[i];
    var macrosPortion = calculerMacrosPortionPlat(plat);
    html += '<li class="carte" data-action="editer-plat" data-id="' + plat.id + '">';
    html += '<div class="ligne"><strong>' + echapperHtml(plat.nom) + '</strong><span class="texte-att">' + plat.portions + ' portion(s)</span></div>';
    html += '<div class="texte-att donnee-num" style="margin-top:4px;">Par portion : ' + Math.round(macrosPortion.calories) + ' kcal · P ' + macrosPortion.proteines.toFixed(1) + 'g · G ' + macrosPortion.glucides.toFixed(1) + 'g · L ' + macrosPortion.lipides.toFixed(1) + 'g</div>';
    html += '</li>';
  }
  conteneur.innerHTML = html;
}

/* ============================================================
   BLOC 9 : SEANCES (modèles réutilisables)
   ============================================================ */

var seanceEnConstruction = null;

function ouvrirFormulaireSeance(idSeance) {
  var seanceExistante = idSeance ? trouverParId(etat.seances, idSeance) : null;
  if (seanceExistante) {
    seanceEnConstruction = {
      id: seanceExistante.id,
      nom: seanceExistante.nom,
      exercices: seanceExistante.exercices.map(function (e) {
        return {
          exerciceId: e.exerciceId,
          poids: e.poids,
          reps: e.reps,
          series: e.series,
          structure: e.structure || 'lineaire',
          technique: e.technique || 'aucune',
          tempo: e.tempo || ''
        };
      })
    };
  } else {
    seanceEnConstruction = { id: null, nom: '', exercices: [] };
  }
  rendreFormulaireSeance();
}

function rendreFormulaireSeance() {
  var estModif = !!seanceEnConstruction.id;
  var html = '';
  html += '<div class="modal-entete"><h2>' + (estModif ? 'Modifier la séance' : 'Nouvelle séance') + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><label>Nom de la séance</label><input type="text" id="champ-se-nom" value="' + echapperHtml(seanceEnConstruction.nom) + '" placeholder="ex. Push day"></div>';

  html += '<div class="champ"><label>Exercices dans cette séance</label></div>';
  if (seanceEnConstruction.exercices.length === 0) {
    html += '<div class="texte-att" style="margin-bottom:10px;">Aucun exercice ajouté.</div>';
  } else {
    for (var i = 0; i < seanceEnConstruction.exercices.length; i++) {
      var ligneEx = seanceEnConstruction.exercices[i];
      var exRef = trouverParId(etat.exercices, ligneEx.exerciceId);
      var nomEx = exRef ? exRef.nom : '(exercice supprimé)';
      html += '<div class="carte" style="padding:10px;">';
      html += '<div class="ligne"><strong>' + echapperHtml(nomEx) + '</strong>';
      html += '<button class="btn btn-alerte btn-petit" data-action="retirer-exercice-seance" data-index="' + i + '">Retirer</button></div>';
      html += '<div class="ligne" style="margin-top:8px;">';
      html += '<div class="serie-champ" style="width:auto; margin-right:10px;"><label class="texte-att" style="font-size:11px;">Poids (kg)</label><input type="number" step="0.5" data-role="se-poids" data-index="' + i + '" value="' + ligneEx.poids + '"></div>';
      html += '<div class="serie-champ" style="width:auto; margin-right:10px;"><label class="texte-att" style="font-size:11px;">Reps</label><input type="number" step="1" data-role="se-reps" data-index="' + i + '" value="' + ligneEx.reps + '"></div>';
      html += '<div class="serie-champ" style="width:auto;"><label class="texte-att" style="font-size:11px;">Séries</label><input type="number" step="1" data-role="se-series" data-index="' + i + '" value="' + ligneEx.series + '"></div>';
      html += '</div>';
      html += '<div class="champ" style="margin-top:8px; margin-bottom:6px;"><label style="font-size:11px;">Structure de séries</label>';
      html += '<select data-role="se-structure" data-index="' + i + '">' + optionsListeValeurLibelle(STRUCTURES_SERIES, ligneEx.structure || 'lineaire') + '</select></div>';
      html += '<div class="champ" style="margin-bottom:6px;"><label style="font-size:11px;">Technique d\'intensification (dernière série)</label>';
      html += '<select data-role="se-technique" data-index="' + i + '">' + optionsListeValeurLibelle(TECHNIQUES_INTENSIFICATION, ligneEx.technique || 'aucune') + '</select></div>';
      html += '<div class="champ" style="margin-bottom:0;"><label style="font-size:11px;">Tempo (optionnel, ex. 4-1-1-0)</label>';
      html += '<input type="text" data-role="se-tempo" data-index="' + i + '" value="' + echapperHtml(ligneEx.tempo || '') + '" placeholder="ex. 4-1-1-0"></div>';
      html += '</div>';
    }
  }

  html += '<div class="champ" style="margin-top:14px;"><label>Ajouter un exercice de la bibliothèque</label>';
  html += '<select id="select-ajout-exercice-seance"><option value="">— choisir —</option>';
  html += optionsExercicesGroupees(null);
  html += '</select></div>';
  html += '<button class="btn btn-contour btn-bloc" data-action="ajouter-exercice-a-seance">+ Ajouter cet exercice</button>';

  html += '<button class="btn btn-plein btn-bloc" style="margin-top:16px;" data-action="enregistrer-seance">Enregistrer la séance</button>';
  if (estModif) {
    html += '<button class="btn btn-alerte btn-bloc" style="margin-top:8px;" data-action="supprimer-seance" data-id="' + seanceEnConstruction.id + '">Supprimer cette séance</button>';
  }
  ouvrirModal(html);
}

function memoriserChampsSeanceEnCours() {
  if (!seanceEnConstruction) { return; }
  seanceEnConstruction.nom = document.getElementById('champ-se-nom').value;
  var champsPoids = document.querySelectorAll('[data-role="se-poids"]');
  var champsReps = document.querySelectorAll('[data-role="se-reps"]');
  var champsSeries = document.querySelectorAll('[data-role="se-series"]');
  var champsStructure = document.querySelectorAll('[data-role="se-structure"]');
  var champsTechnique = document.querySelectorAll('[data-role="se-technique"]');
  var champsTempo = document.querySelectorAll('[data-role="se-tempo"]');
  for (var i = 0; i < champsPoids.length; i++) {
    var idx = parseInt(champsPoids[i].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx].poids = parseFloat(champsPoids[i].value) || 0;
  }
  for (var j = 0; j < champsReps.length; j++) {
    var idx2 = parseInt(champsReps[j].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx2].reps = parseInt(champsReps[j].value, 10) || 0;
  }
  for (var k = 0; k < champsSeries.length; k++) {
    var idx3 = parseInt(champsSeries[k].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx3].series = parseInt(champsSeries[k].value, 10) || 1;
  }
  for (var m = 0; m < champsStructure.length; m++) {
    var idx4 = parseInt(champsStructure[m].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx4].structure = champsStructure[m].value;
  }
  for (var n = 0; n < champsTechnique.length; n++) {
    var idx5 = parseInt(champsTechnique[n].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx5].technique = champsTechnique[n].value;
  }
  for (var o = 0; o < champsTempo.length; o++) {
    var idx6 = parseInt(champsTempo[o].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx6].tempo = champsTempo[o].value;
  }
}

function ajouterExerciceASeance() {
  memoriserChampsSeanceEnCours();
  var select = document.getElementById('select-ajout-exercice-seance');
  var idChoisi = select.value;
  if (!idChoisi) { return; }
  var exRef = trouverParId(etat.exercices, idChoisi);
  seanceEnConstruction.exercices.push({
    exerciceId: idChoisi,
    poids: exRef.poidsDefaut,
    structure: 'lineaire',
    technique: 'aucune',
    tempo: '',
    reps: exRef.repsDefaut,
    series: exRef.seriesDefaut
  });
  rendreFormulaireSeance();
}

function retirerExerciceDeSeance(index) {
  memoriserChampsSeanceEnCours();
  seanceEnConstruction.exercices.splice(index, 1);
  rendreFormulaireSeance();
}

function enregistrerSeance() {
  memoriserChampsSeanceEnCours();
  var nom = seanceEnConstruction.nom.trim();
  if (!nom) { afficherToast('Le nom de la séance est obligatoire.'); return; }
  if (seanceEnConstruction.exercices.length === 0) { afficherToast('Ajoute au moins un exercice à la séance.'); return; }
  if (seanceEnConstruction.id) {
    var seance = trouverParId(etat.seances, seanceEnConstruction.id);
    seance.nom = nom;
    seance.exercices = seanceEnConstruction.exercices;
  } else {
    etat.seances.push({ id: genererId(), nom: nom, exercices: seanceEnConstruction.exercices });
  }
  sauvegarderEtat();
  fermerModal();
  rendreSeancesBib();
}

function supprimerSeance(id) {
  demanderConfirmation('Supprimer définitivement cette séance ? Elle sera aussi retirée des programmes et de l\'agenda à venir.', function () {
    etat.seances = retirerParId(etat.seances, id);
    for (var i = 0; i < etat.programmes.length; i++) {
      etat.programmes[i].seanceIds = etat.programmes[i].seanceIds.filter(function (sid) { return sid !== id; });
    }
    etat.agenda = etat.agenda.filter(function (a) { return !(a.seanceId === id && a.statut === 'planifie'); });
    sauvegarderEtat();
    fermerModal();
    rendreSeancesBib();
  }, function () {
    ouvrirFormulaireSeance(id);
  });
}

function rendreSeancesBib() {
  var conteneur = document.getElementById('liste-seances');
  if (etat.seances.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucune séance créée. Une séance regroupe plusieurs exercices avec leurs poids/reps/séries de départ.</li>';
    return;
  }
  var html = '';
  for (var i = 0; i < etat.seances.length; i++) {
    var s = etat.seances[i];
    html += '<li class="carte" data-action="editer-seance" data-id="' + s.id + '">';
    html += '<strong>' + echapperHtml(s.nom) + '</strong>';
    html += '<div class="texte-att" style="margin-top:4px;">' + s.exercices.length + ' exercice(s)</div>';
    html += '</li>';
  }
  conteneur.innerHTML = html;
}

/* ============================================================
   BLOC 10 : PROGRAMMES
   ============================================================ */

var programmeEnConstruction = null;

function ouvrirFormulaireProgramme(idProgramme) {
  var progExistant = idProgramme ? trouverParId(etat.programmes, idProgramme) : null;
  programmeEnConstruction = progExistant
    ? {
        id: progExistant.id,
        nom: progExistant.nom,
        notes: progExistant.notes || '',
        seanceIds: progExistant.seanceIds.slice(),
        typeMesocycle: progExistant.typeMesocycle || 'personnalise',
        dureeSemaines: progExistant.dureeSemaines || '',
        objectif: progExistant.objectif || ''
      }
    : { id: null, nom: '', notes: '', seanceIds: [], typeMesocycle: 'personnalise', dureeSemaines: '', objectif: '' };
  rendreFormulaireProgramme();
}

function rendreFormulaireProgramme() {
  var estModif = !!programmeEnConstruction.id;
  var html = '';
  html += '<div class="modal-entete"><h2>' + (estModif ? 'Modifier le programme' : 'Nouveau programme') + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><label>Nom du programme</label><input type="text" id="champ-pr-nom" value="' + echapperHtml(programmeEnConstruction.nom) + '" placeholder="ex. Force 5x5"></div>';
  html += '<div class="champ"><label>Objectif actuel</label><textarea id="champ-pr-objectif" placeholder="ex. Prise de masse, force sur squat, perte de gras...">' + echapperHtml(programmeEnConstruction.objectif) + '</textarea></div>';
  html += '<div class="champ"><label>Type de mésocycle</label><select id="champ-pr-type">' + optionsListeValeurLibelle(TYPES_MESOCYCLE, programmeEnConstruction.typeMesocycle) + '</select></div>';
  html += '<div class="champ"><label>Durée (semaines, optionnel)</label><input type="number" step="1" min="1" id="champ-pr-duree" value="' + echapperHtml(programmeEnConstruction.dureeSemaines) + '" placeholder="ex. 6"></div>';
  html += '<div class="champ"><label>Notes (optionnel)</label><textarea id="champ-pr-notes">' + echapperHtml(programmeEnConstruction.notes) + '</textarea></div>';
  html += '<div class="champ"><label>Séances incluses</label>';
  if (etat.seances.length === 0) {
    html += '<div class="texte-att">Crée d\'abord des séances dans l\'onglet Séances.</div>';
  } else {
    for (var i = 0; i < etat.seances.length; i++) {
      var s = etat.seances[i];
      var coche = programmeEnConstruction.seanceIds.indexOf(s.id) !== -1 ? ' checked' : '';
      html += '<div class="case-liste"><input type="checkbox" data-role="pr-seance" data-id="' + s.id + '"' + coche + '><span>' + echapperHtml(s.nom) + '</span></div>';
    }
  }
  html += '</div>';
  html += '<button class="btn btn-plein btn-bloc" style="margin-top:10px;" data-action="enregistrer-programme">Enregistrer le programme</button>';
  if (estModif) {
    if (etat.programmeActif && etat.programmeActif.programmeId === programmeEnConstruction.id) {
      html += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="arreter-programme">Arrêter ce programme (en cours)</button>';
    } else {
      html += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="demarrer-programme" data-id="' + programmeEnConstruction.id + '">Démarrer ce programme</button>';
    }
    html += '<button class="btn btn-alerte btn-bloc" style="margin-top:8px;" data-action="supprimer-programme" data-id="' + programmeEnConstruction.id + '">Supprimer ce programme</button>';
  }
  ouvrirModal(html);
}

function enregistrerProgramme() {
  var nom = document.getElementById('champ-pr-nom').value.trim();
  if (!nom) { afficherToast('Le nom du programme est obligatoire.'); return; }
  var notes = document.getElementById('champ-pr-notes').value;
  var objectif = document.getElementById('champ-pr-objectif').value;
  var typeMesocycle = document.getElementById('champ-pr-type').value;
  var dureeBrute = parseInt(document.getElementById('champ-pr-duree').value, 10);
  var dureeSemaines = (!isNaN(dureeBrute) && dureeBrute > 0) ? dureeBrute : null;
  var cases = document.querySelectorAll('[data-role="pr-seance"]');
  var seanceIds = [];
  for (var i = 0; i < cases.length; i++) {
    if (cases[i].checked) { seanceIds.push(cases[i].getAttribute('data-id')); }
  }
  if (programmeEnConstruction.id) {
    var prog = trouverParId(etat.programmes, programmeEnConstruction.id);
    prog.nom = nom; prog.notes = notes; prog.seanceIds = seanceIds;
    prog.typeMesocycle = typeMesocycle; prog.dureeSemaines = dureeSemaines;
    prog.objectif = objectif;
  } else {
    etat.programmes.push({ id: genererId(), nom: nom, notes: notes, seanceIds: seanceIds, typeMesocycle: typeMesocycle, dureeSemaines: dureeSemaines, objectif: objectif });
  }
  sauvegarderEtat();
  fermerModal();
  rendreProgrammesBib();
}

function supprimerProgramme(id) {
  demanderConfirmation('Supprimer ce programme ? Les séances qu\'il contient ne seront pas supprimées.', function () {
    etat.programmes = retirerParId(etat.programmes, id);
    if (etat.programmeActif && etat.programmeActif.programmeId === id) { etat.programmeActif = null; }
    sauvegarderEtat();
    fermerModal();
    rendreProgrammesBib();
  }, function () {
    ouvrirFormulaireProgramme(id);
  });
}

function demarrerProgramme(id) {
  var prog = trouverParId(etat.programmes, id);
  if (!prog) { return; }
  var executerDemarrage = function () {
    var dateDebut = formaterDateISO(new Date());
    etat.programmeActif = { programmeId: id, dateDebut: dateDebut, dateDernierObjectif: dateDebut };
    etat.historiqueProgrammes.push({ programmeId: id, type: prog.typeMesocycle || 'personnalise', dateDebut: dateDebut });
    sauvegarderEtat();
    fermerModal();
    rendreProgrammesBib();
  };
  if (etat.programmeActif && etat.programmeActif.programmeId !== id) {
    demanderConfirmation('Un autre programme est déjà en cours. Le remplacer par celui-ci ?', executerDemarrage, function () {
      ouvrirFormulaireProgramme(id);
    });
  } else {
    executerDemarrage();
  }
}

function arreterProgrammeActif() {
  demanderConfirmation('Arrêter le programme en cours ?', function () {
    etat.programmeActif = null;
    sauvegarderEtat();
    fermerModal();
    rendreProgrammesBib();
  }, function () {
    ouvrirFormulaireProgramme(etat.programmeActif ? etat.programmeActif.programmeId : null);
  });
}

function rendreProgrammesBib() {
  var conteneur = document.getElementById('liste-programmes');
  if (etat.programmes.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucun programme. Un programme regroupe plusieurs séances (ex. Push / Pull / Legs).</li>';
    return;
  }
  var html = '';
  for (var i = 0; i < etat.programmes.length; i++) {
    var p = etat.programmes[i];
    var estActif = etat.programmeActif && etat.programmeActif.programmeId === p.id;
    html += '<li class="carte" data-action="editer-programme" data-id="' + p.id + '">';
    html += '<div class="ligne"><strong>' + echapperHtml(p.nom) + '</strong>';
    if (estActif) { html += '<span class="badge-technique badge-record">En cours</span>'; }
    html += '</div>';
    html += '<div class="texte-att" style="margin-top:4px;">' + p.seanceIds.length + ' séance(s) · ' + echapperHtml(libelleDepuisValeur(TYPES_MESOCYCLE, p.typeMesocycle || 'personnalise'));
    if (p.dureeSemaines) { html += ' · ' + p.dureeSemaines + ' semaines'; }
    html += '</div>';
    html += '</li>';
  }
  conteneur.innerHTML = html;
}

/* ============================================================
   BLOC 11 : AGENDA
   ============================================================ */

var moisAffiche = new Date();
moisAffiche.setDate(1);
var jourSelectionneISO = formaterDateISO(new Date());

function changerMois(delta) {
  moisAffiche.setMonth(moisAffiche.getMonth() + delta);
  rendreCalendrier();
}

function entreesPourDate(dateISO) {
  return etat.agenda.filter(function (a) { return a.date === dateISO; });
}

function seanceEstComplete(entree) {
  if (!entree.resultat) { return false; }
  for (var i = 0; i < entree.resultat.exercices.length; i++) {
    var series = entree.resultat.exercices[i].series;
    if (series.length === 0) { continue; }
    for (var j = 0; j < series.length; j++) {
      if (!series[j].fait) { return false; }
    }
  }
  return true;
}

function objectifsNutritionAtteints(dateISO) {
  var totaux = calculerTotauxJour(dateISO);
  var entrees = etat.journalAlimentaire[dateISO] || [];
  if (entrees.length === 0) { return false; }
  return totaux.proteines >= (etat.profil.objectifProteines || 0) &&
    totaux.glucides >= (etat.profil.objectifGlucides || 0) &&
    totaux.lipides >= (etat.profil.objectifLipides || 0);
}

function rendreCalendrier() {
  var noms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  document.getElementById('cal-libelle-mois').innerHTML = noms[moisAffiche.getMonth()] + ' ' + moisAffiche.getFullYear();

  var premierJourMois = new Date(moisAffiche.getFullYear(), moisAffiche.getMonth(), 1);
  var nbJoursMois = new Date(moisAffiche.getFullYear(), moisAffiche.getMonth() + 1, 0).getDate();
  var decalage = (premierJourMois.getDay() + 6) % 7;

  var aujourdHuiISO = formaterDateISO(new Date()); // AJOUT

  var html = '';
  var libellesJours = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  for (var lj = 0; lj < 7; lj++) {
    html += '<div class="cal-jour-libelle">' + libellesJours[lj] + '</div>';
  }

  for (var vide = 0; vide < decalage; vide++) {
    html += '<div class="cal-jour cal-jour-vide"><div class="cal-jour-bouton">-</div></div>';
  }

  for (var jour = 1; jour <= nbJoursMois; jour++) {
    var dateISO = formaterDateISO(new Date(moisAffiche.getFullYear(), moisAffiche.getMonth(), jour));
    var entrees = entreesPourDate(dateISO);
    var aPrevu = entrees.some(function (e) { return e.statut === 'planifie'; });
    var entreesTermineesJour = entrees.filter(function (e) { return e.statut === 'termine'; });
    var aFaitComplet = entreesTermineesJour.some(function (e) { return seanceEstComplete(e); });
    var aFaitIncomplet = entreesTermineesJour.some(function (e) { return !seanceEstComplete(e); });
    var aPiscine = !!etat.piscine[dateISO];
    var aNutrition = objectifsNutritionAtteints(dateISO);
    var checklistFaite = checklistEstComplete(dateISO);
    var classeSelect = (dateISO === jourSelectionneISO) ? ' cal-jour-select' : '';
    var classeAujourdhui = (dateISO === aujourdHuiISO) ? ' cal-jour-aujourdhui' : ''; // AJOUT
    html += '<div class="cal-jour' + classeSelect + classeAujourdhui + '">'; // MODIF
    html += '<button class="cal-jour-bouton" data-action="selectionner-jour" data-date="' + dateISO + '">' + jour + '</button>';
    html += '<div class="cal-marqueurs">';
    if (aPrevu) { html += '<span class="cal-point cal-point-prevu"></span>'; }
    if (aFaitComplet) { html += '<span class="cal-point cal-point-fait"></span>'; }
    if (aFaitIncomplet) { html += '<span class="cal-point cal-point-incomplet"></span>'; }
    if (aPiscine) { html += '<span class="cal-point cal-point-piscine"></span>'; }
    if (aNutrition) { html += '<span class="cal-point cal-point-nutrition"></span>'; }
    if (checklistFaite) { html += '<span class="cal-point cal-point-checklist"></span>'; }
    html += '</div></div>';
  }
  document.getElementById('cal-grille').innerHTML = html;
}

function selectionnerJour(dateISO) {
  jourSelectionneISO = dateISO;
  rendreCalendrier();
  rendreJourSelectionne();
}

function rendreJourSelectionne() {
  document.getElementById('agenda-jour-titre').innerHTML = formaterDateLisible(jourSelectionneISO);
  var caseP = document.getElementById('case-piscine-jour');
  if (caseP) { caseP.checked = !!etat.piscine[jourSelectionneISO]; }
  var entrees = entreesPourDate(jourSelectionneISO);
  var conteneur = document.getElementById('agenda-liste-jour');
  if (entrees.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Rien de planifié ce jour-là.</li>';
    return;
  }
  var html = '';
  for (var i = 0; i < entrees.length; i++) {
    html += rendreLigneAgenda(entrees[i]);
  }
  conteneur.innerHTML = html;
}

function basculerPiscine() {
  if (etat.piscine[jourSelectionneISO]) {
    delete etat.piscine[jourSelectionneISO];
  } else {
    etat.piscine[jourSelectionneISO] = true;
  }
  sauvegarderEtat();
  rendreCalendrier();
}

function rendreLigneAgenda(entree) {
  var seance = trouverParId(etat.seances, entree.seanceId);
  var nomSeance = seance ? seance.nom : '(séance supprimée)';
  var estFait = entree.statut === 'termine';
  var complete = estFait && seanceEstComplete(entree);
  var etatClasse = estFait ? (complete ? 'hist-fait' : 'hist-incomplet') : 'hist-prevu';
  var html = '<li class="hist-ligne ' + etatClasse + '"' + (estFait ? ' data-action="voir-detail-historique" data-id="' + entree.id + '"' : '') + '>';
  html += '<div class="hist-ligne-corps"><strong class="hist-ligne-titre">' + echapperHtml(nomSeance) + '</strong>';
  if (estFait) {
    var infos = [];
    if (entree.dureeMinutes) { infos.push(entree.dureeMinutes + ' min'); }
    if (entree.caloriesEstimees) { infos.push(Math.round(entree.caloriesEstimees) + ' kcal'); }
    html += '<span class="hist-ligne-sous donnee-num">' + (complete ? 'Complète' : 'Incomplète') + (infos.length ? ' · ' + infos.join(' · ') : '') + '</span>';
  } else {
    html += '<span class="hist-ligne-sous">Prévue</span>';
  }
  html += '</div>';
  if (!estFait) {
    html += '<button class="btn btn-plein btn-petit" data-action="demarrer-depuis-agenda" data-id="' + entree.id + '">Début</button>';
    html += '<button class="hist-ligne-suppr" data-action="annuler-agenda" data-id="' + entree.id + '" title="Retirer de l\'agenda" aria-label="Retirer de l\'agenda">&times;</button>';
  } else {
    html += '<span class="hist-ligne-chevron">&#8250;</span>';
  }
  html += '</li>';
  return html;
}

var MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
var MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function rendreAVenir() {
  var aujourdHui = formaterDateISO(new Date());
  var entrees = etat.agenda.filter(function (a) { return a.statut === 'planifie' && a.date >= aujourdHui; });
  entrees.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  entrees = entrees.slice(0, 6);
  var conteneur = document.getElementById('agenda-liste-avenir');
  if (entrees.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucune séance planifiée à venir.</li>';
    return;
  }
  var html = '';
  for (var i = 0; i < entrees.length; i++) {
    var seance = trouverParId(etat.seances, entrees[i].seanceId);
    var d = dateDepuisISO(entrees[i].date);
    var ecart = Math.round((d - dateDepuisISO(aujourdHui)) / 86400000);
    var relatif = ecart === 0 ? 'Aujourd\'hui' : (ecart === 1 ? 'Demain' : 'Dans ' + ecart + ' jours');
    html += '<li class="hist-ligne hist-prevu">';
    html += '<span class="hist-date"><span class="hist-date-j donnee-num">' + d.getDate() + '</span><span class="hist-date-m">' + MOIS_COURTS[d.getMonth()] + '</span></span>';
    html += '<div class="hist-ligne-corps"><strong class="hist-ligne-titre">' + echapperHtml(seance ? seance.nom : '-') + '</strong><span class="hist-ligne-sous">' + relatif + '</span></div>';
    html += '</li>';
  }
  conteneur.innerHTML = html;
}

function ouvrirFormulairePlanification() {
  var html = '';
  html += '<div class="modal-entete"><h2>Planifier une séance</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><label>Date</label><input type="date" id="champ-pl-date" value="' + jourSelectionneISO + '"></div>';
  html += '<div class="champ"><label>Séance</label><select id="champ-pl-seance">';
  if (etat.seances.length === 0) {
    html += '<option value="">Crée d\'abord une séance</option>';
  } else {
    for (var i = 0; i < etat.seances.length; i++) {
      html += '<option value="' + etat.seances[i].id + '">' + echapperHtml(etat.seances[i].nom) + '</option>';
    }
  }
  html += '</select></div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="confirmer-planification">Planifier</button>';
  ouvrirModal(html);
}

function confirmerPlanification() {
  var date = document.getElementById('champ-pl-date').value;
  var seanceId = document.getElementById('champ-pl-seance').value;
  if (!date || !seanceId) { afficherToast('Choisis une date et une séance.'); return; }
  etat.agenda.push({ id: genererId(), date: date, seanceId: seanceId, statut: 'planifie', caloriesEstimees: 0, dureeMinutes: 0, resultat: null });
  sauvegarderEtat();
  fermerModal();
  jourSelectionneISO = date;
  rendreCalendrier();
  rendreJourSelectionne();
  rendreAVenir();
}

function annulerAgenda(id) {
  demanderConfirmation('Retirer cette séance de l\'agenda ?', function () {
    etat.agenda = retirerParId(etat.agenda, id);
    sauvegarderEtat();
    fermerModal();
    rendreCalendrier();
    rendreJourSelectionne();
    rendreAVenir();
  });
}

function rendreCarteSeanceJour() {
  var conteneur = document.getElementById('zone-carte-seance-jour');
  if (!conteneur) { return; }

  var aujourdHui = formaterDateISO(new Date());
  var entrees = entreesPourDate(aujourdHui);
  var entreeJour = null;
  for (var i = 0; i < entrees.length; i++) {
    if (entrees[i].statut === 'planifie') { entreeJour = entrees[i]; break; }
  }

  var html = '';

  if (entreeJour) {
    var seance = trouverParId(etat.seances, entreeJour.seanceId);
    var nomSeance = seance ? seance.nom : '(séance supprimée)';
    html += '<div class="accueil-carte seance-a-faire" data-action="demarrer-depuis-agenda" data-id="' + entreeJour.id + '">';
    html += genererParticules(100);
    html += '<div class="accueil-icone">' + (etat.profil.theme === 'steampunk' ? htmlOrbeSteampunk() : '') + '<img src="images/seance-prevue.png" alt="Séance prévue"></div>';
    html += '<div>';
    html += '<h2 class="titre-affichage">Séance prévue</h2>';
    html += '<p class="texte-att">' + echapperHtml(nomSeance) + '</p>';
    html += '</div></div>';
  } else {
    html += '<div class="accueil-carte" data-action="aller-page" data-page="seance">';
    html += '<div class="accueil-icone"><img src="images/seance-non-prevue.png" alt="Nouvelle séance"></div>';
    html += '<div>';
    html += '<h2 class="titre-affichage">Séances</h2>';
    html += '<p class="texte-att">Démarre une séance planifiée ou libre</p>';
    html += '</div></div>';
  }

  conteneur.innerHTML = '<div class="seance-cadre">' + html + '</div>';
  var carteAura = conteneur.querySelector('.accueil-carte.seance-a-faire');
  if (carteAura && etat.profil.theme === 'effroi') { demarrerAuraEffroi(carteAura); } else { arreterAuraEffroi(); }
}

var PARTICULES_PAR_THEME = {
  automnal: ['🍂', '🍁', '🌰', '🍁', '🍄'],
  hivernal: ['❄', '❅', '❆'],
  paindepice: ['⭐', '🌟', '🍪', '💝', '🎁', '🎄'],
  printanier: ['🌸', '🌷', '🦋', '🍀', '🍃', '🌻', '🧚‍♀️'],
  pastel: ['🔔', '🌼', '🌷', '🧁', '🍩'],
  estival: ['☀️', '🌴', '🍉', '🍹', '🥭', '🍍', '🍧'],
  cyberpunk: ['⚡', '💠', '🔷'],
  steampunk: ['⚙', '🕰', '🔧'],
  flibuste: ['⚓', '🦜', '💰', '🗝️', '☠️', '🦑', '🧭'],
  ruedor: ['🤠', '🌵', '⭐', '🐎', '🐂', '🥾', '🌾']
};

/* Wasteland : étincelles de soudure, flammes et fumée noire qui sortent de l'icône */
/* Wasteland : lance-flammes vers la droite, gerbe d'étincelles (traits fins), fumée noire envahissante */
/* Planche de 8 images de flamme (jet vers la droite), générée une seule fois */
var spriteFlammes = false;

/* Planche de 8 images : flammes en lames acérées (style manga, inspirées du logo) */
var spriteFlammes = false;

/* Planche de 8 images : flammes en losanges courbes (inspirées du logo) */
var spriteFlammes = false;

/* Planche de 8 images : flammes à 4 lames en croissant, courbées vers le haut */
var spriteFlammes = false;
var FLAMMES_MIROIR = false;   /* true = les 2 lames du bas se courbent vers le bas (symétrie avec celles du haut) */

function construireSpriteFlammes() {
  if (spriteFlammes) { return; }
  spriteFlammes = true;
  var N = 8, Wf = 260, Hf = 140, by = 100;

  function r(min, max) { return min + Math.random() * (max - min); }

  /* Croissant : pointu aux 2 bouts, un bord bombé, l'autre presque droit.
     up = relèvement de la lame en degrés ; sens = 1 (courbe vers le haut) ou -1 (vers le bas) */
  function lame(ox, oy, L, W, up, sens, fill) {
    var d = 'M0,0 Q' + (L * 0.5).toFixed(1) + ',' + W.toFixed(1) + ' ' + L.toFixed(1) + ',0 Q' + (L * 0.5).toFixed(1) + ',' + (W * 0.3).toFixed(1) + ' 0,0Z';
    var rot = (sens === 1) ? 'rotate(' + (-up).toFixed(1) + ')' : 'rotate(' + up.toFixed(1) + ') scale(1,-1)';
    return '<path transform="translate(' + ox.toFixed(1) + ',' + oy.toFixed(1) + ') ' + rot + '" d="' + d + '" fill="url(#' + fill + ')"/>';
  }

  var sensBas = FLAMMES_MIROIR ? -1 : 1;
  var corps = '';
  for (var k = 0; k < N; k++) {
    var ox = k * Wf + 2;
    var lames = [
      { y: by - 6,  up: r(38, 46), L: r(95, 115),  W: r(44, 56), s: 1 },
      { y: by - 1,  up: r(27, 34), L: r(120, 145), W: r(40, 50), s: 1 },
      { y: by + 6,  up: r(14, 21), L: r(125, 155), W: r(36, 46), s: sensBas },
      { y: by + 12, up: r(5, 10),  L: r(110, 140), W: r(30, 40), s: sensBas }
    ];
    var i;
    /* Couche extérieure : rouge-orangé */
    for (i = 0; i < 4; i++) { corps += lame(ox, lames[i].y, lames[i].L, lames[i].W, lames[i].up, lames[i].s, 'gO'); }
    /* Couche médiane : orange-jaune, plus courte et plus fine */
    for (i = 0; i < 4; i++) { corps += lame(ox, lames[i].y, lames[i].L * 0.72, lames[i].W * 0.62, lames[i].up, lames[i].s, 'gM'); }
    /* Cœur clair : 2 lames centrales */
    for (i = 1; i < 3; i++) { corps += lame(ox, lames[i].y, lames[i].L * 0.42, lames[i].W * 0.38, lames[i].up, lames[i].s, 'gI'); }
    /* 1 ou 2 petits éclats détachés */
    var nb = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (i = 0; i < nb; i++) {
      corps += lame(ox + r(130, 200), by - r(20, 75), r(16, 28), r(8, 12), r(25, 50), 1, Math.random() < 0.5 ? 'gO' : 'gM');
    }
  }

  var defs = '<defs>' +
    '<linearGradient id="gO" x1="0" x2="1" y1="0.3" y2="0.7"><stop offset="0" stop-color="#FF8A1A"/><stop offset="1" stop-color="#E8300F"/></linearGradient>' +
    '<linearGradient id="gM" x1="0" x2="1" y1="0.3" y2="0.7"><stop offset="0" stop-color="#FFC21A"/><stop offset="1" stop-color="#FF6A14"/></linearGradient>' +
    '<linearGradient id="gI" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#FFF6C8"/><stop offset="1" stop-color="#FFC21A"/></linearGradient>' +
    '</defs>';
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (N * Wf) + '" height="' + Hf + '" viewBox="0 0 ' + (N * Wf) + ' ' + Hf + '">' + defs + corps + '</svg>';

  var style = document.createElement('style');
  style.id = 'wl-sprite-style';
  style.appendChild(document.createTextNode('.wl-flamme-sprite{background-image:url("data:image/svg+xml,' + encodeURIComponent(svg) + '");}'));
  document.head.appendChild(style);
}

/* Wasteland : lance-flammes (images en boucle), gerbe d'étincelles, fumée noire */
function genererParticulesWasteland() {
  construireSpriteFlammes();
  var html = '<div class="particules">';
  var i, dur, taille, tx, ty, ang, rad, dist, len;

  /* Lueur du foyer, derrière l'icône */
  html += '<span class="wl wl-lueur"></span>';

  /* Fumée noire : nuages bombés, naissent au bord gauche et filent vers la droite et le haut */
  var formesNuage = ['a', 'b', 'c'];
  for (i = 0; i < 7; i++) {
    taille = alea(60, 120);
    dur = alea(1.3, 2.6);
    html += '<span class="wl wl-fumee wl-fumee-' + formesNuage[Math.floor(Math.random() * 3)] + '" style="width:' + taille.toFixed(0) + 'px;height:' + (taille * 0.7).toFixed(0) + 'px;' +
      'margin-left:-' + alea(15, 50).toFixed(0) + 'px;margin-top:' + alea(0, 28).toFixed(0) + 'px;' +
      'animation-duration:' + dur.toFixed(2) + 's;animation-delay:-' + (Math.random() * dur).toFixed(2) + 's;' +
      '--tx:' + alea(110, 300).toFixed(0) + 'px;--ty:-' + alea(70, 150).toFixed(0) + 'px;"></span>';
  }

  /* Jet de flammes : 3 jets superposés, images décalées pour ne pas vaciller en même temps */
  var jets = [
    { s: 1,    r: 0,  ph: 0 },
    { s: 0.75, r: -6, ph: 0.15 }
  ];
  for (i = 0; i < jets.length; i++) {
    html += '<span class="wl wl-flamme-sprite" style="transform:rotate(' + jets[i].r + 'deg) scale(' + jets[i].s + ');animation-delay:-' + jets[i].ph + 's;"></span>';
  }

  /* Étincelles : traits fins */
  for (i = 0; i < 24; i++) {
    ang = alea(-60, 45);
    rad = ang * Math.PI / 180;
    dist = alea(90, 240);
    len = alea(10, 24);
    dur = alea(0.35, 0.8);
    tx = Math.cos(rad) * dist;
    ty = Math.sin(rad) * dist + alea(15, 45);
    html += '<span class="wl wl-etincelle" style="width:' + len.toFixed(0) + 'px;margin-left:-' + (len / 2).toFixed(0) + 'px;' +
      'animation-duration:' + dur.toFixed(2) + 's;animation-delay:-' + (Math.random() * dur).toFixed(2) + 's;' +
      '--rot:' + ang.toFixed(0) + 'deg;--mx:' + (tx * 0.65).toFixed(0) + 'px;--my:' + (Math.sin(rad) * dist * 0.65).toFixed(0) + 'px;' +
      '--tx:' + tx.toFixed(0) + 'px;--ty:' + ty.toFixed(0) + 'px;"></span>';
  }

  html += '</div>';
  return html;
}

/* ============================================================
   EFFROI : aura maléfique + limon tentaculaire autour de l'icône (carte séance prévue)
   Les tentacules sont dessinées à chaque image sur un canvas : une onde tordue part de la
   base et remonte vers la pointe. Elles dépassent de la carte en haut, en bas et à gauche.
   ============================================================ */
var AURA_EFFROI = { tentacules: 12, filaments: 9, fps: 25, vortex: 350 };   /* baisse ces nombres pour alléger */
var auraEffroi = null;

function arreterAuraEffroi() {
  if (auraEffroi) { auraEffroi.actif = false; auraEffroi = null; }
}

/* Spirale du vortex : 3 bras qui s'enroulent vers le centre */
function svgSpiraleVortex() {
  var s = '<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke-linecap="round">';
  for (var b = 0; b < 3; b++) {
    var pts = '';
    for (var k = 0; k <= 44; k++) {
      var t = k / 44;
      var th = b * 2.0944 + t * 5.9;
      var r = 30 + 62 * t;
      pts += (k === 0 ? 'M' : 'L') + (Math.cos(th) * r).toFixed(1) + ',' + (Math.sin(th) * r).toFixed(1) + ' ';
    }
    s += '<path d="' + pts + '" stroke="#B020FF" stroke-opacity=".3" stroke-width="9"/>';
    s += '<path d="' + pts + '" stroke="#FF4AD8" stroke-opacity=".6" stroke-width="2.2" stroke-dasharray="16 5 4 8"/>';
  }
  return s + '</g></svg>';
}

function demarrerAuraEffroi(carte) {
  arreterAuraEffroi();
  var cont = carte ? carte.querySelector('.ef-aura-zone') : null;
  if (!cont) { return; }
  var icone = carte.querySelector('.accueil-icone');
  var zr = carte.getBoundingClientRect();
  var W = Math.round(zr.width) || 340, H = Math.round(zr.height) || 92;
  var ir = icone ? icone.getBoundingClientRect() : null;
  var cx = (ir && ir.width) ? ir.left - zr.left + ir.width / 2 : 56;
  var cy = (ir && ir.height) ? ir.top - zr.top + ir.height / 2 : H / 2;
  var R0 = 30;                                   /* les tentacules naissent sous l'icône */

  /* Vortex derrière l'icône */
  var V = AURA_EFFROI.vortex;
  var vortex = document.createElement('span');
  vortex.className = 'ef-vortex';
  vortex.style.cssText = 'left:' + cx.toFixed(0) + 'px;top:' + cy.toFixed(0) + 'px;width:' + V + 'px;height:' + V + 'px;margin:-' + (V / 2) + 'px 0 0 -' + (V / 2) + 'px;';
  vortex.innerHTML = '<span class="ef-spirale">' + svgSpiraleVortex() + '</span>';
  cont.appendChild(vortex);

  /* Canvas des tentacules : exactement la taille de la carte, rien ne dépasse */
  var echelle = Math.min(window.devicePixelRatio || 1, 1.5);
  var cv = document.createElement('canvas');
  cv.width = Math.round(W * echelle);
  cv.height = Math.round(H * echelle);
  cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;';
  cont.appendChild(cv);
  var ctx = cv.getContext('2d');
  if (!ctx) { return; }
  ctx.scale(echelle, echelle);

  /* a = angle en degrés (0 = droite, négatif = vers le haut), L = longueur, w = épaisseur */
  var modeles = [
    { a: -38, L: 190, w: 9 }, { a: 28, L: 210, w: 8 }, { a: -62, L: 110, w: 8 }, { a: 66, L: 105, w: 8 },
    { a: -14, L: 250, w: 6 }, { a: 12, L: 240, w: 6 }, { a: 44, L: 150, w: 7 }, { a: -150, L: 60, w: 6 }, { a: 152, L: 58, w: 6 }
  ].slice(0, AURA_EFFROI.tentacules);
  var tentacules = [], filaments = [], i;
  for (i = 0; i < modeles.length; i++) {
    tentacules.push({
      base: modeles[i].a * Math.PI / 180, L: modeles[i].L, w: modeles[i].w,
      amp: alea(0.5, 0.85), f: alea(1, 1.8), v: alea(1.2, 2.4), ph: alea(0, 6.28)
    });
  }
  for (i = 0; i < AURA_EFFROI.filaments; i++) {
    filaments.push({
      base: ((i % 5 < 3) ? alea(-80, 80) : alea(0, 360)) * Math.PI / 180,
      L: alea(55, 140), amp: alea(0.8, 1.5), f: alea(1.5, 2.6), v: alea(1.6, 3), ph: alea(0, 6.28)
    });
  }

  /* Ligne brisée dont l'angle ondule le long du corps : plus on va vers la pointe, plus ça se tord */
  function courbe(x0, y0, base, L, amp, f, v, ph, tt, n) {
    var pts = [[x0, y0]], x = x0, y = y0, dl = L / n;
    for (var s = 1; s <= n; s++) {
      var u = s / n;
      var ang = base + amp * u * (Math.sin(f * u * 6.283 - tt * v + ph) + 0.45 * Math.sin(f * 2.3 * u * 6.283 - tt * v * 1.7 + ph * 2));
      x += Math.cos(ang) * dl;
      y += Math.sin(ang) * dl;
      pts.push([x, y]);
    }
    return pts;
  }

  var etatAura = { actif: true };
  auraEffroi = etatAura;
  var dernier = 0, pas = 1000 / AURA_EFFROI.fps;

  function image(temps) {
    if (!etatAura.actif) { return; }
    if (!document.body.contains(cv) || document.documentElement.getAttribute('data-theme') !== 'effroi') { etatAura.actif = false; return; }
    window.requestAnimationFrame(image);
    if (temps - dernier < pas || document.hidden || !cv.offsetParent) { return; }
    dernier = temps;
    var tt = temps / 1000, k, j;
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';

    /* Tentacules : corps noir, contour noir */
    for (k = 0; k < tentacules.length; k++) {
      var T = tentacules[k];
      var respire = 1 + 0.12 * Math.sin(tt * 0.9 + T.ph);
      var pts = courbe(cx + Math.cos(T.base) * R0, cy + Math.sin(T.base) * R0, T.base, T.L * respire, T.amp, T.f, T.v, T.ph, tt, 22);
      var gauche = [], droite = [];
      for (j = 0; j < pts.length; j++) {
        var p0 = pts[Math.max(0, j - 1)], p1 = pts[Math.min(pts.length - 1, j + 1)];
        var tx = p1[0] - p0[0], ty = p1[1] - p0[1];
        var ln = Math.sqrt(tx * tx + ty * ty) || 1;
        var nx = -ty / ln, ny = tx / ln;
        var w = T.w * Math.pow(1 - j / (pts.length - 1), 0.85) + 0.5;   /* s'effile vers la pointe */
        gauche.push([pts[j][0] + nx * w, pts[j][1] + ny * w]);
        droite.push([pts[j][0] - nx * w, pts[j][1] - ny * w]);
      }
      ctx.beginPath();
      ctx.moveTo(gauche[0][0], gauche[0][1]);
      for (j = 1; j < gauche.length; j++) { ctx.lineTo(gauche[j][0], gauche[j][1]); }
      for (j = droite.length - 1; j >= 0; j--) { ctx.lineTo(droite[j][0], droite[j][1]); }
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }

    /* Filaments fins : noirs aussi */
    ctx.lineWidth = 1.3;
    for (k = 0; k < filaments.length; k++) {
      var F = filaments[k];
      var fp = courbe(cx + Math.cos(F.base) * (R0 - 6), cy + Math.sin(F.base) * (R0 - 6), F.base, F.L, F.amp, F.f, F.v, F.ph, tt, 14);
      ctx.beginPath();
      ctx.moveTo(fp[0][0], fp[0][1]);
      for (j = 1; j < fp.length; j++) { ctx.lineTo(fp[j][0], fp[j][1]); }
      ctx.stroke();
    }
  }
  window.requestAnimationFrame(image);
}

function genererParticules(nombre) {
  if (etat.profil.theme === 'steampunk') { return genererSceneSteampunk(); }
  if (etat.profil.theme === 'wasteland') { return genererParticulesWasteland(); }
  if (etat.profil.theme === 'effroi') { return '<div class="ef-aura-zone"></div>'; }
  var jeuEmoji = PARTICULES_PAR_THEME[etat.profil.theme];
  var html = '<div class="particules">';
  for (var i = 0; i < nombre; i++) {
    var duree = jeuEmoji ? (Math.random() * 4 + 6).toFixed(2) : (Math.random() * 3 + 3).toFixed(2);
    var delai = (Math.random() * 5).toFixed(2);
    var angle = Math.random() * 360;
    var distance = jeuEmoji ? (Math.random() * 220 + 100) : (Math.random() * 40 + 20);
    var x = (Math.cos(angle * Math.PI / 180) * distance).toFixed(1);
    var y = (Math.sin(angle * Math.PI / 180) * distance).toFixed(1);

    if (jeuEmoji) {
      var emoji = jeuEmoji[Math.floor(Math.random() * jeuEmoji.length)];
      var tailleEmoji = (Math.random() * 6 + 9).toFixed(1); // 9px à 15px, plus discret
      var rotation = Math.round(Math.random() * 720 - 360); // -360deg à +360deg
      html += '<span class="particule particule-emoji" style="' +
        'font-size:' + tailleEmoji + 'px;' +
        'animation-duration:' + duree + 's;' +
        'animation-delay:' + delai + 's;' +
        '--tx:' + x + 'px;' +
        '--ty:' + y + 'px;' +
        '--rot:' + rotation + 'deg;' +
        '">' + emoji + '</span>';
    } else {
      var taille = (Math.random() * 4 + 2).toFixed(1);
      html += '<span class="particule" style="' +
        'width:' + taille + 'px;' +
        'height:' + taille + 'px;' +
        'animation-duration:' + duree + 's;' +
        'animation-delay:' + delai + 's;' +
        '--tx:' + x + 'px;' +
        '--ty:' + y + 'px;' +
        '"></span>';
    }
  }
  html += '</div>';
  return html;
}

/* ============================================================
   BLOC 12 : SEANCE ACTIVE (Début / Fin, edition en direct)
   ============================================================ */

var chronoIntervalle = null;

function demarrerSeanceDepuisModele(seanceModeleId, agendaEntryId) {
  var modele = trouverParId(etat.seances, seanceModeleId);
  if (!modele) { afficherToast('Cette séance n\'existe plus.'); return; }

  demanderEchauffement(function () {
    var exercicesActifs = modele.exercices.map(function (e) {
      var structure = e.structure || 'lineaire';
      /* Préremplissage automatique : le record (poids + reps correspondantes) sert de référence
         plutôt que les valeurs figées de la séance-modèle, tant qu'un record existe pour cet
         exercice — sinon on retombe sur les valeurs par défaut de la séance. */
      var record = meilleureSerieHistorique(e.exerciceId);
      var poidsBase = record ? record.poids : e.poids;
      var repsBase = record ? record.reps : e.reps;
      var seriesTab = genererSeriesSelonStructure(structure, poidsBase, repsBase, e.series);
      return {
        exerciceId: e.exerciceId,
        structure: structure,
        technique: e.technique || 'aucune',
        tempo: e.tempo || '',
        rpe: 3,
        series: seriesTab
      };
    });

    exercicesDeplies = {};
    etat.seanceActive = {
      seanceModeleId: seanceModeleId,
      agendaEntryId: agendaEntryId || null,
      nom: modele.nom,
      debut: Date.now(),
      exercices: exercicesActifs
    };
    sauvegarderEtat();
    allerVersPage('seance');
  });
}

function demarrerDepuisAgenda(agendaEntryId) {
  var entree = trouverParId(etat.agenda, agendaEntryId);
  if (!entree) { return; }
  demarrerSeanceDepuisModele(entree.seanceId, agendaEntryId);
}

function demarrerSeanceLibre(seanceId) {
  demarrerSeanceDepuisModele(seanceId, null);
}

function rendrePrevuAujourdHui() {
  var aujourdHui = formaterDateISO(new Date());
  var entrees = entreesPourDate(aujourdHui).filter(function (a) { return a.statut === 'planifie'; });
  var carte = document.getElementById('seance-carte-prevu');
  var liste = document.getElementById('seance-liste-prevu');
  if (!carte || !liste) { return; }
  if (entrees.length === 0) {
    carte.style.display = 'none';
    return;
  }
  carte.style.display = 'block';
  var html = '';
  for (var i = 0; i < entrees.length; i++) {
    var seance = trouverParId(etat.seances, entrees[i].seanceId);
    html += '<li class="ligne" style="padding:8px 0; border-bottom:1px solid var(--couleur-bordure);">';
    html += '<span>' + echapperHtml(seance ? seance.nom : '-') + '</span>';
    html += '<button class="btn btn-plein btn-petit" data-action="demarrer-depuis-agenda" data-id="' + entrees[i].id + '">Début</button>';
    html += '</li>';
  }
  liste.innerHTML = html;
}

function rendreDemarrageLibre() {
  var conteneur = document.getElementById('seance-liste-demarrage-libre');
  if (!conteneur) { return; }
  if (etat.seances.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Crée d\'abord une séance dans la Bibliothèque.</li>';
    return;
  }
  var html = '';
  for (var i = 0; i < etat.seances.length; i++) {
    html += '<li class="ligne" style="padding:8px 0; border-bottom:1px solid var(--couleur-bordure);">';
    html += '<span>' + echapperHtml(etat.seances[i].nom) + '</span>';
    html += '<button class="btn btn-plein btn-petit" data-action="demarrer-seance-libre" data-id="' + etat.seances[i].id + '">Début</button>';
    html += '</li>';
  }
  conteneur.innerHTML = html;
}

function couleurSommeil(valeur) {
  var points = [
    { v: 0,  c: '#000000' },
    { v: 1,  c: '#8B0000' },
    { v: 2,  c: '#FF0000' },
    { v: 3,  c: '#FF4500' },
    { v: 4,  c: '#FFA500' },
    { v: 5,  c: '#FFB300' },
    { v: 6,  c: '#FFFF00' },
    { v: 7,  c: '#00A000' },
    { v: 8,  c: '#00CFCF' },
    { v: 9,  c: '#00CFCF' },
    { v: 10, c: '#00A000' },
    { v: 11, c: '#FFFF00' },
    { v: 12, c: '#FFB300' },
    { v: 13, c: '#FFA500' },
    { v: 14, c: '#FF4500' },
    { v: 15, c: '#FF0000' },
    { v: 16, c: '#8B0000' },
    { v: 17, c: '#000000' }
  ];

  var n = parseFloat(valeur);
  if (isNaN(n)) { n = 8; }
  if (n <= 0) { return '#000000'; }
  if (n >= 17) { return '#000000'; }

  for (var i = 0; i < points.length - 1; i++) {
    if (n >= points[i].v && n <= points[i + 1].v) {
      var t = (n - points[i].v) / (points[i + 1].v - points[i].v);
      return interpolerCouleur(points[i].c, points[i + 1].c, t);
    }
  }
  return '#000000';
}

function interpolerCouleur(hexA, hexB, t) {
  var a = hexVersRgb(hexA);
  var b = hexVersRgb(hexB);
  var r = Math.round(a.r + (b.r - a.r) * t);
  var g = Math.round(a.g + (b.g - a.g) * t);
  var bl = Math.round(a.b + (b.b - a.b) * t);
  return rgbVersHex(r, g, bl);
}

function hexVersRgb(hex) {
  return {
    r: parseInt(hex.substr(1, 2), 16),
    g: parseInt(hex.substr(3, 2), 16),
    b: parseInt(hex.substr(5, 2), 16)
  };
}

function rgbVersHex(r, g, b) {
  function h(v) { var s = v.toString(16); return s.length === 1 ? '0' + s : s; }
  return '#' + h(r) + h(g) + h(b);
}

function rendreRessentiJour() {
  var aujourdHui = obtenirDateJourReference();
  var donnees = etat.ressentiQuotidien[aujourdHui] || { sommeil: 8, fatigue: 5, stress: 5, humeur: 4 };
  var champSommeil = document.getElementById('champ-ressenti-sommeil');
  var champFatigue = document.getElementById('champ-ressenti-fatigue');
  var champStress = document.getElementById('champ-ressenti-stress');
  var champHumeur = document.getElementById('champ-ressenti-humeur');
  if (!champSommeil || !champFatigue || !champStress || !champHumeur) { return; }

  champSommeil.value = donnees.sommeil;
  champFatigue.value = donnees.fatigue;
  champStress.value = donnees.stress;
  champHumeur.value = donnees.humeur;

  var ligneSommeil = document.getElementById('ligne-ressenti-sommeil');
  if (ligneSommeil) { ligneSommeil.style.color = couleurSommeil(donnees.sommeil); }

  mettreAJourApparenceSlider('fatigue', donnees.fatigue);
  mettreAJourApparenceSlider('stress', donnees.stress);
  mettreAJourApparenceSlider('humeur', donnees.humeur);

  ['colere', 'blessure', 'maladie', 'insomnie'].forEach(function (champ) {
    var bouton = document.querySelector('[data-action="basculer-booleen-ressenti"][data-champ="' + champ + '"]');
    if (bouton) {
      bouton.setAttribute('data-actif', donnees[champ] ? 'true' : 'false');
    }
  });
}

(function () {
  var ligne = document.getElementById('ligne-ressenti-sommeil');
  var champ = document.getElementById('champ-ressenti-sommeil');
  if (!ligne || !champ) return;

  var enCours = false;
  var xDepart = 0;
  var valeurDepart = 0;
  var aDeplace = false;
  var seuilPx = 20;

  function getValeur() {
    var v = parseFloat(champ.value);
    return isNaN(v) ? 8 : v;
  }

  function appliquerValeur(v) {
    v = Math.round(v * 2) / 2;
    if (v < 0) v = 0;
    if (v > 24) v = 24;
    champ.value = v;
    modifierRessenti('sommeil', v);
    ligne.style.color = couleurSommeil(v);
  }

  function demarrer(x, cible) {
    // on ignore si le geste démarre directement dans le input (pour ne pas gêner la saisie au clavier/tap simple)
    if (cible === champ) return;
    enCours = true;
    aDeplace = false;
    xDepart = x;
    valeurDepart = getValeur();
    ligne.classList.add('glisse-actif');
  }

  function deplacer(x) {
    if (!enCours) return;
    var delta = x - xDepart;
    if (Math.abs(delta) >= seuilPx) { aDeplace = true; }
    var pas = Math.trunc(delta / seuilPx);
    appliquerValeur(valeurDepart + pas * 0.5);
  }

  function terminer() {
    enCours = false;
    ligne.classList.remove('glisse-actif');
  }

  // Souris
  ligne.addEventListener('mousedown', function (e) {
    demarrer(e.clientX, e.target);
  });
  document.addEventListener('mousemove', function (e) {
    deplacer(e.clientX);
  });
  document.addEventListener('mouseup', terminer);

  // Tactile
  ligne.addEventListener('touchstart', function (e) {
    demarrer(e.touches[0].clientX, e.target);
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    deplacer(e.touches[0].clientX);
  }, { passive: true });
  document.addEventListener('touchend', terminer);
})();

function modifierRessenti(champ, valeur) {
  var aujourdHui = obtenirDateJourReference();
  if (!etat.ressentiQuotidien[aujourdHui]) {
    etat.ressentiQuotidien[aujourdHui] = { sommeil: 7, fatigue: 5, stress: 5, humeur: 4 };
  }
  if (champ === 'sommeil') {
    etat.ressentiQuotidien[aujourdHui][champ] = parseFloat(valeur);
    if (isNaN(etat.ressentiQuotidien[aujourdHui][champ])) { etat.ressentiQuotidien[aujourdHui][champ] = 7; }
    var elementValeur = document.getElementById('valeur-ressenti-sommeil');
    if (elementValeur) { elementValeur.innerHTML = etat.ressentiQuotidien[aujourdHui][champ]; }
  } else {
    var niveau = parseInt(valeur, 10);
    if (isNaN(niveau)) { niveau = 4; }
    etat.ressentiQuotidien[aujourdHui][champ] = niveau;
    mettreAJourApparenceSlider(champ, niveau);
  }
  sauvegarderEtat();
}

function mettreAJourApparenceSlider(champ, valeur) {
  var couleur = COULEURS_NIVEAU[valeur];
  var input = document.getElementById('champ-ressenti-' + champ);
  var rond = document.getElementById('rond-ressenti-' + champ);
  var emoji;
  if (champ === 'fatigue') { emoji = EMOJIS_FATIGUE[valeur]; }
  else if (champ === 'stress') { emoji = EMOJIS_STRESS[valeur]; }
  else { emoji = EMOJIS_HUMEUR[valeur]; }

  if (rond) {
    rond.innerHTML = emoji;
    rond.style.borderColor = couleur;
    rond.style.setProperty('--couleur-progression', couleur);
  }
  if (input) {
    var pourcentage = (valeur / 8) * 100;
    input.style.setProperty('--couleur-progression', couleur);
    input.style.background = 'linear-gradient(to right, ' + couleur + ' 0%, ' + couleur + ' ' + pourcentage + '%, var(--ress-piste) ' + pourcentage + '%, var(--ress-piste) 100%)';
  }
}

function initialiserBooleensRessenti() {
  var aujourdHui = obtenirDateJourReference();
  var donneesJour = etat.ressentiQuotidien[aujourdHui];
  if (!donneesJour) return;
  ['colere', 'blessure', 'maladie', 'insomnie'].forEach(function (champ) {
    var bouton = document.querySelector('[data-role="booleen-' + champ + '"]');
    if (bouton) {
      bouton.setAttribute('data-actif', donneesJour[champ] ? 'true' : 'false');
    }
  });
}

function modifierRessentiBooleen(champ, coche) {
  var aujourdHui = obtenirDateJourReference();
  if (!etat.ressentiQuotidien[aujourdHui]) {
    etat.ressentiQuotidien[aujourdHui] = { sommeil: 7, fatigue: 3, stress: 3, humeur: 4, colere: false, blessure: false, maladie: false };
  }
  etat.ressentiQuotidien[aujourdHui][champ] = coche;
  sauvegarderEtat();
}

function basculerBooleenRessenti(champ, element) {
  var aujourdHui = obtenirDateJourReference();
  if (!etat.ressentiQuotidien[aujourdHui]) {
    etat.ressentiQuotidien[aujourdHui] = {
      sommeil: 7, fatigue: 5, stress: 5, humeur: 4,
      colere: false, blessure: false, maladie: false, insomnie: false
    };
  }
  var valeurActuelle = !!etat.ressentiQuotidien[aujourdHui][champ];
  var nouvelleValeur = !valeurActuelle;
  etat.ressentiQuotidien[aujourdHui][champ] = nouvelleValeur;
  element.setAttribute('data-actif', nouvelleValeur ? 'true' : 'false');
  sauvegarderEtat();
}

function rendreSeance() {
  if (!etat.seanceActive) {
    document.getElementById('seance-zone-inactive').style.display = 'block';
    document.getElementById('seance-zone-active').style.display = 'none';
    if (chronoIntervalle) { window.clearInterval(chronoIntervalle); chronoIntervalle = null; }
    rendreRessentiJour();
    rendrePrevuAujourdHui();
    rendreDemarrageLibre();
    return;
  }

  document.getElementById('seance-zone-inactive').style.display = 'none';
  document.getElementById('seance-zone-active').style.display = 'block';
  document.getElementById('seance-active-nom').innerHTML = echapperHtml(etat.seanceActive.nom);

  if (chronoIntervalle) { window.clearInterval(chronoIntervalle); }
  mettreAJourChrono();
  chronoIntervalle = window.setInterval(mettreAJourChrono, 1000);

  rendreZoneCompteARebours();
  rendreExercicesActifs();
}

function formaterDateCourte(dateISO) {
  var d = dateDepuisISO(dateISO);
  return completerZero(d.getDate()) + '/' + completerZero(d.getMonth() + 1);
}

function formaterResumeSeries(ligneEx) {
  var morceaux = [];
  for (var i = 0; i < ligneEx.series.length; i++) {
    if (ligneEx.series[i].echauffement) { continue; }
    morceaux.push(ligneEx.series[i].poids + 'kg×' + ligneEx.series[i].reps);
  }
  return morceaux.join(', ');
}

var exercicesDeplies = {};

var PAS_POIDS_STEPPER = 2.5;  /* kg ajoutés/retirés par les boutons − / + (change-le si tu veux) */
var PAS_REPS_STEPPER = 1;

function htmlStepper(e, s, champ, valeur, unite, pas) {
  var role = (champ === 'poids') ? 'live-poids' : 'live-reps';
  var attrs = ' data-action="ajuster-serie" data-ex="' + e + '" data-serie="' + s + '" data-champ="' + champ + '"';
  var h = '<div class="sx-hero-champ">';
  h += '<button class="sx-pas"' + attrs + ' data-delta="' + (-pas) + '">&minus;</button>';
  h += '<div class="sx-hero-valeur"><input type="number" step="' + (champ === 'poids' ? '0.5' : '1') + '" inputmode="' + (champ === 'poids' ? 'decimal' : 'numeric') + '" data-role="' + role + '" data-ex="' + e + '" data-serie="' + s + '" value="' + valeur + '">';
  h += '<span class="sx-hero-unite">' + unite + '</span></div>';
  h += '<button class="sx-pas"' + attrs + ' data-delta="' + pas + '">+</button>';
  h += '</div>';
  return h;
}

function htmlNoteSerie(e, s, serie) {
  if (!noteSerieEstOuverte(e, s, serie)) { return ''; }
  return '<div class="note-serie-zone"><input type="text" data-role="live-note" data-ex="' + e + '" data-serie="' + s + '" value="' + echapperHtml(serie.note || '') + '" placeholder="Note : changement, douleur, ressenti..."></div>';
}

function mettreAJourProgressionSeance(faites, total) {
  var barre = document.getElementById('seance-progression-remplie');
  var compteur = document.getElementById('seance-compteur');
  if (barre) { barre.style.width = (total > 0 ? Math.round(faites / total * 100) : 0) + '%'; }
  if (compteur) { compteur.innerHTML = faites + ' / ' + total + ' séries'; }
  majManometreSteampunk(faites, total);
}

/* Boutons − / + : modifie la valeur sans tout redessiner */
function ajusterSerieLive(exIndex, serieIndex, champ, delta) {
  var serie = etat.seanceActive.exercices[exIndex].series[serieIndex];
  var cle = (champ === 'poids') ? 'poids' : 'reps';
  var valeur = (serie[cle] || 0) + delta;
  if (valeur < 0) { valeur = 0; }
  valeur = Math.round(valeur * 100) / 100;
  serie[cle] = valeur;
  sauvegarderEtat();
  var saisie = document.querySelector('[data-role="live-' + cle + '"][data-ex="' + exIndex + '"][data-serie="' + serieIndex + '"]');
  if (saisie) { saisie.value = valeur; }
}

/* Déplier / replier un exercice en touchant son en-tête */
function basculerExercice(exIndex, etaitOuvert) {
  exercicesDeplies[exIndex] = !etaitOuvert;
  rendreExercicesActifs();
}

function rendreExercicesActifs() {
  var seance = etat.seanceActive;
  if (!seance) { return; }
  var html = '';
  var totalSeries = 0;
  var seriesFaites = 0;

  /* Exercice en cours = premier exercice pas encore terminé */
  var indexExerciceActif = -1;
  for (var ea = 0; ea < seance.exercices.length; ea++) {
    var toutesFaites = seance.exercices[ea].series.every(function (sr) { return sr.fait; });
    if (!toutesFaites) { indexExerciceActif = ea; break; }
  }

  for (var e = 0; e < seance.exercices.length; e++) {
    var ligneEx = seance.exercices[e];
    var exRef = trouverParId(etat.exercices, ligneEx.exerciceId);
    var nomEx = exRef ? exRef.nom : '(exercice supprimé)';
    var groupeEx = exRef ? exRef.groupe : '';
    var exerciceTermine = ligneEx.series.every(function (sr) { return sr.fait; });
    var estActif = (e === indexExerciceActif);
    var ouvert = (exercicesDeplies[e] !== undefined) ? exercicesDeplies[e] : estActif;

    var nbTravail = 0;
    var nbTravailFaites = 0;
    for (var c = 0; c < ligneEx.series.length; c++) {
      if (!ligneEx.series[c].echauffement) {
        nbTravail++; totalSeries++;
        if (ligneEx.series[c].fait) { nbTravailFaites++; seriesFaites++; }
      }
    }

    /* Nouveau record ? */
    var recordAnterieur = meilleurPoidsHistorique(ligneEx.exerciceId);
    var meilleurAujourdhui = null;
    for (var s2 = 0; s2 < ligneEx.series.length; s2++) {
      if (ligneEx.series[s2].echauffement) { continue; }
      if (ligneEx.series[s2].fait && (meilleurAujourdhui === null || ligneEx.series[s2].poids > meilleurAujourdhui)) {
        meilleurAujourdhui = ligneEx.series[s2].poids;
      }
    }
    var nouveauRecord = meilleurAujourdhui !== null && (recordAnterieur === null || meilleurAujourdhui > recordAnterieur);

    var meta = exerciceTermine
      ? echapperHtml(formaterResumeSeries(ligneEx))
      : (groupeEx ? echapperHtml(groupeEx) + ' · ' : '') + nbTravailFaites + '/' + nbTravail + ' séries';

    /* ----- En-tête de la carte ----- */
    html += '<div class="sx-exo' + (exerciceTermine ? ' sx-exo-termine' : (estActif ? ' sx-exo-actif' : '')) + '">';
    html += '<div class="sx-exo-tete" data-action="basculer-exercice" data-ex="' + e + '" data-ouvert="' + (ouvert ? '1' : '0') + '">';
    html += '<span class="sx-exo-pastille">' + (exerciceTermine ? '&#10003;' : (e + 1)) + '</span>';
    html += '<span class="sx-exo-titres"><span class="sx-exo-nom">' + echapperHtml(nomEx) + (nouveauRecord ? ' <span class="sx-exo-record">&#9733;</span>' : '') + '</span>';
    html += '<span class="sx-exo-meta">' + meta + '</span></span>';
    if (!exerciceTermine) {
      html += '<span class="barre-charge sx-exo-blocs">';
      for (var b = 0; b < ligneEx.series.length; b++) {
        html += '<span class="bloc-charge' + (ligneEx.series[b].fait ? ' bloc-charge-fait' : '') + (ligneEx.series[b].echauffement ? ' bloc-charge-echauffement' : '') + '"></span>';
      }
      html += '</span>';
    }
    html += '<span class="sx-exo-chevron">' + (ouvert ? '&#9662;' : '&#9656;') + '</span>';
    html += '</div>';

    /* ----- Corps (seulement si ouvert) ----- */
    if (ouvert) {
      html += '<div class="sx-exo-corps">';

      var derniereFois = derniereOccurrenceExercice(ligneEx.exerciceId);
      if (derniereFois) {
        html += '<div class="sx-derniere donnee-num">Dernière fois · ' + formaterDateCourte(derniereFois.date) + ' : ' + echapperHtml(formaterResumeSeries(derniereFois.ligneEx)) + '</div>';
      }

      var badges = '';
      if (nouveauRecord) { badges += '<span class="badge-technique badge-record">&#9733; Nouveau record</span>'; }
      if (ligneEx.structure && ligneEx.structure !== 'lineaire') {
        badges += '<span class="badge-technique">' + echapperHtml(libelleDepuisValeur(STRUCTURES_SERIES, ligneEx.structure)) + '</span>';
      }
      if (ligneEx.technique && ligneEx.technique !== 'aucune') {
        badges += '<span class="badge-technique badge-technique-intensif">Dernière série : ' + echapperHtml(libelleDepuisValeur(TECHNIQUES_INTENSIFICATION, ligneEx.technique)) + '</span>';
      }
      if (ligneEx.tempo) { badges += '<span class="badge-technique">Tempo ' + echapperHtml(ligneEx.tempo) + '</span>'; }
      if (badges) { html += '<div class="badges-zone">' + badges + '</div>'; }

      /* Prochaine série à faire (uniquement sur l'exercice en cours) */
      var indexProchaineSerie = -1;
      if (estActif) {
        for (var sc = 0; sc < ligneEx.series.length; sc++) {
          if (!ligneEx.series[sc].fait) { indexProchaineSerie = sc; break; }
        }
      }

      var compteurEchauffement = 0;
      var compteurTravail = 0;
      for (var s = 0; s < ligneEx.series.length; s++) {
        var serie = ligneEx.series[s];
        var estEchauffement = !!serie.echauffement;
        var libelleNum;
        if (estEchauffement) { compteurEchauffement++; libelleNum = 'É' + compteurEchauffement; }
        else { compteurTravail++; libelleNum = '#' + compteurTravail; }
        var estNouvelle = !!(dernierAjoutSerie && dernierAjoutSerie.ex === e && dernierAjoutSerie.serie === s);
        var attrs = ' data-ex="' + e + '" data-serie="' + s + '"';

        if (s === indexProchaineSerie) {
          /* ===== SÉRIE EN COURS : grand format ===== */
          html += '<div class="sx-hero' + (estEchauffement ? ' sx-hero-echauf' : '') + (estNouvelle ? ' sx-nouvelle' : '') + '">';
          html += '<div class="sx-hero-tete"><span class="sx-hero-label">' + (estEchauffement ? 'Échauffement ' + compteurEchauffement : 'Série ' + compteurTravail + ' / ' + nbTravail) + '</span>';
          html += '<span class="sx-hero-outils">';
          html += '<button class="bouton-note' + (serie.note ? ' bouton-note-remplie' : '') + '" data-action="basculer-note-serie"' + attrs + '>&#9998;</button>';
          html += '<button class="serie-suppr" data-action="supprimer-serie"' + attrs + '>&times;</button>';
          html += '</span></div>';
          html += '<div class="sx-hero-champs">';
          html += htmlStepper(e, s, 'poids', serie.poids, 'kg', PAS_POIDS_STEPPER);
          html += htmlStepper(e, s, 'reps', serie.reps, 'reps', PAS_REPS_STEPPER);
          html += '</div>';
          html += '<button class="sx-valider" data-action="basculer-serie-faite"' + attrs + '>&#10003; Valider la série</button>';
          html += '</div>';
          html += htmlNoteSerie(e, s, serie);
          continue;
        }

        /* ===== Autres séries : ligne compacte ===== */
        html += '<div class="sx-serie' + (serie.fait ? ' sx-serie-faite' : '') + (estEchauffement ? ' sx-serie-echauf' : '') + (estNouvelle ? ' sx-nouvelle' : '') + '">';
        html += '<span class="sx-serie-num">' + libelleNum + '</span>';
        html += '<span class="serie-champ"><input type="number" step="0.5" inputmode="decimal" data-role="live-poids"' + attrs + ' value="' + serie.poids + '"></span><span class="serie-unite">kg</span>';
        html += '<span class="serie-champ"><input type="number" step="1" inputmode="numeric" data-role="live-reps"' + attrs + ' value="' + serie.reps + '"></span><span class="serie-unite">reps</span>';
        html += '<button class="bulle-validation' + (serie.fait ? ' bulle-validation-faite' : '') + '" data-action="basculer-serie-faite"' + attrs + '>&#10003;</button>';
        html += '<button class="bouton-note' + (serie.note ? ' bouton-note-remplie' : '') + '" data-action="basculer-note-serie"' + attrs + '>&#9998;</button>';
        html += '<button class="serie-suppr" data-action="supprimer-serie"' + attrs + '>&times;</button>';
        html += '</div>';
        html += htmlNoteSerie(e, s, serie);
      }

      /* RPE + boutons d'ajout */
      var rpeValeur = (ligneEx.rpe !== null && ligneEx.rpe !== undefined) ? ligneEx.rpe : 3;
      html += '<div class="ligne-actions-exercice">';
      html += '<div class="rpe-ligne rpe-glissable" data-role="rpe-ligne" data-ex="' + e + '" title="RPE ressenti — glisser pour ajuster (0 à 10)">';
      html += '<input type="number" class="rpe-input" min="0" max="10" step="1" data-role="live-rpe" data-ex="' + e + '" value="' + rpeValeur + '">';
      html += '<span class="rpe-suffixe">RPE</span></div>';
      html += '<button class="btn btn-contour btn-action-serie" data-action="ajouter-serie" data-ex="' + e + '">+ Série</button>';
      html += '<button class="btn-action-echauffement" data-action="ajouter-serie-echauffement" data-ex="' + e + '" title="Ajouter une série d\'échauffement"><span class="icone-echauffement" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2c.9 2.1 2.2 3.6 3.6 5.1 1.8 1.9 3.4 3.9 3.4 6.9 0 4.4-3.1 8-7 8s-7-3.6-7-8c0-2.1.7-3.7 1.6-5.1.3 1.5 1.1 2.4 2.1 2.4 1 0 1.3-.8 1-1.9-.5-1.8-.4-4 .6-5.9C10.9 2.9 11.4 2.4 12 2z"/></svg></span></button>';
      html += '</div>';
      if (ligneEx.technique === 'drop_set') {
        html += '<button class="btn btn-contour btn-bloc" style="margin-top:6px;" data-action="ajouter-serie-degressive" data-ex="' + e + '">+ Série dégressive (~70%)</button>';
      }
      html += '</div>'; /* fin corps */
    }
    html += '</div>'; /* fin carte */
  }

  /* Tout est fait : invitation à terminer */
  if (seance.exercices.length > 0 && indexExerciceActif === -1) {
    html += '<div class="sx-fin"><div class="sx-fin-titre">Séance terminée &#127881;</div>';
    html += '<button class="sx-valider" data-action="terminer-seance">Enregistrer la séance</button></div>';
  }

  document.getElementById('seance-liste-exercices').innerHTML = html;
  dernierAjoutSerie = null;
  mettreAJourProgressionSeance(seriesFaites, totalSeries);

  var lignesRpe = document.querySelectorAll('#seance-liste-exercices .rpe-ligne');
  for (var r = 0; r < lignesRpe.length; r++) { configurerGlisseRpe(lignesRpe[r]); }
}

function mettreAJourChrono() {
  if (!etat.seanceActive) { return; }
  var ecouleMs = Date.now() - etat.seanceActive.debut;
  var totalSecondes = Math.floor(ecouleMs / 1000);
  var minutes = Math.floor(totalSecondes / 60);
  var secondes = totalSecondes % 60;
  var affichage = document.getElementById('seance-chrono');
  if (affichage) { affichage.innerHTML = completerZero(minutes) + ':' + completerZero(secondes); }
}

function modifierRpeExercice(exIndex, valeur) {
  var val = parseInt(valeur, 10);
  if (isNaN(val)) { val = 3; }
  if (val < 0) { val = 0; }
  if (val > 10) { val = 10; }
  etat.seanceActive.exercices[exIndex].rpe = val;
  sauvegarderEtat();
}

/* Rend la ligne RPE d'un exercice glissable au doigt/à la souris (même principe que le glissé
   des heures de sommeil) : on glisse horizontalement sur le chiffre lui-même pour le faire
   monter/descendre de 0 à 10, sans passer par le clavier. Les écouteurs de déplacement ne sont
   posés sur document que pendant le geste, puis retirés à son relâchement, pour ne rien laisser
   traîner d'un rendu à l'autre. */
function configurerGlisseRpe(ligneElement) {
  var champ = ligneElement.querySelector('.rpe-input');
  if (!champ) { return; }
  var exIndex = parseInt(ligneElement.getAttribute('data-ex'), 10);
  var xDepart = 0;
  var valeurDepart = 3;
  var seuilPx = 20;

  function getValeur() {
    var v = parseInt(champ.value, 10);
    return isNaN(v) ? 3 : v;
  }

  function appliquerValeur(v) {
    v = Math.round(v);
    if (v < 0) { v = 0; }
    if (v > 10) { v = 10; }
    champ.value = v;
    modifierRpeExercice(exIndex, v);
  }

  function deplacerSouris(e) {
    appliquerValeur(valeurDepart + Math.trunc((e.clientX - xDepart) / seuilPx));
  }
  function terminerSouris() {
    document.removeEventListener('mousemove', deplacerSouris);
    document.removeEventListener('mouseup', terminerSouris);
    ligneElement.classList.remove('glisse-actif');
  }
  ligneElement.addEventListener('mousedown', function (e) {
    if (e.target === champ) { return; }
    xDepart = e.clientX;
    valeurDepart = getValeur();
    ligneElement.classList.add('glisse-actif');
    document.addEventListener('mousemove', deplacerSouris);
    document.addEventListener('mouseup', terminerSouris);
  });

  function deplacerTactile(e) {
    appliquerValeur(valeurDepart + Math.trunc((e.touches[0].clientX - xDepart) / seuilPx));
  }
  function terminerTactile() {
    document.removeEventListener('touchmove', deplacerTactile);
    document.removeEventListener('touchend', terminerTactile);
    ligneElement.classList.remove('glisse-actif');
  }
  ligneElement.addEventListener('touchstart', function (e) {
    if (e.target === champ) { return; }
    xDepart = e.touches[0].clientX;
    valeurDepart = getValeur();
    ligneElement.classList.add('glisse-actif');
    document.addEventListener('touchmove', deplacerTactile, { passive: true });
    document.addEventListener('touchend', terminerTactile);
  }, { passive: true });
}

function modifierValeurSerieLive(role, exIndex, serieIndex, valeur) {
  var serie = etat.seanceActive.exercices[exIndex].series[serieIndex];
  if (role === 'live-poids') { serie.poids = parseFloat(valeur) || 0; }
  if (role === 'live-reps') { serie.reps = parseInt(valeur, 10) || 0; }
  if (role === 'live-note') { serie.note = valeur; }
  sauvegarderEtat();
}

function basculerSerieFaite(exIndex, serieIndex) {
  var serie = etat.seanceActive.exercices[exIndex].series[serieIndex];
  serie.fait = !serie.fait;
  sauvegarderEtat();
  rendreExercicesActifs();
}

var notesSerieOuvertes = {};
var dernierAjoutSerie = null;

function basculerNoteSerie(exIndex, serieIndex) {
  var cle = exIndex + '_' + serieIndex;
  notesSerieOuvertes[cle] = !notesSerieOuvertes[cle];
  rendreExercicesActifs();
}

function noteSerieEstOuverte(exIndex, serieIndex, serie) {
  var cle = exIndex + '_' + serieIndex;
  if (notesSerieOuvertes[cle] !== undefined) { return notesSerieOuvertes[cle]; }
  return !!(serie.note && serie.note.length > 0);
}

function ajouterSerieLive(exIndex) {
  var seriesTab = etat.seanceActive.exercices[exIndex].series;
  var derniere = seriesTab.length > 0 ? seriesTab[seriesTab.length - 1] : { poids: 0, reps: 0 };
  seriesTab.push({ poids: derniere.poids, reps: derniere.reps, fait: false, note: '', echauffement: false });
  dernierAjoutSerie = { ex: exIndex, serie: seriesTab.length - 1 };
  sauvegarderEtat();
  rendreExercicesActifs();
}

/* Ajoute une série d'échauffement. Elle vient se placer avant les séries de travail, mais après
   les séries d'échauffement déjà présentes (elles restent groupées en tête de liste), et ne compte
   jamais dans les statistiques (records, historique, volume, progression...). Poids par défaut :
   la moitié du record de l'exercice (ou, à défaut de record, la moitié de la série de référence
   déjà présente). Reps par défaut : toujours 12, indépendamment du record. */
function ajouterSerieEchauffementLive(exIndex) {
  var ligneEx = etat.seanceActive.exercices[exIndex];
  var seriesTab = ligneEx.series;
  var indexInsertion = 0;
  while (indexInsertion < seriesTab.length && seriesTab[indexInsertion].echauffement) { indexInsertion++; }
  var record = meilleureSerieHistorique(ligneEx.exerciceId);
  var poidsReference;
  if (record) {
    poidsReference = record.poids;
  } else {
    var reference = seriesTab[indexInsertion] || seriesTab[seriesTab.length - 1] || { poids: 0 };
    poidsReference = reference.poids || 0;
  }
  var poidsEchauffement = arrondirPoids(poidsReference * 0.5);
  seriesTab.splice(indexInsertion, 0, { poids: poidsEchauffement, reps: 12, fait: false, note: '', echauffement: true });
  dernierAjoutSerie = { ex: exIndex, serie: indexInsertion };
  sauvegarderEtat();
  rendreExercicesActifs();
}

function ajouterSerieDegressive(exIndex) {
  var seriesTab = etat.seanceActive.exercices[exIndex].series;
  var derniere = seriesTab.length > 0 ? seriesTab[seriesTab.length - 1] : { poids: 0, reps: 0 };
  var poidsReduit = arrondirPoids(derniere.poids * 0.7);
  seriesTab.push({ poids: poidsReduit, reps: derniere.reps, fait: false, note: '', echauffement: false });
  dernierAjoutSerie = { ex: exIndex, serie: seriesTab.length - 1 };
  sauvegarderEtat();
  rendreExercicesActifs();
}

function supprimerSerieLive(exIndex, serieIndex) {
  etat.seanceActive.exercices[exIndex].series.splice(serieIndex, 1);
  sauvegarderEtat();
  rendreExercicesActifs();
}

/* Calcul des calories dépensées : formule MET, poids corporel, durée reelle (Début -> Fin) */
function calculerCaloriesSeance(seanceActive, dureeMinutes, poidsCorporel) {
  if (seanceActive.exercices.length === 0) { return 0; }
  var sommeMet = 0;
  var nbExercices = 0;
  for (var i = 0; i < seanceActive.exercices.length; i++) {
    var exRef = trouverParId(etat.exercices, seanceActive.exercices[i].exerciceId);
    sommeMet += exRef ? (exRef.met || 5) : 5;
    nbExercices++;
  }
  var metMoyen = nbExercices > 0 ? (sommeMet / nbExercices) : 5;
  return (metMoyen * 3.5 * poidsCorporel / 200) * dureeMinutes;
}

function terminerSeance() {
  if (!etat.seanceActive) { return; }
  demanderConfirmation('Terminer la séance et l\'enregistrer dans l\'historique ?', function () {
    var finMs = Date.now();
    var dureeMinutes = Math.max(1, Math.round((finMs - etat.seanceActive.debut) / 60000));
    var calories = calculerCaloriesSeance(etat.seanceActive, dureeMinutes, etat.profil.poidsCorporel || 75);

    var resultat = {
      date: formaterDateISO(new Date()),
      exercices: etat.seanceActive.exercices
    };

    if (etat.seanceActive.agendaEntryId) {
      var entree = trouverParId(etat.agenda, etat.seanceActive.agendaEntryId);
      if (entree) {
        entree.statut = 'termine';
        entree.dureeMinutes = dureeMinutes;
        entree.caloriesEstimees = calories;
        entree.resultat = resultat;
      }
    } else {
      etat.agenda.push({
        id: genererId(),
        date: resultat.date,
        seanceId: etat.seanceActive.seanceModeleId,
        statut: 'termine',
        dureeMinutes: dureeMinutes,
        caloriesEstimees: calories,
        resultat: resultat
      });
    }

    etat.seanceActive = null;
    desactiverCommandeVocale(true);
    arreterCompteARebours();
    if (chronoIntervalle) { window.clearInterval(chronoIntervalle); chronoIntervalle = null; }
    sauvegarderEtat();
    fermerModal();
    afficherToast(messageTheme('seanceEnregistree', 'Séance enregistrée') + ' : ' + dureeMinutes + ' min · ' + Math.round(calories) + ' kcal estimées.');
    allerVersPage('accueil');
  });
}

function annulerSeance() {
  if (!etat.seanceActive) { return; }
  demanderConfirmation('Annuler la séance en cours ? La progression ne sera pas enregistrée.', function () {
    etat.seanceActive = null;
    desactiverCommandeVocale(true);
    arreterCompteARebours();
    if (chronoIntervalle) { window.clearInterval(chronoIntervalle); chronoIntervalle = null; }
    sauvegarderEtat();
    fermerModal();
    afficherToast(messageTheme('seanceAnnulee', 'Séance annulée.'));
    allerVersPage('accueil');
  });
}

/* ============================================================
   BLOC 13 : MINUTEUR DE REPOS (compte a rebours, toujours accessible en seance)
   ============================================================ */

var compteARebours = { actif: false, finMs: null, dureeTotaleMs: 0, enPause: false, resteMsPause: null };
var intervalleCompteARebours = null;
var derniereMinutesReglees = 1;
var dernieresSecondesReglees = 30;
var contexteAudio = null;
var cdrReglageDeplie = false;      /* pastille repliée (bouton seul) ou dépliée (durée visible) */
var DUREE_APPUI_LONG_MS = 450;

/* Rayon/circonférence de l'anneau de progression du minuteur */
var CDR_RAYON = 96;
var CDR_CIRCONFERENCE = 2 * Math.PI * CDR_RAYON;

/* Couleurs du dégradé dynamique (violet du thème au lancement -> rose -> orange à 0) */
var COULEUR_CDR_MILIEU = '#FF3D9A';
var COULEUR_CDR_FIN = '#FF7A18';

/* Lit le violet défini par le thème (--couleur-nutrition dans :root) : si tu changes
   cette variable (nouveau thème, dark/light...), le minuteur suit automatiquement. */
function couleurThemeMinuteur() {
  try {
    var valeur = getComputedStyle(document.documentElement).getPropertyValue('--couleur-nutrition');
    valeur = valeur ? valeur.trim() : '';
    if (valeur) { return valeur; }
  } catch (erreur) {}
  return '#B98EF0';
}

function couleurCompteARebours(fractionRestante) {
  if (isNaN(fractionRestante)) { fractionRestante = 0; }
  if (fractionRestante < 0) { fractionRestante = 0; }
  if (fractionRestante > 1) { fractionRestante = 1; }
  if (fractionRestante >= 0.5) {
    var t1 = (fractionRestante - 0.5) / 0.5;
    return interpolerCouleur(COULEUR_CDR_MILIEU, couleurThemeMinuteur(), t1);
  }
  var t2 = fractionRestante / 0.5;
  return interpolerCouleur(COULEUR_CDR_FIN, COULEUR_CDR_MILIEU, t2);
}

/* ============================================================
   SONNERIES PAR THÈME : une ligne par thème.
   Mets les noms de fichiers SANS ".mp3" (dossier sons/).
   Plusieurs noms = tirage au hasard. Liste vide [] = sonnerie générée par défaut.
   ============================================================ */
var SONS_PAR_THEME = {
  sombre:     [],
  clair:      [],
  automnal:   [],
  effroi:     ['effroi1', 'effroi2', 'effroi3', 'effroi4', 'effroi5', 'effroi6', 'effroi7', 'effroi8'],
  hivernal:   [],
  paindepice: ['paindepice1', 'paindepice2', 'paindepice3', 'paindepice4', 'paindepice5', 'paindepice6'],
  printanier: [],
  pastel:     [],
  estival:    ['estival1', 'estival2'],
  cyberpunk:  ['cyberpunk1', 'cyberpunk2', 'cyberpunk3', 'cyberpunk4', 'cyberpunk5', 'cyberpunk6', 'cyberpunk7', 'cyberpunk8', 'cyberpunk9', 'cyberpunk10'],
  steampunk:  [],
  flibuste:   ['pirate1', 'pirate2', 'pirate3'],
  ruedor:     ['western1', 'western2', "western3"],
  wasteland:  ['wasteland1', 'wasteland2', 'wasteland3', 'wasteland4', 'wasteland5', 'wasteland6', 'wasteland7', 'wasteland8', 'wasteland9', 'wasteland10']
};

var dernierSonParTheme = {};

/* Tire un son au hasard pour ce thème, jamais deux fois le même d'affilée */
function choisirSon(theme) {
  var liste = SONS_PAR_THEME[theme];
  if (!liste || liste.length === 0) { return null; }
  if (liste.length === 1) { return liste[0]; }
  var index;
  do {
    index = Math.floor(Math.random() * liste.length);
  } while (index === dernierSonParTheme[theme]);
  dernierSonParTheme[theme] = index;
  return liste[index];
}

var tamponsSons = {};

function chargerSonFichier(ctx, cle, url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function () {
    if (xhr.status !== 200 && xhr.status !== 0) { return; }
    ctx.decodeAudioData(xhr.response, function (tampon) { tamponsSons[cle] = tampon; }, function () {});
  };
  xhr.send();
}

function jouerTampon(ctx, t, cle) {
  var tampon = tamponsSons[cle];
  if (!tampon) { jouerBip(ctx, t, 880, 0.3); return; } /* secours si pas encore chargé */
  var source = ctx.createBufferSource();
  source.buffer = tampon;
  source.connect(ctx.destination);
  source.start(t);
}

function obtenirContexteAudio() {
  if (contexteAudio) { return contexteAudio; }
  var ConstructeurAudio = window.AudioContext || window.webkitAudioContext;
  if (!ConstructeurAudio) { return null; }
  try {
    contexteAudio = new ConstructeurAudio();
    for (var theme in SONS_PAR_THEME) {
      for (var s = 0; s < SONS_PAR_THEME[theme].length; s++) {
        var nomSon = SONS_PAR_THEME[theme][s];
        chargerSonFichier(contexteAudio, nomSon, 'sons/' + nomSon + '.mp3');
      }
    }
  } catch (erreur) {
    contexteAudio = null;
  }
  return contexteAudio;
}

function jouerBip(ctx, debut, frequence, duree) {
  var oscillateur = ctx.createOscillator();
  var gain = ctx.createGain();
  oscillateur.type = 'sine';
  oscillateur.frequency.value = frequence;
  gain.gain.setValueAtTime(0.0001, debut);
  gain.gain.exponentialRampToValueAtTime(0.4, debut + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
  oscillateur.connect(gain);
  gain.connect(ctx.destination);
  oscillateur.start(debut);
  oscillateur.stop(debut + duree + 0.05);
}

/* ============================================================
   CATALOGUE DE SONNERIES (générées, aucun fichier audio)
   Chaque sonnerie : function (ctx, t) où t = ctx.currentTime
   ============================================================ */

/* Note simple : oscillateur + enveloppe + filtre passe-bas optionnel */
function sonNote(ctx, t, freq, duree, type, volume, opts) {
  opts = opts || {};
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.fin) { osc.frequency.exponentialRampToValueAtTime(opts.fin, t + duree); }
  if (opts.detune) { osc.detune.value = opts.detune; }
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume || 0.3, t + (opts.attaque || 0.01));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  var sortie = osc;
  if (opts.filtre) {
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(opts.filtre, t);
    if (opts.filtreFin) { f.frequency.exponentialRampToValueAtTime(opts.filtreFin, t + duree); }
    osc.connect(f);
    sortie = f;
  }
  sortie.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duree + 0.05);
}

/* Cloche / métal : plusieurs partiels non harmoniques */
function sonCloche(ctx, t, freq, duree, volume, ratios) {
  ratios = ratios || [1, 2.76, 5.4, 8.93];
  for (var i = 0; i < ratios.length; i++) {
    sonNote(ctx, t, freq * ratios[i], duree / (1 + i * 0.6), 'sine', (volume || 0.25) / (1 + i * 0.8));
  }
}

/* Bruit filtré (vapeur, souffle...) */
function sonBruit(ctx, t, duree, volume, freqFiltre, typeFiltre) {
  var taille = Math.floor(ctx.sampleRate * duree);
  var buffer = ctx.createBuffer(1, taille, ctx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < taille; i++) { data[i] = Math.random() * 2 - 1; }
  var src = ctx.createBufferSource();
  src.buffer = buffer;
  var filtre = ctx.createBiquadFilter();
  filtre.type = typeFiltre || 'bandpass';
  filtre.frequency.value = freqFiltre || 2000;
  var gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume || 0.2, t + duree * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(filtre);
  filtre.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
}

var SONNERIES = [
  { valeur: 'sombre', libelle: 'Sombre — pulsation grave', jouer: function (ctx, t) {
    sonNote(ctx, t, 110, 0.35, 'sine', 0.5);
    sonNote(ctx, t + 0.25, 146.8, 0.6, 'sine', 0.5);
  } },

  { valeur: 'clair', libelle: 'Clair — double ding', jouer: function (ctx, t) {
    sonCloche(ctx, t, 1318.5, 0.5, 0.25, [1, 2, 3]);
    sonCloche(ctx, t + 0.22, 1760, 0.8, 0.25, [1, 2, 3]);
  } },

  { valeur: 'automnal', libelle: '🍁 Automnal — marimba descendant', jouer: function (ctx, t) {
    var notes = [659.3, 587.3, 493.9, 392];
    for (var i = 0; i < notes.length; i++) {
      sonNote(ctx, t + i * 0.16, notes[i], 0.45, 'triangle', 0.35, { filtre: 1800 });
    }
  } },

  { valeur: 'effroi', libelle: '🎃 Effroi', jouer: function (ctx, t) {
    sonNote(ctx, t, 110, 0.35, 'sine', 0.5);
    sonNote(ctx, t + 0.25, 146.8, 0.6, 'sine', 0.5);
  } },

  { valeur: 'hivernal', libelle: '❄️ Hivernal — clochettes de givre', jouer: function (ctx, t) {
    var notes = [2093, 2637, 3136, 2637, 3520];
    for (var i = 0; i < notes.length; i++) {
      sonNote(ctx, t + i * 0.11, notes[i], 0.7, 'sine', 0.16);
      sonNote(ctx, t + i * 0.11, notes[i] * 2.01, 0.35, 'sine', 0.05);
    }
  } },

  { valeur: 'paindepice', libelle: '🍪 Pain d\'épice — boîte à musique', jouer: function (ctx, t) {
    var notes = [784, 659.3, 784, 1046.5, 987.8, 784];
    var rythme = [0, 0.14, 0.28, 0.46, 0.62, 0.78];
    for (var i = 0; i < notes.length; i++) {
      sonNote(ctx, t + rythme[i], notes[i], 0.5, 'triangle', 0.22);
      sonNote(ctx, t + rythme[i], notes[i] * 3, 0.15, 'sine', 0.05);
    }
  } },

  { valeur: 'printanier', libelle: '🌸 Printanier — chant d\'oiseau', jouer: function (ctx, t) {
    sonNote(ctx, t, 2200, 0.09, 'sine', 0.2, { fin: 3400 });
    sonNote(ctx, t + 0.12, 2600, 0.09, 'sine', 0.2, { fin: 3800 });
    sonNote(ctx, t + 0.24, 3000, 0.07, 'sine', 0.18, { fin: 2400 });
    sonNote(ctx, t + 0.42, 2400, 0.12, 'sine', 0.2, { fin: 4000 });
    sonNote(ctx, t + 0.58, 3400, 0.1, 'sine', 0.18, { fin: 2600 });
  } },

  { valeur: 'pastel', libelle: '🦄 Pastel — arpège scintillant', jouer: function (ctx, t) {
    var notes = [1046.5, 1318.5, 1568, 2093, 2637, 3136];
    for (var i = 0; i < notes.length; i++) {
      sonNote(ctx, t + i * 0.07, notes[i], 0.5, 'sine', 0.18);
    }
  } },

  { valeur: 'estival', libelle: '☀️ Estival — steel drum', jouer: function (ctx, t) {
    var notes = [523.3, 659.3, 784, 659.3, 1046.5];
    var rythme = [0, 0.15, 0.3, 0.5, 0.65];
    for (var i = 0; i < notes.length; i++) {
      sonNote(ctx, t + rythme[i], notes[i], 0.4, 'sine', 0.3);
      sonNote(ctx, t + rythme[i], notes[i] * 2, 0.25, 'sine', 0.15);
      sonNote(ctx, t + rythme[i], notes[i] * 3.01, 0.12, 'triangle', 0.05);
    }
  } },

  { valeur: 'cyberpunk', libelle: '☢️ Cyberpunk — laser glitch', jouer: function (ctx, t) {
    sonNote(ctx, t, 1800, 0.12, 'square', 0.12, { fin: 200, filtre: 4000 });
    sonNote(ctx, t + 0.15, 1800, 0.12, 'square', 0.12, { fin: 200, filtre: 4000 });
    for (var i = 0; i < 6; i++) {
      sonNote(ctx, t + 0.32 + i * 0.045, (i % 2 === 0) ? 880 : 1320, 0.04, 'square', 0.1);
    }
    sonNote(ctx, t + 0.62, 140, 0.4, 'sawtooth', 0.22, { fin: 70, filtre: 600 });
  } },

  { valeur: 'steampunk', libelle: '⚙️ Steampunk — vapeur et laiton', jouer: function (ctx, t) {
    sonBruit(ctx, t, 0.45, 0.3, 3500, 'highpass');
    sonCloche(ctx, t + 0.35, 523.3, 0.9, 0.3, [1, 1.5, 2.3, 3.7, 5.1]);
    sonCloche(ctx, t + 0.7, 392, 1.0, 0.3, [1, 1.5, 2.3, 3.7, 5.1]);
  } },

  { valeur: 'flibuste', libelle: '🏴‍☠️ Flibuste — cloche de navire et cor', jouer: function (ctx, t) {
    sonCloche(ctx, t, 880, 1.0, 0.3, [1, 2.0, 3.0, 4.2]);
    sonCloche(ctx, t + 0.3, 880, 1.0, 0.3, [1, 2.0, 3.0, 4.2]);
    sonNote(ctx, t + 0.7, 110, 0.8, 'sawtooth', 0.22, { filtre: 500 });
    sonNote(ctx, t + 0.7, 165, 0.8, 'sawtooth', 0.15, { filtre: 500 });
  } },

  { valeur: 'ruedor', libelle: '🤠 Western — corde pincée', jouer: function (ctx, t) {
    var notes = [329.6, 246.9, 196];
    for (var i = 0; i < notes.length; i++) {
      sonNote(ctx, t + i * 0.22, notes[i], 0.9, 'sawtooth', 0.28, { filtre: 3000, filtreFin: 400, fin: notes[i] * 0.985 });
    }
    sonCloche(ctx, t + 0.7, 3200, 0.3, 0.1, [1, 1.3, 1.7]);
  } },
  { valeur: 'wasteland', libelle: '🔥 Wasteland — moteur et explosion', jouer: function (ctx, t) {
    /* Moteur qui monte dans les tours */
    sonNote(ctx, t, 70, 0.9, 'sawtooth', 0.25, { fin: 260, filtre: 700, filtreFin: 2200, attaque: 0.05 });
    sonNote(ctx, t, 72, 0.9, 'square', 0.12, { fin: 262, filtre: 600, detune: 20 });
    /* Coup d'accélérateur, puis explosion */
    sonNote(ctx, t + 0.9, 260, 0.25, 'sawtooth', 0.2, { fin: 120, filtre: 1500 });
    sonBruit(ctx, t + 1.0, 0.9, 0.5, 300, 'lowpass');
    sonNote(ctx, t + 1.0, 80, 0.7, 'sine', 0.5, { fin: 30 });
  } }
];

function trouverSonnerie(valeur) {
  for (var i = 0; i < SONNERIES.length; i++) {
    if (SONNERIES[i].valeur === valeur) { return SONNERIES[i]; }
  }
  return SONNERIES[0];
}

function jouerSonnerieParId(valeur) {
  var ctx = obtenirContexteAudio();
  if (!ctx) { return; }
  if (ctx.state === 'suspended' && ctx.resume) { ctx.resume(); } // iOS suspend parfois le contexte
  var cleSon = choisirSon(valeur);
  if (cleSon && tamponsSons[cleSon]) { jouerTampon(ctx, ctx.currentTime + 0.02, cleSon); return; }
  trouverSonnerie(valeur).jouer(ctx, ctx.currentTime + 0.02);
}

function jouerSonnerie() {
  var choix = etat.profil.sonnerie || 'auto';
  if (choix === 'auto') {
    // Le thème actif (remplace par ta variable réelle si elle s'appelle autrement)
    var themeActif = etat.profil.theme || 'sombre';
    if (themeActif === 'auto') {
      themeActif = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'clair' : 'sombre';
    }
    choix = themeActif;
  }
  jouerSonnerieParId(choix);
}

/* --- Réglage de la durée avant lancement : glissement horizontal, pas de 15 secondes --- */

var glissementDureeEnCours = false;
var glissementDureeXDepart = 0;
var glissementDureeTotalDepart = 0;
var evenementsGlissementDureeInitialises = false;

function totalSecondesReglageCdr() {
  var champM = document.getElementById('cdr-minutes');
  var champS = document.getElementById('cdr-secondes');
  var minutes = champM ? (parseInt(champM.value, 10) || 0) : derniereMinutesReglees;
  var secondes = champS ? (parseInt(champS.value, 10) || 0) : dernieresSecondesReglees;
  return minutes * 60 + secondes;
}

function appliquerReglageDureeCdr(totalSecondes) {
  if (totalSecondes < 5) { totalSecondes = 5; }
  if (totalSecondes > 3599) { totalSecondes = 3599; }
  var minutes = Math.floor(totalSecondes / 60);
  var secondes = totalSecondes % 60;
  derniereMinutesReglees = minutes;
  dernieresSecondesReglees = secondes;
  var champM = document.getElementById('cdr-minutes');
  var champS = document.getElementById('cdr-secondes');
  if (champM) { champM.value = minutes; }
  if (champS) { champS.value = secondes; }
  var affichage = document.getElementById('cdr-duree-affichage');
  if (affichage) { affichage.innerHTML = completerZero(minutes) + ':' + completerZero(secondes); }
}

function demarrerGlissementDuree(x, cible) {
  if (!cdrReglageDeplie) { return; }
  glissementDureeEnCours = true;
  glissementDureeXDepart = x;
  glissementDureeTotalDepart = totalSecondesReglageCdr();
  var ligne = document.getElementById('cdr-duree-glissable');
  if (ligne) { ligne.classList.add('glisse-actif'); }
}

function deplacerGlissementDuree(x) {
  if (!glissementDureeEnCours) { return; }
  var delta = x - glissementDureeXDepart;
  var pas = Math.trunc(delta / 24); /* 24px de glissement = 15 secondes */
  appliquerReglageDureeCdr(glissementDureeTotalDepart + pas * 15);
}

function terminerGlissementDuree() {
  glissementDureeEnCours = false;
  var ligne = document.getElementById('cdr-duree-glissable');
  if (ligne) { ligne.classList.remove('glisse-actif'); }
}

function configurerGlissementDuree() {
  var ligne = document.getElementById('cdr-duree-glissable');
  if (!ligne) { return; }
  ligne.addEventListener('mousedown', function (e) { demarrerGlissementDuree(e.clientX, e.target); });
  ligne.addEventListener('touchstart', function (e) { demarrerGlissementDuree(e.touches[0].clientX, e.target); }, { passive: true });

  if (!evenementsGlissementDureeInitialises) {
    evenementsGlissementDureeInitialises = true;
    document.addEventListener('mousemove', function (e) { deplacerGlissementDuree(e.clientX); });
    document.addEventListener('mouseup', terminerGlissementDuree);
    document.addEventListener('touchmove', function (e) { deplacerGlissementDuree(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('touchend', terminerGlissementDuree);
  }
}

function basculerDepliageReglageCdr() {
  cdrReglageDeplie = !cdrReglageDeplie;
  var pill = document.getElementById('cdr-duree-glissable');
  if (pill) { pill.classList.toggle('cdr-pill-deplie', cdrReglageDeplie); }
}

/* Appui court = lancer ; appui long = déplier/replier le réglage de durée */
function configurerBoutonMinuteur() {
  var bouton = document.getElementById('cdr-bouton-lancer');
  if (!bouton) { return; }
  var minuteur = null;
  var actif = false;
  var appuiLongFait = false;
  var aBouge = false;
  var x0 = 0, y0 = 0;

  function effacerMinuteur() {
    if (minuteur) { window.clearTimeout(minuteur); minuteur = null; }
  }
  function debut(x, y) {
    actif = true; appuiLongFait = false; aBouge = false; x0 = x; y0 = y;
    bouton.classList.add('cdr-bouton-appuye');
    effacerMinuteur();
    minuteur = window.setTimeout(function () {
      minuteur = null;
      appuiLongFait = true;
      basculerDepliageReglageCdr();
      if (navigator.vibrate) { navigator.vibrate(15); }
    }, DUREE_APPUI_LONG_MS);
  }
  function bouge(x, y) {
    if (!actif || aBouge) { return; }
    if (Math.abs(x - x0) > 10 || Math.abs(y - y0) > 10) { aBouge = true; effacerMinuteur(); }
  }
  function fin() {
    if (!actif) { return; }
    actif = false;
    bouton.classList.remove('cdr-bouton-appuye');
    effacerMinuteur();
    if (!appuiLongFait && !aBouge) {
      cdrReglageDeplie = false; /* on relance repliée pour gagner de la place */
      lancerCompteARebours();
    }
  }
  function annuler() {
    actif = false;
    bouton.classList.remove('cdr-bouton-appuye');
    effacerMinuteur();
  }

  bouton.addEventListener('touchstart', function (e) { debut(e.touches[0].clientX, e.touches[0].clientY); }, false);
  bouton.addEventListener('touchmove', function (e) { bouge(e.touches[0].clientX, e.touches[0].clientY); }, false);
  bouton.addEventListener('touchend', function (e) { e.preventDefault(); fin(); }, false);
  bouton.addEventListener('touchcancel', annuler, false);
  bouton.addEventListener('mousedown', function (e) { debut(e.clientX, e.clientY); });
  bouton.addEventListener('mouseup', fin);
  bouton.addEventListener('mouseleave', annuler);
}

/* --- Affichage / cycle de vie du minuteur --- */

/* --- Animation de fin de minuteur --- */
/* Mots de fin de minuteur : une ligne par thème.
   Garde-les courts. Pour un "!", écris un espace avant (ex. "Go !").
   Un thème absent de la liste utilise "defaut". */
var EXPRESSIONS_FIN_PAR_THEME = {
  defaut:     ["Go !", "Reprise !", "Aller !", "C'est tipar !", "Pousse !", "Let's go !", "Chaud !", "Next !"],
  effroi:     ["Debout !", "Ressuscite !", "Encore !", "Lève-toi !", "Mwahaha !", "Réveille-toi !"],
  flibuste:   ["À l'abordage !", "Hisse !", "Cap !", "Largue les amarres !", "Tonnerre !"],
  wasteland:  ["Nitro fueled !", "Vroum !", "Pied au plancher !", "Witness me !", "Boom !", "Plein gaz !", "Démarre !", "Ça va chauffer !", "Go faire des étincelles !", "Iron time...", "Brûle-moi ces calories !"],
  cyberpunk:  ["Reboot !", "Connexion !", "Supercharge !", "Hack !", "Online !", "Overdrive !"],
  paindepice: ["Lets Go ho ho !", "C'est l'heure de briller !", "Ding dong !", "Merveilleux !", "À table !"],
  hivernal:   ["Réchauffe-toi !", "Brrrr !", "Dégèle !", "En piste !", "Glisse !"],
  automnal:   ["Ça tombe !", "Feuille !", "Craque !", "Ramasse !", "Encore !"],
  steampunk:  ["Vapeur !", "Engrenage !", "Pression !", "Tout à bord !", "Chauffe !"],
  ruedor:     ["Yeehaw !", "Au galop !", "Dégaine !", "Hue !", "Duel !"],
  estival:    ["Soleil !", "Plouf !", "Vamos !", "Chaud devant !", "Ouiiii !"],
  printanier: ["Éclos !", "C'est vert !", "Pousse !", "Bourgeon !", "C'est le heure !"],
  pastel:     ["Magique !", "Étoile !", "Allez !", "Paillettes !", "Hop !"]
};
var derniereExpressionFin = -1;
var cdrCacherBouton = false; /* vrai pendant que le mot s'affiche : le bouton attend son pop */

function choisirExpressionFin() {
  var theme = etat.profil.theme || 'sombre';
  var liste = EXPRESSIONS_FIN_PAR_THEME[theme] || EXPRESSIONS_FIN_PAR_THEME.defaut;
  var index;
  do {
    index = Math.floor(Math.random() * liste.length);
  } while (index === derniereExpressionFin && liste.length > 1);
  derniereExpressionFin = index;
  return liste[index];
}

/* Messages de notification : une ligne par thème.
   Clés : seanceEnregistree, seanceAnnulee, etirementsTermines, poidsEnregistre.
   Une clé absente = message normal. */
var MESSAGES_PAR_THEME = {
  effroi:     { seanceEnregistree: "Âme rendue au carnet", seanceAnnulee: "La séance retourne au tombeau.", etirementsTermines: "Tes os craquent, tu es prêt !", poidsEnregistre: "La balance a parlé..." },
  flibuste:   { seanceEnregistree: "Butin consigné au journal de bord", seanceAnnulee: "Séance jetée par-dessus bord.", etirementsTermines: "Gréements souples, moussaillon !", poidsEnregistre: "Poids noté sur la carte" },
  wasteland:  { seanceEnregistree: "Carburant brûlé, séance enregistrée", seanceAnnulee: "Panne sèche, séance abandonnée.", etirementsTermines: "Moteur chaud, direction la route !", poidsEnregistre: "Châssis pesé" },
  cyberpunk:  { seanceEnregistree: "Données sauvegardées", seanceAnnulee: "Connexion interrompue.", etirementsTermines: "Calibrage terminé !", poidsEnregistre: "Masse mise à jour" },
  paindepice: { seanceEnregistree: "Séance glacée et rangée", seanceAnnulee: "Séance croquée en route.", etirementsTermines: "Souple comme une pâte !", poidsEnregistre: "Pesé sur la balance du pâtissier" },
  hivernal:   { seanceEnregistree: "Séance gravée dans la glace", seanceAnnulee: "Séance fondue.", etirementsTermines: "Dégelé et prêt !", poidsEnregistre: "Poids noté dans la neige" },
  automnal:   { seanceEnregistree: "Séance ramassée comme une belle feuille", seanceAnnulee: "Séance emportée par le vent.", etirementsTermines: "Souple comme une branche !", poidsEnregistre: "Poids noté" },
  steampunk:  { seanceEnregistree: "Séance consignée dans le grimoire mécanique", seanceAnnulee: "Pression relâchée, séance annulée.", etirementsTermines: "Engrenages huilés !", poidsEnregistre: "Poids calibré" },
  ruedor:     { seanceEnregistree: "Séance inscrite au registre du shérif", seanceAnnulee: "Duel annulé.", etirementsTermines: "Prêt à dégainer !", poidsEnregistre: "Pesé à la ferme" },
  estival:    { seanceEnregistree: "Séance au soleil enregistrée", seanceAnnulee: "Séance reportée à demain.", etirementsTermines: "Souple comme en vacances !", poidsEnregistre: "Poids noté" },
  printanier: { seanceEnregistree: "Séance fleurie et enregistrée", seanceAnnulee: "Séance fanée.", etirementsTermines: "Tu as éclos !", poidsEnregistre: "Poids noté" },
  pastel:     { seanceEnregistree: "Séance enregistrée avec des paillettes", seanceAnnulee: "Séance envolée.", etirementsTermines: "Doux et souple !", poidsEnregistre: "Poids noté" }
};

function messageTheme(cle, messageParDefaut) {
  var messages = MESSAGES_PAR_THEME[etat.profil.theme];
  if (messages && messages[cle]) { return messages[cle]; }
  return messageParDefaut;
}

function jouerMotFinMinuteur() {
  var ancien = document.getElementById('cdr-mot-fin');
  if (ancien && ancien.parentNode) { ancien.parentNode.removeChild(ancien); }

  var phrase = choisirExpressionFin();
  var zone = document.getElementById('seance-zone-cdr');
  var rect = zone ? zone.getBoundingClientRect() : { top: 80, height: 60 };
  var centreY = rect.top + rect.height / 2;

  /* Le "!" reste collé au mot précédent (espace insécable) : jamais de "!" seul sur une ligne */
  var mots = phrase.replace(' !', '\u00A0!').split(' ');

  /* Taille : on ajuste pour que le mot le plus large tienne dans l'écran (pas de césure) */
  var largeurMaxEm = 0;
  var totalLettres = 0;
  var m, k, largeurMot;
  for (m = 0; m < mots.length; m++) {
    largeurMot = 0;
    for (k = 0; k < mots[m].length; k++) {
      if (mots[m].charAt(k) === '\u00A0') { largeurMot += 0.3; } else { largeurMot += 0.7; totalLettres++; }
    }
    if (largeurMot > largeurMaxEm) { largeurMaxEm = largeurMot; }
  }
  var taille = Math.max(36, Math.min(120, Math.floor((window.innerWidth - 40) / largeurMaxEm)));
  var inclinaison = -(5 + Math.random() * 5); /* entre -5° et -10° */

  var html = '';
  var index = 0;
  for (m = 0; m < mots.length; m++) {
    html += '<span class="cdr-mot-mot">';
    for (k = 0; k < mots[m].length; k++) {
      var c = mots[m].charAt(k);
      if (c === '\u00A0') { html += '<span class="cdr-mot-espace"></span>'; continue; }
      var couleur = interpolerCouleur('#1FD9C4', '#22A7E5', totalLettres > 1 ? index / (totalLettres - 1) : 0);
      html += '<span class="cdr-mot-lettre" style="color:' + couleur + '; animation-delay:' + (index * 0.045).toFixed(3) + 's;">' + echapperHtml(c) + '</span>';
      index++;
    }
    html += '</span>';
    if (m < mots.length - 1) { html += ' '; }
  }

  var overlay = document.createElement('div');
  overlay.id = 'cdr-mot-fin';
  overlay.className = 'cdr-mot-fin';
  overlay.style.top = centreY + 'px';
  overlay.innerHTML = '<div class="cdr-mot-inclinaison" style="font-size:' + taille + 'px; transform:rotate(' + inclinaison.toFixed(1) + 'deg);">' +
    '<div class="cdr-mot-texte">' + html + '</div></div>';
  document.body.appendChild(overlay);

  /* Si le mot est sur plusieurs lignes, on évite qu'il sorte de l'écran par le haut */
  var centre = Math.max(centreY, overlay.offsetHeight / 2 + 64);
  overlay.style.top = centre + 'px';

  if (navigator.vibrate) { try { navigator.vibrate([30, 40, 30]); } catch (e) {} }

  /* Timing : lecture, sortie lettre par lettre, pop du bouton, nettoyage */
  var delaiLecture = 1150;
  var pasSortie = 0.03;
  var dureeLettre = 0.38;
  var dureeSortieMs = Math.round((dureeLettre + (totalLettres - 1) * pasSortie) * 1000);

  window.setTimeout(function () {
    var lettresEl = overlay.querySelectorAll('.cdr-mot-lettre');
    for (var i = 0; i < lettresEl.length; i++) {
      lettresEl[i].style.animationDelay = (i * pasSortie).toFixed(3) + 's';
    }
    overlay.classList.add('cdr-mot-sortie');
  }, delaiLecture);

  window.setTimeout(function () {
    cdrCacherBouton = false;
    var pill = document.getElementById('cdr-duree-glissable');
    if (pill) {
      pill.classList.remove('cdr-pill-cache');
      pill.classList.add('cdr-pill-pop');
    }
  }, delaiLecture + dureeSortieMs - 180);

  window.setTimeout(function () {
    if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
  }, delaiLecture + dureeSortieMs + 60);
}

function rendreZoneCompteARebours() {
  var conteneur = document.getElementById('seance-zone-cdr');
  if (!conteneur) { return; }
  conteneur.className = '';
  conteneur.style.cssText =
    'background:none; border:none; box-shadow:none; padding:0; display:flex; align-items:center; ' +
    (compteARebours.actif
      ? 'margin:0 auto 12px auto; justify-content:center; width:200px; height:200px;'
      : 'margin:0 0 12px 0; justify-content:flex-end; width:auto; height:auto;');
  var html = '';
  if (compteARebours.actif) {
    html += '<div class="cdr-cercle-zone cdr-verre-disque" id="cdr-cercle-zone">';
    html += '<svg viewBox="0 0 220 220" class="cdr-svg">';
    html += '<defs><linearGradient id="degradeMinuteur" x1="0%" y1="0%" x2="100%" y2="100%">';
    html += '<stop offset="0%" stop-color="#1FD9C4"></stop>';
    html += '<stop id="cdr-degrade-stop2" offset="100%" stop-color="' + couleurThemeMinuteur() + '"></stop>';
    html += '</linearGradient></defs>';
    html += '<circle class="cdr-cercle-fond" cx="110" cy="110" r="' + CDR_RAYON + '"></circle>';
    html += '<circle id="cdr-cercle-progression" class="cdr-cercle-progression" cx="110" cy="110" r="' + CDR_RAYON + '" stroke="url(#degradeMinuteur)" stroke-dasharray="' + CDR_CIRCONFERENCE.toFixed(1) + '" stroke-dashoffset="0"></circle>';
    html += '</svg>';
    html += '<div class="cdr-centre"><span id="cdr-affichage" class="cdr-chrono">--:--</span></div>';
    html += '</div>';
  } else {
    html += '<div class="cdr-pill' + (cdrReglageDeplie ? ' cdr-pill-deplie' : '') + (cdrCacherBouton ? ' cdr-pill-cache' : ' cdr-pill-pop') + '" id="cdr-duree-glissable">';
    html += '<input type="hidden" id="cdr-minutes" value="' + derniereMinutesReglees + '">';
    html += '<input type="hidden" id="cdr-secondes" value="' + dernieresSecondesReglees + '">';
    html += '<span id="cdr-duree-affichage" class="cdr-duree-affichage">' + completerZero(derniereMinutesReglees) + ':' + completerZero(dernieresSecondesReglees) + '</span>';
    html += '<button class="cdr-bouton-lancer" id="cdr-bouton-lancer" title="Appui court : lancer / appui long : régler la durée">';
    html += '<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
    html += '<line x1="9" y1="2" x2="15" y2="2"></line>';
    html += '<circle cx="12" cy="14" r="8"></circle>';
    html += '<line x1="12" y1="14" x2="15" y2="11"></line>';
    html += '</svg>';
    html += '</button>';
    html += '</div>';
  }
  conteneur.innerHTML = html;
  if (compteARebours.actif) {
    afficherCompteARebours(compteARebours.enPause ? compteARebours.resteMsPause : (compteARebours.finMs - Date.now()));
    configurerGestesMinuteur();
  } else {
    configurerGlissementDuree();
    configurerBoutonMinuteur();
  }
}

/* Anime un élément depuis le rectangle de départ (le bouton) jusqu'à sa place finale */
function animerZoomDepuisRect(element, rectDepart) {
  if (!element || !rectDepart) { return; }
  var rectFin = element.getBoundingClientRect();
  if (!rectFin.width || !rectFin.height) { return; }

  var dx = rectDepart.left - rectFin.left;
  var dy = rectDepart.top - rectFin.top;
  var sx = rectDepart.width / rectFin.width;
  var sy = rectDepart.height / rectFin.height;
  var depart = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
  var s = element.style;

  s.webkitTransformOrigin = '0 0';
  s.transformOrigin = '0 0';
  s.webkitTransition = 'none';
  s.transition = 'none';
  s.webkitTransform = depart;
  s.transform = depart;

  void element.offsetWidth; /* force l'application de l'état de départ */

  s.webkitTransition = '-webkit-transform 0.5s cubic-bezier(0.2, 0.9, 0.25, 1)';
  s.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.25, 1)';
  s.webkitTransform = 'translate(0,0) scale(1,1)';
  s.transform = 'translate(0,0) scale(1,1)';

  window.setTimeout(function () {
    s.webkitTransition = '';
    s.transition = '';
    s.webkitTransform = '';
    s.transform = '';
    s.webkitTransformOrigin = '';
    s.transformOrigin = '';
  }, 560);
}

function demarrerCompteARebours(totalMs) {
  /* On mesure le bouton AVANT de re-rendre la zone */
  var boutonLancer = document.getElementById('cdr-bouton-lancer');
  var rectBouton = (boutonLancer && !compteARebours.actif) ? boutonLancer.getBoundingClientRect() : null;

  derniereMinutesReglees = Math.floor(totalMs / 60000);
  dernieresSecondesReglees = Math.floor((totalMs % 60000) / 1000);

  obtenirContexteAudio();

  compteARebours.actif = true;
  compteARebours.dureeTotaleMs = totalMs;
  compteARebours.finMs = Date.now() + totalMs;
  compteARebours.enPause = false;
  compteARebours.resteMsPause = null;

  if (intervalleCompteARebours) { window.clearInterval(intervalleCompteARebours); }
  intervalleCompteARebours = window.setInterval(mettreAJourCompteARebours, 250);

  rendreZoneCompteARebours();
  animerZoomDepuisRect(document.getElementById('cdr-cercle-zone'), rectBouton);
}

function lancerCompteARebours() {
  if (!document.getElementById('cdr-minutes')) { return; }
  var champMinutes = document.getElementById('cdr-minutes');
  var champSecondes = document.getElementById('cdr-secondes');
  var minutes = parseInt(champMinutes.value, 10);
  var secondes = parseInt(champSecondes.value, 10);
  if (isNaN(minutes) || minutes < 0) { minutes = 0; }
  if (isNaN(secondes) || secondes < 0) { secondes = 0; }
  var totalMs = (minutes * 60 + secondes) * 1000;
  if (totalMs <= 0) { afficherToast('Choisis une durée supérieure à zéro.'); return; }
  demarrerCompteARebours(totalMs);
}

function arreterCompteARebours() {
  compteARebours.actif = false;
  compteARebours.finMs = null;
  compteARebours.dureeTotaleMs = 0;
  compteARebours.enPause = false;
  compteARebours.resteMsPause = null;
  if (intervalleCompteARebours) { window.clearInterval(intervalleCompteARebours); intervalleCompteARebours = null; }
  rendreZoneCompteARebours();
}

function basculerPauseCompteARebours() {
  if (!compteARebours.actif) { return; }
  if (compteARebours.enPause) {
    compteARebours.enPause = false;
    compteARebours.finMs = Date.now() + compteARebours.resteMsPause;
    compteARebours.resteMsPause = null;
    if (intervalleCompteARebours) { window.clearInterval(intervalleCompteARebours); }
    intervalleCompteARebours = window.setInterval(mettreAJourCompteARebours, 250);
    afficherCompteARebours(compteARebours.finMs - Date.now());
  } else {
    compteARebours.enPause = true;
    compteARebours.resteMsPause = Math.max(0, compteARebours.finMs - Date.now());
    if (intervalleCompteARebours) { window.clearInterval(intervalleCompteARebours); intervalleCompteARebours = null; }
    afficherCompteARebours(compteARebours.resteMsPause);
  }
}

function configurerGestesMinuteur() {
  var zone = document.getElementById('cdr-cercle-zone');
  if (!zone) { return; }
  var yDepart = null;
  var deltaCourant = 0;
  var aDeplaceAssez = false;
  var SEUIL_SWIPE = 70;
  var SEUIL_TAP = 10;

  function debut(y) {
    yDepart = y;
    deltaCourant = 0;
    aDeplaceAssez = false;
    zone.style.transition = 'none';
  }
  function deplace(y) {
    if (yDepart === null) { return; }
    var delta = yDepart - y;
    if (delta < 0) { delta = delta / 3; } /* résistance si on tire vers le bas */
    deltaCourant = delta;
    if (Math.abs(delta) > SEUIL_TAP) { aDeplaceAssez = true; }
    var opacite = Math.max(0, 1 - Math.max(0, delta) / (SEUIL_SWIPE * 1.6));
    zone.style.transform = 'translateY(' + (-delta) + 'px)';
    zone.style.opacity = opacite;
  }
  function fin() {
    if (yDepart === null) { return; }
    if (deltaCourant > SEUIL_SWIPE) {
      zone.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in';
      zone.style.transform = 'translateY(-180px)';
      zone.style.opacity = '0';
      window.setTimeout(function () { arreterCompteARebours(); }, 190);
    } else {
      zone.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease';
      zone.style.transform = 'translateY(0)';
      zone.style.opacity = '1';
      if (!aDeplaceAssez) { basculerPauseCompteARebours(); }
    }
    yDepart = null;
    deltaCourant = 0;
  }

  zone.addEventListener('touchstart', function (e) { debut(e.touches[0].clientY); }, { passive: true });
  zone.addEventListener('touchmove', function (e) { deplace(e.touches[0].clientY); }, { passive: true });
  zone.addEventListener('touchend', fin, false);
  zone.addEventListener('mousedown', function (e) { debut(e.clientY); });
  zone.addEventListener('mousemove', function (e) { deplace(e.clientY); });
  zone.addEventListener('mouseup', fin);
}

function mettreAJourCompteARebours() {
  if (!compteARebours.actif) { return; }
  var resteMs = compteARebours.finMs - Date.now();
  if (resteMs <= 0) {
    compteARebours.actif = false;
    compteARebours.dureeTotaleMs = 0;
    compteARebours.enPause = false;
    compteARebours.resteMsPause = null;
    if (intervalleCompteARebours) { window.clearInterval(intervalleCompteARebours); intervalleCompteARebours = null; }
    jouerSonnerie();
    sifflerVapeur();
    cdrCacherBouton = true;
    rendreZoneCompteARebours();
    jouerMotFinMinuteur();
    return;
  }
  afficherCompteARebours(resteMs);
}

function afficherCompteARebours(resteMs) {
  var affichage = document.getElementById('cdr-affichage');
  if (!affichage) { return; }
  var totalSecondes = Math.ceil(resteMs / 1000);
  if (totalSecondes < 0) { totalSecondes = 0; }
  var minutes = Math.floor(totalSecondes / 60);
  var secondes = totalSecondes % 60;
  affichage.innerHTML = completerZero(minutes) + ':' + completerZero(secondes);

  var fractionRestante = compteARebours.dureeTotaleMs > 0 ? (resteMs / compteARebours.dureeTotaleMs) : 0;
  if (fractionRestante < 0) { fractionRestante = 0; }
  if (fractionRestante > 1) { fractionRestante = 1; }

  affichage.classList.toggle('cdr-chrono-pause', compteARebours.enPause);

  var couleur = compteARebours.enPause ? '#8996A3' : couleurCompteARebours(fractionRestante);
  var couleurDepart = compteARebours.enPause ? '#555555' : '#1FD9C4';

  var stop2 = document.getElementById('cdr-degrade-stop2');
  if (stop2) { stop2.setAttribute('stop-color', couleur); }

  affichage.style.backgroundImage = 'linear-gradient(135deg, ' + couleurDepart + ', ' + couleur + ')';

  var anneau = document.getElementById('cdr-cercle-progression');
  if (anneau) {
    var decalage = CDR_CIRCONFERENCE * (1 - fractionRestante);
    anneau.style.strokeDashoffset = decalage.toFixed(1);
  }
}

/* ============================================================
   BLOC 14 : REGLAGES (profil + synchronisation GitHub Gist)
   ============================================================ */

var CLE_REGLAGES_SYNC = 'carnetMusculationReglagesSync_v1';
var NOM_FICHIER_GIST = 'carnet-muscu-donnees.json';
var minuteurEnvoiDiffere = null;
var syncEnCours = false;

function chargerReglagesSync() {
  try {
    var brut = window.localStorage.getItem(CLE_REGLAGES_SYNC);
    if (brut) {
      var donnees = JSON.parse(brut);
      if (donnees.token === undefined) { donnees.token = ''; }
      if (donnees.gistId === undefined) { donnees.gistId = ''; }
      if (donnees.derniereSyncMs === undefined) { donnees.derniereSyncMs = null; }
      return donnees;
    }
  } catch (erreur) {}
  return { token: '', gistId: '', derniereSyncMs: null };
}

var reglagesSync = chargerReglagesSync();

function sauvegarderReglagesSync() {
  try {
    window.localStorage.setItem(CLE_REGLAGES_SYNC, JSON.stringify(reglagesSync));
  } catch (erreur) {}
}

function syncEstConfiguree() {
  return !!(reglagesSync.token && reglagesSync.gistId);
}

function mettreAJourIndicateurSync(statut) {
  var point = document.getElementById('sync-point-entete');
  if (!point) { return; }
  point.classList.remove('sync-point-ok');
  point.classList.remove('sync-point-erreur');
  point.classList.remove('sync-point-cours');
  if (statut === 'ok') { point.classList.add('sync-point-ok'); }
  if (statut === 'erreur') { point.classList.add('sync-point-erreur'); }
  if (statut === 'cours') { point.classList.add('sync-point-cours'); }
}

function afficherStatutSync(message, statut) {
  if (statut) { mettreAJourIndicateurSync(statut); }
  var zone = document.getElementById('sync-statut-zone');
  if (zone) { zone.innerHTML = echapperHtml(message); }
}

function requeteGithub(methode, chemin, corpsObjet, callback) {
  if (!reglagesSync.token) { callback(false, null, 0, 'Aucun token renseigné.'); return; }
  var xhr = new XMLHttpRequest();
  try {
    xhr.open(methode, 'https://api.github.com' + chemin, true);
  } catch (erreurOuverture) {
    callback(false, null, 0, 'Impossible de contacter GitHub.');
    return;
  }
  xhr.setRequestHeader('Accept', 'application/vnd.github+json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + reglagesSync.token);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      var succes = xhr.status >= 200 && xhr.status < 300;
      var donnees = null;
      try { donnees = JSON.parse(xhr.responseText); } catch (e) { donnees = null; }
      callback(succes, donnees, xhr.status, succes ? '' : messageErreurGithub(xhr.status));
    }
  };
  xhr.onerror = function () {
    callback(false, null, 0, 'Connexion impossible (réseau, ou navigateur trop ancien pour ce site).');
  };
  if (corpsObjet) { xhr.send(JSON.stringify(corpsObjet)); } else { xhr.send(); }
}

function messageErreurGithub(status) {
  if (status === 401) { return 'Token invalide ou expiré.'; }
  if (status === 404) { return 'Gist introuvable (vérifie l\'identifiant).'; }
  if (status === 403) { return 'Accès refusé (droits du token, ou limite atteinte).'; }
  if (status === 0) { return 'Connexion impossible.'; }
  return 'Erreur GitHub (code ' + status + ').';
}

function creerNouveauGist() {
  var tokenSaisi = document.getElementById('champ-sync-token').value.trim();
  if (!tokenSaisi) { afficherToast('Colle d\'abord ton token GitHub ci-dessus.'); return; }
  reglagesSync.token = tokenSaisi;
  sauvegarderReglagesSync();
  afficherStatutSync('Création du gist en cours...', 'cours');
  var corps = { description: 'Données Carnet Muscu (ne pas modifier a la main)', public: false, files: {} };
  corps.files[NOM_FICHIER_GIST] = { content: JSON.stringify(etat) };
  requeteGithub('POST', '/gists', corps, function (succes, donnees, status, messageErreur) {
    if (!succes || !donnees || !donnees.id) {
      afficherStatutSync('Échec de la création : ' + messageErreur, 'erreur');
      return;
    }
    reglagesSync.gistId = donnees.id;
    reglagesSync.derniereSyncMs = Date.now();
    sauvegarderReglagesSync();
    afficherStatutSync('Gist créé avec succès.', 'ok');
    rendreZoneSync();
  });
}

function pousserVersGist(callbackFinal) {
  if (!syncEstConfiguree()) { if (callbackFinal) { callbackFinal(false); } return; }
  syncEnCours = true;
  afficherStatutSync('Envoi en cours...', 'cours');
  var corps = { files: {} };
  corps.files[NOM_FICHIER_GIST] = { content: JSON.stringify(etat) };
  requeteGithub('PATCH', '/gists/' + reglagesSync.gistId, corps, function (succes, donnees, status, messageErreur) {
    syncEnCours = false;
    if (succes) {
      reglagesSync.derniereSyncMs = Date.now();
      sauvegarderReglagesSync();
      afficherStatutSync('Synchronisé à ' + new Date().toLocaleTimeString(), 'ok');
    } else {
      afficherStatutSync('Échec de l\'envoi : ' + messageErreur, 'erreur');
    }
    if (callbackFinal) { callbackFinal(succes); }
  });
}

function tirerDepuisGist(callbackFinal) {
  if (!syncEstConfiguree()) { if (callbackFinal) { callbackFinal(false); } return; }
  syncEnCours = true;
  afficherStatutSync('Vérification des données distantes...', 'cours');
  requeteGithub('GET', '/gists/' + reglagesSync.gistId, null, function (succes, donnees, status, messageErreur) {
    syncEnCours = false;
    if (!succes || !donnees || !donnees.files || !donnees.files[NOM_FICHIER_GIST]) {
      afficherStatutSync('Échec de la récupération : ' + (messageErreur || 'fichier introuvable dans le gist'), 'erreur');
      if (callbackFinal) { callbackFinal(false); }
      return;
    }
    var etatDistant = null;
    try {
      etatDistant = JSON.parse(donnees.files[NOM_FICHIER_GIST].content);
    } catch (erreurParse) {
      afficherStatutSync('Données distantes illisibles.', 'erreur');
      if (callbackFinal) { callbackFinal(false); }
      return;
    }
    var horodatageDistant = etatDistant.derniereMiseAJour || 0;
    var horodatageLocal = etat.derniereMiseAJour || 0;
    if (horodatageDistant > horodatageLocal) {
      etat = completerChampsEtat(etatDistant);
      try { window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat)); } catch (e) {}
      afficherStatutSync('Données plus récentes récupérées.', 'ok');
      allerVersPage(pageCourante);
    } else {
      afficherStatutSync('Déjà à jour.', 'ok');
    }
    reglagesSync.derniereSyncMs = Date.now();
    sauvegarderReglagesSync();
    if (callbackFinal) { callbackFinal(true); }
  });
}

function synchroniserMaintenant() {
  tirerDepuisGist(function () {
    pousserVersGist(null);
  });
}

function programmerEnvoiDiffere() {
  if (!syncEstConfiguree()) { return; }
  if (minuteurEnvoiDiffere) { window.clearTimeout(minuteurEnvoiDiffere); }
  minuteurEnvoiDiffere = window.setTimeout(function () {
    minuteurEnvoiDiffere = null;
    pousserVersGist(null);
  }, 2500);
}

function basculerAffichageToken() {
  var champ = document.getElementById('champ-sync-token');
  var case_ = document.getElementById('case-afficher-token');
  if (!champ || !case_) { return; }
  champ.type = case_.checked ? 'text' : 'password';
}

function rendreZoneSync() {
  var zone = document.getElementById('sync-zone-dynamique');
  if (!zone) { return; }
  var html = '';
  if (!reglagesSync.gistId) {
    html += '<button class="btn btn-plein btn-bloc" data-action="creer-gist">Créer un nouveau gist</button>';
    html += '<div class="texte-att" style="margin-top:8px;">À faire une seule fois, sur ton premier appareil. Colle ensuite le même token et l\'identifiant obtenu sur tes autres appareils.</div>';
  } else {
    html += '<div class="champ"><label>Identifiant du gist (à recopier sur tes autres appareils)</label><div class="sync-id-affiche">' + echapperHtml(reglagesSync.gistId) + '</div></div>';
    html += '<button class="btn btn-contour btn-bloc" data-action="synchroniser-maintenant">Synchroniser maintenant</button>';
  }
  html += '<div class="sync-statut-texte" id="sync-statut-zone"></div>';
  zone.innerHTML = html;
}

function ouvrirNotice() {
  var html = '';
  html += '<div class="modal-entete"><h2>Notice complète</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';

  html += '<div class="notice-section"><h3>Accueil</h3><p>Quatre raccourcis : Nouvelle séance, Nutrition, Bibliothèque, Historique. Deux bannières peuvent apparaître automatiquement : un rappel pour vérifier ton objectif de programme (toutes les 4 semaines), et une alerte météo si la température à ton lieu d\'entraînement dépasse les seuils que tu as réglés.</p></div>';

  html += '<div class="notice-section"><h3>Nouvelle séance</h3><ul>';
  html += '<li>Si une séance est planifiée aujourd\'hui dans l\'agenda, elle apparaît en premier avec un bouton <strong>Début</strong>. Sinon, choisis une séance libre dans la liste.</li>';
  html += '<li>Une fois lancée : chrono en haut, et un <strong>minuteur de repos</strong> réglable en minutes/secondes, toujours accessible, qui sonne une seule fois (bip généré, pas de fichier audio).</li>';
  html += '<li>Pour chaque exercice : la <strong>barre de charge</strong> (un bloc par série, se remplit au fur et à mesure), la <strong>bulle ✓</strong> pour valider poids/reps d\'une série, le <strong>crayon ✎</strong> pour noter un changement ou une douleur sur une série précise.</li>';
  html += '<li>Le bouton <strong>+ Échauffement</strong> ajoute une série d\'échauffement, placée avant les séries de travail (après les échauffements déjà ajoutés). Elle est numérotée « É1, É2... », ne compte jamais dans les records, l\'historique, le volume ou la progression, et peut être validée/supprimée comme une série normale.</li>';
  html += '<li>Un champ <strong>RPE</strong> (0 à 10, préremplit à 3) par exercice pour ton ressenti d\'effort, réglable en glissant directement sur le chiffre.</li>';
  html += '<li>La <strong>référence "dernière fois"</strong> (ce que tu avais fait la séance précédente) et un badge <strong>★ Nouveau record</strong> si tu dépasses ton meilleur poids.</li>';
  html += '<li>Des badges rappellent la structure de séries, la technique d\'intensification et le tempo si tu les as définis pour cet exercice dans la séance.</li>';
  html += '<li>Le bouton <strong>Fin</strong> enregistre tout dans l\'historique, calcule la durée et les calories dépensées (formule MET × poids corporel × durée).</li>';
  html += '</ul></div>';

  html += '<div class="notice-section"><h3>Bibliothèque</h3><ul>';
  html += '<li><strong>Exercices</strong> : recherche par nom ou groupe musculaire avec ET/OU (ex. "dos ET poulie"), groupes musculaires repliables. Le bouton "Charger les exercices de base" ajoute 45 exercices adaptés à ton matériel (rack ATX, banc, barre, haltères, élastiques...). En modifiant un exercice : historique (nombre de fois, poids max par mode, RPE moyen), schéma des muscles ciblés, et un champ Variantes (prise, position) pré-rempli pour les exercices qui en ont.</li>';
  html += '<li><strong>Séances</strong> : assembler des exercices avec poids/reps/séries, et pour chacun une structure de séries (linéaire, pyramide montante/descendante, échelle, cluster), une technique d\'intensification (drop set, rest-pause...) et un tempo.</li>';
  html += '<li><strong>Programmes</strong> : regrouper des séances, définir un objectif texte libre, un type de mésocycle (Hypertrophie/Force/Décharge/Personnalisé) et une durée en semaines. Un seul programme actif à la fois ("Démarrer ce programme"). Ce type de mésocycle est aussi utilisé pour ajuster automatiquement tes objectifs nutrition (voir section Nutrition).</li>';
  html += '<li><strong>Aliments</strong> : bibliothèque 100% végétalienne. Le bouton "Charger les aliments de base" ajoute 32 aliments (tofu, tempeh, seitan, légumineuses, céréales, laits et fromages végétaux...).</li>';
  html += '</ul></div>';

  html += '<div class="notice-section"><h3>Nutrition</h3>';
  html += '<p>Journal du jour avec navigation par date (flèches). Barres de progression Protéines/Glucides/Lipides comparées à tes objectifs (réglables dans Réglages). Bouton "+ Ajouter" pour choisir un aliment de la bibliothèque et sa quantité en grammes.</p>';
  html += '<p><strong>Recalcul automatique des objectifs</strong> : le bouton "Recalculer automatiquement mes objectifs" ajuste tes cibles caloriques et de macronutriments à partir de ton poids corporel et du type de mésocycle de ton programme actif :</p>';
  html += '<ul>';
  html += '<li><strong>Hypertrophie</strong> : léger surplus calorique (~+10%) pour soutenir la synthèse protéique musculaire, avec un apport protéique élevé (~2g/kg de poids de corps) — quantité généralement admise comme suffisante pour maximiser la prise de masse maigre sans excès catabolique.</li>';
  html += '<li><strong>Force</strong> : maintien calorique (autour du métabolisme de base + activité), protéines élevées (~1.8-2g/kg) pour la récupération, avec une part de glucides plus importante pour soutenir la performance sur les charges lourdes (resynthèse du glycogène musculaire).</li>';
  html += '<li><strong>Décharge</strong> : léger déficit ou maintien bas, car le volume et l\'intensité d\'entraînement chutent temporairement : les besoins énergétiques diminuent, mais les protéines restent élevées pour préserver la masse musculaire pendant cette phase de récupération.</li>';
  html += '<li><strong>Personnalisé</strong> : valeurs par défaut modérées (maintien, ~1.8g/kg de protéines), à ajuster manuellement selon ton objectif propre.</li>';
  html += '</ul>';
  html += '<p class="texte-att">Ces repères s\'appuient sur des recommandations courantes en nutrition sportive (apport protéique de 1.6 à 2.2g/kg selon les objectifs, surplus/déficit de 10 à 20% pour la prise de masse ou la perte de poids). Ce sont des points de départ raisonnables, pas des valeurs individualisées : ajuste-les selon ta réponse réelle (poids, énergie, performance).</p>';
  html += '</div>';

  html += '<div class="notice-section"><h3>Historique</h3><ul>';
  html += '<li><strong>Agenda</strong> : calendrier avec des points de couleur par jour — prévu (cyan), fait complet (vert), fait incomplet (orange), piscine (bleu), objectifs nutrition atteints (violet). Case à cocher simple pour noter une séance de piscine. Bouton "+ Planifier" pour programmer une séance à une date.</li>';
  html += '<li><strong>Progression</strong> : courbe de poids corporel (alimentée automatiquement quand tu mets à jour ton poids dans Réglages), poids max par exercice et par mode, volume total par semaine, calories dépensées, et 4 courbes nutrition sur 30 jours (calories, protéines, glucides, lipides).</li>';
  html += '<li><strong>Équilibre</strong> : volume (séries) et fréquence (jours) par groupe musculaire cette semaine, avec comparaison Pectoraux/Dos et alerte en cas de déséquilibre marqué.</li>';
  html += '<li><strong>Suggestions</strong> : signaux de fatigue accumulée (ressenti quotidien + tendance RPE + semaines sans décharge, seulement si au moins 2 signaux concordent) et plateaux détectés par exercice. Toujours expliqués, jamais des décisions automatiques.</li>';
  html += '</ul></div>';

  html += '<div class="notice-section"><h3>Réglages</h3><ul>';
  html += '<li>Poids corporel (alimente la courbe et le calcul de calories), objectifs nutrition quotidiens.</li>';
  html += '<li>Météo du lieu d\'entraînement : latitude/longitude et seuils de température min/max (via Open-Meteo, gratuit et sans compte).</li>';
  html += '<li>Synchronisation entre appareils via un Gist GitHub personnel (token + identifiant à coller sur chaque appareil).</li>';
  html += '</ul></div>';

  html += '<div class="notice-section"><h3>Bon à savoir</h3><ul>';
  html += '<li>Toutes les données restent sur l\'appareil (localStorage) sauf si tu actives la synchronisation.</li>';
  html += '<li>Les suggestions, alertes météo et objectifs nutrition recalculés sont des pistes, pas des décisions — à valider avec ton bon sens ou ton coach.</li>';
  html += '<li>Ressenti quotidien, ressenti météo et synchro dépendent du réseau ou d\'une saisie manuelle : rien n\'est bloquant si tu ne les utilises pas.</li>';
  html += '</ul></div>';

  ouvrirModal(html);
}

function obtenirProgrammeActif() {
  if (!etat.programmeActif) { return null; }
  return trouverParId(etat.programmes, etat.programmeActif.programmeId);
}

function calculerObjectifsNutritionAuto() {
  var poids = parseFloat(document.getElementById('champ-profil-poids').value) || etat.profil.poidsCorporel || 75;
  var taille = parseFloat(document.getElementById('champ-profil-taille').value) || etat.profil.tailleCm || 175;
  var age = etat.profil.age || 30; // à ajouter si tu veux affiner, sinon valeur par défaut
  var sexe = etat.profil.sexe || 'homme'; // idem, optionnel

  // Métabolisme de base (Mifflin-St Jeor)
  var mb;
  if (sexe === 'femme') {
    mb = (10 * poids) + (6.25 * taille) - (5 * age) - 161;
  } else {
    mb = (10 * poids) + (6.25 * taille) - (5 * age) + 5;
  }

  // Facteur d'activité (pratiquant la musculation régulièrement)
  var facteurActivite = 1.55;
  var maintenance = mb * facteurActivite;

  // Ajustement selon l'objectif du programme actif
  var programmeActif = (typeof obtenirProgrammeActif === 'function') ? obtenirProgrammeActif() : null;
  var typeObjectif = programmeActif ? (programmeActif.typeMesocycle || '') : '';

  var calories = maintenance;
  if (typeObjectif === 'force' || typeObjectif === 'hypertrophie') {
    calories = maintenance + 250; // léger surplus
  } else if (typeObjectif === 'decharge') {
    calories = maintenance - 200; // léger déficit
  }
  // "Personnalisé" ou vide -> maintenance

  // Répartition des macros
  var proteinesG = Math.round(poids * 2); // 2g/kg, standard musculation
  var lipidesG = Math.round((calories * 0.25) / 9); // 25% des calories
  var caloriesRestantes = calories - (proteinesG * 4) - (lipidesG * 9);
  var glucidesG = Math.round(caloriesRestantes / 4);
  if (glucidesG < 0) { glucidesG = 0; }

  document.getElementById('champ-profil-calories').value = Math.round(calories);
  document.getElementById('champ-profil-proteines').value = proteinesG;
  document.getElementById('champ-profil-lipides').value = lipidesG;
  document.getElementById('champ-profil-glucides').value = glucidesG;

  afficherToast('Objectifs recalculés selon ton profil.');
}

/* ============================================================
   REGLAGES — navigation par sous-pages
   ============================================================ */

var vueReglagesActuelle = 'menu';

var TITRES_REGLAGES = {
  menu: 'Réglages',
  profil: 'Profil & objectifs',
  meteo: 'Météo du lieu d\'entraînement',
  sync: 'Synchronisation',
  rappels: 'Rappels & notifications',
  personnalisation: 'Personnalisation',
  sauvegarde: 'Sauvegarde manuelle'
};

function htmlSelecteurSonnerie() {
  var courant = etat.profil.sonnerie || 'auto';
  var html = '<div class="champ"><label>Sonnerie du minuteur</label>';
  html += '<select id="champ-profil-sonnerie">';
  html += '<option value="auto"' + (courant === 'auto' ? ' selected' : '') + '>🎨 Assortie au thème</option>';
  for (var i = 0; i < SONNERIES.length; i++) {
    var sel = (courant === SONNERIES[i].valeur) ? ' selected' : '';
    html += '<option value="' + SONNERIES[i].valeur + '"' + sel + '>' + echapperHtml(SONNERIES[i].libelle) + '</option>';
  }
  html += '</select></div>';
  html += '<button class="btn btn-contour btn-bloc" data-action="tester-sonnerie" style="margin-bottom:10px;">▶ Écouter la sonnerie</button>';
  return html;
}

function ouvrirReglages() {
  rendreReglages('menu');
}

function rendreReglages(vue, sens) {
  if (vue !== 'personnalisation') { annulerApercuTheme(); }
  vueReglagesActuelle = vue;

  let html = '<div class="modal-entete"><div class="modal-entete-gauche">';
  
  if (vue !== 'menu') {
    html += '<button class="bouton-retour" data-action="reglages-retour">&#8249;</button>';
  }
  
  html += '<h2>' + TITRES_REGLAGES[vue] + '</h2>';
  html += '</div><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';

  if (vue === 'menu') { html += construireMenuReglages(); }
  if (vue === 'profil') { html += construireReglagesProfil(); }
  if (vue === 'meteo') { html += construireReglagesMeteo(); }
  if (vue === 'sync') { html += construireReglagesSync(); }
  if (vue === 'rappels') { html += construireReglagesRappels(); }
  if (vue === 'personnalisation') { html += construireReglagesPersonnalisation(); }
  if (vue === 'sauvegarde') { html += construireReglagesSauvegarde(); }

  ouvrirModal(html, sens);

  if (vue === 'sync') { rendreZoneSync(); }
  if (vue === 'rappels') { renderRemindersSettings(); }
}

function construireMenuReglages() {
  var html = '<ul class="reglages-menu">';
  html += ligneMenuReglages('👤', 'Profil & objectifs', 'profil');
  html += ligneMenuReglages('🌤️', 'Météo du lieu d\'entraînement', 'meteo');
  html += ligneMenuReglages('🔄', 'Synchronisation', 'sync');
  html += ligneMenuReglages('🔔', 'Rappels & notifications', 'rappels');
  html += ligneMenuReglages('🎨', 'Personnalisation', 'personnalisation');
  html += ligneMenuReglages('💾', 'Sauvegarde manuelle', 'sauvegarde');
  html += '</ul>';
  return html;
}

function ligneMenuReglages(icone, libelle, section) {
  var html = '<li class="reglages-menu-ligne" data-action="reglages-ouvrir-section" data-section="' + section + '">';
  html += '<span class="reglages-menu-icone">' + icone + '</span>';
  html += '<span class="reglages-menu-libelle">' + echapperHtml(libelle) + '</span>';
  html += '<span class="reglages-menu-chevron">&#8250;</span>';
  html += '</li>';
  return html;
}

/* ============================================================
   REGLAGES : sous-pages
   ============================================================ */

/* --- Petits utilitaires de mise en page --- */

function sectionReglages(titre, contenu) {
  var html = '<div class="reglages-section">';
  if (titre) { html += '<h3 class="reglages-section-titre">' + echapperHtml(titre) + '</h3>'; }
  html += contenu + '</div>';
  return html;
}

function champReglage(libelle, id, type, pas, valeur, placeholder) {
  var html = '<div class="champ"><label>' + echapperHtml(libelle) + '</label>';
  html += '<input type="' + type + '"' + (pas ? ' step="' + pas + '"' : '') + ' id="' + id + '" value="' + echapperHtml(valeur) + '"';
  if (placeholder) { html += ' placeholder="' + echapperHtml(placeholder) + '"'; }
  html += '></div>';
  return html;
}

function valeurOuVide(v) {
  return (v !== null && v !== undefined) ? v : '';
}

/* --- Profil & objectifs --- */

function construireReglagesProfil() {
  var p = etat.profil;
  var html = '';

  var corps = '<div class="reglages-grille">';
  corps += champReglage('Poids (kg)', 'champ-profil-poids', 'number', '0.1', p.poidsCorporel || 75);
  corps += champReglage('Taille (cm)', 'champ-profil-taille', 'number', '1', p.tailleCm || 175);
  corps += champReglage('Âge', 'champ-profil-age', 'number', '1', p.age || 30);
  corps += '<div class="champ"><label>Sexe</label><select id="champ-profil-sexe">';
  corps += '<option value="homme"' + (p.sexe !== 'femme' ? ' selected' : '') + '>Homme</option>';
  corps += '<option value="femme"' + (p.sexe === 'femme' ? ' selected' : '') + '>Femme</option>';
  corps += '</select></div>';
  corps += '</div>';
  corps += '<p class="reglages-note">Le sexe sert uniquement au calcul du métabolisme de base. Le poids et la taille servent aussi à estimer les calories dépensées pendant les séances.</p>';
  html += sectionReglages('Mon corps', corps);

  var obj = champReglage('Calories (kcal / jour)', 'champ-profil-calories', 'number', '1', p.objectifCalories || 2200);
  obj += '<div class="reglages-grille reglages-grille-3">';
  obj += champReglage('Protéines (g)', 'champ-profil-proteines', 'number', '1', p.objectifProteines || 150);
  obj += champReglage('Glucides (g)', 'champ-profil-glucides', 'number', '1', p.objectifGlucides || 250);
  obj += champReglage('Lipides (g)', 'champ-profil-lipides', 'number', '1', p.objectifLipides || 70);
  obj += '</div>';
  obj += '<button class="btn btn-contour btn-bloc" data-action="calculer-objectifs-nutrition">🔄 Recalculer automatiquement</button>';
  obj += '<p class="reglages-note">Le recalcul utilise le poids et la taille affichés ci-dessus, mais l\'âge et le sexe déjà enregistrés : enregistre d\'abord si tu les as modifiés.</p>';
  html += sectionReglages('Objectifs nutritionnels', obj);

  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-profil">Enregistrer le profil</button>';
  return html;
}

function enregistrerProfil() {
  var poids = parseFloat(document.getElementById('champ-profil-poids').value);
  etat.profil.poidsCorporel = poids > 0 ? poids : 75;
  var taille = parseFloat(document.getElementById('champ-profil-taille').value);
  etat.profil.tailleCm = taille > 0 ? taille : 175;
  var age = parseInt(document.getElementById('champ-profil-age').value, 10);
  etat.profil.age = (!isNaN(age) && age > 0) ? age : 30;
  etat.profil.sexe = (document.getElementById('champ-profil-sexe').value === 'femme') ? 'femme' : 'homme';
  etat.profil.objectifProteines = parseFloat(document.getElementById('champ-profil-proteines').value) || 150;
  etat.profil.objectifGlucides = parseFloat(document.getElementById('champ-profil-glucides').value) || 250;
  etat.profil.objectifLipides = parseFloat(document.getElementById('champ-profil-lipides').value) || 70;
  etat.profil.objectifCalories = parseFloat(document.getElementById('champ-profil-calories').value) || 2200;
  etat.poidsCorporelHistorique[formaterDateISO(new Date())] = etat.profil.poidsCorporel;
  sauvegarderEtat();
  afficherToast('Profil enregistré.');
}

/* --- Météo --- */

function construireReglagesMeteo() {
  var p = etat.profil;
  var html = '';

  var lieu = '<div class="reglages-grille">';
  lieu += champReglage('Latitude', 'champ-profil-latitude', 'number', '0.001', valeurOuVide(p.latitudeGym));
  lieu += champReglage('Longitude', 'champ-profil-longitude', 'number', '0.001', valeurOuVide(p.longitudeGym));
  lieu += '</div>';
  lieu += '<p class="reglages-note">Les coordonnées de l\'endroit où tu t\'entraînes. La météo vient d\'Open-Meteo, sans compte.</p>';
  html += sectionReglages('Lieu d\'entraînement', lieu);

  var seuils = '<div class="reglages-grille">';
  seuils += champReglage('Minimum (°C)', 'champ-profil-temp-min', 'number', '1', valeurOuVide(p.seuilTempMin), 'ex. 10');
  seuils += champReglage('Maximum (°C)', 'champ-profil-temp-max', 'number', '1', valeurOuVide(p.seuilTempMax), 'ex. 28');
  seuils += '</div>';
  seuils += '<p class="reglages-note">Optionnels : te signalent une température trop basse ou trop élevée à ton lieu d\'entraînement.</p>';
  html += sectionReglages('Seuils de température', seuils);

  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-meteo-profil">Enregistrer</button>';
  return html;
}

function enregistrerMeteoProfil() {
  var latitude = parseFloat(document.getElementById('champ-profil-latitude').value);
  var longitude = parseFloat(document.getElementById('champ-profil-longitude').value);
  etat.profil.latitudeGym = isNaN(latitude) ? null : latitude;
  etat.profil.longitudeGym = isNaN(longitude) ? null : longitude;
  var tempMax = parseFloat(document.getElementById('champ-profil-temp-max').value);
  var tempMin = parseFloat(document.getElementById('champ-profil-temp-min').value);
  etat.profil.seuilTempMax = isNaN(tempMax) ? null : tempMax;
  etat.profil.seuilTempMin = isNaN(tempMin) ? null : tempMin;
  meteoDerniereVerifMs = null;
  sauvegarderEtat();
  afficherToast('Réglages météo enregistrés.');
}

/* --- Synchronisation --- */

function construireReglagesSync() {
  var html = '';

  var connexion = champReglage('Token d\'accès personnel GitHub', 'champ-sync-token', 'password', '', reglagesSync.token, 'ghp_...');
  connexion += '<label class="reglages-interrupteur"><span>Afficher le token</span><input type="checkbox" id="case-afficher-token" data-action="basculer-token"></label>';
  connexion += champReglage('Identifiant du gist', 'champ-sync-gistid', 'text', '', reglagesSync.gistId, 'colle ici l\'identifiant');
  connexion += '<p class="reglages-note">Si tu as déjà un gist sur un autre appareil, colle son identifiant. Sinon, enregistre le token puis crée un nouveau gist.</p>';
  connexion += '<button class="btn btn-contour btn-bloc" data-action="enregistrer-reglages-sync">Enregistrer le token / l\'identifiant</button>';
  html += sectionReglages('Connexion GitHub', connexion);

  html += '<div class="reglages-section"><div id="sync-zone-dynamique"></div></div>';
  return html;
}

function enregistrerReglagesSync() {
  var nouveauGistId = document.getElementById('champ-sync-gistid').value.trim();
  var nouveauToken = document.getElementById('champ-sync-token').value.trim();
  var etaitDejaConfiguree = !!reglagesSync.gistId;
  var aDesDonneesLocales = etat.exercices.length > 0 || etat.seances.length > 0 || etat.agenda.length > 0;

  var appliquer = function () {
    reglagesSync.token = nouveauToken;
    reglagesSync.gistId = nouveauGistId;
    sauvegarderReglagesSync();
    rendreZoneSync();
    if (syncEstConfiguree()) { synchroniserMaintenant(); }
  };

  if (!etaitDejaConfiguree && nouveauGistId && aDesDonneesLocales) {
    demanderConfirmation('Cet appareil contient déjà des données locales (exercices, séances ou historique). En reliant un gist existant, seule la version la plus récente entre cet appareil et le gist sera conservée, SANS fusion — l\'autre version sera perdue. Continuer ?', function () {
      fermerModal();
      rendreReglages('sync');
      appliquer();
    }, function () {
      rendreReglages('sync');
    });
  } else {
    appliquer();
  }
}

/* --- Rappels --- */

function construireReglagesRappels() {
  var html = '<p class="reglages-note" style="margin:0 2px 12px;">Les rappels s\'affichent à l\'ouverture de l\'application, à partir de l\'heure choisie.</p>';
  html += '<div id="reminders-container"></div>';
  html += '<button class="btn btn-contour btn-bloc" data-action="tester-notif">🔔 Tester une notification</button>';
  return html;
}

/* --- Personnalisation --- */

var THEMES_PERSONNALISATION = [
  { valeur: 'sombre',     libelle: 'Sombre',          fond: '#12151A', a: '#1FD9C4', b: '#22A7E5' },
  { valeur: 'clair',      libelle: 'Clair',           fond: '#F4F6F8', a: '#1FD9C4', b: '#22A7E5' },
  { valeur: 'auto',       libelle: 'Auto',            fond: 'linear-gradient(135deg, #12151A 50%, #F4F6F8 50%)', a: '#1FD9C4', b: '#22A7E5' },
  { valeur: 'automnal',   libelle: '🍁 Automnal',     fond: '#1A1410', a: '#E08D3C', b: '#B23A2E' },
  { valeur: 'effroi',     libelle: '🎃 Effroi',       fond: '#0D0710', a: '#FF7A1A', b: '#7B2FF7' },
  { valeur: 'hivernal',   libelle: '❄️ Hivernal',     fond: '#0B141C', a: '#7FD8F2', b: '#3E7CB1' },
  { valeur: 'paindepice', libelle: '🍪 Pain d\'épice', fond: '#0B1C13', a: '#D4AF37', b: '#C1272D' },
  { valeur: 'printanier', libelle: '🌸 Printanier',   fond: '#10160F', a: '#8FD694', b: '#F2A6C7' },
  { valeur: 'pastel',     libelle: '🦄 Pastel',       fond: '#17141C', a: '#B8A3E0', b: '#F7C6D9' },
  { valeur: 'estival',    libelle: '☀️ Estival',      fond: '#03313c', a: '#00d4fe', b: '#FFC857' },
  { valeur: 'cyberpunk',  libelle: '🦾 Cyberpunk',    fond: '#0A0612', a: '#00F0FF', b: '#FF2BD6' },
  { valeur: 'steampunk',  libelle: '⚙️ Steampunk',    fond: '#14100A', a: '#C68A3D', b: '#58412c' },
  { valeur: 'flibuste',   libelle: '🏴‍☠️ Flibuste',    fond: '#0B1620', a: '#72b4ff', b: '#693b13' },
  { valeur: 'ruedor',     libelle: '🤠 Western',      fond: '#1B130E', a: '#F2C14E', b: '#C4582F' },
  { valeur: 'wasteland',  libelle: '☢️ Wasteland', fond: '#17100B', a: '#FF6A1F', b: '#F5C518' },
];

var SONNERIES_PERSONNALISATION = [
  { valeur: 'classique', libelle: 'Classique' },
  { valeur: 'douce', libelle: 'Douce' },
  { valeur: 'alarme', libelle: 'Alarme' }
];

function construireReglagesPersonnalisation() {
  var theme = etat.profil.theme || 'sombre';
  var sonnerie = etat.profil.sonnerieMinuteur || 'classique';
  var html = '';

  var themes = '<input type="hidden" id="champ-perso-theme" value="' + echapperHtml(theme) + '">';
  themes += '<div class="reglages-themes">';
  for (var i = 0; i < THEMES_PERSONNALISATION.length; i++) {
    var t = THEMES_PERSONNALISATION[i];
    themes += '<div class="reglages-theme"><button class="reglages-theme-bouton' + (t.valeur === theme ? ' reglage-option-active' : '') + '" data-action="choisir-option" data-champ="champ-perso-theme" data-valeur="' + t.valeur + '">';
    themes += '<span class="reglages-theme-apercu" style="background:' + t.fond + ';"><span class="reglages-theme-pastille" style="background:linear-gradient(135deg, ' + t.a + ', ' + t.b + ');"></span></span>';
    themes += '<span class="reglages-theme-nom">' + echapperHtml(t.libelle) + '</span>';
    themes += '</button></div>';
  }
  themes += '</div>';
  html += sectionReglages('Thème', themes);

  var son = '<input type="hidden" id="champ-perso-sonnerie" value="' + echapperHtml(sonnerie) + '">';
  son += '<div class="reglages-segments">';
  for (var j = 0; j < SONNERIES_PERSONNALISATION.length; j++) {
    var s = SONNERIES_PERSONNALISATION[j];
    son += '<button class="reglages-segment' + (s.valeur === sonnerie ? ' reglage-option-active' : '') + '" data-action="choisir-option" data-champ="champ-perso-sonnerie" data-valeur="' + s.valeur + '">' + echapperHtml(s.libelle) + '</button>';
  }
  son += '</div>';
  son += '<p class="reglages-note">Classique : 3 bips. Douce : un bip long et grave. Alarme : des bips rapides.</p>';
  son += '<button class="btn btn-contour btn-bloc" data-action="tester-sonnerie-minuteur">🔊 Tester la sonnerie</button>';
  html += sectionReglages('Sonnerie du minuteur de repos', son);

  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-personnalisation">Enregistrer</button>';
  return html;
}

/* --- Aperçu en direct du thème (annulé si on ne valide pas) --- */

var themeAvantApercu = null;

function apercuTheme(valeur) {
  if (themeAvantApercu === null) { themeAvantApercu = etat.profil.theme || 'sombre'; }
  etat.profil.theme = valeur;
  appliquerTheme();
}

function annulerApercuTheme() {
  if (themeAvantApercu === null) { return; }
  etat.profil.theme = themeAvantApercu;
  themeAvantApercu = null;
  appliquerTheme();
}

/* appelé par fermerModal() (croix, glissement, clic sur le fond) */
window.surFermetureModal = annulerApercuTheme;

function choisirOptionReglage(bouton) {
  var idChamp = bouton.getAttribute('data-champ');
  var valeur = bouton.getAttribute('data-valeur');
  var champ = document.getElementById(idChamp);
  if (champ) { champ.value = valeur; }

  var conteneur = bouton.closest('.reglages-section');
  var actifs = conteneur ? conteneur.querySelectorAll('.reglage-option-active') : [];
  for (var i = 0; i < actifs.length; i++) { actifs[i].classList.remove('reglage-option-active'); }
  bouton.classList.add('reglage-option-active');

  if (idChamp === 'champ-perso-theme') { apercuTheme(valeur); }
  if (idChamp === 'champ-perso-sonnerie') { jouerSonnerie(valeur); }
}

function enregistrerPersonnalisation() {
  themeAvantApercu = null; /* choix validé : plus rien à annuler */
  etat.profil.theme = document.getElementById('champ-perso-theme').value;
  etat.profil.sonnerieMinuteur = document.getElementById('champ-perso-sonnerie').value;
  appliquerTheme();
  sauvegarderEtat();
  afficherToast('Personnalisation enregistrée.');
}

function testerSonnerieMinuteur() {
  var select = document.getElementById('champ-perso-sonnerie');
  jouerSonnerie(select ? select.value : null);
}

/* --- Sauvegarde manuelle --- */

function construireReglagesSauvegarde() {
  var html = '<p class="reglages-note" style="margin:0 2px 12px;">Indépendante de la synchronisation : utile en secours si le gist ne se met pas à jour, ou pour garder une copie avant de changer d\'appareil.</p>';

  var exp = '<p class="reglages-note" style="margin-top:0;">Copie toutes tes données dans un texte à coller dans Notes ou un e-mail.</p>';
  exp += '<button class="btn btn-contour btn-bloc" data-action="ouvrir-export-donnees">Exporter mes données</button>';
  html += sectionReglages('Exporter', exp);

  var imp = '<p class="reglages-note" style="margin-top:0;">Remplace toutes les données de cet appareil par une sauvegarde précédente.</p>';
  imp += '<button class="btn btn-contour btn-bloc" data-action="ouvrir-import-donnees">Importer des données</button>';
  html += sectionReglages('Importer', imp);
  return html;
}

/* ============================================================
   BLOC 15 : PROGRESSION (courbes SVG)
   ============================================================ */

function exercicesAvecHistorique() {
  var idsRencontres = [];
  var resultat = [];
  for (var i = 0; i < etat.agenda.length; i++) {
    var entree = etat.agenda[i];
    if (entree.statut !== 'termine' || !entree.resultat) { continue; }
    for (var j = 0; j < entree.resultat.exercices.length; j++) {
      var id = entree.resultat.exercices[j].exerciceId;
      if (idsRencontres.indexOf(id) === -1) {
        idsRencontres.push(id);
        var exRef = trouverParId(etat.exercices, id);
        resultat.push({ id: id, nom: exRef ? exRef.nom : '(exercice supprimé)', groupe: exRef ? exRef.groupe : 'Autre' });
      }
    }
  }
  return resultat;
}

var exerciceSelectionneProgression = null;

function rendreSelectProgression() {
  var nomEl = document.getElementById('progression-exercice-nom');
  var groupeEl = document.getElementById('progression-exercice-groupe');
  if (!nomEl || !groupeEl) { return; }
  var liste = exercicesAvecHistorique();
  if (liste.length === 0) {
    exerciceSelectionneProgression = null;
    nomEl.innerHTML = 'Aucun historique';
    groupeEl.innerHTML = 'Termine une séance pour commencer';
    return;
  }
  if (!exerciceSelectionneProgression || !trouverParId(liste, exerciceSelectionneProgression)) {
    exerciceSelectionneProgression = liste[0].id;
  }
  var ex = trouverParId(liste, exerciceSelectionneProgression);
  nomEl.innerHTML = echapperHtml(ex.nom);
  groupeEl.innerHTML = echapperHtml(ex.groupe);
}

function changerExerciceProgression(id) {
  exerciceSelectionneProgression = id;
  rendreSelectProgression();
  rendreGraphiqueProgression();
}

/* --- Feuille de sélection de l'exercice --- */

function ouvrirSelecteurExerciceProgression() {
  if (exercicesAvecHistorique().length === 0) {
    afficherToast('Aucun exercice réalisé pour le moment.');
    return;
  }
  var html = '';
  html += '<div class="modal-entete"><h2>Choisir un exercice</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="selecteur-recherche"><input type="search" id="champ-selecteur-exercice" placeholder="Rechercher un exercice ou un groupe" autocomplete="off"></div>';
  html += '<div id="selecteur-exercice-liste"></div>';
  ouvrirModal(html);
  dessinerListeSelecteurExercice('');
  var champ = document.getElementById('champ-selecteur-exercice');
  if (champ) {
    champ.addEventListener('input', function () { dessinerListeSelecteurExercice(champ.value); });
  }
}

function dessinerListeSelecteurExercice(filtre) {
  var zone = document.getElementById('selecteur-exercice-liste');
  if (!zone) { return; }
  var terme = normaliserTexteRecherche((filtre || '').trim());
  var liste = exercicesAvecHistorique().filter(function (ex) {
    return terme === '' ||
      normaliserTexteRecherche(ex.nom).indexOf(terme) !== -1 ||
      normaliserTexteRecherche(ex.groupe).indexOf(terme) !== -1;
  });
  if (liste.length === 0) {
    zone.innerHTML = '<div class="etat-vide">Aucun exercice ne correspond.</div>';
    return;
  }
  var html = '';
  for (var g = 0; g < GROUPES_MUSCULAIRES.length; g++) {
    var nomGroupe = GROUPES_MUSCULAIRES[g];
    var sousListe = liste.filter(function (ex) { return ex.groupe === nomGroupe; });
    if (sousListe.length === 0) { continue; }
    sousListe.sort(function (a, b) { return a.nom.localeCompare(b.nom); });
    html += '<div class="selecteur-groupe">' + echapperHtml(nomGroupe) + '</div>';
    for (var i = 0; i < sousListe.length; i++) {
      var ex = sousListe[i];
      var points = pointsPoidsMaxParSeance(ex.id);
      var record = null;
      for (var p = 0; p < points.length; p++) {
        if (record === null || points[p].valeur > record) { record = points[p].valeur; }
      }
      var meta = points.length + ' séance' + (points.length > 1 ? 's' : '');
      if (record !== null) { meta += ' · record ' + record + ' kg'; }
      var actif = (ex.id === exerciceSelectionneProgression);
      html += '<button class="selecteur-ligne' + (actif ? ' selecteur-ligne-active' : '') + '" data-action="choisir-exercice-progression" data-id="' + ex.id + '">';
      html += '<span class="selecteur-ligne-textes"><span class="selecteur-ligne-nom">' + echapperHtml(ex.nom) + '</span>';
      html += '<span class="selecteur-ligne-meta donnee-num">' + meta + '</span></span>';
      html += '<span class="selecteur-coche">&#10003;</span>';
      html += '</button>';
    }
  }
  zone.innerHTML = html;
}

function pointsPoidsMaxParSeance(exerciceId) {
  var points = [];
  var entreesTerminees = etat.agenda.filter(function (a) { return a.statut === 'termine' && a.resultat; });
  entreesTerminees.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  for (var i = 0; i < entreesTerminees.length; i++) {
    var entree = entreesTerminees[i];
    var poidsMax = null;
    for (var j = 0; j < entree.resultat.exercices.length; j++) {
      var ligneEx = entree.resultat.exercices[j];
      if (ligneEx.exerciceId !== exerciceId) { continue; }
      for (var s = 0; s < ligneEx.series.length; s++) {
        if (ligneEx.series[s].echauffement) { continue; }
        if (poidsMax === null || ligneEx.series[s].poids > poidsMax) { poidsMax = ligneEx.series[s].poids; }
      }
    }
    if (poidsMax !== null) { points.push({ date: entree.date, valeur: poidsMax }); }
  }
  return points;
}

/* ---- Courbe SVG générique : grille Y + grille X (dates), plage fixe optionnelle, axe inversable ---- */

function nombreCourt(v) { return String(Math.round(v * 10) / 10); }

/* Ligne de résumé d'une courbe : dernier relevé + évolution + min/max (ou moyenne pour la nutrition) */
function resumeCourbe(points, suffixe) {
  var n = points.length, i;
  if (n < 2) { return ''; }
  var html = '<div class="courbe-resume">';
  if (points.mode === 'moyenne') {
    var somme = 0, jours = 0;
    for (i = 0; i < n; i++) { if (points[i].valeur > 0) { somme += points[i].valeur; jours++; } }
    if (jours === 0) { return ''; }
    html += '<span class="courbe-libelle">Moyenne</span>';
    html += '<span class="courbe-valeur donnee-num">' + nombreCourt(somme / jours) + suffixe + '</span>';
    html += '<span class="courbe-plage donnee-num">' + jours + ' / ' + n + ' jours</span>';
  } else {
    var dernier = points[n - 1].valeur, precedent = points[n - 2].valeur;
    var delta = Math.round((dernier - precedent) * 10) / 10;
    var min = dernier, max = dernier;
    for (i = 0; i < n; i++) {
      if (points[i].valeur < min) { min = points[i].valeur; }
      if (points[i].valeur > max) { max = points[i].valeur; }
    }
    var texteDelta = (delta === 0) ? '= stable' : ((delta > 0 ? '&#9650; +' : '&#9660; &minus;') + nombreCourt(Math.abs(delta)));
    html += '<span class="courbe-libelle">Dernier</span>';
    html += '<span class="courbe-valeur donnee-num">' + nombreCourt(dernier) + suffixe + '</span>';
    html += '<span class="courbe-delta donnee-num">' + texteDelta + '</span>';
    html += '<span class="courbe-plage donnee-num">min ' + nombreCourt(min) + ' · max ' + nombreCourt(max) + '</span>';
  }
  return html + '</div>';
}

function construireSvgCourbe(points, suffixeUnite, couleur, plageMin, plageMax, inverserAxe) {
  if (points.length === 0) {
    return '<div class="etat-vide">Pas encore assez de données pour afficher une courbe.</div>';
  }
  if (points.length === 1) {
    return '<div class="etat-vide">Une seule valeur enregistrée pour l\'instant (' + points[0].valeur + suffixeUnite + '). Reviens plus tard pour voir la courbe.</div>';
  }
  var largeur = 300, hauteur = 160;
  var margeGauche = 34, margeDroite = 10, margeHaut = 14, margeBas = 22;
  var zoneLargeur = largeur - margeGauche - margeDroite;
  var zoneHauteur = hauteur - margeHaut - margeBas;

  var valeurs = points.map(function (p) { return p.valeur; });
  var valeurMin = (plageMin !== undefined && plageMin !== null) ? plageMin : Math.min.apply(null, valeurs);
  var valeurMax = (plageMax !== undefined && plageMax !== null) ? plageMax : Math.max.apply(null, valeurs);
  if (valeurMax === valeurMin) { valeurMax = valeurMin + 1; }

  function xPour(i) { return margeGauche + (i / (points.length - 1)) * zoneLargeur; }
  function yPour(valeur) {
    var fraction = (valeur - valeurMin) / (valeurMax - valeurMin);
    if (fraction < 0) { fraction = 0; }
    if (fraction > 1) { fraction = 1; }
    return inverserAxe
      ? margeHaut + fraction * zoneHauteur
      : margeHaut + zoneHauteur - fraction * zoneHauteur;
  }

  var coordonnees = [];
  for (var i = 0; i < points.length; i++) {
    coordonnees.push({ x: xPour(i), y: yPour(points[i].valeur) });
  }
  var chainePoints = coordonnees.map(function (c) { return c.x.toFixed(1) + ',' + c.y.toFixed(1); }).join(' ');

  var svg = '<svg viewBox="0 0 ' + largeur + ' ' + hauteur + '" xmlns="http://www.w3.org/2000/svg">';

  var nbLignesY = 4;
  for (var g = 0; g <= nbLignesY; g++) {
    var valeurLigne = valeurMin + (g / nbLignesY) * (valeurMax - valeurMin);
    var yLigne = yPour(valeurLigne);
    svg += '<line x1="' + margeGauche + '" y1="' + yLigne.toFixed(1) + '" x2="' + (largeur - margeDroite) + '" y2="' + yLigne.toFixed(1) + '" stroke="#2A313B" stroke-width="1" />';
    var libelleValeur = (Math.abs(valeurLigne - Math.round(valeurLigne)) < 0.05) ? Math.round(valeurLigne) : valeurLigne.toFixed(1);
    svg += '<text x="' + (margeGauche - 5) + '" y="' + (yLigne + 3).toFixed(1) + '" font-size="8" fill="#8996A3" text-anchor="end">' + libelleValeur + suffixeUnite + '</text>';
  }

  var nbLignesX = Math.min(5, points.length - 1);
  for (var v = 0; v <= nbLignesX; v++) {
    var indexPoint = Math.round((v / nbLignesX) * (points.length - 1));
    var xLigne = xPour(indexPoint);
    svg += '<line x1="' + xLigne.toFixed(1) + '" y1="' + margeHaut + '" x2="' + xLigne.toFixed(1) + '" y2="' + (hauteur - margeBas) + '" stroke="#2A313B" stroke-width="1" />';
    var libelleDate = points[indexPoint].date ? formaterDateCourte(points[indexPoint].date) : '';
    svg += '<text x="' + xLigne.toFixed(1) + '" y="' + (hauteur - margeBas + 12) + '" font-size="8" fill="#8996A3" text-anchor="middle">' + libelleDate + '</text>';
  }

  svg += '<polyline points="' + chainePoints + '" fill="none" stroke="' + couleur + '" stroke-width="2.5" />';
  for (var k = 0; k < coordonnees.length; k++) {
    svg += '<circle cx="' + coordonnees[k].x.toFixed(1) + '" cy="' + coordonnees[k].y.toFixed(1) + '" r="3.2" fill="' + couleur + '" />';
  }
  svg += '</svg>';
  return resumeCourbe(points, suffixeUnite) + '<div class="svg-conteneur">' + svg + '</div>';
}

function rendreGraphiqueProgression() {
  var conteneur = document.getElementById('progression-zone-graphique');
  if (!exerciceSelectionneProgression) {
    conteneur.innerHTML = '<div class="etat-vide">Termine une première séance pour voir apparaître ta progression ici.</div>';
    return;
  }
  var points = pointsPoidsMaxParSeance(exerciceSelectionneProgression);
  conteneur.innerHTML = construireSvgCourbe(points, ' kg', '#1FD9C4');
}

function rendreGraphiqueCalories() {
  var entreesTerminees = etat.agenda.filter(function (a) { return a.statut === 'termine'; });
  entreesTerminees.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var points = entreesTerminees.map(function (e) { return { date: e.date, valeur: Math.round(e.caloriesEstimees || 0) }; });
  document.getElementById('progression-zone-calories').innerHTML = construireSvgCourbe(points, ' kcal', '#22A7E5');
}

/* ---- Sélecteur de période (page État) ---- */

var PERIODES_ETAT = [
  { valeur: '30j',  libelle: '30j',   jours: 30 },
  { valeur: '2m',   libelle: '2 mois', jours: 60 },
  { valeur: '6m',   libelle: '6 mois', jours: 180 },
  { valeur: '1a',   libelle: '1 an',   jours: 365 },
  { valeur: 'tout', libelle: 'Depuis le début', jours: null }
];

var periodeEtatSelectionnee = '30j';

function trouverPeriodeEtat(valeur) {
  for (var i = 0; i < PERIODES_ETAT.length; i++) {
    if (PERIODES_ETAT[i].valeur === valeur) { return PERIODES_ETAT[i]; }
  }
  return PERIODES_ETAT[0];
}

function filtrerDatesParPeriode(dates, valeurPeriode) {
  var conf = trouverPeriodeEtat(valeurPeriode);
  if (!conf.jours) { return dates; }
  var limite = new Date();
  limite.setDate(limite.getDate() - conf.jours);
  var limiteISO = formaterDateISO(limite);
  return dates.filter(function (d) { return d >= limiteISO; });
}

function rendreSelecteurPeriodeEtat() {
  var zone = document.getElementById('etat-selecteur-periode');
  if (!zone) { return; }
  var html = '';
  for (var i = 0; i < PERIODES_ETAT.length; i++) {
    var p = PERIODES_ETAT[i];
    var actif = (p.valeur === periodeEtatSelectionnee) ? ' sous-onglet-actif' : '';
    html += '<button class="sous-onglet' + actif + '" data-action="changer-periode-etat" data-periode="' + p.valeur + '">' + p.libelle + '</button>';
  }
  zone.innerHTML = html;
}

function changerPeriodeEtat(valeur) {
  periodeEtatSelectionnee = valeur;
  rendreSelecteurPeriodeEtat();
  rendreGraphiqueEtat();
}

/* ---- Page État : 4 courbes individuelles ---- */

function rendreGraphiqueEtat() {
  rendreSelecteurPeriodeEtat();

  var toutesLesDates = Object.keys(etat.ressentiQuotidien).sort();
  var dates = filtrerDatesParPeriode(toutesLesDates, periodeEtatSelectionnee);

  var libellePeriode = trouverPeriodeEtat(periodeEtatSelectionnee).libelle;
  document.getElementById('etat-titre-humeur').innerHTML = 'Humeur (' + libellePeriode + ')';
  document.getElementById('etat-titre-fatigue').innerHTML = 'Fatigue (' + libellePeriode + ')';
  document.getElementById('etat-titre-stress').innerHTML = 'Stress (' + libellePeriode + ')';
  document.getElementById('etat-titre-sommeil').innerHTML = 'Sommeil (' + libellePeriode + ')';

  var pointsSommeil = [], pointsFatigue = [], pointsStress = [], pointsHumeur = [];

  dates.forEach(function (date) {
    var j = etat.ressentiQuotidien[date];
    pointsSommeil.push({ date: date, valeur: j.sommeil });
    pointsFatigue.push({ date: date, valeur: j.fatigue !== undefined ? j.fatigue : 4 });
    pointsStress.push({ date: date, valeur: j.stress !== undefined ? j.stress : 4 });
    pointsHumeur.push({ date: date, valeur: j.humeur !== undefined ? j.humeur : 4 });
  });

  // inverserAxe = true pour fatigue/stress : raw 0 -> affiché en haut (maximum), raw 8 -> affiché en bas (minimum)
  document.getElementById('etat-zone-sommeil').innerHTML = construireSvgCourbe(pointsSommeil, ' h', '#3b82f6', 0, 24, false);
  document.getElementById('etat-zone-fatigue').innerHTML = construireSvgCourbe(pointsFatigue, '/8', '#f59e0b', 0, 8, true);
  document.getElementById('etat-zone-stress').innerHTML = construireSvgCourbe(pointsStress, '/8', '#ef4444', 0, 8, true);
  document.getElementById('etat-zone-humeur').innerHTML = construireSvgCourbe(pointsHumeur, '/8', '#10b981', 0, 8, false);

  if (vueCombineeEtatVisible) { rendreGraphiqueEtatCombine(); }

  rendreListeEvenementsEtat(dates);
}

/* ---- Vue superposée : mêmes courbes, même période, même grille, même inversion ---- */

var visibiliteCourbesEtat = { sommeil: true, fatigue: true, stress: true, humeur: true };
var vueCombineeEtatVisible = false;

function definitionsCourbesEtat() {
  return [
    { cle: 'sommeil', nom: 'Sommeil', couleur: '#3b82f6', defaut: 8, min: 0, max: 24, inverser: false },
    { cle: 'fatigue', nom: 'Fatigue', couleur: '#f59e0b', defaut: 4, min: 0, max: 8,  inverser: true },
    { cle: 'stress',  nom: 'Stress',  couleur: '#ef4444', defaut: 4, min: 0, max: 8,  inverser: true },
    { cle: 'humeur',  nom: 'Humeur',  couleur: '#10b981', defaut: 4, min: 0, max: 8,  inverser: false }
  ];
}

function basculerVueCombineeEtat() {
  vueCombineeEtatVisible = !vueCombineeEtatVisible;
  var corps = document.getElementById('etat-combine-corps');
  var bouton = document.querySelector('[data-action="toggle-vue-combinee-etat"]');
  if (corps) { corps.style.display = vueCombineeEtatVisible ? 'block' : 'none'; }
  if (bouton) { bouton.textContent = vueCombineeEtatVisible ? 'Masquer' : 'Afficher'; }
  if (vueCombineeEtatVisible) {
    rendreLegendeCombineeEtat();
    rendreGraphiqueEtatCombine();
  }
}

function basculerCourbeEtat(nomCourbe) {
  visibiliteCourbesEtat[nomCourbe] = !visibiliteCourbesEtat[nomCourbe];
  rendreLegendeCombineeEtat();
  rendreGraphiqueEtatCombine();
}

function rendreLegendeCombineeEtat() {
  var zone = document.getElementById('etat-combine-legende');
  if (!zone) { return; }
  var definitions = definitionsCourbesEtat();
  var html = '';
  for (var i = 0; i < definitions.length; i++) {
    var def = definitions[i];
    var actif = !!visibiliteCourbesEtat[def.cle];
    html += '<button class="courbe-toggle-btn' + (actif ? ' courbe-toggle-actif' : '') + '" data-action="toggle-courbe-etat" data-courbe="' + def.cle + '" style="--couleur-courbe:' + def.couleur + ';">';
    html += '<span class="courbe-toggle-pastille"></span>' + echapperHtml(def.nom);
    html += '</button>';
  }
  zone.innerHTML = html;
}

function rendreGraphiqueEtatCombine() {
  var conteneur = document.getElementById('etat-zone-combine');
  if (!conteneur) { return; }

  var toutesLesDates = Object.keys(etat.ressentiQuotidien).sort();
  var dates = filtrerDatesParPeriode(toutesLesDates, periodeEtatSelectionnee);

  if (dates.length < 2) {
    conteneur.innerHTML = '<div class="etat-vide">Pas encore assez de données pour afficher une courbe.</div>';
    return;
  }

  var definitions = definitionsCourbesEtat();
  var seriesVisibles = [];
  for (var i = 0; i < definitions.length; i++) {
    var def = definitions[i];
    if (!visibiliteCourbesEtat[def.cle]) { continue; }
    var pts = [];
    for (var d = 0; d < dates.length; d++) {
      var jour = etat.ressentiQuotidien[dates[d]];
      var brut = (jour[def.cle] !== undefined && jour[def.cle] !== null) ? jour[def.cle] : def.defaut;
      pts.push(brut); // valeur brute, l'inversion se fait à l'affichage (yPour), pas ici
    }
    seriesVisibles.push({ couleur: def.couleur, points: pts, min: def.min, max: def.max, inverser: def.inverser });
  }

  if (seriesVisibles.length === 0) {
    conteneur.innerHTML = '<div class="etat-vide">Active au moins une courbe ci-dessus.</div>';
    return;
  }

  var largeur = 300, hauteur = 160;
  var margeGauche = 10, margeDroite = 10, margeHaut = 14, margeBas = 22;
  var zoneLargeur = largeur - margeGauche - margeDroite;
  var zoneHauteur = hauteur - margeHaut - margeBas;

  function xPour(i, nb) { return margeGauche + (i / (nb - 1)) * zoneLargeur; }
  function yPour(valeur, min, max, inverser) {
    var fraction = (valeur - min) / (max - min);
    if (fraction < 0) { fraction = 0; }
    if (fraction > 1) { fraction = 1; }
    return inverser ? margeHaut + fraction * zoneHauteur : margeHaut + zoneHauteur - fraction * zoneHauteur;
  }

  var svg = '<svg viewBox="0 0 ' + largeur + ' ' + hauteur + '" xmlns="http://www.w3.org/2000/svg">';

  var nbLignesY = 4;
  for (var g = 0; g <= nbLignesY; g++) {
    var yGrille = margeHaut + (g / nbLignesY) * zoneHauteur;
    svg += '<line x1="' + margeGauche + '" y1="' + yGrille.toFixed(1) + '" x2="' + (largeur - margeDroite) + '" y2="' + yGrille.toFixed(1) + '" stroke="#2A313B" stroke-width="1" />';
  }

  var nbLignesX = Math.min(5, dates.length - 1);
  for (var v = 0; v <= nbLignesX; v++) {
    var indexPoint = Math.round((v / nbLignesX) * (dates.length - 1));
    var xLigne = xPour(indexPoint, dates.length);
    svg += '<line x1="' + xLigne.toFixed(1) + '" y1="' + margeHaut + '" x2="' + xLigne.toFixed(1) + '" y2="' + (hauteur - margeBas) + '" stroke="#2A313B" stroke-width="1" />';
    svg += '<text x="' + xLigne.toFixed(1) + '" y="' + (hauteur - margeBas + 12) + '" font-size="8" fill="#8996A3" text-anchor="middle">' + formaterDateCourte(dates[indexPoint]) + '</text>';
  }

  for (var s = 0; s < seriesVisibles.length; s++) {
    var serie = seriesVisibles[s];
    var chainePoints = '';
    for (var k = 0; k < serie.points.length; k++) {
      var x = xPour(k, serie.points.length);
      var y = yPour(serie.points[k], serie.min, serie.max, serie.inverser);
      chainePoints += x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    svg += '<polyline points="' + chainePoints.trim() + '" fill="none" stroke="' + serie.couleur + '" stroke-width="2.2" opacity="0.9" />';
  }

  svg += '</svg>';
  conteneur.innerHTML = svg;
}

function rendreListeEvenementsEtat(dates) {
  var conteneur = document.getElementById('etat-zone-evenements');
  if (!conteneur) { return; }
  var lignes = [];
  dates.slice().reverse().forEach(function (date) {
    var j = etat.ressentiQuotidien[date];
    var badges = [];
    if (j.colere) { badges.push('🤬'); }
    if (j.blessure) { badges.push('🤕'); }
    if (j.maladie) { badges.push('🤒'); }
    if (j.insomnie) { badges.push('😶'); }
    if (badges.length > 0) {
      lignes.push('<div class="ligne-evenement-etat"><span>' + formaterDateLisible(date) + '</span><span class="evenement-badges">' + badges.join(' ') + '</span></div>');
    }
  });
  conteneur.innerHTML = lignes.length > 0 ? lignes.join('') : '<div class="etat-vide">Aucun événement particulier récemment.</div>';
}

function pointsVolumeHebdomadaire(nombreSemaines) {
  var points = [];
  var lundiCourant = lundiDeLaSemaine(new Date());
  for (var i = nombreSemaines - 1; i >= 0; i--) {
    var lundi = new Date(lundiCourant.getFullYear(), lundiCourant.getMonth(), lundiCourant.getDate() - i * 7);
    var donnees = calculerVolumeSemaine(lundi);
    var total = 0;
    for (var g = 0; g < GROUPES_MUSCULAIRES.length; g++) {
      total += donnees.volumeParGroupe[GROUPES_MUSCULAIRES[g]] || 0;
    }
    points.push({ date: formaterDateISO(lundi), valeur: total });
  }
  return points;
}

function rendreGraphiqueVolume() {
  var zone = document.getElementById('progression-zone-volume');
  if (!zone) { return; }
  var points = pointsVolumeHebdomadaire(12);
  var auMoinsUneSemaineActive = points.some(function (p) { return p.valeur > 0; });
  if (!auMoinsUneSemaineActive) {
    zone.innerHTML = '<div class="etat-vide">Pas encore assez de séances terminées pour afficher une courbe.</div>';
    return;
  }
  zone.innerHTML = construireSvgCourbe(points, ' séries', '#1FD9C4');
}

function rendreGraphiquePoidsCorporel() {
  var zone = document.getElementById('progression-zone-poids-corporel');
  if (!zone) { return; }
  var dates = Object.keys(etat.poidsCorporelHistorique).sort();
  var points = dates.map(function (d) { return { date: d, valeur: etat.poidsCorporelHistorique[d] }; });
  zone.innerHTML = construireSvgCourbe(points, ' kg', '#1FD9C4');
}

function pointsNutritionQuotidien(nombreJours, cle) {
  var points = [];
  var aujourdHui = new Date();
  for (var i = nombreJours - 1; i >= 0; i--) {
    var d = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), aujourdHui.getDate() - i);
    var dateISO = formaterDateISO(d);
    var totaux = calculerTotauxJour(dateISO);
    points.push({ date: dateISO, valeur: Math.round(totaux[cle]) });
  }
  points.mode = 'moyenne';
  return points;
}

function rendreGraphiquesNutrition() {
  var zoneCalories = document.getElementById('progression-nutrition-calories');
  if (!zoneCalories) { return; }
  var zoneProteines = document.getElementById('progression-nutrition-proteines');
  var zoneGlucides = document.getElementById('progression-nutrition-glucides');
  var zoneLipides = document.getElementById('progression-nutrition-lipides');

  var joursCalories = pointsNutritionQuotidien(30, 'calories');
  var auMoinsUnJourRenseigne = joursCalories.some(function (p) { return p.valeur > 0; });

  if (!auMoinsUnJourRenseigne) {
    var messageVide = '<div class="etat-vide">Pas encore assez de journées renseignées pour afficher une courbe.</div>';
    zoneCalories.innerHTML = messageVide;
    zoneProteines.innerHTML = messageVide;
    zoneGlucides.innerHTML = messageVide;
    zoneLipides.innerHTML = messageVide;
    return;
  }

  zoneCalories.innerHTML = construireSvgCourbe(joursCalories, ' kcal', '#22A7E5');
  zoneProteines.innerHTML = construireSvgCourbe(pointsNutritionQuotidien(30, 'proteines'), ' g', '#1FD9C4');
  zoneGlucides.innerHTML = construireSvgCourbe(pointsNutritionQuotidien(30, 'glucides'), ' g', '#E0A73D');
  zoneLipides.innerHTML = construireSvgCourbe(pointsNutritionQuotidien(30, 'lipides'), ' g', '#B98EF0');
}

/* ============================================================
   BLOC 15bis : EQUILIBRE (volume / frequence / antagonistes par semaine)
   ============================================================ */

function lundiDeLaSemaine(date) {
  var jour = date.getDay();
  var decalage = (jour === 0) ? -6 : (1 - jour);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + decalage);
}

var semaineAffichee = lundiDeLaSemaine(new Date());

function changerSemaine(delta) {
  semaineAffichee = new Date(semaineAffichee.getFullYear(), semaineAffichee.getMonth(), semaineAffichee.getDate() + delta * 7);
  rendreEquilibre();
}

/* Volume (nb de series validees) et frequence (nb de jours distincts) par groupe musculaire, sur une semaine */
function calculerVolumeSemaine(lundiDebut) {
  var lundiFin = new Date(lundiDebut.getFullYear(), lundiDebut.getMonth(), lundiDebut.getDate() + 7);
  var dateDebutISO = formaterDateISO(lundiDebut);
  var dateFinISO = formaterDateISO(lundiFin);
  var volumeParGroupe = {};
  var joursParGroupe = {};
  for (var i = 0; i < GROUPES_MUSCULAIRES.length; i++) {
    volumeParGroupe[GROUPES_MUSCULAIRES[i]] = 0;
    joursParGroupe[GROUPES_MUSCULAIRES[i]] = {};
  }
  var entreesTerminees = etat.agenda.filter(function (a) {
    return a.statut === 'termine' && a.resultat && a.date >= dateDebutISO && a.date < dateFinISO;
  });
  for (var e = 0; e < entreesTerminees.length; e++) {
    var resultat = entreesTerminees[e].resultat;
    for (var j = 0; j < resultat.exercices.length; j++) {
      var ligneEx = resultat.exercices[j];
      var exRef = trouverParId(etat.exercices, ligneEx.exerciceId);
      var groupe = exRef ? exRef.groupe : 'Autre';
      if (volumeParGroupe[groupe] === undefined) { volumeParGroupe[groupe] = 0; joursParGroupe[groupe] = {}; }
      var seriesValidees = ligneEx.series.filter(function (s) { return s.fait && !s.echauffement; }).length;
      volumeParGroupe[groupe] += seriesValidees;
      if (seriesValidees > 0) { joursParGroupe[groupe][entreesTerminees[e].date] = true; }
    }
  }
  var frequenceParGroupe = {};
  for (var g = 0; g < GROUPES_MUSCULAIRES.length; g++) {
    var nomG = GROUPES_MUSCULAIRES[g];
    var jours = joursParGroupe[nomG] || {};
    var compte = 0;
    for (var cle in jours) { if (jours.hasOwnProperty(cle)) { compte++; } }
    frequenceParGroupe[nomG] = compte;
  }
  return { volumeParGroupe: volumeParGroupe, frequenceParGroupe: frequenceParGroupe };
}

/* Nombre de semaines écoulées depuis le dernier programme de type decharge (ou depuis la toute première séance si aucune décharge n'a jamais été enregistrée) */
function semainesDepuisDerniereDecharge() {
  var derniereDateDecharge = null;
  for (var i = 0; i < etat.historiqueProgrammes.length; i++) {
    var entree = etat.historiqueProgrammes[i];
    if (entree.type === 'decharge' && (derniereDateDecharge === null || entree.dateDebut > derniereDateDecharge)) {
      derniereDateDecharge = entree.dateDebut;
    }
  }
  var dateReference = derniereDateDecharge;
  if (!dateReference) {
    var datesSeances = etat.agenda.filter(function (a) { return a.statut === 'termine'; }).map(function (a) { return a.date; });
    if (datesSeances.length === 0) { return null; }
    datesSeances.sort();
    dateReference = datesSeances[0];
  }
  var joursDepuis = Math.floor((new Date() - dateDepuisISO(dateReference)) / (1000 * 60 * 60 * 24));
  return Math.floor(joursDepuis / 7);
}

function typeMesocycleProgrammeActifEstDecharge() {
  if (!etat.programmeActif) { return false; }
  var p = trouverParId(etat.programmes, etat.programmeActif.programmeId);
  return !!(p && p.typeMesocycle === 'decharge');
}

function objectifDoitEtreVerifie() {
  if (!etat.programmeActif) { return false; }
  var date = etat.programmeActif.dateDernierObjectif || etat.programmeActif.dateDebut;
  if (!date) { return false; }
  var joursDepuis = Math.floor((new Date() - dateDepuisISO(date)) / (1000 * 60 * 60 * 24));
  return joursDepuis >= 28;
}

function rendreBanniereObjectif() {
  var zone = document.getElementById('zone-banniere-objectif');
  if (!zone) { return; }
  if (!objectifDoitEtreVerifie()) { zone.innerHTML = ''; return; }
  var prog = trouverParId(etat.programmes, etat.programmeActif.programmeId);
  var nomProg = prog ? prog.nom : 'ton programme';
  var html = '<div class="banniere-objectif">';
  html += '<div>Ça fait 4 semaines sur <strong>' + echapperHtml(nomProg) + '</strong> — c\'est le moment de vérifier ton objectif.</div>';
  html += '<button class="btn btn-plein btn-petit" style="margin-top:8px;" data-action="ouvrir-verif-objectif">Vérifier mon objectif</button>';
  html += '</div>';
  zone.innerHTML = html;
}

/* Météo du lieu d'entraînement, via Open-Meteo (gratuit, sans clé, CORS activé) */
var meteoDerniereVerifMs = null;
var meteoDernierResultat = null;

function verifierMeteoGym(callback) {
  var lat = etat.profil.latitudeGym;
  var lon = etat.profil.longitudeGym;
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    if (callback) { callback(null); }
    return;
  }
  if (meteoDerniereVerifMs && (Date.now() - meteoDerniereVerifMs) < 3600000) {
    if (callback) { callback(meteoDernierResultat); }
    return;
  }
  var xhr = new XMLHttpRequest();
  try {
    xhr.open('GET', 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&hourly=temperature_2m&forecast_days=1&timezone=Europe%2FParis', true);
  } catch (erreurOuverture) {
    if (callback) { callback(null); }
    return;
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      meteoDerniereVerifMs = Date.now();
      meteoDernierResultat = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var donnees = JSON.parse(xhr.responseText);
          if (donnees.current_weather && typeof donnees.current_weather.temperature === 'number' && donnees.hourly) {
            meteoDernierResultat = {
              actuelle: donnees.current_weather.temperature,
              heures: donnees.hourly.time,
              temperatures: donnees.hourly.temperature_2m
            };
          }
        } catch (erreurParse) { meteoDernierResultat = null; }
      }
      if (callback) { callback(meteoDernierResultat); }
    }
  };
  xhr.onerror = function () {
    meteoDerniereVerifMs = Date.now();
    meteoDernierResultat = null;
    if (callback) { callback(null); }
  };
  xhr.send();
}

function evaluerTemperature(temperature) {
  var idealMin = 12;
  var idealMax = 20;
  var acceptableMin = (etat.profil.seuilTempMin !== null && etat.profil.seuilTempMin !== undefined) ? etat.profil.seuilTempMin : 5;
  var acceptableMax = (etat.profil.seuilTempMax !== null && etat.profil.seuilTempMax !== undefined) ? etat.profil.seuilTempMax : 28;
  if (temperature >= idealMin && temperature <= idealMax) { return 'ideal'; }
  if (temperature >= acceptableMin && temperature <= acceptableMax) { return 'moyen'; }
  return 'mauvais';
}

function trouverTrancheIdeale(heures, temps) {
  var maintenant = new Date();
  var minuteActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();

  var meilleurIndex = -1;
  var meilleurEcart = Infinity;

  for (var i = 0; i < heures.length; i++) {
    var hMin = parseInt(heures[i].substring(11, 13), 10) * 60 + parseInt(heures[i].substring(14, 16), 10);
    if (hMin < minuteActuelle) { continue; } // on ignore le passé

    var etatTemp = evaluerTemperature(temps[i]);
    if (etatTemp !== 'bon') { continue; } // on ne garde que les créneaux "idéaux"

    // on privilégie le créneau idéal le plus proche de maintenant
    var ecart = hMin - minuteActuelle;
    if (ecart < meilleurEcart) {
      meilleurEcart = ecart;
      meilleurIndex = i;
    }
  }

  if (meilleurIndex === -1) { return null; }

  return { heure: heures[meilleurIndex].substring(11, 16), temperature: temps[meilleurIndex] };
}

function trouverProchainCreneauIdealBanniere(heures, temps) {
  var maintenant = new Date();
  var minuteActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
  var minuteMin = 8 * 60;
  var seuilMinute = Math.max(minuteActuelle, minuteMin);

  function chercherEtat(etatCible) {
    for (var i = 0; i < heures.length; i++) {
      var hMin = parseInt(heures[i].substring(11, 13), 10) * 60 + parseInt(heures[i].substring(14, 16), 10);
      if (hMin < seuilMinute) { continue; }
      if (evaluerTemperature(temps[i]) === etatCible) {
        return { heure: heures[i].substring(11, 16), temperature: temps[i] };
      }
    }
    return null;
  }

  // 1. priorité : un créneau idéal
  var resultat = chercherEtat('ideal');
  if (resultat) { return resultat; }

  // 2. sinon : un créneau moyen
  resultat = chercherEtat('moyen');
  if (resultat) { return resultat; }

  // 3. sinon : le meilleur moment restant de la journée (température la plus basse à venir)
  var meilleurIndex = -1, meilleureTemp = Infinity;
  for (var i = 0; i < heures.length; i++) {
    var hMin = parseInt(heures[i].substring(11, 13), 10) * 60 + parseInt(heures[i].substring(14, 16), 10);
    if (hMin < seuilMinute) { continue; }
    if (temps[i] < meilleureTemp) { meilleureTemp = temps[i]; meilleurIndex = i; }
  }
  if (meilleurIndex !== -1) {
    return { heure: heures[meilleurIndex].substring(11, 16), temperature: temps[meilleurIndex] };
  }

  return null;
}

function libelleCreneauMeteo(etatTemp) {
  if (etatTemp === 'ideal') { return 'Idéal à'; }
  if (etatTemp === 'moyen') { return 'Correct à'; }
  return 'Le moins pire à';
}

function heureCourte(hhmm) { return parseInt(hhmm.substring(0, 2), 10) + 'h'; }

/* Mini-courbe de la journée (barre météo) : colorée par état, passé atténué, point = maintenant */
function construireSparkMeteo(r) {
  var temps = r.temperatures, n = temps.length;
  if (n < 2) { return ''; }
  var L = 110, H = 36, p = 4;
  var vmin = Math.min.apply(null, temps), vmax = Math.max.apply(null, temps);
  if (vmax - vmin < 4) { var milieu = (vmax + vmin) / 2; vmin = milieu - 2; vmax = milieu + 2; }
  function x(i) { return p + (i / (n - 1)) * (L - 2 * p); }
  function y(t) { return H - p - ((t - vmin) / (vmax - vmin)) * (H - 2 * p); }

  var heureNow = new Date().getHours();
  var indexNow = 0;
  for (var i = 0; i < n; i++) {
    if (parseInt(r.heures[i].substring(11, 13), 10) === heureNow) { indexNow = i; break; }
  }

  var svg = '<svg viewBox="0 0 ' + L + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  for (var k = 0; k < n - 1; k++) {
    var cl = 'segment-' + evaluerTemperature((temps[k] + temps[k + 1]) / 2);
    svg += '<line class="' + cl + '" x1="' + x(k).toFixed(1) + '" y1="' + y(temps[k]).toFixed(1) + '" x2="' + x(k + 1).toFixed(1) + '" y2="' + y(temps[k + 1]).toFixed(1) + '" stroke-width="2.4" stroke-linecap="round"' + (k < indexNow ? ' opacity=".35"' : '') + '/>';
  }
  svg += '<circle class="meteo-now-point" cx="' + x(indexNow).toFixed(1) + '" cy="' + y(temps[indexNow]).toFixed(1) + '" r="3.4" stroke-width="1.5"/>';
  svg += '</svg>';
  return svg;
}

function rendreBanniereMeteo() {
  var zone = document.getElementById('zone-banniere-meteo');
  if (!zone) { return; }
  if (etat.profil.latitudeGym === null || etat.profil.longitudeGym === null) { zone.innerHTML = ''; return; }
  verifierMeteoGym(function (resultat) {
    if (!resultat) { zone.innerHTML = ''; return; }
    var etatTemp = evaluerTemperature(resultat.actuelle);
    var tranche = trouverProchainCreneauIdealBanniere(resultat.heures, resultat.temperatures);

    var html = '<div class="meteo-carte meteo-' + etatTemp + '" data-action="ouvrir-modale-meteo">';
    html += '<span class="meteo-icone"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg></span>';
    html += '<span class="meteo-textes"><span class="meteo-temp donnee-num">' + resultat.actuelle.toFixed(1) + '°C</span>';
    if (tranche) {
      html += '<span class="meteo-sous">' + libelleCreneauMeteo(evaluerTemperature(tranche.temperature)) + ' ' + heureCourte(tranche.heure) + ' · ' + Math.round(tranche.temperature) + '°</span>';
    } else {
      html += '<span class="meteo-sous">actuellement</span>';
    }
    html += '</span>';
    html += '<span class="meteo-spark">' + construireSparkMeteo(resultat) + '</span>';
    html += '</div>';
    zone.innerHTML = html;
  });
}

function fermerModaleMeteo() { fermerModal(); }

function ouvrirModaleMeteo() {
  if (!meteoDernierResultat) { return; }
  var r = meteoDernierResultat;
  var etatNow = evaluerTemperature(r.actuelle);
  var tranche = trouverProchainCreneauIdealBanniere(r.heures, r.temperatures);
  var tmin = Math.min.apply(null, r.temperatures);
  var tmax = Math.max.apply(null, r.temperatures);

  var html = '';
  html += '<div class="modal-entete"><h2>Météo du jour</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';

  html += '<div class="meteo-tuiles">';
  html += '<div class="meteo-tuile meteo-tuile-now meteo-' + etatNow + '"><span class="meteo-tuile-label">Maintenant</span><span class="meteo-tuile-valeur donnee-num">' + r.actuelle.toFixed(1) + '°</span></div>';
  html += '<div class="meteo-tuile"><span class="meteo-tuile-label">Min</span><span class="meteo-tuile-valeur donnee-num">' + Math.round(tmin) + '°</span></div>';
  html += '<div class="meteo-tuile"><span class="meteo-tuile-label">Max</span><span class="meteo-tuile-valeur donnee-num">' + Math.round(tmax) + '°</span></div>';
  html += '</div>';

  html += '<div class="meteo-graphe svg-conteneur">' + construireSvgMeteo(r, tranche) + '</div>';

  html += '<div class="meteo-legende">';
  html += '<span><i class="meteo-pastille fr-ideal"></i>Idéal 12–20°</span>';
  html += '<span><i class="meteo-pastille fr-moyen"></i>Correct</span>';
  html += '<span><i class="meteo-pastille fr-mauvais"></i>À éviter</span>';
  html += '</div>';

  if (tranche) {
    html += '<p class="reglages-note">Prochain meilleur créneau : ' + libelleCreneauMeteo(evaluerTemperature(tranche.temperature)) + ' ' + heureCourte(tranche.heure) + ' (' + Math.round(tranche.temperature) + '°)</p>';
  }
  ouvrirModal(html);
}

function construireSvgMeteo(r, tranche) {
  var temps = r.temperatures, heures = r.heures, n = temps.length;
  if (n < 2) { return ''; }
  var L = 320, H = 190, mg = 30, md = 10, mh = 18, mb = 22;
  var zw = L - mg - md, zh = H - mh - mb;
  var vmin = Math.floor(Math.min.apply(null, temps) - 1);
  var vmax = Math.ceil(Math.max.apply(null, temps) + 1);
  function x(i) { return mg + (i / (n - 1)) * zw; }
  function y(t) { return mh + zh - ((t - vmin) / (vmax - vmin)) * zh; }

  var svg = '<svg viewBox="0 0 ' + L + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';

  /* Bande idéale (12 à 20°) */
  var hautBande = Math.min(20, vmax), basBande = Math.max(12, vmin);
  if (hautBande > basBande) {
    svg += '<rect class="meteo-bande" x="' + mg + '" y="' + y(hautBande).toFixed(1) + '" width="' + zw + '" height="' + (y(basBande) - y(hautBande)).toFixed(1) + '" rx="4"/>';
  }

  /* Grille et repères de température */
  for (var g = 0; g <= 3; g++) {
    var val = vmin + (g / 3) * (vmax - vmin);
    var yg = y(val);
    svg += '<line class="meteo-grille" x1="' + mg + '" y1="' + yg.toFixed(1) + '" x2="' + (L - md) + '" y2="' + yg.toFixed(1) + '"/>';
    svg += '<text class="axe-label" x="' + (mg - 5) + '" y="' + (yg + 3).toFixed(1) + '" text-anchor="end">' + Math.round(val) + '°</text>';
  }

  /* Heures, toutes les 3 h */
  for (var j = 0; j < n; j += 3) {
    svg += '<text class="axe-label" x="' + x(j).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + parseInt(heures[j].substring(11, 13), 10) + 'h</text>';
  }

  /* Courbe lissée, colorée par tranche */
  var pts = [];
  for (var i = 0; i < n; i++) { pts.push({ x: x(i), y: y(temps[i]) }); }
  for (var k = 0; k < n - 1; k++) {
    var p0 = pts[k - 1] || pts[k], p1 = pts[k], p2 = pts[k + 1], p3 = pts[k + 2] || p2;
    var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    svg += '<path class="segment-' + evaluerTemperature((temps[k] + temps[k + 1]) / 2) + '" fill="none" stroke-width="3" stroke-linecap="round" d="M' +
      p1.x.toFixed(1) + ',' + p1.y.toFixed(1) + ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1) + '"/>';
  }

  /* Point du meilleur créneau */
  if (tranche) {
    for (var q = 0; q < n; q++) {
      if (heures[q].substring(11, 16) === tranche.heure) {
        svg += '<circle class="point-ideal" cx="' + pts[q].x.toFixed(1) + '" cy="' + pts[q].y.toFixed(1) + '" r="5"/>';
        break;
      }
    }
  }

  /* Heure actuelle : ligne pointillée + point + température */
  var maintenant = new Date();
  var minuteActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
  var indexActuel = 0, meilleurEcart = Infinity;
  for (var m = 0; m < n; m++) {
    var hMin = parseInt(heures[m].substring(11, 13), 10) * 60 + parseInt(heures[m].substring(14, 16), 10);
    var ecart = Math.abs(hMin - minuteActuelle);
    if (ecart < meilleurEcart) { meilleurEcart = ecart; indexActuel = m; }
  }
  var xa = pts[indexActuel].x;
  svg += '<line class="meteo-now-ligne" x1="' + xa.toFixed(1) + '" y1="' + (mh - 4) + '" x2="' + xa.toFixed(1) + '" y2="' + (H - mb) + '"/>';
  svg += '<circle class="meteo-now-point" cx="' + xa.toFixed(1) + '" cy="' + pts[indexActuel].y.toFixed(1) + '" r="5"/>';
  svg += '<text class="meteo-now-label" x="' + (xa > L * 0.8 ? xa - 6 : xa + 6).toFixed(1) + '" y="12" text-anchor="' + (xa > L * 0.8 ? 'end' : 'start') + '">' + Math.round(r.actuelle) + '°</text>';

  svg += '</svg>';
  return svg;
}

document.addEventListener('click', function (e) {
  var cible = e.target.closest('[data-action]');
  if (!cible) { return; }
  var action = cible.getAttribute('data-action');
  if (action === 'ouvrir-modale-meteo') { ouvrirModaleMeteo(); }
  if (action === 'fermer-modale-meteo') { fermerModaleMeteo(); }
});

function ouvrirVerificationObjectif() {
  if (!etat.programmeActif) { return; }
  var prog = trouverParId(etat.programmes, etat.programmeActif.programmeId);
  if (!prog) { return; }
  var html = '';
  html += '<div class="modal-entete"><h2>Objectif — ' + echapperHtml(prog.nom) + '</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="texte-att" style="margin-bottom:10px;">Ton objectif est-il toujours le même ? Modifie-le si besoin.</div>';
  html += '<div class="champ"><label>Objectif actuel</label><textarea id="champ-objectif-verif">' + echapperHtml(prog.objectif || '') + '</textarea></div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="confirmer-objectif">Enregistrer</button>';
  ouvrirModal(html);
}

function confirmerObjectif() {
  if (!etat.programmeActif) { fermerModal(); return; }
  var prog = trouverParId(etat.programmes, etat.programmeActif.programmeId);
  if (prog) { prog.objectif = document.getElementById('champ-objectif-verif').value; }
  etat.programmeActif.dateDernierObjectif = formaterDateISO(new Date());
  sauvegarderEtat();
  fermerModal();
  afficherToast('Objectif enregistré.');
  rendreBanniereObjectif();
}

function rendreProgrammeActif() {
  var zone = document.getElementById('zone-programme-actif');
  if (!zone) { return; }
  var html = '';

  if (etat.programmeActif) {
    var prog = trouverParId(etat.programmes, etat.programmeActif.programmeId);
    if (prog) {
      var joursDepuisDebut = Math.floor((new Date() - dateDepuisISO(etat.programmeActif.dateDebut)) / (1000 * 60 * 60 * 24));
      var semaineActuelle = Math.floor(joursDepuisDebut / 7) + 1;
      html += '<div class="carte">';
      html += '<div class="ligne"><strong class="hist-programme-nom">' + echapperHtml(prog.nom) + '</strong><span class="badge-technique">' + echapperHtml(libelleDepuisValeur(TYPES_MESOCYCLE, prog.typeMesocycle || 'personnalise')) + '</span></div>';
      if (prog.objectif) { html += '<div class="texte-att hist-programme-objectif">' + echapperHtml(prog.objectif) + '</div>'; }
      if (prog.dureeSemaines) {
        var pct = Math.min(100, Math.round(semaineActuelle / prog.dureeSemaines * 100));
        html += '<div class="ligne hist-programme-semaine"><span class="texte-att">Semaine</span><span class="donnee-num">' + semaineActuelle + ' / ' + prog.dureeSemaines + '</span></div>';
        html += '<div class="macro-barre-fond"><div class="macro-barre-remplie macro-barre-proteines" style="width:' + pct + '%;"></div></div>';
        if (semaineActuelle > prog.dureeSemaines) { html += '<div class="texte-att" style="margin-top:6px;">Durée dépassée, pense à la suite du programme.</div>'; }
      } else {
        html += '<div class="ligne hist-programme-semaine"><span class="texte-att">Semaine</span><span class="donnee-num">' + semaineActuelle + '</span></div>';
      }
      html += '</div>';
    }
  }

  var semaines = semainesDepuisDerniereDecharge();
  if (semaines !== null && semaines >= 6 && !typeMesocycleProgrammeActifEstDecharge()) {
    html += '<div class="alerte-equilibre">&#9888; Ça fait ' + semaines + ' semaines sans décharge (deload) enregistrée — une semaine plus légère peut aider la récupération.</div>';
  }

  zone.innerHTML = html;
}

function rendreEquilibre() {
  var libelleZone = document.getElementById('equilibre-libelle-semaine');
  if (!libelleZone) { return; }
  var lundi = semaineAffichee;
  var dimanche = new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + 6);
  libelleZone.innerHTML = 'Semaine du ' + formaterDateCourte(formaterDateISO(lundi)) + ' au ' + formaterDateCourte(formaterDateISO(dimanche));

  var donnees = calculerVolumeSemaine(lundi);

  var maxVolume = 0;
  var g1;
  for (g1 = 0; g1 < GROUPES_MUSCULAIRES.length; g1++) {
    var v = donnees.volumeParGroupe[GROUPES_MUSCULAIRES[g1]] || 0;
    if (v > maxVolume) { maxVolume = v; }
  }

  var htmlVolume = '<h2 class="carte-titre">Volume (séries) et fréquence (jours) cette semaine</h2>';
  var uneLigneAffichee = false;
  for (var g = 0; g < GROUPES_MUSCULAIRES.length; g++) {
    var nomGroupe = GROUPES_MUSCULAIRES[g];
    var vol = donnees.volumeParGroupe[nomGroupe] || 0;
    var freq = donnees.frequenceParGroupe[nomGroupe] || 0;
    if (vol === 0 && freq === 0) { continue; }
    uneLigneAffichee = true;
    var largeurPourcent = maxVolume > 0 ? Math.round((vol / maxVolume) * 100) : 0;
    htmlVolume += '<div class="equilibre-ligne">';
    htmlVolume += '<div class="ligne"><span>' + echapperHtml(nomGroupe) + '</span><span class="donnee-num">' + vol + ' séries · ' + freq + ' jour(s)</span></div>';
    htmlVolume += '<div class="equilibre-barre-fond"><div class="equilibre-barre-remplie" style="width:' + largeurPourcent + '%;"></div></div>';
    htmlVolume += '</div>';
  }
  if (!uneLigneAffichee) {
    htmlVolume += '<div class="etat-vide">Aucune séance terminée cette semaine.</div>';
  }
  document.getElementById('equilibre-zone-volume').innerHTML = htmlVolume;

  var volPec = donnees.volumeParGroupe['Pectoraux'] || 0;
  var volDos = donnees.volumeParGroupe['Dos'] || 0;
  var htmlAlerte = '<h2 class="carte-titre">Équilibre Pectoraux / Dos</h2>';
  if (volPec === 0 && volDos === 0) {
    htmlAlerte += '<div class="texte-att">Rien à comparer cette semaine.</div>';
  } else if (Math.min(volPec, volDos) === 0) {
    var groupeManquant = (volPec === 0) ? 'Pectoraux' : 'Dos';
    htmlAlerte += '<div class="alerte-equilibre">&#9888; Aucun travail de ' + groupeManquant + ' cette semaine alors que l\'autre est sollicité (' + volPec + ' vs ' + volDos + ' séries).</div>';
  } else if ((Math.max(volPec, volDos) / Math.min(volPec, volDos)) > 1.5) {
    var groupeDevant = (volPec > volDos) ? 'Pectoraux' : 'Dos';
    htmlAlerte += '<div class="alerte-equilibre">&#9888; ' + groupeDevant + ' nettement devant cette semaine (' + volPec + ' vs ' + volDos + ' séries).</div>';
  } else {
    htmlAlerte += '<div class="alerte-equilibre-ok">&#10003; Équilibre correct (' + volPec + ' vs ' + volDos + ' séries).</div>';
  }
  document.getElementById('equilibre-zone-alerte').innerHTML = htmlAlerte;
}

/* ============================================================
   BLOC 15ter : SUGGESTIONS (indices calculés + ressenti manuel, jamais de décision automatique)
   ============================================================ */

/* Détecte un plateau : poids max stagnant ou en recul sur les 3 dernières séances d'un exercice */
function detecterPlateaux() {
  var suggestions = [];
  for (var i = 0; i < etat.exercices.length; i++) {
    var ex = etat.exercices[i];
    var points = pointsPoidsMaxParSeance(ex.id);
    if (points.length < 3) { continue; }
    var dernierTrois = points.slice(points.length - 3);
    var stagne = dernierTrois[2].valeur <= dernierTrois[0].valeur;
    if (stagne) {
      var detail = dernierTrois.map(function (p) { return p.valeur + 'kg'; }).join(' → ');
      suggestions.push({
        titre: 'Plateau sur ' + ex.nom,
        explication: 'Le poids max n\'a pas progressé sur les 3 dernières séances (' + detail + '). Une technique d\'intensification (drop set, rest-pause) ou un changement de structure de séries peut aider à relancer la progression — ou c\'est peut-être simplement le signal d\'une décharge.'
      });
    }
  }
  return suggestions;
}

/* Moyenne du ressenti manuel (sommeil inversé + fatigue + stress) sur les 7 derniers jours renseignés */
function calculerIndiceFatigueManuel() {
  var joursRecents = [];
  for (var i = 0; i < 7; i++) {
    var d = dateDepuisISO(obtenirDateJourReference());
    d.setDate(d.getDate() - i);
    var iso = formaterDateISO(d);
    if (etat.ressentiQuotidien[iso]) { joursRecents.push(etat.ressentiQuotidien[iso]); }
  }
  if (joursRecents.length === 0) { return null; }
  var sommeManqueSommeil = 0, sommeFatigue = 0, sommeStress = 0;
  for (var j = 0; j < joursRecents.length; j++) {
    /* Moins de 7h de sommeil augmente la contribution ; 7h ou plus = 0 (pas de trop-dormir penalise ici) */
    var heures = joursRecents[j].sommeil;
    var manque = (typeof heures === 'number') ? Math.max(0, Math.min(5, (7 - heures) * 1.5)) : 0;
    sommeManqueSommeil += manque;
    sommeFatigue += joursRecents[j].fatigue;
    sommeStress += joursRecents[j].stress;
  }
  return {
    score: (sommeManqueSommeil + sommeFatigue + sommeStress) / (joursRecents.length * 3),
    nbJours: joursRecents.length
  };
}

/* Compare le RPE moyen des 2 dernières semaines à celui des 2 semaines precedentes */
function tendanceRpeGlobale() {
  var maintenant = new Date();
  var isoMaintenant = formaterDateISO(maintenant);
  var iso2Semaines = formaterDateISO(new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - 14));
  var iso4Semaines = formaterDateISO(new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - 28));

  var sommeRecent = 0, nbRecent = 0, sommeAncien = 0, nbAncien = 0;
  var entreesTerminees = etat.agenda.filter(function (a) { return a.statut === 'termine' && a.resultat; });
  for (var i = 0; i < entreesTerminees.length; i++) {
    var e = entreesTerminees[i];
    for (var j = 0; j < e.resultat.exercices.length; j++) {
      var rpe = e.resultat.exercices[j].rpe;
      if (rpe === undefined || rpe === null) { continue; }
      if (e.date >= iso2Semaines && e.date <= isoMaintenant) { sommeRecent += rpe; nbRecent++; }
      else if (e.date >= iso4Semaines && e.date < iso2Semaines) { sommeAncien += rpe; nbAncien++; }
    }
  }
  if (nbRecent === 0 || nbAncien === 0) { return null; }
  return { recent: sommeRecent / nbRecent, ancien: sommeAncien / nbAncien };
}

/* Combine les signaux automatiques (RPE, semaines sans decharge) et manuels (ressenti) : au moins 2 signaux concordants avant de suggerer */
function suggestionFatigue() {
  var indiceManuel = calculerIndiceFatigueManuel();
  var tendance = tendanceRpeGlobale();
  var semaines = semainesDepuisDerniereDecharge();
  var signaux = [];

  if (indiceManuel !== null && indiceManuel.score >= 3.5) {
    signaux.push('ton ressenti quotidien moyen des ' + indiceManuel.nbJours + ' derniers jours renseignés indique une fatigue plutôt élevée (sommeil/fatigue/stress)');
  }
  if (tendance !== null && (tendance.recent - tendance.ancien) >= 1) {
    signaux.push('ton RPE moyen a augmenté de ' + (tendance.recent - tendance.ancien).toFixed(1) + ' point(s) sur les 2 dernières semaines');
  }
  if (semaines !== null && semaines >= 6) {
    signaux.push('ça fait ' + semaines + ' semaines sans décharge enregistrée');
  }

  if (signaux.length >= 2) {
    return {
      titre: 'Signes de fatigue accumulée',
      explication: 'Plusieurs signaux se recoupent : ' + signaux.join(' ; ') + '. Une semaine plus légère (décharge) pourrait aider la récupération. À valider avec ton coach si tu as un doute.'
    };
  }
  return null;
}

function genererSuggestions() {
  var suggestions = [];
  var sugFatigue = suggestionFatigue();
  if (sugFatigue) { suggestions.push(sugFatigue); }
  suggestions = suggestions.concat(detecterPlateaux());
  return suggestions;
}

function rendreSuggestions() {
  var zone = document.getElementById('zone-suggestions');
  if (!zone) { return; }
  var suggestions = genererSuggestions();
  if (suggestions.length === 0) {
    zone.innerHTML = '<div class="carte etat-vide">Rien à signaler pour l\'instant — continue comme ça, ou reviens ici après quelques séances de plus.</div>';
    return;
  }
  var html = '<div class="carte">';
  for (var i = 0; i < suggestions.length; i++) {
    html += '<div class="suggestion-carte"><strong>' + echapperHtml(suggestions[i].titre) + '</strong><span>' + echapperHtml(suggestions[i].explication) + '</span></div>';
  }
  html += '</div>';
  zone.innerHTML = html;
}

/* ============================================================
   BLOC 16 : HISTORIQUE DES SEANCES
   ============================================================ */

function seancesTerminees() {
  var entrees = etat.agenda.filter(function (a) {
    return a.statut === 'termine' && a.resultat;
  });
  entrees.sort(function (a, b) { return a.date < b.date ? 1 : -1; }); // plus récent d'abord
  return entrees;
}

function rendreHistoriqueSeances() {
  var conteneur = document.getElementById('liste-historique-seances');
  if (!conteneur) { return; }

  var entrees = seancesTerminees();
  var total = document.getElementById('hist-seances-total');
  if (total) { total.innerHTML = entrees.length + ' séance' + (entrees.length > 1 ? 's' : ''); }
  if (entrees.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucune séance réalisée pour le moment.</li>';
    return;
  }

  var compte = {};
  var i;
  for (i = 0; i < entrees.length; i++) {
    var c = entrees[i].date.substring(0, 7);
    compte[c] = (compte[c] || 0) + 1;
  }

  var html = '';
  var moisCourant = '';
  for (i = 0; i < entrees.length; i++) {
    var entree = entrees[i];
    var cle = entree.date.substring(0, 7);
    var d = dateDepuisISO(entree.date);
    if (cle !== moisCourant) {
      moisCourant = cle;
      html += '<li class="groupe-entete">' + MOIS_NOMS[d.getMonth()] + ' ' + d.getFullYear() + '&nbsp;<span class="groupe-entete-nb">(' + compte[cle] + ')</span></li>';
    }
    var seance = trouverParId(etat.seances, entree.seanceId);
    var nomSeance = seance ? seance.nom : '(séance supprimée)';
    var complete = seanceEstComplete(entree);
    var nbEx = entree.resultat.exercices.length;
    var infos = [nbEx + ' exercice' + (nbEx > 1 ? 's' : '')];
    if (entree.dureeMinutes) { infos.push(entree.dureeMinutes + ' min'); }
    if (entree.caloriesEstimees) { infos.push(Math.round(entree.caloriesEstimees) + ' kcal'); }

    html += '<li class="hist-ligne ' + (complete ? 'hist-fait' : 'hist-incomplet') + '" data-action="voir-detail-historique" data-id="' + entree.id + '">';
    html += '<span class="hist-date"><span class="hist-date-j donnee-num">' + d.getDate() + '</span><span class="hist-date-m">' + MOIS_COURTS[d.getMonth()] + '</span></span>';
    html += '<div class="hist-ligne-corps"><strong class="hist-ligne-titre">' + echapperHtml(nomSeance) + '</strong><span class="hist-ligne-sous donnee-num">' + infos.join(' · ') + '</span></div>';
    html += '<span class="badge-technique' + (complete ? ' badge-record' : '') + '">' + (complete ? 'Complète' : 'Incomplète') + '</span>';
    html += '</li>';
  }
  conteneur.innerHTML = html;
}

function ouvrirDetailHistorique(idEntree) {
  var entree = trouverParId(etat.agenda, idEntree);
  if (!entree || !entree.resultat) { return; }
  var seance = trouverParId(etat.seances, entree.seanceId);
  var nomSeance = seance ? seance.nom : '(séance supprimée)';
  var complete = seanceEstComplete(entree);

  var html = '';
  html += '<div class="modal-entete"><h2>' + echapperHtml(nomSeance) + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="texte-att" style="margin-bottom:12px;">' + formaterDateLisible(entree.date);
  if (entree.dureeMinutes) { html += ' · ' + entree.dureeMinutes + ' min'; }
  if (entree.caloriesEstimees) { html += ' · ' + Math.round(entree.caloriesEstimees) + ' kcal'; }
  html += '</div>';
  html += '<div class="badge-technique' + (complete ? ' badge-record' : '') + '" style="display:inline-block; margin-bottom:12px;">' + (complete ? 'Complète' : 'Incomplète') + '</div>';

  for (var i = 0; i < entree.resultat.exercices.length; i++) {
    var ligneEx = entree.resultat.exercices[i];
    var exRef = trouverParId(etat.exercices, ligneEx.exerciceId);
    var nomEx = exRef ? exRef.nom : '(exercice supprimé)';

    html += '<div class="carte" style="padding:10px; margin-bottom:10px;">';
    html += '<strong>' + echapperHtml(nomEx) + '</strong>';
    for (var s = 0; s < ligneEx.series.length; s++) {
      var serie = ligneEx.series[s];
      html += '<div class="serie-ligne">';
      html += '<div class="serie-num">#' + (s + 1) + '</div>';
      html += '<div class="serie-champ"><input type="number" step="0.5" inputmode="decimal" data-role="hist-poids" data-entree="' + entree.id + '" data-ex="' + i + '" data-serie="' + s + '" value="' + serie.poids + '"></div>';
      html += '<div class="serie-unite">kg</div>';
      html += '<div class="serie-champ"><input type="number" step="1" inputmode="numeric" data-role="hist-reps" data-entree="' + entree.id + '" data-ex="' + i + '" data-serie="' + s + '" value="' + serie.reps + '"></div>';
      html += '<div class="serie-unite">reps</div>';
      html += '<button class="bulle-validation' + (serie.fait ? ' bulle-validation-faite' : '') + '" data-action="basculer-serie-historique" data-entree="' + entree.id + '" data-ex="' + i + '" data-serie="' + s + '">&#10003;</button>';
      html += '</div>';
    }
    html += '</div>';
  }

  html += '<button class="btn btn-contour btn-bloc" style="margin-top:6px;" data-action="tout-marquer-fait-historique" data-id="' + entree.id + '">Tout marquer fait (complète)</button>';
  html += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="tout-marquer-non-fait-historique" data-id="' + entree.id + '">Tout marquer non fait (incomplète)</button>';

  ouvrirModal(html);
}

function basculerSerieFaiteHistorique(entreeId, exIndex, serieIndex) {
  var entree = trouverParId(etat.agenda, entreeId);
  if (!entree || !entree.resultat) { return; }
  var serie = entree.resultat.exercices[exIndex].series[serieIndex];
  serie.fait = !serie.fait;
  sauvegarderEtat();
  ouvrirDetailHistorique(entreeId);
  rendreHistoriqueSeances();
  rendreCalendrier();
  rendreJourSelectionne();
}

function modifierValeurSerieHistorique(role, entreeId, exIndex, serieIndex, valeur) {
  var entree = trouverParId(etat.agenda, entreeId);
  if (!entree || !entree.resultat) { return; }
  var serie = entree.resultat.exercices[exIndex].series[serieIndex];
  if (role === 'hist-poids') { serie.poids = parseFloat(valeur) || 0; }
  if (role === 'hist-reps') { serie.reps = parseInt(valeur, 10) || 0; }
  sauvegarderEtat();
}

function toutMarquerHistorique(entreeId, valeur) {
  var entree = trouverParId(etat.agenda, entreeId);
  if (!entree || !entree.resultat) { return; }
  for (var i = 0; i < entree.resultat.exercices.length; i++) {
    var series = entree.resultat.exercices[i].series;
    for (var j = 0; j < series.length; j++) { series[j].fait = valeur; }
  }
  sauvegarderEtat();
  ouvrirDetailHistorique(entreeId);
  rendreHistoriqueSeances();
  rendreCalendrier();
  rendreJourSelectionne();
}

/* ============================================================
   BLOC : COMMANDE VOCALE (séance active)
   ============================================================ */

var voixActive = false;
var voixReco = null;
var voixDerniereActionMs = 0;
var voixFinDemandeeMs = 0;

function voixEstSupportee() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function majBoutonVoix() {
  var bouton = document.getElementById('btn-voix');
  if (!bouton) { return; }
  if (voixActive) { bouton.classList.add('btn-voix-actif'); }
  else { bouton.classList.remove('btn-voix-actif'); }
}

function activerCommandeVocale() {
  if (!etat.seanceActive) { return; }
  if (!voixEstSupportee()) {
    afficherToast('Commande vocale non supportée par ce navigateur.');
    return;
  }
  var ctx = obtenirContexteAudio();
  if (ctx && ctx.resume) { ctx.resume(); }
  voixActive = true;
  majBoutonVoix();
  demarrerEcouteVoix();
  afficherToast('Commande vocale activée');
}

function desactiverCommandeVocale(silencieux) {
  var etaitActive = voixActive;
  voixActive = false;
  if (voixReco) {
    try { voixReco.onend = null; voixReco.stop(); } catch (e) {}
    voixReco = null;
  }
  majBoutonVoix();
  if (etaitActive && !silencieux) { afficherToast('Commande vocale désactivée'); }
}

function demarrerEcouteVoix() {
  var Constructeur = window.SpeechRecognition || window.webkitSpeechRecognition;
  var reco = new Constructeur();
  reco.lang = 'fr-FR';
  reco.continuous = true;
  reco.interimResults = false;
  reco.onresult = function (evt) {
    for (var i = evt.resultIndex; i < evt.results.length; i++) {
      if (evt.results[i].isFinal) { traiterCommandeVocale(evt.results[i][0].transcript); }
    }
  };
  reco.onerror = function (evt) {
    if (evt.error === 'not-allowed' || evt.error === 'service-not-allowed' || evt.error === 'audio-capture' || evt.error === 'network') {
      desactiverCommandeVocale(true);
      afficherToast('Reconnaissance vocale indisponible (micro refusé ou pas de connexion).');
    }
  };
  /* Le navigateur coupe l'écoute de temps en temps : on la relance tant que la commande est active */
  reco.onend = function () {
    if (voixActive && voixReco === reco) {
      window.setTimeout(function () {
        if (voixActive && voixReco === reco) {
          try { reco.start(); } catch (e) {}
        }
      }, 300);
    }
  };
  voixReco = reco;
  try { reco.start(); } catch (e) {}
}

function validerSerieEnCoursVocal() {
  if (!etat.seanceActive) { return false; }
  var exs = etat.seanceActive.exercices;
  for (var e = 0; e < exs.length; e++) {
    for (var s = 0; s < exs[e].series.length; s++) {
      if (!exs[e].series[s].fait) { basculerSerieFaite(e, s); return true; }
    }
  }
  return false;
}

function traiterCommandeVocale(texte) {
  var t = normaliserTexteRecherche(texte).replace(/[^a-z ]/g, ' ');
  var action = null;
  if (t.indexOf('desactiv') !== -1) { action = 'desactive'; }
  else if (t.indexOf('minuteur') !== -1 || t.indexOf('minuterie') !== -1) { action = 'minuteur'; }
  else if (t.indexOf('valid') !== -1) { action = 'valide'; }
  else if (/\bfin\b/.test(t)) { action = 'fin'; }
  if (!action) { return; }

  var maintenant = Date.now();
  if (maintenant - voixDerniereActionMs < 1500) { return; }
  voixDerniereActionMs = maintenant;

  if (action === 'desactive') { desactiverCommandeVocale(); return; }
  if (!etat.seanceActive) { return; }

  if (action === 'minuteur') {
    if (compteARebours.actif) { afficherToast('Le minuteur tourne déjà.'); return; }
    afficherToast('🎤 Minuteur');
    lancerCompteARebours();
    return;
  }
  if (action === 'valide') {
    /* "fin" a ouvert la confirmation : "valide" dans les 15 s la confirme */
    if (voixFinDemandeeMs && (maintenant - voixFinDemandeeMs) < 15000 && document.querySelector('[data-action="confirmation-valider"]')) {
      voixFinDemandeeMs = 0;
      validerConfirmation();
      return;
    }
    if (validerSerieEnCoursVocal()) { afficherToast('🎤 Série validée'); }
    else { afficherToast('Toutes les séries sont déjà validées.'); }
    return;
  }
  if (action === 'fin') {
    voixFinDemandeeMs = maintenant;
    terminerSeance();
  }
}

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
  if (action === 'ouvrir-verif-objectif') { ouvrirVerificationObjectif(); return; }
  if (action === 'confirmer-objectif') { confirmerObjectif(); return; }
  if (action === 'enregistrer-profil') { enregistrerProfil(); return; }
  if (action === 'choisir-option') { choisirOptionReglage(cible); return; }
  if (action === 'enregistrer-reglages-sync') { enregistrerReglagesSync(); return; }
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
  if (action === 'basculer-voix') { if (voixActive) { desactiverCommandeVocale(); } else { activerCommandeVocale(); } return; }
  if (action === 'annuler-seance') { annulerSeance(); }
  if (action === 'ajouter-serie') { ajouterSerieLive(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'ajouter-serie-echauffement') { ajouterSerieEchauffementLive(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'ajouter-serie-degressive') { ajouterSerieDegressive(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'supprimer-serie') { supprimerSerieLive(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'basculer-serie-faite') { basculerSerieFaite(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'basculer-note-serie') { basculerNoteSerie(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
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

  if (action === 'tester-sonnerie') {
    var sel = document.getElementById('champ-profil-sonnerie');
    if (sel) { etat.profil.sonnerie = sel.value; sauvegarderEtat(); }
    jouerSonnerie();
    return;
  }

});

document.body.addEventListener('change', function (evt) {
  var role = evt.target.getAttribute && evt.target.getAttribute('data-role');
  if (role === 'live-poids' || role === 'live-reps' || role === 'live-note') {
    var exIndex = parseInt(evt.target.getAttribute('data-ex'), 10);
    var serieIndex = parseInt(evt.target.getAttribute('data-serie'), 10);
    modifierValeurSerieLive(role, exIndex, serieIndex, evt.target.value);
  }
  if (role === 'live-rpe') {
    modifierRpeExercice(parseInt(evt.target.getAttribute('data-ex'), 10), evt.target.value);
  }
  if (evt.target.id === 'champ-ex-groupe') { rafraichirDiagrammeMuscles(); }
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
}, false);

document.getElementById('modal-overlay').addEventListener('click', function (evt) {
  if (evt.target.id === 'modal-overlay') { fermerModal(); }
}, false);

/* ============================================================
   ICÔNE NUTRITION PAR THÈME (tout est végane)
   Une ligne par thème. "defaut" sert pour sombre, clair et auto.
   ============================================================ */
var ICONES_NUTRITION = {
  defaut: '<path d="M12 7c-2-2-6-1.5-6 3 0 4 2.5 9 6 9s6-5 6-9c0-4.5-4-5-6-3z"/><path d="M12 7c0-2 1-3.5 3-4"/>',

  /* 🍉 pastèque */
  estival: '<path d="M3 9h18a9 9 0 0 1-18 0z"/><path d="M5.5 9a6.5 6.5 0 0 0 13 0"/><path d="M9 12v.01M12 14v.01M15 12v.01"/>',

  /* 🌰 châtaigne */
  automnal: '<path id="fond" class="cls-1" d="M12,22C6.477,22,2,20.523,2,15,2,8.127,8.969,7.7,12,2"/>  <path id="fond_copie" data-name="fond copie" class="cls-1" d="M12,22c5.523,0,10-1.477,10-7,0-6.873-6.969-7.3-10-13"/>  <path id="Forme_8" data-name="Forme 8" class="cls-2" d="M3,18c2.63-2.63,15.334-2.666,18,0"/>',

  /* 🎃 jack-o'-lantern */
  effroi: '<path class="cls-1" d="M11.892,7.47C17.966,3.466,22,8.735,22,13.792s-2.554,9.156-10.01,9.156-10.01-4.1-10.01-9.156S5.7,3.491,11.892,7.47Z"/>  <path id="Forme_4" data-name="Forme 4" class="cls-1" d="M5,12c-0.226.81-1.119,5.1,4,8a1.94,1.94,0,0,1,1-1,2.122,2.122,0,0,0,2,1,2.122,2.122,0,0,0,2-1l1,1a7.117,7.117,0,0,0,4-8c-0.615,1.051-1.5,2.678-3,3-0.246.682-1.134,3.784-2,4a3.528,3.528,0,0,0-1-2H11a5.9,5.9,0,0,0-1,2c-1.2-.433-2-4-2-4A5.187,5.187,0,0,1,5,12Z"/>  <path id="Forme_5" data-name="Forme 5" class="cls-2" d="M7.012,9.652l2.279,1.139,0.57,1.139H8.721l-1.139-.57Z"/>  <path id="Forme_5_copie" data-name="Forme 5 copie" class="cls-2" d="M16.988,9.652l-2.279,1.139-0.57,1.139h1.139l1.139-.57Z"/>  <path id="Forme_6" data-name="Forme 6" class="cls-1" d="M12,13.857l-0.381.762h0.762Z"/>  <path id="Forme_7" data-name="Forme 7" class="cls-2" d="M12,7c-0.158-2.133-1.022-2.523,0-4s1.907-2.5,3-2,1.748,2.723-1,3c-1.415.1-3.438-2.4-6-2"/>',

  /* ☕ chocolat chaud végétal */
  hivernal: '<path d="M5 10h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 12h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-1 1 1 2 0 3M12 3c-1 1 1 2 0 3"/>',

  /* 🍪 bonhomme biscuit (pain d'épice végane) */
  paindepice: '<circle cx="12" cy="6" r="2.5"/><path d="M9.5 8.5L4.5 9.5 5 12.5l4-1L8 20h3.2l.8-2.5.8 2.5H16l-1-8.5 4 1 .5-3-5-1"/><path d="M12 12v.01M12 14.5v.01"/>',

  /* 🍓 fraise */
  printanier: '<path d="M12 8c-4-1-7 1-6 5 1 4 4 7 6 7s5-3 6-7c1-4-2-6-6-5z"/><path d="M9.5 6.5L12 8l2.5-1.5M12 8V5"/><path d="M10 12v.01M14 12v.01M12 15v.01"/>',

  /* 🧁 cupcake végane */
  pastel: '<path d="M5.5 12c-.5-3 1.5-5 3-5.2C9 5 10.5 4 12 4s3 1 3.5 2.8c1.5.2 3.5 2.2 3 5.2z"/><path d="M6 12l1.5 8h9L18 12"/><path d="M10 14v4M14 14v4"/>',

  /* 🍜 bol de ramen (nouilles et bouillon végétal) */
  cyberpunk: '<path d="M4 12h16c0 4.4-3.6 8-8 8s-8-3.6-8-8z"/><path d="M14 3.5L10.5 12M17 4.5L13.5 12"/>',

  /* 🫖 théière */
  steampunk: '<path class="cls-1" d="M13,6c2.9,0,6,7.49,6,10s-3.1,3-6,3-6-.49-6-3S10.1,6,13,6Z"/>  <path id="Forme_3" data-name="Forme 3" class="cls-1" d="M9,10h8"/>  <path id="Forme_1" data-name="Forme 1" class="cls-1" d="M15,19c5.062,0,8.225-3.686,6-8-2.165-4.2-.813-7.732,1-7"/>  <path id="Forme_2" data-name="Forme 2" class="cls-2" d="M8,10C5.941,6.057,2.435,8.319,2,12s3.439,3.861,4,5c0.578,1.174-2,2-2,2"/>  <circle class="cls-3" cx="13" cy="4" r="0.781"/>  <path class="cls-1" d="M16.357,21.889c0-1.534-1.727-2.778-3.857-2.778s-3.857,1.244-3.857,2.778h7.714Z"/>',

  /* 🍍 ananas */
  flibuste: '<path d="M8 12.5c0-2.5 1.5-4 4-4s4 1.5 4 4v3c0 2.5-1.5 4.5-4 4.5s-4-2-4-4.5z"/><path d="M12 8.5C10.5 6 9 5.5 8 4M12 8.5V3.5M12 8.5C13.5 6 15 5.5 16 4"/><path d="M8.5 13l7 5M15.5 13l-7 5"/>',

  /* 🌵 cactus */
  ruedor: '<path d="M10 20V8a2 2 0 0 1 4 0v12"/><path d="M10 14H8a2 2 0 0 1-2-2v-2M14 12h2a2 2 0 0 0 2-2V8"/><path d="M7 20h10"/>',

  /* 🌶️ piment */
  wasteland: '<path d="M7 6c-.5 5 4 11 11 13-1-5-3-9-6-11.5C10.5 6.2 8.5 5.5 7 6z"/><path d="M7 6L5.5 4M7 6c0-1 .5-2 1.5-2.5"/>'
};

function majIconeNutrition(theme) {
  var zone = document.querySelector('.nav-onglet[data-page="nutrition"] .nav-icone');
  if (!zone) { return; }
  var contenu = ICONES_NUTRITION[theme] || ICONES_NUTRITION.defaut;
  zone.innerHTML = '<svg viewBox="0 0 24 24">' + contenu + '</svg>';
}

/* ============================================================
   AMBIANCE PAR THÈME
   c = classes CSS    n = nombre de particules
   t = taille en px [min, max]    d = durée en secondes [min, max]
   dx / dy = dérive horizontale / verticale max (px)    r = rotation max (deg)
   pos = 'h' (traverse l'écran de gauche à droite, y = hauteur en %)
         'libre' (reste en place, position au hasard)
         rien = tombe ou monte depuis le haut / le bas
   ============================================================ */
var AMBIANCE_ACTIVE = true;   /* false = aucune ambiance */

var AMBIANCES = {
  wasteland: [
    { c: 'amb-nuage amb-nuage-pollution', n: 4, t: [220, 380], d: [16, 28], dx: 60 },
    { c: 'amb-braise', n: 8, t: [2, 4], d: [6, 12], dx: 90 }
  ],
  ruedor: [
    { c: 'amb-nuage-bas', n: 6, t: [220, 420], d: [10, 17], pos: 'h', y: [76, 100], dy: -22 },
    { c: 'amb-brume amb-brume-poussiere', n: 3, t: [300, 480], d: [6, 11], pos: 'h', y: [30, 95], dy: 55 },
    { c: 'amb-poussiere', n: 22, t: [2, 4.5], d: [1.2, 3.4], pos: 'h', y: [0, 100], dy: 60 },
    { special: 'virevoltant' }
  ],
  cyberpunk: [
    { c: 'amb-neon amb-neon-cyan', n: 2, t: [260, 420], d: [7, 12], pos: 'libre', dx: 60, dy: 40 },
    { c: 'amb-neon amb-neon-rose', n: 2, t: [260, 420], d: [8, 13], pos: 'libre', dx: -60, dy: 50 },
    { c: 'amb-neon amb-neon-violet', n: 2, t: [260, 420], d: [9, 14], pos: 'libre', dx: 40, dy: -50 }
  ],
  effroi: [
    { c: 'amb-brume amb-brume-effroi', n: 2, t: [300, 500], d: [30, 50], pos: 'h', y: [45, 95], dy: -40 }
  ],
  hivernal: [
    { c: 'amb-flocon amb-flocon-a', n: 14, t: [6, 22], d: [20, 38], dx: 170, r: 360 },
    { c: 'amb-flocon amb-flocon-b', n: 12, t: [6, 22], d: [20, 38], dx: 170, r: 360 }
  ],
  paindepice: [
    { c: 'amb-etincelle', n: 18, t: [8, 18], d: [2, 5], pos: 'libre' }
  ],
  estival: [
    { c: 'amb-rayon', n: 8, t: [24, 200], d: [8, 16], pos: 'haut', x: [35, 115], ang: [20, 27], op: [.25, .6] }
  ],
  printanier: [
    { c: 'amb-petale amb-petale-rose', n: 12, t: [8, 14], d: [10, 18], dx: 80, r: 540 }
  ],
  automnal: [
    { c: 'amb-feuille amb-feuille-orange', n: 6, t: [12, 20], d: [10, 18], dx: 100, r: 540 },
    { c: 'amb-feuille amb-feuille-rouge', n: 4, t: [12, 20], d: [10, 18], dx: 100, r: 540 },
    { c: 'amb-erable', n: 5, t: [14, 24], d: [11, 20], dx: 110, r: 540 }
  ],
  pastel: [
    { c: 'amb-bulle amb-bulle-pastel', n: 12, t: [10, 34], d: [12, 24], dx: 40 }
  ],
  flibuste: [
    { c: 'amb-bulle amb-bulle-mer', n: 10, t: [8, 26], d: [12, 24], dx: 30 }
  ],
  steampunk: [
    { c: 'amb-nuage amb-nuage-vapeur', n: 3, t: [120, 200], d: [14, 24], dx: 40 }
  ]
};

var themeAmbianceCourant = null;

function alea(min, max) { return min + Math.random() * (max - min); }

/* Western : virevoltant géant, centre sous le bord de l'écran (seul le haut de la boule dépasse) */
function htmlVirevoltant() {
  var W = window.innerWidth;
  var D = Math.round(Math.max(240, Math.min(360, W * 0.8)));
  var rot = ((W + 2 * D) / (D / 2)) * 180 / Math.PI;   /* roule sans glisser : la rotation suit la distance */
  var teintes = ['#D8BC84', '#C9A66B', '#A88455', '#8A6A3A', '#5A3E22'];
  var s = '<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round">';
  var i, a1, a2, r1, r2;

  s += '<circle r="52" fill="rgba(25,12,4,.35)" stroke="none"/>';   /* cœur sombre : donne du volume */
  for (i = 0; i < 9; i++) {   /* grands anneaux de brindilles */
    s += '<ellipse rx="' + alea(58, 95).toFixed(0) + '" ry="' + alea(22, 82).toFixed(0) + '" transform="rotate(' + alea(0, 180).toFixed(0) + ')" stroke="' + teintes[Math.floor(Math.random() * 4)] + '" stroke-width="' + alea(1.2, 2.2).toFixed(1) + '" stroke-opacity="' + alea(0.5, 0.85).toFixed(2) + '"/>';
  }
  for (i = 0; i < 32; i++) {   /* brindilles qui traversent la boule */
    a1 = alea(0, 6.283); a2 = a1 + alea(1.7, 4.5);
    r1 = alea(84, 97); r2 = alea(84, 97);
    s += '<path d="M' + (Math.cos(a1) * r1).toFixed(1) + ',' + (Math.sin(a1) * r1).toFixed(1) + ' Q' + alea(-55, 55).toFixed(0) + ',' + alea(-55, 55).toFixed(0) + ' ' + (Math.cos(a2) * r2).toFixed(1) + ',' + (Math.sin(a2) * r2).toFixed(1) +
      '" stroke="' + teintes[Math.floor(Math.random() * 5)] + '" stroke-width="' + alea(1, 2.6).toFixed(1) + '" stroke-opacity="' + alea(0.55, 0.95).toFixed(2) + '"/>';
  }
  for (i = 0; i < 20; i++) {   /* brindilles qui dépassent */
    a1 = alea(0, 6.283); r1 = alea(78, 92);
    s += '<path d="M' + (Math.cos(a1) * r1).toFixed(1) + ',' + (Math.sin(a1) * r1).toFixed(1) + ' L' + (Math.cos(a1 + alea(-0.15, 0.15)) * (r1 + alea(8, 16))).toFixed(1) + ',' + (Math.sin(a1 + alea(-0.15, 0.15)) * (r1 + alea(8, 16))).toFixed(1) +
      '" stroke="' + teintes[Math.floor(Math.random() * 4)] + '" stroke-width="1.4" stroke-opacity=".8"/>';
  }
  s += '</svg>';

  return '<div class="tw" style="width:' + D + 'px;height:' + D + 'px;top:calc(100% - ' + Math.round(D * 0.42) + 'px);--tw-d:' + D + 'px;">' +
    '<div class="tw-saut"><div class="tw-boule" style="--rot:' + rot.toFixed(0) + 'deg;">' + s + '</div></div></div>';
}

function majAmbiance(theme) {
  var zone = document.getElementById('ambiance-theme');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'ambiance-theme';
    zone.className = 'ambiance-theme';
    document.body.appendChild(zone);
  }
  var cle = AMBIANCE_ACTIVE ? theme : '';
  if (cle === themeAmbianceCourant) { return; }
  themeAmbianceCourant = cle;

  var groupes = AMBIANCES[cle] || [];
  var html = '';
  for (var g = 0; g < groupes.length; g++) {
    var gr = groupes[g];
    if (gr.special === 'virevoltant') { html += htmlVirevoltant(); continue; }
    for (var i = 0; i < gr.n; i++) {
      var taille = alea(gr.t[0], gr.t[1]).toFixed(1);
      var duree = alea(gr.d[0], gr.d[1]);
      var haut = (gr.c.indexOf('amb-nuage-bas') !== -1) ? (taille * 0.57).toFixed(1) : taille;
      var s = 'width:' + taille + 'px;height:' + haut + 'px;font-size:' + taille + 'px;';
      s += 'animation-duration:' + duree.toFixed(1) + 's;animation-delay:-' + (Math.random() * duree).toFixed(1) + 's;';
      if (gr.pos === 'h') {
        s += 'left:0;top:' + alea(gr.y[0], gr.y[1]).toFixed(0) + '%;';
      } else if (gr.pos === 'haut') {
        var gauche = gr.x ? alea(gr.x[0], gr.x[1]) : alea(0, 100);
        s += 'left:' + gauche.toFixed(0) + '%;top:-25%;';
      } else if (gr.pos === 'libre') {
        var haut = gr.y ? alea(gr.y[0], gr.y[1]) : alea(0, 90);
        s += 'left:' + alea(0, 90).toFixed(0) + '%;top:' + haut.toFixed(0) + '%;';
      } else {
        s += 'left:' + alea(0, 100).toFixed(0) + '%;';
      }
      if (gr.dx) { s += '--dx:' + alea(-Math.abs(gr.dx), Math.abs(gr.dx)).toFixed(0) + 'px;'; }
      if (gr.dy) { s += '--dy:' + alea(-Math.abs(gr.dy), Math.abs(gr.dy)).toFixed(0) + 'px;'; }
      if (gr.r) { s += '--rot:' + alea(-gr.r, gr.r).toFixed(0) + 'deg;'; }
      if (gr.ang) { s += '--a:' + alea(gr.ang[0], gr.ang[1]).toFixed(1) + 'deg;'; }
      if (gr.op) { s += '--op:' + alea(gr.op[0], gr.op[1]).toFixed(2) + ';'; }
      html += '<span class="amb ' + gr.c + '" style="' + s + '"></span>';
    }
  }
  zone.innerHTML = html;
}

/* ============================================================
   ÉCLAIR (thème effroi) : flash + foudre synchronisés, à intervalle aléatoire
   ============================================================ */
var ECLAIR_ACTIF = true;
var ECLAIR_DELAI = [8, 25];   /* secondes entre deux éclairs (min, max) */
var minuteurEclair = null;
var coucheFlash = null;
var coucheBolt = null;

function creerCouchesEclair() {
  if (coucheFlash) { return; }
  coucheFlash = document.createElement('div');
  coucheFlash.className = 'eclair-flash';
  coucheBolt = document.createElement('div');
  coucheBolt.className = 'eclair-bolt';
  document.body.appendChild(coucheFlash);
  document.body.appendChild(coucheBolt);
}

/* Dessine une foudre zigzagante avec une branche, différente à chaque fois */
function dessinerFoudre() {
  var pts = [[60, 0]];
  var x = 60, y = 0;
  while (y < 400) {
    y += alea(25, 45);
    x += alea(-24, 24);
    if (x < 15) { x = 15; }
    if (x > 105) { x = 105; }
    pts.push([x, Math.min(y, 400)]);
  }
  var d = 'M' + pts[0][0] + ',' + pts[0][1];
  for (var i = 1; i < pts.length; i++) { d += ' L' + pts[i][0].toFixed(0) + ',' + pts[i][1].toFixed(0); }

  var depart = pts[Math.floor(pts.length * alea(.3, .6))];
  var bx = depart[0], by = depart[1];
  var sens = Math.random() < .5 ? -1 : 1;
  var branche = 'M' + bx.toFixed(0) + ',' + by.toFixed(0);
  for (var b = 0; b < 3; b++) {
    bx += sens * alea(8, 18);
    by += alea(20, 38);
    branche += ' L' + bx.toFixed(0) + ',' + by.toFixed(0);
  }

  var svg = '<svg viewBox="0 0 120 400" preserveAspectRatio="none">';
  svg += '<path d="' + d + ' ' + branche + '" fill="none" stroke="rgba(150,110,255,.55)" stroke-width="9" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  svg += '<path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  svg += '<path d="' + branche + '" fill="none" stroke="#E8DEFF" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  svg += '</svg>';
  return svg;
}

function declencherEclair() {
  minuteurEclair = null;
  if ((etat.profil.theme || 'sombre') !== 'effroi' || !ECLAIR_ACTIF) { return; }
  if (!document.hidden) {
    creerCouchesEclair();
    var posX = alea(15, 85).toFixed(0) + '%';
    coucheBolt.innerHTML = dessinerFoudre();
    coucheBolt.style.left = posX;
    coucheFlash.style.setProperty('--ex', posX);
    coucheFlash.classList.remove('actif');
    coucheBolt.classList.remove('actif');
    void coucheFlash.offsetWidth;   /* relance les animations */
    coucheFlash.classList.add('actif');
    coucheBolt.classList.add('actif');
  }
  planifierEclair();
}

function planifierEclair() {
  if (minuteurEclair) { window.clearTimeout(minuteurEclair); }
  minuteurEclair = window.setTimeout(declencherEclair, alea(ECLAIR_DELAI[0], ECLAIR_DELAI[1]) * 1000);
}

function majEclair(theme) {
  if (minuteurEclair) { window.clearTimeout(minuteurEclair); minuteurEclair = null; }
  if (theme === 'effroi' && ECLAIR_ACTIF) { planifierEclair(); }
}

/* ============================================================
   STEAMPUNK : ROUAGES
   Une "chaîne" = des rouages qui s'engrènent les uns dans les autres.
   x, y   : position du 1er rouage (fraction de l'écran : 0 = bord gauche/haut, 1 = bord droit/bas)
   gears  : liste des rouages. n = nombre de dents (taille).
            ang = direction du rouage précédent vers celui-ci, en degrés
            (0 = vers la droite, 90 = vers le bas, 180 = gauche, -90 = haut)
   sens   : 1 = le 1er rouage tourne dans le sens horaire, -1 = antihoraire
   mode   : 'continu' (rotation lente)  t = secondes pour un tour du 1er rouage
            'oscille' (va-et-vient)     amp = amplitude en degrés du 1er, d = secondes par aller
            'coups'   (à-coups)         tick = secondes entre deux claquements d'une dent
   ============================================================ */
var ROUAGES_ACTIF = true;

var ROUAGES_CHAINES = [
  { prof: 0.0, x: 0.92, y: 0.20, mode: 'continu', t: 200, sens: 1,
    gears: [{ n: 30 }, { n: 12, ang: 150 }] },
  { prof: 0.1, x: 0.05, y: 0.82, mode: 'oscille', d: 12, amp: 25, sens: -1,
    gears: [{ n: 26 }, { n: 10, ang: -50 }, { n: 8, ang: -110 }] },
  { prof: 0.4, x: 0.08, y: 0.18, mode: 'continu', t: 70, sens: 1,
    gears: [{ n: 12 }, { n: 8, ang: 35 }, { n: 10, ang: -10 }] },
  { prof: 0.6, x: 0.90, y: 0.65, mode: 'coups', tick: 1.3, sens: -1,
    gears: [{ n: 10 }, { n: 14, ang: 170 }] },
  { prof: 0.8, x: 0.45, y: 0.93, mode: 'oscille', d: 8, amp: 45, sens: 1,
    gears: [{ n: 9 }, { n: 8, ang: -150 }] },
  { prof: 1.0, x: 0.22, y: 0.42, mode: 'coups', tick: 1, sens: 1,
    gears: [{ n: 9 }, { n: 8, ang: 55 }] }
];

function modPositif(a, b) { return ((a % b) + b) % b; }

/* Dessine un rouage en silhouette pleine (dents + ouvertures entre les bras). couleur = remplissage */
function svgRouage(n, m, off, couleur, contour) {
  var r = n * m / 2, ro = r + m, rr = r - 1.25 * m;
  var S = Math.ceil(2 * ro + 8), c = S / 2, p = 360 / n;
  function pt(rayon, deg) {
    var a = deg * Math.PI / 180;
    return (c + rayon * Math.cos(a)).toFixed(1) + ',' + (c + rayon * Math.sin(a)).toFixed(1);
  }
  /* Contour avec les dents */
  var d = '';
  for (var k = 0; k < n; k++) {
    var ct = off + k * p;
    d += (k === 0 ? 'M' : 'L') + pt(rr, ct - 0.30 * p) + ' L' + pt(ro, ct - 0.14 * p) + ' L' + pt(ro, ct + 0.14 * p) + ' L' + pt(rr, ct + 0.30 * p);
    d += ' A' + rr.toFixed(1) + ' ' + rr.toFixed(1) + ' 0 0 1 ' + pt(rr, ct + 0.70 * p) + ' ';
  }
  d += 'Z ';

  /* Ouvertures entre les bras (évidements) */
  var nbBras = (n >= 20) ? 6 : 5;
  var pasBras = 360 / nbBras;
  var rh = Math.max(m * 1.6, rr * 0.16) * 1.35;   /* rayon intérieur : autour du moyeu */
  var rw = rr * 0.78 * 0.9;                        /* rayon extérieur : sous l'anneau */
  var delta = (m * 0.9 / ((rh + rw) / 2)) * 180 / Math.PI;
  if (rw > rh + m) {
    for (var b = 0; b < nbBras; b++) {
      var a1 = off + b * pasBras + delta, a2 = off + (b + 1) * pasBras - delta;
      d += 'M' + pt(rh, a1) + ' L' + pt(rw, a1) + ' A' + rw.toFixed(1) + ' ' + rw.toFixed(1) + ' 0 0 1 ' + pt(rw, a2) +
           ' L' + pt(rh, a2) + ' A' + rh.toFixed(1) + ' ' + rh.toFixed(1) + ' 0 0 0 ' + pt(rh, a1) + ' Z ';
    }
  }
  /* Trou d'axe */
  var ra = Math.max(m * 0.5, rh * 0.3);
  d += 'M' + (c + ra).toFixed(1) + ',' + c + ' A' + ra.toFixed(1) + ' ' + ra.toFixed(1) + ' 0 1 0 ' + (c - ra).toFixed(1) + ',' + c +
       ' A' + ra.toFixed(1) + ' ' + ra.toFixed(1) + ' 0 1 0 ' + (c + ra).toFixed(1) + ',' + c + ' Z';

  var svg = '<svg width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" style="display:block">';
  svg += '<path d="' + d + '" fill="' + couleur + '" fill-rule="evenodd"' + (contour ? ' stroke="' + contour + '" stroke-width="1.2"' : '') + '/>';
  svg += '</svg>';
  return { svg: svg, taille: S };
}

var themeRouagesCourant = null;
var ROUAGES_PAGE_PX = [20, 40];
var ROUAGES_SCROLL_AMP = [50, 180];
var ROUAGES_SCROLL_ECHELLE = 500;
var plansRouages = [];
var indexPageRouages = 0;

function majRouagesParallaxe() {
  if (plansRouages.length === 0) { return; }
  var sy = window.pageYOffset || 0;
  var sat = 1 - Math.exp(-sy / ROUAGES_SCROLL_ECHELLE);
  for (var i = 0; i < plansRouages.length; i++) {
    var pl = plansRouages[i];
    var x = -indexPageRouages * (ROUAGES_PAGE_PX[0] + (ROUAGES_PAGE_PX[1] - ROUAGES_PAGE_PX[0]) * pl.prof);
    var y = -sat * (ROUAGES_SCROLL_AMP[0] + (ROUAGES_SCROLL_AMP[1] - ROUAGES_SCROLL_AMP[0]) * pl.prof);
    appliquerTransformFond(pl.ext, x, 0);
    appliquerTransformFond(pl.int, 0, y);
  }
}

/* Steampunk : piston relié à un rouage par une bielle (cinématique exacte : x = r·cosθ + √(L² − r²·sin²θ)) */
var PISTON_ACTIF = true;
var PISTON_STEAMPUNK = { prof: 0.5, x: 0.02, y: 0.6, n: 12, T: 7, sens: 1 };   /* x, y : position du rouage (fraction de l'écran) ; T : secondes par tour */

function htmlPistonSteampunk(W, H, m) {
  var P = PISTON_STEAMPUNK;
  var mc = m * (0.8 + 0.5 * P.prof), Rg = P.n * mc / 2;
  var rp = Rg * 0.5, L = Rg * 2.5, hw = Rg * 0.55, hh = Rg * 0.62;
  var cx = P.x * W, cy = P.y * H;
  var couleur = interpolerCouleur('#3A2A14', '#6A4E24', P.prof);
  var clair = interpolerCouleur('#4A3718', '#86652C', P.prof);
  var gear = svgRouage(P.n, mc, 0, couleur, 'rgba(232,192,106,.32)');

  var N = 36, kb = '', kp = '';
  for (var i = 0; i <= N; i++) {
    var th = P.sens * 2 * Math.PI * i / N;
    var px = rp * Math.cos(th), py = rp * Math.sin(th);
    var xp = px + Math.sqrt(L * L - py * py);
    var phi = Math.atan2(-py, xp - px) * 180 / Math.PI;
    var pc = (i / N * 100).toFixed(3) + '%';
    kb += pc + '{transform:translate(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px) rotate(' + phi.toFixed(2) + 'deg)}';
    kp += pc + '{transform:translateX(' + xp.toFixed(2) + 'px)}';
  }
  var st = document.getElementById('sp-piston-style');
  if (!st) { st = document.createElement('style'); st.id = 'sp-piston-style'; document.head.appendChild(st); }
  st.textContent = '@keyframes spBielle{' + kb + '}@keyframes spPiston{' + kp + '}';

  var x0 = L - rp - 10, x1 = L + rp + hw + 16, hc = hh + 14;
  var carter = '<div class="sp-piston-carter" style="left:' + (cx + x0).toFixed(1) + 'px;top:' + (cy - hc / 2).toFixed(1) + 'px;width:' + (x1 - x0).toFixed(1) + 'px;height:' + hc.toFixed(1) + 'px;background:' + clair + ';"></div>';
  var rouage = '<div class="rouage rouage-continu" style="left:' + (cx - gear.taille / 2).toFixed(1) + 'px;top:' + (cy - gear.taille / 2).toFixed(1) + 'px;width:' + gear.taille + 'px;height:' + gear.taille + 'px;animation-duration:' + P.T + 's;--tour:' + (P.sens * 360) + 'deg;">' + gear.svg + '</div>';
  var tete = '<div class="sp-tete" style="left:' + cx.toFixed(1) + 'px;top:' + (cy - hh / 2).toFixed(1) + 'px;width:' + hw.toFixed(1) + 'px;height:' + hh.toFixed(1) + 'px;background-color:' + clair + ';animation-duration:' + P.T + 's;"></div>';
  var bielle = '<div class="sp-bielle" style="left:' + cx.toFixed(1) + 'px;top:' + (cy - 3.5).toFixed(1) + 'px;width:' + L.toFixed(1) + 'px;background:' + clair + ';animation-duration:' + P.T + 's;"></div>';
  return '<div class="rouage-plan" data-prof="' + P.prof + '"><div class="rouage-plan-scroll">' + carter + rouage + tete + bielle + '</div></div>';
}
function construireRouages() {
  var zone = document.getElementById('rouages-theme');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'rouages-theme';
    zone.className = 'rouages-theme';
    document.body.appendChild(zone);
  }
  var W = window.innerWidth, H = window.innerHeight;
  var m = Math.max(7, Math.min(11, W / 44));   /* taille des dents */
  var MARGE = 260;                             /* marge pour la parallaxe */
  var html = '';
  var pistonFait = false;

  /* Piston : isolé, une erreur ici ne casse jamais le reste du thème */
  function ajouterPiston() {
    if (pistonFait) { return ''; }
    pistonFait = true;
    if (typeof PISTON_ACTIF === 'undefined' || !PISTON_ACTIF || typeof htmlPistonSteampunk !== 'function') { return ''; }
    try { return htmlPistonSteampunk(W, H, m); } catch (erreur) { console.error('Piston ignoré :', erreur); return ''; }
  }

  for (var c = 0; c < ROUAGES_CHAINES.length; c++) {
    var chaine = ROUAGES_CHAINES[c];
    if (!pistonFait && typeof PISTON_STEAMPUNK !== 'undefined' && chaine.prof > PISTON_STEAMPUNK.prof) { html += ajouterPiston(); }

    var n0 = chaine.gears[0].n;
    var mc = m * (0.8 + 0.5 * chaine.prof);
    var couleur = interpolerCouleur('#3A2A14', '#6A4E24', chaine.prof);
    var contour = (chaine.prof > 0.45) ? 'rgba(232,192,106,.32)' : '';
    var prec = null;
    var htmlChaine = '';

    for (var g = 0; g < chaine.gears.length; g++) {
      var n = chaine.gears[g].n;
      var r = n * mc / 2;
      var p = 360 / n;
      var cx, cy, off;

      if (!prec) {
        cx = chaine.x * W; cy = chaine.y * H; off = 0;
      } else {
        var phi = chaine.gears[g].ang || 0;
        var rad = phi * Math.PI / 180;
        cx = prec.cx + (prec.r + r) * Math.cos(rad);
        cy = prec.cy + (prec.r + r) * Math.sin(rad);
        var u = modPositif(phi - prec.off, prec.p);
        off = modPositif(phi + 180 + u * prec.n / n + p / 2, p);
      }

      var sens = chaine.sens * (g % 2 === 0 ? 1 : -1);
      var classe = 'rouage rouage-' + chaine.mode;
      var anim = '';
      if (chaine.mode === 'continu') {
        anim = 'animation-duration:' + (chaine.t * n / n0).toFixed(1) + 's;--tour:' + (sens * 360) + 'deg;';
      } else if (chaine.mode === 'oscille') {
        var amp = chaine.amp * n0 / n;
        anim = 'animation-duration:' + chaine.d + 's;--a0:' + (-sens * amp).toFixed(1) + 'deg;--a1:' + (sens * amp).toFixed(1) + 'deg;';
      } else {
        anim = 'animation-duration:' + (chaine.tick * n).toFixed(1) + 's;animation-timing-function:steps(' + n + ',end);--tour:' + (sens * 360) + 'deg;';
      }

      var dessin = svgRouage(n, mc, off, couleur, contour);
      if (cx + r + mc + MARGE > 0 && cx - r - mc - MARGE < W && cy + r + mc + MARGE > 0 && cy - r - mc - MARGE < H) {
        htmlChaine += '<div class="' + classe + '" style="left:' + (cx - dessin.taille / 2).toFixed(1) + 'px;top:' + (cy - dessin.taille / 2).toFixed(1) + 'px;width:' + dessin.taille + 'px;height:' + dessin.taille + 'px;' + anim + '">' + dessin.svg + '</div>';
      }

      prec = { cx: cx, cy: cy, r: r, n: n, p: p, off: off };
    }
    html += '<div class="rouage-plan" data-prof="' + chaine.prof + '"><div class="rouage-plan-scroll">' + htmlChaine + '</div></div>';
  }
  html += ajouterPiston();   /* si aucune chaîne n'est plus proche que lui, il passe au premier plan */
  zone.innerHTML = html;

  plansRouages = [];
  var exts = zone.querySelectorAll('.rouage-plan');
  for (var e = 0; e < exts.length; e++) {
    plansRouages.push({
      ext: exts[e],
      int: exts[e].firstChild,
      prof: parseFloat(exts[e].getAttribute('data-prof')) || 0
    });
  }
  majRouagesParallaxe();
}

function majRouages(theme) {
  var actif = ROUAGES_ACTIF && theme === 'steampunk';
  var zone = document.getElementById('rouages-theme');
  if (!actif) {
    if (zone) { zone.innerHTML = ''; }
    themeRouagesCourant = null;
    return;
  }
  if (themeRouagesCourant === theme) { return; }
  themeRouagesCourant = theme;
  construireRouages();
}

var minuteurRedimRouages = null;
window.addEventListener('resize', function () {
  if (themeRouagesCourant !== 'steampunk') { return; }
  if (minuteurRedimRouages) { window.clearTimeout(minuteurRedimRouages); }
  minuteurRedimRouages = window.setTimeout(construireRouages, 300);
}, false);

/* ============================================================
   WASTELAND : explosions de caisses de nitro, hors champ, à intervalle aléatoire.
   Comme dans Crash : flash vert, boule de feu, onde de choc, éclats de caisse,
   et réactions en chaîne (une caisse fait exploser ses voisines).
   ============================================================ */
var NITRO_ACTIF = true;
var NITRO_DELAI = [6, 18];    /* secondes entre deux explosions (min, max) */
var minuteurNitro = null;
var zoneNitro = null;

function creerZoneNitro() {
  if (zoneNitro) { return; }
  zoneNitro = document.createElement('div');
  zoneNitro.className = 'nitro-zone';
  document.body.appendChild(zoneNitro);
}

function lancerExplosionNitro(x, y, R) {
  creerZoneNitro();
  var W = window.innerWidth, H = window.innerHeight;
  var base = Math.atan2(H / 2 - y, W / 2 - x);   /* direction vers l'écran : tout part de ce côté */
  var h = '';
  var i, ang, dist, tx, ty, s, dur, ox, oy;

  function ctr(taille) { return 'margin:-' + (taille / 2).toFixed(0) + 'px 0 0 -' + (taille / 2).toFixed(0) + 'px;'; }

  h += '<span class="nx nx-flash" style="width:' + (R * 3).toFixed(0) + 'px;height:' + (R * 3).toFixed(0) + 'px;' + ctr(R * 3) + '"></span>';
  h += '<span class="nx nx-boule" style="width:' + (R * 1.3).toFixed(0) + 'px;height:' + (R * 1.3).toFixed(0) + 'px;' + ctr(R * 1.3) + '"></span>';
  h += '<span class="nx nx-onde" style="width:' + (R * 1.4).toFixed(0) + 'px;height:' + (R * 1.4).toFixed(0) + 'px;' + ctr(R * 1.4) + '"></span>';

  /* Éclats : planches vertes et bois, projetés vers l'écran puis retombant */
  var couleurs = ['#8BD21A', '#6DAF12', '#C79A5A', '#5B3A1A', '#A8E02A'];
  for (i = 0; i < 6; i++) {
    ang = base + alea(-1.1, 1.1);
    dist = alea(0.5, 1.9) * R;
    tx = Math.cos(ang) * dist;
    ty = Math.sin(ang) * dist + alea(40, 120);
    h += '<span class="nx nx-debris" style="width:' + alea(6, 14).toFixed(0) + 'px;height:' + alea(4, 8).toFixed(0) + 'px;background:' + couleurs[Math.floor(Math.random() * couleurs.length)] + ';' +
      'animation-duration:' + alea(0.9, 1.5).toFixed(2) + 's;animation-delay:' + alea(0.02, 0.1).toFixed(2) + 's;' +
      '--mx:' + (tx * 0.55).toFixed(0) + 'px;--my:' + (Math.sin(ang) * dist * 0.55 - alea(20, 60)).toFixed(0) + 'px;' +
      '--tx:' + tx.toFixed(0) + 'px;--ty:' + ty.toFixed(0) + 'px;--rot:' + alea(-540, 540).toFixed(0) + 'deg;"></span>';
  }

  /* Fumée qui monte après l'explosion */
  for (i = 0; i < 4; i++) {
    s = alea(0.7, 1.2) * R;
    ang = base + alea(-0.8, 0.8);
    dist = alea(0.2, 0.8) * R;
    ox = Math.cos(ang) * dist - s / 2;
    oy = Math.sin(ang) * dist - s / 2;
    dur = alea(1.8, 2.8);
    h += '<span class="nx nx-fumee" style="width:' + s.toFixed(0) + 'px;height:' + s.toFixed(0) + 'px;margin:' + oy.toFixed(0) + 'px 0 0 ' + ox.toFixed(0) + 'px;' +
      'animation-duration:' + dur.toFixed(2) + 's;animation-delay:' + alea(0.15, 0.4).toFixed(2) + 's;--ty:-' + alea(80, 200).toFixed(0) + 'px;"></span>';
  }

  var el = document.createElement('div');
  el.className = 'nx-expl';
  el.style.left = x.toFixed(0) + 'px';
  el.style.top = y.toFixed(0) + 'px';
  el.innerHTML = h;
  zoneNitro.appendChild(el);
  window.setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, 3600);
}

function declencherNitro() {
  minuteurNitro = null;
  if ((etat.profil.theme || 'sombre') !== 'wasteland' || !NITRO_ACTIF) { return; }
  if (!document.hidden) {
    var W = window.innerWidth, H = window.innerHeight;
    var tirage = Math.random();
    var vertical = (tirage >= 0.8);                      /* 80 % : sur les côtés, 20 % : sous l'écran */
    var x0, y0, dx = 0, dy = 0;
    if (tirage < 0.4) { x0 = -alea(10, 70); y0 = alea(0.25, 0.9) * H; dy = alea(50, 110) * (Math.random() < 0.5 ? 1 : -1); }
    else if (!vertical) { x0 = W + alea(10, 70); y0 = alea(0.25, 0.9) * H; dy = alea(50, 110) * (Math.random() < 0.5 ? 1 : -1); }
    else { x0 = alea(0.1, 0.9) * W; y0 = H + alea(10, 60); dx = alea(60, 120) * (Math.random() < 0.5 ? 1 : -1); }

    /* Une caisse seule, ou une réaction en chaîne de 2 à 4 */
    var nb = Math.random() < 0.45 ? 1 : 2 + Math.floor(Math.random() * 3);
    var delai = 0;
    for (var k = 0; k < nb; k++) {
      (function (px, py, R, d) {
        window.setTimeout(function () {
          if ((etat.profil.theme || 'sombre') === 'wasteland') { lancerExplosionNitro(px, py, R); }
        }, d);
      })(x0 + dx * k, y0 + dy * k, alea(170, 270) * alea(0.85, 1.15), delai);
      delai += alea(160, 340);
    }
  }
  planifierNitro();
}

function planifierNitro() {
  if (minuteurNitro) { window.clearTimeout(minuteurNitro); }
  minuteurNitro = window.setTimeout(declencherNitro, alea(NITRO_DELAI[0], NITRO_DELAI[1]) * 1000);
}

function majNitro(theme) {
  if (minuteurNitro) { window.clearTimeout(minuteurNitro); minuteurNitro = null; }
  if (zoneNitro) { zoneNitro.innerHTML = ''; }
  if (theme === 'wasteland' && NITRO_ACTIF) { planifierNitro(); }
}

/* ============================================================
   EFFROI : esprits qui montent (silhouettes floues, apparitions aléatoires)
   3 formes : le hurleur, le capuchon au visage vide, le chœur de visages dans la brume
   ============================================================ */
var ESPRITS_ACTIFS = true;
var ESPRITS_DELAI = [7, 18];    /* secondes entre deux apparitions (min, max) */
var ESPRITS_MAX = 2;            /* nombre maximum d'esprits visibles en même temps */
var espritsImages = [];
var espritsEnCours = 0;
var minuteurEsprits = null;
var zoneEsprits = null;

function construireImagesEsprits() {
  if (espritsImages.length > 0) { return; }
  var defs = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#D8FFE6" stop-opacity=".95"/><stop offset=".55" stop-color="#A9B8FF" stop-opacity=".6"/><stop offset="1" stop-color="#7B2FF7" stop-opacity="0"/></linearGradient>' +
    '<filter id="f" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>';
  var trou = '#05020A';

  /* 1. Le hurleur */
  var hurleur = '<path d="M30 48C22 80 28 120 18 170C14 195 22 210 30 224C34 205 40 218 46 200C50 220 58 204 62 218C70 204 74 184 70 150C78 110 78 80 70 48Z" fill="url(#g)"/>' +
    '<ellipse cx="50" cy="38" rx="17" ry="25" fill="url(#g)"/>' +
    '<path d="M33 72C10 62 6 36 14 8M67 72C90 60 96 34 86 6" fill="none" stroke="#C9F5DB" stroke-opacity=".55" stroke-width="3.2" stroke-linecap="round"/>' +
    '<ellipse cx="42" cy="34" rx="4" ry="10" fill="' + trou + '"/><ellipse cx="58" cy="34" rx="4" ry="10" fill="' + trou + '"/>' +
    '<ellipse cx="50" cy="60" rx="6.5" ry="15" fill="' + trou + '"/>';

  /* 2. Le capuchon */
  var capuchon = '<path d="M50 8C28 10 22 34 26 54C16 90 20 150 8 200C20 190 26 215 38 196C46 222 56 200 62 218C72 196 82 206 92 198C80 150 84 90 74 54C78 34 72 10 50 8Z" fill="url(#g)"/>' +
    '<path d="M27 72C12 112 18 156 10 214M73 72C88 112 82 156 90 214" fill="none" stroke="#C9F5DB" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>' +
    '<ellipse cx="50" cy="38" rx="13" ry="21" fill="' + trou + '"/>' +
    '<circle cx="44" cy="34" r="1.9" fill="#EFFFF4"/><circle cx="56" cy="34" r="1.9" fill="#EFFFF4"/>';

  /* 3. Le chœur */
  function visage(x, y, k) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (9 * k) + '" ry="' + (13 * k) + '" fill="#D8FFE6" fill-opacity=".85"/>' +
      '<ellipse cx="' + (x - 3.4 * k) + '" cy="' + (y - 3 * k) + '" rx="' + (2.1 * k) + '" ry="' + (4.6 * k) + '" fill="' + trou + '"/>' +
      '<ellipse cx="' + (x + 3.4 * k) + '" cy="' + (y - 3 * k) + '" rx="' + (2.1 * k) + '" ry="' + (4.6 * k) + '" fill="' + trou + '"/>' +
      '<ellipse cx="' + x + '" cy="' + (y + 6 * k) + '" rx="' + (3 * k) + '" ry="' + (7 * k) + '" fill="' + trou + '"/>';
  }
  var choeur = '<ellipse cx="50" cy="60" rx="40" ry="34" fill="url(#g)" opacity=".55"/><ellipse cx="46" cy="120" rx="34" ry="42" fill="url(#g)" opacity=".5"/><ellipse cx="56" cy="180" rx="38" ry="34" fill="url(#g)" opacity=".4"/>' +
    visage(32, 46, 1) + visage(66, 82, 1.25) + visage(40, 128, 0.9) + visage(64, 170, 0.8);

  /* 4. La tordue : cou démesuré, tête penchée à l'extrême, bras qui rampent vers le bas */
  var tordue = '<path d="M46 232C38 190 54 152 44 114C38 86 56 70 62 52" fill="none" stroke="url(#g)" stroke-width="22" stroke-linecap="round"/>' +
    '<ellipse cx="64" cy="34" rx="14" ry="21" transform="rotate(34 64 34)" fill="url(#g)"/>' +
    '<path d="M44 114C26 140 14 170 10 206M46 120C66 150 80 180 86 214" fill="none" stroke="#C9F5DB" stroke-opacity=".5" stroke-width="3.4" stroke-linecap="round"/>' +
    '<ellipse cx="58" cy="30" rx="3.4" ry="8" transform="rotate(34 58 30)" fill="' + trou + '"/><ellipse cx="70" cy="34" rx="3.4" ry="8" transform="rotate(34 70 34)" fill="' + trou + '"/>' +
    '<ellipse cx="68" cy="49" rx="4.4" ry="11" transform="rotate(34 68 49)" fill="' + trou + '"/>';

  var formes = [hurleur, capuchon, choeur, tordue];
  for (var i = 0; i < formes.length; i++) {
    for (var m = 0; m < 2; m++) {   /* version normale puis inversée */
      var corps = (m === 0) ? formes[i] : '<g transform="translate(100 0) scale(-1 1)">' + formes[i] + '</g>';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="230" viewBox="0 0 100 230">' + defs + '<g filter="url(#f)">' + corps + '</g></svg>';
      espritsImages.push('data:image/svg+xml,' + encodeURIComponent(svg));
    }
  }
}

var espritsActifs = [];
var espritsObjets = [];
var espritsBoucle = false;
var espritsDernier = 0;

function imageEsprit(index) {
  if (!espritsObjets[index]) {
    var im = new Image();
    im.src = espritsImages[index];
    espritsObjets[index] = im;
  }
  return espritsObjets[index];
}

/* Dessine chaque esprit ligne par ligne : la ligne à la distance f derrière la tête reprend
   la position qu'avait la tête un instant plus tôt (le corps suit le chemin de la tête). */
function dessinerEsprits(temps) {
  if (espritsActifs.length === 0 || document.hidden) { espritsBoucle = false; return; }
  window.requestAnimationFrame(dessinerEsprits);
  if (temps - espritsDernier < 50) { return; }   /* 20 images par seconde */
  espritsDernier = temps;
  for (var k = 0; k < espritsActifs.length; k++) {
    var e = espritsActifs[k];
    if (!e.img.complete || !e.img.naturalWidth) { continue; }
    e.ctx.clearRect(0, 0, 160, 230);
    var phase = (temps / 1000 / e.T) * 6.2832;
    for (var y = 0; y < 230; y += 4) {
      var f = y / 230;                                   /* 0 = tête, 1 = queue */
      var arg = phase - f * e.cycles * 6.2832;
      var dx = e.amp * (0.7 + 0.3 * f) * (Math.sin(arg) + 0.3 * Math.sin(arg * 1.7 + e.dep));
      e.ctx.drawImage(e.img, 0, y, 100, 4, 30 + dx, y, 100, 4);
    }
  }
}

function demarrerBoucleEsprits() {
  if (espritsBoucle) { return; }
  espritsBoucle = true;
  window.requestAnimationFrame(dessinerEsprits);
}

document.addEventListener('visibilitychange', function () {
  if (!document.hidden && espritsActifs.length > 0) { demarrerBoucleEsprits(); }
});

function lancerEsprit() {
  if (!zoneEsprits) {
    zoneEsprits = document.createElement('div');
    zoneEsprits.className = 'esprits-zone';
    document.body.appendChild(zoneEsprits);
  }
  construireImagesEsprits();

  var W = window.innerWidth, H = window.innerHeight;
  var larg = alea(100, 190);
  var haut = larg * 2.3;
  var dur = alea(16, 28);
  var op = alea(0.14, 0.28);
  var gauche = alea(0.05, 0.8) * W - larg * 0.3;
  var index = Math.floor(Math.random() * espritsImages.length);

  var ext = document.createElement('div');
  ext.className = 'esp';
  ext.style.cssText = 'left:' + gauche.toFixed(0) + 'px;width:' + (larg * 1.6).toFixed(0) + 'px;height:' + haut.toFixed(0) + 'px;' +
    'animation-duration:' + dur.toFixed(1) + 's;--fin:-' + (H + haut * 1.3).toFixed(0) + 'px;' +
    '--op:' + op.toFixed(2) + ';--op2:' + Math.min(0.55, op * 2.2).toFixed(2) + ';';

  var cv = document.createElement('canvas');
  cv.width = 160; cv.height = 230;
  cv.className = 'esp-corps';
  cv.style.cssText = 'width:100%;height:100%;display:block;animation-duration:' + dur.toFixed(1) + 's;';
  ext.appendChild(cv);
  zoneEsprits.appendChild(ext);

  var objet = {
    ctx: cv.getContext('2d'),
    img: imageEsprit(index),
    T: alea(3.2, 5.5),          /* durée d'un cycle du serpentement (s) */
    cycles: alea(1.1, 1.8),     /* nombre d'ondulations sur la longueur du corps */
    amp: alea(12, 22),          /* amplitude des ondulations */
    dep: alea(0, 6.28)
  };
  espritsActifs.push(objet);
  demarrerBoucleEsprits();

  espritsEnCours++;
  window.setTimeout(function () {
    if (ext.parentNode) { ext.parentNode.removeChild(ext); }
    var p = espritsActifs.indexOf(objet);
    if (p !== -1) { espritsActifs.splice(p, 1); }
    espritsEnCours--;
  }, dur * 1000 + 400);
}

function declencherEsprit() {
  minuteurEsprits = null;
  if ((etat.profil.theme || 'sombre') !== 'effroi' || !ESPRITS_ACTIFS) { return; }
  if (!document.hidden && espritsEnCours < ESPRITS_MAX) { lancerEsprit(); }
  planifierEsprit();
}

function planifierEsprit() {
  if (minuteurEsprits) { window.clearTimeout(minuteurEsprits); }
  minuteurEsprits = window.setTimeout(declencherEsprit, alea(ESPRITS_DELAI[0], ESPRITS_DELAI[1]) * 1000);
}

function majEsprits(theme) {
  if (minuteurEsprits) { window.clearTimeout(minuteurEsprits); minuteurEsprits = null; }
  if (zoneEsprits) { zoneEsprits.innerHTML = ''; espritsEnCours = 0; }
  if (theme === 'effroi' && ESPRITS_ACTIFS) { planifierEsprit(); }
}

/* ============================================================
   STEAMPUNK : machine en bois verni, laiton, verrières, tuyaux et vapeur
   Les décors sont dessinés UNE fois ici. Ensuite seuls des transform / opacity bougent.
   ============================================================ */
var decorSteampunkPret = false;

function uriSp(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }

/* Cadre de laiton à coins ornés (image 3 × 3 pour border-image). c = taille d'un coin en px */
function svgCadreLaiton(c) {
  function rail(x, y, w, h, l, d) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#B7832F"/>' +
      '<rect x="' + l[0] + '" y="' + l[1] + '" width="' + l[2] + '" height="' + l[3] + '" fill="#F3D58E"/>' +
      '<rect x="' + d[0] + '" y="' + d[1] + '" width="' + d[2] + '" height="' + d[3] + '" fill="#2B1807" fill-opacity=".55"/>';
  }
  var s = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + (3 * c) + '" height="' + (3 * c) + '" viewBox="0 0 108 108">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D58E"/><stop offset=".5" stop-color="#C9953A"/><stop offset="1" stop-color="#7A5518"/></linearGradient>' +
    '<g id="k">' +
      '<path d="M0,0 H36 V3.4 Q13,11 3.4,36 H0Z" fill="url(#g)" stroke="#2B1807" stroke-width=".7" stroke-linejoin="round"/>' +
      '<path d="M8,8.5 Q17,7 21,12.5 Q24,18.5 18.5,20.5" fill="none" stroke="#FFEFC0" stroke-opacity=".85" stroke-width="1.2" stroke-linecap="round"/>' +
      '<circle cx="6" cy="6" r="2.5" fill="#E8C06A" stroke="#2B1807" stroke-width=".7"/><circle cx="6" cy="6" r=".8" fill="#2B1807"/>' +
    '</g></defs>';
  s += rail(36, 0, 36, 3.4, [36, 0, 36, 1.1], [36, 3.4, 36, 1]);
  s += rail(36, 104.6, 36, 3.4, [36, 106.9, 36, 1.1], [36, 103.6, 36, 1]);
  s += rail(0, 36, 3.4, 36, [0, 36, 1.1, 36], [3.4, 36, 1, 36]);
  s += rail(104.6, 36, 3.4, 36, [106.9, 36, 1.1, 36], [103.6, 36, 1, 36]);
  s += '<use xlink:href="#k"/><use xlink:href="#k" transform="translate(108 0) scale(-1 1)"/>' +
       '<use xlink:href="#k" transform="translate(0 108) scale(1 -1)"/><use xlink:href="#k" transform="translate(108 108) scale(-1 -1)"/>';
  return s + '</svg>';
}

/* Acajou verni : veinage horizontal, sombre et peu contrasté (le texte reste lisible) */
function svgBoisVerni() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">' +
    '<filter id="a" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".006 .2" numOctaves="3" seed="8" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .09 0 0 0 0 .04 0 0 0 0 .012 1.5 0 0 0 -.5"/></filter>' +
    '<filter id="b" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".005 .16" numOctaves="2" seed="21" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .78 0 0 0 0 .5 0 0 0 0 .26 0 1.4 0 0 -.72"/></filter>' +
    '<rect width="240" height="240" fill="#4A2814"/>' +
    '<rect width="240" height="240" filter="url(#a)" opacity=".75"/>' +
    '<rect width="240" height="240" filter="url(#b)" opacity=".3"/></svg>';
}

/* Papier peint victorien : deux vignes sinueuses avec feuilles et vrilles (se répète sans raccord) */
function svgLiane() {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" fill="none" stroke-linecap="round">';
  var vignes = [{ x: 60, ph: 0 }, { x: 180, ph: Math.PI }];
  for (var v = 0; v < vignes.length; v++) {
    var V = vignes[v], pts = [], d = '', k;
    for (k = 0; k <= 24; k++) {
      var px = V.x + 18 * Math.sin(k / 24 * 6.2832 + V.ph);
      pts.push([px, k * 10]);
      d += (k === 0 ? 'M' : 'L') + px.toFixed(1) + ',' + (k * 10);
    }
    s += '<path d="' + d + '" stroke="#C9953A" stroke-opacity=".17" stroke-width="1.8" stroke-linejoin="round"/>';
    for (var f = 0; f < 6; f++) {
      var p = pts[2 + f * 4], cote = (f % 2 === 0) ? 1 : -1;
      s += '<path transform="translate(' + p[0].toFixed(1) + ' ' + p[1] + ') rotate(' + (cote === 1 ? -25 : 205) + ')" d="M0,0 Q9,-6 19,0 Q9,6 0,0Z" fill="#C9953A" fill-opacity=".13"/>';
      if (f % 3 === 1) {
        s += '<path d="M' + p[0].toFixed(1) + ',' + p[1] + ' q' + (cote * 11) + ',-3 ' + (cote * 13) + ',7 q' + (-cote) + ',8 ' + (-cote * 7) + ',7" stroke="#C9953A" stroke-opacity=".17" stroke-width="1.3"/>';
      }
    }
  }
  return s + '</svg>';
}

/* Tuyau de laiton vertical, avec deux brides rivetées par motif */
function svgTuyau() {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="240" viewBox="0 0 12 240">' +
    '<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A1706"/><stop offset=".22" stop-color="#B7832F"/><stop offset=".38" stop-color="#F3D58E"/><stop offset=".62" stop-color="#C9953A"/><stop offset="1" stop-color="#3A2208"/></linearGradient></defs>' +
    '<rect x="1.5" y="0" width="9" height="240" fill="url(#t)"/>';
  var ys = [60, 180];
  for (var i = 0; i < ys.length; i++) {
    s += '<rect x="0" y="' + ys[i] + '" width="12" height="10" rx="1.5" fill="url(#t)" stroke="#2B1807" stroke-width=".8"/>' +
      '<rect x="0" y="' + (ys[i] + 10) + '" width="12" height="3" fill="#000" fill-opacity=".35"/>' +
      '<circle cx="3" cy="' + (ys[i] + 5) + '" r="1" fill="#2B1807"/><circle cx="9" cy="' + (ys[i] + 5) + '" r="1" fill="#2B1807"/>';
  }
  return s + '</svg>';
}

/* Fleuron sous les titres : arabesques, feuille et petite gemme verte */
function svgFleuron() {
  var moitie = '<path d="M6,5 H54 Q61,5 64,2.2 Q67,-.3 70,2.4 Q72,5.4 68.5,6.6" fill="none" stroke="#C9953A" stroke-width="1" stroke-linecap="round"/>' +
    '<path d="M30,5 Q34,1 40,2.6 Q36,6 30,5Z" fill="#C9953A" fill-opacity=".75"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="10" viewBox="0 0 160 10">' + moitie +
    '<g transform="translate(160 0) scale(-1 1)">' + moitie + '</g>' +
    '<path d="M80,.8 L84.5,5 L80,9.2 L75.5,5Z" fill="#E8C06A" stroke="#2B1807" stroke-width=".6"/><circle cx="80" cy="5" r="1.3" fill="#4DE39A"/></svg>';
}

function construireDecorSteampunk() {
  if (decorSteampunkPret) { return; }
  decorSteampunkPret = true;
  var r = document.documentElement.style;
  r.setProperty('--sp-cadre', uriSp(svgCadreLaiton(28)));
  r.setProperty('--sp-cadre-s', uriSp(svgCadreLaiton(20)));
  r.setProperty('--sp-bois', uriSp(svgBoisVerni()));
  r.setProperty('--sp-liane', uriSp(svgLiane()));
  r.setProperty('--sp-tuyau', uriSp(svgTuyau()));
  r.setProperty('--sp-fleuron', uriSp(svgFleuron()));
  var mini = svgRouage(12, 4.2, 0, '#5A421E', 'rgba(232,192,106,.4)').svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  r.setProperty('--sp-rouage-mini', uriSp(mini));
}

/* Tuyaux fixes dans les gouttières, avec deux soupapes qui lâchent de la vapeur */
function majSteampunk(theme) {
  var tuyaux = document.getElementById('sp-tuyaux');
  var valves = document.getElementById('sp-valves');
  if (theme !== 'steampunk') {
    if (tuyaux) { tuyaux.innerHTML = ''; }
    if (valves) { valves.innerHTML = ''; }
    return;
  }
  construireDecorSteampunk();
  if (!tuyaux) { tuyaux = document.createElement('div'); tuyaux.id = 'sp-tuyaux'; tuyaux.className = 'sp-tuyaux'; document.body.appendChild(tuyaux); }
  if (!valves) { valves = document.createElement('div'); valves.id = 'sp-valves'; valves.className = 'sp-valves'; document.body.appendChild(valves); }
  var H = window.innerHeight;
  function valve(cote, y, delai) {
    return '<span class="sp-soupape sp-soupape-' + cote + '" style="top:' + Math.round(y) + 'px;">' +
      '<i class="sp-puff" style="animation-delay:-' + delai + 's;"></i><i class="sp-puff" style="animation-delay:-' + (delai + 3.5) + 's;"></i></span>';
  }
  tuyaux.innerHTML = '<span class="sp-tuyau sp-tuyau-g"></span><span class="sp-tuyau sp-tuyau-d"></span>';
  valves.innerHTML = valve('g', H * 0.30, 0) + valve('d', H * 0.66, 2);
}

/* Séance prévue : verrière avec un orbe-générateur vert, deux anneaux à graduations et de la vapeur */
/* Orbe et anneaux : rangés DANS le conteneur de l'icône, donc toujours centrés dessus */
function htmlOrbeSteampunk() {
  var ext = '<svg viewBox="0 0 112 112"><circle cx="56" cy="56" r="54" fill="none" stroke="#C9953A" stroke-opacity=".7" stroke-width="1.2"/>';
  for (var t = 0; t < 24; t++) {
    var a = t * 15 * Math.PI / 180;
    ext += '<line x1="' + (56 + Math.cos(a) * 48.5).toFixed(1) + '" y1="' + (56 + Math.sin(a) * 48.5).toFixed(1) + '" x2="' + (56 + Math.cos(a) * 53.5).toFixed(1) + '" y2="' + (56 + Math.sin(a) * 53.5).toFixed(1) + '" stroke="#F0CE80" stroke-opacity=".75" stroke-width="' + (t % 6 === 0 ? 2 : 1) + '"/>';
  }
  ext += '</svg>';
  var inte = '<svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="40" fill="none" stroke="#4DE39A" stroke-opacity=".7" stroke-width="1.8" stroke-dasharray="12 7"/></svg>';
  return '<span class="sp-orbe"></span><span class="sp-anneau">' + ext + '</span><span class="sp-anneau-b">' + inte + '</span>';
}

/* Vapeur et étincelles : positions en pourcentage de la carte */
function genererSceneSteampunk() {
  var h = '<div class="particules">', i, dur;
  for (i = 0; i < 3; i++) {
    dur = alea(6, 10);
    h += '<span class="sp-vapeur" style="left:' + alea(8, 92).toFixed(0) + '%;top:' + alea(65, 100).toFixed(0) + '%;animation-duration:' + dur.toFixed(1) + 's;animation-delay:-' + (Math.random() * dur).toFixed(1) + 's;"></span>';
  }
  for (i = 0; i < 5; i++) {
    dur = alea(2.5, 5);
    h += '<span class="sp-etincelle" style="left:' + alea(2, 40).toFixed(0) + '%;top:' + alea(20, 75).toFixed(0) + '%;animation-duration:' + dur.toFixed(1) + 's;animation-delay:-' + (Math.random() * dur).toFixed(1) + 's;"></span>';
  }
  return h + '</div>';
}

/* Manomètre de séance : l'aiguille suit le nombre de séries validées (ressort à l'arrivée) */
function svgJaugeSeance() {
  function pt(r, deg) { var a = deg * Math.PI / 180; return [28 + r * Math.sin(a), 28 - r * Math.cos(a)]; }
  var s = '<svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="28" cy="28" r="26" fill="#B7832F" stroke="#2B1807" stroke-width="1"/>' +
    '<path d="M6,18 A24,24 0 0 1 20,5" fill="none" stroke="#FFEFC0" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>' +
    '<circle cx="28" cy="28" r="22.5" fill="#06100B" stroke="#2B1807" stroke-width="1"/>';
  var v0 = pt(18, 27), v1 = pt(18, 135);
  s += '<path d="M' + v0[0].toFixed(1) + ',' + v0[1].toFixed(1) + ' A18,18 0 0 1 ' + v1[0].toFixed(1) + ',' + v1[1].toFixed(1) + '" fill="none" stroke="#4DE39A" stroke-width="2.6" stroke-opacity=".9"/>';
  for (var t = 0; t <= 10; t++) {
    var deg = -135 + t * 27, p = pt(21, deg), q = pt(t % 5 === 0 ? 15.5 : 17.5, deg);
    s += '<line x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" stroke="#F0CE80" stroke-width="' + (t % 5 === 0 ? 1.5 : .8) + '"/>';
  }
  for (var k = 0; k < 4; k++) {
    var v = pt(24.25, 45 + k * 90);
    s += '<circle cx="' + v[0].toFixed(1) + '" cy="' + v[1].toFixed(1) + '" r="1.1" fill="#E8C06A" stroke="#2B1807" stroke-width=".5"/>';
  }
  return s + '</svg>';
}

function majManometreSteampunk(faites, total) {
  if (etat.profil.theme !== 'steampunk') { return; }
  var haut = document.querySelector('.sx-entete-haut');
  if (!haut) { return; }
  var m = document.getElementById('sp-manometre');
  var neuf = !m;
  if (neuf) {
    m = document.createElement('span');
    m.id = 'sp-manometre';
    m.className = 'sp-jauge';
    m.innerHTML = svgJaugeSeance() + '<i class="sp-jauge-aig"></i><b class="sp-jauge-hub"></b>';
    haut.insertBefore(m, haut.lastElementChild);   /* juste avant le bouton Fin */
  }
  var a = m.querySelector('.sp-jauge-aig');
  if (neuf) { void a.offsetWidth; }
  var ang = -135 + (total > 0 ? faites / total : 0) * 270;
  a.style.webkitTransform = 'rotate(' + ang.toFixed(1) + 'deg)';
  a.style.transform = 'rotate(' + ang.toFixed(1) + 'deg)';
}

/* Coup de sifflet : les deux soupapes crachent un gros jet de vapeur */
function sifflerVapeur() {
  var v = document.getElementById('sp-valves');
  if (!v || etat.profil.theme !== 'steampunk') { return; }
  v.classList.remove('sp-sifflet');
  void v.offsetWidth;
  v.classList.add('sp-sifflet');
  window.setTimeout(function () { v.classList.remove('sp-sifflet'); }, 1400);
}

function appliquerTheme() {
  var theme = etat.profil.theme || 'sombre';
  var themeEffectif = theme;
  if (theme === 'auto') {
    var prefereClair = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    themeEffectif = prefereClair ? 'clair' : 'sombre';
  }
  document.documentElement.setAttribute('data-theme', themeEffectif);
  majIconeNutrition(themeEffectif);
  majAmbiance(themeEffectif);
  majRouages(themeEffectif);
  majSteampunk(themeEffectif);
  majEclair(themeEffectif);
  majEsprits(themeEffectif);
  majNitro(themeEffectif);
  if (pageCourante === 'accueil') { rendreCarteSeanceJour(); }
}

/* ============================================================
   PARALLAXE DU FOND
   ============================================================ */
var INDEX_PAGES_FOND = { accueil: 0, seance: 1, nutrition: 2, bibliotheque: 3, historique: 4 };
var DECALAGE_PAGE_PX = 24;       /* décalage horizontal par onglet */
var VITESSE_SCROLL_FOND = 0.5;  /* 0 = fond immobile, 1 = suit le contenu */
var PERIODE_MOTIF_PX = 240;      /* ne pas changer */
var fondExt = null;
var fondMotif = null;
var fondScrollEnAttente = false;

function appliquerTransformFond(element, x, y) {
  var valeur = 'translate3d(' + x + 'px,' + y + 'px,0)';
  element.style.webkitTransform = valeur;
  element.style.transform = valeur;
}

function majFondScroll() {
  if (!fondMotif) { return; }
  var y = -((window.pageYOffset * VITESSE_SCROLL_FOND) % PERIODE_MOTIF_PX);
  majRouagesParallaxe();
  appliquerTransformFond(fondMotif, 0, y);
}

/* Appelé à chaque changement d'onglet */
function majFondParallaxe(nomPage) {
  if (!fondExt || INDEX_PAGES_FOND[nomPage] === undefined) { return; }
  indexPageRouages = INDEX_PAGES_FOND[nomPage];
  appliquerTransformFond(fondExt, -INDEX_PAGES_FOND[nomPage] * DECALAGE_PAGE_PX, 0);
  majFondScroll();
}

function creerFondParallaxe() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    VITESSE_SCROLL_FOND = 0;
  }
  fondExt = document.createElement('div');
  fondExt.className = 'fond-theme';
  fondMotif = document.createElement('div');
  fondMotif.className = 'fond-motif';
  fondExt.appendChild(fondMotif);
  document.body.insertBefore(fondExt, document.body.firstChild);
  window.addEventListener('scroll', function () {
    if (fondScrollEnAttente) { return; }
    fondScrollEnAttente = true;
    window.requestAnimationFrame(function () {
      fondScrollEnAttente = false;
      majFondScroll();
    });
  }, false);
}

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
}, 60000);

/* BLOC 19 : NOTIFICATIONS */

document.addEventListener('change', function (e) {
  if (e.target.getAttribute('data-action') === 'changer-heure-rappel') {
    changerHeureRappel(parseInt(e.target.getAttribute('data-index'), 10), e.target.value);
  }
});

/* BLOC 20 : SONNERIE DU MINUTEUR */

document.addEventListener('change', function (e) {
  if (e.target.id === 'champ-profil-sonnerie') {
    etat.profil.sonnerie = e.target.value;
    sauvegarderEtat();
    jouerSonnerie(); // aperçu immédiat
  }
});

document.addEventListener('click', function (e) {
  var bouton = e.target.closest ? e.target.closest('[data-action="tester-sonnerie"]') : null;
  if (bouton) { jouerSonnerie(); }
});

})();