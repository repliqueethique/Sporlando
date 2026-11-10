
/* ============================================================
   THÈME FLIBUSTE — décors (à charger APRÈS app.js)
   Construit les scènes (pont, taverne de Tortuga, caverne au trésor, galion coulé),
   les lueurs de torches, les particules et le pavillon noir de l'en-tête.
   Il ne modifie pas app.js : il observe seulement le thème et la page affichée.
   ============================================================ */
(function () {
'use strict';

var PIRATE_ANIME = true;   /* false = plus aucun mouvement (décors fixes) */

/* quelle scène pour quelle page */
var SCENE_PAR_PAGE = { accueil: 'pont', seance: 'pont', etirement: 'pont', nutrition: 'tortuga', bibliotheque: 'caverne', historique: 'galion' };
var INDEX_PAGE = { accueil: 0, etirement: 0, seance: 1, nutrition: 2, bibliotheque: 3, historique: 4 };
var DECALAGE_PAGE_PX = 24;      /* décalage horizontal du décor par onglet */
var VITESSE_SCROLL = 0.5;       /* 0 = décor immobile, 1 = suit le contenu */
var PERIODE_TEXTURE = 240;      /* taille des motifs (ne pas changer) */

var racine = document.documentElement;
var scene = null, avant = null, decors = {}, sceneCourante = null, attente = false;

function alea(min, max) { return min + Math.random() * (max - min); }
function estPirate() { return racine.getAttribute('data-theme') === 'flibuste'; }

if (!PIRATE_ANIME || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
  racine.className += ' pr-calme';
}

/* ---------- pavillon noir (SVG animé) ---------- */
function htmlPavillon() {
  var d1 = 'M2.6 4 C16 0,30 9,44 5 S60 3,68 6 C65 12,66 18,68 24 C66 31,67 36,69 40 C60 43,52 36,44 40 S16 44,2.6 40 Z';
  var d2 = 'M2.6 4 C16 8,30 1,44 5 S60 9,68 5 C66 11,65 18,67 23 C68 30,66 36,68 41 C60 38,52 44,44 40 S16 36,2.6 40 Z';
  var d3 = 'M2.6 4 C16 3,30 6,44 4 S60 6,68 7 C64 13,67 19,69 25 C65 32,66 35,67 39 C60 41,52 40,44 41 S16 41,2.6 40 Z';
  var anim = PIRATE_ANIME;
  return '<svg viewBox="0 0 70 46" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="0" y="0" width="2.6" height="46" rx="1.2" fill="#8B6A3A"/><circle cx="1.3" cy="1.3" r="2.5" fill="#D9A53A"/>' +
    '<g>' +
    (anim ? '<animateTransform attributeName="transform" type="skewY" values="0;-2.5;0;2.5;0" dur="3.4s" repeatCount="indefinite"/>' : '') +
    '<path fill="#05070A" stroke="#B7945A" stroke-width=".9" stroke-linejoin="round" d="' + d1 + '">' +
    (anim ? '<animate attributeName="d" dur="2.6s" repeatCount="indefinite" values="' + d1 + ';' + d2 + ';' + d3 + ';' + d1 + '"/>' : '') +
    '</path>' +
    '<g transform="translate(20 7) scale(.62)">' +
    '<path fill="#F2E6C8" d="M20 3C12.4 3 7.5 8 7.5 14.2c0 3.8 1.9 6.6 4.2 8.1V28c0 1.2 1 2.2 2.2 2.2h12.2c1.2 0 2.2-1 2.2-2.2v-5.7c2.3-1.5 4.2-4.3 4.2-8.1C32.5 8 27.6 3 20 3z"/>' +
    '<g fill="#05070A"><ellipse cx="14.8" cy="15.2" rx="3.4" ry="3.7"/><ellipse cx="25.2" cy="15.2" rx="3.4" ry="3.7"/><path d="M20 19.6l-2.2 4h4.4z"/></g>' +
    '<g stroke="#F2E6C8" stroke-width="3.2" stroke-linecap="round"><path d="M5.5 31.5L34.5 40.5M34.5 31.5L5.5 40.5"/></g>' +
    '</g></g></svg>';
}

function poserPavillon() {
  var carte = document.querySelector('.entete-carte');
  if (!carte || carte.querySelector('.pr-pavillon')) { return; }
  var el = document.createElement('div');
  el.className = 'pr-pavillon';
  el.innerHTML = htmlPavillon();
  var droite = carte.querySelector('.zone-entete-droite');
  if (droite) { carte.insertBefore(el, droite); } else { carte.appendChild(el); }
}

/* ---------- scènes ---------- */
function htmlDecor(nom, contenu, roulis) {
  var texture = '<div class="pr-texture"></div>';
  var fond = roulis ? '<div class="pr-roulis">' + texture + '</div>' : texture;
  return '<div class="pr-decor pr-' + nom + '"><div class="pr-fond">' + (contenu || fond) + '</div><div class="pr-teinte"></div></div>';
}

function construireScene() {
  if (scene) { return; }
  scene = document.createElement('div');
  scene.className = 'pr-scene';
  scene.innerHTML =
    htmlDecor('pont', null, true) +
    htmlDecor('tortuga') +
    htmlDecor('caverne') +
    htmlDecor('galion',
      '<div class="pr-rais pr-rais-1"></div><div class="pr-rais pr-rais-2"></div><div class="pr-rais pr-rais-3"></div>' +
      '<div class="pr-epave"></div><div class="pr-oeil"></div><div class="pr-kraken pr-kraken-g"></div><div class="pr-kraken pr-kraken-d"></div>');
  document.body.insertBefore(scene, document.body.firstChild);
  var noms = ['pont', 'tortuga', 'caverne', 'galion'];
  for (var i = 0; i < noms.length; i++) { decors[noms[i]] = scene.querySelector('.pr-' + noms[i]); }

  avant = document.createElement('div');
  avant.className = 'pr-avant';
  avant.innerHTML = '<div class="pr-nuit"></div>' +
    '<div class="pr-lueurs"><div class="pr-lueur pr-lueur-g"></div><div class="pr-lueur pr-lueur-d"></div></div>' +
    groupe('braise', 9, function (i) {
      var t = alea(2, 4).toFixed(1), d = alea(6, 13);
      return 'left:' + alea(0, 26).toFixed(0) + '%;width:' + t + 'px;height:' + t + 'px;' + temps(d) +
        '--dx:' + alea(10, 90).toFixed(0) + 'px;--dy:-' + alea(260, 640).toFixed(0) + 'px;';
    }) +
    groupe('brume', 3, function (i) {
      var d = alea(22, 36);
      return 'left:-30vw;bottom:' + alea(-8, 6).toFixed(0) + '%;width:' + alea(70, 110).toFixed(0) + 'vw;height:' + alea(22, 36).toFixed(0) + 'vh;' + temps(d) +
        '--dx:' + alea(50, 90).toFixed(0) + 'vw;';
    }) +
    groupe('brille', 14, function (i) {
      var d = alea(2.4, 5.6);
      return 'left:' + alea(2, 96).toFixed(0) + '%;top:' + alea(4, 92).toFixed(0) + '%;font-size:' + alea(7, 15).toFixed(0) + 'px;' + temps(d);
    }) +
    groupe('bulle', 14, function (i) {
      var t = alea(6, 22).toFixed(0), d = alea(12, 26);
      return 'left:' + alea(0, 98).toFixed(0) + '%;width:' + t + 'px;height:' + t + 'px;' + temps(d) +
        '--dx:' + alea(-40, 40).toFixed(0) + 'px;';
    }) +
    groupe('poussiere', 12, function (i) {
      var t = alea(1.6, 3).toFixed(1), d = alea(8, 16);
      return 'left:' + alea(0, 98).toFixed(0) + '%;top:' + alea(0, 96).toFixed(0) + '%;width:' + t + 'px;height:' + t + 'px;' + temps(d) +
        '--dx:' + alea(-60, 60).toFixed(0) + 'px;--dy:' + alea(-60, 60).toFixed(0) + 'px;';
    });
  document.body.appendChild(avant);
}

function temps(duree) {
  return 'animation-duration:' + duree.toFixed(1) + 's;-webkit-animation-duration:' + duree.toFixed(1) + 's;' +
    'animation-delay:-' + (Math.random() * duree).toFixed(1) + 's;-webkit-animation-delay:-' + (Math.random() * duree).toFixed(1) + 's;';
}

function groupe(nom, n, style) {
  var h = '<div class="pr-g pr-g-' + nom + '">';
  for (var i = 0; i < n; i++) { h += '<span class="pr-p pr-' + nom + '" style="' + style(i) + '"></span>'; }
  return h + '</div>';
}

/* ---------- mise à jour : thème, page, défilement ---------- */
function pageAffichee() {
  var p = document.querySelector('.page.page-active');
  return p ? p.id.replace('page-', '') : 'accueil';
}

function marquerCartes() {
  /* le calendrier de l'agenda devient une carte au trésor */
  var grille = document.getElementById('cal-grille');
  if (!grille) { return; }
  var carte = grille.parentNode;
  while (carte && carte !== document.body && !(carte.className && String(carte.className).indexOf('carte') !== -1)) { carte = carte.parentNode; }
  if (carte && carte !== document.body && String(carte.className).indexOf('pr-carte-tresor') === -1) { carte.className += ' pr-carte-tresor'; }
}

function transformer(el, x, y) {
  var v = 'translate3d(' + x + 'px,' + y + 'px,0)';
  el.style.webkitTransform = v;
  el.style.transform = v;
}

function decalerTextures() {
  if (!scene) { return; }
  var y = -((window.pageYOffset * VITESSE_SCROLL) % PERIODE_TEXTURE);
  var t = scene.querySelectorAll('.pr-texture');
  for (var i = 0; i < t.length; i++) { transformer(t[i], 0, y); }
}

function majScene() {
  attente = false;
  if (!estPirate()) {
    racine.removeAttribute('data-pr-scene');
    return;
  }
  construireScene();
  poserPavillon();
  marquerCartes();
  var page = pageAffichee();
  var nom = SCENE_PAR_PAGE[page] || 'pont';
  if (nom !== sceneCourante) {
    for (var k in decors) {
      if (decors.hasOwnProperty(k)) {
        if (k === nom) { decors[k].className += ' pr-actif'; }
        else { decors[k].className = decors[k].className.replace(/\s*pr-actif/g, ''); }
      }
    }
    racine.setAttribute('data-pr-scene', nom);
    sceneCourante = nom;
  }
  var dx = -(INDEX_PAGE[page] || 0) * DECALAGE_PAGE_PX;
  var fonds = scene.querySelectorAll('.pr-fond');
  for (var i = 0; i < fonds.length; i++) { transformer(fonds[i], dx, 0); }
  decalerTextures();
}

function planifier() {
  if (attente) { return; }
  attente = true;
  window.requestAnimationFrame(majScene);
}

/* le thème change (attribut data-theme) */
new MutationObserver(planifier).observe(racine, { attributes: true, attributeFilter: ['data-theme'] });
/* la page change (classe page-active) */
var main = document.querySelector('main');
if (main) { new MutationObserver(planifier).observe(main, { attributes: true, attributeFilter: ['class'], subtree: true }); }
window.addEventListener('scroll', function () {
  if (!scene || !estPirate()) { return; }
  window.requestAnimationFrame(decalerTextures);
}, false);

majScene();
})();

/* ===== THÈME FLIBUSTE : L'EN-TÊTE DEVIENT UN DRAPEAU NOIR ===== */
(function () {
'use strict';

var racine = document.documentElement;

/* Réglages du vent (tu peux les modifier) */
var VENT = true;        /* false = tout est immobile */
var PERIODE = 2.0;      /* secondes pour qu'un pli traverse le drapeau : plus petit = plus de vent */
var AMPLITUDE = 3.6;    /* hauteur des ondulations du bord, en pixels */

var calme = !VENT || racine.className.indexOf('pr-calme') !== -1;
var W = 400, H = 68, HAUT = 6, BAS = 62, LONG = 133, ETAPES = 12;

/* bord droit déchiré : [position de haut en bas (0 à 1), profondeur de la déchirure] */
var DECHIRURE = [[.10,3],[.16,13],[.21,2],[.29,5],[.325,34],[.35,6],[.42,16],[.47,4],[.56,10],[.60,30],[.635,7],[.72,18],[.78,3],[.86,12],[.92,4]];

function onde(x, phase, decalage) {
  return AMPLITUDE * (0.2 + 0.8 * (x / W)) * Math.sin(2 * Math.PI * (x / LONG - phase) + decalage);
}

/* forme du tissu à un instant donné (phase de 0 à 1) : l'onde grandit vers le bout libre, les lambeaux battent plus fort */
function formeTissu(phase) {
  var N = 40, haut = [], bas = [], dech = [], i, j, x, t, dx, xx, yh, yb, flot;
  for (i = 0; i <= N; i++) {
    x = i * W / N;
    haut.push(x.toFixed(1) + ',' + (HAUT + onde(x, phase, 0)).toFixed(2));
    bas.push(x.toFixed(1) + ',' + (BAS + onde(x, phase, 0.45)).toFixed(2));
  }
  for (j = 0; j < DECHIRURE.length; j++) {
    t = DECHIRURE[j][0]; dx = DECHIRURE[j][1]; xx = W - dx;
    yh = HAUT + onde(xx, phase, 0); yb = BAS + onde(xx, phase, 0.45);
    flot = dx > 8 ? 2.2 * Math.sin(4 * Math.PI * phase + t * 9) * (dx / 34) : 0;
    dech.push(xx.toFixed(1) + ',' + (yh + t * (yb - yh) + flot).toFixed(2));
  }
  bas.reverse();
  return 'M' + haut.join(' L') + ' L' + dech.join(' L') + ' L' + bas.join(' L') + ' Z';
}

function valeursTissu() {
  var v = [], i;
  for (i = 0; i <= ETAPES; i++) { v.push(formeTissu(i / ETAPES)); }
  return v.join(';');
}

/* dégradé de plis : lumière où le tissu fait face à la torche, ombre ailleurs */
function degrade(id, longueur, inclinaison, clair, sombre, duree) {
  var s = '', i, u, v;
  for (i = 0; i <= 16; i++) {
    u = i / 16;
    v = Math.cos(2 * Math.PI * u);
    s += '<stop offset="' + u.toFixed(4) + '" stop-color="' + (v > 0 ? '#DED4C4' : '#000000') + '" stop-opacity="' + (v > 0 ? v * clair : -v * sombre).toFixed(3) + '"/>';
  }
  return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + longueur + '" y2="0" spreadMethod="repeat" gradientTransform="rotate(' + inclinaison + ')">' + s +
    (calme ? '' : '<animateTransform attributeName="gradientTransform" type="translate" additive="sum" from="0 0" to="' + longueur + ' 0" dur="' + duree.toFixed(2) + 's" repeatCount="indefinite"/>') +
    '</linearGradient>';
}

/* cordage : une corde = une ombre, un brin sombre et un brin clair en pointillés (effet torsadé) */
function cordeStyle(d, ep, fixe) {
  var ve = fixe ? '' : ' vector-effect="non-scaling-stroke"';
  return '<path d="' + d + '" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="' + (ep + 1.4) + '" stroke-linecap="round" transform="translate(0 2)"' + ve + '/>' +
    '<path d="' + d + '" fill="none" stroke="#5E4A2A" stroke-width="' + ep + '" stroke-linecap="round"' + ve + '/>' +
    '<path d="' + d + '" fill="none" stroke="#BFA26C" stroke-width="' + (ep * 0.62).toFixed(2) + '" stroke-dasharray="' + (ep * 0.8).toFixed(2) + ' ' + (ep * 0.9).toFixed(2) + '"' + ve + '/>';
}

/* corde qui pend (courbe) : de (x0,y0) à (x1,y1), avec un creux de 'creux' pixels. Forme fixe : seul le balancement bouge */
function swagDef(id, x0, y0, x1, y1, creux) {
  var d = 'M' + x0 + ' ' + y0 + ' Q' + ((x0 + x1) / 2) + ' ' + ((y0 + y1) / 2 + 2 * creux) + ' ' + x1 + ' ' + y1;
  return '<path id="' + id + '" d="' + d + '" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
}
/* la corde se balance en pivotant lentement autour de son point d'attache (amplitude en degrés, durée en secondes) */
function swagUse(id, ep, cx, cy, amplitude, duree, debut) {
  var l = 'href="#' + id + '" xlink:href="#' + id + '"';
  var anim = calme ? '' : '<animateTransform attributeName="transform" type="rotate" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1" dur="' + duree + 's" begin="' + debut + 's" repeatCount="indefinite" values="' +
    (-amplitude) + ' ' + cx + ' ' + cy + ';' + amplitude + ' ' + cx + ' ' + cy + ';' + (-amplitude) + ' ' + cx + ' ' + cy + '"/>';
  return '<g>' + anim +
    '<use ' + l + ' stroke="#000" stroke-opacity=".45" stroke-width="' + (ep + 1.4) + '" transform="translate(0 2)"/>' +
    '<use ' + l + ' stroke="#5E4A2A" stroke-width="' + ep + '"/>' +
    '<use ' + l + ' stroke="#BFA26C" stroke-width="' + (ep * 0.62).toFixed(2) + '" stroke-dasharray="' + (ep * 0.8).toFixed(2) + ' ' + (ep * 0.9).toFixed(2) + '"/>' +
    '</g>';
}

/* le tissu, les cordages qui pendent derrière et devant */
function svgDrapeau() {
  var lien = 'href="#pr-tissu" xlink:href="#pr-tissu"';
  return '<svg class="pr-drapeau" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
    '<defs>' +
    '<path id="pr-tissu" d="' + formeTissu(0) + '">' + (calme ? '' : '<animate attributeName="d" dur="' + PERIODE + 's" repeatCount="indefinite" values="' + valeursTissu() + '"/>') + '</path>' +
    swagDef('pr-c-fond', 0, 46, 330, 50, 30) +
    swagDef('pr-c-av1', 196, -16, 286, -16, 48) +
    swagDef('pr-c-av2', 286, -16, 342, -16, 36) +
    degrade('pr-pli-a', LONG, 7, 0.13, 0.55, PERIODE) +
    degrade('pr-pli-b', LONG * 0.4, 7, 0.045, 0.20, PERIODE * 0.4) +
    '<linearGradient id="pr-plat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#10151B" stop-opacity=".62"/><stop offset=".5" stop-color="#10151B" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="pr-vertical" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".30"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>' +
    '<radialGradient id="pr-torche" gradientUnits="userSpaceOnUse" cx="0" cy="' + H + '" r="230"><stop offset="0" stop-color="#FF9640" stop-opacity=".20"/><stop offset="1" stop-color="#FF9640" stop-opacity="0"/></radialGradient>' +
    '<pattern id="pr-trame" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 .5H3M.5 0V3" stroke="#fff" stroke-opacity=".03" stroke-width=".7" fill="none"/></pattern>' +
    '</defs>' +
    swagUse('pr-c-fond', 3, 165, 46, 1.6, 8, 0) +
    '<use ' + lien + ' transform="translate(0 9)" fill="#000" fill-opacity=".16"/>' +
    '<use ' + lien + ' transform="translate(0 5)" fill="#000" fill-opacity=".30"/>' +
    '<use ' + lien + ' fill="#10151B"/>' +
    '<use ' + lien + ' fill="url(#pr-trame)"/>' +
    '<use ' + lien + ' fill="url(#pr-pli-a)"/>' +
    '<use ' + lien + ' fill="url(#pr-pli-b)"/>' +
    '<use ' + lien + ' fill="url(#pr-plat)"/>' +
    '<use ' + lien + ' fill="url(#pr-torche)"/>' +
    '<use ' + lien + ' fill="url(#pr-vertical)"/>' +
    swagUse('pr-c-av1', 2.8, 241, -16, 2.6, 6.4, 0.7) +
    swagUse('pr-c-av2', 2.6, 314, -16, 3.2, 5.2, 1.4) +
    '</svg>';
}

/* le mât (coupé par le bord gauche de l'écran), les liens du drapeau et les cordes tendues qui sortent du champ.
   Coordonnées en pixels : x = position dans l'en-tête + 20, y = position dans l'en-tête + 70 */
function svgMat() {
  var i, s = '<svg class="pr-mat" viewBox="0 0 70 180" xmlns="http://www.w3.org/2000/svg">';
  /* liens du drapeau sur le mât : cordes tendues obliques + tours de corde autour du mât */
  s += cordeStyle('M33.5 92 L11 80', 3, true) + cordeStyle('M33.5 116 L11 130', 3, true);
  for (i = 0; i < 3; i++) {
    s += cordeStyle('M3 ' + (77 + i * 3.2) + ' L19 ' + (82 + i * 3.2), 2.6, true);
    s += cordeStyle('M3 ' + (127 + i * 3.2) + ' L19 ' + (132 + i * 3.2), 2.6, true);
  }
  /* cordes tendues qui sortent du champ : l'une vers le haut, l'autre vers la gauche */
  s += cordeStyle('M33.5 73 L66 20', 3.2, true) + cordeStyle('M33.5 133 L-14 162', 3.2, true);
  /* œillets de laiton sur le bord du drapeau */
  var ys = [73, 92, 116, 133];
  for (i = 0; i < ys.length; i++) {
    s += '<circle cx="33.5" cy="' + ys[i] + '" r="3" fill="#1C1206" stroke="#D2A03A" stroke-width="1.3"/><circle cx="33.5" cy="' + ys[i] + '" r="1" fill="#000"/>';
  }
  return s + '</svg>';
}

/* os croisés derrière le logo */
function svgOs() {
  function os(x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, l = Math.sqrt(dx * dx + dy * dy), ux = dx / l, uy = dy / l, px = -uy, py = ux, k, e, t = '';
    function trait(c, w, dec) { return '<path d="M' + (x0 + dec) + ' ' + (y0 + dec) + 'L' + (x1 + dec) + ' ' + (y1 + dec) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }
    t += trait('#000', 5.6, 1.6).replace('<path', '<path opacity=".4"');
    t += trait('#8F8266', 5.8, 0) + trait('#CFC1A0', 4.4, 0) + trait('#F0E7CF', 2, -0.4);
    for (k = 0; k < 2; k++) {
      e = k ? [x1, y1] : [x0, y0];
      [-1, 1].forEach(function (sg) {
        var cx = e[0] + px * sg * 3.1 - ux * (k ? -0.6 : 0.6), cy = e[1] + py * sg * 3.1 - uy * (k ? -0.6 : 0.6);
        t += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3.3" fill="#CFC1A0" stroke="#8F8266" stroke-width=".8"/>' +
             '<circle cx="' + (cx - 0.8).toFixed(1) + '" cy="' + (cy - 0.9).toFixed(1) + '" r="1.2" fill="#F0E7CF"/>';
      });
    }
    return t;
  }
  return '<svg class="pr-os" viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg">' + os(8, 8, 52, 38) + os(52, 8, 8, 38) + '</svg>';
}

/* gouvernail en bois et laiton */
function svgGouvernail() {
  var s = '<svg class="pr-gouvernail" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><radialGradient id="pr-laiton-moyeu" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF0A8"/><stop offset=".5" stop-color="#E0AE45"/><stop offset="1" stop-color="#8A5C14"/></radialGradient></defs>';
  var i, a, c, sn, x1, y1, x2, y2;
  for (i = 0; i < 8; i++) {
    a = i * Math.PI / 4; c = Math.cos(a); sn = Math.sin(a);
    x1 = 24 + c * 6; y1 = 24 + sn * 6; x2 = 24 + c * 20; y2 = 24 + sn * 20;
    s += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="#3E2410" stroke-width="4" stroke-linecap="round"/>' +
         '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="#8C5A2C" stroke-width="2.3" stroke-linecap="round"/>' +
         '<circle cx="' + (24 + c * 21.2).toFixed(1) + '" cy="' + (24 + sn * 21.2).toFixed(1) + '" r="2.7" fill="#7A4B22" stroke="#3E2410" stroke-width=".9"/>' +
         '<circle cx="' + (24 + c * 20.6).toFixed(1) + '" cy="' + (24 + sn * 20.6 - 0.7).toFixed(1) + '" r="1" fill="#C99560"/>';
  }
  s += '<circle cx="24" cy="24" r="13.5" fill="none" stroke="#3E2410" stroke-width="5.4"/>' +
       '<circle cx="24" cy="24" r="13.5" fill="none" stroke="#8C5A2C" stroke-width="3.5"/>' +
       '<path d="M12.6 19A12.6 12.6 0 0 1 22 11.6" fill="none" stroke="#D2A06A" stroke-width="1" stroke-linecap="round"/>' +
       '<circle cx="24" cy="24" r="8.4" fill="none" stroke="#B8862E" stroke-width="1.1"/>' +
       '<circle cx="24" cy="24" r="5.8" fill="url(#pr-laiton-moyeu)" stroke="#4A2F08" stroke-width=".9"/>' +
       '<circle cx="24" cy="24" r="1.7" fill="#4A2F08"/></svg>';
  return s;
}

function versNoeud(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.firstChild;
}

var mat = null;
function placerMat() {
  var carte = document.querySelector('.entete-carte');
  if (!mat || !carte) { return; }
  mat.style.left = (carte.getBoundingClientRect().left - 17) + 'px';
}

function poserEntete() {
  var carte = document.querySelector('.entete-carte');
  if (!carte || carte.querySelector('.pr-drapeau')) { return; }

  carte.insertBefore(versNoeud(svgDrapeau()), carte.firstChild);
  carte.insertBefore(versNoeud(svgMat()), carte.firstChild.nextSibling);

  /* le mât : une bande fixe qui descend de tout en haut jusqu'en bas de l'écran */
  mat = document.createElement('div');
  mat.className = 'pr-mat-fixe';
  document.body.appendChild(mat);
  placerMat();
  window.addEventListener('resize', placerMat, false);
  window.addEventListener('orientationchange', placerMat, false);

  var logo = carte.querySelector('.entete-logo');
  if (logo) { logo.insertBefore(versNoeud(svgOs()), logo.firstChild); }

  var bouton = carte.querySelector('.bouton-reglages');
  if (bouton) { bouton.insertBefore(versNoeud(svgGouvernail()), bouton.firstChild); }
}

poserEntete();
})();

/* ===== THÈME FLIBUSTE : ROUTINE = COFFRET OUVERT (décor + joyaux dessinés par le code) ===== */
(function () {
'use strict';

var carte = document.getElementById('carte-checklist-quotidienne');
if (!carte || carte.querySelector('.pr-cf')) { return; }

/* --- petits outils de dessin --- */
function pol(r, deg) { var a = deg * Math.PI / 180; return [32 + r * Math.cos(a), 32 + r * Math.sin(a)]; }
function pts(p) { return p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }
function echelle(p, f) { return p.map(function (q) { return [32 + (q[0] - 32) * f, 32 + (q[1] - 32) * f]; }); }
var OCT = [[21,8],[43,8],[54,19],[54,45],[43,56],[21,56],[10,45],[10,19]];
var OR = '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEFB0"/><stop offset=".45" stop-color="#E0AE45"/><stop offset="1" stop-color="#7C5214"/></linearGradient>';

/* cerclage doré + 6 griffes */
function anneau() {
  var s = '<circle cx="32" cy="32" r="31.2" fill="none" stroke="#3A2408" stroke-width="1.4"/>' +
    '<circle cx="32" cy="32" r="29" fill="none" stroke="url(#g)" stroke-width="4.6"/>' +
    '<circle cx="32" cy="32" r="26.5" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.2"/>';
  for (var k = 0; k < 6; k++) {
    var a = 30 + 60 * k, p = pol(26.4, a), h = pol(27.6, a);
    s += '<ellipse cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" rx="3.7" ry="2.4" transform="rotate(' + a + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')" fill="url(#g)" stroke="#4A2F08" stroke-width=".7"/>' +
         '<circle cx="' + h[0].toFixed(1) + '" cy="' + h[1].toFixed(1) + '" r=".7" fill="#fff" fill-opacity=".8"/>';
  }
  return s;
}

/* pierre ronde taillée en brillant */
function brillant(c, rot) {
  var R = 25, T = 11.5, k, a, g1, g2, t2, tv = [], b;
  var defs = '<radialGradient id="b" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="' + c[2] + '"/><stop offset=".45" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[0] + '"/></radialGradient>';
  b = '<circle cx="32" cy="32" r="' + R + '" fill="url(#b)"/>';
  for (k = 0; k < 8; k++) { tv.push(pol(T, rot + 22.5 + 45 * k)); }
  for (k = 0; k < 8; k++) {
    a = rot + 22.5 + 45 * k; g1 = pol(R, a - 22.5); g2 = pol(R, a + 22.5); t2 = tv[(k + 1) % 8];
    b += '<polygon points="' + pts([tv[k], g1, g2]) + '" fill="' + (k % 2 ? '#000' : '#fff') + '" fill-opacity="' + (k % 2 ? '.24' : '.2') + '"/>' +
         '<polygon points="' + pts([tv[k], t2, g2]) + '" fill="' + (k % 2 ? '#fff' : '#000') + '" fill-opacity="' + (k % 2 ? '.13' : '.1') + '"/>' +
         '<line x1="' + tv[k][0].toFixed(1) + '" y1="' + tv[k][1].toFixed(1) + '" x2="' + g1[0].toFixed(1) + '" y2="' + g1[1].toFixed(1) + '" stroke="#fff" stroke-opacity=".26" stroke-width=".6"/>' +
         '<line x1="' + tv[k][0].toFixed(1) + '" y1="' + tv[k][1].toFixed(1) + '" x2="' + g2[0].toFixed(1) + '" y2="' + g2[1].toFixed(1) + '" stroke="#fff" stroke-opacity=".26" stroke-width=".6"/>';
  }
  b += '<polygon points="' + pts(tv) + '" fill="#fff" fill-opacity=".24" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/>' +
       '<ellipse cx="23.5" cy="20.5" rx="7.5" ry="3.4" transform="rotate(-38 23.5 20.5)" fill="#fff" fill-opacity=".5"/><circle cx="38" cy="43" r="1.6" fill="#fff" fill-opacity=".55"/>';
  return defs + b;
}

/* émeraude : taille à gradins, octogonale */
function emeraude(c) {
  var defs = '<radialGradient id="b" cx=".36" cy=".3" r=".9"><stop offset="0" stop-color="' + c[2] + '"/><stop offset=".5" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[0] + '"/></radialGradient>';
  var b = '<polygon points="' + pts(OCT) + '" fill="url(#b)"/>';
  var an = [OCT, echelle(OCT, .8), echelle(OCT, .6), echelle(OCT, .4)];
  var teinte = [['#fff', .24], ['#fff', .15], ['#000', .12], ['#000', .26], ['#000', .22], ['#000', .30], ['#fff', .08], ['#fff', .16]];
  var coef = [1, .75, .55], r, j, o, i;
  for (r = 0; r < 3; r++) {
    o = an[r]; i = an[r + 1];
    for (j = 0; j < 8; j++) {
      b += '<polygon points="' + pts([o[j], o[(j + 1) % 8], i[(j + 1) % 8], i[j]]) + '" fill="' + teinte[j][0] + '" fill-opacity="' + (teinte[j][1] * coef[r]).toFixed(2) + '" stroke="#fff" stroke-opacity=".28" stroke-width=".6"/>';
    }
  }
  b += '<polygon points="' + pts(an[3]) + '" fill="#fff" fill-opacity=".2" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/>' +
       '<polygon points="16,14 27,9 24,15 15,21" fill="#fff" fill-opacity=".42"/><circle cx="43" cy="47" r="1.5" fill="#fff" fill-opacity=".5"/>';
  return defs + b;
}

/* alvéole vide : velours creusé, avec une très légère teinte du joyau qui lui est réservé */
function alveole(octogone, col) {
  var s = '<radialGradient id="w" cx=".5" cy=".64" r=".62"><stop offset="0" stop-color="#3B0710"/><stop offset=".7" stop-color="#1E0308"/><stop offset="1" stop-color="#0F0104"/></radialGradient><clipPath id="c"><circle cx="32" cy="32" r="27"/></clipPath>';
  var b = '<circle cx="32" cy="32" r="27" fill="url(#w)"/><g clip-path="url(#c)"><ellipse cx="32" cy="12" rx="26" ry="13" fill="#000" fill-opacity=".42"/></g>';
  b += octogone ? '<polygon points="' + pts(echelle(OCT, .82)) + '" fill="' + col + '" fill-opacity=".1"/>' : '<circle cx="32" cy="32" r="20" fill="' + col + '" fill-opacity=".1"/>';
  return s + b;
}

function uri(corps) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>' + OR + '</defs>' + corps + anneau() + '</svg>';
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

/* velours : fin duvet, irrégularités du poil et traces de brossage (une tuile qui se répète) */
function velours() {
  function bruit(id, freq, graine, matrice) {
    return '<filter id="' + id + '" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="2" seed="' + graine + '" stitchTiles="stitch"/><feColorMatrix values="' + matrice + '"/></filter>';
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><defs>' +
    bruit('a', '.9', 7, '0 0 0 0 1 0 0 0 0 .55 0 0 0 0 .62 2.4 0 0 0 -1.05') +
    bruit('b', '.8', 21, '0 0 0 0 .1 0 0 0 0 0 0 0 0 0 .03 2.4 0 0 0 -1') +
    bruit('c', '.035 .02', 4, '0 0 0 0 .1 0 0 0 0 0 0 0 0 0 .02 1.9 0 0 0 -.8') +
    bruit('d', '.03 .05', 11, '0 0 0 0 1 0 0 0 0 .5 0 0 0 0 .55 1.7 0 0 0 -.78') +
    bruit('e', '.012 .55', 3, '0 0 0 0 1 0 0 0 0 .6 0 0 0 0 .65 1.5 0 0 0 -.74') +
    '</defs><rect width="140" height="140" filter="url(#c)" opacity=".7"/><rect width="140" height="140" filter="url(#d)" opacity=".55"/>' +
    '<rect width="140" height="140" filter="url(#e)" opacity=".42"/><rect width="140" height="140" filter="url(#b)" opacity=".62"/><rect width="140" height="140" filter="url(#a)" opacity=".45"/></svg>';
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

/* capitonnage : losanges de velours bombés, retenus par des boutons dorés (une tuile répétée, calée sur le bord droit de l'écrin) */
function capiton() {
  var s = '', k, i;
  /* bombé des coussins (centre des losanges, y compris ceux coupés par les bords) */
  /* (les cercles qui dépassent de la tuile sont recopiés de l'autre côté pour que le motif se raccorde sans coupure) */
  s += '<circle cx="22" cy="27" r="24" fill="url(#p)"/><circle cx="76" cy="27" r="24" fill="url(#p)"/>' +
       '<circle cx="49" cy="1" r="20" fill="url(#p)"/><circle cx="-5" cy="1" r="20" fill="url(#p)"/>' +
       '<circle cx="49" cy="53" r="20" fill="url(#p)"/><circle cx="-5" cy="53" r="20" fill="url(#p)"/>';
  /* plis : 4 diagonales, un trait sombre + un trait clair collé */
  var plis = ['M22 0L76 54', 'M-32 0L22 54', 'M22 0L-32 54', 'M76 0L22 54'];
  for (k = 0; k < plis.length; k++) {
    s += '<path d="' + plis[k] + '" stroke="#1A0005" stroke-opacity=".42" stroke-width="3.4" stroke-linecap="round" fill="none"/>' +
         '<path d="' + plis[k] + '" transform="translate(2 1)" stroke="#FF9AA6" stroke-opacity=".22" stroke-width="1.6" fill="none"/>';
  }
  /* creux du tissu autour des boutons (au centre et sur les bords du losange) */
  s += '<circle cx="49" cy="27" r="15" fill="url(#d)"/><circle cx="-5" cy="27" r="15" fill="url(#d)"/><circle cx="22" cy="0" r="13" fill="url(#d)"/><circle cx="22" cy="54" r="13" fill="url(#d)"/>';
  /* le bouton doré du capiton */
  s += '<circle cx="49" cy="28.2" r="4.6" fill="#000" fill-opacity=".55"/>' +
       '<circle cx="49" cy="27" r="3.9" fill="url(#o)" stroke="#4A2F08" stroke-width=".8"/>' +
       '<circle cx="47.8" cy="25.8" r="1.1" fill="#fff" fill-opacity=".85"/>';
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54"><defs>' +
    '<radialGradient id="p"><stop offset="0" stop-color="#FF8A9A" stop-opacity=".34"/><stop offset=".6" stop-color="#FF8A9A" stop-opacity=".1"/><stop offset="1" stop-color="#FF8A9A" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="d"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".5" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="o" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF0A8"/><stop offset=".5" stop-color="#E0AE45"/><stop offset="1" stop-color="#8A5C14"/></radialGradient></defs>' + s + '</svg>';
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

/* les trois pierres : couleur sombre, moyenne, claire + couleur de l'empreinte */
var SAPHIR   = ['#0A2A7A', '#2B6BE0', '#9CCBFF'];
var RUBIS    = ['#6E0818', '#D42040', '#FF9AAB'];
var EMERAUDE = ['#04472B', '#12A065', '#8DF5BE'];
var vars = {
  '--pr-velours': velours(),
  '--pr-capiton': capiton(),
  '--pr-gem-eau': uri(brillant(SAPHIR, 0)),
  '--pr-gem-etir': uri(brillant(RUBIS, 11)),
  '--pr-gem-pes': uri(emeraude(EMERAUDE)),
  '--pr-alv-eau': uri(alveole(false, '#6FA8FF')),
  '--pr-alv-etir': uri(alveole(false, '#FF5D78')),
  '--pr-alv-pes': uri(alveole(true, '#3CDC9A'))
};
for (var nom in vars) { if (vars.hasOwnProperty(nom)) { carte.style.setProperty(nom, vars[nom]); } }

/* le décor du coffret : couvercle, écrin, face avant */
var noms = ['dessus', 'tiroir'];
var frag = document.createDocumentFragment();
for (var n = 0; n < noms.length; n++) {
  var d = document.createElement('div');
  d.className = 'pr-cf pr-cf-' + noms[n];
  frag.appendChild(d);
}
carte.insertBefore(frag, carte.firstChild);
})();

/* ===== THÈME FLIBUSTE : CARTE MÉTÉO = THERMOMÈTRE DE CUIVRE, PAPIER À LA PLUME ET LIGNE DE LOCH ===== */
(function () {
'use strict';

var zone = document.getElementById('zone-banniere-meteo');
if (!zone) { return; }

var racine = document.documentElement;
var calme = racine.className.indexOf('pr-calme') !== -1;
var ECRITURE = "'La Belle Aurore', 'Segoe Script', 'Brush Script MT', cursive";

var VMIN = -5, VMAX = 35;            /* échelle gravée : de -5° à 35° de ressenti */
var PX_PAR_DEGRE = 1.2;              /* hauteur d'un degré sur le cuivre, en pixels */
var Y_VMIN = 72, Y_BASE_TUBE = 84;   /* position (en pixels) du -5° et du pied de la colonne */
var PIGMENT = { ideal: '#3E7F5B', moyen: '#C48A1E', mauvais: '#A3261C' };  /* vert-de-gris, ocre, vermillon */

function bornes(v) { return Math.max(VMIN, Math.min(VMAX, v)); }
function yDe(v) { return Y_VMIN - (bornes(v) - VMIN) * PX_PAR_DEGRE; }

/* ---------- le thermomètre : plaque de cuivre martelé à sommet arrondi, échelle gravée, tube de verre ---------- */
function svgThermo(smin, smax) {
  var s = '<svg class="pr-thermo-svg" viewBox="0 0 52 98" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="ptCu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E3955A"/><stop offset=".4" stop-color="#C06A33"/><stop offset=".75" stop-color="#93481D"/><stop offset="1" stop-color="#5E2C0E"/></linearGradient>' +
    '<radialGradient id="ptBulbe" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FF8A9A"/><stop offset=".45" stop-color="#C21F3A"/><stop offset="1" stop-color="#6A0C1E"/></radialGradient>' +
    '<radialGradient id="ptPatine" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#58AA8C" stop-opacity=".5"/><stop offset="1" stop-color="#58AA8C" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ptBord" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#3A1A08" stop-opacity="0"/><stop offset="1" stop-color="#3A1A08" stop-opacity=".5"/></radialGradient>' +
    '<filter id="ptMarteau" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".11" numOctaves="3" seed="4" result="b"/><feDiffuseLighting in="b" lighting-color="#FFD3A8" surfaceScale="1.8" diffuseConstant="1"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting></filter></defs>';
  /* cuivre : dégradé, martelage, patine verte, ombrage des bords, reflet */
  s += '<rect width="52" height="98" fill="url(#ptCu)"/>' +
       '<rect width="52" height="98" filter="url(#ptMarteau)" opacity=".2"/>' +
       '<circle cx="5" cy="95" r="16" fill="url(#ptPatine)"/><circle cx="48" cy="92" r="13" fill="url(#ptPatine)"/><circle cx="50" cy="36" r="9" fill="url(#ptPatine)" opacity=".6"/>' +
       '<rect width="52" height="98" fill="url(#ptBord)"/>' +
       '<path d="M0 0H30L0 52Z" fill="#fff" fill-opacity=".08"/>';
  /* filet gravé suivant le contour arrondi */
  s += '<path d="M4 98V26.5A22 22 0 0 1 48 26.5V98" fill="none" stroke="#4A2410" stroke-opacity=".75" stroke-width=".9"/>' +
       '<path d="M5.2 98V26.5A20.8 20.8 0 0 1 46.8 26.5V98" fill="none" stroke="#F4C99A" stroke-opacity=".5" stroke-width=".6"/>';
  /* bandes peintes à côté du tube : rouge (rude), ocre (passable), vert-de-gris (tempéré) */
  var zones = [[VMIN, smin, PIGMENT.mauvais], [smin, 12, '#E0AE45'], [12, 20, PIGMENT.ideal], [20, smax, '#E0AE45'], [smax, VMAX, PIGMENT.mauvais]], i, z;
  for (i = 0; i < zones.length; i++) {
    z = zones[i];
    if (z[1] > z[0]) { s += '<rect x="36.5" y="' + yDe(z[1]).toFixed(1) + '" width="4.2" height="' + ((z[1] - z[0]) * PX_PAR_DEGRE).toFixed(1) + '" fill="' + z[2] + '"/>'; }
  }
  s += '<rect x="36.5" y="' + yDe(VMAX).toFixed(1) + '" width="4.2" height="' + ((VMAX - VMIN) * PX_PAR_DEGRE).toFixed(1) + '" fill="none" stroke="#3A1A08" stroke-width=".6"/>';
  /* graduations gravées + chiffres romains écrits à la main */
  var v, y, major, rom = { 10: 'X', 20: 'XX', 30: 'XXX' };
  for (v = VMIN; v <= VMAX; v++) {
    y = yDe(v).toFixed(1); major = (v % 5 === 0);
    s += '<line x1="' + (major ? 19.5 : 22) + '" y1="' + y + '" x2="25.2" y2="' + y + '" stroke="#3A1A08" stroke-width="' + (major ? .8 : .4) + '"/>';
    if (rom[v]) { s += '<text x="18.2" y="' + (yDe(v) + 2.3).toFixed(1) + '" text-anchor="end" font-family="' + ECRITURE + '" font-size="7.2" fill="#2A1204">' + rom[v] + '</text>'; }
  }
  /* tube de verre et bulbe */
  s += '<rect x="25.8" y="17" width="6.4" height="66" rx="3.2" fill="#fff" fill-opacity=".34" stroke="#4A2410" stroke-width=".7"/>' +
       '<circle cx="29" cy="88.5" r="7.2" fill="url(#ptBulbe)" stroke="#3A0A12" stroke-width=".8"/>' +
       '<ellipse cx="26.6" cy="86" rx="2.2" ry="1.4" fill="#fff" fill-opacity=".6"/>' +
       '<line x1="27.4" y1="21" x2="27.4" y2="72" stroke="#fff" stroke-opacity=".8" stroke-width=".8" stroke-linecap="round"/>';
  return s + '</svg>';
}

/* ---------- le papier : contour brut, déchirures, bords brûlés, taches, pli ---------- */
function graine(n) {
  var s = n % 2147483646; if (s <= 0) { s += 2147483646; }
  return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
}

function papierSvg(w, h) {
  var r = graine(Math.round(w * 7 + h * 13)), m = 4, k, t, a, j, q, d;
  var coins = [[m, m], [w - m, m], [w - m, h - m], [m, h - m]];
  var normales = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var coinCoupe = Math.floor(r() * 4), morsure = 9;
  /* déchirures : arête, position (0 à 1), profondeur, demi-largeur */
  var dechirures = [], aretesDech = [0, 2, 1, 3, 0], nbDech = 4 + Math.floor(r() * 2);
  for (k = 0; k < nbDech; k++) { dechirures.push({ ar: aretesDech[k], t: .14 + r() * .72, prof: 4 + r() * 6, lar: (k % 2) ? 1.3 : 3 + r() * 3 }); }
  var pts = [];
  for (a = 0; a < 4; a++) {
    var ax = coins[a][0], ay = coins[a][1], bx = coins[(a + 1) % 4][0], by = coins[(a + 1) % 4][1];
    var nx = normales[a][0], ny = normales[a][1];
    var L = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)), ex = (bx - ax) / L, ey = (by - ay) / L;
    var t0 = (a === coinCoupe) ? morsure / L : 0;
    var t1 = (((a + 1) % 4) === coinCoupe) ? 1 - morsure / L : 1;
    var n = Math.max(4, Math.round(L / 6)), items = [], off, dansDech;
    for (j = 0; j <= n; j++) {
      if (j === n && t1 === 1) { continue; }               /* le coin est déjà donné par l'arête suivante */
      t = t0 + (t1 - t0) * j / n;
      dansDech = false;
      for (q = 0; q < dechirures.length; q++) { d = dechirures[q]; if (d.ar === a && Math.abs(t - d.t) < (d.lar + 2) / L) { dansDech = true; } }
      if (dansDech) { continue; }
      off = (r() - .5) * 2.6 + 1.1 * Math.sin(t * 9 + a * 2);
      items.push({ t: t, p: [ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off] });
    }
    for (q = 0; q < dechirures.length; q++) {
      d = dechirures[q];
      if (d.ar !== a) { continue; }
      var cx = ax + ex * L * d.t, cy = ay + ey * L * d.t;
      d.p0 = [cx - ex * d.lar + nx * .6, cy - ey * d.lar + ny * .6];
      d.p1 = [cx + (r() - .5) * 3 - nx * d.prof, cy + (r() - .5) * 3 - ny * d.prof];
      d.p2 = [cx + ex * d.lar + nx * .6, cy + ey * d.lar + ny * .6];
      items.push({ t: d.t - d.lar / L, p: d.p0 }, { t: d.t, p: d.p1 }, { t: d.t + d.lar / L, p: d.p2 });
    }
    items.sort(function (u, v) { return u.t - v.t; });
    for (j = 0; j < items.length; j++) { pts.push(items[j].p); }
  }
  var chemin = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z';
  var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="ppPap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EEDDAA"/><stop offset=".55" stop-color="#DCC48A"/><stop offset="1" stop-color="#C9AC72"/></linearGradient>' +
    '<radialGradient id="ppTache"><stop offset="0" stop-color="#6E4413" stop-opacity=".36"/><stop offset=".6" stop-color="#6E4413" stop-opacity=".14"/><stop offset="1" stop-color="#6E4413" stop-opacity="0"/></radialGradient>' +
    '<filter id="ppFlou" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3.2"/></filter>' +
    '<filter id="ppGrain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="6"/><feColorMatrix values="0 0 0 0 .45 0 0 0 0 .29 0 0 0 0 .1 1.5 0 0 0 -.62"/></filter>' +
    '<filter id="ppFibre" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".9 .6" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 .3 0 0 0 0 .2 0 0 0 0 .08 1.4 0 0 0 -.62"/></filter>' +
    '<clipPath id="ppCoupe"><path d="' + chemin + '"/></clipPath></defs>';
  s += '<path d="' + chemin + '" fill="url(#ppPap)"/>';
  s += '<g clip-path="url(#ppCoupe)">' +
       '<rect width="' + w + '" height="' + h + '" filter="url(#ppGrain)" opacity=".5"/>' +
       '<rect width="' + w + '" height="' + h + '" filter="url(#ppFibre)" opacity=".3"/>';
  /* taches de vieillissement */
  var nbT = 6, tx, ty, tr;
  for (k = 0; k < nbT; k++) { tx = r() * w; ty = r() * h; tr = 7 + r() * 13; s += '<circle cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="' + tr.toFixed(1) + '" fill="url(#ppTache)"/>'; }
  tx = w * (.55 + r() * .3); ty = h * (.3 + r() * .4);
  s += '<circle cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="8.5" fill="#6E4413" fill-opacity=".05" stroke="#6E4413" stroke-opacity=".34" stroke-width="1.5"/>';
  for (k = 0; k < 9; k++) { s += '<circle cx="' + (r() * w).toFixed(1) + '" cy="' + (r() * h).toFixed(1) + '" r="' + (.5 + r() * 1.1).toFixed(1) + '" fill="#3A2410" fill-opacity="' + (.3 + r() * .3).toFixed(2) + '"/>'; }
  /* pli vertical */
  var xp = (w * (.38 + r() * .24)).toFixed(1);
  s += '<line x1="' + xp + '" y1="0" x2="' + (xp - 0 + 2) + '" y2="' + h + '" stroke="#4A2A0E" stroke-opacity=".22" stroke-width="1.2"/><line x1="' + (xp - 0 + 1.4) + '" y1="0" x2="' + (xp - 0 + 3.4) + '" y2="' + h + '" stroke="#FFF3CC" stroke-opacity=".3" stroke-width="1"/>';
  /* bords brûlés */
  s += '<path d="' + chemin + '" fill="none" stroke="#3A1E08" stroke-opacity=".62" stroke-width="9" filter="url(#ppFlou)"/></g>';
  /* contour brut + fibres claires aux déchirures */
  s += '<path d="' + chemin + '" fill="none" stroke="#3A1E08" stroke-opacity=".85" stroke-width="1" stroke-linejoin="round"/>';
  for (k = 0; k < dechirures.length; k++) {
    d = dechirures[k];
    if (d.p0) { s += '<polyline points="' + pts_([d.p0, d.p1, d.p2]) + '" fill="none" stroke="#EBDDB0" stroke-opacity=".55" stroke-width=".9" stroke-linejoin="round"/>'; }
  }
  return s + '</svg>';
}
function pts_(l) { return l.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }

/* ---------- la ligne de loch, sur le bois : les deux clous sont fixes, seul le milieu de la corde se balance ---------- */
function svgLoch(jour, heureNow, conseil) {
  var W = 210, n = jour.length, x0 = 12, x1 = W - 12, A = 1.6, DUREE = '5.5s', i, s;
  function xi(k) { return x0 + k * (x1 - x0) / (n - 1); }
  function yi(x, f) { return 11 + 3.2 * Math.sin(Math.PI * x / W) + (f || 0) * A * Math.sin(Math.PI * x / W); }
  function trace(f) { var d = 'M3 ' + yi(3, f).toFixed(2), q, xx; for (q = 1; q <= 40; q++) { xx = 3 + q * (W - 6) / 40; d += 'L' + xx.toFixed(1) + ' ' + yi(xx, f).toFixed(2); } return d; }
  var splines = 'calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1" dur="' + DUREE + '" repeatCount="indefinite"';
  s = '<svg class="pr-loch" viewBox="0 0 ' + W + ' 29" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>' +
    '<radialGradient id="plNoeud" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<path id="plCorde" d="' + trace(0) + '" fill="none" stroke-linecap="round">' +
    (calme ? '' : '<animate attributeName="d" ' + splines + ' values="' + trace(0) + ';' + trace(1) + ';' + trace(0) + ';' + trace(-1) + ';' + trace(0) + '"/>') + '</path></defs>';
  var lien = 'href="#plCorde" xlink:href="#plCorde"';
  s += '<use ' + lien + ' stroke="#000" stroke-opacity=".45" stroke-width="3.4" transform="translate(0 1.6)"/>' +
       '<use ' + lien + ' stroke="#5E4A2A" stroke-width="2.7"/>' +
       '<use ' + lien + ' stroke="#D2B77E" stroke-width="1.6" stroke-dasharray="2.2 2.4"/>';
  var nails = [3, W - 3], k;
  for (k = 0; k < 2; k++) { s += '<circle cx="' + nails[k] + '" cy="' + yi(nails[k]).toFixed(1) + '" r="2.7" fill="#2A3038" stroke="#0E1115" stroke-width=".6"/><circle cx="' + (nails[k] - .7) + '" cy="' + (yi(nails[k]) - .7).toFixed(1) + '" r=".8" fill="#AAB4BE"/>'; }
  for (i = 0; i < n; i++) {
    var t = jour[i], x = xi(i), y = yi(x), amp = A * Math.sin(Math.PI * x / W), perm = (t.charAt(0) === t.charAt(0).toUpperCase()), st = t.charAt(0).toLowerCase(), pluie = t.indexOf('*') !== -1;
    var heure = 8 + i, col = PIGMENT[st === 'i' ? 'ideal' : st === 'm' ? 'moyen' : 'mauvais'];
    s += '<g>' + (calme ? '' : '<animateTransform attributeName="transform" type="translate" ' + splines + ' values="0 0;0 ' + amp.toFixed(2) + ';0 0;0 ' + (-amp).toFixed(2) + ';0 0"/>');
    if (perm) {
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.7" fill="' + col + '" stroke="#1A0E04" stroke-width=".7"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.7" fill="url(#plNoeud)"/>';
    } else {
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5" fill="#CDBA88" stroke="#8A7A58" stroke-width="1"/>';
    }
    if (pluie) { s += '<path d="M' + x.toFixed(1) + ' ' + (y - 10.5).toFixed(1) + 'c-1.5 2.2-2.2 3.4-2.2 4.4a2.2 2.2 0 0 0 4.4 0c0-1-.7-2.2-2.2-4.4z" fill="#6FB0F0"/>'; }
    if (heure === conseil) { s += '<path d="M' + (x - 5.6).toFixed(1) + ' ' + (y - 2.2).toFixed(1) + 'A6.2 5.8 0 1 1 ' + (x - 6).toFixed(1) + ' ' + (y + .8).toFixed(1) + '" fill="none" stroke="#FF6A55" stroke-width="1.3" stroke-linecap="round"/>'; }
    if (heure === heureNow) { s += '<path d="M' + x.toFixed(1) + ' ' + (y + 5.8).toFixed(1) + 'L' + (x - 2.6).toFixed(1) + ' ' + (y + 10).toFixed(1) + 'H' + (x + 2.6).toFixed(1) + 'Z" fill="#E0AE45" stroke="#4A2F08" stroke-width=".5"/>'; }
    s += '</g>';
    if (i % 3 === 0) { s += '<text x="' + x.toFixed(1) + '" y="27.2" text-anchor="middle" font-family="' + ECRITURE + '" font-size="7.2" fill="#EADDB6">' + heure + 'h</text>'; }
  }
  return s + '</svg>';
}

function motEtat(etat, v) {
  if (etat === 'ideal') { return 'Tempéré'; }
  if (etat === 'moyen') { return v < 12 ? 'Frais' : 'Chaud'; }
  return v < 12 ? 'Glacial' : 'Étouffant';
}

/* ---------- le papier est (re)dessiné à la taille réelle ; les attaches se calent sur le mât ---------- */
function dessinerPapier(carte) {
  var papier = carte.querySelector('.pr-papier');
  if (!papier) { return false; }
  var w = papier.offsetWidth, h = papier.offsetHeight;
  if (!w || !h) { return false; }
  var fond = papier.querySelector('.pr-papier-fond');
  if (fond && fond.getAttribute('data-taille') !== w + 'x' + h) {
    fond.innerHTML = papierSvg(w, h);
    fond.setAttribute('data-taille', w + 'x' + h);
  }
  return true;
}

function placerAttaches(carte) {
  var mat = document.querySelector('.pr-mat-fixe');
  var ecart = 19;
  if (mat) { ecart = Math.round(carte.getBoundingClientRect().left - mat.getBoundingClientRect().left); }
  var att = carte.querySelectorAll('.pr-attache'), i;
  for (i = 0; i < att.length; i++) { att[i].style.left = (-ecart - 1) + 'px'; att[i].style.width = (ecart + 7) + 'px'; }
}

function redessiner() {
  var carte = zone.querySelector('.meteo-carte');
  if (!carte) { return; }
  dessinerPapier(carte);
  placerAttaches(carte);
}

function equiper() {
  var carte = zone.querySelector('.meteo-carte');
  if (!carte || carte.querySelector('.pr-thermo')) { return; }
  var m = /meteo-(ideal|moyen|mauvais)/.exec(carte.className), etat = m ? m[1] : 'moyen';
  var temp = carte.querySelector('.meteo-temp'), sous = carte.querySelector('.meteo-sous');
  var v = parseFloat(carte.getAttribute('data-ressenti'));
  if (isNaN(v) && temp) { v = parseFloat(temp.textContent); }
  if (isNaN(v)) { return; }
  var smin = parseFloat(carte.getAttribute('data-smin')); if (isNaN(smin)) { smin = 5; }
  var smax = parseFloat(carte.getAttribute('data-smax')); if (isNaN(smax)) { smax = 28; }
  smin = Math.min(smin, 12); smax = Math.max(smax, 20);
  var pluie = carte.getAttribute('data-pluie') === '1';
  var mh = /(\d{1,2})h/.exec(sous ? sous.textContent : ''), conseil = mh ? parseInt(mh[1], 10) : null;
  var brut = carte.getAttribute('data-jour') || '', jour = brut ? brut.split(',').filter(function (t) { return t !== ''; }) : [];

  /* thermomètre de cuivre */
  var th = document.createElement('div');
  th.className = 'pr-thermo';
  th.innerHTML = svgThermo(smin, smax) + '<div class="pr-thermo-liq"><i></i></div>';
  carte.insertBefore(th, carte.firstChild);

  /* papier (texte seulement) + ligne de loch sur le bois */
  var textes = carte.querySelector('.meteo-textes');
  if (textes) {
    var ligne = (conseil !== null) ? 'Appareiller à ' + conseil + 'h' + (pluie ? ', sous la pluie' : '') : 'Plus de départ aujourd\'hui : on mouille l\'ancre.';
    var p = document.createElement('div');
    p.className = 'pr-parch';
    p.innerHTML = '<div class="pr-papier"><div class="pr-papier-fond"></div><div class="pr-parch-titre">' + Math.round(v) + '° · ' + motEtat(etat, v) + '</div><div class="pr-parch-ligne">' + ligne + '</div></div>' +
      (jour.length ? svgLoch(jour, new Date().getHours(), conseil) : '');
    textes.appendChild(p);
  }

  /* deux cerclages de fer qui attachent la planche au mât */
  var a1 = document.createElement('i'), a2 = document.createElement('i');
  a1.className = 'pr-attache pr-attache-haut'; a2.className = 'pr-attache pr-attache-bas';
  carte.appendChild(a1); carte.appendChild(a2);

  if (!dessinerPapier(carte)) {            /* la carte n'est pas encore visible : on réessaie un peu plus tard */
    var essais = 0, minuteur = window.setInterval(function () { essais++; if (dessinerPapier(carte) || essais > 12) { window.clearInterval(minuteur); } }, 400);
  }
  placerAttaches(carte);

  /* l'esprit-de-vin monte dans le tube (rebond en CSS) */
  var liq = th.querySelector('.pr-thermo-liq');
  liq.style.height = '0px';
  window.setTimeout(function () { liq.style.height = (Y_BASE_TUBE - yDe(v)).toFixed(1) + 'px'; }, 160);
}

new MutationObserver(equiper).observe(zone, { childList: true });
var main = document.querySelector('main');
if (main) { new MutationObserver(redessiner).observe(main, { attributes: true, attributeFilter: ['class'], subtree: true }); }
var minuteurTaille = null;
window.addEventListener('resize', function () { window.clearTimeout(minuteurTaille); minuteurTaille = window.setTimeout(redessiner, 200); }, false);
equiper();
})();

