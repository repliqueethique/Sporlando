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
      if (structure === 'fourchette') { repsBase = e.reps; }   /* on repart du bas de la fourchette */
      if (structure === 'maintien' || structure === 'poids_corps' || structure === 'cardio') {
        poidsBase = (structure === 'cardio') ? 0 : e.poids;   /* lest éventuel */
        repsBase = e.reps;                                      /* secondes, reps ou minutes de la séance modèle */
      }
      var exRef = trouverParId(etat.exercices, e.exerciceId);
      var equip = e.equipement || (exRef && exRef.equipement) || 'aucun';
      var seriesTab = genererSeriesSelonStructure(structure, poidsBase, repsBase, e.series);
      return {
        exerciceId: e.exerciceId,
        equipement: equip,
        structure: structure,
        technique: e.technique || 'aucune',
        tempo: e.tempo || '',
        rer: null,
        poidsBase: poidsBase,
        repsMin: e.reps,
        repsMax: e.repsMax || 0,
        grappes: e.grappes || 0,
        series: seriesTab
      };
    });

    /* Exercices enchaînés (superset / circuit) : les exercices liés partagent un identifiant de groupe */
    var idGroupe = null;
    for (var g = 0; g < modele.exercices.length; g++) {
      if (modele.exercices[g].lieSuivant && g < modele.exercices.length - 1) {
        if (idGroupe === null) { idGroupe = 'g' + g; }
        exercicesActifs[g].groupe = idGroupe;
        exercicesActifs[g + 1].groupe = idGroupe;
      } else {
        idGroupe = null;
      }
    }
    
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
    var nb = seance ? seance.exercices.length : 0;
    html += '<li class="hist-ligne hist-prevu" data-action="demarrer-depuis-agenda" data-id="' + entrees[i].id + '">';
    html += '<div class="hist-ligne-corps"><strong class="hist-ligne-titre">' + echapperHtml(seance ? seance.nom : '-') + '</strong>';
    html += '<span class="hist-ligne-sous donnee-num">' + nb + ' exercice' + (nb > 1 ? 's' : '') + '</span></div>';
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
    var s = etat.seances[i];
    var nb = s.exercices.length;
    html += '<li class="hist-ligne" data-action="demarrer-seance-libre" data-id="' + s.id + '">';
    html += '<div class="hist-ligne-corps"><strong class="hist-ligne-titre">' + echapperHtml(s.nom) + '</strong>';
    html += '<span class="hist-ligne-sous donnee-num">' + nb + ' exercice' + (nb > 1 ? 's' : '') + '</span></div>';
    html += '<button class="btn btn-plein btn-petit" data-action="demarrer-seance-libre" data-id="' + s.id + '">Début</button>';
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
  rendrePrete();
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

/* ===== Couché / levé / fin de repas (dans « Ressenti du jour ») ===== */

var EMOJIS_PRETE = { coucher: '🌙', leve: '☀️', collation: '🥐', repas: '🍽️' };
var LIBELLES_PRETE = { coucher: 'Heure de coucher', leve: 'Heure de lever', collation: 'Fin de collation', repas: 'Fin de repas' };
var PRETE_APPUI_LONG_MS = 450;   /* durée de l'appui long */
var PRETE_PX_PAR_PAS = 24;       /* 24 px de glissement = 15 minutes */
var pressePrete = { cle: null, minuteur: null, long: false, x: 0, y: 0, bouge: false };
var heureEdition = { cle: null, minutes: 0 };
var glisseHeure = { actif: false, x0: 0, min0: 0 };
var glisseHeureInit = false;

function preparationDuJour() {
  var jour = obtenirDateJourReference();
  if (!etat.preparation || etat.preparation.date !== jour) {
    etat.preparation = { date: jour, leverMs: null, repasMs: null, repasType: null };
  }
  return etat.preparation;
}

function heureTexte(ms) {
  var d = new Date(ms);
  return completerZero(d.getHours()) + ':' + completerZero(d.getMinutes());
}

function formatMinutes(m) {
  return completerZero(Math.floor(m / 60)) + ':' + completerZero(m % 60);
}

/* le coucher n'est affiché que pendant 14 h (il disparaît l'après-midi, prêt pour le soir) */
function coucheRecente() {
  if (!etat.coucheMs) { return null; }
  return (Date.now() - etat.coucheMs < 14 * 3600000) ? etat.coucheMs : null;
}

function msPrete(cle) {
  var p = preparationDuJour();
  if (cle === 'leve') { return p.leverMs; }
  if (cle === 'coucher') { return coucheRecente(); }
  return (p.repasType === cle) ? p.repasMs : null;
}

/* part de temps restante (1 = tout juste commencé, 0 = terminé), ou null si rien de noté */
function fractionRestante(ms, dureeMin) {
  if (!ms) { return null; }
  var reste = 1 - (Date.now() - ms) / 60000 / dureeMin;
  return reste > 0 ? reste : 0;
}

function htmlTuilePrete(cle, ms, jauge) {
  var h = '<button type="button" class="prete-tuile' + (ms ? ' prete-tuile-fait' : '') + '" data-prete="' + cle + '" aria-label="' + LIBELLES_PRETE[cle] + '">';
  h += '<span class="prete-emoji">' + EMOJIS_PRETE[cle] + '</span>';
  h += '<span class="prete-heure">' + (ms ? heureTexte(ms) : '') + '</span>';
  return h + (jauge || '') + '</button>';
}

function rendrePrete() {
  if (pressePrete.cle) { return; }   /* pas de redessin pendant un appui */
  var p = preparationDuJour();

  var zc = document.getElementById('zone-couche');
  if (zc) { zc.innerHTML = htmlTuilePrete('coucher', msPrete('coucher'), ''); }

  var zl = document.getElementById('zone-leve');
  if (zl) {
    var frL = fractionRestante(p.leverMs, METEO_APRES_LEVER);
    var mini = '';
    if (frL !== null) {
      mini = '<span class="prete-mini' + (frL > 0 ? '' : ' prete-mini-ok') + '"><i style="width:' + (frL > 0 ? Math.round(frL * 100) : 100) + '%"></i></span>';
    }
    zl.innerHTML = htmlTuilePrete('leve', p.leverMs, mini);
  }

  var zr = document.getElementById('zone-repas');
  if (zr) {
    var h = htmlTuilePrete('collation', msPrete('collation'), '') + htmlTuilePrete('repas', msPrete('repas'), '');
    var fr = fractionRestante(p.repasMs, dureeDigestion(p.repasType));
    if (fr === null) { h += '<span class="prete-piste"><i style="width:0%"></i></span>'; }
    else if (fr > 0) { h += '<span class="prete-piste"><i style="width:' + Math.round(fr * 100) + '%"></i></span>'; }
    else { h += '<span class="prete-piste prete-piste-ok"><i style="width:100%"></i></span><span class="prete-ok">✓</span>'; }
    zr.innerHTML = h;
  }
}

/* Sommeil = levé − couché (arrondi à 0,5 h), seulement si le résultat est plausible */
function recalculerSommeil() {
  var p = preparationDuJour();
  if (!p.leverMs || !etat.coucheMs) { return; }
  var h = (p.leverMs - etat.coucheMs) / 3600000;
  if (h < 1 || h > 16) { return; }
  h = Math.round(h * 2) / 2;
  modifierRessenti('sommeil', h);
  rendreRessentiJour();
  afficherToast('Sommeil : ' + h + ' h');
}

function enregistrerPrete(cle, ms) {
  var p = preparationDuJour();
  if (cle === 'leve') { p.leverMs = ms; }
  else if (cle === 'coucher') { etat.coucheMs = ms; }
  else { p.repasMs = ms; p.repasType = cle; }
  sauvegarderEtat();
  if (cle === 'leve' || cle === 'coucher') { recalculerSommeil(); }
  rendrePrete();
}

function effacerPrete(cle) {
  var p = preparationDuJour();
  if (cle === 'leve') { p.leverMs = null; }
  else if (cle === 'coucher') { etat.coucheMs = null; }
  else if (p.repasType === cle) { p.repasMs = null; p.repasType = null; }
  sauvegarderEtat();
  fermerModal();
  rendrePrete();
}

/* tap : enregistre maintenant (ou ouvre la fenêtre si l'heure est déjà notée) */
function toucherPrete(cle) {
  if (msPrete(cle)) { ouvrirReglageHeurePrete(cle); return; }
  enregistrerPrete(cle, Date.now());
}

/* --- Appui long / tap sur les tuiles (sans data-action, géré ici) --- */
function tuilePreteDepuis(el) {
  while (el && el !== document.body) {
    if (el.getAttribute && el.getAttribute('data-prete')) { return el; }
    el = el.parentNode;
  }
  return null;
}

function arreterMinuteurPresse() {
  if (pressePrete.minuteur) { window.clearTimeout(pressePrete.minuteur); pressePrete.minuteur = null; }
}

function debutPressePrete(el, x, y) {
  arreterMinuteurPresse();
  pressePrete.cle = el.getAttribute('data-prete');
  pressePrete.long = false;
  pressePrete.bouge = false;
  pressePrete.x = x;
  pressePrete.y = y;
  pressePrete.minuteur = window.setTimeout(function () {
    pressePrete.minuteur = null;
    pressePrete.long = true;
    if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
    ouvrirReglageHeurePrete(pressePrete.cle);
  }, PRETE_APPUI_LONG_MS);
}

function bougePressePrete(x, y) {
  if (!pressePrete.cle || pressePrete.bouge) { return; }
  if (Math.abs(x - pressePrete.x) > 10 || Math.abs(y - pressePrete.y) > 10) {
    pressePrete.bouge = true;
    arreterMinuteurPresse();
  }
}

function finPressePrete() {
  if (!pressePrete.cle) { return; }
  var cle = pressePrete.cle, estLong = pressePrete.long, aBouge = pressePrete.bouge;
  arreterMinuteurPresse();
  pressePrete.cle = null;
  if (!estLong && !aBouge) { toucherPrete(cle); }
}

function annulerPressePrete() {
  arreterMinuteurPresse();
  pressePrete.cle = null;
}

document.addEventListener('touchstart', function (e) {
  var el = tuilePreteDepuis(e.target);
  if (!el || e.touches.length !== 1) { return; }
  debutPressePrete(el, e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
document.addEventListener('touchmove', function (e) {
  if (pressePrete.cle) { bougePressePrete(e.touches[0].clientX, e.touches[0].clientY); }
}, { passive: true });
document.addEventListener('touchend', function (e) {
  if (!pressePrete.cle) { return; }
  if (e.cancelable) { e.preventDefault(); }   /* évite le clic fantôme */
  finPressePrete();
}, false);
document.addEventListener('touchcancel', annulerPressePrete, false);
document.addEventListener('mousedown', function (e) {
  var el = tuilePreteDepuis(e.target);
  if (el) { debutPressePrete(el, e.clientX, e.clientY); }
});
document.addEventListener('mouseup', finPressePrete);

/* --- Fenêtre : choisir l'heure en glissant (15 min par pas, comme le minuteur) --- */
function ouvrirReglageHeurePrete(cle) {
  var ms = msPrete(cle);
  var d = new Date(ms || Date.now());
  var min = d.getHours() * 60 + d.getMinutes();
  if (!ms) { min = Math.floor(min / 15) * 15; }
  heureEdition.cle = cle;
  heureEdition.minutes = min;

  var html = '<div class="modal-entete"><h2>' + EMOJIS_PRETE[cle] + '</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="heure-edition">';
  html += '<button class="heure-pas" data-action="heure-prete-pas" data-delta="-15">&lsaquo;</button>';
  html += '<div class="heure-glissable" id="heure-glissable"><span id="heure-affichage" class="heure-affichage donnee-num">' + formatMinutes(min) + '</span></div>';
  html += '<button class="heure-pas" data-action="heure-prete-pas" data-delta="15">&rsaquo;</button>';
  html += '</div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-heure-prete">Enregistrer</button>';
  if (ms) { html += '<button class="btn btn-alerte btn-bloc" style="margin-top:8px;" data-action="effacer-heure-prete">Effacer</button>'; }
  ouvrirModal(html);
  configurerGlisseHeurePrete();
}

function appliquerMinutesEdition(m) {
  heureEdition.minutes = ((m % 1440) + 1440) % 1440;
  var el = document.getElementById('heure-affichage');
  if (el) { el.innerHTML = formatMinutes(heureEdition.minutes); }
}

function ajusterHeurePrete(delta) { appliquerMinutesEdition(heureEdition.minutes + delta); }

function deplacerGlisseHeure(x) {
  if (!glisseHeure.actif) { return; }
  var pas = Math.trunc((x - glisseHeure.x0) / PRETE_PX_PAR_PAS);
  appliquerMinutesEdition(glisseHeure.min0 + pas * 15);
}

function finGlisseHeure() {
  glisseHeure.actif = false;
  var zone = document.getElementById('heure-glissable');
  if (zone) { zone.classList.remove('glisse-actif'); }
}

function configurerGlisseHeurePrete() {
  var zone = document.getElementById('heure-glissable');
  if (!zone) { return; }
  function debut(x) {
    glisseHeure.actif = true;
    glisseHeure.x0 = x;
    glisseHeure.min0 = heureEdition.minutes;
    zone.classList.add('glisse-actif');
  }
  zone.addEventListener('mousedown', function (e) { debut(e.clientX); });
  zone.addEventListener('touchstart', function (e) { debut(e.touches[0].clientX); }, { passive: true });
  if (!glisseHeureInit) {
    glisseHeureInit = true;
    document.addEventListener('mousemove', function (e) { deplacerGlisseHeure(e.clientX); });
    document.addEventListener('touchmove', function (e) { deplacerGlisseHeure(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('mouseup', finGlisseHeure);
    document.addEventListener('touchend', finGlisseHeure);
  }
}

function validerHeurePrete() {
  var cle = heureEdition.cle;
  if (!cle) { return; }
  var d = new Date();
  d.setHours(Math.floor(heureEdition.minutes / 60), heureEdition.minutes % 60, 0, 0);
  if (d.getTime() > Date.now()) {
    /* un coucher « dans le futur » est celui d'hier soir ; pour le reste, on refuse */
    if (cle === 'coucher' || new Date().getHours() < 5) { d.setDate(d.getDate() - 1); }
    else { afficherToast('Cette heure est dans le futur.'); return; }
  }
  fermerModal();
  enregistrerPrete(cle, d.getTime());
}

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
  demanderVerrouEcran();
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
    var sr = ligneEx.series[i];
    var t = ligneEx.structure;
    if (t === 'cardio') { morceaux.push(sr.reps + ' min' + (sr.distance ? ' · ' + sr.distance + ' km' : '')); }
    else if (t === 'maintien') { morceaux.push((sr.poids > 0 ? sr.poids + 'kg×' : '') + sr.reps + ' s'); }
    else if (t === 'poids_corps') { morceaux.push((sr.poids > 0 ? '+' + sr.poids + 'kg×' : '') + sr.reps); }
    else { morceaux.push(sr.poids + 'kg×' + sr.reps + (sr.minis && sr.minis.length ? '+' + sr.minis.join('+') : '')); }
  }
  return morceaux.join(', ');
}

var exercicesDeplies = {};
var PAS_REPS_STEPPER = 1;

function htmlStepper(e, s, champ, valeur, unite, pas) {
  var role = 'live-' + champ;
  var attrs = ' data-action="ajuster-serie" data-ex="' + e + '" data-serie="' + s + '" data-champ="' + champ + '"';
  var h = '<div class="sx-hero-champ">';
  h += '<button class="sx-pas"' + attrs + ' data-delta="' + (-pas) + '">&minus;</button>';
  h += '<div class="sx-hero-valeur"><input type="number" step="' + (champ === 'reps' ? '1' : '0.5') + '" inputmode="' + (champ === 'reps' ? 'numeric' : 'decimal') + '" data-role="' + role + '" data-ex="' + e + '" data-serie="' + s + '" value="' + valeur + '">';
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
  var cle = (champ === 'poids' || champ === 'distance') ? champ : 'reps';
  var valeur = (serie[cle] || 0) + delta;
  if (valeur < 0) { valeur = 0; }
  valeur = Math.round(valeur * 100) / 100;
  serie[cle] = valeur;
  sauvegarderEtat();
  if (cle === 'reps') { rendreExercicesActifs(); return; }
  var saisie = document.querySelector('[data-role="live-' + cle + '"][data-ex="' + exIndex + '"][data-serie="' + serieIndex + '"]');
  if (saisie) { saisie.value = valeur; }
}

/* Déplier / replier un exercice en touchant son en-tête */
function basculerExercice(exIndex, etaitOuvert) {
  exercicesDeplies[exIndex] = !etaitOuvert;
  rendreExercicesActifs();
}

function htmlInfosExercice(exRef) {
  if (!exRef) { return ''; }
  var h = '';
  if (exRef.unilateral) {
    h += '<span class="sx-info"><svg class="sx-info-icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/></svg>Unilatéral</span>';
  }
  if (exRef.securiteCran) {
    var chiffreSecu = '<b class="donnee-num">' + echapperHtml(exRef.securiteCran) + '</b>';
    var contenuSecu = (exRef.securiteSens === 'bas') ? chiffreSecu + SVG_FLECHE_BAS : SVG_FLECHE_HAUT + chiffreSecu;
    h += '<span class="sx-bouclier"><svg class="sx-bouclier-fond" viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1.5L21.5 5v8.5c0 5.6-3.9 9.7-9.5 12-5.6-2.3-9.5-6.4-9.5-12V5z"/></svg><span class="sx-bouclier-texte">' + contenuSecu + '</span></span>';
  }
  return h ? '<div class="sx-infos">' + h + '</div>' : '';
}

/* Charge suggérée pour la série en cours : 1RM estimé (meilleur des 3 dernières séances) converti pour les reps prévues,
   +2,5 kg si la dernière séance avait un RER d'au moins 2 (marge confortable) */
function chargeSuggeree(exerciceId, reps) {
  if (!(reps > 0) || reps > REPS_MAX_1RM) { return null; }
  var reprise = dateRepriseAnalyse();
  var points = points1RMParSeance(exerciceId, reprise);
  if (points.length < 2) { return null; }

  var recents = points.slice(-3);
  var base = 0;
  for (var i = 0; i < recents.length; i++) {
    if (recents[i].valeur > base) { base = recents[i].valeur; }
  }
  var poids = arrondirPoids(reps === 1 ? base : base / (1 + reps / 30));
  var raison = '1rm';

  var derniere = derniereOccurrenceExercice(exerciceId);
  if (derniere && (!reprise || derniere.date > reprise) && derniere.ligneEx.rer !== undefined && derniere.ligneEx.rer !== null && derniere.ligneEx.rer >= 2) {
    var series = derniere.ligneEx.series;
    var maxPoids = 0, repsAuMax = 0, nb = 0, toutesFaites = true;
    for (var s = 0; s < series.length; s++) {
      if (series[s].echauffement) { continue; }
      nb++;
      if (!series[s].fait) { toutesFaites = false; continue; }
      if (series[s].poids > maxPoids || (series[s].poids === maxPoids && series[s].reps > repsAuMax)) {
        maxPoids = series[s].poids;
        repsAuMax = series[s].reps;
      }
    }
    if (nb > 0 && toutesFaites && maxPoids > 0 && reps <= repsAuMax) {
      var prog = arrondirPoids(maxPoids + pasPoidsPourExercice(exerciceId));
      if (prog > poids) { poids = prog; raison = 'progression'; }
    }
  }
  return { poids: poids, raison: raison };
}

function htmlSuggestionCharge(exerciceId, reps, poidsActuel, exIndex, serieIndex) {
  var sug = chargeSuggeree(exerciceId, reps);
  if (!sug || Math.abs(sug.poids - poidsActuel) < 0.01) { return ''; }
  var h = '<button class="sx-suggestion" data-action="appliquer-suggestion" data-ex="' + exIndex + '" data-serie="' + serieIndex + '" data-poids="' + sug.poids + '">';
  h += '<span class="sx-suggestion-icone">💡</span>';
  h += '<span class="sx-suggestion-poids donnee-num">' + nombreCourt(sug.poids) + ' kg</span>';
  h += '<span class="sx-suggestion-raison">' + (sug.raison === 'progression' ? 'progression' : 'd\'après ton 1RM') + '</span></button>';
  return h;
}

function appliquerSuggestionSerie(exIndex, serieIndex, poids) {
  var serie = etat.seanceActive.exercices[exIndex].series[serieIndex];
  serie.poids = poids;
  sauvegarderEtat();
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
    if (!toutesFaites) {
      indexExerciceActif = ea;
      if (seance.exercices[ea].groupe) {
        var posGroupe = positionGroupe(seance, seance.exercices[ea].groupe);
        if (posGroupe) { indexExerciceActif = posGroupe.ex; }
      }
      break;
    }
  }
  var groupeActif = (indexExerciceActif >= 0) ? (seance.exercices[indexExerciceActif].groupe || null) : null;

  for (var e = 0; e < seance.exercices.length; e++) {
    var ligneEx = seance.exercices[e];
    html += htmlOuvertureGroupe(seance, e);
    var exRef = trouverParId(etat.exercices, ligneEx.exerciceId);
    var nomEx = exRef ? exRef.nom : '(exercice supprimé)';
    var groupeEx = exRef ? exRef.groupe : '';
    var modeUnilat = (exRef && exRef.modeUnilateral) || ((exRef && exRef.unilateral) ? 'cote_par_cote' : 'aucun');
    var unilat = (modeUnilat !== 'aucun');
    var exerciceTermine = ligneEx.series.every(function (sr) { return sr.fait; });
    var estActif = (e === indexExerciceActif);
    var ouvert = (exercicesDeplies[e] !== undefined) ? exercicesDeplies[e] : (estActif || (groupeActif !== null && ligneEx.groupe === groupeActif));

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
    html += '</div>';

    /* ----- Corps (seulement si ouvert) ----- */
    if (ouvert) {
      html += '<div class="sx-exo-corps">';
      var derniereFois = derniereOccurrenceExercice(ligneEx.exerciceId);
      var htmlDerniere = '';
      if (derniereFois) {
        htmlDerniere = '<div class="sx-derniere donnee-num">' + formaterDateCourte(derniereFois.date) + ' : ' + echapperHtml(formaterResumeSeries(derniereFois.ligneEx)) + '</div>';
      }
      var htmlInfos = htmlInfosExercice(exRef);
      if (htmlDerniere || htmlInfos) { html += '<div class="sx-ligne-info">' + htmlDerniere + htmlInfos + '</div>'; }

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

      var fourchetteTxt = (ligneEx.structure === 'fourchette' && ligneEx.repsMax > ligneEx.repsMin) ? ligneEx.repsMin + '–' + ligneEx.repsMax + ' reps' : '';
      var indexEchec = (ligneEx.structure === 'echec') ? indexDerniereSerieTravail(ligneEx) : -1;      
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
          html += '<div class="sx-hero' + (estEchauffement ? ' sx-hero-echauf' : '') + (s === indexEchec ? ' sx-hero-echec' : '') + (estNouvelle ? ' sx-nouvelle' : '') + '">';
          var infoStyle = '';
          if (!estEchauffement && fourchetteTxt) { infoStyle = ' · ' + fourchetteTxt; }
          if (!estEchauffement && s === indexEchec) { infoStyle = ' · à l\'échec'; }
          html += '<div class="sx-hero-tete"><span class="sx-hero-label">' + (estEchauffement ? 'Échauffement ' + compteurEchauffement : 'Série ' + compteurTravail + ' / ' + nbTravail + infoStyle) + '</span>';
          html += '<span class="sx-hero-outils">';
          html += '<button class="bouton-note' + (serie.note ? ' bouton-note-remplie' : '') + '" data-action="basculer-note-serie"' + attrs + '>&#9998;</button>';
          html += '<button class="serie-suppr" data-action="supprimer-serie"' + attrs + '>&times;</button>';
          html += '</span></div>';
          if (!estEchauffement) {
            html += ((ligneEx.structure === 'fourchette' && ligneEx.repsMax > ligneEx.repsMin) || ligneEx.structure === 'echec')
              ? htmlSuggestionFourchette(ligneEx, serie, e, s)
              : htmlSuggestionCharge(ligneEx.exerciceId, serie.reps, serie.poids, e, s);
          }
          html += htmlChampsHero(ligneEx, serie, e, s, unilat);
          if (!estEchauffement) { html += htmlPanneauMini(ligneEx, serie, e, s); }
          html += '<button class="sx-valider" data-action="basculer-serie-faite"' + attrs + '>Valider la série</button>';
          html += '</div>';
          html += htmlNoteSerie(e, s, serie);
          continue;
        }

        /* ===== Autres séries : ligne compacte ===== */
        html += '<div class="sx-serie' + (serie.fait ? ' sx-serie-faite' : '') + (estEchauffement ? ' sx-serie-echauf' : '') + (estNouvelle ? ' sx-nouvelle' : '') + '">';
        html += '<span class="sx-serie-num">' + libelleNum + '</span>';
        html += htmlChampsCompact(ligneEx, serie, attrs, unilat);
        html += '<button class="bulle-validation' + (serie.fait ? ' bulle-validation-faite' : '') + '" data-action="basculer-serie-faite"' + attrs + '>&#10003;</button>';
        html += '<button class="bouton-note' + (serie.note ? ' bouton-note-remplie' : '') + '" data-action="basculer-note-serie"' + attrs + '>&#9998;</button>';
        html += '<button class="serie-suppr" data-action="supprimer-serie"' + attrs + '>&times;</button>';
        html += '</div>';
        html += htmlNoteSerie(e, s, serie);
      }

      /* RER + boutons d'ajout */
      /* RER : sélecteur 0 → 5+ */
      var rerDefini = (ligneEx.rer !== null && ligneEx.rer !== undefined && ligneEx.rer >= 0);
      html += '<div class="rer-zone" data-ex="' + e + '">';
      html += '<span class="rer-titre">RER</span>';
      html += '<div class="rer-choix">';
      html += '<span class="rer-indicateur ' + (rerDefini ? 'rer-pos-' + Math.min(5, ligneEx.rer) + ' rer-niv-' + Math.min(5, ligneEx.rer) : 'rer-aucun') + '"></span>';
      for (var r = 0; r <= 5; r++) {
        var rerActif = rerDefini && (r === 5 ? ligneEx.rer >= 5 : ligneEx.rer === r);
        html += '<button class="rer-bouton rer-niveau-' + r + (rerActif ? ' rer-bouton-actif' : '') + '" data-action="choisir-rer" data-ex="' + e + '" data-valeur="' + r + '">' + (r === 5 ? '5+' : r) + '</button>';
      }
      html += '</div></div>';
      html += '<div class="ligne-actions-exercice">';
      html += '<button class="btn btn-contour btn-action-serie" data-action="ajouter-serie" data-ex="' + e + '">+ Série</button>';
      html += '<button class="btn-action-echauffement" data-action="ajouter-serie-echauffement" data-ex="' + e + '" title="Ajouter une série d\'échauffement"><span class="icone-echauffement" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2c.9 2.1 2.2 3.6 3.6 5.1 1.8 1.9 3.4 3.9 3.4 6.9 0 4.4-3.1 8-7 8s-7-3.6-7-8c0-2.1.7-3.7 1.6-5.1.3 1.5 1.1 2.4 2.1 2.4 1 0 1.3-.8 1-1.9-.5-1.8-.4-4 .6-5.9C10.9 2.9 11.4 2.4 12 2z"/></svg></span></button>';
      html += '<button class="btn-action-style" data-action="choisir-style-exercice" data-ex="' + e + '" title="Changer le style" aria-label="Changer le style de l\'exercice">' + SVG_STYLE + '</button>';
      html += '</div>';
      if (ligneEx.technique === 'drop_set') {
        html += '<button class="btn btn-contour btn-bloc" style="margin-top:6px;" data-action="ajouter-serie-degressive" data-ex="' + e + '">+ Série dégressive (~70%)</button>';
      }
      html += '</div>'; /* fin corps */
    }
    html += '</div>'; /* fin carte */
    html += htmlFermetureGroupe(seance, e);
  }

  /* Tout est fait : invitation à terminer */
  if (seance.exercices.length > 0 && indexExerciceActif === -1) {
    html += '<div class="sx-fin"><div class="sx-fin-titre">Séance terminée &#127881;</div>';
    html += '<button class="sx-valider" data-action="terminer-seance">Enregistrer la séance</button></div>';
  }

  document.getElementById('seance-liste-exercices').innerHTML = html;
  dernierAjoutSerie = null;
  mettreAJourProgressionSeance(seriesFaites, totalSeries);

  var lignesRer = document.querySelectorAll('#seance-liste-exercices .rer-ligne');
  for (var r = 0; r < lignesRer.length; r++) { configurerGlisseRer(lignesRer[r]); }
  var barresRer = document.querySelectorAll('#seance-liste-exercices .rer-choix');
  for (var br = 0; br < barresRer.length; br++) { configurerGlisseRerBarre(barresRer[br]); }
}

function mettreAJourChrono() {
  if (!etat.seanceActive) { return; }
  var ecouleMs = Date.now() - etat.seanceActive.debut;
  var totalSecondes = Math.floor(ecouleMs / 1000);
  var minutes = Math.floor(totalSecondes / 60);
  var secondes = totalSecondes % 60;
  var affichage = document.getElementById('seance-chrono');
  if (affichage) { affichage.innerHTML = formaterDureeMinuteur(minutes * 60 + secondes); }
}

function modifierRerExercice(exIndex, valeur) {
  var val = parseInt(valeur, 10);
  if (isNaN(val)) { val = 3; }
  if (val < 0) { val = 0; }
  if (val > 10) { val = 10; }
  etat.seanceActive.exercices[exIndex].rer = val;
  sauvegarderEtat();
}

var RER_LIBELLES = ['Échec : 0 rep en réserve', '1 rep en réserve', '2 reps en réserve', '3 reps en réserve', '4 reps en réserve', '5 reps ou plus en réserve'];

function choisirRer(exIndex, valeur) {
  var ligne = etat.seanceActive.exercices[exIndex];
  appliquerRer(exIndex, (ligne.rer === valeur) ? null : valeur);
}

/* Applique la valeur et déplace la pastille sans tout redessiner */
function appliquerRer(exIndex, valeur) {
  var ligne = etat.seanceActive.exercices[exIndex];
  if (ligne.rer === valeur) { return; }
  ligne.rer = valeur;
  sauvegarderEtat();
  var zone = document.querySelector('.rer-zone[data-ex="' + exIndex + '"]');
  if (!zone) { return; }
  var defini = (valeur !== null && valeur !== undefined);
  var niveau = defini ? Math.min(5, valeur) : -1;
  var boutons = zone.querySelectorAll('.rer-bouton');
  for (var i = 0; i < boutons.length; i++) {
    var r = parseInt(boutons[i].getAttribute('data-valeur'), 10);
    if (defini && r === niveau) { boutons[i].classList.add('rer-bouton-actif'); } else { boutons[i].classList.remove('rer-bouton-actif'); }
  }
  var ind = zone.querySelector('.rer-indicateur');
  if (ind) { ind.className = 'rer-indicateur ' + (defini ? 'rer-pos-' + niveau + ' rer-niv-' + niveau : 'rer-aucun'); }
}

/* Glisser le doigt sur la barre RER (même principe que la barre de navigation) */
function configurerGlisseRerBarre(barre) {
  var zone = barre.parentNode;
  var exIndex = parseInt(zone.getAttribute('data-ex'), 10);
  var g = null;

  function indexDepuisX(x) {
    var r = barre.getBoundingClientRect();
    var i = Math.floor((x - r.left - 3) / ((r.width - 6) / 6));
    return Math.max(0, Math.min(5, i));
  }

  barre.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { g = null; return; }
    g = { x: e.touches[0].clientX, y: e.touches[0].clientY, glisse: false };
  }, false);

  barre.addEventListener('touchmove', function (e) {
    if (!g) { return; }
    var dx = e.touches[0].clientX - g.x;
    var dy = e.touches[0].clientY - g.y;
    if (!g.glisse) {
      if (Math.abs(dx) < 8) { return; }
      if (Math.abs(dy) > Math.abs(dx)) { g = null; return; }
      g.glisse = true;
    }
    e.preventDefault();
    appliquerRer(exIndex, indexDepuisX(e.touches[0].clientX));
  }, false);

  barre.addEventListener('touchend', function (e) {
    if (g && g.glisse && e.cancelable) { e.preventDefault(); }   /* évite le clic fantôme après un glissement */
    g = null;
  }, false);
  barre.addEventListener('touchcancel', function () { g = null; }, false);
}

/* Rend la ligne RER d'un exercice glissable au doigt/à la souris (même principe que le glissé
   des heures de sommeil) : on glisse horizontalement sur le chiffre lui-même pour le faire
   monter/descendre de 0 à 10, sans passer par le clavier. Les écouteurs de déplacement ne sont
   posés sur document que pendant le geste, puis retirés à son relâchement, pour ne rien laisser
   traîner d'un rendu à l'autre. */
function configurerGlisseRer(ligneElement) {
  var champ = ligneElement.querySelector('.rer-input');
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
    modifierRerExercice(exIndex, v);
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
  if (role === 'live-distance') { serie.distance = parseFloat(valeur) || 0; }
  if (role === 'live-note') { serie.note = valeur; }
  sauvegarderEtat();
}

var REPOS_AUTO = true;   /* false = le minuteur ne démarre plus tout seul */

function basculerSerieFaite(exIndex, serieIndex) {
  if (chronoMaintien.actif && chronoMaintien.ex === exIndex && chronoMaintien.serie === serieIndex) { arreterChronoMaintien(true); }
  if (miniPause.actif) { finirMiniPause(); }
  var serie = etat.seanceActive.exercices[exIndex].series[serieIndex];
  serie.fait = !serie.fait;
  var ligneEx = etat.seanceActive.exercices[exIndex];
  if (ligneEx.structure === 'echec' && serieIndex === indexDerniereSerieTravail(ligneEx)) {
    serie.echec = !!serie.fait;
    if (serie.fait && (ligneEx.rer === null || ligneEx.rer === undefined)) { ligneEx.rer = 0; }
  }
  sauvegarderEtat();
  rendreExercicesActifs();

  /* Repos automatique : seulement quand on VALIDE une série de travail, pas un échauffement,
     et pas si c'était la toute dernière série de la séance */
  if (REPOS_AUTO && serie.fait && !serie.echauffement && !suiteDansLeMemeTour(exIndex, serieIndex)) {
    var resteUneSerie = false;
    var exs = etat.seanceActive.exercices;
    for (var e = 0; e < exs.length && !resteUneSerie; e++) {
      for (var s = 0; s < exs[e].series.length; s++) {
        if (!exs[e].series[s].fait) { resteUneSerie = true; break; }
      }
    }
    if (resteUneSerie) {
      var totalMs = (derniereMinutesReglees * 60 + dernieresSecondesReglees) * 1000;
      if (totalMs > 0) { demarrerCompteARebours(totalMs); }
    }
  }
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

var rpeSeanceChoisi = null;
var RPE_LIBELLES = ['', 'Très facile', 'Facile', 'Léger', 'Modéré', 'Soutenu', 'Dur', 'Très dur', 'Intense', 'Très intense', 'Maximal'];

function terminerSeance() {
  if (!etat.seanceActive) { return; }
  rpeSeanceChoisi = null;
  rendreModalFinSeance();
}

function rendreModalFinSeance() {
  var html = '';
  html += '<div class="modal-entete"><h2>Terminer la séance</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="texte-att" style="margin-bottom:14px;">RPE : quel effort global as-tu ressenti ? (1 = très facile, 10 = maximal)</div>';
  html += '<div class="rpe-grille">';
  for (var n = 1; n <= 10; n++) {
    html += '<button class="rpe-bouton' + (rpeSeanceChoisi === n ? ' rpe-bouton-actif' : '') + '" data-action="choisir-rpe-seance" data-valeur="' + n + '">' + n + '</button>';
  }
  html += '</div>';
  html += '<div class="rpe-libelle">' + (rpeSeanceChoisi ? RPE_LIBELLES[rpeSeanceChoisi] : 'Optionnel') + '</div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="valider-fin-seance">Enregistrer la séance</button>';
  html += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="fermer-modal">Continuer la séance</button>';
  ouvrirModal(html);
}

function validerFinSeance() {
  if (!etat.seanceActive) { fermerModal(); return; }
  var finMs = Date.now();
  var dureeMinutes = Math.max(1, Math.round((finMs - etat.seanceActive.debut) / 60000));
  var calories = calculerCaloriesSeance(etat.seanceActive, dureeMinutes, etat.profil.poidsCorporel || 75);
  var resultat = { date: formaterDateISO(new Date()), exercices: etat.seanceActive.exercices };

  if (etat.seanceActive.agendaEntryId) {
    var entree = trouverParId(etat.agenda, etat.seanceActive.agendaEntryId);
    if (entree) {
      entree.statut = 'termine';
      entree.dureeMinutes = dureeMinutes;
      entree.caloriesEstimees = calories;
      entree.rpeSeance = rpeSeanceChoisi;
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
      rpeSeance: rpeSeanceChoisi,
      resultat: resultat
    });
  }

  etat.seanceActive = null;
  desactiverCommandeVocale(true);
  arreterCompteARebours();
  if (chronoIntervalle) { window.clearInterval(chronoIntervalle); chronoIntervalle = null; }
  sauvegarderEtat();
  fermerModal();
  afficherToast('Séance enregistrée : ' + dureeMinutes + ' min · ' + Math.round(calories) + ' kcal estimées.');
  allerVersPage('accueil');
}

function rendreGraphiqueRpe() {
  var zone = document.getElementById('progression-zone-rpe');
  if (!zone) { return; }
  var entrees = etat.agenda.filter(function (a) { return a.statut === 'termine' && a.rpeSeance; });
  entrees.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var points = entrees.map(function (e) { return { date: e.date, valeur: e.rpeSeance }; });
  zone.innerHTML = construireSvgCourbe(points, '/10', '#E0A73D');
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
  automnal:   ['automnal1', 'automnal2', 'automnal3', 'automnal4', 'automnal5', 'automnal6', 'automnal7'],
  effroi:     ['effroi1', 'effroi2', 'effroi3', 'effroi4', 'effroi5', 'effroi6', 'effroi7', 'effroi8'],
  hivernal:   ['hivernal1'],
  paindepice: ['paindepice1', 'paindepice2', 'paindepice3', 'paindepice4', 'paindepice5', 'paindepice6', 'paindepice7', 'paindepice8', 'paindepice9'],
  printanier: [],
  pastel:     [],
  estival:    ['estival1', 'estival2'],
  cyberpunk:  ['cyberpunk1', 'cyberpunk2', 'cyberpunk3', 'cyberpunk4', 'cyberpunk5', 'cyberpunk6', 'cyberpunk7', 'cyberpunk8', 'cyberpunk9', 'cyberpunk10'],
  steampunk:  [],
  flibuste:   ['pirate1', 'pirate2', 'pirate3'],
  ruedor:     ['western1', 'western2', "western3"],
  wasteland:  ['wasteland1', 'wasteland2', 'wasteland3', 'wasteland4', 'wasteland5', 'wasteland6', 'wasteland7', 'wasteland8', 'wasteland9', 'wasteland10', 'wasteland11'],
  classique:  ['classique'],
  douce:      ['douce'],
  alarme:     ['alarme']
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
  { valeur: 'classique', libelle: 'Classique', jouer: function (ctx, t) {
    jouerBip(ctx, t, 880, 0.2);
    jouerBip(ctx, t + 0.3, 880, 0.2);
    jouerBip(ctx, t + 0.6, 880, 0.2);
  } },
  { valeur: 'douce', libelle: 'Douce', jouer: function (ctx, t) {
    jouerBip(ctx, t, 440, 1.2);
  } },
  { valeur: 'alarme', libelle: 'Alarme', jouer: function (ctx, t) {
    for (var i = 0; i < 8; i++) { jouerBip(ctx, t + i * 0.12, 1200, 0.08); }
  } },

  { valeur: 'sombre', libelle: 'Sombre — pulsation grave', jouer: function (ctx, t) {
    sonNote(ctx, t, 220, 0.35, 'sine', 0.5);
    sonNote(ctx, t + 0.25, 293.7, 0.6, 'sine', 0.5);
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

function jouerSonnerie(choixForce) {
  var themeActif = etat.profil.theme || 'sombre';
  if (themeActif === 'auto') {
    themeActif = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'clair' : 'sombre';
  }
  var choix = choixForce || etat.profil.sonnerieMinuteur || 'theme';
  if (choix === 'theme') { choix = themeActif; }
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
  wasteland:  ["Nitro fueled !", "Vroum !", "Pied au plancher !", "Witness me !", "Boom !", "Plein gaz !", "Démarre !", "Ça va chauffer !", "Go faire des étincelles !", "Iron time...", "Brûle-moi ces calories !", "Dérouille !"],
  cyberpunk:  ["Reboot !", "Connexion...", "Supercharge !", "Hack !", "Online !", "Overdrive !", "Rechargé !"],
  paindepice: ["Lets Go ho ho !", "C'est l'heure de briller !", "Ding dong !", "Merveilleux !", "À table !"],
  hivernal:   ["Réchauffe-toi !", "Brrrr !", "Dégèle !", "En piste !", "Glisse !"],
  automnal:   ["Souffle !", "On se réchauffe !", "Il est temps !", "Ramasse tes poids !", "Encore !", "Reprend !"],
  steampunk:  ["Vapeur !", "Engrenage !", "Fais monter la pression !", "Tout à bord !", "Chauffe !", "Remonte les poids", "Relance la machine", "Au charbon !"],
  ruedor:     ["Yeehaw !", "En selle !", "Dégaine !", "Tire !", "C'est l'heure...", ],
  estival:    ["Soleil !", "Plouf !", "Vamos !", "Chaud devant !", "Ouiiii !", "Trempe le maillot !"],
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

function jouerMotFinMinuteur(sansVibration) {
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

  if (!sansVibration && navigator.vibrate) { try { navigator.vibrate([30, 40, 30]); } catch (e) {} }

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
      ? 'margin:0 0 12px 0; justify-content:center; width:100%; height:200px; touch-action:none;'
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
    html += '<span id="cdr-duree-affichage" class="cdr-duree-affichage">' + formaterDureeMinuteur(derniereMinutesReglees * 60 + dernieresSecondesReglees) + '</span>';
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

  if (typeof window.publierEtatVersIPad === 'function') {
    window.publierEtatVersIPad();
  }
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

  if (typeof window.publierEtatVersIPad === 'function') {
    window.publierEtatVersIPad();
  }
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
  if (typeof window.publierEtatVersIPad === 'function') {
    window.publierEtatVersIPad();
  }
}

function configurerGestesMinuteur() {
  var zone = document.getElementById('cdr-cercle-zone');
  if (!zone) { return; }
  var zoneTouche = document.getElementById('seance-zone-cdr') || zone;
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

  zoneTouche.addEventListener('touchstart', function (e) { debut(e.touches[0].clientY); }, { passive: true });
  zoneTouche.addEventListener('touchmove', function (e) { deplace(e.touches[0].clientY); }, { passive: true });
  zoneTouche.addEventListener('touchend', fin, false);
  zoneTouche.addEventListener('mousedown', function (e) { debut(e.clientY); });
  zoneTouche.addEventListener('mousemove', function (e) { deplace(e.clientY); });
  zoneTouche.addEventListener('mouseup', fin);
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
    sifflerVapeur();
    cdrCacherBouton = true;
    rendreZoneCompteARebours();
    jouerMotFinMinuteur(true);
    if (typeof window.publierEtatVersIPad === 'function') {
      window.publierEtatVersIPad(function (reponseBridge) {
        var alarmeSurIPad = !!(reponseBridge && reponseBridge.suppressPhoneAlarm);
        window.sporlIPadSuppressPhoneAlarm = alarmeSurIPad;
        if (!alarmeSurIPad) {
          jouerSonnerie();
          if (navigator.vibrate) { try { navigator.vibrate([30, 40, 30]); } catch (e) {} }
        }
      });
    } else {
      jouerSonnerie();
      if (navigator.vibrate) { try { navigator.vibrate([30, 40, 30]); } catch (e) {} }
    }
    return;
  }
  afficherCompteARebours(resteMs);
}

/* 75 secondes -> "1:15" ; 60 -> "1:00" ; 50 -> "50" (pas de zéro inutile) */
function formaterDureeMinuteur(totalSecondes) {
  var m = Math.floor(totalSecondes / 60);
  var s = totalSecondes % 60;
  if (m > 0) { return m + ':' + completerZero(s); }
  return String(s);
}

/* Agrandit le chrono au maximum sans toucher le bord du cercle */
var CDR_RAYON_UTILE_PX = 72;   /* rayon intérieur de l'anneau (82 px) moins une marge de 10 px */
function ajusterTailleChronoCdr(el) {
  var cle = String(el.textContent.length);
  if (el.getAttribute('data-cle') === cle) { return; }   /* même nombre de caractères : rien à refaire */
  el.style.fontSize = '100px';
  var largeur = el.offsetWidth;
  if (!largeur) { return; }
  var hauteur = 75;   /* hauteur approximative des chiffres à 100 px */
  var demiDiagonale = Math.sqrt((largeur / 2) * (largeur / 2) + (hauteur / 2) * (hauteur / 2));
  var taille = 100 * CDR_RAYON_UTILE_PX / demiDiagonale;
  taille = Math.max(24, Math.min(120, taille));
  el.style.fontSize = taille.toFixed(1) + 'px';
  el.setAttribute('data-cle', cle);
}

function afficherCompteARebours(resteMs) {
  var affichage = document.getElementById('cdr-affichage');
  if (!affichage) { return; }
  var totalSecondes = Math.ceil(resteMs / 1000);
  if (totalSecondes < 0) { totalSecondes = 0; }
  affichage.innerHTML = formaterDureeMinuteur(totalSecondes);
  ajusterTailleChronoCdr(affichage);

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
   BLOC : COMMANDE VOCALE (séance active)
   ============================================================ */

var voixActive = false;
var voixReco = null;
var voixDerniereActionMs = 0;
var voixFinDemandeeMs = 0;
var voixDerniereAction = '';
var VOIX_PAS_POIDS = 2.5;            /* kg ajoutés/retirés par "plus/moins de poids" : mets le même pas que tes boutons + / - */
var VOIX_PAS_REPS = 1;
var VOIX_LANCER_APRES_REGLAGE = true; /* true = "minuteur 90 secondes" règle ET lance le minuteur */

var verrouEcran = null;

function demanderVerrouEcran() {
  if (!('wakeLock' in navigator) || verrouEcran) { return; }
  navigator.wakeLock.request('screen').then(function (v) {
    verrouEcran = v;
    v.addEventListener('release', function () { verrouEcran = null; });
  }).catch(function () {});
}

function libererVerrouEcran() {
  if (verrouEcran) { verrouEcran.release(); verrouEcran = null; }
}

/* Le verrou saute quand l'app passe en arrière-plan : on le reprend au retour */
document.addEventListener('visibilitychange', function () {
  if (!document.hidden && (voixActive || etat.seanceActive)) { demanderVerrouEcran(); }
});

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
  demanderVerrouEcran();
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
  if (!etat.seanceActive) { libererVerrouEcran(); }
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

var VOIX_NOMBRES = { zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100 };

function voixEstMotNombre(mot) {
  return VOIX_NOMBRES.hasOwnProperty(mot);
}

/* "deux minutes trente" -> "2 minutes 30" (le navigateur écrit parfois les nombres en lettres) */
function voixNombresEnChiffres(texte) {
  var mots = texte.split(' ');
  var sortie = [];
  var i = 0;
  while (i < mots.length) {
    if (!voixEstMotNombre(mots[i])) { sortie.push(mots[i]); i++; continue; }
    var total = 0;
    var precedent = 0;
    while (i < mots.length && voixEstMotNombre(mots[i])) {
      var v = VOIX_NOMBRES[mots[i]];
      if (v === 100) { total = (total === 0 ? 1 : total) * 100; }
      else if (v === 20 && precedent === 4 && total === 4) { total = 80; }
      else { total += v; }
      precedent = v;
      i++;
      if (i + 1 < mots.length && mots[i] === 'et' && voixEstMotNombre(mots[i + 1])) { i++; }
    }
    sortie.push(String(total));
  }
  return sortie.join(' ');
}

/* Position de la série en cours : première série non validée de la séance */
function voixPositionEnCours() {
  if (!etat.seanceActive) { return null; }
  var exs = etat.seanceActive.exercices;
  for (var e = 0; e < exs.length; e++) {
    for (var s = 0; s < exs[e].series.length; s++) {
      if (exs[e].series[s].fait) { continue; }
      if (exs[e].groupe) {
        var pos = positionGroupe(etat.seanceActive, exs[e].groupe);
        if (pos) {
          var exG = exs[pos.ex];
          for (var s2 = 0; s2 < exG.series.length; s2++) {
            if (!exG.series[s2].fait) { return { ex: pos.ex, serie: s2 }; }
          }
        }
      }
      return { ex: e, serie: s };
    }
  }
  return null;
}

function validerSerieEnCoursVocal() {
  var pos = voixPositionEnCours();
  if (!pos) { return false; }
  basculerSerieFaite(pos.ex, pos.serie);
  return true;
}

function voixAjusterSerie(champ, delta) {
  var pos = voixPositionEnCours();
  if (!pos) { afficherToast('Toutes les séries sont déjà validées.'); return; }
  var serie = etat.seanceActive.exercices[pos.ex].series[pos.serie];
  if (champ === 'poids') {
    serie.poids = Math.max(0, Math.round((serie.poids + delta) * 100) / 100);
    afficherToast('🎤 ' + serie.poids + ' kg');
  } else {
    serie.reps = Math.max(0, serie.reps + delta);
    afficherToast('🎤 ' + serie.reps + ' reps');
  }
  sauvegarderEtat();
  rendreExercicesActifs();
}

function voixDefinirRer(valeur) {
  var pos = voixPositionEnCours();
  var exIndex = pos ? pos.ex : (etat.seanceActive.exercices.length - 1);
  if (valeur < 0) { return; }
  var niveau = Math.min(5, valeur);
  appliquerRer(exIndex, niveau);
  afficherToast('🎤 RER ' + (niveau === 5 ? '5+' : niveau));
}

/* Clique sur le bouton d'échauffement de l'exercice en cours (repéré par "chauff" dans son data-action) */
function voixAjouterEchauffement() {
  var pos = voixPositionEnCours();
  var bouton = null;
  if (pos) { bouton = document.querySelector('[data-action*="chauff"][data-ex="' + pos.ex + '"]'); }
  if (!bouton) { bouton = document.querySelector('.bloc-exercice-actif [data-action*="chauff"]'); }
  if (!bouton) { afficherToast('Bouton d\'échauffement introuvable.'); return; }
  bouton.click();
}

/* Lit une durée dans le texte : "2 minutes", "90 secondes", "1 minute 30", "30" -> secondes, ou null */
function voixExtraireDuree(t) {
  var total = 0;
  var trouve = false;
  var mMin = t.match(/(\d+) ?min/);
  var mSec = t.match(/(\d+) ?sec/);
  if (mMin) { total += parseInt(mMin[1], 10) * 60; trouve = true; }
  if (mSec) { total += parseInt(mSec[1], 10); trouve = true; }
  if (mMin && !mSec) {
    var mApres = t.match(/min\w* (?:et )?(\d+)\s*$/);
    if (mApres) { total += parseInt(mApres[1], 10); }
    else if (t.indexOf('demi') !== -1) { total += 30; }
  }
  if (!trouve) {
    var mNu = t.match(/minuteur (\d+)\s*$/);
    if (mNu) { total = parseInt(mNu[1], 10); trouve = true; }
  }
  if (!trouve || total <= 0) { return null; }
  return Math.min(total, 59 * 60 + 59);
}

function voixRegler(totalSec) {
  var minutes = Math.floor(totalSec / 60);
  var secondes = totalSec % 60;
  derniereMinutesReglees = minutes;
  dernieresSecondesReglees = secondes;
  var champMin = document.getElementById('cdr-minutes');
  var champSec = document.getElementById('cdr-secondes');
  if (champMin) { champMin.value = minutes; }
  if (champSec) { champSec.value = secondes; }
  var morceaux = [];
  if (minutes) { morceaux.push(minutes + ' min'); }
  if (secondes) { morceaux.push(secondes + ' s'); }
  afficherToast('🎤 Minuteur réglé : ' + morceaux.join(' '));
}

function voixDefinirSerie(champ, valeur) {
  var pos = voixPositionEnCours();
  if (!pos) { afficherToast('Toutes les séries sont déjà validées.'); return; }
  var serie = etat.seanceActive.exercices[pos.ex].series[pos.serie];
  if (champ === 'poids') {
    serie.poids = valeur;
    afficherToast('🎤 ' + serie.poids + ' kg');
  } else {
    serie.reps = Math.round(valeur);
    afficherToast('🎤 ' + serie.reps + ' reps');
  }
  sauvegarderEtat();
  rendreExercicesActifs();
}

function voixAjouterSerie() {
  var pos = voixPositionEnCours();
  var exIndex = pos ? pos.ex : (etat.seanceActive.exercices.length - 1);
  if (exIndex < 0) { return; }
  ajouterSerieLive(exIndex);
  afficherToast('🎤 Série ajoutée');
}

function traiterCommandeVocale(texte) {
  var t = normaliserTexteRecherche(texte).replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ');
  t = voixNombresEnChiffres(t);
  var action = null;
  var mRer = t.match(/\b(?:r ?e ?r|rere|erre|erreur|air|ere) ?(\d+)/);
  var mPoids = t.match(/\bpoids (\d+)(?: virgule (\d+))?/);
  var mReps = t.match(/\brep\w* (\d+)/);

  if (t.indexOf('desactiv') !== -1) { action = 'desactive'; }
  else if (mRer) { action = 'rer'; }
  else if (mPoids) { action = 'poids='; }
  else if (mReps) { action = 'reps='; }
  else if (/serie.*plus|plus.*serie/.test(t)) { action = 'serie+'; }
  else if (t.indexOf('minuteur') !== -1 || t.indexOf('minuterie') !== -1) { action = 'minuteur'; }
  else if (/\bstop\b/.test(t) || t.indexOf('annul') !== -1) { action = 'stop'; }
  else if (t.indexOf('echauff') !== -1) { action = 'echauffement'; }
  else if (/plus.*poid/.test(t)) { action = 'poids+'; }
  else if (/moins.*poid/.test(t)) { action = 'poids-'; }
  else if (/plus.*rep/.test(t)) { action = 'reps+'; }
  else if (/moins.*rep/.test(t)) { action = 'reps-'; }
  else if (t.indexOf('valid') !== -1) { action = 'valide'; }
  else if (t.indexOf('termin') !== -1) { action = 'terminer'; }
  if (!action) { return; }

  var maintenant = Date.now();
  if (action === voixDerniereAction && (maintenant - voixDerniereActionMs) < 1500) { return; }
  voixDerniereAction = action;
  voixDerniereActionMs = maintenant;

  if (action === 'desactive') { desactiverCommandeVocale(); return; }
  if (!etat.seanceActive) { return; }

  var confirmationFinOuverte = voixFinDemandeeMs && (maintenant - voixFinDemandeeMs) < 15000 && document.querySelector('[data-action="confirmation-valider"]');

  if (action === 'rer') { voixDefinirRer(parseInt(mRer[1], 10)); return; }
  if (action === 'poids=') { voixDefinirSerie('poids', parseFloat(mPoids[1] + (mPoids[2] ? '.' + mPoids[2] : ''))); return; }
  if (action === 'reps=') { voixDefinirSerie('reps', parseInt(mReps[1], 10)); return; }
  if (action === 'serie+') { voixAjouterSerie(); return; }

  if (action === 'minuteur') {
    var duree = voixExtraireDuree(t);
    if (duree !== null) {
      voixRegler(duree);
      if (!VOIX_LANCER_APRES_REGLAGE) { return; }
    }
    if (compteARebours.actif) { afficherToast('Le minuteur tourne déjà.'); return; }
    if (duree === null) { afficherToast('🎤 Minuteur'); }
    lancerCompteARebours();
    return;
  }

  if (action === 'stop') {
    if (confirmationFinOuverte) { voixFinDemandeeMs = 0; annulerConfirmation(); return; }
    if (compteARebours.actif) { arreterCompteARebours(); afficherToast('🎤 Minuteur arrêté'); }
    else { afficherToast('Aucun minuteur en cours.'); }
    return;
  }

  var posVoix = voixPositionEnCours();
  var pasVoix = posVoix ? pasPoidsPourExercice(posVoix.ex) : VOIX_PAS_POIDS;
  if (action === 'echauffement') { voixAjouterEchauffement(); return; }
  if (action === 'poids+') { voixAjusterSerie('poids', pasVoix); return; }
  if (action === 'poids-') { voixAjusterSerie('poids', -pasVoix); return; }
  if (action === 'reps+') { voixAjusterSerie('reps', VOIX_PAS_REPS); return; }
  if (action === 'reps-') { voixAjusterSerie('reps', -VOIX_PAS_REPS); return; }

  if (action === 'valide') {
    if (confirmationFinOuverte) { voixFinDemandeeMs = 0; validerConfirmation(); return; }
    if (validerSerieEnCoursVocal()) { afficherToast('🎤 Série validée'); }
    else { afficherToast('Toutes les séries sont déjà validées.'); }
    return;
  }

  if (action === 'terminer') {
    voixFinDemandeeMs = maintenant;
    terminerSeance();
  }
}

/* Appui long sur l'en-tête d'un exercice (séance active) : ouvre "Modifier l'exercice" */
(function () {
  var minuteur = null;
  var x0 = 0, y0 = 0;
  var blocClicJusqua = 0;

  function annuler() {
    if (minuteur) { window.clearTimeout(minuteur); minuteur = null; }
  }

  function debut(e, x, y) {
    var tete = e.target.closest ? e.target.closest('.sx-exo-tete') : null;
    if (!tete) { return; }
    var exIndex = parseInt(tete.getAttribute('data-ex'), 10);
    x0 = x; y0 = y;
    annuler();
    minuteur = window.setTimeout(function () {
      minuteur = null;
      blocClicJusqua = Date.now() + 700;
      if (navigator.vibrate) { navigator.vibrate(15); }
      var ligne = etat.seanceActive ? etat.seanceActive.exercices[exIndex] : null;
      if (ligne) { ouvrirFormulaireExercice(ligne.exerciceId); }
    }, 500);
  }

  function bouge(x, y) {
    if (minuteur && (Math.abs(x - x0) > 10 || Math.abs(y - y0) > 10)) { annuler(); }
  }

  var zone = document.getElementById('seance-liste-exercices');
  if (zone) {
    zone.addEventListener('touchstart', function (e) { debut(e, e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    zone.addEventListener('touchmove', function (e) { bouge(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    zone.addEventListener('touchend', annuler, false);
    zone.addEventListener('touchcancel', annuler, false);
    zone.addEventListener('mousedown', function (e) { debut(e, e.clientX, e.clientY); });
    zone.addEventListener('mousemove', function (e) { bouge(e.clientX, e.clientY); });
    zone.addEventListener('mouseup', annuler);
  }

  /* Évite que le clic qui suit l'appui long replie l'exercice ou ferme la modale */
  document.addEventListener('click', function (e) {
    if (Date.now() < blocClicJusqua) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
})();

/* ===== Changer le style d'un exercice en cours de séance ===== */

var SVG_STYLE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="12" y2="6"/><circle cx="15" cy="6" r="2.5"/><line x1="17.5" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="6" y2="12"/><circle cx="9" cy="12" r="2.5"/><line x1="11.5" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="13" y2="18"/><circle cx="16" cy="18" r="2.5"/><line x1="18.5" y1="18" x2="20" y2="18"/></svg>';
var exerciceStyleEnCours = null;

function nomCategorieType(idCat) {
  for (var i = 0; i < CATEGORIES_TYPES.length; i++) {
    if (CATEGORIES_TYPES[i].id === idCat) { return CATEGORIES_TYPES[i].nom; }
  }
  return '';
}

function ligneStyle(champ, valeur, nom, meta, avecAide, active) {
  var h = '<div class="type-choix style-ligne">';
  h += '<button class="selecteur-ligne' + (active ? ' selecteur-ligne-active' : '') + '" data-action="choisir-style-seance" data-champ="' + champ + '" data-valeur="' + valeur + '">';
  h += '<span class="selecteur-ligne-textes"><span class="selecteur-ligne-nom">' + echapperHtml(nom) + '</span>';
  if (meta) { h += '<span class="selecteur-ligne-meta">' + echapperHtml(meta) + '</span>'; }
  h += '</span><span class="selecteur-coche">&#10003;</span></button>';
  if (avecAide) { h += '<button class="btn-aide-type" data-action="aide-style-seance" data-id="' + valeur + '" aria-label="Explication">?</button>'; }
  return h + '</div>';
}

var styleOngletEnCours = 'structure';

function htmlListeStyle(champ, valeurActive) {
  var h = '', i;
  if (champ === 'technique') {
    for (i = 0; i < TECHNIQUES_INTENSIFICATION.length; i++) {
      var tech = TECHNIQUES_INTENSIFICATION[i];
      h += ligneStyle(champ, tech.valeur, tech.libelle, '', tech.valeur !== 'aucune', tech.valeur === valeurActive);
    }
    return h;
  }
  for (var c = 0; c < CATEGORIES_TYPES.length; c++) {
    var cat = CATEGORIES_TYPES[c], groupe = '';
    for (i = 0; i < TYPES_EXERCICE.length; i++) {
      var t = TYPES_EXERCICE[i];
      if (t.cat !== cat.id || !estTypePrincipal(t)) { continue; }
      groupe += ligneStyle(champ, t.id, t.nom, '', true, t.id === valeurActive);
    }
    if (groupe !== '') { h += '<div class="selecteur-groupe">' + echapperHtml(cat.nom) + '</div>' + groupe; }
  }
  return h;
}

function ouvrirChoixStyleExercice(exIndex, onglet) {
  if (!etat.seanceActive) { return; }
  exerciceStyleEnCours = exIndex;
  if (onglet) { styleOngletEnCours = onglet; }
  var ligne = etat.seanceActive.exercices[exIndex];
  var exRef = trouverParId(etat.exercices, ligne.exerciceId);
  var html = '<div class="modal-entete"><h2>' + echapperHtml(exRef ? exRef.nom : 'Exercice') + '</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="sous-onglets" style="margin-bottom:12px;">';
  html += '<button class="sous-onglet' + (styleOngletEnCours === 'structure' ? ' sous-onglet-actif' : '') + '" data-action="onglet-style" data-onglet="structure">Type</button>';
  html += '<button class="sous-onglet' + (styleOngletEnCours === 'technique' ? ' sous-onglet-actif' : '') + '" data-action="onglet-style" data-onglet="technique">Dernière série</button>';
  html += '</div>';
  var valeur = (styleOngletEnCours === 'technique') ? (ligne.technique || 'aucune') : (ligne.structure || 'lineaire');
  html += htmlListeStyle(styleOngletEnCours, valeur);
  html += '<div class="modal-pied modal-pied-ligne"><button class="btn btn-contour" style="flex:1;" data-action="style-par-defaut" data-ex="' + exIndex + '">Par défaut</button>';
  html += '<button class="btn btn-plein" style="flex:1.4;" data-action="fermer-modal">Terminé</button></div>';
  ouvrirModal(html);
  document.getElementById('modal-contenu').scrollTop = 0;
}

/* Applique le choix tout de suite et déplace la coche sans redessiner la feuille */
function choisirStyleSeance(champ, valeur) {
  if (exerciceStyleEnCours === null || !etat.seanceActive) { return; }
  changerStyleExercice(exerciceStyleEnCours, champ, valeur);
  var lignes = document.querySelectorAll('[data-action="choisir-style-seance"][data-champ="' + champ + '"]');
  for (var i = 0; i < lignes.length; i++) {
    if (lignes[i].getAttribute('data-valeur') === valeur) { lignes[i].classList.add('selecteur-ligne-active'); }
    else { lignes[i].classList.remove('selecteur-ligne-active'); }
  }
}

function changerStyleExercice(exIndex, champ, valeur) {
  var ligne = etat.seanceActive.exercices[exIndex];
  if (champ === 'technique') {
    ligne.technique = valeur;
  } else if (ligne.structure !== valeur) {
    var ancienne = ligne.structure || 'lineaire';
    ligne.structure = valeur;
    if (valeur === 'fourchette' && !(ligne.repsMax > 0)) {
      var premiere = null;
      for (var f = 0; f < ligne.series.length; f++) {
        if (!ligne.series[f].echauffement) { premiere = ligne.series[f]; break; }
      }
      ligne.repsMin = premiere ? premiere.reps : 8;
      ligne.repsMax = ligne.repsMin + 4;
    }
    if (STRUCTURES_CALCULEES.indexOf(valeur) !== -1 || STRUCTURES_CALCULEES.indexOf(ancienne) !== -1) {
      recalculerSeriesRestantes(ligne);
    }
  }
  sauvegarderEtat();
  rendreExercicesActifs();
}

/* Recalcule poids et reps des séries de travail pas encore validées ; les séries faites ne bougent pas */
function recalculerSeriesRestantes(ligne) {
  var travail = [];
  for (var i = 0; i < ligne.series.length; i++) {
    if (!ligne.series[i].echauffement) { travail.push(ligne.series[i]); }
  }
  if (travail.length === 0) { return; }
  var poidsBase = (ligne.poidsBase !== undefined) ? ligne.poidsBase : travail[0].poids;
  var repsBase = (ligne.repsBase !== undefined) ? ligne.repsBase : travail[0].reps;
  var neuves = genererSeriesSelonStructure(ligne.structure, poidsBase, repsBase, travail.length);
  for (var k = 0; k < travail.length; k++) {
    if (!travail[k].fait) { travail[k].poids = neuves[k].poids; travail[k].reps = neuves[k].reps; }
  }
}

function definirStyleParDefaut(exIndex) {
  var ligne = etat.seanceActive.exercices[exIndex];
  var exRef = trouverParId(etat.exercices, ligne.exerciceId);
  if (!exRef) { return; }
  exRef.typeDefaut = ligne.structure || 'lineaire';
  exRef.techniqueDefaut = ligne.technique || 'aucune';
  sauvegarderEtat();
  afficherToast('Style enregistré par défaut pour cet exercice.');
}

/* ===== Types fourchette de reps et jusqu'à l'échec ===== */

function indexDerniereSerieTravail(ligneEx) {
  for (var i = ligneEx.series.length - 1; i >= 0; i--) {
    if (!ligneEx.series[i].echauffement) { return i; }
  }
  return -1;
}

/* Double progression : haut de la fourchette atteint => +2,5 kg et retour au bas ; sinon même charge, une rep de plus */
function suggestionFourchette(ligneEx) {
  var repsMin = ligneEx.repsMin, repsMax = ligneEx.repsMax;
  var reprise = dateRepriseAnalyse();
  var derniere = derniereOccurrenceExercice(ligneEx.exerciceId);
  if (!derniere || (reprise && derniere.date <= reprise)) { return null; }
  var series = derniere.ligneEx.series;
  var maxPoids = 0, i;
  for (i = 0; i < series.length; i++) {
    if (!series[i].echauffement && series[i].fait && series[i].poids > maxPoids) { maxPoids = series[i].poids; }
  }
  if (maxPoids <= 0) { return null; }
  var nb = 0, minReps = 9999;
  for (i = 0; i < series.length; i++) {
    if (series[i].echauffement || !series[i].fait || series[i].poids !== maxPoids) { continue; }
    nb++;
    if (series[i].reps < minReps) { minReps = series[i].reps; }
  }
  if (nb === 0) { return null; }
  if (minReps >= repsMax) { return { poids: arrondirPoids(maxPoids + pasPoidsPourExercice(ligneEx.exerciceId)), reps: repsMin, raison: 'progression' }; }
  return { poids: maxPoids, reps: Math.min(repsMax, Math.max(repsMin, minReps + 1)), raison: 'reps' };
}

function htmlSuggestionFourchette(ligneEx, serie, exIndex, serieIndex) {
  var estEchec = (ligneEx.structure === 'echec');
  var sug = estEchec ? suggestionEchec(ligneEx) : suggestionFourchette(ligneEx);
  if (!sug && estEchec) { return htmlSuggestionCharge(ligneEx.exerciceId, serie.reps, serie.poids, exIndex, serieIndex); }
  if (!sug || (Math.abs(sug.poids - serie.poids) < 0.01 && sug.reps === serie.reps)) { return ''; }
  var h = '<button class="sx-suggestion" data-action="appliquer-suggestion-fourchette" data-ex="' + exIndex + '" data-poids="' + sug.poids + '" data-reps="' + sug.reps + '">';
  h += '<span class="sx-suggestion-icone">💡</span>';
  h += '<span class="sx-suggestion-poids donnee-num">' + nombreCourt(sug.poids) + ' kg × ' + sug.reps + '</span>';
  h += '<span class="sx-suggestion-raison">' + (sug.raison === 'progression' ? 'progression' : (sug.raison === 'stable' ? 'même charge' : 'plus de reps')) + '</span></button>';
  return h;
}

/* Applique la suggestion à toutes les séries de travail pas encore validées */
function appliquerSuggestionFourchette(exIndex, poids, reps) {
  var series = etat.seanceActive.exercices[exIndex].series;
  for (var i = 0; i < series.length; i++) {
    if (!series[i].echauffement && !series[i].fait) { series[i].poids = poids; series[i].reps = reps; }
  }
  sauvegarderEtat();
  rendreExercicesActifs();
}

/* ===== Maintien chronométré, poids du corps, cardio ===== */

var PAS_SECONDES_STEPPER = 5;
var PAS_MINUTES_STEPPER = 5;
var PAS_DISTANCE_STEPPER = 0.5;
var chronoMaintien = { actif: false, ex: null, serie: null, debut: 0, cibleAtteinte: false, intervalle: null };

function formaterSecondes(sec) {
  return completerZero(Math.floor(sec / 60)) + ':' + completerZero(sec % 60);
}

/* Champs de la série en cours, selon le type */
function obtenirEquipementExercice(exIndexOuId) {
  var ligneEx = null;
  var exRef = null;
  if (typeof exIndexOuId === 'number') {
    if (etat.seanceActive && etat.seanceActive.exercices[exIndexOuId]) {
      ligneEx = etat.seanceActive.exercices[exIndexOuId];
      exRef = trouverParId(etat.exercices, ligneEx.exerciceId);
    }
  } else if (exIndexOuId) {
    exRef = trouverParId(etat.exercices, exIndexOuId);
  }
  var cle = (ligneEx && ligneEx.equipement) || (exRef && exRef.equipement) || 'aucun';
  return EQUIPEMENTS_POIDS[cle] || EQUIPEMENTS_POIDS.aucun;
}

function pasPoidsPourExercice(exIndexOuId) {
  return obtenirEquipementExercice(exIndexOuId).pas;
}

function htmlChampsHero(ligneEx, serie, e, s, unilat) {
  var type = ligneEx.structure || 'lineaire';
  var sansCharge = (type === 'poids_corps' || type === 'maintien');
  var h = '<div class="sx-hero-champs">';
  if (type === 'cardio') {
    h += htmlStepper(e, s, 'reps', serie.reps, 'minutes', PAS_MINUTES_STEPPER);
    h += htmlStepper(e, s, 'distance', serie.distance || 0, 'km', PAS_DISTANCE_STEPPER);
  } else {
    if (!sansCharge || serie.poids > 0) {
      h += htmlStepper(e, s, 'poids', serie.poids, sansCharge ? 'kg de lest' : (unilat ? 'kg / côté' : 'kg'), pasPoidsPourExercice(e));
    }
    if (type === 'maintien') {
      h += htmlStepper(e, s, 'reps', serie.reps, unilat ? 'secondes / côté' : 'secondes', PAS_SECONDES_STEPPER);
    } else {
      h += htmlStepper(e, s, 'reps', serie.reps, unilat ? 'reps / côté' : 'reps', PAS_REPS_STEPPER);
    }
  }
  h += '</div>';
  if (sansCharge && !(serie.poids > 0)) {
    h += '<button class="sx-lest" data-action="ajouter-lest" data-ex="' + e + '">+ lest</button>';
  }
  if (type === 'maintien') { h += htmlChronoMaintien(e, s, serie); }
  return h;
}

/* Champs des autres séries (lignes compactes), selon le type */
function htmlChampsCompact(ligneEx, serie, attrs, unilat) {
  var type = ligneEx.structure || 'lineaire';
  var sansCharge = (type === 'poids_corps' || type === 'maintien');
  var h = '';
  if (type !== 'cardio' && (!sansCharge || serie.poids > 0)) {
    h += '<span class="serie-champ"><input type="number" step="0.5" inputmode="decimal" data-role="live-poids"' + attrs + ' value="' + serie.poids + '"></span><span class="serie-unite">' + (unilat ? 'kg/côté' : 'kg') + '</span>';
  }
  var unite = unilat ? 'reps/côté' : 'reps';
  if (type === 'maintien') { unite = unilat ? 's/côté' : 's'; }
  if (type === 'cardio') { unite = 'min'; }
  h += '<span class="serie-champ"><input type="number" step="1" inputmode="numeric" data-role="live-reps"' + attrs + ' value="' + serie.reps + '"></span><span class="serie-unite">' + unite + '</span>';
  if (type === 'cardio') {
    h += '<span class="serie-champ"><input type="number" step="0.1" inputmode="decimal" data-role="live-distance"' + attrs + ' value="' + (serie.distance || 0) + '"></span><span class="serie-unite">km</span>';
  }
  return h;
}

/* « + lest » : fait apparaître le champ kg sur les séries restantes */
function ajouterLest(exIndex) {
  var series = etat.seanceActive.exercices[exIndex].series;
  var pas = pasPoidsPourExercice(exIndex);
  for (var i = 0; i < series.length; i++) {
    if (!series[i].echauffement && !series[i].fait && !(series[i].poids > 0)) { series[i].poids = pas; }
  }
  sauvegarderEtat();
  rendreExercicesActifs();
}

/* --- Chrono du maintien : il compte depuis 0, bipe à la durée cible, s'arrête et inscrit le temps tenu --- */
function secondesChronoMaintien() {
  return Math.floor((Date.now() - chronoMaintien.debut) / 1000);
}

function htmlChronoMaintien(exIndex, serieIndex, serie) {
  var actif = chronoMaintien.actif && chronoMaintien.ex === exIndex && chronoMaintien.serie === serieIndex;
  var h = '<button class="sx-chrono-maintien' + (actif ? ' sx-chrono-actif' : '') + (actif && chronoMaintien.cibleAtteinte ? ' sx-chrono-ok' : '') + '" data-action="chrono-maintien" data-ex="' + exIndex + '" data-serie="' + serieIndex + '">';
  h += '<span class="sx-chrono-icone">' + (actif ? '&#9632;' : '&#9654;') + '</span>';
  h += '<span class="sx-chrono-temps donnee-num"' + (actif ? ' id="chrono-maintien-temps"' : '') + '>' + formaterSecondes(actif ? secondesChronoMaintien() : 0) + '</span>';
  h += '<span class="sx-chrono-cible donnee-num">/ ' + serie.reps + ' s</span></button>';
  return h;
}

function basculerChronoMaintien(exIndex, serieIndex) {
  if (chronoMaintien.actif) { arreterChronoMaintien(true); return; }
  var ctx = obtenirContexteAudio();
  if (ctx && ctx.resume) { ctx.resume(); }
  chronoMaintien = { actif: true, ex: exIndex, serie: serieIndex, debut: Date.now(), cibleAtteinte: false, intervalle: null };
  chronoMaintien.intervalle = window.setInterval(tickChronoMaintien, 250);
  rendreExercicesActifs();
}

function tickChronoMaintien() {
  if (!chronoMaintien.actif || !etat.seanceActive) { arreterChronoMaintien(false); return; }
  var sec = secondesChronoMaintien();
  var el = document.getElementById('chrono-maintien-temps');
  if (el) { el.innerHTML = formaterSecondes(sec); }
  var ligne = etat.seanceActive.exercices[chronoMaintien.ex];
  var serie = ligne ? ligne.series[chronoMaintien.serie] : null;
  if (!chronoMaintien.cibleAtteinte && serie && serie.reps > 0 && sec >= serie.reps) {
    chronoMaintien.cibleAtteinte = true;
    var ctx = obtenirContexteAudio();
    if (ctx) { jouerBip(ctx, ctx.currentTime + 0.02, 880, 0.3); }
    if (navigator.vibrate) { try { navigator.vibrate([30, 40, 30]); } catch (e) {} }
    var bouton = document.querySelector('.sx-chrono-actif');
    if (bouton) { bouton.classList.add('sx-chrono-ok'); }
  }
}

function arreterChronoMaintien(enregistrer) {
  if (chronoMaintien.intervalle) { window.clearInterval(chronoMaintien.intervalle); }
  var etaitActif = chronoMaintien.actif;
  var sec = etaitActif ? secondesChronoMaintien() : 0;
  var ex = chronoMaintien.ex, se = chronoMaintien.serie;
  chronoMaintien = { actif: false, ex: null, serie: null, debut: 0, cibleAtteinte: false, intervalle: null };
  if (etaitActif && enregistrer && etat.seanceActive && etat.seanceActive.exercices[ex]) {
    var serie = etat.seanceActive.exercices[ex].series[se];
    if (serie && sec > 0) { serie.reps = sec; sauvegarderEtat(); }
  }
  rendreExercicesActifs();
}

/* ===== Mini-pauses : rest-pause, myo-reps, cluster ===== */

var PAUSES_MINI = { rest_pause: 20, myo_reps: 15, cluster: 15 };   /* secondes de pause entre les mini-séries ou les grappes */
var REPS_MINI_DEFAUT = { rest_pause: 3, myo_reps: 4 };
var miniPause = { actif: false, ex: null, serie: null, duree: 0, fin: 0, intervalle: null };

/* Arrête la mini-pause et remet le bouton à zéro, sans redessiner l'écran (on ne perd pas une saisie en cours) */
function finirMiniPause() {
  if (miniPause.intervalle) { window.clearInterval(miniPause.intervalle); }
  miniPause = { actif: false, ex: null, serie: null, duree: 0, fin: 0, intervalle: null };
  var bouton = document.querySelector('.sx-mini-actif');
  if (bouton) {
    bouton.classList.remove('sx-mini-actif');
    bouton.querySelector('.sx-mini-texte').textContent = bouton.getAttribute('data-libelle');
    bouton.querySelector('.sx-mini-barre i').style.width = '0%';
  }
}

function lancerMiniPause(exIndex, serieIndex, secondes) {
  finirMiniPause();
  var ctx = obtenirContexteAudio();
  if (ctx && ctx.resume) { ctx.resume(); }
  miniPause = { actif: true, ex: exIndex, serie: serieIndex, duree: secondes, fin: Date.now() + secondes * 1000, intervalle: null };
  miniPause.intervalle = window.setInterval(tickMiniPause, 200);
}

function tickMiniPause() {
  if (!miniPause.actif || !etat.seanceActive) { finirMiniPause(); return; }
  var reste = miniPause.fin - Date.now();
  if (reste <= 0) {
    var ctx = obtenirContexteAudio();
    if (ctx) {
      var t = ctx.currentTime + 0.02;
      jouerBip(ctx, t, 880, 0.15);
      jouerBip(ctx, t + 0.22, 1175, 0.25);
    }
    if (navigator.vibrate) { try { navigator.vibrate([30, 40, 30]); } catch (e) {} }
    finirMiniPause();
    return;
  }
  var bouton = document.querySelector('.sx-mini-actif');
  if (bouton) {
    bouton.querySelector('.sx-mini-texte').textContent = Math.ceil(reste / 1000) + ' s';
    bouton.querySelector('.sx-mini-barre i').style.width = Math.round(reste / (miniPause.duree * 1000) * 100) + '%';
  }
}

function htmlBoutonMiniPause(action, libelle, e, s, secondes) {
  var actif = miniPause.actif && miniPause.ex === e && miniPause.serie === s;
  var repos = libelle + ' · ' + secondes + ' s';
  var fraction = actif ? Math.max(0, (miniPause.fin - Date.now()) / (miniPause.duree * 1000)) : 0;
  var h = '<button class="sx-mini-pause' + (actif ? ' sx-mini-actif' : '') + '" data-action="' + action + '" data-ex="' + e + '" data-serie="' + s + '" data-libelle="' + echapperHtml(repos) + '">';
  h += '<span class="sx-mini-barre"><i style="width:' + Math.round(fraction * 100) + '%"></i></span>';
  h += '<span class="sx-mini-texte">' + (actif ? Math.ceil(fraction * secondes) + ' s' : echapperHtml(repos)) + '</span></button>';
  return h;
}

/* Rest-pause et myo-reps : mini-séries après la série principale, sur la dernière série de travail */
function htmlPanneauMiniSeries(ligneEx, serie, e, s) {
  var minis = serie.minis || [];
  var h = '<div class="sx-mini">';
  if (minis.length > 0) {
    h += '<div class="sx-mini-liste">';
    for (var m = 0; m < minis.length; m++) {
      h += '<input class="sx-mini-reps donnee-num" type="number" inputmode="numeric" step="1" min="0" data-role="live-mini" data-ex="' + e + '" data-serie="' + s + '" data-mini="' + m + '" value="' + minis[m] + '">';
    }
    h += '<span class="sx-mini-unite">reps</span>';
    h += '<button class="sx-mini-suppr" data-action="retirer-mini-serie" data-ex="' + e + '" data-serie="' + s + '" aria-label="Retirer la dernière mini-série">&times;</button></div>';
  }
  h += htmlBoutonMiniPause('mini-serie', '+ mini-série', e, s, PAUSES_MINI[ligneEx.technique]);
  return h + '</div>';
}

/* Cluster : une pastille par grappe, une pause entre les grappes */
function htmlPanneauCluster(ligneEx, serie, e, s) {
  var total = ligneEx.grappes > 0 ? ligneEx.grappes : 4;
  var faites = Math.min(total, serie.grappes || 0);
  var repsGrappe = Math.max(1, Math.round(serie.reps / total));
  var h = '<div class="sx-mini"><div class="sx-grappes">';
  for (var g = 0; g < total; g++) { h += '<span class="sx-grappe' + (g < faites ? ' sx-grappe-faite' : '') + '"></span>'; }
  h += '<span class="sx-grappes-info donnee-num">' + repsGrappe + ' reps × ' + total + '</span>';
  if (faites > 0) { h += '<button class="sx-mini-suppr" data-action="grappe-moins" data-ex="' + e + '" data-serie="' + s + '" aria-label="Annuler une grappe">&minus;</button>'; }
  h += '</div>';
  if (faites < total) { h += htmlBoutonMiniPause('grappe-faite', '✓ Grappe faite', e, s, PAUSES_MINI.cluster); }
  return h + '</div>';
}

function htmlPanneauMini(ligneEx, serie, e, s) {
  if (ligneEx.structure === 'cluster') { return htmlPanneauCluster(ligneEx, serie, e, s); }
  var tech = ligneEx.technique;
  if ((tech === 'rest_pause' || tech === 'myo_reps') && s === indexDerniereSerieTravail(ligneEx)) {
    return htmlPanneauMiniSeries(ligneEx, serie, e, s);
  }
  return '';
}

function ajouterMiniSerie(exIndex, serieIndex) {
  var ligne = etat.seanceActive.exercices[exIndex];
  var serie = ligne.series[serieIndex];
  if (!serie.minis) { serie.minis = []; }
  var reps = serie.minis.length > 0 ? serie.minis[serie.minis.length - 1] : (REPS_MINI_DEFAUT[ligne.technique] || 3);
  serie.minis.push(reps);
  sauvegarderEtat();
  lancerMiniPause(exIndex, serieIndex, PAUSES_MINI[ligne.technique] || 15);
  rendreExercicesActifs();
}

function retirerMiniSerie(exIndex, serieIndex) {
  var serie = etat.seanceActive.exercices[exIndex].series[serieIndex];
  if (serie.minis && serie.minis.length > 0) { serie.minis.pop(); }
  finirMiniPause();
  sauvegarderEtat();
  rendreExercicesActifs();
}

function modifierMiniSerie(exIndex, serieIndex, miniIndex, valeur) {
  var serie = etat.seanceActive.exercices[exIndex].series[serieIndex];
  if (serie.minis) { serie.minis[miniIndex] = parseInt(valeur, 10) || 0; sauvegarderEtat(); }
}

function grappeFaite(exIndex, serieIndex) {
  var ligne = etat.seanceActive.exercices[exIndex];
  var serie = ligne.series[serieIndex];
  var total = ligne.grappes > 0 ? ligne.grappes : 4;
  serie.grappes = Math.min(total, (serie.grappes || 0) + 1);
  sauvegarderEtat();
  if (serie.grappes < total) { lancerMiniPause(exIndex, serieIndex, PAUSES_MINI.cluster); }
  else { finirMiniPause(); }
  rendreExercicesActifs();
}

function grappeMoins(exIndex, serieIndex) {
  var serie = etat.seanceActive.exercices[exIndex].series[serieIndex];
  serie.grappes = Math.max(0, (serie.grappes || 0) - 1);
  finirMiniPause();
  sauvegarderEtat();
  rendreExercicesActifs();
}

/* ===== Jusqu'à l'échec : progression ===== */
var ECHEC_MARGE_REPS = 2;   /* reps au-dessus de l'objectif à partir desquelles on propose +2,5 kg */

function suggestionEchec(ligneEx) {
  var cible = ligneEx.repsMin > 0 ? ligneEx.repsMin : 0;
  if (!(cible > 0)) { return null; }
  var reprise = dateRepriseAnalyse();
  var derniere = derniereOccurrenceExercice(ligneEx.exerciceId);
  if (!derniere || (reprise && derniere.date <= reprise)) { return null; }

  /* la dernière série marquée « à l'échec » de la séance précédente */
  var series = derniere.ligneEx.series;
  var amrap = null;
  for (var i = series.length - 1; i >= 0; i--) {
    if (series[i].echec && series[i].fait) { amrap = series[i]; break; }
  }
  if (!amrap || !(amrap.poids > 0)) { return null; }

  var cibleAvant = derniere.ligneEx.repsMin > 0 ? derniere.ligneEx.repsMin : cible;
  if (amrap.reps >= cibleAvant + ECHEC_MARGE_REPS) {
    return { poids: arrondirPoids(amrap.poids + PAS_POIDS_STEPPER), reps: cible, raison: 'progression' };
  }
  return { poids: amrap.poids, reps: cible, raison: 'stable' };
}

/* ===== Superset / circuit : exercices enchaînés ===== */

function indicesTravailExercice(ligneEx) {
  var r = [];
  for (var i = 0; i < ligneEx.series.length; i++) {
    if (!ligneEx.series[i].echauffement) { r.push(i); }
  }
  return r;
}

function indicesGroupe(seance, groupeId) {
  var r = [];
  for (var i = 0; i < seance.exercices.length; i++) {
    if (seance.exercices[i].groupe === groupeId) { r.push(i); }
  }
  return r;
}

/* rang d'une série parmi les séries de travail de son exercice (0 = premier tour) */
function indexTravailSerie(ligneEx, serieIndex) {
  var n = 0;
  for (var i = 0; i < serieIndex; i++) {
    if (!ligneEx.series[i].echauffement) { n++; }
  }
  return n;
}

/* La série en cours d'un groupe : on avance tour par tour, exercice par exercice (A1, B1, A2, B2…) */
function positionGroupe(seance, groupeId) {
  var membres = indicesGroupe(seance, groupeId);
  var travail = [];
  var tours = 0, k, r;
  for (k = 0; k < membres.length; k++) {
    travail.push(indicesTravailExercice(seance.exercices[membres[k]]));
    if (travail[k].length > tours) { tours = travail[k].length; }
  }
  for (r = 0; r < tours; r++) {
    for (k = 0; k < membres.length; k++) {
      if (travail[k].length > r && !seance.exercices[membres[k]].series[travail[k][r]].fait) {
        return { ex: membres[k], serie: travail[k][r] };
      }
    }
  }
  return null;
}

/* Vrai si l'exercice suivant du groupe est dans le même tour : pas de repos */
function suiteDansLeMemeTour(exIndex, serieIndex) {
  var seance = etat.seanceActive;
  var ligne = seance.exercices[exIndex];
  if (!ligne.groupe) { return false; }
  var suivante = positionGroupe(seance, ligne.groupe);
  if (!suivante) { return false; }
  return indexTravailSerie(seance.exercices[suivante.ex], suivante.serie) === indexTravailSerie(ligne, serieIndex);
}

/* Cadre qui s'ouvre sur le premier exercice d'un groupe, avec « Tour k / n » */
function htmlOuvertureGroupe(seance, e) {
  var g = seance.exercices[e].groupe;
  if (!g || (e > 0 && seance.exercices[e - 1].groupe === g)) { return ''; }
  var membres = indicesGroupe(seance, g);
  var tours = 0, minFaites = 9999;
  for (var k = 0; k < membres.length; k++) {
    var ligne = seance.exercices[membres[k]];
    var travail = indicesTravailExercice(ligne);
    var faites = 0;
    for (var t = 0; t < travail.length; t++) { if (ligne.series[travail[t]].fait) { faites++; } }
    if (travail.length > tours) { tours = travail.length; }
    if (faites < minFaites) { minFaites = faites; }
  }
  var tour = Math.min(tours, minFaites + 1);
  return '<div class="sx-groupe"><div class="sx-groupe-tete"><span class="sx-groupe-nom">' + (membres.length >= 3 ? 'Circuit' : 'Superset') + '</span><span class="sx-groupe-tour donnee-num">Tour ' + tour + ' / ' + tours + '</span></div>';
}

function htmlFermetureGroupe(seance, e) {
  var g = seance.exercices[e].groupe;
  if (!g || (e < seance.exercices.length - 1 && seance.exercices[e + 1].groupe === g)) { return ''; }
  return '</div>';
}