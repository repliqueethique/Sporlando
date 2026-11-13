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
    var nbFaitsComplets = entreesTermineesJour.filter(function (e) { return seanceEstComplete(e); }).length;
    var nbFaitsIncomplets = entreesTermineesJour.length - nbFaitsComplets;
    var aPiscine = !!etat.piscine[dateISO];
    var aNutrition = objectifsNutritionAtteints(dateISO);
    var checklistFaite = checklistEstComplete(dateISO);
    var classeSelect = (dateISO === jourSelectionneISO) ? ' cal-jour-select' : '';
    var classeAujourdhui = (dateISO === aujourdHuiISO) ? ' cal-jour-aujourdhui' : ''; // AJOUT
    html += '<div class="cal-jour' + classeSelect + classeAujourdhui + '">'; // MODIF
    html += '<button class="cal-jour-bouton" data-action="selectionner-jour" data-date="' + dateISO + '">' + jour + '</button>';
    html += '<div class="cal-marqueurs">';
    if (aPrevu) { html += '<span class="cal-point cal-point-prevu"></span>'; }
    for (var nf = 0; nf < nbFaitsComplets; nf++) { html += '<span class="cal-point cal-point-fait"></span>'; }
    for (var ni = 0; ni < nbFaitsIncomplets; ni++) { html += '<span class="cal-point cal-point-incomplet"></span>'; }
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


