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
    xhr.open('GET', 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation&forecast_days=1&timezone=Europe%2FParis', true);
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
          if (donnees.hourly && donnees.hourly.temperature_2m && donnees.hourly.relative_humidity_2m) {
            var air = donnees.hourly.temperature_2m, hum = donnees.hourly.relative_humidity_2m, ressenti = [], j;
            for (j = 0; j < air.length; j++) { ressenti.push(ressentiSansVent(air[j], hum[j])); }
            var ressentiNow = ressenti[new Date().getHours()];
            meteoDernierResultat = {
              actuelle: (typeof ressentiNow === 'number') ? ressentiNow : ressenti[0],
              heures: donnees.hourly.time,
              temperatures: ressenti,
              probaPluie: donnees.hourly.precipitation_probability || [],
              mmPluie: donnees.hourly.precipitation || []
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

/* ============================================================
   CRÉNEAU IDÉAL : ressenti + pluie + ta journée (lever, repas, digestion)
   ============================================================ */

/* ---- Ta journée : à modifier si tes horaires changent ---- */
var METEO_LEVER = 8 * 60;                    /* heure de lever */
var METEO_REPAS = [12 * 60 + 30, 20 * 60];   /* heures des repas */
var METEO_APRES_LEVER = 60;                  /* minutes à attendre après le lever */
var METEO_APRES_REPAS = 120;                 /* minutes de digestion après un repas */
var METEO_DUREE_SEANCE = 75;                 /* durée d'une séance : elle doit finir avant le repas suivant */
var METEO_DERNIER_DEPART = 21 * 60;          /* pas de départ après cette heure */
var METEO_PLUIE_PROBA = 50;                  /* % de risque à partir duquel on considère qu'il pleut */
var METEO_PLUIE_MM = 0.3;                    /* mm de pluie par heure à partir desquels on considère qu'il pleut */

/* ressenti SANS le vent (la cabane est à l'abri) : température + humidité (formule de l'apparent temperature, vent = 0) */
function ressentiSansVent(temperature, humidite) {
  var vapeur = (humidite / 100) * 6.105 * Math.exp(17.27 * temperature / (237.7 + temperature));
  return temperature + 0.33 * vapeur - 4.0;
}

/* peut-on partir à cette minute de la journée (ex. 9 h = 540) ? */
function departPossible(minute) {
  if (minute < METEO_LEVER + METEO_APRES_LEVER) { return false; }
  if (minute > METEO_DERNIER_DEPART) { return false; }
  var fin = minute + METEO_DUREE_SEANCE;
  for (var i = 0; i < METEO_REPAS.length; i++) {
    var repas = METEO_REPAS[i];
    if (minute >= repas && minute < repas + METEO_APRES_REPAS) { return false; }  /* digestion */
    if (minute < repas && fin > repas) { return false; }                          /* la séance déborderait sur le repas */
  }
  return true;
}

function pleutALHeure(r, h) {
  var proba = r.probaPluie ? r.probaPluie[h] : 0;
  var mm = r.mmPluie ? r.mmPluie[h] : 0;
  return (proba >= METEO_PLUIE_PROBA) || (mm >= METEO_PLUIE_MM);
}

/* départs possibles aujourd'hui, regroupés : "9h–11h · 15h–18h" */
function plagesPossibles() {
  var plages = [], debut = null, h;
  for (h = 0; h <= 24; h++) {
    var ok = h < 24 && departPossible(h * 60);
    if (ok && debut === null) { debut = h; }
    if (!ok && debut !== null) { plages.push(debut + 'h–' + (h - 1) + 'h'); debut = null; }
  }
  return plages.join(' · ');
}

/* "Pluie probable : 15h–17h" (à partir de maintenant) */
function resumePluie(r) {
  var heureNow = new Date().getHours(), plages = [], debut = null, h;
  for (h = heureNow; h <= 24; h++) {
    var pluie = h < 24 && pleutALHeure(r, h);
    if (pluie && debut === null) { debut = h; }
    if (!pluie && debut !== null) { plages.push(debut + 'h–' + h + 'h'); debut = null; }
  }
  return plages.length ? 'Pluie probable : ' + plages.join(' · ') : 'Pas de pluie prévue d\'ici ce soir.';
}

/* prochain meilleur départ : ressenti moyen pendant la séance, et pluie à l'aller ou au retour (le trajet à pied) */
function trouverProchainCreneauIdealBanniere(heures, temps) {
  var r = meteoDernierResultat || {};
  var maintenant = new Date();
  var minuteActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
  var meilleur = null, meilleurScore = Infinity;

  for (var i = 0; i < heures.length; i++) {
    var h = parseInt(heures[i].substring(11, 13), 10);
    var minute = h * 60;
    if (minute < minuteActuelle) { continue; }
    if (!departPossible(minute)) { continue; }

    var hFin = Math.min(23, Math.floor((minute + METEO_DUREE_SEANCE) / 60));
    var somme = 0, nb = 0;
    for (var k = h; k <= hFin; k++) { somme += temps[k]; nb++; }
    var moyenne = somme / nb;
    var pluie = pleutALHeure(r, h) || pleutALHeure(r, hFin);

    var etatTemp = evaluerTemperature(moyenne);
    var score = (etatTemp === 'ideal' ? 0 : etatTemp === 'moyen' ? 1 : 2) + (pluie ? 1.5 : 0);
    if (score < meilleurScore) {
      meilleurScore = score;
      meilleur = { heure: heures[i].substring(11, 16), temperature: moyenne, pluie: pluie };
    }
  }
  return meilleur;
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

    var smin = (etat.profil.seuilTempMin !== null && etat.profil.seuilTempMin !== undefined) ? etat.profil.seuilTempMin : 5;
    var smax = (etat.profil.seuilTempMax !== null && etat.profil.seuilTempMax !== undefined) ? etat.profil.seuilTempMax : 28;
    var jour = '';
    for (var hj = 8; hj <= 21; hj++) {
      var ej = evaluerTemperature(resultat.temperatures[hj]);
      var cj = (ej === 'ideal') ? 'i' : (ej === 'moyen') ? 'm' : 'x';
      if (departPossible(hj * 60)) { cj = cj.toUpperCase(); }
      if (pleutALHeure(resultat, hj)) { cj += '*'; }
      jour += cj + ',';
    }
    var html = '<div class="meteo-carte meteo-' + etatTemp + '" data-action="ouvrir-modale-meteo" data-ressenti="' + resultat.actuelle.toFixed(1) + '" data-smin="' + smin + '" data-smax="' + smax + '" data-pluie="' + (tranche && tranche.pluie ? 1 : 0) + '" data-jour="' + jour + '">';
    html += '<span class="meteo-icone"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg></span>';
    html += '<span class="meteo-textes"><span class="meteo-temp donnee-num">' + resultat.actuelle.toFixed(1) + '°C</span>';
    if (tranche) {
      html += '<span class="meteo-sous">' + libelleCreneauMeteo(evaluerTemperature(tranche.temperature)) + ' ' + heureCourte(tranche.heure) + ' · ' + Math.round(tranche.temperature) + '°' + (tranche.pluie ? ' · pluie' : '') + '</span>';
    } else {
      html += '<span class="meteo-sous">plus de créneau aujourd\'hui</span>';
    }
    html += '</span>';
    html += '<span class="meteo-spark">' + construireSparkMeteo(resultat) + '</span>';
    html += '</div>';
    zone.innerHTML = html;
  });
}

function fermerModaleMeteo() { fermerModal(); }

/* "Journal de bord" (thème pirate) : la phrase écrite à la plume */
function phraseJournalDeBord(r, tranche) {
  var h0 = new Date().getHours(), debut = null, fin = null, h, s;
  for (h = h0; h < 24; h++) {
    if (pleutALHeure(r, h)) { if (debut === null) { debut = h; } fin = h + 1; }
    else if (debut !== null) { break; }
  }
  if (debut === null) { s = 'Ciel dégagé, mer d\'huile jusqu\'au soir.'; }
  else if (debut <= h0) { s = 'Grain en cours, il se calme vers ' + fin + 'h.'; }
  else { s = 'Grain en vue de ' + debut + 'h à ' + fin + 'h.'; }
  if (tranche) { s += ' Appareillage conseillé à ' + heureCourte(tranche.heure) + (tranche.pluie ? ', sous la pluie faute de mieux.' : '.'); }
  else { s += ' Plus de départ possible aujourd\'hui : on reste au port.'; }
  return s;
}

function ouvrirModaleMeteo() {
  if (!meteoDernierResultat) { return; }
  var r = meteoDernierResultat;
  var pirate = document.documentElement.getAttribute('data-theme') === 'flibuste';
  var etatNow = evaluerTemperature(r.actuelle);
  var tranche = trouverProchainCreneauIdealBanniere(r.heures, r.temperatures);
  var tmin = Math.min.apply(null, r.temperatures);
  var tmax = Math.max.apply(null, r.temperatures);

  var html = '';
  html += '<div class="modal-entete"><h2>Météo du jour</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  if (pirate) {
    html += '<div class="pr-journal"><div class="pr-journal-titre">Journal de bord</div><div class="pr-journal-date">' + formaterDateLisible(formaterDateISO(new Date())) + '</div>';
  }

  html += '<div class="meteo-tuiles">';
  html += '<div class="meteo-tuile meteo-tuile-now meteo-' + etatNow + '"><span class="meteo-tuile-label">Ressenti</span><span class="meteo-tuile-valeur donnee-num">' + Math.round(r.actuelle) + '°</span></div>';
  html += '<div class="meteo-tuile"><span class="meteo-tuile-label">Min</span><span class="meteo-tuile-valeur donnee-num">' + Math.round(tmin) + '°</span></div>';
  html += '<div class="meteo-tuile"><span class="meteo-tuile-label">Max</span><span class="meteo-tuile-valeur donnee-num">' + Math.round(tmax) + '°</span></div>';
  html += '</div>';

  html += '<div class="meteo-graphe svg-conteneur">' + construireSvgMeteo(r, tranche) + '</div>';

  html += '<div class="meteo-legende">';
  html += '<span><i class="meteo-pastille fr-ideal"></i>Idéal 12–20° (ressenti)</span>';
  html += '<span><i class="meteo-pastille fr-moyen"></i>Correct</span>';
  html += '<span><i class="meteo-pastille fr-mauvais"></i>À éviter</span>';
  if (pirate) {
    html += '<span><i class="meteo-pastille pr-plage"></i>Départ possible</span>';
    html += '<span><i class="meteo-pastille pr-goutte"></i>Pluie</span>';
  }
  html += '</div>';

  if (tranche) {
    html += '<p class="reglages-note">Prochain meilleur créneau : ' + libelleCreneauMeteo(evaluerTemperature(tranche.temperature)) + ' ' + heureCourte(tranche.heure) + ' (' + Math.round(tranche.temperature) + '°' + (tranche.pluie ? ', pluie' : '') + ')</p>';
  }
  html += '<p class="reglages-note">' + resumePluie(r) + '</p>';
  html += '<p class="reglages-note">Départs possibles (lever, repas) : ' + plagesPossibles() + '</p>';
  if (pirate) {
    html += '<p class="pr-plume">' + phraseJournalDeBord(r, tranche) + '</p></div>';
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

  /* Journal de bord (thème pirate) : plages de départ possibles surlignées + gouttes aux heures de pluie */
  if (document.documentElement.getAttribute('data-theme') === 'flibuste') {
    var pas = zw / (n - 1);
    svg += '<defs><filter id="pr-encre" x="-2%" y="-6%" width="104%" height="112%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="3" result="b"/><feDisplacementMap in="SourceGraphic" in2="b" scale="1.5"/></filter></defs>';
    for (var hp = 0; hp < n; hp++) {
      var hh = parseInt(heures[hp].substring(11, 13), 10);
      if (departPossible(hh * 60)) {
        svg += '<rect class="meteo-plage" x="' + (x(hp) - pas / 2).toFixed(1) + '" y="' + mh + '" width="' + pas.toFixed(1) + '" height="' + zh + '"/>';
      }
      if (pleutALHeure(r, hh)) {
        svg += '<path class="meteo-goutte" transform="translate(' + x(hp).toFixed(1) + ' ' + (mh + 9) + ')" d="M0 -4.5C-2.6 -.6 -3.2 1 -3.2 2.2a3.2 3.2 0 0 0 6.4 0C3.2 1 2.6 -.6 0 -4.5z"/>';
      }
    }
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

/* Compare le RER moyen des 2 dernières semaines à celui des 2 semaines precedentes */
function tendanceRpeGlobale() {
  var maintenant = new Date();
  var isoMaintenant = formaterDateISO(maintenant);
  var iso2Semaines = formaterDateISO(new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - 14));
  var iso4Semaines = formaterDateISO(new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - 28));
  var sommeRecent = 0, nbRecent = 0, sommeAncien = 0, nbAncien = 0;
  for (var i = 0; i < etat.agenda.length; i++) {
    var e = etat.agenda[i];
    if (e.statut !== 'termine' || e.rpeSeance === undefined || e.rpeSeance === null) { continue; }
    if (e.date >= iso2Semaines && e.date <= isoMaintenant) { sommeRecent += e.rpeSeance; nbRecent++; }
    else if (e.date >= iso4Semaines && e.date < iso2Semaines) { sommeAncien += e.rpeSeance; nbAncien++; }
  }
  if (nbRecent === 0 || nbAncien === 0) { return null; }
  return { recent: sommeRecent / nbRecent, ancien: sommeAncien / nbAncien };
}

/* Combine les signaux automatiques (RER, semaines sans decharge) et manuels (ressenti) : au moins 2 signaux concordants avant de suggerer */
function suggestionFatigue() {
  var indiceManuel = calculerIndiceFatigueManuel();
  var tendance = tendanceRpeGlobale();
  var semaines = semainesDepuisDerniereDecharge();
  var signaux = [];

  if (indiceManuel !== null && indiceManuel.score >= 3.5) {
    signaux.push('ton ressenti quotidien moyen des ' + indiceManuel.nbJours + ' derniers jours renseignés indique une fatigue plutôt élevée (sommeil/fatigue/stress)');
  }
  if (tendance !== null && (tendance.recent - tendance.ancien) >= 1) {
    signaux.push('ton RPE moyen de séance a augmenté de ' + (tendance.recent - tendance.ancien).toFixed(1) + ' point(s) sur les 2 dernières semaines');
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
    if (entree.rpeSeance) { html += ' · RPE ' + entree.rpeSeance; }
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
  if (entree.rpeSeance) { html += ' · RPE ' + entree.rpeSeance; }
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


