(function () {
'use strict';

/* ============================================================
   BLOC 3 : OUTILS GENERIQUES (compatibles anciens navigateurs)
   ============================================================ */

function genererId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 100000).toString(36);
}

function echapperHtml(texte) {
  if (texte === null || texte === undefined) { return ''; }
  return String(texte)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function completerZero(nombre) {
  nombre = Math.floor(nombre);
  if (nombre < 10) { return '0' + nombre; }
  return String(nombre);
}

function formaterDateISO(date) {
  return date.getFullYear() + '-' + completerZero(date.getMonth() + 1) + '-' + completerZero(date.getDate());
}

function dateDepuisISO(chaineISO) {
  var parties = chaineISO.split('-');
  return new Date(parseInt(parties[0], 10), parseInt(parties[1], 10) - 1, parseInt(parties[2], 10));
}

function formaterDateLisible(chaineISO) {
  var joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  var mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var d = dateDepuisISO(chaineISO);
  var jourSemaineIndex = (d.getDay() + 6) % 7;
  return joursSemaine[jourSemaineIndex] + ' ' + d.getDate() + ' ' + mois[d.getMonth()];
}

/* ============================================================
   BLOC 6 : MODAL GENERIQUE (feuille animée)
   ============================================================ */

var DUREE_FERMETURE_MODAL = 320;
var minuteurFermetureModal = null;
var minuteurPremiereModal = null;

function poserTransformModal(el, valeur) {
  el.style.webkitTransform = valeur;
  el.style.transform = valeur;
}

/* sens (optionnel) : 'avant' ou 'arriere' pour un glissement latéral
   quand on navigue entre deux écrans dans une modale déjà ouverte */
function ouvrirModal(html, sens) {
  var overlay = document.getElementById('modal-overlay');
  var contenu = document.getElementById('modal-contenu');

  if (minuteurFermetureModal) { window.clearTimeout(minuteurFermetureModal); minuteurFermetureModal = null; }
  if (minuteurPremiereModal) { window.clearTimeout(minuteurPremiereModal); minuteurPremiereModal = null; }

  var dejaOuvert = overlay.classList.contains('modal-ouvert');

  contenu.className = 'modal-contenu';
  contenu.style.webkitTransition = '';
  contenu.style.transition = '';
  poserTransformModal(contenu, '');
  contenu.innerHTML = '<div class="modal-poignee"></div>' + html;

  if (!dejaOuvert) {
    contenu.scrollTop = 0;
    contenu.className = 'modal-contenu modal-premiere';
    overlay.style.display = 'flex';
    void overlay.offsetWidth; /* force le calcul de style avant de lancer la transition */
    overlay.classList.add('modal-ouvert');
    minuteurPremiereModal = window.setTimeout(function () {
      minuteurPremiereModal = null;
      contenu.className = contenu.className.replace(' modal-premiere', '');
    }, 1000);
  } else if (sens) {
    contenu.scrollTop = 0;
    contenu.className = 'modal-contenu ' + (sens === 'arriere' ? 'modal-sens-arriere' : 'modal-sens-avant');
  }
}

function fermerModal() {
  var overlay = document.getElementById('modal-overlay');
  var contenu = document.getElementById('modal-contenu');
  if (overlay.style.display === 'none') { return; }

  overlay.classList.remove('modal-ouvert');
  poserTransformModal(contenu, '');

  if (minuteurFermetureModal) { window.clearTimeout(minuteurFermetureModal); }
  minuteurFermetureModal = window.setTimeout(function () {
    minuteurFermetureModal = null;
    overlay.style.display = 'none';
    contenu.innerHTML = '';
    contenu.className = 'modal-contenu';
  }, DUREE_FERMETURE_MODAL);
}

/* Glisser la poignée ou l'en-tête vers le bas pour fermer */
(function () {
  var contenu = document.getElementById('modal-contenu');
  if (!contenu) { return; }
  var actif = false;
  var y0 = 0;
  var dy = 0;

  function estZoneDeGlisse(cible) {
    if (!cible || !cible.closest) { return false; }
    if (cible.closest('button, input, select, textarea, a')) { return false; }
    return !!cible.closest('.modal-poignee, .modal-entete, .echauf-entete');
  }

  contenu.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || !estZoneDeGlisse(e.target)) { return; }
    actif = true;
    dy = 0;
    y0 = e.touches[0].clientY;
    contenu.style.webkitTransition = 'none';
    contenu.style.transition = 'none';
  }, false);

  contenu.addEventListener('touchmove', function (e) {
    if (!actif) { return; }
    dy = e.touches[0].clientY - y0;
    if (dy < 0) { dy = dy / 5; } /* effet élastique vers le haut */
    poserTransformModal(contenu, 'translateY(' + dy + 'px)');
    e.preventDefault();
  }, false);

  function relacher() {
    if (!actif) { return; }
    actif = false;
    contenu.style.webkitTransition = '';
    contenu.style.transition = '';
    if (dy > 100) {
      fermerModal();
    } else {
      poserTransformModal(contenu, ''); /* retour avec le rebond du CSS */
    }
  }
  contenu.addEventListener('touchend', relacher, false);
  contenu.addEventListener('touchcancel', relacher, false);
})();

/* Notifications "toast" */
var fileToasts = [];
var toastEnCours = false;

function afficherToast(message) {
  fileToasts.push(message);
  traiterFileToasts();
}

function traiterFileToasts() {
  if (toastEnCours || fileToasts.length === 0) { return; }
  var conteneur = document.getElementById('toast-conteneur');
  if (!conteneur) { return; }
  toastEnCours = true;
  var message = fileToasts.shift();
  var el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = echapperHtml(message);
  conteneur.appendChild(el);
  window.setTimeout(function () {
    if (el.parentNode) { el.parentNode.removeChild(el); }
    toastEnCours = false;
    traiterFileToasts();
  }, 3200);
}

/* Confirmation maison */
var confirmationCallbackOui = null;
var confirmationCallbackAnnuler = null;

function demanderConfirmation(message, callbackOui, callbackAnnuler) {
  confirmationCallbackOui = callbackOui || null;
  confirmationCallbackAnnuler = callbackAnnuler || null;
  var html = '';
  html += '<div class="modal-entete"><h2>Confirmation</h2></div>';
  html += '<div style="margin-bottom:18px; font-size:14px; line-height:1.4;">' + echapperHtml(message) + '</div>';
  html += '<button class="btn btn-alerte btn-bloc" data-action="confirmation-valider">Confirmer</button>';
  html += '<button class="btn btn-contour btn-bloc" style="margin-top:8px;" data-action="confirmation-annuler">Annuler</button>';
  ouvrirModal(html);
}

function validerConfirmation() {
  var cb = confirmationCallbackOui;
  confirmationCallbackOui = null;
  confirmationCallbackAnnuler = null;
  if (cb) { cb(); } else { fermerModal(); }
}

function annulerConfirmation() {
  var cb = confirmationCallbackAnnuler;
  confirmationCallbackOui = null;
  confirmationCallbackAnnuler = null;
  if (cb) { cb(); } else { fermerModal(); }
}

/* Exposition globale (utilisé par app.js, exercices.js, nutrition.js, notifications.js) */
window.genererId = genererId;
window.echapperHtml = echapperHtml;
window.completerZero = completerZero;
window.formaterDateISO = formaterDateISO;
window.dateDepuisISO = dateDepuisISO;
window.formaterDateLisible = formaterDateLisible;
window.ouvrirModal = ouvrirModal;
window.fermerModal = fermerModal;
window.afficherToast = afficherToast;
window.demanderConfirmation = demanderConfirmation;
window.validerConfirmation = validerConfirmation;
window.annulerConfirmation = annulerConfirmation;

/* ============================================================
   SOUS-ONGLETS : pastille glissante (comme la barre du bas)
   ============================================================ */
(function () {
  var planifie = false;

  function placer(conteneur) {
    if (conteneur.offsetWidth === 0) { return; } /* masqué : on ne mesure pas */

    var actif = conteneur.querySelector('.sous-onglet-actif');
    var indic = conteneur.querySelector('.sous-indicateur');
    var neuf = false;
    if (!indic) {
      indic = document.createElement('span');
      indic.className = 'sous-indicateur';
      conteneur.insertBefore(indic, conteneur.firstChild);
      neuf = true;
    }

    if (!actif) {
      if (!indic.classList.contains('sous-sans-actif')) { indic.classList.add('sous-sans-actif'); }
      return;
    }
    if (indic.classList.contains('sous-sans-actif')) { indic.classList.remove('sous-sans-actif'); }

    var x = actif.offsetLeft;
    var l = actif.offsetWidth;
    var cle = x + ':' + l;
    if (!neuf && conteneur._sousCle === cle) { return; } /* rien n'a bougé */

    var sansAnimation = neuf || !conteneur._sousCle;
    if (sansAnimation) {
      indic.style.webkitTransition = 'none';
      indic.style.transition = 'none';
    }
    indic.style.width = l + 'px';
    indic.style.webkitTransform = 'translateX(' + x + 'px)';
    indic.style.transform = 'translateX(' + x + 'px)';
    if (sansAnimation) {
      void indic.offsetWidth;
      indic.style.webkitTransition = '';
      indic.style.transition = '';
    }
    conteneur._sousCle = cle;

    /* si la barre défile, on recentre l'onglet actif (seulement quand il change) */
    if (conteneur.scrollWidth > conteneur.clientWidth + 1) {
      conteneur.scrollLeft = Math.max(0, x - (conteneur.clientWidth - l) / 2);
    }
  }

  function majSousOnglets() {
    var liste = document.querySelectorAll('.sous-onglets');
    for (var i = 0; i < liste.length; i++) { placer(liste[i]); }
  }

  function planifier() {
    if (planifie) { return; }
    planifie = true;
    var rafraichir = window.requestAnimationFrame || function (f) { return window.setTimeout(f, 16); };
    rafraichir(function () {
      planifie = false;
      majSousOnglets();
    });
  }

  if (window.MutationObserver) {
    new MutationObserver(planifier).observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class']
    });
  }
  window.addEventListener('resize', planifier, false);
  window.addEventListener('orientationchange', planifier, false);
  window.addEventListener('load', planifier, false);
  planifier();
})();

})();