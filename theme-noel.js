/* ============================================================
   THÈME PAIN D'ÉPICE (Noël) — « La nuit des lutins »
   À charger APRÈS main.js (voir index.html), avec theme-noel.css.
   Il ne modifie aucun autre fichier : il observe le thème et la page affichée.

   Ambiances (selon la page) :
     Accueil / Étirements -> papier cadeau, rubans, branches de sapin
     Séance               -> atelier des lutins (planches, panneau d'outils, fanions, rouages)
     Nutrition            -> pays des sucreries (chocolat, glaçage, barbe à papa, sucres d'orge)
     Bibliothèque         -> bureau du Père Noël (tapisserie, chandelles) + listes des enfants sages
     Historique           -> mur de briques + calendrier de l'Avent

   Réglages rapides juste en dessous.
   ============================================================ */
(function () {
'use strict';

var NOEL_ANIME = true;            /* false = plus aucun mouvement */
var NOEL_DENSITE = 1;             /* 0.5 = deux fois moins de scintillements (appareil lent) */
var NOEL_REFLETS = true;          /* reflets de lumière qui passent sur les cartes */
var REFLET_PAUSE = [4500, 8500];  /* ms de calme entre deux passages */

var SCENE_PAR_PAGE = { accueil: 'papier', etirement: 'papier', seance: 'atelier', nutrition: 'sucrerie', bibliotheque: 'liste', historique: 'brique' };
var INDEX_PAGE = { accueil: 0, etirement: 0, seance: 1, nutrition: 2, bibliotheque: 3, historique: 4 };
var DECALAGE_PAGE_PX = 24;
var VITESSE_SCROLL = 0.5;
var PERIODE_TEXTURE = 240;        /* ne pas changer */

var racine = document.documentElement;
var calme = !NOEL_ANIME || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
if (calme) { racine.className += ' nl-calme'; }

function estNoel() { return racine.getAttribute('data-theme') === 'paindepice'; }

/* ---------- outils ---------- */
var graine = 11;
function hasard() { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; }
function alea(a, b) { return a + hasard() * (b - a); }
function choix(liste) { return liste[Math.floor(hasard() * liste.length)]; }
function uri(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
function fixer(nom, svg) { racine.style.setProperty(nom, uri(svg)); }
function f1(n) { return n.toFixed(1); }
var compteurId = 0;
function nouvelId(p) { compteurId++; return p + compteurId; }

function svgOuvre(w, h) { return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">'; }

function filtreBruit(id, freq, seed, mat, oct) {
  return '<filter id="' + id + '" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="' + (oct || 2) + '" seed="' + seed + '" stitchTiles="stitch"/><feColorMatrix values="' + mat + '"/></filter>';
}

function pointsEtoile(cx, cy, R, r) {
  var p = [], i, a, rr;
  for (i = 0; i < 10; i++) {
    a = -Math.PI / 2 + i * Math.PI / 5;
    rr = (i % 2 === 0) ? R : r;
    p.push(f1(cx + Math.cos(a) * rr) + ',' + f1(cy + Math.sin(a) * rr));
  }
  return p.join(' ');
}

function bez(p0, p1, p2, p3, u) {
  var v = 1 - u;
  return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3;
}

/* ---------- noeud de ruban (c1 clair, c2 moyen, c3 sombre) ---------- */
function noeud(c1, c2, c3) {
  var id = 'nb' + (compteurId++);
  var s = svgOuvre(60, 42);
  s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset=".55" stop-color="' + c2 + '"/><stop offset="1" stop-color="' + c3 + '"/></linearGradient></defs>';
  s += '<path d="M28 25L17 39L24 37L27 41L31 28Z" fill="' + c3 + '"/><path d="M32 25L43 39L36 37L33 41L29 28Z" fill="' + c3 + '"/>';
  s += '<path d="M30 22C20 2 1 4 3 17C4 28 22 29 30 22Z" fill="url(#' + id + ')" stroke="' + c3 + '" stroke-width="1"/>';
  s += '<path d="M30 22C40 2 59 4 57 17C56 28 38 29 30 22Z" fill="url(#' + id + ')" stroke="' + c3 + '" stroke-width="1"/>';
  s += '<path d="M8 14C13 8 21 10 25 19M52 14C47 8 39 10 35 19" fill="none" stroke="' + c1 + '" stroke-opacity=".8" stroke-width="1.4" stroke-linecap="round"/>';
  s += '<ellipse cx="30" cy="23" rx="6" ry="5" fill="url(#' + id + ')" stroke="' + c3 + '" stroke-width="1"/>';
  return s + '</svg>';
}

/* ---------- motifs de papier cadeau ---------- */
function flocon(x, y, r, c, op) {
  var s = '<g stroke="' + c + '" stroke-opacity="' + op + '" stroke-width="1.6" stroke-linecap="round" fill="none">', k, a, dx, dy;
  for (k = 0; k < 3; k++) {
    a = k * 60 * Math.PI / 180; dx = Math.cos(a) * r; dy = Math.sin(a) * r;
    s += '<path d="M' + f1(x - dx) + ' ' + f1(y - dy) + 'L' + f1(x + dx) + ' ' + f1(y + dy) + '"/>';
  }
  return s + '</g><circle cx="' + x + '" cy="' + y + '" r="2" fill="' + c + '" fill-opacity="' + op + '"/>';
}
function houx(x, y) {
  return '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 0C-8 -10 -16 -2 -12 6C-8 2 -4 4 0 0Z" fill="#2FA05A" fill-opacity=".65"/><path d="M0 0C8 -10 16 -2 12 6C8 2 4 4 0 0Z" fill="#2FA05A" fill-opacity=".65"/><circle cx="-2" cy="2" r="2.6" fill="#E23A3A"/><circle cx="2.5" cy="1" r="2.6" fill="#E23A3A"/><circle cx="0" cy="-2.5" r="2.6" fill="#E23A3A"/></g>';
}

function svgPapier() {
  var s = svgOuvre(240, 240), i, j, x, y, t;
  s += '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8E1624"/><stop offset="1" stop-color="#6A0F1B"/></linearGradient>' +
    filtreBruit('n', '.8', 3, '0 0 0 0 1 0 0 0 0 .9 0 0 0 0 .8 .9 0 0 0 -.38', 2) + '</defs>';
  s += '<rect width="240" height="240" fill="url(#g)"/>';
  for (j = 0; j < 4; j++) {
    for (i = 0; i < 4; i++) {
      x = 15 + i * 60 + (j % 2) * 30; y = 15 + j * 60; t = (i + 2 * j) % 4;
      if (t === 0) { s += flocon(x, y, 9, '#FFFFFF', .24); }
      else if (t === 1) { s += '<polygon points="' + pointsEtoile(x, y, 9, 4) + '" fill="#E8C458" fill-opacity=".55"/>'; }
      else if (t === 2) { s += houx(x, y + 3); }
      else { s += '<circle cx="' + (x - 5) + '" cy="' + (y + 2) + '" r="2.2" fill="#fff" fill-opacity=".22"/><circle cx="' + (x + 4) + '" cy="' + (y - 4) + '" r="2.8" fill="#fff" fill-opacity=".22"/><circle cx="' + (x + 5) + '" cy="' + (y + 5) + '" r="1.8" fill="#fff" fill-opacity=".22"/>'; }
      s += '<path d="M' + (x + 26) + ' ' + (y + 30) + 'h6M' + (x + 29) + ' ' + (y + 27) + 'v6" stroke="#fff" stroke-opacity=".16" stroke-width="1.4" stroke-linecap="round"/>';
    }
  }
  for (i = 0; i < 26; i++) { s += '<circle cx="' + f1(alea(0, 240)) + '" cy="' + f1(alea(0, 240)) + '" r="' + f1(alea(.6, 1.4)) + '" fill="#FFE9A0" fill-opacity="' + f1(alea(.35, .8)) + '"/>'; }
  s += '<rect width="240" height="240" filter="url(#n)" opacity=".22"/>';
  return s + '</svg>';
}

function svgMotifA() {   /* petits flocons + points, blanc très léger (cartes, en-tête) */
  var s = svgOuvre(80, 80);
  s += flocon(20, 22, 5, '#FFFFFF', .12) + flocon(62, 58, 4, '#FFFFFF', .1);
  s += '<circle cx="58" cy="16" r="1.6" fill="#fff" fill-opacity=".14"/><circle cx="14" cy="64" r="1.4" fill="#fff" fill-opacity=".12"/><circle cx="40" cy="42" r="1.1" fill="#FFE9A0" fill-opacity=".3"/>';
  s += '<polygon points="' + pointsEtoile(66, 30, 3.4, 1.5) + '" fill="#FFE9A0" fill-opacity=".26"/>';
  return s + '</svg>';
}
function svgMotifB() {   /* rayures en diagonale + étoiles */
  var s = svgOuvre(80, 80), c;
  s += '<g stroke="#fff" stroke-opacity=".055" stroke-width="9">';
  for (c = 0; c <= 160; c += 40) {
    if (c <= 80) { s += '<path d="M' + c + ' 0L0 ' + c + '"/>'; } else { s += '<path d="M80 ' + (c - 80) + 'L' + (c - 80) + ' 80"/>'; }
  }
  s += '</g><polygon points="' + pointsEtoile(20, 60, 4, 1.8) + '" fill="#FFE9A0" fill-opacity=".28"/><polygon points="' + pointsEtoile(62, 22, 3.2, 1.4) + '" fill="#FFE9A0" fill-opacity=".24"/>';
  return s + '</svg>';
}

/* ---------- mur de briques ---------- */
function svgBrique() {
  var s = svgOuvre(120, 60), cou = ['#8C3A2B', '#7B3023', '#9A4630', '#6F281D', '#85362A', '#A04E34'], tab = [], r, k, x, y, idx;
  for (r = 0; r < 3; r++) { tab.push([choix(cou), choix(cou)]); }
  s += '<defs>' + filtreBruit('b', '.55', 4, '0 0 0 0 .08 0 0 0 0 .04 0 0 0 0 .02 1.7 0 0 0 -.6', 2) + '</defs>';
  s += '<rect width="120" height="60" fill="#2C201A"/>';
  for (r = 0; r < 3; r++) {
    for (k = -1; k < 3; k++) {
      x = (r % 2 ? 30 : 0) + k * 60 + 2; y = r * 20 + 2; idx = ((k % 2) + 2) % 2;
      s += '<rect x="' + x + '" y="' + y + '" width="56" height="16" rx="2" fill="' + tab[r][idx] + '"/>';
      s += '<rect x="' + x + '" y="' + y + '" width="56" height="2.4" fill="#fff" fill-opacity=".1"/><rect x="' + x + '" y="' + (y + 13.6) + '" width="56" height="2.4" fill="#000" fill-opacity=".24"/>';
    }
  }
  return s + '<rect width="120" height="60" filter="url(#b)" opacity=".7"/></svg>';
}

/* ---------- tapisserie damassée (bureau du Père Noël) ---------- */
function svgDamas() {
  var s = svgOuvre(80, 80), pts = [[0, 0], [80, 0], [0, 80], [80, 80], [40, 40]], i, k;
  s += '<rect width="80" height="80" fill="#10301F"/>';
  s += '<path d="M0 40L40 0L80 40L40 80Z" fill="none" stroke="#E8C458" stroke-opacity=".2" stroke-width="1.4"/>';
  s += '<path d="M40 8L72 40L40 72L8 40Z" fill="#E8C458" fill-opacity=".05"/>';
  for (i = 0; i < pts.length; i++) {
    s += '<circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="5" fill="#E8C458" fill-opacity=".22"/>';
    for (k = 0; k < 4; k++) { s += '<circle cx="' + (pts[i][0] + Math.cos(k * Math.PI / 2) * 8) + '" cy="' + (pts[i][1] + Math.sin(k * Math.PI / 2) * 8) + '" r="2.6" fill="#E8C458" fill-opacity=".16"/>'; }
  }
  s += '<path d="M40 22Q46 32 40 40Q34 32 40 22ZM40 58Q46 48 40 40Q34 48 40 58Z" fill="#C8202F" fill-opacity=".3"/>';
  return s + '</svg>';
}

/* ---------- planches de l'atelier ---------- */
function svgPlanches() {
  var s = svgOuvre(240, 240), cou = ['#6E4626', '#5F3C20', '#774D2A', '#583820'], k;
  s += '<defs>' + filtreBruit('g', '.14 .004', 8, '0 0 0 0 .08 0 0 0 0 .04 0 0 0 0 .015 1.8 0 0 0 -.6', 3) +
       filtreBruit('h', '.05 .003', 3, '0 0 0 0 .75 0 0 0 0 .5 0 0 0 0 .28 0 1.2 0 0 -.55', 2) + '</defs>';
  for (k = 0; k < 4; k++) { s += '<rect x="' + (k * 60) + '" y="0" width="60" height="240" fill="' + cou[k] + '"/>'; }
  s += '<rect width="240" height="240" filter="url(#h)" opacity=".35"/><rect width="240" height="240" filter="url(#g)" opacity=".85"/>';
  for (k = 0; k < 4; k++) {
    s += '<rect x="' + (k * 60) + '" width="3" height="240" fill="#1B0F06" fill-opacity=".75"/><rect x="' + (k * 60 + 3) + '" width="1" height="240" fill="#fff" fill-opacity=".07"/>';
    s += '<circle cx="' + (k * 60 + 30) + '" cy="10" r="2.2" fill="#2A1A0E"/><circle cx="' + (k * 60 + 30) + '" cy="230" r="2.2" fill="#2A1A0E"/>';
  }
  s += '<ellipse cx="90" cy="74" rx="7" ry="11" fill="none" stroke="#2A170A" stroke-opacity=".6" stroke-width="2"/><ellipse cx="90" cy="74" rx="3" ry="5.5" fill="#2A170A" fill-opacity=".6"/>';
  s += '<ellipse cx="210" cy="170" rx="6" ry="10" fill="none" stroke="#2A170A" stroke-opacity=".6" stroke-width="2"/><ellipse cx="210" cy="170" rx="2.6" ry="5" fill="#2A170A" fill-opacity=".6"/>';
  return s + '</svg>';
}

/* ---------- chocolat + vermicelles (nutrition) ---------- */
function svgSucre() {
  var s = svgOuvre(240, 240), cou = ['#FF8FB1', '#FFFFFF', '#8FE3C0', '#FFD66B', '#FF5A5F', '#9AD0FF'], i, x, y, a;
  s += '<defs>' + filtreBruit('m', '.02 .03', 6, '0 0 0 0 .3 0 0 0 0 .14 0 0 0 0 .08 1.3 0 0 0 -.35', 3) + '</defs>';
  s += '<rect width="240" height="240" fill="#3A1F15"/><rect width="240" height="240" filter="url(#m)" opacity=".9"/>';
  for (i = 0; i < 42; i++) {
    x = alea(0, 240); y = alea(0, 240); a = alea(0, 180);
    s += '<rect x="' + f1(x - 4) + '" y="' + f1(y - 1.3) + '" width="8" height="2.6" rx="1.3" fill="' + choix(cou) + '" fill-opacity=".92" transform="rotate(' + f1(a) + ' ' + f1(x) + ' ' + f1(y) + ')"/>';
  }
  return s + '</svg>';
}

/* ---------- pain d'épice (cartes de la nutrition) ---------- */
function svgPainEpice() {
  var s = svgOuvre(200, 200), i;
  s += '<defs>' + filtreBruit('a', '.045', 5, '0 0 0 0 .62 0 0 0 0 .36 0 0 0 0 .16 1.5 0 0 0 -.62', 3) + filtreBruit('c', '.9', 2, '0 0 0 0 .2 0 0 0 0 .1 0 0 0 0 .04 1.6 0 0 0 -.7', 1) + '</defs>';
  s += '<rect width="200" height="200" fill="#6A3719"/><rect width="200" height="200" filter="url(#a)" opacity=".8"/><rect width="200" height="200" filter="url(#c)" opacity=".6"/>';
  for (i = 0; i < 40; i++) { s += '<ellipse cx="' + f1(alea(0, 200)) + '" cy="' + f1(alea(0, 200)) + '" rx="' + f1(alea(1, 3)) + '" ry="' + f1(alea(.6, 1.8)) + '" fill="' + (i % 2 ? '#A5713D' : '#3E1D0A') + '" fill-opacity=".5"/>'; }
  return s + '</svg>';
}

/* ---------- tablette de chocolat ---------- */
function svgChocolat() {
  var s = svgOuvre(64, 64);
  s += '<rect width="64" height="64" fill="#2A140B"/><rect x="3" y="3" width="58" height="58" rx="6" fill="#4B2818"/>';
  s += '<path d="M6 58V9Q6 6 9 6H58" fill="none" stroke="#8A5738" stroke-opacity=".6" stroke-width="1.6"/><path d="M58 9V55Q58 58 55 58H9" fill="none" stroke="#1B0C06" stroke-opacity=".7" stroke-width="1.6"/>';
  s += '<rect x="12" y="12" width="40" height="40" rx="4" fill="none" stroke="#3A1E10" stroke-width="1.4"/><circle cx="32" cy="32" r="3" fill="#3A1E10" fill-opacity=".7"/>';
  return s + '</svg>';
}

/* ---------- parchemin ---------- */
function svgParchemin() {
  var s = svgOuvre(240, 240), i;
  s += '<defs>' + filtreBruit('p', '.012 .02', 5, '0 0 0 0 .5 0 0 0 0 .3 0 0 0 0 .12 1.4 0 0 0 -.5', 3) + '</defs>';
  s += '<rect width="240" height="240" filter="url(#p)" opacity=".55"/>';
  for (i = 0; i < 9; i++) { s += '<circle cx="' + f1(alea(0, 240)) + '" cy="' + f1(alea(0, 240)) + '" r="' + f1(alea(.6, 1.6)) + '" fill="#3A2410" fill-opacity="' + f1(alea(.25, .5)) + '"/>'; }
  return s + '</svg>';
}

/* ---------- fourrure du Père Noël (haut = festons vers le bas) ---------- */
function svgFourrure(haut) {
  var s = svgOuvre(40, 16), k, cy = haut ? 9 : 7;
  s += '<rect x="0" y="' + (haut ? 0 : 7) + '" width="40" height="9" fill="#FFFFFF"/>';
  for (k = -1; k < 5; k++) { s += '<circle cx="' + (k * 10 + 5) + '" cy="' + (cy + (haut ? 1.3 : -1.3)) + '" r="6.4" fill="#D4DFEA"/>'; }
  for (k = -1; k < 5; k++) { s += '<circle cx="' + (k * 10 + 5) + '" cy="' + cy + '" r="6" fill="#FFFFFF"/>'; }
  for (k = 0; k < 14; k++) { s += '<path d="M' + f1(alea(0, 40)) + ' ' + f1(alea(2, 14)) + 'l' + f1(alea(-2, 2)) + ' ' + f1(alea(1, 3)) + '" stroke="#C9D6E4" stroke-width=".8" stroke-linecap="round"/>'; }
  return s + '</svg>';
}

/* ---------- chantilly ---------- */
function svgChantilly() {
  var s = svgOuvre(48, 24);
  s += '<g fill="#FFFDF5" stroke="#DDC9A6" stroke-width=".8"><ellipse cx="24" cy="19" rx="23" ry="5.5"/><ellipse cx="24" cy="13.5" rx="17" ry="5"/><ellipse cx="24" cy="8.5" rx="11" ry="4.2"/><path d="M18 6C20 1 28 0 30 3C28 3.5 27 5 28 7C24 8 20 8 18 6Z"/></g>';
  s += '<path d="M4 20Q24 24 44 20M9 14.5Q24 18 39 14.5M15 9.5Q24 12 33 9.5" fill="none" stroke="#E6D5B4" stroke-width="1"/>';
  return s + '</svg>';
}

/* ---------- glaçage qui coule ---------- */
function svgGlacage() {
  var s = svgOuvre(90, 34), d = [[6, 11, 18], [24, 9, 9], [40, 12, 28], [58, 10, 14], [74, 11, 22]], i;
  s += '<rect width="90" height="10" fill="#E9DDF0"/><rect width="90" height="9" fill="#FFFFFF"/>';
  for (i = 0; i < d.length; i++) {
    s += '<rect x="' + d[i][0] + '" y="5" width="' + d[i][1] + '" height="' + (d[i][2] + 4) + '" rx="' + (d[i][1] / 2) + '" fill="#E9DDF0"/>';
    s += '<rect x="' + d[i][0] + '" y="4" width="' + d[i][1] + '" height="' + (d[i][2] + 3) + '" rx="' + (d[i][1] / 2) + '" fill="#FFFFFF"/>';
  }
  return s + '</svg>';
}

/* ---------- guirlande de sapin (en-tête, nav) : base + trois couleurs d'ampoules ---------- */
function ySwag(t) { return 3 + 44 * t * (1 - t); }
var COULS_AMP = ['#FF3B3B', '#FFC93C', '#45E08A'];

function svgSwag() {
  var s = svgOuvre(120, 30), i, t, x, y, a, l, verts = ['#2FA05A', '#1B6B3A', '#3DBB6E', '#14572F'];
  s += '<path d="M0 3Q60 25 120 3" fill="none" stroke="#0B3D20" stroke-width="6" stroke-linecap="round"/><path d="M0 3Q60 25 120 3" fill="none" stroke="#1F7A44" stroke-width="3.6" stroke-linecap="round"/>';
  for (i = 0; i <= 24; i++) {
    t = i / 24; x = 120 * t; y = ySwag(t);
    for (a = 0; a < 3; a++) {
      l = alea(0, 6.283); var ln = alea(5, 8);
      s += '<path d="M' + f1(x) + ' ' + f1(y) + 'l' + f1(Math.cos(l) * ln) + ' ' + f1(Math.sin(l) * ln) + '" stroke="' + choix(verts) + '" stroke-width="1.7" stroke-linecap="round"/>';
    }
  }
  var bt = [.1, .37, .64, .9];
  for (i = 0; i < 4; i++) { s += '<circle cx="' + f1(120 * bt[i]) + '" cy="' + f1(ySwag(bt[i]) + 2) + '" r="1.9" fill="#E23A3A"/><circle cx="' + f1(120 * bt[i] - .6) + '" cy="' + f1(ySwag(bt[i]) + 1.4) + '" r=".6" fill="#fff"/>'; }
  return s + '</svg>';
}

function svgLumSwag(c) {
  var col = COULS_AMP[c], ts = [.08, .25, .42, .58, .75, .92], s = svgOuvre(120, 30), id = 'rg', i, x, y;
  s += '<defs><radialGradient id="' + id + '"><stop offset="0" stop-color="' + col + '" stop-opacity=".9"/><stop offset=".45" stop-color="' + col + '" stop-opacity=".3"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient></defs>';
  for (i = 0; i < 6; i++) {
    if (i % 3 !== c) { continue; }
    x = 120 * ts[i]; y = ySwag(ts[i]);
    s += '<line x1="' + f1(x) + '" y1="' + f1(y) + '" x2="' + f1(x) + '" y2="' + f1(y + 4) + '" stroke="#0B2A18" stroke-width="1.2"/>';
    s += '<circle cx="' + f1(x) + '" cy="' + f1(y + 9) + '" r="10" fill="url(#' + id + ')"/>';
    s += '<ellipse cx="' + f1(x) + '" cy="' + f1(y + 9) + '" rx="3" ry="4.4" fill="' + col + '"/><ellipse cx="' + f1(x - .8) + '" cy="' + f1(y + 7.6) + '" rx=".9" ry="1.5" fill="#fff" fill-opacity=".85"/>';
  }
  return s + '</svg>';
}

/* ---------- guirlande verticale des bords de l'écran ---------- */
function ptsBord() {
  var r = [], u, seg, k;
  for (seg = 0; seg < 2; seg++) {
    var y0 = seg * 60;
    for (k = 0; k <= 12; k++) {
      u = k / 12;
      r.push({ x: bez(9, 2, 16, 9, u), y: y0 + bez(0, 30, 30, 60, u), seg: seg, u: u });
    }
  }
  return r;
}
function svgBordBase() {
  var s = svgOuvre(18, 120), p = ptsBord(), i, a, l, verts = ['#2FA05A', '#1B6B3A', '#3DBB6E', '#14572F'];
  s += '<path d="M9 0C2 30 16 30 9 60C2 90 16 90 9 120" fill="none" stroke="#0B3D20" stroke-width="5" stroke-linecap="round"/><path d="M9 0C2 30 16 30 9 60C2 90 16 90 9 120" fill="none" stroke="#1F7A44" stroke-width="3" stroke-linecap="round"/>';
  for (i = 0; i < p.length; i++) {
    for (a = 0; a < 3; a++) {
      l = alea(0, 6.283);
      s += '<path d="M' + f1(p[i].x) + ' ' + f1(p[i].y) + 'l' + f1(Math.cos(l) * 6) + ' ' + f1(Math.sin(l) * 6) + '" stroke="' + choix(verts) + '" stroke-width="1.6" stroke-linecap="round"/>';
    }
  }
  s += '<circle cx="12" cy="45" r="1.8" fill="#E23A3A"/><circle cx="6" cy="105" r="1.8" fill="#E23A3A"/><circle cx="13" cy="15" r="1.8" fill="#E23A3A"/>';
  return s + '</svg>';
}
function svgBordLum(c) {
  var col = COULS_AMP[c], s = svgOuvre(18, 120), id = 'rb', bulbes = [[14, 22, 0], [3, 40, 1], [14, 82, 2], [3, 100, 0]], i;
  s += '<defs><radialGradient id="' + id + '"><stop offset="0" stop-color="' + col + '" stop-opacity=".9"/><stop offset=".45" stop-color="' + col + '" stop-opacity=".3"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient></defs>';
  for (i = 0; i < bulbes.length; i++) {
    if (bulbes[i][2] !== c) { continue; }
    s += '<circle cx="' + bulbes[i][0] + '" cy="' + bulbes[i][1] + '" r="9" fill="url(#' + id + ')"/><circle cx="' + bulbes[i][0] + '" cy="' + bulbes[i][1] + '" r="3.2" fill="' + col + '"/><circle cx="' + (bulbes[i][0] - .8) + '" cy="' + (bulbes[i][1] - 1) + '" r="1" fill="#fff" fill-opacity=".85"/>';
  }
  return s + '</svg>';
}

/* ---------- bonnet du Père Noël (sur le logo) ---------- */
function svgBonnet() {
  var s = svgOuvre(40, 32), id = 'bn';
  s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6A6A"/><stop offset="1" stop-color="#A5182A"/></linearGradient></defs>';
  s += '<path d="M4 25C6 11 17 3 30 5C37 6 38 12 34 14C28 16 26 21 27 25Z" fill="url(#' + id + ')" stroke="#6E0F1B" stroke-width="1"/>';
  s += '<rect x="1" y="22" width="30" height="8" rx="4" fill="#FFFFFF" stroke="#D4DFEA" stroke-width="1"/><circle cx="35" cy="12" r="4.2" fill="#FFFFFF" stroke="#D4DFEA" stroke-width="1"/>';
  return s + '</svg>';
}

/* ---------- cordon en V pour suspendre le calendrier ---------- */
function svgCordon() {
  var s = svgOuvre(100, 34);
  s += '<path d="M3 34L50 3L97 34" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="3.4" stroke-linejoin="round" transform="translate(0 1.5)"/><path d="M3 34L50 3L97 34" fill="none" stroke="#C8202F" stroke-width="2.6" stroke-linejoin="round"/><path d="M3 34L50 3L97 34" fill="none" stroke="#FFF6E0" stroke-width="2.6" stroke-dasharray="2 3.2" stroke-linejoin="round"/>';
  s += '<circle cx="50" cy="3.5" r="3" fill="#E8C458" stroke="#6E4F0E" stroke-width=".8"/><circle cx="3" cy="33" r="2.4" fill="#E8C458" stroke="#6E4F0E" stroke-width=".8"/><circle cx="97" cy="33" r="2.4" fill="#E8C458" stroke="#6E4F0E" stroke-width=".8"/>';
  return s + '</svg>';
}

/* ---------- couronne autour du minuteur de repos ---------- */
function svgCouronneMinuteur() {
  var s = svgOuvre(232, 232), i, a, r, verts = ['#2FA05A', '#1B6B3A', '#3DBB6E', '#14572F'], x, y, l;
  s += '<circle cx="116" cy="116" r="106" fill="none" stroke="#0B3D20" stroke-width="12"/>';
  for (i = 0; i < 90; i++) {
    a = i / 90 * Math.PI * 2; r = alea(100, 112);
    x = 116 + Math.cos(a) * r; y = 116 + Math.sin(a) * r; l = a + alea(-1, 1);
    s += '<path d="M' + f1(x) + ' ' + f1(y) + 'l' + f1(Math.cos(l) * 9) + ' ' + f1(Math.sin(l) * 9) + '" stroke="' + choix(verts) + '" stroke-width="3" stroke-linecap="round"/>';
  }
  for (i = 0; i < 12; i++) {
    a = (i / 12 + .04) * Math.PI * 2; x = 116 + Math.cos(a) * 106; y = 116 + Math.sin(a) * 106;
    s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="3.4" fill="#E23A3A"/><circle cx="' + f1(x - 1) + '" cy="' + f1(y - 1) + '" r="1" fill="#fff"/>';
  }
  for (i = 0; i < 6; i++) {
    a = (i / 6 + .1) * Math.PI * 2; x = 116 + Math.cos(a) * 108; y = 116 + Math.sin(a) * 108;
    s += '<polygon points="' + pointsEtoile(x, y, 5, 2.2) + '" fill="#E8C458"/>';
  }
  return s + '</svg>';
}

/* ---------- engrenage (pastilles d'exercice, atelier) ---------- */
function svgEngrenage(couleur, contour, dents, taille) {
  var s = svgOuvre(taille, taille), c = taille / 2, ro = taille * 0.46, ri = taille * 0.37, i, a, d = '';
  for (i = 0; i < dents; i++) {
    a = i / dents * Math.PI * 2;
    var w = Math.PI / dents * 0.55;
    d += (i === 0 ? 'M' : 'L') + f1(c + Math.cos(a - w * 1.1) * ri) + ',' + f1(c + Math.sin(a - w * 1.1) * ri) + 'L' + f1(c + Math.cos(a - w * .6) * ro) + ',' + f1(c + Math.sin(a - w * .6) * ro) +
         'L' + f1(c + Math.cos(a + w * .6) * ro) + ',' + f1(c + Math.sin(a + w * .6) * ro) + 'L' + f1(c + Math.cos(a + w * 1.1) * ri) + ',' + f1(c + Math.sin(a + w * 1.1) * ri);
  }
  d += 'Z M' + f1(c + taille * 0.13) + ',' + c + 'A' + f1(taille * 0.13) + ',' + f1(taille * 0.13) + ' 0 1 0 ' + f1(c - taille * 0.13) + ',' + c + 'A' + f1(taille * 0.13) + ',' + f1(taille * 0.13) + ' 0 1 0 ' + f1(c + taille * 0.13) + ',' + c + 'Z';
  s += '<path d="' + d + '" fill="' + couleur + '" fill-rule="evenodd" stroke="' + contour + '" stroke-width="1"/>';
  return s + '</svg>';
}

/* ---------- branche de sapin décorée (coins des scènes) ---------- */
function svgBranche() {
  var s = svgOuvre(260, 200), i, t, p, ang, a, len, s2, verts = ['#2FA05A', '#1B6B3A', '#3DBB6E', '#14572F', '#0F4A27'];
  function P(tt) { var v = 1 - tt; return { x: v * v * -5 + 2 * v * tt * 120 + tt * tt * 235, y: v * v * 6 + 2 * v * tt * 20 + tt * tt * 125 }; }
  s += '<path d="M-5 6Q120 20 235 125" fill="none" stroke="#3A2010" stroke-width="5" stroke-linecap="round"/>';
  for (i = 0; i < 34; i++) {
    t = i / 33; p = P(t); var q = P(Math.min(1, t + .03));
    ang = Math.atan2(q.y - p.y, q.x - p.x);
    for (s2 = -1; s2 <= 1; s2 += 2) {
      a = ang + s2 * alea(.6, 1.2); len = alea(18, 32) * (1 - t * .45);
      s += '<path d="M' + f1(p.x) + ' ' + f1(p.y) + 'l' + f1(Math.cos(a) * len) + ' ' + f1(Math.sin(a) * len) + '" stroke="' + choix(verts) + '" stroke-width="2.6" stroke-linecap="round"/>';
      a = ang + s2 * alea(.2, .5); len = alea(10, 18);
      s += '<path d="M' + f1(p.x) + ' ' + f1(p.y) + 'l' + f1(Math.cos(a) * len) + ' ' + f1(Math.sin(a) * len) + '" stroke="' + choix(verts) + '" stroke-width="2.2" stroke-linecap="round"/>';
    }
  }
  var boules = [[.3, '#D32F3F', '#FF8A8A'], [.55, '#E8C458', '#FFF3B8'], [.8, '#C8202F', '#FF8A8A']];
  for (i = 0; i < boules.length; i++) {
    p = P(boules[i][0]); var bx = p.x + 6, by = p.y + 30, id = 'bo' + i;
    s += '<defs><radialGradient id="' + id + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="' + boules[i][2] + '"/><stop offset=".55" stop-color="' + boules[i][1] + '"/><stop offset="1" stop-color="#4A0A12"/></radialGradient></defs>';
    s += '<line x1="' + f1(p.x) + '" y1="' + f1(p.y) + '" x2="' + f1(bx) + '" y2="' + f1(by - 12) + '" stroke="#E8C458" stroke-width="1"/>';
    s += '<rect x="' + f1(bx - 3.5) + '" y="' + f1(by - 13) + '" width="7" height="4.5" rx="1" fill="#E8C458"/><circle cx="' + f1(bx) + '" cy="' + f1(by) + '" r="9.5" fill="url(#' + id + ')"/><ellipse cx="' + f1(bx - 3) + '" cy="' + f1(by - 3.5) + '" rx="2.6" ry="1.6" fill="#fff" fill-opacity=".7"/>';
  }
  for (i = 0; i < 8; i++) { p = P(alea(.1, .95)); s += '<circle cx="' + f1(p.x + alea(-8, 8)) + '" cy="' + f1(p.y + alea(-6, 12)) + '" r="2.4" fill="#E23A3A"/>'; }
  p = P(.68); s += '<g transform="translate(' + f1(p.x - 4) + ' ' + f1(p.y + 6) + ')"><ellipse cx="0" cy="8" rx="6" ry="9" fill="#6B3E1E" stroke="#3A2010"/><path d="M-5 3l5 -2l5 2M-6 8l6 -2l6 2M-5 13l5 -2l5 2" stroke="#3A2010" fill="none"/></g>';
  return s + '</svg>';
}

/* ---------- traîneau du Père Noël (carte « séance prévue ») ---------- */
function svgTraineau() {
  var id = nouvelId('rn');
  var s = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="nl-traineau-svg" viewBox="0 0 170 56" width="170" height="56">';
  s += '<defs><g id="' + id + '" fill="#F6D77A"><ellipse cx="20" cy="30" rx="11" ry="5.5"/><path d="M28 27L34 18L38 19L33 30Z"/><ellipse cx="38" cy="17" rx="4.5" ry="3.2" transform="rotate(-15 38 17)"/><path d="M36 14L33 6M33 6L30 8M33 6L34 2M39 14L42 6M42 6L45 8M42 6L41 2" stroke="#F6D77A" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M13 34L6 44M17 35L14 46M26 35L33 42M29 33L38 38M9 28L4 25" stroke="#F6D77A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="42" cy="18" r="1.7" fill="#FF3B3B"/></g></defs>';
  s += '<use xlink:href="#' + id + '" href="#' + id + '" transform="translate(0 2)"/><use xlink:href="#' + id + '" href="#' + id + '" transform="translate(46 -1)"/>';
  s += '<path d="M90 24L104 32" stroke="#F6D77A" stroke-opacity=".7" stroke-width=".9" fill="none"/>';
  s += '<path d="M104 36C106 46 138 48 156 38L160 28C150 31 140 31 130 30L110 30Z" fill="#F6D77A"/><path d="M100 47C118 52 148 52 162 42C165 39 163 35 160 36" fill="none" stroke="#F6D77A" stroke-width="2" stroke-linecap="round"/>';
  s += '<circle cx="142" cy="24" r="7.5" fill="#C9A24B" stroke="#F6D77A" stroke-width="1"/><path d="M118 31C118 19 132 19 132 31Z" fill="#FFF6E0"/><circle cx="125" cy="16" r="4" fill="#FFE2C8"/><path d="M121 14L125 5L130 13Z" fill="#E03A3A" stroke="#F6D77A" stroke-width=".8"/><circle cx="125" cy="5" r="1.8" fill="#fff"/><path d="M121 19C122 24 128 24 129 19Z" fill="#fff"/>';
  return s + '</svg>';
}

/* ---------- panneau d'outils (atelier) ---------- */
function svgOutils() {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 170" preserveAspectRatio="xMidYMin slice" width="100%" height="100%"><g stroke="#1A0F08" stroke-width="1.3" stroke-linejoin="round">';
  s += '<rect x="38" y="42" width="8" height="92" rx="3" fill="#8B5A2B"/><rect x="22" y="32" width="40" height="17" rx="3" fill="#7C8794"/><circle cx="42" cy="22" r="3.5" fill="none" stroke="#E8C458"/>';
  s += '<rect x="108" y="56" width="9" height="78" rx="3" fill="#B0B6BC"/><path d="M104 56a12 12 0 1 1 21 0l-6 0a6.5 6.5 0 1 0 -9 0Z" fill="#B0B6BC"/><circle cx="112" cy="26" r="3.5" fill="none" stroke="#E8C458"/>';
  s += '<path d="M168 42L252 42L252 66L168 82Z" fill="#B7C1CC"/><path d="M168 82L174 78L180 84L186 78L192 85L198 78L204 86L210 78L216 86L222 78L228 86L234 77L240 85L246 76L252 82" fill="none"/><rect x="252" y="46" width="28" height="26" rx="8" fill="#9B1C24"/><circle cx="210" cy="22" r="3.5" fill="none" stroke="#E8C458"/>';
  s += '<rect x="318" y="42" width="7" height="68" rx="3" fill="#C8202F"/><rect x="316" y="110" width="11" height="15" fill="#B0B6BC"/><rect x="315" y="125" width="13" height="19" rx="3" fill="#E8C458"/><circle cx="322" cy="26" r="3.5" fill="none" stroke="#E8C458"/>';
  s += '<circle cx="370" cy="70" r="22" fill="#E8C458"/><circle cx="370" cy="70" r="15" fill="#6B3E1E"/><path d="M370 70L383 58" stroke="#FFF6E0" stroke-width="2.4" stroke-linecap="round"/>';
  return s + '</g></svg>';
}

/* ---------- fanions ---------- */
function svgFanions() {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 54" preserveAspectRatio="none" width="100%" height="100%"><path d="M0 4Q200 34 400 4" fill="none" stroke="#E8C458" stroke-width="1.6"/>', cou = ['#C8202F', '#FFF6E0', '#1F9A55', '#E8C458'], i, x, t, y;
  for (i = 0; i < 10; i++) {
    x = 20 + i * 40; t = x / 400; y = 4 + 60 * t * (1 - t);
    s += '<path d="M' + f1(x - 10) + ' ' + f1(y - 1) + 'L' + f1(x + 10) + ' ' + f1(y + 1) + 'L' + f1(x) + ' ' + f1(y + 24) + 'Z" fill="' + cou[i % 4] + '" stroke="#00000033"/>';
  }
  return s + '</svg>';
}

/* ---------- bougeoir ---------- */
function svgBougeoir() {
  var s = svgOuvre(44, 130);
  s += '<rect x="13" y="38" width="18" height="62" rx="2" fill="#FFF3D6"/><path d="M13 38h18v7q-3 5 -6 2q-3 6 -6 0q-3 3 -6 -2Z" fill="#FFFAEA"/><rect x="13" y="38" width="5" height="62" fill="#E8D5A8" fill-opacity=".7"/>';
  s += '<path d="M22 38V32" stroke="#2A1A0E" stroke-width="1.6"/><ellipse cx="22" cy="102" rx="20" ry="6" fill="#B8861E"/><ellipse cx="22" cy="100" rx="16" ry="4" fill="#E8C458"/><path d="M18 106h8l3 14h-14Z" fill="#B8861E"/><ellipse cx="22" cy="124" rx="16" ry="5" fill="#8A6414"/><ellipse cx="22" cy="122" rx="13" ry="3.4" fill="#E8C458"/>';
  return s + '</svg>';
}

/* ---------- chaussette de Noël (mur de briques) ---------- */
function svgChaussette() {
  var s = svgOuvre(46, 70);
  s += '<path d="M10 14L36 14L36 44C36 52 42 54 42 60C42 66 34 67 26 66C14 65 8 60 10 50Z" fill="#C8202F" stroke="#7A0F1B" stroke-width="1.4"/><path d="M10 40L36 40" stroke="#fff" stroke-opacity=".28"/>';
  s += '<rect x="6" y="6" width="34" height="12" rx="6" fill="#FFFFFF" stroke="#D4DFEA"/><path d="M12 6V0" stroke="#E8C458" stroke-width="1.6"/><path d="M30 52C34 52 38 56 36 62" fill="none" stroke="#E8C458" stroke-width="3" stroke-linecap="round"/>';
  s += '<polygon points="' + pointsEtoile(23, 30, 6, 2.6) + '" fill="#E8C458"/>';
  return s + '</svg>';
}

/* ---------- sucre d'orge, sucette ---------- */
function svgCanne() {
  var s = svgOuvre(60, 200);
  s += '<path d="M44 196V52C44 22 16 22 16 50" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="14" stroke-linecap="round" transform="translate(2 3)"/>';
  s += '<path d="M44 196V52C44 22 16 22 16 50" fill="none" stroke="#FFF6E0" stroke-width="13" stroke-linecap="butt"/><path d="M44 196V52C44 22 16 22 16 50" fill="none" stroke="#C8202F" stroke-width="13" stroke-dasharray="9 13"/>';
  s += '<path d="M40 190V54C40 28 20 28 20 48" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>';
  return s + '</svg>';
}
function svgSucette() {
  var s = svgOuvre(60, 120), i, d = '';
  s += '<rect x="28" y="52" width="4" height="66" rx="2" fill="#F3EAD6" stroke="#B8A57A"/><circle cx="30" cy="30" r="25" fill="#FFF6E0" stroke="#D8C9A6"/>';
  for (i = 0; i < 40; i++) { var a = i * .32, r = 1 + i * .55; d += (i === 0 ? 'M' : 'L') + f1(30 + Math.cos(a) * r) + ',' + f1(30 + Math.sin(a) * r); }
  s += '<path d="' + d + '" fill="none" stroke="#E23A5A" stroke-width="3.4" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#3DBB8A" stroke-width="1.2" stroke-linecap="round" transform="rotate(180 30 30)"/>';
  s += '<ellipse cx="20" cy="18" rx="6" ry="3.4" fill="#fff" fill-opacity=".6" transform="rotate(-35 20 18)"/>';
  return s + '</svg>';
}

/* ============================================================
   TEXTURES : fabriquées une seule fois, rangées dans des variables CSS
   ============================================================ */
var texturesPretes = false;
function preparerTextures() {
  if (texturesPretes) { return; }
  texturesPretes = true;
  graine = 5;
  fixer('--nl-papier', svgPapier());
  fixer('--nl-motif-a', svgMotifA());
  fixer('--nl-motif-b', svgMotifB());
  fixer('--nl-brique', svgBrique());
  fixer('--nl-damas', svgDamas());
  fixer('--nl-planches', svgPlanches());
  fixer('--nl-sucre', svgSucre());
  fixer('--nl-painepice', svgPainEpice());
  fixer('--nl-chocolat', svgChocolat());
  fixer('--nl-parchemin', svgParchemin());
  fixer('--nl-fourrure-h', svgFourrure(true));
  fixer('--nl-fourrure-b', svgFourrure(false));
  fixer('--nl-chantilly', svgChantilly());
  fixer('--nl-glacage', svgGlacage());
  fixer('--nl-swag', svgSwag());
  fixer('--nl-lum-r', svgLumSwag(0));
  fixer('--nl-lum-o', svgLumSwag(1));
  fixer('--nl-lum-v', svgLumSwag(2));
  fixer('--nl-bord-base', svgBordBase());
  fixer('--nl-bord-r', svgBordLum(0));
  fixer('--nl-bord-o', svgBordLum(1));
  fixer('--nl-bord-v', svgBordLum(2));
  fixer('--nl-bonnet', svgBonnet());
  fixer('--nl-cordon', svgCordon());
  fixer('--nl-couronne-minuteur', svgCouronneMinuteur());
  fixer('--nl-branche', svgBranche());
  fixer('--nl-noeud-r', noeud('#FF8A8A', '#D32F3F', '#7A0F1B'));
  fixer('--nl-noeud-o', noeud('#FFF3B8', '#E8C458', '#9A6F12'));
  fixer('--nl-noeud-v', noeud('#7EE0A0', '#1F9A55', '#0B4A27'));
  fixer('--nl-noeud-b', noeud('#FFFFFF', '#F3E9D2', '#B8A57A'));
  fixer('--nl-gear-or', svgEngrenage('#E8C458', '#6E4F0E', 12, 40));
  fixer('--nl-gear-vert', svgEngrenage('#3DBB6E', '#0B4A27', 12, 40));
  fixer('--nl-gear-rouge', svgEngrenage('#D32F3F', '#5A0A14', 12, 40));
  fixer('--nl-canne', svgCanne());
  fixer('--nl-sucette', svgSucette());
  fixer('--nl-chaussette', svgChaussette());
  fixer('--nl-bougeoir', svgBougeoir());
}

/* ============================================================
   SCÈNES (fond plein écran, une par page) + calque avant
   ============================================================ */
var scene = null, avant = null, decors = {}, sceneCourante = null, attente = false;

function decor(nom, contenu) {
  return '<div class="nl-decor nl-' + nom + '"><div class="nl-fond"><div class="nl-texture"></div>' + contenu + '</div><div class="nl-teinte"></div></div>';
}

function htmlAtelier() {
  var h = '<div class="nl-lampe"></div><div class="nl-perfo">' + svgOutils() + '</div><div class="nl-fanions">' + svgFanions() + '</div>';
  h += '<div class="nl-rouage nl-ro1">' + svgEngrenage('#E8C458', '#6E4F0E', 14, 120) + '</div>';
  h += '<div class="nl-rouage nl-ro2">' + svgEngrenage('#D32F3F', '#5A0A14', 10, 84) + '</div>';
  h += '<div class="nl-rouage nl-ro3">' + svgEngrenage('#3DBB6E', '#0B4A27', 12, 100) + '</div>';
  return h;
}
function htmlSucrerie() {
  return '<div class="nl-nuage nl-nu1"></div><div class="nl-nuage nl-nu2"></div><div class="nl-nuage nl-nu3"></div>' +
         '<div class="nl-canne-d nl-cn1"></div><div class="nl-canne-d nl-cn2"></div><div class="nl-sucette-d nl-su1"></div><div class="nl-sucette-d nl-su2"></div><div class="nl-glacage-haut"></div>';
}
function htmlListe() {
  var h = '<div class="nl-rideau nl-rideau-g"></div><div class="nl-rideau nl-rideau-d"></div>';
  h += '<div class="nl-chandelle nl-ch1"><i class="nl-lueur-l"></i><i class="nl-flamme-l"></i></div><div class="nl-chandelle nl-ch2"><i class="nl-lueur-l"></i><i class="nl-flamme-l"></i></div>';
  return h;
}
function htmlBrique() {
  return '<div class="nl-feu"></div><div class="nl-chaussette nl-cs1"></div><div class="nl-chaussette nl-cs2"></div><div class="nl-chaussette nl-cs3"></div>' +
         '<div class="nl-branche nl-br-g"></div><div class="nl-branche nl-br-d"></div>';
}

function construireScene() {
  if (scene) { return; }
  scene = document.createElement('div');
  scene.className = 'nl-scene';
  scene.innerHTML =
    decor('papier', '<div class="nl-ruban nl-ruban-v"></div><div class="nl-ruban nl-ruban-h"></div><div class="nl-noeud-geant"></div><div class="nl-branche nl-br-g"></div><div class="nl-branche nl-br-d"></div>') +
    decor('atelier', htmlAtelier()) +
    decor('sucrerie', htmlSucrerie()) +
    decor('liste', htmlListe()) +
    decor('brique', htmlBrique());
  document.body.insertBefore(scene, document.body.firstChild);
  var noms = ['papier', 'atelier', 'sucrerie', 'liste', 'brique'], i;
  for (i = 0; i < noms.length; i++) { decors[noms[i]] = scene.querySelector('.nl-' + noms[i]); }

  graine = 21;
  avant = document.createElement('div');
  avant.className = 'nl-avant';
  var bord = '<i class="nl-bd-base"></i><i class="nl-bd-l nl-bd-r"></i><i class="nl-bd-l nl-bd-o"></i><i class="nl-bd-l nl-bd-v"></i>';
  var h = '<div class="nl-bord nl-bord-g">' + bord + '</div><div class="nl-bord nl-bord-d">' + bord + '</div>';
  var n, d, nb;
  nb = Math.round(34 * NOEL_DENSITE);
  for (n = 0; n < nb; n++) {
    d = alea(2.4, 6);
    h += '<i class="nl-etincelle ' + choix(['', '', 'nl-e-bl', 'nl-e-rg']) + '" style="left:' + f1(alea(1, 97)) + '%;top:' + f1(alea(2, 95)) + '%;font-size:' + f1(alea(8, 17)) + 'px;--op:' + f1(alea(.6, 1)) + ';animation-duration:' + f1(d) + 's;animation-delay:-' + f1(hasard() * d) + 's;"></i>';
  }
  nb = Math.round(7 * NOEL_DENSITE);
  for (n = 0; n < nb; n++) {
    d = alea(3.5, 7);
    h += '<i class="nl-flare" style="left:' + f1(alea(4, 94)) + '%;top:' + f1(alea(8, 90)) + '%;animation-duration:' + f1(d) + 's;animation-delay:-' + f1(hasard() * d) + 's;"></i>';
  }
  nb = Math.round(14 * NOEL_DENSITE);
  for (n = 0; n < nb; n++) {
    d = alea(10, 20); var t = f1(alea(2, 4.5));
    h += '<i class="nl-poudre" style="left:' + f1(alea(0, 100)) + '%;width:' + t + 'px;height:' + t + 'px;--dx:' + f1(alea(-40, 40)) + 'px;animation-duration:' + f1(d) + 's;animation-delay:-' + f1(hasard() * d) + 's;"></i>';
  }
  avant.innerHTML = h;
  document.body.appendChild(avant);
}

/* ============================================================
   EN-TÊTE : guirlande de sapin lumineuse sous la carte
   ============================================================ */
function poserEntete() {
  var carte = document.querySelector('.entete-carte');
  if (!carte || carte.querySelector('.nl-gl-entete')) { return; }
  var g = document.createElement('div');
  g.className = 'nl-gl-entete';
  g.innerHTML = '<i class="nl-gl-fir"></i><i class="nl-gl-l nl-gl-r"></i><i class="nl-gl-l nl-gl-o"></i><i class="nl-gl-l nl-gl-v"></i>';
  carte.appendChild(g);
}

/* ============================================================
   MÉTÉO : un sapin-thermomètre + étiquette cadeau + guirlande de la journée
   - le sapin s'allume ampoule par ampoule quand le ressenti monte (une tous les 5°)
   - l'étoile brille quand c'est idéal ; le crochet doré marque la zone idéale (12-20°)
   - la guirlande : une ampoule par heure (vert idéal / or correct / rouge à éviter),
     allumée = on peut partir (lever, repas), flocon = pluie, anneau = départ conseillé, étoile = maintenant
   ============================================================ */
var VMIN = -5, VMAX = 35;
function yTemp(v) { var c = Math.max(VMIN, Math.min(VMAX, v)); return 84 - (c - VMIN) / (VMAX - VMIN) * 68; }
function demiLarg(y) { return y <= 30 ? Math.max(2, (y - 6) * 0.5) : (y <= 52 ? 12 + (y - 30) * 0.27 : 18 + (y - 52) * 0.233); }

function svgArbre(v, smin, smax, etat) {
  var id = nouvelId('na'), s = '<svg class="nl-arbre-svg" viewBox="0 0 64 96" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34A862"/><stop offset="1" stop-color="#0F4A27"/></linearGradient></defs>';
  var seuils = [0, 5, 10, 15, 20, 25, 30, 35], couls = ['#FF4B4B', '#FFD34D', '#FFF6E0', '#FF4B4B', '#FFD34D', '#FFF6E0', '#FF4B4B', '#FFD34D'], i, y, x, allumee, d;
  s += '<ellipse cx="32" cy="90" rx="26" ry="5" fill="#fff" fill-opacity=".9"/><rect x="28.5" y="80" width="7" height="11" fill="#6B3E1E"/>';
  s += '<path d="M32 6L44 30L39 30L50 52L44 52L57 82L7 82L20 52L14 52L25 30L20 30Z" fill="url(#' + id + ')" stroke="#0A2F18" stroke-width="1" stroke-linejoin="round"/>';
  s += '<path d="M32 10L41 29M32 10L23 29M20 56L12 80M44 56L52 80" stroke="#fff" stroke-opacity=".12" stroke-width="1.4"/>';
  /* repères : zone idéale (crochet doré) et seuils personnels (traits rouges) */
  s += '<path d="M60 ' + f1(yTemp(20)) + 'L62 ' + f1(yTemp(20)) + 'L62 ' + f1(yTemp(12)) + 'L60 ' + f1(yTemp(12)) + '" fill="none" stroke="#E8C458" stroke-width="1.8" stroke-linecap="round"/>';
  s += '<path d="M58 ' + f1(yTemp(smin)) + 'h5M58 ' + f1(yTemp(smax)) + 'h5" stroke="#FF6A6A" stroke-width="1.6" stroke-linecap="round"/>';
  for (i = 0; i < seuils.length; i++) {
    y = yTemp(seuils[i]); x = 32 + (i % 2 ? 1 : -1) * demiLarg(y) * 0.5; allumee = v >= seuils[i]; d = f1(alea(0, 2.5));
    if (allumee) {
      s += '<g class="nl-ab-on" style="animation-delay:-' + d + 's"><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="6.4" fill="' + couls[i] + '" fill-opacity=".38"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="3.2" fill="' + couls[i] + '"/><circle cx="' + f1(x - .9) + '" cy="' + f1(y - 1) + '" r=".9" fill="#fff"/></g>';
    } else {
      s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="2.8" fill="#1B3524" stroke="#0A2F18" stroke-width=".8"/>';
    }
  }
  s += '<polygon class="nl-etoile nl-etoile-' + etat + '" points="' + pointsEtoile(32, 7, 7.5, 3.3) + '"/>';
  y = yTemp(v);
  s += '<path d="M1 ' + f1(y - 4) + 'L9 ' + f1(y) + 'L1 ' + f1(y + 4) + 'Z" fill="#FFF6E0" stroke="#6E4F0E" stroke-width=".8"/>';
  return s + '</svg>';
}

function svgGuirlandeJour(jour, heureNow, conseil) {
  var W = 210, n = jour.length, s = '<svg class="nl-gj" viewBox="0 0 ' + W + ' 36" xmlns="http://www.w3.org/2000/svg">', i, t, x, yw, tok, perm, st, pluie, col, heure, d;
  function yFil(tt) { return 6 + 28 * tt * (1 - tt); }
  s += '<path d="M3 6Q105 20 207 6" fill="none" stroke="#0B3D20" stroke-width="3.6" stroke-linecap="round"/><path d="M3 6Q105 20 207 6" fill="none" stroke="#2FA05A" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 1.4"/>';
  for (i = 0; i < n; i++) {
    tok = jour[i]; x = 12 + i * (186 / (n - 1)); t = (x - 3) / 204; yw = yFil(t);
    perm = tok.charAt(0) === tok.charAt(0).toUpperCase();
    st = tok.charAt(0).toLowerCase(); pluie = tok.indexOf('*') !== -1;
    col = st === 'i' ? '#45E08A' : (st === 'm' ? '#FFC93C' : '#FF4B4B');
    heure = 8 + i; d = f1(alea(0, 2.4));
    s += '<line x1="' + f1(x) + '" y1="' + f1(yw) + '" x2="' + f1(x) + '" y2="' + f1(yw + 3) + '" stroke="#0B2A18" stroke-width="1.2"/>';
    if (perm) {
      s += '<g class="nl-ab-on" style="animation-delay:-' + d + 's"><circle cx="' + f1(x) + '" cy="' + f1(yw + 8) + '" r="8" fill="' + col + '" fill-opacity=".35"/><ellipse cx="' + f1(x) + '" cy="' + f1(yw + 8) + '" rx="3.3" ry="4.6" fill="' + col + '"/><ellipse cx="' + f1(x - .9) + '" cy="' + f1(yw + 6.6) + '" rx=".9" ry="1.5" fill="#fff"/></g>';
    } else {
      s += '<ellipse cx="' + f1(x) + '" cy="' + f1(yw + 8) + '" rx="3" ry="4.2" fill="' + col + '" fill-opacity=".22" stroke="' + col + '" stroke-opacity=".4" stroke-width=".8"/>';
    }
    if (pluie) { s += '<path d="M' + f1(x) + ' ' + f1(yw + 14.5) + 'l-1.6 2.2a1.8 1.8 0 1 0 3.2 0Z" fill="#9FD8FF"/>'; }
    if (heure === conseil) { s += '<circle cx="' + f1(x) + '" cy="' + f1(yw + 8) + '" r="7" fill="none" stroke="#FFF6E0" stroke-width="1.3" stroke-dasharray="2.4 1.6"/>'; }
    if (heure === heureNow) { s += '<polygon points="' + pointsEtoile(x, yw - 3.4, 3.4, 1.5) + '" fill="#FFE9A0" stroke="#6E4F0E" stroke-width=".4"/>'; }
    if (i % 3 === 0) { s += '<text x="' + f1(x) + '" y="34.5" text-anchor="middle" font-size="7" fill="#F3E3B8">' + heure + 'h</text>'; }
  }
  return s + '</svg>';
}

function motEtat(etat, v) {
  if (etat === 'ideal') { return 'Tempéré'; }
  if (etat === 'moyen') { return v < 12 ? 'Frais' : 'Chaud'; }
  return v < 12 ? 'Glacial' : 'Étouffant';
}

function equiperMeteo() {
  var zone = document.getElementById('zone-banniere-meteo');
  if (!zone) { return; }
  var carte = zone.querySelector('.meteo-carte');
  if (!carte || carte.querySelector('.nl-arbre')) { return; }
  var m = /meteo-(ideal|moyen|mauvais)/.exec(carte.className), etat = m ? m[1] : 'moyen';
  var sous = carte.querySelector('.meteo-sous'), temp = carte.querySelector('.meteo-temp');
  var v = parseFloat(carte.getAttribute('data-ressenti'));
  if (isNaN(v) && temp) { v = parseFloat(temp.textContent); }
  if (isNaN(v)) { return; }
  var smin = parseFloat(carte.getAttribute('data-smin')); if (isNaN(smin)) { smin = 5; }
  var smax = parseFloat(carte.getAttribute('data-smax')); if (isNaN(smax)) { smax = 28; }
  smin = Math.min(smin, 12); smax = Math.max(smax, 20);
  var pluie = carte.getAttribute('data-pluie') === '1';
  var mh = /(\d{1,2})h/.exec(sous ? sous.textContent : ''), conseil = mh ? parseInt(mh[1], 10) : null;
  var brut = carte.getAttribute('data-jour') || '', jour = brut ? brut.split(',').filter(function (x) { return x !== ''; }) : [];
  graine = 77;

  var arbre = document.createElement('div');
  arbre.className = 'nl-arbre';
  arbre.innerHTML = svgArbre(v, smin, smax, etat);
  carte.insertBefore(arbre, carte.firstChild);

  var textes = carte.querySelector('.meteo-textes');
  if (textes) {
    var ligne = conseil !== null ? 'Dehors à ' + conseil + 'h' + (pluie ? ', sous la neige fondue' : '') : 'Plus de sortie aujourd\'hui : au chaud !';
    var p = document.createElement('div');
    p.className = 'nl-etiquette-bloc';
    p.innerHTML = '<div class="nl-etiquette"><div class="nl-etiquette-titre">' + Math.round(v) + '° · ' + motEtat(etat, v) + '</div><div class="nl-etiquette-ligne">' + ligne + '</div></div>' +
      (jour.length ? svgGuirlandeJour(jour, new Date().getHours(), conseil) : '');
    textes.appendChild(p);
  }
}

/* ============================================================
   SÉANCE PRÉVUE : le traîneau traverse la carte, des étoiles scintillent
   ============================================================ */
function equiperSeance() {
  var zone = document.getElementById('zone-carte-seance-jour');
  if (!zone) { return; }
  var carte = zone.querySelector('.accueil-carte.seance-a-faire');
  if (!carte || carte.querySelector('.nl-traineau')) { return; }
  var t = document.createElement('div');
  t.className = 'nl-traineau';
  t.innerHTML = '<div class="nl-traineau-bob">' + svgTraineau() + '</div>';
  carte.appendChild(t);
  var i, d, h = '';
  for (i = 0; i < 9; i++) {
    d = 2.4 + Math.random() * 3;
    h += '<i class="nl-etincelle nl-e-carte" style="left:' + (4 + Math.random() * 92).toFixed(0) + '%;top:' + (8 + Math.random() * 80).toFixed(0) + '%;font-size:' + (8 + Math.random() * 8).toFixed(0) + 'px;--op:.95;animation-duration:' + d.toFixed(1) + 's;animation-delay:-' + (Math.random() * d).toFixed(1) + 's;"></i>';
  }
  var e = document.createElement('div');
  e.className = 'nl-etoiles-carte';
  e.innerHTML = h;
  carte.appendChild(e);
}

/* ============================================================
   HISTORIQUE : l'agenda devient un calendrier de l'Avent.
   Couronne de 4 bougies : une s'allume à chaque dimanche de l'Avent.
   ============================================================ */
function bougiesAllumees() {
  var auj = new Date(), an = auj.getFullYear();
  if (auj.getMonth() === 0 && auj.getDate() <= 6) { return 4; }   /* jusqu'aux Rois */
  var noel = new Date(an, 11, 25), dow = noel.getDay(), recul = dow === 0 ? 7 : dow;
  var a4 = new Date(an, 11, 25 - recul), n = 0, i, d;
  for (i = 0; i < 4; i++) {
    d = new Date(a4.getFullYear(), a4.getMonth(), a4.getDate() - 7 * (3 - i));
    if (auj >= d) { n++; }
  }
  return n;
}

function majBougies() {
  var c = document.querySelector('.nl-couronne');
  if (!c) { return; }
  var n = bougiesAllumees(), bg = c.querySelectorAll('.nl-bougie'), i;
  for (i = 0; i < bg.length; i++) {
    if (i < n) { if (bg[i].className.indexOf('nl-allumee') === -1) { bg[i].className += ' nl-allumee'; } }
    else { bg[i].className = bg[i].className.replace(' nl-allumee', ''); }
  }
  c.setAttribute('title', n === 0 ? 'Pas encore l\'Avent : les bougies s\'allument chaque dimanche avant Noël.' : n + ' bougie' + (n > 1 ? 's' : '') + ' allumée' + (n > 1 ? 's' : ''));
}

function preparerAvent() {
  var grille = document.getElementById('cal-grille');
  if (!grille) { return; }
  var carte = grille.parentNode;
  while (carte && carte !== document.body && !(carte.className && String(carte.className).indexOf('carte') !== -1)) { carte = carte.parentNode; }
  if (!carte || carte === document.body) { return; }
  if (String(carte.className).indexOf('nl-avent') === -1) {
    carte.className += ' nl-avent';
    var cordon = document.createElement('div');
    cordon.className = 'nl-cordon';
    carte.insertBefore(cordon, carte.firstChild);
    var c = document.createElement('div');
    c.className = 'nl-couronne';
    c.innerHTML = '<i class="nl-bougie"><b class="nl-flamme"></b></i><i class="nl-bougie"><b class="nl-flamme"></b></i><i class="nl-bougie"><b class="nl-flamme"></b></i><i class="nl-bougie"><b class="nl-flamme"></b></i><span class="nl-feuillage"></span>';
    carte.insertBefore(c, cordon.nextSibling);
  }
  majBougies();
}

/* ============================================================
   REFLETS : une lumière dorée glisse de temps en temps sur quelques cartes
   ============================================================ */
var CIBLES_REFLETS = '.carte, .carte-checklist, .meteo-carte, .accueil-tuile, .accueil-carte, .sx-exo, .reglages-section, .entete-carte, .hist-ligne, .sx-hero';
var minuteurReflets = null;

function poserReflet(el) {
  var r = document.createElement('i'), h = '<u class="nl-balai"></u>', k;
  r.className = 'nl-reflet';
  for (k = 0; k < 4; k++) { h += '<b class="nl-reflet-etoile" style="left:' + (8 + Math.random() * 84).toFixed(0) + '%;top:' + (10 + Math.random() * 74).toFixed(0) + '%;animation-delay:' + (Math.random() * .9).toFixed(2) + 's;"></b>'; }
  r.innerHTML = h;
  el.appendChild(r);
  window.setTimeout(function () { if (r.parentNode) { r.parentNode.removeChild(r); } }, 2100);
}

function passerReflets() {
  minuteurReflets = null;
  if (!estNoel()) { return; }
  if (!document.hidden) {
    var els = document.querySelectorAll(CIBLES_REFLETS), vus = [], i, r, H = window.innerHeight;
    for (i = 0; i < els.length; i++) {
      r = els[i].getBoundingClientRect();
      if (r.width > 60 && r.height > 28 && r.bottom > 70 && r.top < H - 60 && !els[i].querySelector('.nl-reflet')) { vus.push(els[i]); }
    }
    var nb = Math.min(3, vus.length), pris;
    while (nb > 0 && vus.length > 0) {
      pris = Math.floor(Math.random() * vus.length);
      poserReflet(vus[pris]);
      vus.splice(pris, 1);
      nb--;
    }
  }
  planifierReflets(REFLET_PAUSE[0] + Math.random() * (REFLET_PAUSE[1] - REFLET_PAUSE[0]));
}
function planifierReflets(d) { minuteurReflets = window.setTimeout(passerReflets, d); }
function demarrerReflets() { if (!NOEL_REFLETS || calme || minuteurReflets) { return; } planifierReflets(1800); }
function arreterReflets() { if (minuteurReflets) { window.clearTimeout(minuteurReflets); minuteurReflets = null; } }

/* ============================================================
   ICÔNE D'ACCUEIL : un sapin dans la barre du bas (comme les autres thèmes)
   ============================================================ */
var iconePosee = false;
function poserIcone() {
  if (iconePosee) { return; }
  iconePosee = true;
  if (typeof ICONES_ACCUEIL !== 'undefined') {
    ICONES_ACCUEIL.paindepice = '<path d="M12 2.5L16.5 9h-2.6l3.9 5.6h-3.1L19 20.5H5l4.4-5.9H6.3L10.1 9H7.5Z"/><path d="M12 20.5V22.5"/>';
    if (typeof majIconeAccueil === 'function') { majIconeAccueil('paindepice'); }
  }
}

/* ============================================================
   CHEF D'ORCHESTRE : thème, page, défilement
   ============================================================ */
function pageAffichee() {
  var p = document.querySelector('.page.page-active');
  return p ? p.id.replace('page-', '') : 'accueil';
}

function transformer(el, x, y) {
  var v = 'translate3d(' + x + 'px,' + y + 'px,0)';
  el.style.webkitTransform = v;
  el.style.transform = v;
}

function decalerTextures() {
  if (!scene) { return; }
  var y = -((window.pageYOffset * VITESSE_SCROLL) % PERIODE_TEXTURE), t = scene.querySelectorAll('.nl-texture'), i;
  for (i = 0; i < t.length; i++) { transformer(t[i], 0, y); }
}

function majScene() {
  attente = false;
  if (!estNoel()) { racine.removeAttribute('data-nl-scene'); arreterReflets(); return; }
  preparerTextures();
  construireScene();
  poserEntete();
  equiperMeteo();
  equiperSeance();
  preparerAvent();
  poserIcone();
  demarrerReflets();
  var page = pageAffichee(), nom = SCENE_PAR_PAGE[page] || 'papier', k, i;
  if (nom !== sceneCourante) {
    for (k in decors) {
      if (decors.hasOwnProperty(k)) {
        if (k === nom) { if (decors[k].className.indexOf('nl-actif') === -1) { decors[k].className += ' nl-actif'; } }
        else { decors[k].className = decors[k].className.replace(/\s*nl-actif/g, ''); }
      }
    }
    racine.setAttribute('data-nl-scene', nom);
    sceneCourante = nom;
  }
  var dx = -(INDEX_PAGE[page] || 0) * DECALAGE_PAGE_PX, fonds = scene.querySelectorAll('.nl-fond');
  for (i = 0; i < fonds.length; i++) { transformer(fonds[i], dx, 0); }
  decalerTextures();
}

function planifier() {
  if (attente) { return; }
  attente = true;
  window.requestAnimationFrame(majScene);
}

new MutationObserver(planifier).observe(racine, { attributes: true, attributeFilter: ['data-theme'] });
var principal = document.querySelector('main');
if (principal) { new MutationObserver(planifier).observe(principal, { attributes: true, attributeFilter: ['class'], subtree: true }); }
var zm = document.getElementById('zone-banniere-meteo');
if (zm) { new MutationObserver(function () { if (estNoel()) { equiperMeteo(); } }).observe(zm, { childList: true }); }
var zs = document.getElementById('zone-carte-seance-jour');
if (zs) { new MutationObserver(function () { if (estNoel()) { equiperSeance(); } }).observe(zs, { childList: true }); }
window.addEventListener('scroll', function () {
  if (!scene || !estNoel()) { return; }
  window.requestAnimationFrame(decalerTextures);
}, false);
window.setInterval(function () { if (estNoel()) { majBougies(); } }, 3600000);

majScene();
})();
