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
  function section(titre, intro, puces) {
    var h = '<div class="notice-section"><h3>' + titre + '</h3>';
    if (intro) { h += '<p>' + intro + '</p>'; }
    if (puces && puces.length) { h += '<ul><li>' + puces.join('</li><li>') + '</li></ul>'; }
    return h + '</div>';
  }

  var html = '';
  html += '<div class="modal-entete"><h2>Notice complète</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<button class="btn btn-contour btn-bloc" data-action="ouvrir-notes" style="margin-bottom:14px;">📝 Mes notes (' + listeNotes().length + ')</button>';
  html += '<button class="btn btn-contour btn-bloc" data-action="ouvrir-guide-types" style="margin-bottom:14px;">🏋️ Types d\'exercice</button>';

  html += section("Accueil", "De haut en bas, selon ta journée :", [
    "<strong>Routine</strong> : trois boutons ronds, 💧 eau, 🤸 étirements, ⚖️ pesée. Les étirements lancent la séance de réveil, la pesée ouvre le poids du jour. Quand les trois sont faits, la carte disparaît (la journée change à 5 h du matin).",
    "<strong>Objectif</strong> : tous les 28 jours de programme, un rappel te propose de vérifier ton objectif.",
    "<strong>Météo</strong> : température ressentie (sans vent) à ton lieu d'entraînement, mini-courbe de la journée et meilleur créneau. Touche la barre pour ouvrir la météo du jour : courbe, pluie, départs possibles et heure à partir de laquelle tu peux t'entraîner.",
    "<strong>À noter aujourd'hui</strong> : tes rappels du jour, à cocher avec ✓.",
    "<strong>Séance prévue</strong> : si une séance est planifiée aujourd'hui, la carte colorée la lance directement. Sinon, la carte Séances ouvre la page Séance.",
    "Trois tuiles en dessous : Nutrition (protéines restantes), Biblio (objectif du programme), Historique (nombre de séances faites)."
  ]);

  html += section("Page Séance", "", [
    "<strong>Prévu aujourd'hui</strong> et <strong>Démarrer une séance</strong> : touche une ligne (ou Début) pour commencer. La dernière ligne lance les étirements.",
    "Avant de démarrer, un échauffement haut ou bas du corps est proposé. Tu peux le passer.",
    "<strong>Ressenti du jour</strong> : 🌙 couché à gauche, ☀️ levé à droite, les heures de sommeil au milieu. Un tap enregistre l'heure actuelle. Un appui long (ou un tap sur une heure déjà notée) permet de choisir une autre heure en glissant par pas de 15 min. Le sommeil se calcule tout seul, tu peux ensuite le modifier en glissant sur le chiffre.",
    "🥐 collation légère et 🍽️ repas : touche l'icône quand tu viens de finir. Les barres se vident pendant le réveil (1 h) et la digestion (45 min après une collation, 2 h après un repas). La météo et le créneau idéal en tiennent compte.",
    "Humeur, fatigue et stress (curseurs) et événements 🤬 🤕 🤒 😶 alimentent l'onglet État de l'historique."
  ]);

  html += section("Séance en cours", "", [
    "En haut : nom, chrono, bouton Fin et progression. 🎤 active la commande vocale, ✕ annule la séance.",
    "Les exercices sont des cartes repliables ; l'exercice en cours s'ouvre seul. La série en cours s'affiche en grand : boutons − et + (2,5 kg, 1 rep) ou saisie directe, puis Valider la série. Poids et reps sont préremplis avec ton record. Un bouton 💡 propose une charge adaptée aux reps prévues, d'après ton 1RM estimé (avec +2,5 kg si ta dernière séance avait un RER de 2 ou plus) : touche-le pour l'appliquer.",
    "🔥 ajoute une série d'échauffement (É1, É2… : jamais comptée dans les records, le volume ni la progression). ✎ ajoute une note à une série. + Série en ajoute une ; + Série dégressive apparaît quand la technique est drop set. Le bouton à curseurs change le style de l'exercice (type et technique) ; « Par défaut » le retient pour les prochaines séances que tu composes.",
    "<strong>RER</strong> (0 = échec, jusqu'à 5+) : touche un chiffre ou glisse le doigt sur la barre. Facultatif : sans choix, rien n'est enregistré.",
    "Badges et repères : ★ Nouveau record, structure de séries, technique d'intensification, tempo, résultats de la dernière fois, exercice unilatéral, cran des barres de sécurité.",
    "<strong>Minuteur de repos</strong> : il démarre tout seul quand tu valides une série de travail (pas la toute dernière), avec la dernière durée utilisée. Sur la pastille, tap = lancer, appui long = régler la durée (glisse, par pas de 15 s). Pendant le décompte : tap = pause, glisser vers le haut = arrêter. À la fin : sonnerie du thème et mot d'encouragement.",
    "L'écran reste allumé pendant la séance si ton navigateur le permet.",
    "<strong>Fin</strong> : tu peux indiquer ton RPE (1 à 10). La durée et les calories (MET × poids × durée) sont enregistrées."
  ]);

  html += section("Commande vocale", "Touche 🎤 pendant une séance, puis dis :", [
    "« valide » : valide la série en cours.",
    "« plus de poids », « moins de poids », « plus de reps », « moins de reps ».",
    "« RER 2 » : règle le RER de l'exercice en cours.",
    "« minuteur » lance le repos ; « minuteur deux minutes » règle la durée sans lancer. « stop » arrête le minuteur.",
    "« échauffement » ajoute une série d'échauffement. « terminer » ouvre la fin de séance, puis « valide » confirme. « désactive » coupe la commande vocale."
  ]);

  html += section("Étirements", "Une séance de réveil articulaire (environ 7 min, 5 étapes), depuis la Routine ou la page Séance. Touche le chrono pour mettre en pause, Passer l'étape ou Quitter. À la fin, 🤸 est coché dans la Routine.", []);

  html += section("Bibliothèque", "", [
    "<strong>Exercices</strong> : recherche avec ET / OU (ex. « dos ET poulie »), groupes repliables. « Charger les exercices de base » ajoute 45 exercices adaptés à ton matériel. Dans une fiche : historique (nombre de fois, poids max par structure, RER moyen), valeurs par défaut, MET, unilatéral, variantes, barres de sécurité (cran et sens), schéma des muscles.",
    "<strong>Séances</strong> : assemble des exercices avec poids, reps et séries, un type d'exercice (séries droites, fourchette de reps, pyramides, échelle, jusqu'à l'échec, cluster, poids du corps, cardio…), une technique sur la dernière série (drop set, rest-pause, myo-reps…) et un tempo. Le bouton ? explique chaque choix ; tous les types sont détaillés dans la notice, « Types d'exercice ».",
    "<strong>Programmes</strong> : regroupe des séances, avec un objectif, un type de mésocycle (hypertrophie, force, décharge, personnalisé) et une durée. Un seul programme est actif à la fois.",
    "<strong>Aliments</strong> : bibliothèque 100 % végétalienne, plus de 120 aliments à charger (tofu, tempeh, seitan, légumineuses, céréales, laits et fromages végétaux, produits du commerce…). Les calories se déduisent des macros (4 × P + 4 × G + 9 × L) : un conseil s'affiche si ça ne colle pas.",
    "<strong>Plats</strong> : des recettes composées d'ingrédients, avec un nombre de portions et les macros par portion."
  ]);

  html += section("Nutrition", "Journal du jour (les flèches changent de jour), avec des barres de progression pour les calories, les protéines, les glucides et les lipides.", [
    "<strong>+ Ajouter</strong> : onglet Aliment (recherche, récents, catégories) ou Plat. Choisis la quantité (raccourcis 50 à 250 g, ou ½ à 3 portions). « + Un autre » permet d'enchaîner.",
    "Touche une ligne du journal pour modifier sa quantité ou la supprimer. Le × la supprime directement.",
    "<strong>Recalcul automatique des objectifs</strong> (Réglages, Profil) : métabolisme de base (Mifflin-St Jeor) × 1,55. Surplus de 250 kcal en hypertrophie ou force, déficit de 200 kcal en décharge, maintenance sinon. Protéines : 2 g par kg. Lipides : 25 % des calories. Glucides : le reste. C'est un point de départ à ajuster. Pense à enregistrer le profil ensuite."
  ]);

  html += section("Historique", "", [
    "<strong>Agenda</strong> : programme actif et calendrier avec des points de couleur : prévu, fait, incomplet, piscine, nutrition atteinte (protéines atteintes et calories à ±10 % de l'objectif), routine complète. Tu peux planifier une séance et cocher une séance de piscine.",
    "<strong>État</strong> : courbes d'humeur, de fatigue, de stress et de sommeil sur 30 jours, 2 mois, 6 mois, 1 an ou depuis le début, avec une vue superposée et la liste des événements.",
    "<strong>Progression</strong> : poids corporel, poids max par exercice, 1RM estimé (formule d'Epley, séries de 12 reps ou moins, avec le record, la courbe et les charges conseillées par pourcentage), volume hebdomadaire, calories dépensées, RPE des séances et 4 courbes de nutrition sur 30 jours.",
    "<strong>Équilibre</strong> : volume (séries) et fréquence (jours) par groupe musculaire pour une semaine, avec la comparaison Pectoraux / Dos.",
    "<strong>Suggestions</strong> : fatigue accumulée (au moins 2 signaux parmi ton ressenti, ton RPE, les semaines sans décharge et une baisse du 1RM estimé sur plusieurs exercices), plateaux et baisses de force par exercice d'après le 1RM estimé. Rien n'est signalé pendant un programme de décharge. Tu peux déclarer une <strong>pause</strong> (vacances, blessure) en bas de l'onglet : l'analyse et la charge suggérée repartent de zéro après sa fin, et la pause compte comme une décharge. Ce sont des pistes, jamais des décisions.",
    "<strong>Séances passées</strong> : liste par mois ; touche une séance pour corriger ses poids, reps et séries validées."
  ]);

  html += section("Réglages", "Le bouton ⚙️ en haut à droite :", [
    "<strong>Profil et objectifs</strong> : poids, taille, âge, sexe, objectifs nutritionnels.",
    "<strong>Météo</strong> : latitude et longitude du lieu d'entraînement, seuils de température (données Open-Meteo, sans compte).",
    "<strong>Synchronisation</strong> : via un Gist GitHub privé (token et identifiant à coller sur chaque appareil). La version la plus récente remplace l'autre, sans fusion. Le point sur le ⚙️ indique l'état.",
    "<strong>Rappels</strong> : sommeil, fatigue, stress, séance, pesée et B12, chacun avec son heure et son interrupteur. Ils s'affichent à l'ouverture de l'app, à partir de l'heure choisie.",
    "<strong>Personnalisation</strong> : 15 thèmes (aperçu en direct) et sonnerie du minuteur (thème, classique, douce, alarme).",
    "<strong>Sauvegarde manuelle</strong> : exporte tes données en texte ou fichier, ou importe une sauvegarde. Utile avant de changer d'appareil."
  ]);

  html += section("Bon à savoir", "", [
    "Toutes les données restent sur l'appareil (localStorage), sauf si tu actives la synchronisation.",
    "Écran iPad : si tu lances <strong>bridge_server.py</strong> sur le même appareil, la page ipad-recepteur.html affiche la série en cours et le minuteur.",
    "Les suggestions, la météo et les objectifs recalculés sont des repères, à valider avec ton bon sens ou ton coach.",
    "Rien n'est bloquant : tu peux ignorer le ressenti, la météo, la synchro ou les rappels."
  ]);

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
  if (vue === 'ipad') { html += construireReglagesIpad(); }
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
  html += ligneMenuReglages('📺', 'Écran iPad', 'ipad');
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
  { valeur: 'theme', libelle: 'Thème' },
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

/* --- Export / import manuel --- */

function ouvrirExportDonnees() {
  var texte = JSON.stringify(etat);
  var html = '<div class="modal-entete"><div class="modal-entete-gauche"><button class="bouton-retour" data-action="reglages-retour">&#8249;</button><h2>Exporter</h2></div><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<p class="reglages-note" style="margin:0 2px 10px;">Touche le texte, sélectionne tout, copie, puis colle-le dans Notes.</p>';
  html += '<div class="champ"><textarea id="champ-export" style="min-height:220px;" readonly>' + echapperHtml(texte) + '</textarea></div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="tenter-telechargement-json">Télécharger un fichier</button>';
  ouvrirModal(html, 'avant');
}

function tenterTelechargementJson() {
  try {
    var blob = new Blob([JSON.stringify(etat)], { type: 'application/json' });
    var lien = document.createElement('a');
    lien.href = URL.createObjectURL(blob);
    lien.download = 'sporlando-sauvegarde.json';
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
  } catch (e) {
    afficherToast('Téléchargement impossible : copie le texte à la place.');
  }
}

function ouvrirImportDonnees() {
  var html = '<div class="modal-entete"><div class="modal-entete-gauche"><button class="bouton-retour" data-action="reglages-retour">&#8249;</button><h2>Importer</h2></div><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<p class="reglages-note" style="margin:0 2px 10px;">Colle ici le texte exporté. Attention : toutes les données actuelles seront remplacées.</p>';
  html += '<div class="champ"><textarea id="champ-import-texte" style="min-height:200px;" placeholder="Colle la sauvegarde ici"></textarea></div>';
  html += '<div class="champ"><label>Ou choisir un fichier</label><input type="file" id="champ-import-fichier" accept=".json,application/json"></div>';
  html += '<button class="btn btn-plein btn-bloc" data-action="lancer-import-json">Importer</button>';
  ouvrirModal(html, 'avant');
}

function chargerFichierImport() {
  var champ = document.getElementById('champ-import-fichier');
  if (!champ || !champ.files || !champ.files[0]) { return; }
  var lecteur = new FileReader();
  lecteur.onload = function () {
    var zone = document.getElementById('champ-import-texte');
    if (zone) { zone.value = lecteur.result; }
  };
  lecteur.readAsText(champ.files[0]);
}

function lancerImportJson() {
  var zone = document.getElementById('champ-import-texte');
  var texte = zone ? zone.value.trim() : '';
  var donnees = null;
  try { donnees = JSON.parse(texte); } catch (e) { donnees = null; }
  if (!donnees || typeof donnees !== 'object' || !donnees.profil) {
    afficherToast('Texte invalide : ce n\'est pas une sauvegarde.');
    return;
  }
  demanderConfirmation('Remplacer toutes les données de cet appareil par cette sauvegarde ?', function () {
    etat = completerChampsEtat(donnees);
    etat.derniereMiseAJour = Date.now();
    sauvegarderEtat();
    fermerModal();
    appliquerTheme();
    allerVersPage('accueil');
    afficherToast('Données importées.');
  }, function () {
    ouvrirImportDonnees();
  });
}

/* --- Écran iPad --- */

function construireReglagesIpad() {
  var corps = champReglage('Adresse du serveur', 'champ-ipad-adresse', 'text', '', window.lireAdresseIpad(), 'http://192.168.1.20:8765');
  corps += '<p class="reglages-note">Adresse du PC où tourne bridge_server.py, avec le port (8765). Laisse vide pour désactiver l\'envoi.</p>';
  corps += '<button class="btn btn-contour btn-bloc" data-action="tester-ipad">Tester la connexion</button>';
  corps += '<div class="sync-statut-texte" id="ipad-statut"></div>';
  var html = sectionReglages('Serveur', corps);
  html += '<p class="reglages-note" style="margin:0 2px 12px;">Si l\'app est ouverte en https (par exemple sur GitHub Pages), le navigateur n\'autorise l\'envoi que vers 127.0.0.1 : une adresse en réseau local sera bloquée.</p>';
  html += '<button class="btn btn-plein btn-bloc" data-action="enregistrer-ipad">Enregistrer</button>';
  return html;
}

function adresseIpadSaisie() {
  var champ = document.getElementById('champ-ipad-adresse');
  var v = champ ? champ.value.trim().replace(/\/+$/, '') : '';
  if (v && !/^https?:\/\//i.test(v)) { v = 'http://' + v; }
  return v;
}

function enregistrerAdresseIpad() {
  var v = adresseIpadSaisie();
  window.ecrireAdresseIpad(v);
  afficherToast(v ? 'Adresse enregistrée.' : 'Envoi vers l\'iPad désactivé.');
}

function testerConnexionIpad() {
  var zone = document.getElementById('ipad-statut');
  var base = adresseIpadSaisie();
  if (!zone) { return; }
  if (!base) { zone.innerHTML = 'Saisis d\'abord une adresse.'; return; }
  zone.innerHTML = 'Test en cours...';
  var xhr = new XMLHttpRequest();
  try { xhr.open('GET', base + '/health', true); } catch (e) { zone.innerHTML = 'Adresse invalide.'; return; }
  xhr.timeout = 3000;
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) { return; }
    var z = document.getElementById('ipad-statut');
    if (z) { z.innerHTML = (xhr.status === 200) ? 'Serveur joignable ✓' : 'Serveur injoignable (adresse, port, ou page en https).'; }
  };
  xhr.send();
}