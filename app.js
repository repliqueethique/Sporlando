// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Service Worker enregistré');

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => console.error('Erreur SW:', err));
  });
}
(function () {
'use strict';

/* ============================================================
   BLOC 3 : OUTILS GENERIQUES (compatibles anciens navigateurs)
   ============================================================ */

function genererId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 100000).toString(36);
}

function echapperHtml(texte) {
  if (texte === null || texte === undefined) { return ''; }
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function completerZero(nombre) {
  nombre = Math.floor(nombre);
  if (nombre < 10) { return '0' + nombre; }
  return String(nombre);
}

function formaterDateISO(date) {
  return date.getFullYear() + '-' + completerZero(date.getMonth() + 1) + '-' + completerZero(date.getDate());
}

function dateDepuisISO(chaineISO) {
  var parties = chaineISO.split('-');
  return new Date(parseInt(parties[0], 10), parseInt(parties[1], 10) - 1, parseInt(parties[2], 10));
}

function formaterDateLisible(chaineISO) {
  // Tableau des jours de la semaine (0 = Lundi, 6 = Dimanche)
  var joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  var mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var d = dateDepuisISO(chaineISO);

  // Ajuste l'index pour que 0 = Lundi (au lieu de Dimanche)
  var jourSemaineIndex = (d.getDay() + 6) % 7; // 0=Lundi, 1=Mardi, ..., 6=Dimanche

  return joursSemaine[jourSemaineIndex] + ' ' + d.getDate() + ' ' + mois[d.getMonth()];
}

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
  minuteurId: null
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
  rendreEtapeEtirement();

  if (etatSeanceEtirement.minuteurId) { clearInterval(etatSeanceEtirement.minuteurId); }
  etatSeanceEtirement.minuteurId = setInterval(function () {
    etatSeanceEtirement.chronoRestantSec--;
    rendreChronoEtirement();
    if (etatSeanceEtirement.chronoRestantSec <= 0) {
      passerEtapeEtirementSuivante();
    }
  }, 1000);
}

function passerEtapeEtirementSuivante() {
  clearInterval(etatSeanceEtirement.minuteurId);
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

  afficherToast('Séance d\'étirements terminée !');
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
  html += '<span id="etirement-chrono" class="etirement-chrono">' + etape.dureeSec + '</span>';
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
  }

  var barre = document.getElementById('etirement-barre-remplissage');
  if (barre) {
    var pourcentage = (etatSeanceEtirement.chronoRestantSec / etatSeanceEtirement.dureeTotaleSec) * 100;
    barre.style.width = pourcentage + '%';
  }
}

function quitterSeanceEtirement() {
  clearInterval(etatSeanceEtirement.minuteurId);
  etatSeanceEtirement.enCours = false;
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

  var boutons = carte.querySelectorAll('.checklist-bouton');
  boutons.forEach(function (bouton) {
    var tache = bouton.getAttribute('data-tache');
    if (checklist[tache]) {
      bouton.classList.add('bulle-validation-faite');
      bouton.innerHTML = '✓';
    } else {
      bouton.classList.remove('bulle-validation-faite');
      bouton.innerHTML = obtenirIconeChecklist(tache);
    }
  });
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

  var checklist = checklistDuJour(dateReference);
  checklist.pesee = true;
  sauvegarderEtat();

  fermerModal();
  afficherToast('Poids enregistré');
  rendreChecklistQuotidienne();

  if (typeof rendreGraphiquePoidsCorporel === 'function') {
    rendreGraphiquePoidsCorporel();
  }

  if (checklistEstComplete(dateReference)) {
    fermerCarteChecklistAvecAnimation();
  }
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
      latitudeGym: 44.558, longitudeGym: 4.750, seuilTempMax: null, seuilTempMin: null
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
  if (donnees.profil.latitudeGym === undefined) { donnees.profil.latitudeGym = 44.558; }
  if (donnees.profil.longitudeGym === undefined) { donnees.profil.longitudeGym = 4.750; }
  if (donnees.profil.seuilTempMax === undefined) { donnees.profil.seuilTempMax = null; }
  if (donnees.profil.seuilTempMin === undefined) { donnees.profil.seuilTempMin = null; }
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

function allerVersPage(nomPage) {
  pageCourante = nomPage;
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) { pages[i].classList.remove('page-active'); }
  var cible = document.getElementById('page-' + nomPage);
  if (cible) { cible.classList.add('page-active'); }

  var onglets = document.querySelectorAll('.nav-onglet');
  for (var j = 0; j < onglets.length; j++) { onglets[j].classList.remove('nav-onglet-actif'); }
  var ongletCible = document.querySelector('.nav-onglet[data-page="' + nomPage + '"]');
  if (ongletCible) { ongletCible.classList.add('nav-onglet-actif'); }

  if (nomPage === 'accueil') {
    rendreBanniereObjectif();
    rendreBanniereMeteo();
    try { afficherBanniereRappels(verifierRappelsDus()); } catch (e) { console.error('Erreur rappels:', e); }
    rendreChecklistQuotidienne();
    rendreCarteSeanceJour();
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

/* ============================================================
   BLOC 6 : MODAL GENERIQUE
   ============================================================ */

function ouvrirModal(html) {
  document.getElementById('modal-contenu').innerHTML = html;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function fermerModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('modal-contenu').innerHTML = '';
}

/* Notifications "toast" : remplace afficherToast(), peu fiable sur iOS en mode standalone (ecran d'accueil) */
var fileToasts = [];
var toastEnCours = false;

function afficherToast(message) {
  fileToasts.push(message);
  traiterFileToasts();
}

function traiterFileToasts() {
  if (toastEnCours || fileToasts.length === 0) { return; }
  var conteneur = document.getElementById('toast-conteneur');
  if (!conteneur) { return; }
  toastEnCours = true;
  var message = fileToasts.shift();
  var el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = echapperHtml(message);
  conteneur.appendChild(el);
  window.setTimeout(function () {
    if (el.parentNode) { el.parentNode.removeChild(el); }
    toastEnCours = false;
    traiterFileToasts();
  }, 3200);
}

/* Confirmation maison : remplace window.confirm(), peu fiable sur iOS en mode standalone (ecran d'accueil) */
var confirmationCallbackOui = null;
var confirmationCallbackAnnuler = null;

function demanderConfirmation(message, callbackOui, callbackAnnuler) {
  confirmationCallbackOui = callbackOui || null;
  confirmationCallbackAnnuler = callbackAnnuler || null;
  var html = '';
  html += '<div class="modal-entete"><h2>Confirmation</h2></div>';
  html += '<div style="margin-bottom:18px; font-size:14px; line-height:1.4;">' + echapperHtml(message) + '</div>';
  html += '<button class="btn btn-alerte btn-bloc" data-action="confirmation-valider">Confirmer</button>';
  html += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="confirmation-annuler">Annuler</button>';
  ouvrirModal(html);
}

function validerConfirmation() {
  var cb = confirmationCallbackOui;
  confirmationCallbackOui = null;
  confirmationCallbackAnnuler = null;
  if (cb) { cb(); } else { fermerModal(); }
}

function annulerConfirmation() {
  var cb = confirmationCallbackAnnuler;
  confirmationCallbackOui = null;
  confirmationCallbackAnnuler = null;
  if (cb) { cb(); } else { fermerModal(); }
}

/* ============================================================
   BLOC : ECHAUFFEMENT
   ============================================================ */

var DONNEES_ECHAUFFEMENT = {
  hautDuCorps: {
    titre: '💪 Haut du Corps',
    description: 'Échauffement dynamique (3-4 min)',
    exercices: [
      { nom: 'Jumping Jacks', duree: '45 sec' },
      { nom: 'Shadow Boxing', duree: '45 sec' },
      { nom: 'Tirage Élastique', duree: '30 sec' },
      { nom: 'Rotations d\'épaules', duree: '30 sec' }
    ]
  },
  basDuCorps: {
    titre: '🦵 Bas du Corps',
    description: 'Échauffement dynamique (3-4 min)',
    exercices: [
      { nom: 'Jumping Jacks', duree: '45 sec' },
      { nom: 'Air Squats', duree: '45 sec' },
      { nom: 'Fentes marchées', duree: '45 sec' },
      { nom: 'Talons-fesses', duree: '30 sec' }
    ]
  }
};

// Stocke temporairement ce qu'il faut faire une fois l'échauffement terminé/passé
var callbackApresEchauffement = null;

function demanderEchauffement(callbackSuite) {
  callbackApresEchauffement = callbackSuite;

  var html = '';
  html += '<h2>🔥 Échauffement de séance</h2>';
  html += '<p class="subtitle">Sélectionne ton échauffement dynamique (3-4 min) pour faire monter le rythme cardiaque :</p>';
  html += '<div class="choix-echauffement-buttons">';
  html += '  <button class="btn-echauffement" data-action="choisir-echauffement" data-type="hautDuCorps">';
  html += '    <strong>💪 Haut du Corps</strong>';
  html += '    <span>Jumping Jacks, Shadow Boxing, Tirage Élastique...</span>';
  html += '  </button>';
  html += '  <button class="btn-echauffement" data-action="choisir-echauffement" data-type="basDuCorps">';
  html += '    <strong>🦵 Bas du Corps</strong>';
  html += '    <span>Jumping Jacks, Air Squats, Fentes marchées...</span>';
  html += '  </button>';
  html += '</div>';
  html += '<button class="btn-secondary" data-action="passer-echauffement">Passer l\'échauffement</button>';

  ouvrirModal(html);
}

function choisirEchauffement(type) {
  var data = DONNEES_ECHAUFFEMENT[type];
  if (!data) { return; }

  var html = '';
  html += '<h2>' + echapperHtml(data.titre) + '</h2>';
  html += '<p class="subtitle">' + echapperHtml(data.description) + '</p>';
  html += '<ul class="echauffement-list">';
  data.exercices.forEach(function (ex, i) {
    html += '<li class="item-echauffement">';
    html += '  <label class="checkbox-container">';
    html += '    <input type="checkbox">';
    html += '    <span class="exo-info">';
    html += '      <strong>' + echapperHtml(ex.nom) + '</strong>';
    html += '      <span class="duree">' + echapperHtml(ex.duree) + '</span>';
    html += '    </span>';
    html += '  </label>';
    html += '</li>';
  });
  html += '</ul>';
  html += '<button class="btn-primary" data-action="terminer-echauffement">✅ Terminer l\'échauffement & Démarrer la séance</button>';

  ouvrirModal(html);
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

function ouvrirFormulaireAliment(idAliment) {
  var aliment = idAliment ? trouverParId(etat.aliments, idAliment) : null;
  var estModif = !!aliment;
  if (!aliment) {
    aliment = { id: null, nom: '', categorie: 'Autre', caloriesPour100g: 0, proteinesPour100g: 0, glucidesPour100g: 0, lipidesPour100g: 0 };
  }
  var html = '';
  html += '<div class="modal-entete"><h2>' + (estModif ? 'Modifier l\'aliment' : 'Nouvel aliment') + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><label>Nom</label><input type="text" id="champ-al-nom" value="' + echapperHtml(aliment.nom) + '" placeholder="ex. Tofu ferme"></div>';
  html += '<div class="champ"><label>Catégorie</label><select id="champ-al-categorie">';
  for (var i = 0; i < CATEGORIES_ALIMENTS.length; i++) {
    var selectionne = (CATEGORIES_ALIMENTS[i] === aliment.categorie) ? ' selected' : '';
    html += '<option value="' + echapperHtml(CATEGORIES_ALIMENTS[i]) + '"' + selectionne + '>' + echapperHtml(CATEGORIES_ALIMENTS[i]) + '</option>';
  }
  html += '</select></div>';
  html += '<div class="champ"><label>Calories / 100 g</label><input type="number" step="1" id="champ-al-calories" value="' + aliment.caloriesPour100g + '"></div>';
  html += '<div class="champ"><label>Protéines / 100 g</label><input type="number" step="0.1" id="champ-al-proteines" value="' + aliment.proteinesPour100g + '"></div>';
  html += '<div class="champ"><label>Glucides / 100 g</label><input type="number" step="0.1" id="champ-al-glucides" value="' + aliment.glucidesPour100g + '"></div>';
  html += '<div class="champ"><label>Lipides / 100 g</label><input type="number" step="0.1" id="champ-al-lipides" value="' + aliment.lipidesPour100g + '"></div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-aliment" data-id="' + (aliment.id || '') + '">Enregistrer</button>';
  if (estModif) {
    html += '<button class="btn btn-alerte btn-bloc" style="margin-top:8px;" data-action="supprimer-aliment" data-id="' + aliment.id + '">Supprimer cet aliment</button>';
  }
  ouvrirModal(html);
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

var typeAjoutJournal = 'aliment';

function ouvrirFormulaireAjoutJournal() {
  if (etat.aliments.length === 0 && etat.plats.length === 0) {
    afficherToast('Ajoute d\'abord des aliments ou des plats dans Bibliothèque.');
    return;
  }
  typeAjoutJournal = etat.aliments.length > 0 ? 'aliment' : 'plat';
  rendreFormulaireAjoutJournal();
}

function basculerTypeAjoutJournal(type) {
  typeAjoutJournal = type;
  rendreFormulaireAjoutJournal();
}

function rendreFormulaireAjoutJournal() {
  var html = '';
  html += '<div class="modal-entete"><h2>Ajouter au journal</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="sous-onglets" style="margin-bottom:12px;">';
  html += '<button class="sous-onglet' + (typeAjoutJournal === 'aliment' ? ' sous-onglet-actif' : '') + '" data-action="type-ajout-journal" data-type="aliment">Aliment</button>';
  html += '<button class="sous-onglet' + (typeAjoutJournal === 'plat' ? ' sous-onglet-actif' : '') + '" data-action="type-ajout-journal" data-type="plat">Plat</button>';
  html += '</div>';

  if (typeAjoutJournal === 'aliment') {
    if (etat.aliments.length === 0) {
      html += '<div class="texte-att">Aucun aliment disponible. Ajoutes-en dans Bibliothèque > Aliments.</div>';
    } else {
      html += '<div class="champ"><label>Aliment</label><select id="champ-journal-aliment">' + optionsAlimentsHtml(null) + '</select></div>';
      html += '<div class="champ"><label>Quantité (grammes)</label><input type="number" step="1" min="1" id="champ-journal-quantite" value="100"></div>';
    }
  } else {
    if (etat.plats.length === 0) {
      html += '<div class="texte-att">Aucun plat disponible. Crées-en dans Bibliothèque > Plats.</div>';
    } else {
      var platsTries = etat.plats.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); });
      html += '<div class="champ"><label>Plat</label><select id="champ-journal-plat">';
      for (var i = 0; i < platsTries.length; i++) {
        html += '<option value="' + platsTries[i].id + '">' + echapperHtml(platsTries[i].nom) + '</option>';
      }
      html += '</select></div>';
      html += '<div class="champ"><label>Nombre de portions</label><input type="number" step="0.5" min="0.5" id="champ-journal-portions" value="1"></div>';
    }
  }

  html += '<button class="btn btn-plein btn-bloc" data-action="confirmer-ajout-journal">Ajouter</button>';
  ouvrirModal(html);
}

function confirmerAjoutJournal() {
  if (!etat.journalAlimentaire[dateNutritionAffichee]) { etat.journalAlimentaire[dateNutritionAffichee] = []; }
  if (typeAjoutJournal === 'aliment') {
    var alimentId = document.getElementById('champ-journal-aliment').value;
    var quantite = parseFloat(document.getElementById('champ-journal-quantite').value);
    if (!alimentId || !quantite || quantite <= 0) { afficherToast('Choisis un aliment et une quantité valide.'); return; }
    etat.journalAlimentaire[dateNutritionAffichee].push({ id: genererId(), type: 'aliment', alimentId: alimentId, quantiteGrammes: quantite });
  } else {
    var platId = document.getElementById('champ-journal-plat').value;
    var portions = parseFloat(document.getElementById('champ-journal-portions').value);
    if (!platId || !portions || portions <= 0) { afficherToast('Choisis un plat et un nombre de portions valide.'); return; }
    etat.journalAlimentaire[dateNutritionAffichee].push({ id: genererId(), type: 'plat', platId: platId, portions: portions });
  }
  sauvegarderEtat();
  fermerModal();
  rendreNutrition();
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
  var objP = etat.profil.objectifProteines || 0;
  var objG = etat.profil.objectifGlucides || 0;
  var objL = etat.profil.objectifLipides || 0;

  var htmlMacros = '';
  htmlMacros += '<div class="texte-att donnee-num" style="margin-bottom:14px;">' + Math.round(totaux.calories) + ' kcal aujourd\'hui</div>';
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

var ingredientsPlatEnCours = [];

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
    var selectionne = (alimentsTries[i].id === alimentIdSelectionne) ? ' selected' : '';
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

function mettreAJourApercuPlat() {
  var champPortions = document.getElementById('champ-plat-portions');
  var portions = parseFloat(champPortions ? champPortions.value : 1) || 1;
  var apercu = calculerMacrosPortionPlat({ ingredients: ingredientsPlatEnCours, portions: portions });
  var zone = document.getElementById('apercu-plat-macros');
  if (zone) {
    zone.innerHTML = 'Par portion : ' + Math.round(apercu.calories) + ' kcal · P ' + apercu.proteines.toFixed(1) + 'g · G ' + apercu.glucides.toFixed(1) + 'g · L ' + apercu.lipides.toFixed(1) + 'g';
  }
}

function changerIngredientPlat(index, nouvelAlimentId) {
  ingredientsPlatEnCours[index].alimentId = nouvelAlimentId;
  mettreAJourApercuPlat();
}

function changerQuantiteIngredientPlat(index, nouvelleQuantite) {
  ingredientsPlatEnCours[index].quantiteGrammes = parseFloat(nouvelleQuantite) || 0;
  mettreAJourApercuPlat();
}

function ajouterIngredientPlat() {
  var nom = document.getElementById('champ-plat-nom').value;
  var portions = document.getElementById('champ-plat-portions').value;
  var idPlatCourant = document.querySelector('[data-action="enregistrer-plat"]').getAttribute('data-id');
  ingredientsPlatEnCours.push({ alimentId: etat.aliments[0].id, quantiteGrammes: 100 });
  rendreFormulairePlat(idPlatCourant, nom, portions, !!idPlatCourant);
}

function retirerIngredientPlat(index) {
  if (ingredientsPlatEnCours.length <= 1) { afficherToast('Un plat doit contenir au moins un ingrédient.'); return; }
  var nom = document.getElementById('champ-plat-nom').value;
  var portions = document.getElementById('champ-plat-portions').value;
  var idPlatCourant = document.querySelector('[data-action="enregistrer-plat"]').getAttribute('data-id');
  ingredientsPlatEnCours.splice(index, 1);
  rendreFormulairePlat(idPlatCourant, nom, portions, !!idPlatCourant);
}

function enregistrerPlat(idExistant) {
  var nom = document.getElementById('champ-plat-nom').value.trim();
  if (!nom) { afficherToast('Le nom du plat est obligatoire.'); return; }
  var portions = parseFloat(document.getElementById('champ-plat-portions').value) || 1;
  for (var i = 0; i < ingredientsPlatEnCours.length; i++) {
    if (!ingredientsPlatEnCours[i].quantiteGrammes || ingredientsPlatEnCours[i].quantiteGrammes <= 0) {
      afficherToast('Vérifie les quantités des ingrédients.');
      return;
    }
  }
  var donnees = { nom: nom, portions: portions, ingredients: ingredientsPlatEnCours.slice() };
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
  var html = '<li class="carte agenda-entree' + (estFait ? ' agenda-entree-fait' : '') + '">';
  html += '<div class="ligne"><strong>' + echapperHtml(nomSeance) + '</strong>';
  if (!estFait) {
    html += '<button class="btn btn-plein btn-petit" data-action="demarrer-depuis-agenda" data-id="' + entree.id + '">Début</button>';
  } else {
    html += '<span class="texte-att donnee-num">' + Math.round(entree.caloriesEstimees || 0) + ' kcal</span>';
  }
  html += '</div>';
  if (!estFait) {
    html += '<button class="btn btn-alerte btn-petit" style="margin-top:6px;" data-action="annuler-agenda" data-id="' + entree.id + '">Retirer de l\'agenda</button>';
  }
  html += '</li>';
  return html;
}

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
    html += '<li class="ligne" style="padding:8px 0; border-bottom:1px solid var(--couleur-bordure);">';
    html += '<span>' + formaterDateLisible(entrees[i].date) + '</span>';
    html += '<strong>' + echapperHtml(seance ? seance.nom : '-') + '</strong>';
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
    html += '<div class="accueil-icone"><img src="images/seance-prevue.png" alt="Séance prévue"></div>';
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

  conteneur.innerHTML = html;
}

function genererParticules(nombre) {
  var html = '<div class="particules">';
  for (var i = 0; i < nombre; i++) {
    var taille = (Math.random() * 4 + 2).toFixed(1); // 2px à 6px
    var duree = (Math.random() * 3 + 3).toFixed(2); // 3s à 6s
    var delai = (Math.random() * 5).toFixed(2); // 0 à 5s
    var angle = Math.random() * 360;
    var distance = Math.random() * 40 + 20; // 20px à 60px
    var x = (Math.cos(angle * Math.PI / 180) * distance).toFixed(1);
    var y = (Math.sin(angle * Math.PI / 180) * distance).toFixed(1);

    html += '<span class="particule" style="' +
      'width:' + taille + 'px;' +
      'height:' + taille + 'px;' +
      'animation-duration:' + duree + 's;' +
      'animation-delay:' + delai + 's;' +
      '--tx:' + x + 'px;' +
      '--ty:' + y + 'px;' +
      '"></span>';
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
      var seriesTab = genererSeriesSelonStructure(structure, e.poids, e.reps, e.series);
      return {
        exerciceId: e.exerciceId,
        structure: structure,
        technique: e.technique || 'aucune',
        tempo: e.tempo || '',
        rpe: null,
        series: seriesTab
      };
    });

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
  document.getElementById('seance-liste-prevu').innerHTML = html;
}

function rendreDemarrageLibre() {
  var conteneur = document.getElementById('seance-liste-demarrage-libre');
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

function rendreRessentiJour() {
  var aujourdHui = formaterDateISO(new Date());
  var donnees = etat.ressentiQuotidien[aujourdHui] || { sommeil: 7, fatigue: 3, stress: 3 };
  var champSommeil = document.getElementById('champ-ressenti-sommeil');
  var champFatigue = document.getElementById('champ-ressenti-fatigue');
  var champStress = document.getElementById('champ-ressenti-stress');
  if (!champSommeil) { return; }
  champSommeil.value = donnees.sommeil;
  champFatigue.value = donnees.fatigue;
  champStress.value = donnees.stress;
  document.getElementById('valeur-ressenti-sommeil').innerHTML = donnees.sommeil;
  document.getElementById('valeur-ressenti-fatigue').innerHTML = donnees.fatigue;
  document.getElementById('valeur-ressenti-stress').innerHTML = donnees.stress;
}

function modifierRessenti(champ, valeur) {
  var aujourdHui = formaterDateISO(new Date());
  if (!etat.ressentiQuotidien[aujourdHui]) {
    etat.ressentiQuotidien[aujourdHui] = { sommeil: 7, fatigue: 3, stress: 3 };
  }
  if (champ === 'sommeil') {
    etat.ressentiQuotidien[aujourdHui][champ] = parseFloat(valeur);
    if (isNaN(etat.ressentiQuotidien[aujourdHui][champ])) { etat.ressentiQuotidien[aujourdHui][champ] = 7; }
  } else {
    etat.ressentiQuotidien[aujourdHui][champ] = parseInt(valeur, 10) || 3;
  }
  var elementValeur = document.getElementById('valeur-ressenti-' + champ);
  if (elementValeur) { elementValeur.innerHTML = etat.ressentiQuotidien[aujourdHui][champ]; }
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
    morceaux.push(ligneEx.series[i].poids + 'kg×' + ligneEx.series[i].reps);
  }
  return morceaux.join(', ');
}

var exercicesDeplies = {};

function rendreExercicesActifs() {
  var html = '';

  // Trouve le premier exercice non terminé = exercice actif
  var indexExerciceActif = -1;
  for (var ea = 0; ea < etat.seanceActive.exercices.length; ea++) {
    var estTermine = etat.seanceActive.exercices[ea].series.every(function (serie) { return serie.fait; });
    if (!estTermine) { indexExerciceActif = ea; break; }
  }

  for (var e = 0; e < etat.seanceActive.exercices.length; e++) {
    var ligneEx = etat.seanceActive.exercices[e];
    var exRef = trouverParId(etat.exercices, ligneEx.exerciceId);
    var nomEx = exRef ? exRef.nom : '(exercice supprimé)';

    // Détecter si l'exercice est terminé (toutes les séries sont "fait")
    var exerciceTermine = ligneEx.series.every(serie => serie.fait);

    html += '<div class="carte bloc-exercice' + (exerciceTermine ? ' bloc-exercice-termine' : ' bloc-exercice-actif') + '" data-exercice-id="' + ligneEx.exerciceId + '">';

    html += '<div class="ligne"><strong>' + echapperHtml(nomEx) + '</strong>';
    html += '<div class="barre-charge">';
    for (var b = 0; b < ligneEx.series.length; b++) {
      html += '<div class="bloc-charge' + (ligneEx.series[b].fait ? ' bloc-charge-fait' : '') + '"></div>';
    }
    html += '</div></div>';

    var derniereFois = derniereOccurrenceExercice(ligneEx.exerciceId);
    if (derniereFois) {
      html += '<div class="texte-att donnee-num" style="margin:4px 0;">Dernière fois (' + formaterDateCourte(derniereFois.date) + ') : ' + formaterResumeSeries(derniereFois.ligneEx) + '</div>';
    }

    var recordAnterieur = meilleurPoidsHistorique(ligneEx.exerciceId);
    var meilleurPoidsAujourdhui = null;
    for (var s2 = 0; s2 < ligneEx.series.length; s2++) {
      if (ligneEx.series[s2].fait && (meilleurPoidsAujourdhui === null || ligneEx.series[s2].poids > meilleurPoidsAujourdhui)) {
        meilleurPoidsAujourdhui = ligneEx.series[s2].poids;
      }
    }
    var nouveauRecord = meilleurPoidsAujourdhui !== null && (recordAnterieur === null || meilleurPoidsAujourdhui > recordAnterieur);

    var badges = '';
    if (nouveauRecord) {
      badges += '<span class="badge-technique badge-record">&#9733; Nouveau record</span>';
    }
    if (ligneEx.structure && ligneEx.structure !== 'lineaire') {
      badges += '<span class="badge-technique">' + echapperHtml(libelleDepuisValeur(STRUCTURES_SERIES, ligneEx.structure)) + '</span>';
    }
    if (ligneEx.technique && ligneEx.technique !== 'aucune') {
      badges += '<span class="badge-technique badge-technique-intensif">Dernière série : ' + echapperHtml(libelleDepuisValeur(TECHNIQUES_INTENSIFICATION, ligneEx.technique)) + '</span>';
    }
    if (ligneEx.tempo) {
      badges += '<span class="badge-technique">Tempo ' + echapperHtml(ligneEx.tempo) + '</span>';
    }
    if (badges) { html += '<div class="badges-zone">' + badges + '</div>'; }

    // Détecter si l'exercice est terminé (toutes les séries sont "fait")
    var exerciceTermine = ligneEx.series.every(serie => serie.fait);

    html += '<div class="exercice-series-zone">';

    // On calcule l'index de la prochaine série à faire pour cet exercice
    var indexProchaineSerie = -1;
    if (!exerciceTermine && e === indexExerciceActif) {
      for (var sc = 0; sc < ligneEx.series.length; sc++) {
        if (!ligneEx.series[sc].fait) { indexProchaineSerie = sc; break; }
      }
    }

    for (var s = 0; s < ligneEx.series.length; s++) {
      var serie = ligneEx.series[s];
      var estCible = (s === indexProchaineSerie);
      html += '<div class="serie-ligne' + (estCible ? ' serie-cible' : '') + '">';
      html += '<div class="serie-num">#' + (s + 1) + '</div>';
      html += '<div class="serie-champ"><input type="number" step="0.5" inputmode="decimal" data-role="live-poids" data-ex="' + e + '" data-serie="' + s + '" value="' + serie.poids + '"></div>';
      html += '<div class="serie-unite">kg</div>';
      html += '<div class="serie-champ"><input type="number" step="1" inputmode="numeric" data-role="live-reps" data-ex="' + e + '" data-serie="' + s + '" value="' + serie.reps + '"></div>';
      html += '<div class="serie-unite">reps</div>';

      html += '<button class="bulle-validation' + (serie.fait ? ' bulle-validation-faite' : '') + '" data-action="basculer-serie-faite" data-ex="' + e + '" data-serie="' + s + '">&#10003;</button>';
      html += '<button class="bouton-note' + (serie.note ? ' bouton-note-remplie' : '') + '" data-action="basculer-note-serie" data-ex="' + e + '" data-serie="' + s + '">&#9998;</button>';
      html += '<button class="serie-suppr" data-action="supprimer-serie" data-ex="' + e + '" data-serie="' + s + '">&times;</button>';
      html += '</div>';
      if (noteSerieEstOuverte(e, s, serie)) {
        html += '<div class="note-serie-zone"><input type="text" data-role="live-note" data-ex="' + e + '" data-serie="' + s + '" value="' + echapperHtml(serie.note || '') + '" placeholder="Note : changement, douleur, ressenti..."></div>';
      }
    }

    html += '</div>'; // Fermeture de .exercice-series-zone

    // Champ RPE et boutons
    html += '<div class="champ" style="margin-top:10px; margin-bottom:0;"><label style="font-size:11px;">RPE ressenti (1-10, optionnel)</label>';
    html += '<input type="number" min="1" max="10" step="1" data-role="live-rpe" data-ex="' + e + '" value="' + (ligneEx.rpe !== null && ligneEx.rpe !== undefined ? ligneEx.rpe : '') + '"></div>';
    html += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="ajouter-serie" data-ex="' + e + '">+ Ajouter une série</button>';
    if (ligneEx.technique === 'drop_set') {
      html += '<button class="btn btn-contour btn-bloc" style="margin-top:6px;" data-action="ajouter-serie-degressive" data-ex="' + e + '">+ Série dégressive (~70%)</button>';
    }
    html += '</div></div>'; // Fermeture de la carte
  }
  document.getElementById('seance-liste-exercices').innerHTML = html;

  // Gestion automatique des exercices terminés
  document.querySelectorAll('.bloc-exercice').forEach(exercice => {
    // Vérifier l'état de l'exercice au chargement
    const exerciceId = exercice.getAttribute('data-exercice-id');
    const exerciceData = etat.seanceActive.exercices.find(ex => ex.exerciceId == exerciceId);
    const exerciceTermine = exerciceData && exerciceData.series.every(serie => serie.fait);

    if (exerciceTermine) {
      exercice.classList.remove('bloc-exercice-actif');
      exercice.classList.add('bloc-exercice-termine');
    } else {
      exercice.classList.remove('bloc-exercice-termine');
      exercice.classList.add('bloc-exercice-actif');
    }

    // Applique l'état déplié/replié mémorisé
    if (exercicesDeplies[exerciceId]) {
      exercice.classList.add('exercice-deplie');
    } else {
      exercice.classList.remove('exercice-deplie');
    }

    // Écouter les clics sur les boutons de validation des séries
      exercice.querySelectorAll('[data-action="basculer-serie-faite"]').forEach(bouton => {
        bouton.addEventListener('click', function(e) {
          e.stopPropagation(); // <-- AJOUT ICI
          var exIndex = parseInt(this.getAttribute('data-ex'));
          var serieIndex = parseInt(this.getAttribute('data-serie'));
          etat.seanceActive.exercices[exIndex].series[serieIndex].fait = !etat.seanceActive.exercices[exIndex].series[serieIndex].fait;
          rendreExercicesActifs(); // Re-génère pour mettre à jour l'état
        });
      });

    // Écouter le clic sur l'exercice pour déplier/replier
    exercice.addEventListener('click', function(e) {
      if (e.target.closest('[data-action], .bouton-note, .serie-suppr, [data-role]')) {
        return;
      }
      this.classList.toggle('exercice-deplie');
      exercicesDeplies[exerciceId] = this.classList.contains('exercice-deplie');
    });
  });
} // <-- Fermeture de la fonction

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
  etat.seanceActive.exercices[exIndex].rpe = (isNaN(val) || val < 1) ? null : Math.min(10, val);
  sauvegarderEtat();
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
  seriesTab.push({ poids: derniere.poids, reps: derniere.reps, fait: false, note: '' });
  sauvegarderEtat();
  rendreExercicesActifs();
}

function ajouterSerieDegressive(exIndex) {
  var seriesTab = etat.seanceActive.exercices[exIndex].series;
  var derniere = seriesTab.length > 0 ? seriesTab[seriesTab.length - 1] : { poids: 0, reps: 0 };
  var poidsReduit = arrondirPoids(derniere.poids * 0.7);
  seriesTab.push({ poids: poidsReduit, reps: derniere.reps, fait: false, note: '' });
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
    arreterCompteARebours();
    if (chronoIntervalle) { window.clearInterval(chronoIntervalle); chronoIntervalle = null; }
    sauvegarderEtat();
    fermerModal();
    afficherToast('Séance enregistrée : ' + dureeMinutes + ' min · ' + Math.round(calories) + ' kcal estimées.');
    allerVersPage('accueil');
  });
}

function annulerSeance() {
  if (!etat.seanceActive) { return; }
  demanderConfirmation('Annuler la séance en cours ? La progression ne sera pas enregistrée.', function () {
    etat.seanceActive = null;
    arreterCompteARebours();
    if (chronoIntervalle) { window.clearInterval(chronoIntervalle); chronoIntervalle = null; }
    sauvegarderEtat();
    fermerModal();
    afficherToast('Séance annulée.');
    allerVersPage('accueil');
  });
}

/* ============================================================
   BLOC 13 : MINUTEUR DE REPOS (compte a rebours, toujours accessible en seance)
   ============================================================ */

var compteARebours = { actif: false, finMs: null };
var intervalleCompteARebours = null;
var derniereMinutesReglees = 1;
var dernieresSecondesReglees = 30;
var contexteAudio = null;

function obtenirContexteAudio() {
  if (contexteAudio) { return contexteAudio; }
  var ConstructeurAudio = window.AudioContext || window.webkitAudioContext;
  if (!ConstructeurAudio) { return null; }
  try {
    contexteAudio = new ConstructeurAudio();
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

function jouerSonnerie() {
  var ctx = obtenirContexteAudio();
  if (!ctx) { return; }
  var maintenant = ctx.currentTime;
  jouerBip(ctx, maintenant, 1046.5, 0.16);
  jouerBip(ctx, maintenant + 0.2, 1046.5, 0.16);
  jouerBip(ctx, maintenant + 0.4, 1318.5, 0.32);
}

function rendreZoneCompteARebours() {
  var conteneur = document.getElementById('seance-zone-cdr');
  if (!conteneur) { return; }
  var html = '<h2 class="carte-titre">Minuteur de repos</h2>';
  if (compteARebours.actif) {
    html += '<div class="chrono texte-degrade" id="cdr-affichage">--:--</div>';
    html += '<button class="btn btn-contour btn-bloc" style="margin-top:10px;" data-action="arreter-cdr">Arrêter</button>';
  } else {
    html += '<div class="cdr-champs">';
    html += '<div class="cdr-champ"><label>Min</label><input type="number" step="1" min="0" id="cdr-minutes" value="' + derniereMinutesReglees + '"></div>';
    html += '<div class="cdr-champ"><label>Sec</label><input type="number" step="1" min="0" max="59" id="cdr-secondes" value="' + dernieresSecondesReglees + '"></div>';
    html += '<button class="btn btn-plein" data-action="lancer-cdr">Lancer</button>';
    html += '</div>';
  }
  conteneur.innerHTML = html;
  if (compteARebours.actif) { afficherCompteARebours(compteARebours.finMs - Date.now()); }
}

function lancerCompteARebours() {
  var champMinutes = document.getElementById('cdr-minutes');
  var champSecondes = document.getElementById('cdr-secondes');
  var minutes = parseInt(champMinutes.value, 10);
  var secondes = parseInt(champSecondes.value, 10);
  if (isNaN(minutes) || minutes < 0) { minutes = 0; }
  if (isNaN(secondes) || secondes < 0) { secondes = 0; }
  var totalMs = (minutes * 60 + secondes) * 1000;
  if (totalMs <= 0) { afficherToast('Choisis une durée supérieure à zéro.'); return; }

  derniereMinutesReglees = minutes;
  dernieresSecondesReglees = secondes;

  obtenirContexteAudio();

  compteARebours.actif = true;
  compteARebours.finMs = Date.now() + totalMs;

  if (intervalleCompteARebours) { window.clearInterval(intervalleCompteARebours); }
  intervalleCompteARebours = window.setInterval(mettreAJourCompteARebours, 250);

  rendreZoneCompteARebours();
}

function arreterCompteARebours() {
  compteARebours.actif = false;
  compteARebours.finMs = null;
  if (intervalleCompteARebours) { window.clearInterval(intervalleCompteARebours); intervalleCompteARebours = null; }
  rendreZoneCompteARebours();
}

function mettreAJourCompteARebours() {
  if (!compteARebours.actif) { return; }
  var resteMs = compteARebours.finMs - Date.now();
  if (resteMs <= 0) {
    compteARebours.actif = false;
    if (intervalleCompteARebours) { window.clearInterval(intervalleCompteARebours); intervalleCompteARebours = null; }
    jouerSonnerie();
    rendreZoneCompteARebours();
    return;
  }
  afficherCompteARebours(resteMs);
}

function afficherCompteARebours(resteMs) {
  var affichage = document.getElementById('cdr-affichage');
  if (!affichage) { return; }
  var totalSecondes = Math.ceil(resteMs / 1000);
  var minutes = Math.floor(totalSecondes / 60);
  var secondes = totalSecondes % 60;
  affichage.innerHTML = completerZero(minutes) + ':' + completerZero(secondes);
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

function demanderPermissionNotif() {
  if (!('Notification' in window)) {
    return Promise.resolve(false);
  }
  if (Notification.permission === 'granted') {
    return Promise.resolve(true);
  }
  if (Notification.permission === 'denied') {
    return Promise.resolve(false);
  }
  return Notification.requestPermission().then(function (resultat) {
    return resultat === 'granted';
  });
}

function envoyerNotification(titre, corps) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  // Si un service worker est actif (PWA), passer par lui pour que ça marche aussi en arrière-plan
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(function (registration) {
      registration.showNotification(titre, {
        body: corps,
        icon: 'icon-180.png'
      });
    });
  } else {
    new Notification(titre, { body: corps });
  }
}

function ouvrirNotice() {
  var html = '';
  html += '<div class="modal-entete"><h2>Notice complète</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';

  html += '<div class="notice-section"><h3>Accueil</h3><p>Quatre raccourcis : Nouvelle séance, Nutrition, Bibliothèque, Historique. Deux bannières peuvent apparaître automatiquement : un rappel pour vérifier ton objectif de programme (toutes les 4 semaines), et une alerte météo si la température à ton lieu d\'entraînement dépasse les seuils que tu as réglés.</p></div>';

  html += '<div class="notice-section"><h3>Nouvelle séance</h3><ul>';
  html += '<li>Si une séance est planifiée aujourd\'hui dans l\'agenda, elle apparaît en premier avec un bouton <strong>Début</strong>. Sinon, choisis une séance libre dans la liste.</li>';
  html += '<li>Une fois lancée : chrono en haut, et un <strong>minuteur de repos</strong> réglable en minutes/secondes, toujours accessible, qui sonne une seule fois (bip généré, pas de fichier audio).</li>';
  html += '<li>Pour chaque exercice : la <strong>barre de charge</strong> (un bloc par série, se remplit au fur et à mesure), la <strong>bulle ✓</strong> pour valider poids/reps d\'une série, le <strong>crayon ✎</strong> pour noter un changement ou une douleur sur une série précise.</li>';
  html += '<li>Un champ <strong>RPE</strong> (1 à 10, optionnel) par exercice pour ton ressenti d\'effort.</li>';
  html += '<li>La <strong>référence "dernière fois"</strong> (ce que tu avais fait la séance précédente) et un badge <strong>★ Nouveau record</strong> si tu dépasses ton meilleur poids.</li>';
  html += '<li>Des badges rappellent la structure de séries, la technique d\'intensification et le tempo si tu les as définis pour cet exercice dans la séance.</li>';
  html += '<li>Le bouton <strong>Fin</strong> enregistre tout dans l\'historique, calcule la durée et les calories dépensées (formule MET × poids corporel × durée).</li>';
  html += '</ul></div>';

  html += '<div class="notice-section"><h3>Bibliothèque</h3><ul>';
  html += '<li><strong>Exercices</strong> : recherche par nom ou groupe musculaire avec ET/OU (ex. "dos ET poulie"), groupes musculaires repliables. Le bouton "Charger les exercices de base" ajoute 45 exercices adaptés à ton matériel (rack ATX, banc, barre, haltères, élastiques...). En modifiant un exercice : historique (nombre de fois, poids max par mode, RPE moyen), schéma des muscles ciblés, et un champ Variantes (prise, position) pré-rempli pour les exercices qui en ont.</li>';
  html += '<li><strong>Séances</strong> : assembler des exercices avec poids/reps/séries, et pour chacun une structure de séries (linéaire, pyramide montante/descendante, échelle, cluster), une technique d\'intensification (drop set, rest-pause...) et un tempo.</li>';
  html += '<li><strong>Programmes</strong> : regrouper des séances, définir un objectif texte libre, un type de mésocycle (Hypertrophie/Force/Décharge/Personnalisé) et une durée en semaines. Un seul programme actif à la fois ("Démarrer ce programme").</li>';
  html += '<li><strong>Aliments</strong> : bibliothèque 100% végétalienne. Le bouton "Charger les aliments de base" ajoute 32 aliments (tofu, tempeh, seitan, légumineuses, céréales, laits et fromages végétaux...).</li>';
  html += '</ul></div>';

  html += '<div class="notice-section"><h3>Nutrition</h3><p>Journal du jour avec navigation par date (flèches). Barres de progression Protéines/Glucides/Lipides comparées à tes objectifs (réglables dans Réglages). Bouton "+ Ajouter" pour choisir un aliment de la bibliothèque et sa quantité en grammes.</p></div>';

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
  html += '<li>Les suggestions et alertes météo sont des pistes, pas des décisions — à valider avec ton bon sens ou ton coach.</li>';
  html += '<li>Ressenti quotidien, ressenti météo et synchro dépendent du réseau ou d\'une saisie manuelle : rien n\'est bloquant si tu ne les utilises pas.</li>';
  html += '</ul></div>';

  ouvrirModal(html);
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
  var programmeActif = obtenirProgrammeActif ? obtenirProgrammeActif() : null;
  var typeObjectif = programmeActif ? (programmeActif.typeMesocycle || '') : '';

  var calories = maintenance;
  if (typeObjectif === 'Force' || typeObjectif === 'Hypertrophie') {
    calories = maintenance + 250; // léger surplus
  } else if (typeObjectif === 'Décharge') {
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

function ouvrirReglages() {
  var html = '';
  html += '<div class="modal-entete"><h2>Réglages</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';

  html += '<div class="champ"><label>Poids corporel (kg)</label><input type="number" step="0.1" id="champ-profil-poids" value="' + (etat.profil.poidsCorporel || 75) + '"></div>';
  html += '<div class="champ"><label>Taille (cm)</label><input type="number" step="1" id="champ-profil-taille" value="' + (etat.profil.tailleCm || 175) + '"></div>';
  html += '<div class="texte-att" style="margin-bottom:10px;">Le poids et la taille servent aussi à estimer les calories dépensées pendant les séances et à calculer automatiquement tes objectifs nutritionnels ci-dessous.</div>';

  html += '<div class="champ"><label>Objectif calories / jour (kcal)</label><input type="number" step="1" id="champ-profil-calories" value="' + (etat.profil.objectifCalories || 2200) + '"></div>';
  html += '<div class="champ"><label>Objectif protéines / jour (g)</label><input type="number" step="1" id="champ-profil-proteines" value="' + (etat.profil.objectifProteines || 150) + '"></div>';
  html += '<div class="champ"><label>Objectif glucides / jour (g)</label><input type="number" step="1" id="champ-profil-glucides" value="' + (etat.profil.objectifGlucides || 250) + '"></div>';
  html += '<div class="champ"><label>Objectif lipides / jour (g)</label><input type="number" step="1" id="champ-profil-lipides" value="' + (etat.profil.objectifLipides || 70) + '"></div>';
  html += '<button class="btn btn-contour btn-bloc" data-action="calculer-objectifs-nutrition" style="margin-bottom:10px;">🔄 Recalculer automatiquement mes objectifs</button>';

  html += '<div class="sync-separateur">';
  html += '<h2 class="carte-titre">Météo du lieu d\'entraînement</h2>';
  html += '<div class="texte-att" style="margin-bottom:10px;">Utilisé pour te signaler une température trop élevée ou trop basse à l\'endroit où tu t\'entraînes.</div>';
  html += '<div class="champ"><label>Latitude</label><input type="number" step="0.001" id="champ-profil-latitude" value="' + (etat.profil.latitudeGym !== null && etat.profil.latitudeGym !== undefined ? etat.profil.latitudeGym : '') + '"></div>';
  html += '<div class="champ"><label>Longitude</label><input type="number" step="0.001" id="champ-profil-longitude" value="' + (etat.profil.longitudeGym !== null && etat.profil.longitudeGym !== undefined ? etat.profil.longitudeGym : '') + '"></div>';
  html += '<div class="champ"><label>Seuil température max (°C, optionnel)</label><input type="number" step="1" id="champ-profil-temp-max" value="' + (etat.profil.seuilTempMax !== null && etat.profil.seuilTempMax !== undefined ? etat.profil.seuilTempMax : '') + '" placeholder="ex. 28"></div>';
  html += '<div class="champ"><label>Seuil température min (°C, optionnel)</label><input type="number" step="1" id="champ-profil-temp-min" value="' + (etat.profil.seuilTempMin !== null && etat.profil.seuilTempMin !== undefined ? etat.profil.seuilTempMin : '') + '" placeholder="ex. 10"></div>';
  html += '</div>';

  html += '<button class="btn btn-plein btn-bloc" style="margin-top:10px;" data-action="enregistrer-profil">Enregistrer le profil</button>';

  html += '<div class="sync-separateur">';
  html += '<h2 class="carte-titre">Synchronisation (GitHub Gist)</h2>';
  html += '<div class="champ"><label>Token d\'accès personnel GitHub</label>';
  html += '<input type="password" id="champ-sync-token" value="' + echapperHtml(reglagesSync.token) + '" placeholder="ghp_...">';
  html += '<div class="case-liste" style="border-bottom:none; padding-top:6px;"><input type="checkbox" id="case-afficher-token" data-action="basculer-token"><span class="texte-att">Afficher le token</span></div>';
  html += '</div>';
  html += '<div class="champ"><label>Identifiant du gist (si tu en as déjà un sur un autre appareil)</label>';
  html += '<input type="text" id="champ-sync-gistid" value="' + echapperHtml(reglagesSync.gistId) + '" placeholder="colle ici l\'identifiant"></div>';
  html += '<button class="btn btn-contour btn-bloc" data-action="enregistrer-reglages-sync">Enregistrer le token / l\'identifiant</button>';
  html += '<div id="sync-zone-dynamique" style="margin-top:12px;"></div>';
  html += '</div>';

  html += '<div class="sync-separateur">';
  html += '<h2 class="carte-titre">Sauvegarde manuelle</h2>';
  html += '<div class="texte-att" style="margin-bottom:10px;">Indépendante de la synchronisation — utile en secours si le gist ne se met pas à jour ou pour garder une copie avant de changer d\'appareil.</div>';
  html += '<button class="btn btn-contour btn-bloc" data-action="ouvrir-export-donnees" style="margin-bottom:8px;">Exporter mes données</button>';
  html += '<button class="btn btn-contour btn-bloc" data-action="ouvrir-import-donnees">Importer des données</button>';
  html += '</div>';

  html += '<div class="sync-separateur">';
  html += '<h2 class="carte-titre">Rappels & notifications</h2>';
  html += '<div id="reminders-container"></div>';
  html += '<button class="btn btn-contour btn-bloc" data-action="tester-notif" style="margin-top:8px;">🔔 Tester une notification</button>';
  html += '</div>';

  ouvrirModal(html);
  rendreZoneSync();
  renderRemindersSettings();
}

/* ============================================================
   BLOC 14bis : SAUVEGARDE MANUELLE (export/import JSON, independant de la synchro)
   ============================================================ */

function ouvrirExportDonnees() {
  var json = JSON.stringify(etat, null, 2);
  var html = '';
  html += '<div class="modal-entete"><h2>Exporter mes données</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="texte-att" style="margin-bottom:10px;">Sélectionne tout le texte ci-dessous (appui long → Sélectionner tout → Copier), puis colle-le dans l\'app Notes ou un email pour le conserver en sécurité.</div>';
  html += '<textarea id="champ-export-json" readonly style="min-height:220px; font-family:var(--police-donnees); font-size:11px;">' + echapperHtml(json) + '</textarea>';
  html += '<button class="btn btn-contour btn-bloc" style="margin-top:10px;" data-action="tenter-telechargement-json">Tenter le téléchargement direct (ordinateur/téléphone récent)</button>';
  ouvrirModal(html);
  var champ = document.getElementById('champ-export-json');
  if (champ) { champ.focus(); champ.select(); }
}

function tenterTelechargementJson() {
  try {
    var champ = document.getElementById('champ-export-json');
    var contenu = champ ? champ.value : JSON.stringify(etat, null, 2);
    var blob = new Blob([contenu], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var lien = document.createElement('a');
    lien.href = url;
    lien.download = 'carnet-muscu-sauvegarde-' + formaterDateISO(new Date()) + '.json';
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    afficherToast('Téléchargement lancé si ton navigateur le permet.');
  } catch (erreur) {
    afficherToast('Téléchargement direct impossible ici — utilise le copier-coller ci-dessus.');
  }
}

function ouvrirImportDonnees() {
  var html = '';
  html += '<div class="modal-entete"><h2>Importer des données</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="texte-att" style="margin-bottom:10px;">Ceci remplacera TOUTES les données actuelles sur cet appareil. Colle ci-dessous le contenu exporté précédemment, ou choisis un fichier .json.</div>';
  html += '<div class="champ"><label>Choisir un fichier .json (optionnel)</label><input type="file" accept=".json,application/json" id="champ-import-fichier"></div>';
  html += '<textarea id="champ-import-json" placeholder="Colle ici le contenu JSON exporté..." style="min-height:180px; font-family:var(--police-donnees); font-size:11px;"></textarea>';
  html += '<button class="btn btn-alerte btn-bloc" style="margin-top:10px;" data-action="lancer-import-json">Restaurer ces données</button>';
  ouvrirModal(html);
}

function chargerFichierImport() {
  var input = document.getElementById('champ-import-fichier');
  if (!input || !input.files || input.files.length === 0) { return; }
  var fichier = input.files[0];
  var lecteur = new FileReader();
  lecteur.onload = function (evt) {
    var champTexte = document.getElementById('champ-import-json');
    if (champTexte) { champTexte.value = evt.target.result; }
  };
  lecteur.onerror = function () {
    afficherToast('Impossible de lire ce fichier.');
  };
  lecteur.readAsText(fichier);
}

function lancerImportJson() {
  var champTexte = document.getElementById('champ-import-json');
  var texte = champTexte ? champTexte.value.trim() : '';
  if (!texte) { afficherToast('Colle ou choisis d\'abord des données à restaurer.'); return; }
  var donnees;
  try {
    donnees = JSON.parse(texte);
  } catch (erreurParse) {
    afficherToast('Ce texte n\'est pas un JSON valide.');
    return;
  }
  if (!donnees || typeof donnees !== 'object' || !donnees.exercices || !donnees.seances) {
    afficherToast('Ce fichier ne ressemble pas à une sauvegarde de Carnet Muscu.');
    return;
  }
  demanderConfirmation('Remplacer TOUTES les données actuelles de cet appareil par cette sauvegarde ? Cette action est irréversible.', function () {
    etat = completerChampsEtat(donnees);
    try { window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat)); } catch (erreurStockage) {}
    sauvegarderEtat();
    fermerModal();
    afficherToast('Données restaurées.');
    allerVersPage('accueil');
  });
}

function enregistrerProfil() {
  var poids = parseFloat(document.getElementById('champ-profil-poids').value);
  etat.profil.poidsCorporel = poids > 0 ? poids : 75;
  var taille = parseFloat(document.getElementById('champ-profil-taille').value);
  etat.profil.tailleCm = taille > 0 ? taille : 175;
  etat.profil.objectifProteines = parseFloat(document.getElementById('champ-profil-proteines').value) || 150;
  etat.profil.objectifGlucides = parseFloat(document.getElementById('champ-profil-glucides').value) || 250;
  etat.profil.objectifLipides = parseFloat(document.getElementById('champ-profil-lipides').value) || 70;
  etat.profil.objectifCalories = parseFloat(document.getElementById('champ-profil-calories').value) || 2200;
  etat.poidsCorporelHistorique[formaterDateISO(new Date())] = etat.profil.poidsCorporel;

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
  afficherToast('Profil enregistré.');
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
      ouvrirReglages();
      appliquer();
    }, function () {
      ouvrirReglages();
    });
  } else {
    appliquer();
  }
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
  var select = document.getElementById('progression-select-exercice');
  var liste = exercicesAvecHistorique();
  if (liste.length === 0) {
    select.innerHTML = '<option value="">Aucun historique</option>';
    exerciceSelectionneProgression = null;
    return;
  }
  if (!exerciceSelectionneProgression || !trouverParId(liste, exerciceSelectionneProgression)) {
    exerciceSelectionneProgression = liste[0].id;
  }
  select.innerHTML = optionsExercicesGroupeesDepuisListe(liste, exerciceSelectionneProgression);
}

function changerExerciceProgression() {
  exerciceSelectionneProgression = document.getElementById('progression-select-exercice').value;
  rendreGraphiqueProgression();
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
        if (poidsMax === null || ligneEx.series[s].poids > poidsMax) { poidsMax = ligneEx.series[s].poids; }
      }
    }
    if (poidsMax !== null) { points.push({ date: entree.date, valeur: poidsMax }); }
  }
  return points;
}

function construireSvgCourbe(points, suffixeUnite, couleur) {
  if (points.length === 0) {
    return '<div class="etat-vide">Pas encore assez de données pour afficher une courbe.</div>';
  }
  if (points.length === 1) {
    return '<div class="etat-vide">Une seule valeur enregistrée pour l\'instant (' + points[0].valeur + suffixeUnite + '). Reviens plus tard pour voir la courbe.</div>';
  }
  var largeur = 300, hauteur = 140, marge = 24;
  var valeurs = points.map(function (p) { return p.valeur; });
  var valeurMin = Math.min.apply(null, valeurs);
  var valeurMax = Math.max.apply(null, valeurs);
  if (valeurMax === valeurMin) { valeurMax = valeurMin + 1; }

  var coordonnees = [];
  for (var i = 0; i < points.length; i++) {
    var x = marge + (i / (points.length - 1)) * (largeur - marge * 2);
    var y = hauteur - marge - ((points[i].valeur - valeurMin) / (valeurMax - valeurMin)) * (hauteur - marge * 2);
    coordonnees.push({ x: x, y: y });
  }

  var chainePoints = coordonnees.map(function (c) { return c.x.toFixed(1) + ',' + c.y.toFixed(1); }).join(' ');

  var svg = '<svg viewBox="0 0 ' + largeur + ' ' + hauteur + '" xmlns="http://www.w3.org/2000/svg">';
  svg += '<polyline points="' + chainePoints + '" fill="none" stroke="' + couleur + '" stroke-width="2.5" />';
  for (var k = 0; k < coordonnees.length; k++) {
    svg += '<circle cx="' + coordonnees[k].x.toFixed(1) + '" cy="' + coordonnees[k].y.toFixed(1) + '" r="3.2" fill="' + couleur + '" />';
  }
  svg += '<text x="' + marge + '" y="12" font-size="10" fill="#8996A3">' + valeurMax + suffixeUnite + '</text>';
  svg += '<text x="' + marge + '" y="' + (hauteur - 6) + '" font-size="10" fill="#8996A3">' + valeurMin + suffixeUnite + '</text>';
  svg += '</svg>';
  return '<div class="svg-conteneur">' + svg + '</div>';
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
      var seriesValidees = ligneEx.series.filter(function (s) { return s.fait; }).length;
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
  var acceptableMin = 5;
  var acceptableMax = 28;
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

function rendreBanniereMeteo() {
  console.log('rendreBanniereMeteo appelée');
  var zone = document.getElementById('zone-banniere-meteo');
  console.log('zone trouvée:', zone);
  if (!zone) { return; }
  if (etat.profil.latitudeGym === null || etat.profil.longitudeGym === null) {
    console.log('lat/lng manquantes, arrêt');
    zone.innerHTML = '';
    return;
  }
  console.log('avant appel verifierMeteoGym');
  verifierMeteoGym(function (resultat) {
    console.log('callback verifierMeteoGym reçu:', resultat);
    if (!resultat) { zone.innerHTML = ''; return; }
    var etatTemp = evaluerTemperature(resultat.actuelle);
    var tranche = trouverProchainCreneauIdealBanniere(resultat.heures, resultat.temperatures);
    console.log('tranche trouvée:', tranche);

    var html = '<div class="banniere-meteo banniere-meteo-' + etatTemp + '" data-action="ouvrir-modale-meteo" style="cursor:pointer;">';
    html += '<span class="banniere-meteo-actuelle">' + resultat.actuelle.toFixed(1) + '°C actuellement</span>';
    if (tranche) {
      html += '<span class="banniere-meteo-tranche">idéal à ' + tranche.heure + '-' + Math.round(tranche.temperature) + '°</span>';
    }
    html += '</div>';
    zone.innerHTML = html;
  });
}

function ouvrirModaleMeteo() {
  if (!meteoDernierResultat) { return; }
  document.getElementById('modale-meteo').style.display = 'flex';
  dessinerGraphiqueMeteo(meteoDernierResultat);
}

function fermerModaleMeteo() {
  document.getElementById('modale-meteo').style.display = 'none';
}

function dessinerGraphiqueMeteo(resultat) {
  var svg = document.getElementById('svg-meteo');
  svg.innerHTML = '';
  var largeur = 320, hauteur = 220, marge = 28;
  var temps = resultat.temperatures;
  var heures = resultat.heures;
  var min = Math.min.apply(null, temps), max = Math.max.apply(null, temps);
  if (min === max) { max = min + 1; }

  function x(i) { return marge + (i / (temps.length - 1)) * (largeur - marge * 1.5); }
  function y(t) { return hauteur - marge - ((t - min) / (max - min)) * (hauteur - marge * 1.8); }

  // repères Y
  [min, (min + max) / 2, max].forEach(function (val) {
    var ligne = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ligne.setAttribute('x', 2); ligne.setAttribute('y', y(val));
    ligne.setAttribute('class', 'axe-label');
    ligne.textContent = val.toFixed(0) + '°';
    svg.appendChild(ligne);
  });

  // --- Points et lissage (Catmull-Rom -> Bézier) ---
  var points = temps.map(function (t, i) { return { x: x(i), y: y(t) }; });

  function segmentBezier(p0, p1, p2, p3) {
    var cp1x = p1.x + (p2.x - p0.x) / 6;
    var cp1y = p1.y + (p2.y - p0.y) / 6;
    var cp2x = p2.x - (p3.x - p1.x) / 6;
    var cp2y = p2.y - (p3.y - p1.y) / 6;
    return { cp1x: cp1x, cp1y: cp1y, cp2x: cp2x, cp2y: cp2y };
  }

  // segments colorés lissés (un path par segment pour garder la couleur par tranche)
  for (var i = 0; i < points.length - 1; i++) {
    var p0 = points[i - 1] || points[i];
    var p1 = points[i];
    var p2 = points[i + 1];
    var p3 = points[i + 2] || p2;
    var cp = segmentBezier(p0, p1, p2, p3);

    var etatSeg = evaluerTemperature((temps[i] + temps[i + 1]) / 2);
    var seg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var d = 'M' + p1.x + ',' + p1.y + ' C' + cp.cp1x + ',' + cp.cp1y + ' ' + cp.cp2x + ',' + cp.cp2y + ' ' + p2.x + ',' + p2.y;
    seg.setAttribute('d', d);
    seg.setAttribute('fill', 'none');
    seg.setAttribute('class', 'segment-' + etatSeg);
    seg.setAttribute('stroke-width', '3');
    seg.setAttribute('stroke-linecap', 'round');
    svg.appendChild(seg);
  }

  // labels heures toutes les 3h
  for (var j = 0; j < heures.length; j += 3) {
    var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x(j) - 8); label.setAttribute('y', hauteur - 8);
    label.setAttribute('class', 'axe-label');
    label.textContent = heures[j].substring(11, 16);
    svg.appendChild(label);
  }

  // point tranche idéale
  var tranche = trouverTrancheIdeale(heures, temps);
  if (tranche) {
    var idx = heures.findIndex(function (h) { return h.substring(11, 16) === tranche.heure; });
    if (idx !== -1) {
      var point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('cx', x(idx)); point.setAttribute('cy', y(temps[idx]));
      point.setAttribute('r', '5');
      point.setAttribute('class', 'point-ideal');
      svg.appendChild(point);
    }
  }

  // --- Heure actuelle : ligne verticale + point ---
  var maintenant = new Date();
  var minuteActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
  var indexActuel = -1, meilleurEcart = Infinity;
  for (var k = 0; k < heures.length; k++) {
    var hMin = parseInt(heures[k].substring(11, 13), 10) * 60 + parseInt(heures[k].substring(14, 16), 10);
    var ecart = Math.abs(hMin - minuteActuelle);
    if (ecart < meilleurEcart) { meilleurEcart = ecart; indexActuel = k; }
  }

  if (indexActuel !== -1) {
    var xActuel = x(indexActuel);

    var ligneActuelle = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ligneActuelle.setAttribute('x1', xActuel);
    ligneActuelle.setAttribute('x2', xActuel);
    ligneActuelle.setAttribute('y1', 4);
    ligneActuelle.setAttribute('y2', hauteur - marge);
    ligneActuelle.setAttribute('stroke', '#f2f2f2');
    ligneActuelle.setAttribute('stroke-width', '1');
    ligneActuelle.setAttribute('stroke-dasharray', '3,3');
    ligneActuelle.setAttribute('opacity', '0.5');
    svg.appendChild(ligneActuelle);

    var pointActuel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pointActuel.setAttribute('cx', xActuel);
    pointActuel.setAttribute('cy', y(temps[indexActuel]));
    pointActuel.setAttribute('r', '5');
    pointActuel.setAttribute('fill', '#0a84ff');
    pointActuel.setAttribute('stroke', '#1c1c1e');
    pointActuel.setAttribute('stroke-width', '2');
    svg.appendChild(pointActuel);

    var labelActuel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelActuel.setAttribute('x', xActuel + 6);
    labelActuel.setAttribute('y', 14);
    labelActuel.setAttribute('fill', '#0a84ff');
    labelActuel.setAttribute('font-size', '10');
    labelActuel.setAttribute('font-weight', '700');
    labelActuel.textContent = Math.round(temps[indexActuel]) + '°';
    svg.appendChild(labelActuel);
  }
}

document.addEventListener('click', function (e) {
  var cible = e.target.closest('[data-action]');
  if (!cible) { return; }
  var action = cible.getAttribute('data-action');
  if (action === 'ouvrir-modale-meteo') { ouvrirModaleMeteo(); }
  if (action === 'fermer-modale-meteo') { fermerModaleMeteo(); }
});

document.getElementById('modale-meteo').addEventListener('click', function (e) {
  if (e.target.id === 'modale-meteo') { fermerModaleMeteo(); }
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
      html += '<div class="ligne"><strong>' + echapperHtml(prog.nom) + '</strong><span class="texte-att">' + echapperHtml(libelleDepuisValeur(TYPES_MESOCYCLE, prog.typeMesocycle || 'personnalise')) + '</span></div>';
      if (prog.dureeSemaines) {
        html += '<div class="texte-att donnee-num" style="margin-top:4px;">Semaine ' + semaineActuelle + ' / ' + prog.dureeSemaines;
        if (semaineActuelle > prog.dureeSemaines) { html += ' (durée dépassée, pense à la suite du programme)'; }
        html += '</div>';
      } else {
        html += '<div class="texte-att donnee-num" style="margin-top:4px;">Semaine ' + semaineActuelle + '</div>';
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
    var d = new Date();
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
  if (entrees.length === 0) {
    conteneur.innerHTML = '<li class="etat-vide">Aucune séance réalisée pour le moment.</li>';
    return;
  }

  var html = '';
  for (var i = 0; i < entrees.length; i++) {
    var entree = entrees[i];
    var seance = trouverParId(etat.seances, entree.seanceId);
    var nomSeance = seance ? seance.nom : '(séance supprimée)';
    var complete = seanceEstComplete(entree);

    html += '<li class="carte" data-action="voir-detail-historique" data-id="' + entree.id + '">';
    html += '<div class="ligne">';
    html += '<strong>' + echapperHtml(nomSeance) + '</strong>';
    html += '<span class="badge-technique' + (complete ? ' badge-record' : '') + '">' + (complete ? 'Complète' : 'Incomplète') + '</span>';
    html += '</div>';
    html += '<div class="texte-att" style="margin-top:4px;">' + formaterDateLisible(entree.date) + '</div>';
    var nbEx = entree.resultat.exercices.length;
    html += '<div class="texte-att">' + nbEx + ' exercice(s)';
    if (entree.dureeMinutes) { html += ' · ' + entree.dureeMinutes + ' min'; }
    if (entree.caloriesEstimees) { html += ' · ' + Math.round(entree.caloriesEstimees) + ' kcal'; }
    html += '</div>';
    html += '</li>';
  }
  conteneur.innerHTML = html;
}

function ouvrirDetailHistorique(idEntree) {
  var entree = trouverParId(etat.agenda, idEntree);
  if (!entree || !entree.resultat) { return; }
  var seance = trouverParId(etat.seances, entree.seanceId);
  var nomSeance = seance ? seance.nom : '(séance supprimée)';

  var html = '';
  html += '<div class="modal-entete"><h2>' + echapperHtml(nomSeance) + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="texte-att" style="margin-bottom:12px;">' + formaterDateLisible(entree.date);
  if (entree.dureeMinutes) { html += ' · ' + entree.dureeMinutes + ' min'; }
  if (entree.caloriesEstimees) { html += ' · ' + Math.round(entree.caloriesEstimees) + ' kcal'; }
  html += '</div>';

  for (var i = 0; i < entree.resultat.exercices.length; i++) {
    var ligneEx = entree.resultat.exercices[i];
    var exRef = trouverParId(etat.exercices, ligneEx.exerciceId);
    var nomEx = exRef ? exRef.nom : '(exercice supprimé)';

    html += '<div class="carte" style="padding:10px; margin-bottom:10px;">';
    html += '<strong>' + echapperHtml(nomEx) + '</strong>';
    html += '<table style="width:100%; margin-top:8px; font-size:13px;">';
    html += '<tr class="texte-att"><td>Série</td><td>Poids</td><td>Reps</td><td>Fait</td></tr>';
    for (var s = 0; s < ligneEx.series.length; s++) {
      var serie = ligneEx.series[s];
      html += '<tr>';
      html += '<td>' + (s + 1) + '</td>';
      html += '<td>' + serie.poids + ' kg</td>';
      html += '<td>' + serie.reps + '</td>';
      html += '<td>' + (serie.fait ? '&#10003;' : '&#10007;') + '</td>';
      html += '</tr>';
    }
    html += '</table>';
    html += '</div>';
  }

  ouvrirModal(html);
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
  if (action === 'terminer-echauffement') { terminerEchauffement(); return; }
  if (action === 'ouvrir-reglages') { ouvrirReglages(); return; }
  if (action === 'ouvrir-export-donnees') { ouvrirExportDonnees(); return; }
  if (action === 'tenter-telechargement-json') { tenterTelechargementJson(); return; }
  if (action === 'ouvrir-import-donnees') { ouvrirImportDonnees(); return; }
  if (action === 'lancer-import-json') { lancerImportJson(); return; }
  if (action === 'ouvrir-notice') { ouvrirNotice(); return; }
  if (action === 'ouvrir-verif-objectif') { ouvrirVerificationObjectif(); return; }
  if (action === 'confirmer-objectif') { confirmerObjectif(); return; }
  if (action === 'enregistrer-profil') { enregistrerProfil(); return; }
  if (action === 'enregistrer-reglages-sync') { enregistrerReglagesSync(); return; }
  if (action === 'creer-gist') { creerNouveauGist(); return; }
  if (action === 'synchroniser-maintenant') { synchroniserMaintenant(); return; }
  if (action === 'basculer-token') { basculerAffichageToken(); return; }
  if (action === 'basculer-token') { basculerAffichageToken(); return; }
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
  if (action === 'toggle-rappel-actif') { toggleRappelActif(parseInt(cible.getAttribute('data-index'), 10)); return; }
  if (action === 'marquer-rappel-fait') { marquerRappelFaitEtRafraichir(cible.getAttribute('data-rappel-id')); return; }

  if (action === 'sous-onglet') {
    var groupe = cible.getAttribute('data-groupe');
    var boutonsGroupe = document.querySelectorAll('.sous-onglet[data-groupe="' + groupe + '"]');
    for (var i = 0; i < boutonsGroupe.length; i++) { boutonsGroupe[i].classList.remove('sous-onglet-actif'); }
    cible.classList.add('sous-onglet-actif');
    var sectionsGroupe = document.querySelectorAll('.section-' + groupe);
    for (var j = 0; j < sectionsGroupe.length; j++) { sectionsGroupe[j].style.display = 'none'; }
    var sousOnglet = cible.getAttribute('data-cible');
    document.getElementById(groupe + '-' + sousOnglet).style.display = 'block';

    if (groupe === 'hist' && sousOnglet === 'seances') {
      rendreHistoriqueSeances();
    }
    return;
  }

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

  if (action === 'nouveau-plat') { ouvrirFormulairePlat(null); return; }
  if (action === 'editer-plat') { ouvrirFormulairePlat(id); return; }
  if (action === 'enregistrer-plat') { enregistrerPlat(id || null); return; }
  if (action === 'supprimer-plat') { supprimerPlat(id); return; }
  if (action === 'ajouter-ingredient-plat') { ajouterIngredientPlat(); return; }
  if (action === 'retirer-ingredient-plat') { retirerIngredientPlat(parseInt(cible.getAttribute('data-index'), 10)); return; }
  if (action === 'type-ajout-journal') { basculerTypeAjoutJournal(cible.getAttribute('data-type')); return; }

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
  if (action === 'annuler-seance') { annulerSeance(); }
  if (action === 'ajouter-serie') { ajouterSerieLive(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'ajouter-serie-degressive') { ajouterSerieDegressive(parseInt(cible.getAttribute('data-ex'), 10)); return; }
  if (action === 'supprimer-serie') { supprimerSerieLive(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'basculer-serie-faite') { basculerSerieFaite(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }
  if (action === 'basculer-note-serie') { basculerNoteSerie(parseInt(cible.getAttribute('data-ex'), 10), parseInt(cible.getAttribute('data-serie'), 10)); return; }

  if (action === 'lancer-cdr') { lancerCompteARebours(); return; }
  if (action === 'arreter-cdr') { arreterCompteARebours(); return; }

  if (action === 'toggle-checklist') {
    var tache = cible.getAttribute('data-tache');
    basculerTacheChecklist(tache);
  }
  if (action === 'etirement-passer') { passerEtapeEtirementSuivante(); }
  if (action === 'etirement-quitter') { quitterSeanceEtirement(); }

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
  if (evt.target.id === 'progression-select-exercice') { changerExerciceProgression(); }
  if (evt.target.id === 'champ-ex-groupe') { rafraichirDiagrammeMuscles(); }
  if (evt.target.id === 'champ-import-fichier') { chargerFichierImport(); }
}, false);

document.body.addEventListener('input', function (evt) {
  if (evt.target.id === 'champ-recherche-exercices') {
    texteRechercheExercices = evt.target.value;
    rendreExercices();
  }
  var roleRessenti = evt.target.getAttribute && evt.target.getAttribute('data-role');
  if (roleRessenti === 'ressenti-sommeil') { modifierRessenti('sommeil', evt.target.value); }
  if (roleRessenti === 'ressenti-fatigue') { modifierRessenti('fatigue', evt.target.value); }
  if (roleRessenti === 'ressenti-stress') { modifierRessenti('stress', evt.target.value); }
}, false);

document.getElementById('modal-overlay').addEventListener('click', function (evt) {
  if (evt.target.id === 'modal-overlay') { fermerModal(); }
}, false);



/* ============================================================
   BLOC 18 : INITIALISATION
   ============================================================ */

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
}, 60000);

})();

/* ============================================================
   BLOC 19 : NOTIFICATIONS
   ============================================================ */

document.addEventListener('change', function (e) {
  if (e.target.getAttribute('data-action') === 'changer-heure-rappel') {
    changerHeureRappel(parseInt(e.target.getAttribute('data-index'), 10), e.target.value);
  }
});