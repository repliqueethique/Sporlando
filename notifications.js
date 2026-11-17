/* ============================================================
   RAPPELS QUOTIDIENS (sans backend, vérifiés à l'ouverture de l'app)
   ============================================================ */

var CLE_REGLAGES_RAPPELS = 'carnetMusculationReglagesRappels_v1';

var RAPPELS_DEFAUT = [
  { id: 'sommeil',   label: 'Sommeil de la nuit',     heure: '08:00', actif: true },
  { id: 'fatigue',   label: 'Niveau de fatigue',      heure: '08:00', actif: true },
  { id: 'stress',    label: 'Niveau de stress',       heure: '08:00', actif: true },
  { id: 'seance',    label: 'Séance prévue',          heure: '17:00', actif: true },
  { id: 'pesee',     label: 'Se peser',               heure: '08:00', actif: false },
  { id: 'b12',       label: 'Prendre ma B12',         heure: '12:00', actif: true }
];

function chargerReglagesRappels() {
  try {
    var brut = window.localStorage.getItem(CLE_REGLAGES_RAPPELS);
    if (brut) {
      var donnees = JSON.parse(brut);
      if (Array.isArray(donnees) && donnees.length > 0) {
        /* ajoute les rappels par défaut qui n'existent pas encore (ex. un nouveau rappel ajouté plus tard) */
        RAPPELS_DEFAUT.forEach(function (modele) {
          var present = donnees.some(function (r) { return r.id === modele.id; });
          if (!present) { donnees.push(JSON.parse(JSON.stringify(modele))); }
        });
        return donnees;
      }
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
      badge: 'images/badge.png',
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

function marquerRappelFaitEtRafraichir(idRappel) {
  marquerRappelFait(idRappel);
  var rappelsDus = verifierRappelsDus();
  afficherBanniereRappels(rappelsDus);
}

/* --- Formulaire de réglages --- */

function renderRemindersSettings() {
  var zone = document.getElementById('reminders-container');
  if (!zone) { return; }
  var html = '<div class="reglages-section">';
  reglagesRappels.forEach(function (rappel, index) {
    html += '<div class="reglages-rappel">';
    html += '<span class="reglages-rappel-libelle">' + echapperHtml(rappel.label) + '</span>';
    html += '<input type="time" value="' + rappel.heure + '" data-action="changer-heure-rappel" data-index="' + index + '">';
    html += '<input type="checkbox" data-action="toggle-rappel-actif" data-index="' + index + '" ' + (rappel.actif ? 'checked' : '') + '>';
    html += '</div>';
  });
  html += '</div>';
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