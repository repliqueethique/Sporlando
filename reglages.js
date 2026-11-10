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
  html += '<button class="btn btn-contour btn-bloc" data-action="ouvrir-notes" style="margin-bottom:14px;">📝 Mes notes (' + listeNotes().length + ')</button>';

  html += '<div class="notice-section"><h3>Accueil</h3><p>Quatre raccourcis : Nouvelle séance, Nutrition, Bibliothèque, Historique. Deux bannières peuvent apparaître automatiquement : un rappel pour vérifier ton objectif de programme (toutes les 4 semaines), et une alerte météo si la température à ton lieu d\'entraînement dépasse les seuils que tu as réglés.</p></div>';

  html += '<div class="notice-section"><h3>Nouvelle séance</h3><ul>';
  html += '<li>Si une séance est planifiée aujourd\'hui dans l\'agenda, elle apparaît en premier avec un bouton <strong>Début</strong>. Sinon, choisis une séance libre dans la liste.</li>';
  html += '<li>Une fois lancée : chrono en haut, et un <strong>minuteur de repos</strong> réglable en minutes/secondes, toujours accessible, qui sonne une seule fois (bip généré, pas de fichier audio).</li>';
  html += '<li>Pour chaque exercice : la <strong>barre de charge</strong> (un bloc par série, se remplit au fur et à mesure), la <strong>bulle ✓</strong> pour valider poids/reps d\'une série, le <strong>crayon ✎</strong> pour noter un changement ou une douleur sur une série précise.</li>';
  html += '<li>Le bouton <strong>+ Échauffement</strong> ajoute une série d\'échauffement, placée avant les séries de travail (après les échauffements déjà ajoutés). Elle est numérotée « É1, É2... », ne compte jamais dans les records, l\'historique, le volume ou la progression, et peut être validée/supprimée comme une série normale.</li>';
  html += '<li>Un champ <strong>RER</strong> (reps en réserve : 0 = échec, optionnel) par exercice.</li>';
  html += '<li>À la fin de la séance, tu indiques ton <strong>RPE</strong> (1 à 10) : l\'effort global ressenti. Il alimente une courbe dans Progression et les suggestions de fatigue.</li>';
  html += '<li>La <strong>référence "dernière fois"</strong> (ce que tu avais fait la séance précédente) et un badge <strong>★ Nouveau record</strong> si tu dépasses ton meilleur poids.</li>';
  html += '<li>Des badges rappellent la structure de séries, la technique d\'intensification et le tempo si tu les as définis pour cet exercice dans la séance.</li>';
  html += '<li>Le bouton <strong>Fin</strong> enregistre tout dans l\'historique, calcule la durée et les calories dépensées (formule MET × poids corporel × durée).</li>';
  html += '</ul></div>';

  html += '<div class="notice-section"><h3>Bibliothèque</h3><ul>';
  html += '<li><strong>Exercices</strong> : recherche par nom ou groupe musculaire avec ET/OU (ex. "dos ET poulie"), groupes musculaires repliables. Le bouton "Charger les exercices de base" ajoute 45 exercices adaptés à ton matériel (rack ATX, banc, barre, haltères, élastiques...). En modifiant un exercice : historique (nombre de fois, poids max par mode, RER moyen), schéma des muscles ciblés, et un champ Variantes (prise, position) pré-rempli pour les exercices qui en ont.</li>';
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

/* ============================================================
   NOTES (ouvertes depuis la notice)
   ============================================================ */

function listeNotes() {
  if (!etat.notes) { etat.notes = []; }
  return etat.notes;
}

function ouvrirNotes() {
  var notes = listeNotes().slice().sort(function (a, b) { return (b.modif || 0) - (a.modif || 0); });
  var html = '';
  html += '<div class="modal-entete"><h2>Mes notes</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="nouvelle-note" style="margin-bottom:12px;">+ Nouvelle note</button>';
  if (notes.length === 0) {
    html += '<div class="etat-vide">Aucune note pour l\'instant.</div>';
  } else {
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      html += '<div class="carte" data-action="editer-note" data-id="' + n.id + '" style="cursor:pointer;">';
      html += '<div class="texte-att" style="margin-bottom:4px;">' + formaterDateLisible(n.date) + '</div>';
      html += '<div style="white-space:pre-wrap; font-size:14px; line-height:1.35; max-height:4.1em; overflow:hidden; word-break:break-word;">' + echapperHtml(n.texte) + '</div>';
      html += '</div>';
    }
  }
  html += '<button class="btn btn-contour btn-bloc" data-action="ouvrir-notice" style="margin-top:6px;">Retour à la notice</button>';
  ouvrirModal(html);
}

function ouvrirEditionNote(idNote) {
  var note = idNote ? trouverParId(listeNotes(), idNote) : null;
  var html = '';
  html += '<div class="modal-entete"><h2>' + (note ? 'Modifier la note' : 'Nouvelle note') + '</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<div class="champ"><textarea id="champ-note-texte" style="min-height:200px;" placeholder="Écris ta note ici...">' + echapperHtml(note ? note.texte : '') + '</textarea></div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-note" data-id="' + (note ? note.id : '') + '">Enregistrer</button>';
  if (note) {
    html += '<button class="btn btn-alerte btn-bloc" style="margin-top:8px;" data-action="supprimer-note" data-id="' + note.id + '">Supprimer cette note</button>';
  }
  html += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="ouvrir-notes">Retour aux notes</button>';
  ouvrirModal(html);
  var champ = document.getElementById('champ-note-texte');
  if (champ && !note) { champ.focus(); }
}

function enregistrerNote(idNote) {
  var champ = document.getElementById('champ-note-texte');
  var texte = champ ? champ.value.replace(/\s+$/, '') : '';
  if (!texte) { afficherToast('La note est vide.'); return; }
  var notes = listeNotes();
  var note = idNote ? trouverParId(notes, idNote) : null;
  if (note) {
    note.texte = texte;
    note.modif = Date.now();
  } else {
    notes.push({ id: genererId(), texte: texte, date: formaterDateISO(new Date()), modif: Date.now() });
  }
  sauvegarderEtat();
  afficherToast('Note enregistrée.');
  ouvrirNotes();
}

function supprimerNote(idNote) {
  demanderConfirmation('Supprimer définitivement cette note ?', function () {
    etat.notes = retirerParId(listeNotes(), idNote);
    sauvegarderEtat();
    ouvrirNotes();
  }, function () {
    ouvrirEditionNote(idNote);
  });
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


