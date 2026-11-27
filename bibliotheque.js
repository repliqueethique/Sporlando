/* ============================================================
   CHOIX PAR FEUILLE (remplace les <select> groupe / type / technique)
   ============================================================ */
var choixEnCours = null;
var TITRES_CHOIX = { groupe: 'Groupe musculaire', type: 'Type d\'exercice', technique: 'Technique (dernière série)' };

function listeChoix(nom) {
  var r = [], i;
  if (nom === 'groupe') {
    for (i = 0; i < GROUPES_MUSCULAIRES.length; i++) { r.push({ valeur: GROUPES_MUSCULAIRES[i], libelle: GROUPES_MUSCULAIRES[i], meta: '' }); }
  } else if (nom === 'technique') {
    for (i = 0; i < TECHNIQUES_INTENSIFICATION.length; i++) { r.push({ valeur: TECHNIQUES_INTENSIFICATION[i].valeur, libelle: TECHNIQUES_INTENSIFICATION[i].libelle, meta: '' }); }
  } else {
    for (i = 0; i < TYPES_EXERCICE.length; i++) {
      if (!estTypePrincipal(TYPES_EXERCICE[i])) { continue; }
      r.push({ valeur: TYPES_EXERCICE[i].id, libelle: TYPES_EXERCICE[i].nom, meta: nomCategorieType(TYPES_EXERCICE[i].cat) });
    }
  }
  return r;
}

function libelleChoix(nom, valeur) {
  var l = listeChoix(nom);
  for (var i = 0; i < l.length; i++) { if (l[i].valeur === valeur) { return l[i].libelle; } }
  return valeur;
}

/* Remplace un <select> : champ caché (qui garde la valeur) + bouton */
function htmlChampChoix(nom, id, valeur, role, index) {
  var h = '<input type="hidden" id="' + id + '" value="' + echapperHtml(valeur) + '"' +
    (role ? ' data-role="' + role + '" data-index="' + index + '"' : '') + '>';
  h += '<button type="button" class="choix-bouton" data-action="ouvrir-choix" data-liste="' + nom + '" data-cible="' + id + '">';
  h += '<span class="choix-bouton-texte">' + echapperHtml(libelleChoix(nom, valeur)) + '</span><span class="choix-bouton-chevron">&#8964;</span></button>';
  return h;
}

function ouvrirChoix(nom, idCible) {
  var champ = document.getElementById(idCible);
  if (!champ) { return; }
  var ancien = document.getElementById('choix-overlay');
  if (ancien && ancien.parentNode) { ancien.parentNode.removeChild(ancien); }
  choixEnCours = { liste: nom, cible: idCible };
  var options = listeChoix(nom);
  var html = '<div class="modal-contenu"><div class="modal-poignee"></div>';
  html += '<div class="modal-entete"><h2>' + echapperHtml(TITRES_CHOIX[nom]) + '</h2><button class="bouton-fermer" data-action="fermer-choix">&times;</button></div>';
  for (var i = 0; i < options.length; i++) {
    var o = options[i];
    html += '<button class="selecteur-ligne' + (o.valeur === champ.value ? ' selecteur-ligne-active' : '') + '" data-action="choisir-valeur-choix" data-valeur="' + echapperHtml(o.valeur) + '">';
    html += '<span class="selecteur-ligne-textes"><span class="selecteur-ligne-nom">' + echapperHtml(o.libelle) + '</span>';
    if (o.meta) { html += '<span class="selecteur-ligne-meta">' + echapperHtml(o.meta) + '</span>'; }
    html += '</span><span class="selecteur-coche">&#10003;</span></button>';
  }
  html += '</div>';
  var ov = document.createElement('div');
  ov.id = 'choix-overlay';
  ov.className = 'modal-overlay choix-overlay';
  ov.innerHTML = html;
  ov.addEventListener('click', function (e) { if (e.target === ov) { fermerChoix(); } }, false);
  document.body.appendChild(ov);
  void ov.offsetWidth;
  ov.className += ' modal-ouvert';
}

function fermerChoix() {
  var ov = document.getElementById('choix-overlay');
  if (!ov) { return; }
  ov.removeAttribute('id');
  ov.className = ov.className.replace(' modal-ouvert', '');
  window.setTimeout(function () { if (ov.parentNode) { ov.parentNode.removeChild(ov); } }, 340);
}

function choisirValeurChoix(valeur) {
  if (!choixEnCours) { return; }
  var id = choixEnCours.cible, nom = choixEnCours.liste;
  var champ = document.getElementById(id);
  choixEnCours = null;
  if (champ) {
    champ.value = valeur;
    var txt = document.querySelector('[data-action="ouvrir-choix"][data-cible="' + id + '"] .choix-bouton-texte');
    if (txt) { txt.textContent = libelleChoix(nom, valeur); }
  }
  fermerChoix();
  if (id === 'champ-ex-groupe') { rafraichirDiagrammeMuscles(); }
  if (champ && champ.getAttribute('data-role') === 'se-structure') { memoriserChampsSeanceEnCours(); rendreFormulaireSeance(); }
}

var SVG_FLECHE_HAUT = '<svg class="fleche-svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4l9 16H3z"/></svg>';
var SVG_FLECHE_BAS = '<svg class="fleche-svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20L3 4h18z"/></svg>';

/* ============================================================
   BLOC 8 : EXERCICES (bibliothèque)
   ============================================================ */

/* Calcule, pour un exercice donné, le nombre de fois réalisé et le poids max atteint dans chaque mode (structure) */
function statistiquesExercice(exerciceId) {
  var statsParStructure = {};
  var nombreDeFois = 0;
  var sommeRer = 0;
  var nombreRer = 0;
  var entreesTerminees = etat.agenda.filter(function (a) { return a.statut === 'termine' && a.resultat; });
  for (var i = 0; i < entreesTerminees.length; i++) {
    var resultat = entreesTerminees[i].resultat;
    for (var j = 0; j < resultat.exercices.length; j++) {
      var ligneEx = resultat.exercices[j];
      if (ligneEx.exerciceId !== exerciceId) { continue; }
      nombreDeFois++;
      if (ligneEx.rer !== undefined && ligneEx.rer !== null) { sommeRer += ligneEx.rer; nombreRer++; }
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
    rerMoyen: nombreRer > 0 ? (sommeRer / nombreRer) : null
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

var ORDRE_MATERIEL_EXERCICE = ['barre_olympique', 'barre_z', 'haltere', 'poulie', 'aucun'];

var INFOS_CHAMPS_EXERCICE = {
  nom: { titre: 'Nom de l\'exercice', texte: 'Nom affiché dans la bibliothèque, les séances et l\'historique.' },
  groupe: { titre: 'Groupe musculaire', texte: 'Classe l\'exercice par zone principale et met à jour la silhouette.' },
  materiel: { titre: 'Matériel, sécurité & incrément', texte: 'Clique sur le bouton matériel pour faire défiler : barre olympique (+2,5 kg), barre en Z (+2,5 kg), haltères (+1,25 kg), colonne de poids (+5 kg) ou poids du corps. Avec une barre, glisse sur le bouclier pour régler le cran et clique dessus pour passer la flèche au-dessus ou en-dessous.' },
  unilateral: { titre: 'Unilatéral', texte: 'Actif hors barre olympique et barre en Z. Appuie pour faire défiler : non unilatéral → un côté puis l\'autre (poids & reps par côté) → deux côtés ensemble (poids par côté, reps synchronisées).' },
  poids: { titre: 'Poids par défaut (KG)', texte: 'Charge de départ proposée lorsque tu ajoutes cet exercice à une séance.' },
  reps: { titre: 'Répétitions par défaut (REP)', texte: 'Nombre de répétitions (ou secondes / minutes selon le type) de départ.' },
  series: { titre: 'Séries par défaut (SÉR)', texte: 'Nombre de séries de travail créées par défaut pour cet exercice.' },
  met: { titre: 'Intensité (MET)', texte: 'Coefficient d\'effort utilisé pour estimer les calories brûlées (5 = musculation générale).' },
  type: { titre: 'Type d\'exercice', texte: 'Structure de progression par défaut (linéaire, fourchette de reps, cluster, maintien, etc.).' },
  technique: { titre: 'Technique sur la dernière série', texte: 'Technique d\'intensification appliquée par défaut sur la dernière série.' },
  variantes: { titre: 'Variantes & notes', texte: 'Prise, inclinaison, position des pieds ou repères techniques à garder sous la main.' }
};

function svgMaterielExercice(cle) {
  if (cle === 'barre_olympique') {
    return '<svg viewBox="0 0 28 24" width="22" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="2" y1="12" x2="26" y2="12"/><rect x="6" y="7" width="3" height="10" rx="1" fill="currentColor"/><rect x="19" y="7" width="3" height="10" rx="1" fill="currentColor"/><line x1="4" y1="9" x2="4" y2="15"/><line x1="24" y1="9" x2="24" y2="15"/></svg>';
  }
  if (cle === 'barre_z') {
    return '<svg viewBox="0 0 28 24" width="22" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3,12 7,12 10,8 14,16 18,8 21,12 25,12"/><rect x="6" y="8" width="2.5" height="8" rx="0.8" fill="currentColor"/><rect x="19.5" y="8" width="2.5" height="8" rx="0.8" fill="currentColor"/></svg>';
  }
  if (cle === 'haltere') {
    return '<svg viewBox="0 0 28 24" width="22" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="12" x2="21" y2="12"/><rect x="4" y="7" width="3.5" height="10" rx="1.2" fill="currentColor"/><rect x="20.5" y="7" width="3.5" height="10" rx="1.2" fill="currentColor"/></svg>';
  }
  if (cle === 'poulie') {
    return '<svg viewBox="0 0 28 24" width="22" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="14" y1="3" x2="14" y2="14"/><circle cx="14" cy="5" r="2"/><rect x="9" y="9" width="10" height="3" rx="1"/><rect x="9" y="14" width="10" height="3" rx="1"/><rect x="9" y="19" width="10" height="3" rx="1"/></svg>';
  }
  return '<svg viewBox="0 0 28 24" width="22" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="14" cy="5" r="2.5"/><path d="M8 11h12l-2 5h-8z"/><line x1="11" y1="16" x2="9" y2="22"/><line x1="17" y1="16" x2="19" y2="22"/></svg>';
}

function svgUnilateralBase() {
  return '<svg class="sx-info-icone" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/></svg>';
}

function svgUnilateralCoteParCote() {
  return '<svg class="sx-info-icone" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 12H3M7 8l-4 4 4 4"/><line x1="12" y1="5" x2="12" y2="19" stroke-dasharray="2 2"/><path d="M14 12h7M17 8l4 4-4 4"/></svg>';
}

function svgUnilateralExercice(mode) {
  if (mode === 'cote_par_cote') { return svgUnilateralCoteParCote(); }
  return svgUnilateralBase();
}

function svgModeUnilateral(mode) {
  return '<span class="ex-uni-contenu">' + svgUnilateralExercice(mode) + '</span>';
}

function labelTitreBulle(cleInfo, texteLabel, classeSupp) {
  return '<span class="ex-titre-bulle' + (classeSupp ? ' ' + classeSupp : '') + '" data-action="ouvrir-bulle-exercice" data-info="' + cleInfo + '">' + texteLabel + '</span>';
}

function ouvrirBulleInfoExercice(cleInfo) {
  var info = INFOS_CHAMPS_EXERCICE[cleInfo];
  if (!info) { return; }
  var html = '<div class="modal-entete"><h2>' + echapperHtml(info.titre) + '</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<p class="texte-att" style="line-height:1.5; margin-bottom:14px;">' + echapperHtml(info.texte) + '</p>';
  html += '<button class="btn btn-plein btn-bloc" data-action="fermer-modal">Compris</button>';
  ouvrirModal(html);
}

var glisseCranExercice = { actif: false, x0: 0, val0: 0, init: false };

function ouvrirModalCranSecurite() {
  var champ = document.getElementById('champ-ex-securite');
  var valActuelle = champ && champ.value ? parseInt(champ.value, 10) : 1;
  if (isNaN(valActuelle) || valActuelle < 1) { valActuelle = 1; }
  var h = '<div class="modal-entete"><h2>Cran de sécurité</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  h += '<div class="champ"><label>Numéro du cran</label><input type="number" inputmode="numeric" min="1" max="99" step="1" id="modal-ex-cran-input" value="' + valActuelle + '"></div>';
  h += '<button class="btn btn-plein btn-bloc" data-action="valider-cran-securite">Valider</button>';
  h += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="effacer-cran-securite">Effacer le cran</button>';
  ouvrirModal(h);
}

function validerCranSecurite() {
  var inp = document.getElementById('modal-ex-cran-input');
  var n = inp ? parseInt(inp.value, 10) : 0;
  fermerModal();
  var champ = document.getElementById('champ-ex-securite');
  if (champ) { champ.value = (n > 0) ? String(Math.min(99, n)) : ''; }
  rafraichirZoneMaterielExercice();
}

function effacerCranSecurite() {
  fermerModal();
  var champ = document.getElementById('champ-ex-securite');
  if (champ) { champ.value = ''; }
  rafraichirZoneMaterielExercice();
}

function configurerGlisseCranExercice() {
  var zone = document.getElementById('ex-cran-glissable');
  var champ = document.getElementById('champ-ex-securite');
  var aff = document.getElementById('ex-cran-valeur');
  if (!zone || !champ || !aff) { return; }

  var aGlisse = false;

  function debut(x) {
    aGlisse = false;
    glisseCranExercice.actif = true;
    glisseCranExercice.x0 = x;
    glisseCranExercice.val0 = parseInt(champ.value, 10) || 0;
    zone.classList.add('glisse-actif');
  }

  function deplacer(x) {
    if (!glisseCranExercice.actif) { return; }
    if (Math.abs(x - glisseCranExercice.x0) > 8) { aGlisse = true; }
    if (aGlisse) {
      var pas = Math.trunc((x - glisseCranExercice.x0) / 18);
      var n = Math.max(0, Math.min(99, Math.round(glisseCranExercice.val0 + pas)));
      champ.value = n > 0 ? String(n) : '';
      aff.textContent = n > 0 ? String(n) : '—';
      var b = zone.querySelector('.sx-bouclier-texte b');
      if (b) { b.textContent = n > 0 ? String(n) : '—'; }
    }
  }

  function fin() {
    if (!glisseCranExercice.actif) { return; }
    var etaitGlisse = aGlisse;
    glisseCranExercice.actif = false;
    zone.classList.remove('glisse-actif');
    if (etaitGlisse) {
      rafraichirZoneMaterielExercice();
    } else {
      basculerSensSecuriteExercice();
    }
  }

  zone.addEventListener('mousedown', function (e) { e.preventDefault(); debut(e.clientX); });
  zone.addEventListener('touchstart', function (e) { debut(e.touches[0].clientX); }, { passive: true });

  if (!glisseCranExercice.init) {
    glisseCranExercice.init = true;
    document.addEventListener('mousemove', function (e) { deplacer(e.clientX); });
    document.addEventListener('touchmove', function (e) { deplacer(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('mouseup', fin);
    document.addEventListener('touchend', fin);
  }
}

function cycleMaterielExercice() {
  var champMat = document.getElementById('champ-ex-equipement');
  if (!champMat) { return; }
  var idx = ORDRE_MATERIEL_EXERCICE.indexOf(champMat.value);
  var suivant = ORDRE_MATERIEL_EXERCICE[(idx + 1) % ORDRE_MATERIEL_EXERCICE.length];
  champMat.value = suivant;
  champMat.dispatchEvent(new Event('change', { bubbles: true }));
}

function basculerSensSecuriteExercice() {
  var champSens = document.getElementById('champ-ex-securite-sens');
  var btnFleche = document.getElementById('ex-btn-fleche-secu');
  var bouclier = document.getElementById('ex-bouclier-secu');
  var chiffre = document.getElementById('ex-cran-valeur');
  if (!champSens) { return; }
  var nouveauSens = (champSens.value === 'bas') ? 'haut' : 'bas';
  champSens.value = nouveauSens;
  if (btnFleche) {
    btnFleche.innerHTML = (nouveauSens === 'bas') ? SVG_FLECHE_BAS : SVG_FLECHE_HAUT;
  }
  if (bouclier && chiffre) {
    var txt = chiffre.textContent;
    bouclier.innerHTML = '<svg class="sx-bouclier-fond" viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1.5L21.5 5v8.5c0 5.6-3.9 9.7-9.5 12-5.6-2.3-9.5-6.4-9.5-12V5z"/></svg><span class="sx-bouclier-texte">' +
      ((nouveauSens === 'bas') ? ('<b class="donnee-num">' + txt + '</b>' + SVG_FLECHE_BAS) : (SVG_FLECHE_HAUT + '<b class="donnee-num">' + txt + '</b>')) +
      '</span>';
  }
}

var MODES_UNILATERAL = ['aucun', 'cote_par_cote', 'synchronise'];

function lireModeUnilateralChamp() {
  var champUni = document.getElementById('champ-ex-unilateral');
  if (!champUni) { return 'aucun'; }
  var val = champUni.getAttribute('data-mode') || champUni.value;
  if (val === 'cote_par_cote' || val === 'synchronise') { return val; }
  return champUni.checked ? 'cote_par_cote' : 'aucun';
}

function ecrireModeUnilateralChamp(mode) {
  var champUni = document.getElementById('champ-ex-unilateral');
  if (!champUni) { return; }
  var valide = (mode === 'cote_par_cote' || mode === 'synchronise') ? mode : 'aucun';
  champUni.value = valide;
  champUni.setAttribute('data-mode', valide);
  champUni.checked = (valide !== 'aucun');
}

function basculerUnilateralExercice() {
  var btnUni = document.getElementById('ex-btn-unilateral');
  if (!btnUni) { return; }
  var modeActuel = lireModeUnilateralChamp();
  var idx = MODES_UNILATERAL.indexOf(modeActuel);
  var suivant = MODES_UNILATERAL[(idx + 1) % MODES_UNILATERAL.length];
  ecrireModeUnilateralChamp(suivant);
  btnUni.classList.toggle('ex-icone-btn-actif', suivant !== 'aucun');
  btnUni.classList.remove('ex-uni-btn-sync');
  btnUni.innerHTML = svgModeUnilateral(suivant);
  btnUni.title = suivant === 'synchronise'
    ? 'Unilatéral en même temps (poids / côté, reps)'
    : (suivant === 'cote_par_cote' ? 'Unilatéral côté par côté (poids / côté, reps / côté)' : 'Pas unilatéral');
}

function rafraichirZoneMaterielExercice() {
  var zone = document.getElementById('ex-zone-materiel-ligne');
  var champMat = document.getElementById('champ-ex-equipement');
  if (!zone || !champMat) { return; }

  var cle = champMat.value || 'aucun';
  var eqObj = EQUIPEMENTS_POIDS[cle] || EQUIPEMENTS_POIDS.aucun;
  var estBarre = (cle === 'barre_olympique' || cle === 'barre_z');
  var cranActuel = document.getElementById('champ-ex-securite') ? document.getElementById('champ-ex-securite').value : '';
  var sensActuel = document.getElementById('champ-ex-securite-sens') ? document.getElementById('champ-ex-securite-sens').value : 'haut';
  var modeUniActuel = lireModeUnilateralChamp();

  var h = '<div class="ex-mat-groupe">';
  h += labelTitreBulle('materiel', 'Matériel', 'ex-mini-titre');
  h += '<button type="button" class="ex-icone-btn ex-icone-btn-actif" data-action="cycle-materiel-exercice" title="' + echapperHtml(eqObj.label) + '">' + svgMaterielExercice(cle) + '</button>';
  h += '</div>';

  h += '<input type="hidden" id="champ-ex-securite" value="' + echapperHtml(cranActuel) + '">';
  h += '<input type="hidden" id="champ-ex-securite-sens" value="' + (sensActuel === 'bas' ? 'bas' : 'haut') + '">';
  h += '<input type="checkbox" id="champ-ex-unilateral" data-mode="' + modeUniActuel + '" value="' + modeUniActuel + '" style="display:none;"' + (modeUniActuel !== 'aucun' ? ' checked' : '') + '>';

  if (estBarre) {
    var chiffreAff = cranActuel ? cranActuel : '—';
    var contenuBouclier = (sensActuel === 'bas')
      ? ('<b class="donnee-num">' + echapperHtml(chiffreAff) + '</b>' + SVG_FLECHE_BAS)
      : (SVG_FLECHE_HAUT + '<b class="donnee-num">' + echapperHtml(chiffreAff) + '</b>');
    h += '<div class="ex-cran-glissable" id="ex-cran-glissable" title="Glisser pour le cran · Cliquer pour inverser haut/bas">';
    h += '<span id="ex-cran-valeur" style="display:none;">' + echapperHtml(chiffreAff) + '</span>';
    h += '<span class="sx-bouclier ex-bouclier-style-btn" id="ex-bouclier-secu">';
    h += '<svg class="sx-bouclier-fond" viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1.5L21.5 5v8.5c0 5.6-3.9 9.7-9.5 12-5.6-2.3-9.5-6.4-9.5-12V5z"/></svg>';
    h += '<span class="sx-bouclier-texte">' + contenuBouclier + '</span>';
    h += '</span></div>';
  } else {
    var titreUni = modeUniActuel === 'synchronise'
      ? 'Unilatéral en même temps (poids / côté, reps)'
      : (modeUniActuel === 'cote_par_cote' ? 'Unilatéral côté par côté (poids / côté, reps / côté)' : 'Pas unilatéral');
    h += '<button type="button" class="ex-icone-btn' + (modeUniActuel !== 'aucun' ? ' ex-icone-btn-actif' : '') + '" id="ex-btn-unilateral" data-action="basculer-unilateral-exercice" title="' + echapperHtml(titreUni) + '">' + svgModeUnilateral(modeUniActuel) + '</button>';
  }

  zone.innerHTML = h;
  if (estBarre) { configurerGlisseCranExercice(); }
}

function ouvrirFormulaireExercice(idExercice) {
  var exercice = idExercice ? trouverParId(etat.exercices, idExercice) : null;
  var estModif = !!exercice;
  if (!exercice) {
    exercice = {
      id: null,
      nom: '',
      groupe: 'Autre',
      equipement: 'aucun',
      poidsDefaut: 20,
      repsDefaut: 10,
      seriesDefaut: 3,
      met: 5,
      variantes: '',
      unilateral: false,
      securiteCran: '',
      securiteSens: 'haut',
      typeDefaut: 'lineaire',
      techniqueDefaut: 'aucune'
    };
  }
  var html = '';
  html += '<div class="modal-entete"><h2>' + (estModif ? 'Modifier l\'exercice' : 'Nouvel exercice') + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';

  /* 1. Historique */
  if (estModif) {
    var stats = statistiquesExercice(exercice.id);
    html += '<div class="carte" style="margin-bottom:12px;">';
    html += '<h2 class="carte-titre">Historique</h2>';
    if (stats.nombreDeFois === 0) {
      html += '<div class="texte-att">Pas encore réalisé.</div>';
    } else {
      html += '<div class="texte-att" style="margin-bottom:6px;">Réalisé ' + stats.nombreDeFois + ' fois.</div>';
      for (var m = 0; m < STRUCTURES_SERIES.length; m++) {
        var valeurMode = STRUCTURES_SERIES[m].valeur;
        if (stats.statsParStructure[valeurMode] === undefined) { continue; }
        html += '<div class="ligne" style="padding:2px 0;"><span class="texte-att">' + echapperHtml(STRUCTURES_SERIES[m].libelle) + '</span><span class="donnee-num">' + stats.statsParStructure[valeurMode] + ' kg</span></div>';
      }
      if (stats.rerMoyen !== null) {
        html += '<div class="ligne" style="padding:2px 0;"><span class="texte-att">RER moyen ressenti</span><span class="donnee-num">' + stats.rerMoyen.toFixed(1) + ' rep(s)</span></div>';
      }
    }
    html += '</div>';
  }

  /* 2. Nom + Groupe musculaire + Matériel/Sécu/Unilatéral à gauche, silhouette agrandie à droite */
  var eqInit = exercice.equipement || 'aucun';
  if (!EQUIPEMENTS_POIDS[eqInit]) { eqInit = 'aucun'; }
  html += '<div class="carte ex-bloc">';
  html += '<div class="champ ex-champ-compact"><label>' + labelTitreBulle('nom', 'Nom') + '</label><input type="text" id="champ-ex-nom" value="' + echapperHtml(exercice.nom) + '" placeholder="ex. Développé couché"></div>';
  html += '<div class="ex-identite-ligne">';
  html += '<div class="ex-identite-gauche">';
  html += '<div class="champ"><label>Groupe musculaire</label>' + htmlChampChoix('groupe', 'champ-ex-groupe', exercice.groupe) + '</div>';
  html += '<select id="champ-ex-equipement" style="display:none;">';
  for (var eqCle in EQUIPEMENTS_POIDS) {
    if (EQUIPEMENTS_POIDS.hasOwnProperty(eqCle)) {
      html += '<option value="' + eqCle + '"' + (eqCle === eqInit ? ' selected' : '') + '>' + eqCle + '</option>';
    }
  }
  html += '</select>';
  html += '<input type="hidden" id="champ-ex-securite" value="' + echapperHtml(exercice.securiteCran || '') + '">';
  html += '<input type="hidden" id="champ-ex-securite-sens" value="' + ((exercice.securiteSens === 'bas') ? 'bas' : 'haut') + '">';
  var modeUniInit = exercice.modeUnilateral || (exercice.unilateral ? 'cote_par_cote' : 'aucun');
  html += '<input type="checkbox" id="champ-ex-unilateral" data-mode="' + modeUniInit + '" value="' + modeUniInit + '" style="display:none;"' + (modeUniInit !== 'aucun' ? ' checked' : '') + '>';
  html += '<div id="ex-zone-materiel-ligne" class="ex-ligne-materiel"></div>';
  html += '</div>';
  html += '<div id="diagramme-muscles-zone" class="diagramme-muscles-petit ex-silhouette-grande"></div>';
  html += '</div>';
  html += '</div>';

  /* 4. Poids / Répétitions / Séries / Intensité sur la même ligne */
  html += '<div class="carte ex-bloc">';
  html += '<div class="ex-quatre-champs">';
  html += '<div class="ex-quatre-cell"><label class="ex-quatre-label">' + labelTitreBulle('poids', 'KG') + '</label><input type="number" inputmode="decimal" step="0.5" id="champ-ex-poids" class="ex-quatre-input donnee-num" value="' + exercice.poidsDefaut + '"></div>';
  html += '<div class="ex-quatre-cell"><label class="ex-quatre-label">' + labelTitreBulle('reps', 'REP') + '</label><input type="number" inputmode="numeric" step="1" id="champ-ex-reps" class="ex-quatre-input donnee-num" value="' + exercice.repsDefaut + '"></div>';
  html += '<div class="ex-quatre-cell"><label class="ex-quatre-label">' + labelTitreBulle('series', 'SÉR') + '</label><input type="number" inputmode="numeric" step="1" id="champ-ex-series" class="ex-quatre-input donnee-num" value="' + exercice.seriesDefaut + '"></div>';
  html += '<div class="ex-quatre-cell"><label class="ex-quatre-label">' + labelTitreBulle('met', 'MET') + '</label><input type="number" inputmode="decimal" step="0.5" id="champ-ex-met" class="ex-quatre-input donnee-num" value="' + exercice.met + '"></div>';
  html += '</div>';
  html += '</div>';

  /* 5. Type + Technique côte à côte, puis Variantes */
  html += '<div class="carte ex-bloc">';
  html += '<div class="ex-deux-champs">';
  html += '<div class="champ"><label>Type d\'exercice par défaut</label>' + htmlChampChoix('type', 'champ-ex-type', exercice.typeDefaut || 'lineaire') + '</div>';
  html += '<div class="champ"><label>Technique par défaut (dernière série)</label>' + htmlChampChoix('technique', 'champ-ex-technique', exercice.techniqueDefaut || 'aucune') + '</div>';
  html += '</div>';
  html += '<div class="champ ex-champ-compact" style="margin-top:10px; margin-bottom:0;"><label>' + labelTitreBulle('variantes', 'Variantes') + '</label><textarea id="champ-ex-variantes" rows="2" placeholder="Prise, position...">' + echapperHtml(exercice.variantes || '') + '</textarea></div>';
  html += '</div>';

  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-exercice" data-id="' + (exercice.id || '') + '">Enregistrer</button>';
  if (estModif) {
    html += '<button class="btn btn-alerte btn-bloc" style="margin-top:8px;" data-action="supprimer-exercice" data-id="' + exercice.id + '">Supprimer cet exercice</button>';
  }
  ouvrirModal(html);
  rafraichirDiagrammeMuscles();
  rafraichirZoneMaterielExercice();
}

function enregistrerExercice(idExistant) {
  var nom = document.getElementById('champ-ex-nom').value.trim();
  if (!nom) { afficherToast('Le nom de l\'exercice est obligatoire.'); return; }
  var donnees = {
    nom: nom,
    groupe: document.getElementById('champ-ex-groupe').value,
    equipement: document.getElementById('champ-ex-equipement').value,
    poidsDefaut: parseFloat(document.getElementById('champ-ex-poids').value) || 0,
    repsDefaut: parseInt(document.getElementById('champ-ex-reps').value, 10) || 0,
    seriesDefaut: parseInt(document.getElementById('champ-ex-series').value, 10) || 1,
    met: parseFloat(document.getElementById('champ-ex-met').value) || 5,
    variantes: document.getElementById('champ-ex-variantes').value,
    modeUnilateral: lireModeUnilateralChamp(),
    unilateral: lireModeUnilateralChamp() !== 'aucun',
    securiteCran: document.getElementById('champ-ex-securite').value.trim(),
    securiteSens: document.getElementById('champ-ex-securite-sens').value,
    typeDefaut: document.getElementById('champ-ex-type').value,
    techniqueDefaut: document.getElementById('champ-ex-technique').value
  };
  if (idExistant) {
    var exercice = trouverParId(etat.exercices, idExistant);
    exercice.nom = donnees.nom;
    exercice.groupe = donnees.groupe;
    exercice.equipement = donnees.equipement;
    exercice.poidsDefaut = donnees.poidsDefaut;
    exercice.repsDefaut = donnees.repsDefaut;
    exercice.seriesDefaut = donnees.seriesDefaut;
    exercice.met = donnees.met;
    exercice.variantes = donnees.variantes;
    exercice.unilateral = donnees.unilateral;
    exercice.modeUnilateral = donnees.modeUnilateral;
    exercice.securiteCran = donnees.securiteCran;
    exercice.securiteSens = donnees.securiteSens;
    exercice.typeDefaut = donnees.typeDefaut;
    exercice.techniqueDefaut = donnees.techniqueDefaut;
  } else {
    donnees.id = genererId();
    etat.exercices.push(donnees);
  }
  sauvegarderEtat();
  fermerModal();
  rendreExercices();
  if (etat.seanceActive) { rendreExercicesActifs(); }
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
          tempo: e.tempo || '',
          repsMax: e.repsMax || 0,
          grappes: e.grappes || 0,
          lieSuivant: !!e.lieSuivant
        };
      })
    };
  } else {
    seanceEnConstruction = { id: null, nom: '', exercices: [] };
  }
  rendreFormulaireSeance();
}

function rendreFormulaireSeance(sens) {
  var estModif = !!seanceEnConstruction.id;
  var html = '';
  html += '<div class="modal-entete"><h2>' + (estModif ? 'Modifier la séance' : 'Nouvelle séance') + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><label>Nom de la séance</label><input type="text" id="champ-se-nom" value="' + echapperHtml(seanceEnConstruction.nom) + '" placeholder="ex. Push day"></div>';

  html += '<div class="champ"><label>Exercices dans cette séance</label></div>';
  if (seanceEnConstruction.exercices.length > 1) {
    html += '<p class="reglages-note" style="margin:0 2px 10px;">« Enchaîner avec le suivant » relie deux exercices en superset (trois ou plus : circuit) : pas de repos entre eux, le repos se fait après chaque tour.</p>';
  }
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
      var typeLigne = ligneEx.structure || 'lineaire';
      if (typeLigne !== 'cardio') {
        html += '<div class="serie-champ" style="width:auto; margin-right:10px;"><label class="texte-att" style="font-size:11px;">' + ((typeLigne === 'poids_corps' || typeLigne === 'maintien') ? 'Lest (kg)' : 'Poids (kg)') + '</label><input type="number" step="0.5" data-role="se-poids" data-index="' + i + '" value="' + ligneEx.poids + '"></div>';
      }
      var fourchette = (typeLigne === 'fourchette');
      var labelReps = fourchette ? 'Reps min' : (typeLigne === 'maintien' ? 'Secondes' : (typeLigne === 'cardio' ? 'Minutes' : 'Reps'));
      html += '<div class="serie-champ" style="width:auto; margin-right:10px;"><label class="texte-att" style="font-size:11px;">' + labelReps + '</label><input type="number" step="1" data-role="se-reps" data-index="' + i + '" value="' + ligneEx.reps + '"></div>';
      if (fourchette) {
        html += '<div class="serie-champ" style="width:auto; margin-right:10px;"><label class="texte-att" style="font-size:11px;">Reps max</label><input type="number" step="1" data-role="se-repsmax" data-index="' + i + '" value="' + (ligneEx.repsMax || (ligneEx.reps + 4)) + '"></div>';
      }
      if (typeLigne === 'cluster') {
        html += '<div class="serie-champ" style="width:auto; margin-right:10px;"><label class="texte-att" style="font-size:11px;">Grappes</label><input type="number" step="1" data-role="se-grappes" data-index="' + i + '" value="' + (ligneEx.grappes || 4) + '"></div>';
      }
      html += '<div class="serie-champ" style="width:auto;"><label class="texte-att" style="font-size:11px;">Séries</label><input type="number" step="1" data-role="se-series" data-index="' + i + '" value="' + ligneEx.series + '"></div>';
      html += '</div>';
      html += '<div class="champ" style="margin-top:8px; margin-bottom:6px;"><label style="font-size:11px;">Type d\'exercice</label>';
      html += '<div class="type-choix">' + htmlChampChoix('type', 'se-structure-' + i, ligneEx.structure || 'lineaire', 'se-structure', i);
      html += '<button class="btn-aide-type" data-action="aide-type-seance" data-index="' + i + '" data-champ="structure" aria-label="Explication">?</button></div>';
      var typeChoisi = trouverTypeExercice(ligneEx.structure || 'lineaire');
      if (typeChoisi) { html += '<div class="texte-att type-resume">' + echapperHtml(typeChoisi.besoin) + '</div>'; }
      html += '</div>';
      html += '<div class="champ" style="margin-bottom:6px;"><label style="font-size:11px;">Technique sur la dernière série</label>';
      html += '<div class="type-choix">' + htmlChampChoix('technique', 'se-technique-' + i, ligneEx.technique || 'aucune', 'se-technique', i);
      html += '<button class="btn-aide-type" data-action="aide-type-seance" data-index="' + i + '" data-champ="technique" aria-label="Explication">?</button></div></div>';
      html += '<div class="champ" style="margin-bottom:0;"><label style="font-size:11px;">Tempo (optionnel, ex. 4-1-1-0)</label>';
      html += '<input type="text" data-role="se-tempo" data-index="' + i + '" value="' + echapperHtml(ligneEx.tempo || '') + '" placeholder="ex. 4-1-1-0"></div>';
      if (i < seanceEnConstruction.exercices.length - 1) {
        html += '<label class="reglages-interrupteur" style="padding:12px 0 0 0;"><span>Enchaîner avec le suivant</span><input type="checkbox" data-role="se-lie" data-index="' + i + '"' + (ligneEx.lieSuivant ? ' checked' : '') + '></label>';
      }
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
  ouvrirModal(html, sens);
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
  var champsRepsMax = document.querySelectorAll('[data-role="se-repsmax"]');
  for (var q = 0; q < champsRepsMax.length; q++) {
    var idx7 = parseInt(champsRepsMax[q].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx7].repsMax = parseInt(champsRepsMax[q].value, 10) || 0;
  }
  var champsGrappes = document.querySelectorAll('[data-role="se-grappes"]');
  for (var w = 0; w < champsGrappes.length; w++) {
    var idx8 = parseInt(champsGrappes[w].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx8].grappes = parseInt(champsGrappes[w].value, 10) || 4;
  }
  var champsLie = document.querySelectorAll('[data-role="se-lie"]');
  for (var z = 0; z < champsLie.length; z++) {
    var idx9 = parseInt(champsLie[z].getAttribute('data-index'), 10);
    seanceEnConstruction.exercices[idx9].lieSuivant = champsLie[z].checked;
  }
}

/* Bouton « ? » d'un exercice : ouvre le guide sur le type choisi, sans perdre la séance en cours d'édition */
function ouvrirAideTypeSeance(index, champ) {
  memoriserChampsSeanceEnCours();
  var ligne = seanceEnConstruction.exercices[index];
  var id = (champ === 'technique') ? ligne.technique : ligne.structure;
  if (id === 'aucune') { id = null; }
  ouvrirGuideTypes(id, 'seance');
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
    structure: exRef.typeDefaut || 'lineaire',
    technique: exRef.techniqueDefaut || 'aucune',
    tempo: '',
    reps: exRef.repsDefaut,
    series: exRef.seriesDefaut,
    equipement: exRef.equipement || 'aucun'
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

var JOURS_PLANNING = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/* ---------- Objectif : une liste + « Autre » ---------- */

function htmlChoixObjectif(objectifActuel, idChoix, idLibre) {
  var actuel = objectifActuel || '';
  var choix = (OBJECTIFS_PROGRAMME.indexOf(actuel) !== -1) ? actuel : (actuel ? '__autre' : '');
  var html = '<div class="champ"><label>Objectif actuel</label>';
  html += '<select id="' + idChoix + '" data-role="objectif-choix" data-libre="' + idLibre + '">';
  html += '<option value="">— choisir —</option>';
  for (var i = 0; i < OBJECTIFS_PROGRAMME.length; i++) {
    var o = OBJECTIFS_PROGRAMME[i];
    html += '<option value="' + echapperHtml(o) + '"' + (o === choix ? ' selected' : '') + '>' + echapperHtml(o) + '</option>';
  }
  html += '<option value="__autre"' + (choix === '__autre' ? ' selected' : '') + '>Autre (je précise)</option></select></div>';
  html += '<div class="champ" id="' + idLibre + '-zone"' + (choix === '__autre' ? '' : ' style="display:none;"') + '>';
  html += '<textarea id="' + idLibre + '" placeholder="Précise ton objectif...">' + (choix === '__autre' ? echapperHtml(actuel) : '') + '</textarea></div>';
  return html;
}

function majObjectifLibre(select) {
  var zone = document.getElementById(select.getAttribute('data-libre') + '-zone');
  if (zone) { zone.style.display = (select.value === '__autre') ? '' : 'none'; }
}

function lireObjectif(idChoix, idLibre) {
  var choix = document.getElementById(idChoix).value;
  if (choix === '__autre') { return document.getElementById(idLibre).value.trim(); }
  return choix;
}

/* ---------- Agenda rempli par un programme ---------- */

/* Retire de l'agenda les séances encore prévues (aujourd'hui et après) qui viennent de ce programme */
function retirerAgendaProgramme(idProg) {
  var aujourdHui = formaterDateISO(new Date());
  etat.agenda = etat.agenda.filter(function (a) {
    return !(a.programmeId === idProg && a.statut === 'planifie' && a.date >= aujourdHui);
  });
}

/* Planifie les séances du programme, de dateDebutISO jusqu'à la fin de sa durée (4 semaines si aucune durée).
   Le passé n'est jamais touché. Renvoie le nombre de séances ajoutées. */
function remplirAgendaProgramme(prog, dateDebutISO) {
  var planning = prog.planning || {};
  var nbSemaines = (prog.dureeSemaines > 0) ? prog.dureeSemaines : 4;
  var debut = dateDepuisISO(dateDebutISO);
  var aujourdHui = formaterDateISO(new Date());
  var ajoutes = 0;
  for (var i = 0; i < nbSemaines * 7; i++) {
    var d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
    var dateISO = formaterDateISO(d);
    if (dateISO < aujourdHui) { continue; }
    var jourSemaine = (d.getDay() + 6) % 7;   /* 0 = lundi */
    for (var s = 0; s < prog.seanceIds.length; s++) {
      var sid = prog.seanceIds[s];
      var jours = planning[sid];
      if (!jours || jours.indexOf(jourSemaine) === -1) { continue; }
      if (!trouverParId(etat.seances, sid)) { continue; }
      var dejaLa = etat.agenda.some(function (a) { return a.date === dateISO && a.seanceId === sid; });
      if (dejaLa) { continue; }
      etat.agenda.push({ id: genererId(), date: dateISO, seanceId: sid, statut: 'planifie', caloriesEstimees: 0, dureeMinutes: 0, resultat: null, programmeId: prog.id });
      ajoutes++;
    }
  }
  return ajoutes;
}

/* Programme déjà en cours et modifié : on refait les séances à venir */
function synchroniserAgendaProgramme(prog) {
  retirerAgendaProgramme(prog.id);
  return remplirAgendaProgramme(prog, etat.programmeActif.dateDebut);
}

/* ---------- Formulaire ---------- */

function ouvrirFormulaireProgramme(idProgramme) {
  var progExistant = idProgramme ? trouverParId(etat.programmes, idProgramme) : null;
  var planning = {};
  if (progExistant && progExistant.planning) {
    for (var cle in progExistant.planning) {
      if (progExistant.planning.hasOwnProperty(cle)) { planning[cle] = progExistant.planning[cle].slice(); }
    }
  }
  programmeEnConstruction = progExistant
    ? {
        id: progExistant.id,
        nom: progExistant.nom,
        notes: progExistant.notes || '',
        seanceIds: progExistant.seanceIds.slice(),
        typeMesocycle: progExistant.typeMesocycle || 'personnalise',
        dureeSemaines: progExistant.dureeSemaines || '',
        objectif: progExistant.objectif || '',
        planning: planning
      }
    : { id: null, nom: '', notes: '', seanceIds: [], typeMesocycle: 'personnalise', dureeSemaines: '', objectif: '', planning: {} };
  rendreFormulaireProgramme();
}

function rendreFormulaireProgramme() {
  var estModif = !!programmeEnConstruction.id;
  var html = '';
  html += '<div class="modal-entete"><h2>' + (estModif ? 'Modifier le programme' : 'Nouveau programme') + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><label>Nom du programme</label><input type="text" id="champ-pr-nom" value="' + echapperHtml(programmeEnConstruction.nom) + '" placeholder="ex. Force 5x5"></div>';
  html += htmlChoixObjectif(programmeEnConstruction.objectif, 'champ-pr-objectif-choix', 'champ-pr-objectif');
  html += '<div class="champ"><label>Type de mésocycle</label><select id="champ-pr-type">' + optionsListeValeurLibelle(TYPES_MESOCYCLE, programmeEnConstruction.typeMesocycle) + '</select></div>';
  html += '<div class="champ"><label>Durée (semaines, optionnel)</label><input type="number" step="1" min="1" id="champ-pr-duree" value="' + echapperHtml(programmeEnConstruction.dureeSemaines) + '" placeholder="ex. 6"></div>';
  html += '<div class="champ"><label>Notes (optionnel)</label><textarea id="champ-pr-notes">' + echapperHtml(programmeEnConstruction.notes) + '</textarea></div>';
  html += '<div class="champ"><label>Séances incluses et jours</label>';
  if (etat.seances.length === 0) {
    html += '<div class="texte-att">Crée d\'abord des séances dans l\'onglet Séances.</div>';
  } else {
    for (var i = 0; i < etat.seances.length; i++) {
      var s = etat.seances[i];
      var coche = programmeEnConstruction.seanceIds.indexOf(s.id) !== -1;
      var jours = programmeEnConstruction.planning[s.id] || [];
      html += '<div class="pr-seance-bloc">';
      html += '<label class="case-liste"><input type="checkbox" data-role="pr-seance" data-id="' + s.id + '"' + (coche ? ' checked' : '') + '><span>' + echapperHtml(s.nom) + '</span></label>';
      html += '<div class="pr-jours" id="pr-jours-' + s.id + '"' + (coche ? '' : ' style="display:none;"') + '>';
      for (var j = 0; j < 7; j++) {
        html += '<button type="button" class="chip-rapide' + (jours.indexOf(j) !== -1 ? ' chip-actif' : '') + '" data-action="pr-jour" data-seance="' + s.id + '" data-jour="' + j + '">' + JOURS_PLANNING[j] + '</button>';
      }
      html += '</div></div>';
    }
    html += '<p class="reglages-note">Un ou plusieurs jours par séance. Au démarrage du programme, l\'agenda se remplit sur sa durée (4 semaines si aucune durée n\'est indiquée).</p>';
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

/* Un tap sur un jour : on bascule sans redessiner la fenêtre (le reste du formulaire n'est pas perdu) */
function basculerJourProgramme(bouton) {
  var sid = bouton.getAttribute('data-seance');
  var j = parseInt(bouton.getAttribute('data-jour'), 10);
  var liste = programmeEnConstruction.planning[sid] || [];
  var pos = liste.indexOf(j);
  if (pos === -1) { liste.push(j); } else { liste.splice(pos, 1); }
  programmeEnConstruction.planning[sid] = liste;
  bouton.classList.toggle('chip-actif');
}

/* Case cochée / décochée : on montre ou on cache la rangée des jours */
function majJoursProgramme(caseCochee) {
  var zone = document.getElementById('pr-jours-' + caseCochee.getAttribute('data-id'));
  if (zone) { zone.style.display = caseCochee.checked ? '' : 'none'; }
}

function enregistrerProgramme() {
  var nom = document.getElementById('champ-pr-nom').value.trim();
  if (!nom) { afficherToast('Le nom du programme est obligatoire.'); return; }
  var notes = document.getElementById('champ-pr-notes').value;
  var objectif = lireObjectif('champ-pr-objectif-choix', 'champ-pr-objectif');
  var typeMesocycle = document.getElementById('champ-pr-type').value;
  var dureeBrute = parseInt(document.getElementById('champ-pr-duree').value, 10);
  var dureeSemaines = (!isNaN(dureeBrute) && dureeBrute > 0) ? dureeBrute : null;
  var cases = document.querySelectorAll('[data-role="pr-seance"]');
  var seanceIds = [];
  for (var i = 0; i < cases.length; i++) {
    if (cases[i].checked) { seanceIds.push(cases[i].getAttribute('data-id')); }
  }
  var planning = {};
  for (var p = 0; p < seanceIds.length; p++) {
    var jours = programmeEnConstruction.planning[seanceIds[p]];
    if (jours && jours.length > 0) {
      planning[seanceIds[p]] = jours.slice().sort(function (a, b) { return a - b; });
    }
  }
  var idProg;
  if (programmeEnConstruction.id) {
    var prog = trouverParId(etat.programmes, programmeEnConstruction.id);
    prog.nom = nom; prog.notes = notes; prog.seanceIds = seanceIds;
    prog.typeMesocycle = typeMesocycle; prog.dureeSemaines = dureeSemaines;
    prog.objectif = objectif; prog.planning = planning;
    idProg = prog.id;
  } else {
    idProg = genererId();
    etat.programmes.push({ id: idProg, nom: nom, notes: notes, seanceIds: seanceIds, typeMesocycle: typeMesocycle, dureeSemaines: dureeSemaines, objectif: objectif, planning: planning });
  }
  var message = '';
  if (etat.programmeActif && etat.programmeActif.programmeId === idProg) {
    var nb = synchroniserAgendaProgramme(trouverParId(etat.programmes, idProg));
    message = 'Agenda mis à jour : ' + nb + ' séance(s) à venir.';
  }
  sauvegarderEtat();
  fermerModal();
  rendreProgrammesBib();
  if (message) { afficherToast(message); }
}

function supprimerProgramme(id) {
  demanderConfirmation('Supprimer ce programme ? Les séances qu\'il contient ne seront pas supprimées, mais ses séances à venir seront retirées de l\'agenda.', function () {
    retirerAgendaProgramme(id);
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
    if (etat.programmeActif && etat.programmeActif.programmeId !== id) {
      retirerAgendaProgramme(etat.programmeActif.programmeId);
    }
    var dateDebut = formaterDateISO(new Date());
    etat.programmeActif = { programmeId: id, dateDebut: dateDebut, dateDernierObjectif: dateDebut };
    etat.historiqueProgrammes.push({ programmeId: id, type: prog.typeMesocycle || 'personnalise', dateDebut: dateDebut });
    var nb = remplirAgendaProgramme(prog, dateDebut);
    sauvegarderEtat();
    fermerModal();
    rendreProgrammesBib();
    if (nb > 0) {
      afficherToast(nb + ' séance(s) ajoutée(s) à l\'agenda' + (prog.dureeSemaines ? '.' : ' (sur 4 semaines : indique une durée pour changer).'));
    } else {
      afficherToast('Programme démarré. Choisis des jours pour ses séances pour remplir l\'agenda.');
    }
  };
  if (etat.programmeActif && etat.programmeActif.programmeId !== id) {
    demanderConfirmation('Un autre programme est déjà en cours. Le remplacer par celui-ci ? Les séances à venir de l\'ancien seront retirées de l\'agenda.', executerDemarrage, function () {
      ouvrirFormulaireProgramme(id);
    });
  } else {
    executerDemarrage();
  }
}

function arreterProgrammeActif() {
  demanderConfirmation('Arrêter le programme en cours ? Ses séances à venir seront retirées de l\'agenda.', function () {
    if (etat.programmeActif) { retirerAgendaProgramme(etat.programmeActif.programmeId); }
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


