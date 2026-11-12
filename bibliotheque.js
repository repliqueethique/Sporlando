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

function ouvrirFormulaireExercice(idExercice) {
  var exercice = idExercice ? trouverParId(etat.exercices, idExercice) : null;
  var estModif = !!exercice;
  if (!exercice) {
    exercice = { id: null, nom: '', groupe: 'Autre', poidsDefaut: 20, repsDefaut: 10, seriesDefaut: 3, met: 5, variantes: '', unilateral: false, securiteCran: '', securiteSens: 'haut' };  }
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
      if (stats.rerMoyen !== null) {
        html += '<div class="ligne" style="padding:3px 0;"><span class="texte-att">RER moyen ressenti</span><span class="donnee-num">' + stats.rerMoyen.toFixed(1) + ' rep(s)</span></div>';
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
  html += '<div class="reglages-section"><label class="reglages-interrupteur" style="padding-bottom:0;"><span>Unilatéral</span><input type="checkbox" id="champ-ex-unilateral"' + (exercice.unilateral ? ' checked' : '') + '></label>';
  html += '<p class="reglages-note">Un côté après l\'autre : poids et reps comptés par côté.</p></div>';  html += '<div class="champ"><label>Variantes (prise, position...)</label><textarea id="champ-ex-variantes" placeholder="ex. Prise sumo : jambes écartées, accentue adducteurs et fessiers">' + echapperHtml(exercice.variantes || '') + '</textarea></div>';
  var sensSec = (exercice.securiteSens === 'bas') ? 'bas' : 'haut';
  var secu = '<input type="hidden" id="champ-ex-securite-sens" value="' + sensSec + '">';
  secu += '<div class="champ"><label>Cran (optionnel)</label><input type="number" inputmode="numeric" step="1" min="1" id="champ-ex-securite" value="' + echapperHtml(exercice.securiteCran || '') + '" placeholder="ex. 5"></div>';
  secu += '<div class="reglages-segments">';
  secu += '<button class="reglages-segment' + (sensSec === 'haut' ? ' reglage-option-active' : '') + '" data-action="choisir-option" data-champ="champ-ex-securite-sens" data-valeur="haut">' + SVG_FLECHE_HAUT + 'Du dessus</button>';
  secu += '<button class="reglages-segment' + (sensSec === 'bas' ? ' reglage-option-active' : '') + '" data-action="choisir-option" data-champ="champ-ex-securite-sens" data-valeur="bas">' + SVG_FLECHE_BAS + 'Du dessous</button>';
  secu += '</div><p class="reglages-note">Barres de sécurité : numéro du cran, compté depuis le haut ou depuis le bas du rack.</p>';
  html += sectionReglages('Barres de sécurité', secu);
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
    variantes: document.getElementById('champ-ex-variantes').value,
    unilateral: document.getElementById('champ-ex-unilateral').checked,
    securiteCran: document.getElementById('champ-ex-securite').value.trim(),
    securiteSens: document.getElementById('champ-ex-securite-sens').value
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
    exercice.unilateral = donnees.unilateral;
    exercice.securiteCran = donnees.securiteCran;
    exercice.securiteSens = donnees.securiteSens;
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


