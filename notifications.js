/* ============================================================
   RAPPELS QUOTIDIENS (sans backend, vérifiés à l'ouverture de l'app)
   ============================================================ */

var CLE_REGLAGES_RAPPELS = 'carnetMusculationReglagesRappels_v1';

var RAPPELS_DEFAUT = [
  { id: 'sommeil',   label: 'Sommeil de la nuit',     heure: '08:00', actif: true },
  { id: 'fatigue',   label: 'Niveau de fatigue',      heure: '08:00', actif: true },
  { id: 'stress',    label: 'Niveau de stress',       heure: '08:00', actif: true },
  { id: 'seance',    label: 'Séance prévue',          heure: '17:00', actif: true },
  { id: 'pesee',     label: 'Se peser',               heure: '08:00', actif: false }
];

function chargerReglagesRappels() {
  try {
    var brut = window.localStorage.getItem(CLE_REGLAGES_RAPPELS);
    if (brut) {
      var donnees = JSON.parse(brut);
      if (Array.isArray(donnees) && donnees.length > 0) { return donnees; }
    }
  } catch (erreur) {}
  return JSON.parse(JSON.stringify(RAPPELS_DEFAUT));
}

var reglagesRappels = chargerReglagesRappels() || [
  { id: 'eau', label: 'Boire de l\'eau', heure: '10:00', actif: true },
  { id: 'pesee', label: 'Se peser', heure: '08:00', actif: true }
];

function sauvegarderReglagesRappels() {
  try {
    window.localStorage.setItem(CLE_REGLAGES_RAPPELS, JSON.stringify(reglagesRappels));
  } catch (erreur) {}
}

/* --- Suivi de ce qui a déjà été fait aujourd'hui --- */

function cleFaitAujourdhui(idRappel) {
  return 'rappelFait_' + idRappel + '_' + formaterDateISO(new Date());
}

function rappelEstFaitAujourdhui(idRappel) {
  return window.localStorage.getItem(cleFaitAujourdhui(idRappel)) === '1';
}

function marquerRappelFait(idRappel) {
  try {
    window.localStorage.setItem(cleFaitAujourdhui(idRappel), '1');
  } catch (erreur) {}
}

/* --- Permission navigateur --- */

function demanderPermissionNotif() {
  if (!('Notification' in window)) { return Promise.resolve(false); }
  if (Notification.permission === 'granted') { return Promise.resolve(true); }
  if (Notification.permission === 'denied') { return Promise.resolve(false); }
  return Notification.requestPermission().then(function (resultat) {
    return resultat === 'granted';
  });
}

function envoyerNotification(titre, corps, options) {
  if (!('Notification' in window) || Notification.permission !== 'granted') { return; }
  if (!('serviceWorker' in navigator)) { return; }

  var config = options || {};

  navigator.serviceWorker.ready.then(function (reg) {
    reg.showNotification(titre, {
      body: corps,
      icon: 'images/icon-180.png',
      badge: 'images/icon-180.png',
      image: config.image || undefined,
      tag: config.tag || 'carnet-muscu-rappel',
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      timestamp: Date.now(),
      dir: 'ltr',
      lang: 'fr',
      data: { url: './' },
      actions: [
        { action: 'ouvrir', title: '📖 Ouvrir' },
        { action: 'fermer', title: '✖️ Ignorer' }
      ]
    });
  });
}

function jouerSonNotification() {
  try {
    var audio = new Audio('sons/notification.mp3');
    audio.play().catch(function () {});
  } catch (erreur) {}
}

/* --- Vérification au lancement de l'app --- */

function heureActuelleDepassee(heureRappel) {
  var maintenant = new Date();
  var parties = heureRappel.split(':');
  var heureCible = new Date();
  heureCible.setHours(parseInt(parties[0], 10), parseInt(parties[1], 10), 0, 0);
  return maintenant >= heureCible;
}

function verifierRappelsDus() {
  var rappelsDus = [];
  reglagesRappels.forEach(function (rappel) {
    if (!rappel.actif) { return; }
    if (rappelEstFaitAujourdhui(rappel.id)) { return; }
    if (!heureActuelleDepassee(rappel.heure)) { return; }
    rappelsDus.push(rappel);
  });
  return rappelsDus;
}

function traiterRappelsAuLancement() {
  var rappelsDus = verifierRappelsDus();
  if (rappelsDus.length === 0) { return; }

  demanderPermissionNotif().then(function (accorde) {
    rappelsDus.forEach(function (rappel) {
      if (accorde) {
        envoyerNotification('Carnet Muscu', rappel.label, { tag: 'rappel-' + rappel.id });
      }
    });
  });

  afficherBanniereRappels(rappelsDus);
}

/* --- Bannière sur l'accueil --- */

function afficherBanniereRappels(rappelsDus) {
  var zone = document.getElementById('zone-banniere-rappels');
  if (!zone) { return; }
  if (!rappelsDus || rappelsDus.length === 0) { zone.innerHTML = ''; return; }

  var html = '<div class="carte-checklist">';
  html += '<div class="checklist-entete"><span class="titre-affichage">À noter aujourd\'hui</span></div>';
  rappelsDus.forEach(function (rappel) {
    html += '<div class="checklist-ligne">';
    html += '<button class="bulle-validation checklist-bouton" data-action="marquer-rappel-fait" data-rappel-id="' + rappel.id + '" title="Marquer comme fait">✓</button>';
    html += '<span class="checklist-texte">' + echapperHtml(rappel.label) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  zone.innerHTML = html;
}

function marquerRappelFaitEtRafraichir(idRappel) {
  marquerRappelFait(idRappel);
  var rappelsDus = verifierRappelsDus();
  afficherBanniereRappels(rappelsDus);
}

/* --- Formulaire de réglages --- */

function renderRemindersSettings() {
  var zone = document.getElementById('reminders-container');
  if (!zone) { return; }
  var html = '';
  reglagesRappels.forEach(function (rappel, index) {
    html += '<div class="champ" style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">';
    html += '<input type="checkbox" data-action="toggle-rappel-actif" data-index="' + index + '" ' + (rappel.actif ? 'checked' : '') + '>';
    html += '<span style="flex:1; min-width:140px;">' + echapperHtml(rappel.label) + '</span>';
    html += '<input type="time" value="' + rappel.heure + '" data-action="changer-heure-rappel" data-index="' + index + '">';
    html += '</div>';
  });
  zone.innerHTML = html;
}

function toggleRappelActif(index) {
  reglagesRappels[index].actif = !reglagesRappels[index].actif;
  sauvegarderReglagesRappels();
}

function changerHeureRappel(index, nouvelleHeure) {
  reglagesRappels[index].heure = nouvelleHeure;
  sauvegarderReglagesRappels();
}