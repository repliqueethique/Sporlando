/* Noyau : constantes, checklist, état/sauvegarde, navigation, constantes de bibliothèque */
var EMOJIS_HUMEUR = ['😭', '😢', '😟', '😕', '😐', '🙂', '😊', '😁', '🤩'];
var EMOJIS_FATIGUE = ['😴', '😪', '🫩', '🥱', '🤭', '😌', '🤗', '😀', '🤪'];
var EMOJIS_STRESS = ['😤', '😖', '😬', '😰', '😥', '😗', '☺️', '😋', '🥰'];
var COULEURS_NIVEAU = ['#000000', '#7a0000', '#e30000', '#ff8c00', '#ffd700', '#c6e600', '#4caf50', '#00e676', '#1de9b6'];


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

function migrerRpeVersRer(liste) {
  for (var i = 0; i < liste.length; i++) {
    var res = liste[i].resultat;
    if (!res) { continue; }
    for (var j = 0; j < res.exercices.length; j++) {
      var ex = res.exercices[j];
      if (ex.rpe !== undefined) {
        if (ex.rer === undefined || ex.rer === null) { ex.rer = ex.rpe; }
        delete ex.rpe;
      }
    }
  }
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
  migrerRpeVersRer(donnees.agenda);
  if (donnees.seanceActive) {
    for (var k = 0; k < donnees.seanceActive.exercices.length; k++) {
      var exA = donnees.seanceActive.exercices[k];
      if (exA.rpe !== undefined) { exA.rer = exA.rpe; delete exA.rpe; }
    }
  }
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
    rendreSelectProgression(); rendreGraphiqueProgression(); rendreGraphiqueVolume(); rendreGraphiqueCalories(); rendreGraphiqueRpe();
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


