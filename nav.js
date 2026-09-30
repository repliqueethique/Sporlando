(function () {
'use strict';

var ORDRE = ['accueil', 'seance', 'nutrition', 'bibliotheque', 'historique'];
var CLASSES_PAGE = ['page-entre-avant', 'page-entre-arriere', 'page-entre-fondu'];

var nav = document.getElementById('nav-bas');
var piste = document.getElementById('nav-piste');
var indicateur = document.getElementById('nav-indicateur');
if (!nav || !piste || !indicateur) { return; }
var onglets = piste.querySelectorAll('.nav-onglet');

var SEUIL_DRAG = 8;
var indexCourant = 0;
var navActive = true;
var geste = null;
var bloquerClicJusqua = 0;

function pas() { return piste.offsetWidth / ORDRE.length; }

function poserIndicateur(px) {
  var valeur = 'translateX(' + px + 'px)';
  indicateur.style.webkitTransform = valeur;
  indicateur.style.transform = valeur;
}

function limiter(valeur, min, max) {
  if (valeur < min) { return min; }
  if (valeur > max) { return max; }
  return valeur;
}

function effacerSurvol() {
  for (var i = 0; i < onglets.length; i++) { onglets[i].classList.remove('nav-onglet-survol'); }
}

function survoler(index) {
  for (var i = 0; i < onglets.length; i++) {
    if (i === index) { onglets[i].classList.add('nav-onglet-survol'); }
    else { onglets[i].classList.remove('nav-onglet-survol'); }
  }
}

function rebondIcone(index) {
  var icone = onglets[index].querySelector('.nav-icone');
  if (!icone) { return; }
  icone.classList.remove('nav-rebond');
  void icone.offsetWidth; /* force le redémarrage de l'animation */
  icone.classList.add('nav-rebond');
}

function animerPage(nomPage, ancienne) {
  if (!ancienne || ancienne === nomPage) { return; }
  var indexNouvelle = ORDRE.indexOf(nomPage);
  if (indexNouvelle === -1) { return; }
  var el = document.getElementById('page-' + nomPage);
  if (!el) { return; }
  var indexAncienne = ORDRE.indexOf(ancienne);
  var classe = 'page-entre-fondu';
  if (indexAncienne !== -1) { classe = indexNouvelle > indexAncienne ? 'page-entre-avant' : 'page-entre-arriere'; }
  for (var i = 0; i < CLASSES_PAGE.length; i++) { el.classList.remove(CLASSES_PAGE[i]); }
  void el.offsetWidth;
  el.classList.add(classe);
  window.setTimeout(function () { el.classList.remove(classe); }, 450);
}

/* Appelée par allerVersPage() à chaque changement de page */
function maj(nomPage, anciennePage) {
  var index = ORDRE.indexOf(nomPage);
  nav.classList.remove('nav-glisse');
  effacerSurvol();

  if (index === -1) {
    /* page hors barre (ex. étirements) : on masque la pastille */
    navActive = false;
    nav.classList.add('nav-sans-actif');
    for (var a = 0; a < onglets.length; a++) { onglets[a].classList.remove('nav-onglet-actif'); }
    return;
  }

  navActive = true;
  nav.classList.remove('nav-sans-actif');
  var indexPrecedent = indexCourant;
  indexCourant = index;
  poserIndicateur(index * pas());

  for (var i = 0; i < onglets.length; i++) {
    if (i === index) { onglets[i].classList.add('nav-onglet-actif'); }
    else { onglets[i].classList.remove('nav-onglet-actif'); }
  }
  if (anciennePage && anciennePage !== nomPage) { rebondIcone(index); }
  animerPage(nomPage, anciennePage);
}

/* --- Glissement sur la barre --- */
nav.addEventListener('touchstart', function (e) {
  if (!navActive || e.touches.length !== 1) { geste = null; return; }
  geste = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
    t: Date.now(),
    depart: indexCourant,
    pas: pas(),
    glisse: false,
    dx: 0
  };
}, false);

nav.addEventListener('touchmove', function (e) {
  if (!geste) { return; }
  var dx = e.touches[0].clientX - geste.x;
  var dy = e.touches[0].clientY - geste.y;
  if (!geste.glisse) {
    if (Math.abs(dx) < SEUIL_DRAG) { return; }
    if (Math.abs(dy) > Math.abs(dx)) { geste = null; return; }
    geste.glisse = true;
    nav.classList.add('nav-glisse');
  }
  e.preventDefault();
  geste.dx = dx;
  var position = limiter(geste.depart * geste.pas + dx, 0, (ORDRE.length - 1) * geste.pas);
  poserIndicateur(position);
  survoler(Math.round(position / geste.pas));
}, false);

function finGeste() {
  if (!geste) { return; }
  var g = geste;
  geste = null;
  if (!g.glisse) { return; }

  bloquerClicJusqua = Date.now() + 400;
  nav.classList.remove('nav-glisse');
  effacerSurvol();

  var position = limiter(g.depart * g.pas + g.dx, 0, (ORDRE.length - 1) * g.pas);
  var cible = Math.round(position / g.pas);
  /* petit coup de doigt rapide : on passe à l'onglet voisin */
  if (cible === g.depart && Math.abs(g.dx) > 25 && (Date.now() - g.t) < 350) {
    cible = g.depart + (g.dx < 0 ? -1 : 1);
  }
  cible = limiter(cible, 0, ORDRE.length - 1);

  if (cible !== g.depart && typeof window.allerVersPage === 'function') {
    window.allerVersPage(ORDRE[cible]);
  } else {
    poserIndicateur(g.depart * g.pas); /* retour élastique */
  }
}
nav.addEventListener('touchend', finGeste, false);
nav.addEventListener('touchcancel', finGeste, false);

/* Évite que le clic "fantôme" après un glissement déclenche un onglet */
nav.addEventListener('click', function (e) {
  if (Date.now() < bloquerClicJusqua) {
    e.stopPropagation();
    e.preventDefault();
  }
}, true);

/* Recalage si la largeur change (rotation de l'iPad) */
window.addEventListener('resize', function () {
  if (!navActive) { return; }
  nav.classList.add('nav-glisse'); /* coupe la transition le temps du recalage */
  poserIndicateur(indexCourant * pas());
  window.setTimeout(function () { nav.classList.remove('nav-glisse'); }, 50);
});

window.addEventListener('load', function () {
  nav.classList.add('nav-glisse');
  poserIndicateur(indexCourant * pas());
  window.setTimeout(function () { nav.classList.remove('nav-glisse'); }, 50);
});

window.NavBas = { maj: maj };
poserIndicateur(0);
})();