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
   BLOC 6 : MODAL GENERIQUE
   ============================================================ */

function ouvrirModal(html) {
  document.getElementById('modal-contenu').innerHTML = html;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function fermerModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('modal-contenu').innerHTML = '';
}

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

})();