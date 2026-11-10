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


