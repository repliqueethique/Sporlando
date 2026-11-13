/* ============================================================
   ICÔNE NUTRITION PAR THÈME (tout est végane)
   Une ligne par thème. "defaut" sert pour sombre, clair et auto.
   ============================================================ */
var ICONES_NUTRITION = {
  defaut: '<path d="M12 7c-2-2-6-1.5-6 3 0 4 2.5 9 6 9s6-5 6-9c0-4.5-4-5-6-3z"/><path d="M12 7c0-2 1-3.5 3-4"/>',

  /* 🍉 pastèque */
  estival: '<path d="M3 9h18a9 9 0 0 1-18 0z"/><path d="M5.5 9a6.5 6.5 0 0 0 13 0"/><path d="M9 12v.01M12 14v.01M15 12v.01"/>',

  /* 🌰 châtaigne */
  automnal: '<path id="fond" class="cls-1" d="M12,22C6.477,22,2,20.523,2,15,2,8.127,8.969,7.7,12,2"/>  <path id="fond_copie" data-name="fond copie" class="cls-1" d="M12,22c5.523,0,10-1.477,10-7,0-6.873-6.969-7.3-10-13"/>  <path id="Forme_8" data-name="Forme 8" class="cls-2" d="M3,18c2.63-2.63,15.334-2.666,18,0"/>',

  /* 🎃 jack-o'-lantern */
  effroi: '<path class="cls-1" d="M11.892,7.47C17.966,3.466,22,8.735,22,13.792s-2.554,9.156-10.01,9.156-10.01-4.1-10.01-9.156S5.7,3.491,11.892,7.47Z"/>  <path id="Forme_4" data-name="Forme 4" class="cls-1" d="M5,12c-0.226.81-1.119,5.1,4,8a1.94,1.94,0,0,1,1-1,2.122,2.122,0,0,0,2,1,2.122,2.122,0,0,0,2-1l1,1a7.117,7.117,0,0,0,4-8c-0.615,1.051-1.5,2.678-3,3-0.246.682-1.134,3.784-2,4a3.528,3.528,0,0,0-1-2H11a5.9,5.9,0,0,0-1,2c-1.2-.433-2-4-2-4A5.187,5.187,0,0,1,5,12Z"/>  <path id="Forme_5" data-name="Forme 5" class="cls-2" d="M7.012,9.652l2.279,1.139,0.57,1.139H8.721l-1.139-.57Z"/>  <path id="Forme_5_copie" data-name="Forme 5 copie" class="cls-2" d="M16.988,9.652l-2.279,1.139-0.57,1.139h1.139l1.139-.57Z"/>  <path id="Forme_6" data-name="Forme 6" class="cls-1" d="M12,13.857l-0.381.762h0.762Z"/>  <path id="Forme_7" data-name="Forme 7" class="cls-2" d="M12,7c-0.158-2.133-1.022-2.523,0-4s1.907-2.5,3-2,1.748,2.723-1,3c-1.415.1-3.438-2.4-6-2"/>',

  /* ☕ chocolat chaud végétal */
  hivernal: '<path d="M5 10h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 12h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-1 1 1 2 0 3M12 3c-1 1 1 2 0 3"/>',

  /* 🍪 bonhomme biscuit (pain d'épice végane) */
  paindepice: '<circle cx="12" cy="6" r="2.5"/><path d="M9.5 8.5L4.5 9.5 5 12.5l4-1L8 20h3.2l.8-2.5.8 2.5H16l-1-8.5 4 1 .5-3-5-1"/><path d="M12 12v.01M12 14.5v.01"/>',

  /* 🍓 fraise */
  printanier: '<path d="M12 8c-4-1-7 1-6 5 1 4 4 7 6 7s5-3 6-7c1-4-2-6-6-5z"/><path d="M9.5 6.5L12 8l2.5-1.5M12 8V5"/><path d="M10 12v.01M14 12v.01M12 15v.01"/>',

  /* 🧁 cupcake végane */
  pastel: '<path d="M5.5 12c-.5-3 1.5-5 3-5.2C9 5 10.5 4 12 4s3 1 3.5 2.8c1.5.2 3.5 2.2 3 5.2z"/><path d="M6 12l1.5 8h9L18 12"/><path d="M10 14v4M14 14v4"/>',

  /* 🍜 bol de ramen (nouilles et bouillon végétal) */
  cyberpunk: '<path d="M4 12h16c0 4.4-3.6 8-8 8s-8-3.6-8-8z"/><path d="M14 3.5L10.5 12M17 4.5L13.5 12"/>',

  /* 🫖 théière */
  steampunk: '<path class="cls-1" d="M13,6c2.9,0,6,7.49,6,10s-3.1,3-6,3-6-.49-6-3S10.1,6,13,6Z"/>  <path id="Forme_3" data-name="Forme 3" class="cls-1" d="M9,10h8"/>  <path id="Forme_1" data-name="Forme 1" class="cls-1" d="M15,19c5.062,0,8.225-3.686,6-8-2.165-4.2-.813-7.732,1-7"/>  <path id="Forme_2" data-name="Forme 2" class="cls-2" d="M8,10C5.941,6.057,2.435,8.319,2,12s3.439,3.861,4,5c0.578,1.174-2,2-2,2"/>  <circle class="cls-3" cx="13" cy="4" r="0.781"/>  <path class="cls-1" d="M16.357,21.889c0-1.534-1.727-2.778-3.857-2.778s-3.857,1.244-3.857,2.778h7.714Z"/>',

  /* 🍾 bouteille */
  flibuste: '<path id="Forme_12" data-name="Forme 12" class="cls-1" d="M12,5c-1.851,0-3,.152-3,1s1,0.586,1,2v2c0,1.061-4.873.567-5,3s2.129,9,4,9h3"/>  <path id="Forme_12_copie" data-name="Forme 12 copie" class="cls-1" d="M12,5c1.851,0,3,.152,3,1s-1,.586-1,2v2c0,1.061,4.873.567,5,3s-2.129,9-4,9H12"/>  <path id="Forme_13" data-name="Forme 13" class="cls-1" d="M9,14l5,4"/>  <path id="Forme_13_copie" data-name="Forme 13 copie" class="cls-1" d="M9,18l5-4"/>  <path id="Forme_14" data-name="Forme 14" class="cls-2" d="M11,5L10,2h4L13,5H11Z"/>',

  /* 🌵 cactus */
  ruedor: '<path d="M10 20V8a2 2 0 0 1 4 0v12"/><path d="M10 14H8a2 2 0 0 1-2-2v-2M14 12h2a2 2 0 0 0 2-2V8"/><path d="M7 20h10"/>',

  /* 🌶️ piment */
  wasteland: '<path id="Forme_9" data-name="Forme 9" class="cls-1" d="M7,9c-0.7,4.177,2.075,3.479,4,4-0.768.21-5.825,1.123-5,2-0.352,1.511,5.836,2.88,5,4-0.595.215-3.5-1.651-4-1a4.079,4.079,0,0,0-1,2c0,0.56-.29,2.958,6,3s7.969-1.926,8-3-4.926-1.047-6-3a24.956,24.956,0,0,0,5,1c0.932,0.1-.19-2.235,0-3-0.889-.26-2.022.157-3-1,2.14-.724,3.928,1.037,4-1,0.1-1.082,1.027-.947,0-3-0.764.358-1.385,1.423-7,1s-6.022-.692-6-2,4.624-2.021,6-2"/>  <path id="Forme_11" data-name="Forme 11" class="cls-1" d="M9,10c1.418-.871,7.65-0.79,10,0"/>  <path id="Forme_10" data-name="Forme 10" class="cls-1" d="M20,9c-0.487.967-4.363-.755-7-2C9.917,5.545,6.978,2.57,9,1c2.493-1.936,4.305,2.424,7,4C18.654,6.552,21,7.016,20,9Z"/>'
};

function majIconeNutrition(theme) {
  var zone = document.querySelector('.nav-onglet[data-page="nutrition"] .nav-icone');
  if (!zone) { return; }
  var contenu = ICONES_NUTRITION[theme] || ICONES_NUTRITION.defaut;
  zone.innerHTML = '<svg viewBox="0 0 24 24">' + contenu + '</svg>';
}

/* ============================================================
   ICÔNE ACCUEIL PAR THÈME (barre de navigation)
   Une ligne par thème. "defaut" sert pour sombre, clair et auto.
   Mets seulement le contenu du SVG (les <path>, <circle>...), pas la balise <svg>.
   Si un thème n'a pas de ligne, il utilise "defaut".
   ============================================================ */
var ICONES_ACCUEIL = {
  defaut: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',

  automnal: '',
  effroi: '<path id="Forme_19" data-name="Forme 19" class="cls-1" d="M5,17l1,5h5V19.2A5.355,5.355,0,0,1,13.333,15a5.766,5.766,0,0,1,2.333,4.2V22H18l1-4,1-1V14h1s-2-2.712-2-5c0,2.32-2,5-2,5h0V13s-2-1.138-2-2H13V9h1s-3-5.889-3-8c0,2.156-3,8-3,8H9v2H8S5,8.624,5,6c0,2.605-3,5-3,5H3v4Z"/>    <path id="Forme_24" data-name="Forme 24" class="cls-1" d="M11,22h6"/>    <path id="Forme_20" data-name="Forme 20" class="cls-1" d="M11,9v2"/>    <path id="Forme_21" data-name="Forme 21" class="cls-1" d="M5,12v1"/>    <path id="Forme_23" data-name="Forme 23" class="cls-1" d="M8,16h2a3.348,3.348,0,0,0-1-3A3.15,3.15,0,0,0,8,16Z"/>    <path id="Forme_26" data-name="Forme 26" class="cls-1" d="M16,5l1,1,1-1"/>    <path id="Forme_26_copie" data-name="Forme 26 copie" class="cls-1" d="M20.693,7.288l0.318,0.318,0.318-.318"/>',
  hivernal: '',
  paindepice: '',
  printanier: '',
  pastel: '',
  estival: '',
  cyberpunk: '<path id="Forme_27" data-name="Forme 27" class="cls-1" d="M2,21V15.7l2-2.679V8h8V21"/>  </g>  <path id="Forme_28" data-name="Forme 28" class="cls-1" d="M9,8V1h4l3,3h6v7l-2,3v4l2,3"/>  <path id="Forme_33" data-name="Forme 33" class="cls-1" d="M12,14h5v7"/>  <path id="Forme_34" data-name="Forme 34" class="cls-1" d="M16.336,7.5h5.328"/>  <path id="Forme_34_copie_2" data-name="Forme 34 copie 2" class="cls-1" d="M6.527,7.643L6.473,3.357"/>  <path id="Forme_34_copie" data-name="Forme 34 copie" class="cls-1" d="M16.336,10.5h5.328"/>  <path id="Forme_30" data-name="Forme 30" class="cls-1" d="M8.4,11.5h3.2"/>  <path id="Forme_30_copie" data-name="Forme 30 copie" class="cls-1" d="M8.4,15.5h3.2"/>  <path id="Forme_30_copie_2" data-name="Forme 30 copie 2" class="cls-1" d="M8.4,19.5h3.2"/>',
  steampunk: '',
  flibuste: '<path id="Forme_15" data-name="Forme 15" class="cls-1" d="M1,12l2,1s1.718,3.117,1,4-2.158,5,2,5H18a5.368,5.368,0,0,0,1-6c-1.485-2.012-.7-1.891,0-2a9.346,9.346,0,0,0,2-1l1-4-7,2-1,4H8L7,13H3"/>    <path id="Forme_16" data-name="Forme 16" class="cls-2" d="M18,22h3V20s0.131-1.979-1-2"/>  <path id="Forme_17" data-name="Forme 17" class="cls-1" d="M8.693,10.718h6.025S11.1,9.175,11.1,5.9s3.615-3.615,3.615-3.615H9.9S6.283,2.715,6.283,5.9A6.1,6.1,0,0,0,8.693,10.718Z"/>    <path id="Forme_18" data-name="Forme 18" class="cls-3" d="M11,11v4"/>    <path class="cls-1" d="M8,17H9v1H8V17Z"/> <path id="Rectangle_1_copie" data-name="Rectangle 1 copie" class="cls-1" d="M11,17h1v1H11V17Z"/> <path id="Rectangle_1_copie_2" data-name="Rectangle 1 copie 2" class="cls-1" d="M14,17h1v1H14V17Z"/>',
  ruedor: '',
  wasteland: ''
};

function majIconeAccueil(theme) {
  var zone = document.querySelector('.nav-onglet[data-page="accueil"] .nav-icone');
  if (!zone) { return; }
  var contenu = ICONES_ACCUEIL[theme] || ICONES_ACCUEIL.defaut;
  zone.innerHTML = '<svg viewBox="0 0 24 24">' + contenu + '</svg>';
}

/* ============================================================
   AMBIANCE PAR THÈME
   c = classes CSS    n = nombre de particules
   t = taille en px [min, max]    d = durée en secondes [min, max]
   dx / dy = dérive horizontale / verticale max (px)    r = rotation max (deg)
   pos = 'h' (traverse l'écran de gauche à droite, y = hauteur en %)
         'libre' (reste en place, position au hasard)
         rien = tombe ou monte depuis le haut / le bas
   ============================================================ */
var AMBIANCE_ACTIVE = true;   /* false = aucune ambiance */

var AMBIANCES = {
  wasteland: [
    { c: 'amb-nuage amb-nuage-pollution', n: 4, t: [220, 380], d: [16, 28], dx: 60 },
    { c: 'amb-braise', n: 8, t: [2, 4], d: [6, 12], dx: 90 }
  ],
  ruedor: [
    { c: 'amb-nuage-bas', n: 6, t: [220, 420], d: [10, 17], pos: 'h', y: [76, 100], dy: -22 },
    { c: 'amb-brume amb-brume-poussiere', n: 3, t: [300, 480], d: [6, 11], pos: 'h', y: [30, 95], dy: 55 },
    { c: 'amb-poussiere', n: 22, t: [2, 4.5], d: [1.2, 3.4], pos: 'h', y: [0, 100], dy: 60 },
    { special: 'virevoltant' }
  ],
  cyberpunk: [
    { c: 'amb-neon amb-neon-cyan', n: 2, t: [260, 420], d: [7, 12], pos: 'libre', dx: 60, dy: 40 },
    { c: 'amb-neon amb-neon-rose', n: 2, t: [260, 420], d: [8, 13], pos: 'libre', dx: -60, dy: 50 },
    { c: 'amb-neon amb-neon-violet', n: 2, t: [260, 420], d: [9, 14], pos: 'libre', dx: 40, dy: -50 }
  ],
  effroi: [
    { c: 'amb-brume amb-brume-effroi', n: 2, t: [300, 500], d: [30, 50], pos: 'h', y: [45, 95], dy: -40 }
  ],
  hivernal: [
    { c: 'amb-flocon amb-flocon-a', n: 14, t: [6, 22], d: [20, 38], dx: 170, r: 360 },
    { c: 'amb-flocon amb-flocon-b', n: 12, t: [6, 22], d: [20, 38], dx: 170, r: 360 },
    { c: 'amb-scintille', n: 22, t: [2, 3.6], d: [6, 13], pos: 'libre' }
  ],
  paindepice: [
    { c: 'amb-etincelle', n: 18, t: [8, 18], d: [2, 5], pos: 'libre' }
  ],
  estival: [
    { c: 'amb-rayon', n: 8, t: [24, 200], d: [8, 16], pos: 'haut', x: [35, 115], ang: [20, 27], op: [.25, .6] }
  ],
  printanier: [
    { c: 'amb-petale amb-petale-rose', n: 12, t: [8, 14], d: [10, 18], dx: 80, r: 540 }
  ],
  automnal: [
    { c: 'amb-feuille amb-feuille-orange', n: 6, t: [12, 20], d: [10, 18], dx: 100, r: 540 },
    { c: 'amb-feuille amb-feuille-rouge', n: 4, t: [12, 20], d: [10, 18], dx: 100, r: 540 },
    { c: 'amb-erable', n: 5, t: [14, 24], d: [11, 20], dx: 110, r: 540 }
  ],
  pastel: [
    { c: 'amb-bulle amb-bulle-pastel', n: 12, t: [10, 34], d: [12, 24], dx: 40 }
  ],
  flibuste: [
    { c: 'amb-bulle amb-bulle-mer', n: 10, t: [8, 26], d: [12, 24], dx: 30 }
  ],
  steampunk: [
    { c: 'amb-nuage amb-nuage-vapeur', n: 3, t: [120, 200], d: [14, 24], dx: 40 }
  ]
};

var themeAmbianceCourant = null;

function alea(min, max) { return min + Math.random() * (max - min); }

/* Western : virevoltant géant, centre sous le bord de l'écran (seul le haut de la boule dépasse) */
function htmlVirevoltant() {
  var W = window.innerWidth;
  var D = Math.round(Math.max(240, Math.min(360, W * 0.8)));
  var rot = ((W + 2 * D) / (D / 2)) * 180 / Math.PI;   /* roule sans glisser : la rotation suit la distance */
  var teintes = ['#D8BC84', '#C9A66B', '#A88455', '#8A6A3A', '#5A3E22'];
  var s = '<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round">';
  var i, a1, a2, r1, r2;

  s += '<circle r="52" fill="rgba(25,12,4,.35)" stroke="none"/>';   /* cœur sombre : donne du volume */
  for (i = 0; i < 9; i++) {   /* grands anneaux de brindilles */
    s += '<ellipse rx="' + alea(58, 95).toFixed(0) + '" ry="' + alea(22, 82).toFixed(0) + '" transform="rotate(' + alea(0, 180).toFixed(0) + ')" stroke="' + teintes[Math.floor(Math.random() * 4)] + '" stroke-width="' + alea(1.2, 2.2).toFixed(1) + '" stroke-opacity="' + alea(0.5, 0.85).toFixed(2) + '"/>';
  }
  for (i = 0; i < 32; i++) {   /* brindilles qui traversent la boule */
    a1 = alea(0, 6.283); a2 = a1 + alea(1.7, 4.5);
    r1 = alea(84, 97); r2 = alea(84, 97);
    s += '<path d="M' + (Math.cos(a1) * r1).toFixed(1) + ',' + (Math.sin(a1) * r1).toFixed(1) + ' Q' + alea(-55, 55).toFixed(0) + ',' + alea(-55, 55).toFixed(0) + ' ' + (Math.cos(a2) * r2).toFixed(1) + ',' + (Math.sin(a2) * r2).toFixed(1) +
      '" stroke="' + teintes[Math.floor(Math.random() * 5)] + '" stroke-width="' + alea(1, 2.6).toFixed(1) + '" stroke-opacity="' + alea(0.55, 0.95).toFixed(2) + '"/>';
  }
  for (i = 0; i < 20; i++) {   /* brindilles qui dépassent */
    a1 = alea(0, 6.283); r1 = alea(78, 92);
    s += '<path d="M' + (Math.cos(a1) * r1).toFixed(1) + ',' + (Math.sin(a1) * r1).toFixed(1) + ' L' + (Math.cos(a1 + alea(-0.15, 0.15)) * (r1 + alea(8, 16))).toFixed(1) + ',' + (Math.sin(a1 + alea(-0.15, 0.15)) * (r1 + alea(8, 16))).toFixed(1) +
      '" stroke="' + teintes[Math.floor(Math.random() * 4)] + '" stroke-width="1.4" stroke-opacity=".8"/>';
  }
  s += '</svg>';

  return '<div class="tw" style="width:' + D + 'px;height:' + D + 'px;top:calc(100% - ' + Math.round(D * 0.42) + 'px);--tw-d:' + D + 'px;">' +
    '<div class="tw-saut"><div class="tw-boule" style="--rot:' + rot.toFixed(0) + 'deg;">' + s + '</div></div></div>';
}

function majAmbiance(theme) {
  var zone = document.getElementById('ambiance-theme');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'ambiance-theme';
    zone.className = 'ambiance-theme';
    document.body.appendChild(zone);
  }
  var cle = AMBIANCE_ACTIVE ? theme : '';
  if (cle === themeAmbianceCourant) { return; }
  themeAmbianceCourant = cle;

  var groupes = AMBIANCES[cle] || [];
  var html = '';
  for (var g = 0; g < groupes.length; g++) {
    var gr = groupes[g];
    if (gr.special === 'virevoltant') { html += htmlVirevoltant(); continue; }
    for (var i = 0; i < gr.n; i++) {
      var taille = alea(gr.t[0], gr.t[1]).toFixed(1);
      var duree = alea(gr.d[0], gr.d[1]);
      var haut = (gr.c.indexOf('amb-nuage-bas') !== -1) ? (taille * 0.57).toFixed(1) : taille;
      var s = 'width:' + taille + 'px;height:' + haut + 'px;font-size:' + taille + 'px;';
      s += 'animation-duration:' + duree.toFixed(1) + 's;animation-delay:-' + (Math.random() * duree).toFixed(1) + 's;';
      if (gr.pos === 'h') {
        s += 'left:0;top:' + alea(gr.y[0], gr.y[1]).toFixed(0) + '%;';
      } else if (gr.pos === 'haut') {
        var gauche = gr.x ? alea(gr.x[0], gr.x[1]) : alea(0, 100);
        s += 'left:' + gauche.toFixed(0) + '%;top:-25%;';
      } else if (gr.pos === 'libre') {
        var haut = gr.y ? alea(gr.y[0], gr.y[1]) : alea(0, 90);
        s += 'left:' + alea(0, 90).toFixed(0) + '%;top:' + haut.toFixed(0) + '%;';
      } else {
        s += 'left:' + alea(0, 100).toFixed(0) + '%;';
      }
      if (gr.dx) { s += '--dx:' + alea(-Math.abs(gr.dx), Math.abs(gr.dx)).toFixed(0) + 'px;'; }
      if (gr.dy) { s += '--dy:' + alea(-Math.abs(gr.dy), Math.abs(gr.dy)).toFixed(0) + 'px;'; }
      if (gr.r) { s += '--rot:' + alea(-gr.r, gr.r).toFixed(0) + 'deg;'; }
      if (gr.ang) { s += '--a:' + alea(gr.ang[0], gr.ang[1]).toFixed(1) + 'deg;'; }
      if (gr.op) { s += '--op:' + alea(gr.op[0], gr.op[1]).toFixed(2) + ';'; }
      html += '<span class="amb ' + gr.c + '" style="' + s + '"></span>';
    }
  }
  zone.innerHTML = html;
}

/* ============================================================
   ÉCLAIR (thème effroi) : flash + foudre synchronisés, à intervalle aléatoire
   ============================================================ */
var ECLAIR_ACTIF = true;
var ECLAIR_DELAI = [8, 25];   /* secondes entre deux éclairs (min, max) */
var minuteurEclair = null;
var coucheFlash = null;
var coucheBolt = null;

function creerCouchesEclair() {
  if (coucheFlash) { return; }
  coucheFlash = document.createElement('div');
  coucheFlash.className = 'eclair-flash';
  coucheBolt = document.createElement('div');
  coucheBolt.className = 'eclair-bolt';
  document.body.appendChild(coucheFlash);
  document.body.appendChild(coucheBolt);
}

/* Dessine une foudre zigzagante avec une branche, différente à chaque fois */
function dessinerFoudre() {
  var pts = [[60, 0]];
  var x = 60, y = 0;
  while (y < 400) {
    y += alea(25, 45);
    x += alea(-24, 24);
    if (x < 15) { x = 15; }
    if (x > 105) { x = 105; }
    pts.push([x, Math.min(y, 400)]);
  }
  var d = 'M' + pts[0][0] + ',' + pts[0][1];
  for (var i = 1; i < pts.length; i++) { d += ' L' + pts[i][0].toFixed(0) + ',' + pts[i][1].toFixed(0); }

  var depart = pts[Math.floor(pts.length * alea(.3, .6))];
  var bx = depart[0], by = depart[1];
  var sens = Math.random() < .5 ? -1 : 1;
  var branche = 'M' + bx.toFixed(0) + ',' + by.toFixed(0);
  for (var b = 0; b < 3; b++) {
    bx += sens * alea(8, 18);
    by += alea(20, 38);
    branche += ' L' + bx.toFixed(0) + ',' + by.toFixed(0);
  }

  var svg = '<svg viewBox="0 0 120 400" preserveAspectRatio="none">';
  svg += '<path d="' + d + ' ' + branche + '" fill="none" stroke="rgba(150,110,255,.55)" stroke-width="9" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  svg += '<path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  svg += '<path d="' + branche + '" fill="none" stroke="#E8DEFF" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  svg += '</svg>';
  return svg;
}

function declencherEclair() {
  minuteurEclair = null;
  if ((etat.profil.theme || 'sombre') !== 'effroi' || !ECLAIR_ACTIF) { return; }
  if (!document.hidden) {
    creerCouchesEclair();
    var posX = alea(15, 85).toFixed(0) + '%';
    coucheBolt.innerHTML = dessinerFoudre();
    coucheBolt.style.left = posX;
    coucheFlash.style.setProperty('--ex', posX);
    coucheFlash.classList.remove('actif');
    coucheBolt.classList.remove('actif');
    void coucheFlash.offsetWidth;   /* relance les animations */
    coucheFlash.classList.add('actif');
    coucheBolt.classList.add('actif');
  }
  planifierEclair();
}

function planifierEclair() {
  if (minuteurEclair) { window.clearTimeout(minuteurEclair); }
  minuteurEclair = window.setTimeout(declencherEclair, alea(ECLAIR_DELAI[0], ECLAIR_DELAI[1]) * 1000);
}

function majEclair(theme) {
  if (minuteurEclair) { window.clearTimeout(minuteurEclair); minuteurEclair = null; }
  if (theme === 'effroi' && ECLAIR_ACTIF) { planifierEclair(); }
}

/* ============================================================
   STEAMPUNK : ROUAGES
   Une "chaîne" = des rouages qui s'engrènent les uns dans les autres.
   x, y   : position du 1er rouage (fraction de l'écran : 0 = bord gauche/haut, 1 = bord droit/bas)
   gears  : liste des rouages. n = nombre de dents (taille).
            ang = direction du rouage précédent vers celui-ci, en degrés
            (0 = vers la droite, 90 = vers le bas, 180 = gauche, -90 = haut)
   sens   : 1 = le 1er rouage tourne dans le sens horaire, -1 = antihoraire
   mode   : 'continu' (rotation lente)  t = secondes pour un tour du 1er rouage
            'oscille' (va-et-vient)     amp = amplitude en degrés du 1er, d = secondes par aller
            'coups'   (à-coups)         tick = secondes entre deux claquements d'une dent
   ============================================================ */
var ROUAGES_ACTIF = true;

var ROUAGES_CHAINES = [
  { prof: 0.0, x: 0.92, y: 0.20, mode: 'continu', t: 200, sens: 1,
    gears: [{ n: 30 }, { n: 12, ang: 150 }] },
  { prof: 0.1, x: 0.05, y: 0.82, mode: 'oscille', d: 12, amp: 25, sens: -1,
    gears: [{ n: 26 }, { n: 10, ang: -50 }, { n: 8, ang: -110 }] },
  { prof: 0.4, x: 0.08, y: 0.18, mode: 'continu', t: 70, sens: 1,
    gears: [{ n: 12 }, { n: 8, ang: 35 }, { n: 10, ang: -10 }] },
  { prof: 0.6, x: 0.90, y: 0.65, mode: 'coups', tick: 1.3, sens: -1,
    gears: [{ n: 10 }, { n: 14, ang: 170 }] },
  { prof: 0.8, x: 0.45, y: 0.93, mode: 'oscille', d: 8, amp: 45, sens: 1,
    gears: [{ n: 9 }, { n: 8, ang: -150 }] },
  { prof: 1.0, x: 0.22, y: 0.42, mode: 'coups', tick: 1, sens: 1,
    gears: [{ n: 9 }, { n: 8, ang: 55 }] }
];

function modPositif(a, b) { return ((a % b) + b) % b; }

/* Dessine un rouage en silhouette pleine (dents + ouvertures entre les bras). couleur = remplissage */
function svgRouage(n, m, off, couleur, contour) {
  var r = n * m / 2, ro = r + m, rr = r - 1.25 * m;
  var S = Math.ceil(2 * ro + 8), c = S / 2, p = 360 / n;
  function pt(rayon, deg) {
    var a = deg * Math.PI / 180;
    return (c + rayon * Math.cos(a)).toFixed(1) + ',' + (c + rayon * Math.sin(a)).toFixed(1);
  }
  /* Contour avec les dents */
  var d = '';
  for (var k = 0; k < n; k++) {
    var ct = off + k * p;
    d += (k === 0 ? 'M' : 'L') + pt(rr, ct - 0.30 * p) + ' L' + pt(ro, ct - 0.14 * p) + ' L' + pt(ro, ct + 0.14 * p) + ' L' + pt(rr, ct + 0.30 * p);
    d += ' A' + rr.toFixed(1) + ' ' + rr.toFixed(1) + ' 0 0 1 ' + pt(rr, ct + 0.70 * p) + ' ';
  }
  d += 'Z ';

  /* Ouvertures entre les bras (évidements) */
  var nbBras = (n >= 20) ? 6 : 5;
  var pasBras = 360 / nbBras;
  var rh = Math.max(m * 1.6, rr * 0.16) * 1.35;   /* rayon intérieur : autour du moyeu */
  var rw = rr * 0.78 * 0.9;                        /* rayon extérieur : sous l'anneau */
  var delta = (m * 0.9 / ((rh + rw) / 2)) * 180 / Math.PI;
  if (rw > rh + m) {
    for (var b = 0; b < nbBras; b++) {
      var a1 = off + b * pasBras + delta, a2 = off + (b + 1) * pasBras - delta;
      d += 'M' + pt(rh, a1) + ' L' + pt(rw, a1) + ' A' + rw.toFixed(1) + ' ' + rw.toFixed(1) + ' 0 0 1 ' + pt(rw, a2) +
           ' L' + pt(rh, a2) + ' A' + rh.toFixed(1) + ' ' + rh.toFixed(1) + ' 0 0 0 ' + pt(rh, a1) + ' Z ';
    }
  }
  /* Trou d'axe */
  var ra = Math.max(m * 0.5, rh * 0.3);
  d += 'M' + (c + ra).toFixed(1) + ',' + c + ' A' + ra.toFixed(1) + ' ' + ra.toFixed(1) + ' 0 1 0 ' + (c - ra).toFixed(1) + ',' + c +
       ' A' + ra.toFixed(1) + ' ' + ra.toFixed(1) + ' 0 1 0 ' + (c + ra).toFixed(1) + ',' + c + ' Z';

  var svg = '<svg width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" style="display:block">';
  svg += '<path d="' + d + '" fill="' + couleur + '" fill-rule="evenodd"' + (contour ? ' stroke="' + contour + '" stroke-width="1.2"' : '') + '/>';
  svg += '</svg>';
  return { svg: svg, taille: S };
}

var themeRouagesCourant = null;
var ROUAGES_PAGE_PX = [20, 40];
var ROUAGES_SCROLL_AMP = [50, 180];
var ROUAGES_SCROLL_ECHELLE = 500;
var plansRouages = [];
var indexPageRouages = 0;

function majRouagesParallaxe() {
  if (plansRouages.length === 0) { return; }
  var sy = window.pageYOffset || 0;
  var sat = 1 - Math.exp(-sy / ROUAGES_SCROLL_ECHELLE);
  for (var i = 0; i < plansRouages.length; i++) {
    var pl = plansRouages[i];
    var x = -indexPageRouages * (ROUAGES_PAGE_PX[0] + (ROUAGES_PAGE_PX[1] - ROUAGES_PAGE_PX[0]) * pl.prof);
    var y = -sat * (ROUAGES_SCROLL_AMP[0] + (ROUAGES_SCROLL_AMP[1] - ROUAGES_SCROLL_AMP[0]) * pl.prof);
    appliquerTransformFond(pl.ext, x, 0);
    appliquerTransformFond(pl.int, 0, y);
  }
}

/* Steampunk : piston relié à un rouage par une bielle (cinématique exacte : x = r·cosθ + √(L² − r²·sin²θ)) */
var PISTON_ACTIF = true;
/* Piston ancré en bas à droite. bas : distance du centre du rouage au bas de l'écran (px) ; droite : marge à droite (px) */
var PISTON_STEAMPUNK = { prof: 0.5, bas: 84, droite: 14, n: 12, T: 7, sens: 1 };

function htmlPistonSteampunk(W, H, m) {
  var P = PISTON_STEAMPUNK;
  var mc = m * (0.8 + 0.5 * P.prof), Rg = P.n * mc / 2;
  var rp = Rg * 0.5, L = Rg * 2.5, hw = Rg * 0.55, hh = Rg * 0.62;
  var x0 = L - rp - 10, x1 = L + rp + hw + 16, hc = hh + 14;
  var cx = W - P.droite - x1, cy = H - P.bas;     /* le bout du carter touche la marge droite */
  var couleur = '#2A1E10';                        /* rouage : brun très sombre */
  var clair = '#33251A';                          /* bielle, tête et carter */
  var gear = svgRouage(P.n, mc, 0, couleur, '');  /* pas de contour */

  var N = 36, kb = '', kp = '';
  for (var i = 0; i <= N; i++) {
    var th = P.sens * 2 * Math.PI * i / N;
    var px = rp * Math.cos(th), py = rp * Math.sin(th);
    var xp = px + Math.sqrt(L * L - py * py);
    var phi = Math.atan2(-py, xp - px) * 180 / Math.PI;
    var pc = (i / N * 100).toFixed(3) + '%';
    kb += pc + '{transform:translate(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px) rotate(' + phi.toFixed(2) + 'deg)}';
    kp += pc + '{transform:translateX(' + xp.toFixed(2) + 'px)}';
  }
  var st = document.getElementById('sp-piston-style');
  if (!st) { st = document.createElement('style'); st.id = 'sp-piston-style'; document.head.appendChild(st); }
  st.textContent = '@keyframes spBielle{' + kb + '}@keyframes spPiston{' + kp + '}';

  var carter = '<div class="sp-piston-carter" style="left:' + (cx + x0).toFixed(1) + 'px;top:' + (cy - hc / 2).toFixed(1) + 'px;width:' + (x1 - x0).toFixed(1) + 'px;height:' + hc.toFixed(1) + 'px;background:#2E2113;"></div>';
  var rouage = '<div class="rouage rouage-continu" style="left:' + (cx - gear.taille / 2).toFixed(1) + 'px;top:' + (cy - gear.taille / 2).toFixed(1) + 'px;width:' + gear.taille + 'px;height:' + gear.taille + 'px;animation-duration:' + P.T + 's;--tour:' + (P.sens * 360) + 'deg;">' + gear.svg + '</div>';
  var tete = '<div class="sp-tete" style="left:' + cx.toFixed(1) + 'px;top:' + (cy - hh / 2).toFixed(1) + 'px;width:' + hw.toFixed(1) + 'px;height:' + hh.toFixed(1) + 'px;background-color:' + clair + ';animation-duration:' + P.T + 's;"></div>';
  var bielle = '<div class="sp-bielle" style="left:' + cx.toFixed(1) + 'px;top:' + (cy - 3.5).toFixed(1) + 'px;width:' + L.toFixed(1) + 'px;background:' + clair + ';animation-duration:' + P.T + 's;"></div>';
  return '<div class="rouage-plan" data-prof="' + P.prof + '"><div class="rouage-plan-scroll">' + carter + rouage + tete + bielle + '</div></div>';
}

function construireRouages() {
  var zone = document.getElementById('rouages-theme');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'rouages-theme';
    zone.className = 'rouages-theme';
    document.body.appendChild(zone);
  }
  var W = window.innerWidth, H = window.innerHeight;
  var m = Math.max(7, Math.min(11, W / 44));   /* taille des dents */
  var MARGE = 260;                             /* marge pour la parallaxe */
  var html = '';
  var pistonFait = false;

  /* Piston : isolé, une erreur ici ne casse jamais le reste du thème */
  function ajouterPiston() {
    if (pistonFait) { return ''; }
    pistonFait = true;
    if (typeof PISTON_ACTIF === 'undefined' || !PISTON_ACTIF || typeof htmlPistonSteampunk !== 'function') { return ''; }
    try { return htmlPistonSteampunk(W, H, m); } catch (erreur) { console.error('Piston ignoré :', erreur); return ''; }
  }

  for (var c = 0; c < ROUAGES_CHAINES.length; c++) {
    var chaine = ROUAGES_CHAINES[c];
    if (!pistonFait && typeof PISTON_STEAMPUNK !== 'undefined' && chaine.prof > PISTON_STEAMPUNK.prof) { html += ajouterPiston(); }

    var n0 = chaine.gears[0].n;
    var mc = m * (0.8 + 0.5 * chaine.prof);
    var couleur = interpolerCouleur('#3A2A14', '#6A4E24', chaine.prof);
    var contour = (chaine.prof > 0.45) ? 'rgba(232,192,106,.32)' : '';
    var prec = null;
    var htmlChaine = '';

    for (var g = 0; g < chaine.gears.length; g++) {
      var n = chaine.gears[g].n;
      var r = n * mc / 2;
      var p = 360 / n;
      var cx, cy, off;

      if (!prec) {
        cx = chaine.x * W; cy = chaine.y * H; off = 0;
      } else {
        var phi = chaine.gears[g].ang || 0;
        var rad = phi * Math.PI / 180;
        cx = prec.cx + (prec.r + r) * Math.cos(rad);
        cy = prec.cy + (prec.r + r) * Math.sin(rad);
        var u = modPositif(phi - prec.off, prec.p);
        off = modPositif(phi + 180 + u * prec.n / n + p / 2, p);
      }

      var sens = chaine.sens * (g % 2 === 0 ? 1 : -1);
      var classe = 'rouage rouage-' + chaine.mode;
      var anim = '';
      if (chaine.mode === 'continu') {
        anim = 'animation-duration:' + (chaine.t * n / n0).toFixed(1) + 's;--tour:' + (sens * 360) + 'deg;';
      } else if (chaine.mode === 'oscille') {
        var amp = chaine.amp * n0 / n;
        anim = 'animation-duration:' + chaine.d + 's;--a0:' + (-sens * amp).toFixed(1) + 'deg;--a1:' + (sens * amp).toFixed(1) + 'deg;';
      } else {
        anim = 'animation-duration:' + (chaine.tick * n).toFixed(1) + 's;animation-timing-function:steps(' + n + ',end);--tour:' + (sens * 360) + 'deg;';
      }

      var dessin = svgRouage(n, mc, off, couleur, contour);
      if (cx + r + mc + MARGE > 0 && cx - r - mc - MARGE < W && cy + r + mc + MARGE > 0 && cy - r - mc - MARGE < H) {
        htmlChaine += '<div class="' + classe + '" style="left:' + (cx - dessin.taille / 2).toFixed(1) + 'px;top:' + (cy - dessin.taille / 2).toFixed(1) + 'px;width:' + dessin.taille + 'px;height:' + dessin.taille + 'px;' + anim + '">' + dessin.svg + '</div>';
      }

      prec = { cx: cx, cy: cy, r: r, n: n, p: p, off: off };
    }
    html += '<div class="rouage-plan" data-prof="' + chaine.prof + '"><div class="rouage-plan-scroll">' + htmlChaine + '</div></div>';
  }
  html += ajouterPiston();   /* si aucune chaîne n'est plus proche que lui, il passe au premier plan */
  zone.innerHTML = html;

  plansRouages = [];
  var exts = zone.querySelectorAll('.rouage-plan');
  for (var e = 0; e < exts.length; e++) {
    plansRouages.push({
      ext: exts[e],
      int: exts[e].firstChild,
      prof: parseFloat(exts[e].getAttribute('data-prof')) || 0
    });
  }
  majRouagesParallaxe();
}

function majRouages(theme) {
  var actif = ROUAGES_ACTIF && theme === 'steampunk';
  var zone = document.getElementById('rouages-theme');
  if (!actif) {
    if (zone) { zone.innerHTML = ''; }
    themeRouagesCourant = null;
    return;
  }
  if (themeRouagesCourant === theme) { return; }
  themeRouagesCourant = theme;
  construireRouages();
}

var minuteurRedimRouages = null;
window.addEventListener('resize', function () {
  if (themeRouagesCourant !== 'steampunk') { return; }
  if (minuteurRedimRouages) { window.clearTimeout(minuteurRedimRouages); }
  minuteurRedimRouages = window.setTimeout(construireRouages, 300);
}, false);

/* ============================================================
   HIVERNAL : DÉCOR GIVRÉ
   Arrière-plan (derrière les cartes) : des plans de profondeurs différentes.
     Chaque plan = un "ext" qui suit l'onglet (décalage horizontal)
                 + un "int" qui suit le défilement (décalage vertical).
     Plus le plan est proche (prof proche de 1), plus il bouge.
   Premier plan (devant tout, ne bloque jamais les touches) : givre sur les bords,
     comme si l'écran était une vitre gelée.

   Réglages d'un plan :
   genre   : 'flocons' | 'scintilles' | 'brume' | 'colline'
   prof    : profondeur, 0 = très loin (bouge peu) … 1 = tout près (bouge beaucoup)
   sc      : part du défilement vertical suivie par ce plan (1 = tout, 0 = fixe)
   n       : nombre d'éléments (multiplié par HIVER_DENSITE)
   t       : taille en px [min, max]     d : durée en secondes [min, max]
   dx      : dérive horizontale max (px) r : rotation max (deg)     op : opacité [min, max]
   forme   : 'point' (grain doux) ou 'glyphe' (vrai flocon)
   ============================================================ */
var HIVER_ACTIF = true;
var HIVER_GIVRE_ACTIF = true;       /* false = pas de givre sur les bords */
var HIVER_DENSITE = 1;              /* 0.5 = deux fois moins de particules (appareil lent), 1 = normal */
var HIVER_PAGE_PX = [8, 44];        /* décalage horizontal par onglet : plan lointain, plan proche */
var HIVER_SCROLL_AMP = [16, 150];   /* décalage vertical max au défilement : plan lointain, plan proche */
var HIVER_SCROLL_ECHELLE = 500;
var HIVER_MARGE = 230;              /* marge autour de l'écran pour que la parallaxe ne montre jamais de vide */

var HIVER_PLANS = [
  { genre: 'brume',      prof: 0.05, sc: 0.3,  n: 4,  d: [60, 95], op: [.8, 1] },
  { genre: 'flocons',    prof: 0.10, sc: 1,    n: 40, t: [2.5, 4.5], d: [38, 60], dx: 36,  op: [.45, .75], forme: 'point' },
  { genre: 'colline',    prof: 0.20, sc: 0.3,  haut: 170, couleur: '168,214,238', op: .34 },
  { genre: 'scintilles', prof: 0.35, sc: 1,    n: 60, t: [1.8, 3.2], d: [5, 12], op: [.55, .95] },
  { genre: 'flocons',    prof: 0.45, sc: 1,    n: 24, t: [5, 9],     d: [24, 38], dx: 60,  op: [.55, .9],  forme: 'point' },
  { genre: 'colline',    prof: 0.65, sc: 0.3,  haut: 120, couleur: '205,236,252', op: .28 },
  { genre: 'scintilles', prof: 0.80, sc: 1,    n: 22, t: [2.4, 4],   d: [6, 14], op: [.6, 1] },
  { genre: 'flocons',    prof: 1.00, sc: 1,    n: 12, t: [16, 28],   d: [15, 24], dx: 100, r: 200, op: [.4, .65], forme: 'glyphe' }
];

var themeHiverCourant = null;
var plansHiver = [];
var graineHiver = 1;

/* Hasard à graine fixe : le givre est le même à chaque lancement (et ne "saute" pas quand on tourne l'écran) */
function hasardHiver() {
  graineHiver = (graineHiver * 16807) % 2147483647;
  return (graineHiver - 1) / 2147483646;
}
function aleaHiver(min, max) { return min + hasardHiver() * (max - min); }

function majHiverParallaxe() {
  if (plansHiver.length === 0) { return; }
  var sy = window.pageYOffset || 0;
  var sat = 1 - Math.exp(-sy / HIVER_SCROLL_ECHELLE);
  for (var i = 0; i < plansHiver.length; i++) {
    var pl = plansHiver[i];
    var x = -indexPageRouages * (HIVER_PAGE_PX[0] + (HIVER_PAGE_PX[1] - HIVER_PAGE_PX[0]) * pl.prof);
    var y = -sat * pl.sc * (HIVER_SCROLL_AMP[0] + (HIVER_SCROLL_AMP[1] - HIVER_SCROLL_AMP[0]) * pl.prof);
    appliquerTransformFond(pl.ext, x, 0);
    appliquerTransformFond(pl.int, 0, y);
  }
}

/* --- Flocons d'arrière-plan : grains doux (loin) ou vrais flocons (près) --- */
function htmlFloconsHiver(pl, W, H) {
  var n = Math.round(pl.n * HIVER_DENSITE);
  var chute = H + HIVER_SCROLL_AMP[1] + 90;    /* distance de chute : va jusqu'en bas même quand le plan est remonté par le défilement */
  var glyphes = ['a', 'b', 'c'];
  var html = '';
  for (var i = 0; i < n; i++) {
    var taille = aleaHiver(pl.t[0], pl.t[1]);
    var duree = aleaHiver(pl.d[0], pl.d[1]);
    var dx = aleaHiver(-pl.dx, pl.dx);
    var s = 'left:' + aleaHiver(-HIVER_MARGE, W + HIVER_MARGE).toFixed(0) + 'px;';
    s += 'animation-duration:' + duree.toFixed(1) + 's;animation-delay:-' + (hasardHiver() * duree).toFixed(1) + 's;';
    s += '--dx:' + dx.toFixed(0) + 'px;--dx1:' + (-dx * 0.45).toFixed(0) + 'px;';
    s += '--h:' + chute.toFixed(0) + 'px;--hm:' + (chute / 2).toFixed(0) + 'px;';
    s += '--op:' + aleaHiver(pl.op[0], pl.op[1]).toFixed(2) + ';';
    if (pl.forme === 'glyphe') {
      s += 'font-size:' + taille.toFixed(1) + 'px;--rot:' + aleaHiver(-pl.r, pl.r).toFixed(0) + 'deg;';
      html += '<span class="hv-f hv-f-glyphe hv-f-' + glyphes[Math.floor(hasardHiver() * 3)] + '" style="' + s + '"></span>';
    } else {
      s += 'width:' + taille.toFixed(1) + 'px;height:' + taille.toFixed(1) + 'px;';
      html += '<span class="hv-f hv-f-point" style="' + s + '"></span>';
    }
  }
  return html;
}

/* --- Scintillements : de minuscules points qui brillent un court instant, puis s'éteignent (pas d'étoiles) --- */
function htmlScintillesHiver(pl, W, H) {
  var n = Math.round(pl.n * HIVER_DENSITE);
  var html = '';
  for (var i = 0; i < n; i++) {
    var taille = aleaHiver(pl.t[0], pl.t[1]);
    var duree = aleaHiver(pl.d[0], pl.d[1]);
    var teinte = hasardHiver() < 0.78 ? '' : ' hv-s-bleu';
    var s = 'left:' + aleaHiver(-HIVER_MARGE, W + HIVER_MARGE).toFixed(0) + 'px;top:' + aleaHiver(0, H + 120).toFixed(0) + 'px;';
    s += 'width:' + taille.toFixed(1) + 'px;height:' + taille.toFixed(1) + 'px;';
    s += 'animation-duration:' + duree.toFixed(1) + 's;animation-delay:-' + (hasardHiver() * duree).toFixed(1) + 's;';
    s += '--op:' + aleaHiver(pl.op[0], pl.op[1]).toFixed(2) + ';';
    html += '<span class="hv-s' + teinte + '" style="' + s + '"></span>';
  }
  return html;
}

/* --- Brume : grandes nappes très douces qui dérivent lentement dans le bas de l'écran --- */
function htmlBrumeHiver(pl, W, H) {
  var n = Math.max(1, Math.round(pl.n * HIVER_DENSITE));
  var html = '';
  for (var i = 0; i < n; i++) {
    var larg = aleaHiver(W * 0.9, W * 1.5);
    var haut = aleaHiver(220, 380);
    var duree = aleaHiver(pl.d[0], pl.d[1]);
    var s = 'left:' + (-larg).toFixed(0) + 'px;top:' + (H * aleaHiver(0.5, 0.92)).toFixed(0) + 'px;';
    s += 'width:' + larg.toFixed(0) + 'px;height:' + haut.toFixed(0) + 'px;';
    s += 'animation-duration:' + duree.toFixed(1) + 's;animation-delay:-' + (hasardHiver() * duree).toFixed(1) + 's;';
    s += '--dx:' + (W + larg + 2 * HIVER_MARGE).toFixed(0) + 'px;--op:' + aleaHiver(pl.op[0], pl.op[1]).toFixed(2) + ';';
    html += '<span class="hv-brume" style="' + s + '"></span>';
  }
  return html;
}

/* --- Congère : une crête de neige douce, dessinée au hasard --- */
function htmlCollineHiver(pl, W, H) {
  var L = W + 2 * HIVER_MARGE, h = pl.haut;
  var pas = 110, k = Math.ceil(L / pas) + 1;
  var pts = [], i;
  for (i = 0; i <= k; i++) { pts.push([i * pas, h * aleaHiver(0.12, 0.5)]); }
  var d = 'M0,' + pts[0][1].toFixed(1);
  for (i = 1; i < pts.length; i++) {
    var mx = (pts[i - 1][0] + pts[i][0]) / 2, my = (pts[i - 1][1] + pts[i][1]) / 2;
    d += ' Q' + pts[i - 1][0].toFixed(1) + ',' + pts[i - 1][1].toFixed(1) + ' ' + mx.toFixed(1) + ',' + my.toFixed(1);
  }
  d += ' L' + L + ',' + h + ' L0,' + h + ' Z';
  var id = 'hvCol' + Math.round(pl.prof * 100);
  var svg = '<svg width="' + L + '" height="' + h + '" viewBox="0 0 ' + L + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="rgb(' + pl.couleur + ')" stop-opacity="' + pl.op + '"/>' +
    '<stop offset="1" stop-color="rgb(' + pl.couleur + ')" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="' + d + '" fill="url(#' + id + ')"/></svg>';
  return '<div class="hv-colline" style="left:' + (-HIVER_MARGE) + 'px;top:' + Math.round(H - h * 0.62) + 'px;">' + svg + '</div>';
}

/* --- Givre : fougères de glace qui poussent depuis les bords et les coins de la vitre --- */
function brancheGivre(g, x, y, ang, long, riche) {
  var x2 = x + Math.cos(ang) * long, y2 = y + Math.sin(ang) * long;
  g.b += 'M' + x.toFixed(1) + ',' + y.toFixed(1) + 'L' + x2.toFixed(1) + ',' + y2.toFixed(1);
  if (riche && long > 13) {   /* brindilles sur les grandes branches */
    for (var k = 0; k < 2; k++) {
      var t = k === 0 ? 0.42 : 0.74;
      var bx = x + Math.cos(ang) * long * t, by = y + Math.sin(ang) * long * t;
      var bl = long * (k === 0 ? 0.46 : 0.32);
      var o = 0.8 + hasardHiver() * 0.2;
      g.t += 'M' + bx.toFixed(1) + ',' + by.toFixed(1) + 'L' + (bx + Math.cos(ang - o) * bl).toFixed(1) + ',' + (by + Math.sin(ang - o) * bl).toFixed(1);
      g.t += 'M' + bx.toFixed(1) + ',' + by.toFixed(1) + 'L' + (bx + Math.cos(ang + o) * bl).toFixed(1) + ',' + (by + Math.sin(ang + o) * bl).toFixed(1);
    }
  }
}

function fougereGivre(g, x, y, ang, long, riche) {
  var n = Math.max(5, Math.round(long / 9));
  var pas = long / n;
  var px = x, py = y, a = ang;
  var virage = (hasardHiver() - 0.5) * 0.09;
  g.c += 'M' + px.toFixed(1) + ',' + py.toFixed(1);
  for (var i = 1; i <= n; i++) {
    a += virage + (hasardHiver() - 0.5) * 0.07;
    px += Math.cos(a) * pas; py += Math.sin(a) * pas;
    g.c += 'L' + px.toFixed(1) + ',' + py.toFixed(1);
    if (i >= 2 && i < n) {
      var t = i / n;
      var lb = long * 0.34 * (1 - t * 0.85) * aleaHiver(0.85, 1.15);   /* branches de plus en plus courtes vers la pointe */
      if (lb > 4) {
        var ouv = aleaHiver(0.85, 1.1);
        brancheGivre(g, px, py, a - ouv, lb, riche);
        brancheGivre(g, px, py, a + ouv, lb, riche);
      }
    }
  }
}

function htmlGivre(W, H) {
  graineHiver = 7;
  var g = { c: '', b: '', t: '' };
  var PI = Math.PI, i, n, p;
  var gros = Math.min(190, Math.max(100, Math.min(W, H) * 0.26)) * (W < 600 ? 0.72 : 1);    /* grandes fougères des coins */
  /* longueur max des petites fougères du bord : courtes sur téléphone pour ne pas gêner la lecture */
  var maxBord = Math.max(22, Math.min(80, (W - 600) / 2 + 24));

  /* coins : un bouquet de fougères ; celles qui longent un bord (vers l'en-tête ou la navigation) sont plus courtes */
  var coins = [
    { x: 0, y: 0, a0: 0, f: 0.85 },
    { x: W, y: 0, a0: PI / 2, f: 0.85 },
    { x: W, y: H, a0: PI, f: W < 600 ? 0.6 : 0.9 },
    { x: 0, y: H, a0: -PI / 2, f: W < 600 ? 0.6 : 0.9 }
  ];
  for (i = 0; i < coins.length; i++) {
    var cn = coins[i];
    n = 5;
    for (p = 0; p < n; p++) {
      var rel = 0.22 + (PI / 2 - 0.44) * (p / (n - 1)) + (hasardHiver() - 0.5) * 0.18;   /* angle depuis le bord, 0 … 90° */
      var facteur = 0.5 + 0.5 * Math.sin(2 * rel);                                         /* diagonale = longue, le long d'un bord = courte */
      fougereGivre(g, cn.x, cn.y, cn.a0 + rel, gros * cn.f * facteur * aleaHiver(0.8, 1), true);
    }
  }

  /* bords gauche et droit : de petites fougères, une tous les ~100 px, entre l'en-tête et la navigation */
  var cotes = [
    { x0: 0, a: 0 },
    { x0: W, a: PI }
  ];
  for (i = 0; i < cotes.length; i++) {
    var c = cotes[i];
    for (var s = 150; s < H - 150; s += aleaHiver(80, 130)) {
      if (hasardHiver() < 0.25) { continue; }
      var l = aleaHiver(maxBord * 0.45, maxBord);
      fougereGivre(g, c.x0, s, c.a + (hasardHiver() - 0.5) * 0.7, l, l > 56);
    }
  }

  return '<div class="hv-givre-voile"></div>' +
    '<svg class="hv-givre-cristaux" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round">' +
    '<path class="hv-gx-t" d="' + g.t + '"/><path class="hv-gx-b" d="' + g.b + '"/><path class="hv-gx-c" d="' + g.c + '"/></svg>';
}

function construireHiver() {
  var zone = document.getElementById('hiver-theme');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'hiver-theme';
    zone.className = 'hiver-theme';
    document.body.appendChild(zone);
  }
  var givre = document.getElementById('hiver-givre');
  if (!givre) {
    givre = document.createElement('div');
    givre.id = 'hiver-givre';
    givre.className = 'hiver-givre';
    document.body.appendChild(givre);
  }

  var W = window.innerWidth, H = window.innerHeight;
  graineHiver = 31;
  var html = '';
  for (var i = 0; i < HIVER_PLANS.length; i++) {
    var pl = HIVER_PLANS[i], contenu = '';
    if (pl.genre === 'flocons') { contenu = htmlFloconsHiver(pl, W, H); }
    else if (pl.genre === 'scintilles') { contenu = htmlScintillesHiver(pl, W, H); }
    else if (pl.genre === 'brume') { contenu = htmlBrumeHiver(pl, W, H); }
    else if (pl.genre === 'colline') { contenu = htmlCollineHiver(pl, W, H); }
    html += '<div class="hv-plan" data-i="' + i + '"><div class="hv-plan-scroll">' + contenu + '</div></div>';
  }
  zone.innerHTML = html;
  givre.innerHTML = HIVER_GIVRE_ACTIF ? htmlGivre(W, H) : '';

  plansHiver = [];
  var exts = zone.querySelectorAll('.hv-plan');
  for (var e = 0; e < exts.length; e++) {
    var def = HIVER_PLANS[parseInt(exts[e].getAttribute('data-i'), 10)];
    plansHiver.push({ ext: exts[e], int: exts[e].firstChild, prof: def.prof, sc: def.sc });
  }
  majHiverParallaxe();
}

/* ============================================================
   REFLETS : une lumière qui traverse l'écran de temps en temps (toujours de gauche à droite).
   - elle allume brièvement quelques facettes du fond, pile sur le dessin de la glace ;
   - elle glisse sur les cartes qu'elle croise (reflet doux + éclats sur les arêtes, voir le CSS).
   ============================================================ */
var HIVER_REFLETS_ACTIF = true;
var HIVER_REFLET_PAUSE = [7000, 13000];   /* ms de calme entre deux passages de lumière */
var HIVER_REFLET_DUREE = 6500;            /* durée d'un passage (ms) */
var HIVER_REFLET_RAYON = 150;             /* distance (px) à laquelle la lumière allume une facette */
var HIVER_REFLET_CARTES = '.carte:not(li), .carte-checklist, .meteo-carte, .reglages-section, .sx-exo, .accueil-tuile, .accueil-carte, .modal-contenu, .entete-carte, .nav-bas';
var HIVER_TUILE = 240;                    /* taille du motif du fond (ne pas changer) */
var HIVER_FACETTES = [
  [4,9,71,16,74,46,50,24], [4,9,74,46,16,65,32,40], [71,16,129,15,74,46,91,26], [129,15,119,51,74,46,107,37], [129,15,163,-1,119,51,137,22], [163,-1,182,63,119,51,155,37], [163,-1,244,9,182,63,196,23], [244,9,256,65,182,63,227,46], [16,65,74,46,52,135,47,82], [16,65,52,135,-18,110,17,103], [74,46,119,51,52,135,82,77], [119,51,130,108,52,135,100,98], [119,51,182,63,130,108,143,74], [182,63,191,107,130,108,167,92], [182,63,256,65,191,107,209,78], [256,65,222,110,191,107,223,94], [-18,110,52,135,4,167,13,137], [52,135,42,193,4,167,33,165], [52,135,130,108,110,170,97,137], [52,135,110,170,42,193,68,166], [130,108,191,107,197,193,173,136], [130,108,197,193,110,170,145,157], [191,107,222,110,244,167,219,128], [191,107,244,167,197,193,211,156], [4,167,42,193,71,256,39,205], [4,167,71,256,4,249,26,224], [42,193,110,170,129,255,93,206], [42,193,129,255,71,256,80,235], [110,170,197,193,163,239,157,201], [110,170,163,239,129,255,134,221], [197,193,244,167,163,239,202,200], [244,167,244,249,163,239,217,218]
];

var minuteurReflet = null;
var lumiereHiver = null;
var facettesRecentes = {};
var compteurFacettes = 0;

function allumerFacettesHiver(lx, ly) {
  if (typeof fondMotif === 'undefined' || !fondMotif) { return; }
  var r = fondMotif.getBoundingClientRect();
  var px = lx - r.left, py = ly - r.top;
  var ci = Math.floor(px / HIVER_TUILE), cj = Math.floor(py / HIVER_TUILE);
  var maintenant = Date.now();
  var candidats = [];
  for (var oi = ci - 1; oi <= ci + 1; oi++) {
    for (var oj = cj - 1; oj <= cj + 1; oj++) {
      for (var t = 0; t < HIVER_FACETTES.length; t++) {
        var f = HIVER_FACETTES[t];
        var dx = oi * HIVER_TUILE + f[6] - px, dy = oj * HIVER_TUILE + f[7] - py;
        var d = Math.sqrt(dx * dx + dy * dy);
        var cle = oi + '_' + oj + '_' + t;
        if (d < HIVER_REFLET_RAYON && maintenant - (facettesRecentes[cle] || 0) > 4000) {
          candidats.push({ d: d, oi: oi, oj: oj, t: t, cle: cle });
        }
      }
    }
  }
  if (candidats.length === 0 || Math.random() > 0.3) { return; }
  var c = candidats[Math.floor(Math.random() * candidats.length)];
  facettesRecentes[c.cle] = maintenant;
  var f2 = HIVER_FACETTES[c.t];
  var minx = Math.min(f2[0], f2[2], f2[4]), maxx = Math.max(f2[0], f2[2], f2[4]);
  var miny = Math.min(f2[1], f2[3], f2[5]), maxy = Math.max(f2[1], f2[3], f2[5]);
  var w = maxx - minx, h = maxy - miny;
  var force = 0.95 - 0.45 * (c.d / HIVER_REFLET_RAYON);   /* plus la facette est près de la lumière, plus elle brille */
  var id = 'hvg' + (compteurFacettes++);
  var svg = '<svg class="hv-facette" style="left:' + (c.oi * HIVER_TUILE + minx) + 'px;top:' + (c.oj * HIVER_TUILE + miny) + 'px;" ' +
    'width="' + w + '" height="' + h + '" viewBox="' + minx + ' ' + miny + ' ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#F4FCFF" stop-opacity="' + force.toFixed(2) + '"/>' +
    '<stop offset="1" stop-color="#9FE0F8" stop-opacity="' + (force * 0.35).toFixed(2) + '"/></linearGradient></defs>' +
    '<polygon points="' + f2[0] + ',' + f2[1] + ' ' + f2[2] + ',' + f2[3] + ' ' + f2[4] + ',' + f2[5] + '" fill="url(#' + id + ')"/></svg>';
  fondMotif.insertAdjacentHTML('beforeend', svg);
  var el = fondMotif.lastChild;
  window.setTimeout(function () { if (el && el.parentNode) { el.parentNode.removeChild(el); } }, 3000);
}

function faireBrillerCartesHiver(lx, ly) {
  var els = document.querySelectorAll(HIVER_REFLET_CARTES);
  var H = window.innerHeight, W = window.innerWidth;
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (el.hvBrille) { continue; }
    var r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) { continue; }
    var dx = Math.max(r.left - lx, 0, lx - r.right), dy = Math.max(r.top - ly, 0, ly - r.bottom);
    if (Math.sqrt(dx * dx + dy * dy) < 70) {
      el.hvBrille = true;
      el.className += ' hv-brille';
      (function (e) {
        window.setTimeout(function () {
          e.className = e.className.replace(' hv-brille', '');
          window.setTimeout(function () { e.hvBrille = false; }, 3000);   /* pas deux reflets d'affilée sur la même carte */
        }, 1500);
      })(el);
    }
  }
}

function planifierPassageHiver(delai) {
  if (minuteurReflet) { window.clearTimeout(minuteurReflet); }
  minuteurReflet = window.setTimeout(lancerPassageHiver, delai);
}

function lancerPassageHiver() {
  if (themeHiverCourant !== 'hivernal' || !HIVER_REFLETS_ACTIF) { return; }
  var W = window.innerWidth, H = window.innerHeight;
  var y0 = H * (0.1 + Math.random() * 0.8);
  lumiereHiver = { t0: Date.now(), x0: -0.1 * W, y0: y0, x1: 1.1 * W, y1: y0 + (Math.random() - 0.5) * H * 0.8 };
  avancerLumiereHiver();
}

function avancerLumiereHiver() {
  if (!lumiereHiver) { return; }
  var k = (Date.now() - lumiereHiver.t0) / HIVER_REFLET_DUREE;
  if (k >= 1 || themeHiverCourant !== 'hivernal') {
    lumiereHiver = null;
    if (themeHiverCourant === 'hivernal') {
      planifierPassageHiver(HIVER_REFLET_PAUSE[0] + Math.random() * (HIVER_REFLET_PAUSE[1] - HIVER_REFLET_PAUSE[0]));
    }
    return;
  }
  if (!document.hidden) {
    var lx = lumiereHiver.x0 + (lumiereHiver.x1 - lumiereHiver.x0) * k;
    var ly = lumiereHiver.y0 + (lumiereHiver.y1 - lumiereHiver.y0) * k;
    allumerFacettesHiver(lx, ly);
    faireBrillerCartesHiver(lx, ly);
  }
  minuteurReflet = window.setTimeout(avancerLumiereHiver, 140);
}

function arreterRefletsHiver() {
  if (minuteurReflet) { window.clearTimeout(minuteurReflet); minuteurReflet = null; }
  lumiereHiver = null;
}

function majHiver(theme) {
  var zone = document.getElementById('hiver-theme');
  var givre = document.getElementById('hiver-givre');
  if (!HIVER_ACTIF || theme !== 'hivernal') {
    if (zone) { zone.innerHTML = ''; }
    if (givre) { givre.innerHTML = ''; }
    plansHiver = [];
    themeHiverCourant = null;
    arreterRefletsHiver();
    return;
  }
  if (themeHiverCourant === theme) { return; }
  themeHiverCourant = theme;
  construireHiver();
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (HIVER_REFLETS_ACTIF && !calme) { planifierPassageHiver(1500); }
}

var minuteurRedimHiver = null;
window.addEventListener('resize', function () {
  if (themeHiverCourant !== 'hivernal') { return; }
  if (minuteurRedimHiver) { window.clearTimeout(minuteurRedimHiver); }
  minuteurRedimHiver = window.setTimeout(construireHiver, 300);
}, false);

/* ============================================================
   WASTELAND : explosions de caisses de nitro, hors champ, à intervalle aléatoire.
   Comme dans Crash : flash vert, boule de feu, onde de choc, éclats de caisse,
   et réactions en chaîne (une caisse fait exploser ses voisines).
   ============================================================ */
var NITRO_ACTIF = true;
var NITRO_DELAI = [6, 18];    /* secondes entre deux explosions (min, max) */
var minuteurNitro = null;
var zoneNitro = null;

function creerZoneNitro() {
  if (zoneNitro) { return; }
  zoneNitro = document.createElement('div');
  zoneNitro.className = 'nitro-zone';
  document.body.appendChild(zoneNitro);
}

function lancerExplosionNitro(x, y, R) {
  creerZoneNitro();
  var W = window.innerWidth, H = window.innerHeight;
  var base = Math.atan2(H / 2 - y, W / 2 - x);   /* direction vers l'écran : tout part de ce côté */
  var h = '';
  var i, ang, dist, tx, ty, s, dur, ox, oy;

  function ctr(taille) { return 'margin:-' + (taille / 2).toFixed(0) + 'px 0 0 -' + (taille / 2).toFixed(0) + 'px;'; }

  h += '<span class="nx nx-flash" style="width:' + (R * 3).toFixed(0) + 'px;height:' + (R * 3).toFixed(0) + 'px;' + ctr(R * 3) + '"></span>';
  h += '<span class="nx nx-boule" style="width:' + (R * 1.3).toFixed(0) + 'px;height:' + (R * 1.3).toFixed(0) + 'px;' + ctr(R * 1.3) + '"></span>';
  h += '<span class="nx nx-onde" style="width:' + (R * 1.4).toFixed(0) + 'px;height:' + (R * 1.4).toFixed(0) + 'px;' + ctr(R * 1.4) + '"></span>';

  /* Éclats : planches vertes et bois, projetés vers l'écran puis retombant */
  var couleurs = ['#8BD21A', '#6DAF12', '#C79A5A', '#5B3A1A', '#A8E02A'];
  for (i = 0; i < 6; i++) {
    ang = base + alea(-1.1, 1.1);
    dist = alea(0.5, 1.9) * R;
    tx = Math.cos(ang) * dist;
    ty = Math.sin(ang) * dist + alea(40, 120);
    h += '<span class="nx nx-debris" style="width:' + alea(6, 14).toFixed(0) + 'px;height:' + alea(4, 8).toFixed(0) + 'px;background:' + couleurs[Math.floor(Math.random() * couleurs.length)] + ';' +
      'animation-duration:' + alea(0.9, 1.5).toFixed(2) + 's;animation-delay:' + alea(0.02, 0.1).toFixed(2) + 's;' +
      '--mx:' + (tx * 0.55).toFixed(0) + 'px;--my:' + (Math.sin(ang) * dist * 0.55 - alea(20, 60)).toFixed(0) + 'px;' +
      '--tx:' + tx.toFixed(0) + 'px;--ty:' + ty.toFixed(0) + 'px;--rot:' + alea(-540, 540).toFixed(0) + 'deg;"></span>';
  }

  /* Fumée qui monte après l'explosion */
  for (i = 0; i < 4; i++) {
    s = alea(0.7, 1.2) * R;
    ang = base + alea(-0.8, 0.8);
    dist = alea(0.2, 0.8) * R;
    ox = Math.cos(ang) * dist - s / 2;
    oy = Math.sin(ang) * dist - s / 2;
    dur = alea(1.8, 2.8);
    h += '<span class="nx nx-fumee" style="width:' + s.toFixed(0) + 'px;height:' + s.toFixed(0) + 'px;margin:' + oy.toFixed(0) + 'px 0 0 ' + ox.toFixed(0) + 'px;' +
      'animation-duration:' + dur.toFixed(2) + 's;animation-delay:' + alea(0.15, 0.4).toFixed(2) + 's;--ty:-' + alea(80, 200).toFixed(0) + 'px;"></span>';
  }

  var el = document.createElement('div');
  el.className = 'nx-expl';
  el.style.left = x.toFixed(0) + 'px';
  el.style.top = y.toFixed(0) + 'px';
  el.innerHTML = h;
  zoneNitro.appendChild(el);
  window.setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, 3600);
}

function declencherNitro() {
  minuteurNitro = null;
  if ((etat.profil.theme || 'sombre') !== 'wasteland' || !NITRO_ACTIF) { return; }
  if (!document.hidden) {
    var W = window.innerWidth, H = window.innerHeight;
    var tirage = Math.random();
    var vertical = (tirage >= 0.8);                      /* 80 % : sur les côtés, 20 % : sous l'écran */
    var x0, y0, dx = 0, dy = 0;
    if (tirage < 0.4) { x0 = -alea(10, 70); y0 = alea(0.25, 0.9) * H; dy = alea(50, 110) * (Math.random() < 0.5 ? 1 : -1); }
    else if (!vertical) { x0 = W + alea(10, 70); y0 = alea(0.25, 0.9) * H; dy = alea(50, 110) * (Math.random() < 0.5 ? 1 : -1); }
    else { x0 = alea(0.1, 0.9) * W; y0 = H + alea(10, 60); dx = alea(60, 120) * (Math.random() < 0.5 ? 1 : -1); }

    /* Une caisse seule, ou une réaction en chaîne de 2 à 4 */
    var nb = Math.random() < 0.45 ? 1 : 2 + Math.floor(Math.random() * 3);
    var delai = 0;
    for (var k = 0; k < nb; k++) {
      (function (px, py, R, d) {
        window.setTimeout(function () {
          if ((etat.profil.theme || 'sombre') === 'wasteland') { lancerExplosionNitro(px, py, R); }
        }, d);
      })(x0 + dx * k, y0 + dy * k, alea(170, 270) * alea(0.85, 1.15), delai);
      delai += alea(160, 340);
    }
  }
  planifierNitro();
}

function planifierNitro() {
  if (minuteurNitro) { window.clearTimeout(minuteurNitro); }
  minuteurNitro = window.setTimeout(declencherNitro, alea(NITRO_DELAI[0], NITRO_DELAI[1]) * 1000);
}

function majNitro(theme) {
  if (minuteurNitro) { window.clearTimeout(minuteurNitro); minuteurNitro = null; }
  if (zoneNitro) { zoneNitro.innerHTML = ''; }
  if (theme === 'wasteland' && NITRO_ACTIF) { planifierNitro(); }
}

/* ============================================================
   EFFROI : esprits qui montent (silhouettes floues, apparitions aléatoires)
   3 formes : le hurleur, le capuchon au visage vide, le chœur de visages dans la brume
   ============================================================ */
var ESPRITS_ACTIFS = true;
var ESPRITS_DELAI = [7, 18];    /* secondes entre deux apparitions (min, max) */
var ESPRITS_MAX = 2;            /* nombre maximum d'esprits visibles en même temps */
var espritsImages = [];
var espritsEnCours = 0;
var minuteurEsprits = null;
var zoneEsprits = null;

function construireImagesEsprits() {
  if (espritsImages.length > 0) { return; }
  var defs = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#D8FFE6" stop-opacity=".95"/><stop offset=".55" stop-color="#A9B8FF" stop-opacity=".6"/><stop offset="1" stop-color="#7B2FF7" stop-opacity="0"/></linearGradient>' +
    '<filter id="f" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>';
  var trou = '#05020A';

  /* 1. Le hurleur */
  var hurleur = '<path d="M30 48C22 80 28 120 18 170C14 195 22 210 30 224C34 205 40 218 46 200C50 220 58 204 62 218C70 204 74 184 70 150C78 110 78 80 70 48Z" fill="url(#g)"/>' +
    '<ellipse cx="50" cy="38" rx="17" ry="25" fill="url(#g)"/>' +
    '<path d="M33 72C10 62 6 36 14 8M67 72C90 60 96 34 86 6" fill="none" stroke="#C9F5DB" stroke-opacity=".55" stroke-width="3.2" stroke-linecap="round"/>' +
    '<ellipse cx="42" cy="34" rx="4" ry="10" fill="' + trou + '"/><ellipse cx="58" cy="34" rx="4" ry="10" fill="' + trou + '"/>' +
    '<ellipse cx="50" cy="60" rx="6.5" ry="15" fill="' + trou + '"/>';

  /* 2. Le capuchon */
  var capuchon = '<path d="M50 8C28 10 22 34 26 54C16 90 20 150 8 200C20 190 26 215 38 196C46 222 56 200 62 218C72 196 82 206 92 198C80 150 84 90 74 54C78 34 72 10 50 8Z" fill="url(#g)"/>' +
    '<path d="M27 72C12 112 18 156 10 214M73 72C88 112 82 156 90 214" fill="none" stroke="#C9F5DB" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>' +
    '<ellipse cx="50" cy="38" rx="13" ry="21" fill="' + trou + '"/>' +
    '<circle cx="44" cy="34" r="1.9" fill="#EFFFF4"/><circle cx="56" cy="34" r="1.9" fill="#EFFFF4"/>';

  /* 3. Le chœur */
  function visage(x, y, k) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (9 * k) + '" ry="' + (13 * k) + '" fill="#D8FFE6" fill-opacity=".85"/>' +
      '<ellipse cx="' + (x - 3.4 * k) + '" cy="' + (y - 3 * k) + '" rx="' + (2.1 * k) + '" ry="' + (4.6 * k) + '" fill="' + trou + '"/>' +
      '<ellipse cx="' + (x + 3.4 * k) + '" cy="' + (y - 3 * k) + '" rx="' + (2.1 * k) + '" ry="' + (4.6 * k) + '" fill="' + trou + '"/>' +
      '<ellipse cx="' + x + '" cy="' + (y + 6 * k) + '" rx="' + (3 * k) + '" ry="' + (7 * k) + '" fill="' + trou + '"/>';
  }
  var choeur = '<ellipse cx="50" cy="60" rx="40" ry="34" fill="url(#g)" opacity=".55"/><ellipse cx="46" cy="120" rx="34" ry="42" fill="url(#g)" opacity=".5"/><ellipse cx="56" cy="180" rx="38" ry="34" fill="url(#g)" opacity=".4"/>' +
    visage(32, 46, 1) + visage(66, 82, 1.25) + visage(40, 128, 0.9) + visage(64, 170, 0.8);

  /* 4. La tordue : cou démesuré, tête penchée à l'extrême, bras qui rampent vers le bas */
  var tordue = '<path d="M46 232C38 190 54 152 44 114C38 86 56 70 62 52" fill="none" stroke="url(#g)" stroke-width="22" stroke-linecap="round"/>' +
    '<ellipse cx="64" cy="34" rx="14" ry="21" transform="rotate(34 64 34)" fill="url(#g)"/>' +
    '<path d="M44 114C26 140 14 170 10 206M46 120C66 150 80 180 86 214" fill="none" stroke="#C9F5DB" stroke-opacity=".5" stroke-width="3.4" stroke-linecap="round"/>' +
    '<ellipse cx="58" cy="30" rx="3.4" ry="8" transform="rotate(34 58 30)" fill="' + trou + '"/><ellipse cx="70" cy="34" rx="3.4" ry="8" transform="rotate(34 70 34)" fill="' + trou + '"/>' +
    '<ellipse cx="68" cy="49" rx="4.4" ry="11" transform="rotate(34 68 49)" fill="' + trou + '"/>';

  var formes = [hurleur, capuchon, choeur, tordue];
  for (var i = 0; i < formes.length; i++) {
    for (var m = 0; m < 2; m++) {   /* version normale puis inversée */
      var corps = (m === 0) ? formes[i] : '<g transform="translate(100 0) scale(-1 1)">' + formes[i] + '</g>';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="230" viewBox="0 0 100 230">' + defs + '<g filter="url(#f)">' + corps + '</g></svg>';
      espritsImages.push('data:image/svg+xml,' + encodeURIComponent(svg));
    }
  }
}

var espritsActifs = [];
var espritsObjets = [];
var espritsBoucle = false;
var espritsDernier = 0;

function imageEsprit(index) {
  if (!espritsObjets[index]) {
    var im = new Image();
    im.src = espritsImages[index];
    espritsObjets[index] = im;
  }
  return espritsObjets[index];
}

/* Dessine chaque esprit ligne par ligne : la ligne à la distance f derrière la tête reprend
   la position qu'avait la tête un instant plus tôt (le corps suit le chemin de la tête). */
function dessinerEsprits(temps) {
  if (espritsActifs.length === 0 || document.hidden) { espritsBoucle = false; return; }
  window.requestAnimationFrame(dessinerEsprits);
  if (temps - espritsDernier < 50) { return; }   /* 20 images par seconde */
  espritsDernier = temps;
  for (var k = 0; k < espritsActifs.length; k++) {
    var e = espritsActifs[k];
    if (!e.img.complete || !e.img.naturalWidth) { continue; }
    e.ctx.clearRect(0, 0, 160, 230);
    var phase = (temps / 1000 / e.T) * 6.2832;
    for (var y = 0; y < 230; y += 4) {
      var f = y / 230;                                   /* 0 = tête, 1 = queue */
      var arg = phase - f * e.cycles * 6.2832;
      var dx = e.amp * (0.7 + 0.3 * f) * (Math.sin(arg) + 0.3 * Math.sin(arg * 1.7 + e.dep));
      e.ctx.drawImage(e.img, 0, y, 100, 4, 30 + dx, y, 100, 4);
    }
  }
}

function demarrerBoucleEsprits() {
  if (espritsBoucle) { return; }
  espritsBoucle = true;
  window.requestAnimationFrame(dessinerEsprits);
}

document.addEventListener('visibilitychange', function () {
  if (!document.hidden && espritsActifs.length > 0) { demarrerBoucleEsprits(); }
});

function lancerEsprit() {
  if (!zoneEsprits) {
    zoneEsprits = document.createElement('div');
    zoneEsprits.className = 'esprits-zone';
    document.body.appendChild(zoneEsprits);
  }
  construireImagesEsprits();

  var W = window.innerWidth, H = window.innerHeight;
  var larg = alea(100, 190);
  var haut = larg * 2.3;
  var dur = alea(16, 28);
  var op = alea(0.14, 0.28);
  var gauche = alea(0.05, 0.8) * W - larg * 0.3;
  var index = Math.floor(Math.random() * espritsImages.length);

  var ext = document.createElement('div');
  ext.className = 'esp';
  ext.style.cssText = 'left:' + gauche.toFixed(0) + 'px;width:' + (larg * 1.6).toFixed(0) + 'px;height:' + haut.toFixed(0) + 'px;' +
    'animation-duration:' + dur.toFixed(1) + 's;--fin:-' + (H + haut * 1.3).toFixed(0) + 'px;' +
    '--op:' + op.toFixed(2) + ';--op2:' + Math.min(0.55, op * 2.2).toFixed(2) + ';';

  var cv = document.createElement('canvas');
  cv.width = 160; cv.height = 230;
  cv.className = 'esp-corps';
  cv.style.cssText = 'width:100%;height:100%;display:block;animation-duration:' + dur.toFixed(1) + 's;';
  ext.appendChild(cv);
  zoneEsprits.appendChild(ext);

  var objet = {
    ctx: cv.getContext('2d'),
    img: imageEsprit(index),
    T: alea(3.2, 5.5),          /* durée d'un cycle du serpentement (s) */
    cycles: alea(1.1, 1.8),     /* nombre d'ondulations sur la longueur du corps */
    amp: alea(12, 22),          /* amplitude des ondulations */
    dep: alea(0, 6.28)
  };
  espritsActifs.push(objet);
  demarrerBoucleEsprits();

  espritsEnCours++;
  window.setTimeout(function () {
    if (ext.parentNode) { ext.parentNode.removeChild(ext); }
    var p = espritsActifs.indexOf(objet);
    if (p !== -1) { espritsActifs.splice(p, 1); }
    espritsEnCours--;
  }, dur * 1000 + 400);
}

function declencherEsprit() {
  minuteurEsprits = null;
  if ((etat.profil.theme || 'sombre') !== 'effroi' || !ESPRITS_ACTIFS) { return; }
  if (!document.hidden && espritsEnCours < ESPRITS_MAX) { lancerEsprit(); }
  planifierEsprit();
}

function planifierEsprit() {
  if (minuteurEsprits) { window.clearTimeout(minuteurEsprits); }
  minuteurEsprits = window.setTimeout(declencherEsprit, alea(ESPRITS_DELAI[0], ESPRITS_DELAI[1]) * 1000);
}

function majEsprits(theme) {
  if (minuteurEsprits) { window.clearTimeout(minuteurEsprits); minuteurEsprits = null; }
  if (zoneEsprits) { zoneEsprits.innerHTML = ''; espritsEnCours = 0; }
  if (theme === 'effroi' && ESPRITS_ACTIFS) { planifierEsprit(); }
}

/* ============================================================
   STEAMPUNK : machine en bois verni, laiton, verrières, tuyaux et vapeur
   Les décors sont dessinés UNE fois ici. Ensuite seuls des transform / opacity bougent.
   ============================================================ */
var decorSteampunkPret = false;

function uriSp(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }

/* Cadre de laiton à coins ornés (image 3 × 3 pour border-image). c = taille d'un coin en px */
function svgCadreLaiton(c) {
  function rail(x, y, w, h, l, d) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#B7832F"/>' +
      '<rect x="' + l[0] + '" y="' + l[1] + '" width="' + l[2] + '" height="' + l[3] + '" fill="#F3D58E"/>' +
      '<rect x="' + d[0] + '" y="' + d[1] + '" width="' + d[2] + '" height="' + d[3] + '" fill="#2B1807" fill-opacity=".55"/>';
  }
  var s = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + (3 * c) + '" height="' + (3 * c) + '" viewBox="0 0 108 108">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D58E"/><stop offset=".5" stop-color="#C9953A"/><stop offset="1" stop-color="#7A5518"/></linearGradient>' +
    '<g id="k">' +
      '<path d="M0,0 H36 V3.4 Q13,11 3.4,36 H0Z" fill="url(#g)" stroke="#2B1807" stroke-width=".7" stroke-linejoin="round"/>' +
      '<path d="M8,8.5 Q17,7 21,12.5 Q24,18.5 18.5,20.5" fill="none" stroke="#FFEFC0" stroke-opacity=".85" stroke-width="1.2" stroke-linecap="round"/>' +
      '<circle cx="6" cy="6" r="2.5" fill="#E8C06A" stroke="#2B1807" stroke-width=".7"/><circle cx="6" cy="6" r=".8" fill="#2B1807"/>' +
    '</g></defs>';
  s += rail(36, 0, 36, 3.4, [36, 0, 36, 1.1], [36, 3.4, 36, 1]);
  s += rail(36, 104.6, 36, 3.4, [36, 106.9, 36, 1.1], [36, 103.6, 36, 1]);
  s += rail(0, 36, 3.4, 36, [0, 36, 1.1, 36], [3.4, 36, 1, 36]);
  s += rail(104.6, 36, 3.4, 36, [106.9, 36, 1.1, 36], [103.6, 36, 1, 36]);
  s += '<use xlink:href="#k"/><use xlink:href="#k" transform="translate(108 0) scale(-1 1)"/>' +
       '<use xlink:href="#k" transform="translate(0 108) scale(1 -1)"/><use xlink:href="#k" transform="translate(108 108) scale(-1 -1)"/>';
  return s + '</svg>';
}

/* Acajou verni : veinage horizontal, sombre et peu contrasté (le texte reste lisible) */
function svgBoisVerni() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">' +
    '<filter id="a" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".006 .2" numOctaves="3" seed="8" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .09 0 0 0 0 .04 0 0 0 0 .012 1.5 0 0 0 -.5"/></filter>' +
    '<filter id="b" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".005 .16" numOctaves="2" seed="21" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .78 0 0 0 0 .5 0 0 0 0 .26 0 1.4 0 0 -.72"/></filter>' +
    '<rect width="240" height="240" fill="#4A2814"/>' +
    '<rect width="240" height="240" filter="url(#a)" opacity=".75"/>' +
    '<rect width="240" height="240" filter="url(#b)" opacity=".3"/></svg>';
}

/* Papier peint victorien : deux vignes sinueuses avec feuilles et vrilles (se répète sans raccord) */
function svgLiane() {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" fill="none" stroke-linecap="round">';
  var vignes = [{ x: 60, ph: 0 }, { x: 180, ph: Math.PI }];
  for (var v = 0; v < vignes.length; v++) {
    var V = vignes[v], pts = [], d = '', k;
    for (k = 0; k <= 24; k++) {
      var px = V.x + 18 * Math.sin(k / 24 * 6.2832 + V.ph);
      pts.push([px, k * 10]);
      d += (k === 0 ? 'M' : 'L') + px.toFixed(1) + ',' + (k * 10);
    }
    s += '<path d="' + d + '" stroke="#C9953A" stroke-opacity=".17" stroke-width="1.8" stroke-linejoin="round"/>';
    for (var f = 0; f < 6; f++) {
      var p = pts[2 + f * 4], cote = (f % 2 === 0) ? 1 : -1;
      s += '<path transform="translate(' + p[0].toFixed(1) + ' ' + p[1] + ') rotate(' + (cote === 1 ? -25 : 205) + ')" d="M0,0 Q9,-6 19,0 Q9,6 0,0Z" fill="#C9953A" fill-opacity=".13"/>';
      if (f % 3 === 1) {
        s += '<path d="M' + p[0].toFixed(1) + ',' + p[1] + ' q' + (cote * 11) + ',-3 ' + (cote * 13) + ',7 q' + (-cote) + ',8 ' + (-cote * 7) + ',7" stroke="#C9953A" stroke-opacity=".17" stroke-width="1.3"/>';
      }
    }
  }
  return s + '</svg>';
}

/* Tuyau de laiton vertical, avec deux brides rivetées par motif */
function svgTuyau() {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="240" viewBox="0 0 12 240">' +
    '<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A1706"/><stop offset=".22" stop-color="#B7832F"/><stop offset=".38" stop-color="#F3D58E"/><stop offset=".62" stop-color="#C9953A"/><stop offset="1" stop-color="#3A2208"/></linearGradient></defs>' +
    '<rect x="1.5" y="0" width="9" height="240" fill="url(#t)"/>';
  var ys = [60, 180];
  for (var i = 0; i < ys.length; i++) {
    s += '<rect x="0" y="' + ys[i] + '" width="12" height="10" rx="1.5" fill="url(#t)" stroke="#2B1807" stroke-width=".8"/>' +
      '<rect x="0" y="' + (ys[i] + 10) + '" width="12" height="3" fill="#000" fill-opacity=".35"/>' +
      '<circle cx="3" cy="' + (ys[i] + 5) + '" r="1" fill="#2B1807"/><circle cx="9" cy="' + (ys[i] + 5) + '" r="1" fill="#2B1807"/>';
  }
  return s + '</svg>';
}

/* Fleuron sous les titres : arabesques, feuille et petite gemme verte */
function svgFleuron() {
  var moitie = '<path d="M6,5 H54 Q61,5 64,2.2 Q67,-.3 70,2.4 Q72,5.4 68.5,6.6" fill="none" stroke="#C9953A" stroke-width="1" stroke-linecap="round"/>' +
    '<path d="M30,5 Q34,1 40,2.6 Q36,6 30,5Z" fill="#C9953A" fill-opacity=".75"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="10" viewBox="0 0 160 10">' + moitie +
    '<g transform="translate(160 0) scale(-1 1)">' + moitie + '</g>' +
    '<path d="M80,.8 L84.5,5 L80,9.2 L75.5,5Z" fill="#E8C06A" stroke="#2B1807" stroke-width=".6"/><circle cx="80" cy="5" r="1.3" fill="#4DE39A"/></svg>';
}

function construireDecorSteampunk() {
  if (decorSteampunkPret) { return; }
  decorSteampunkPret = true;
  var r = document.documentElement.style;
  r.setProperty('--sp-cadre', uriSp(svgCadreLaiton(28)));
  r.setProperty('--sp-cadre-s', uriSp(svgCadreLaiton(20)));
  r.setProperty('--sp-bois', uriSp(svgBoisVerni()));
  r.setProperty('--sp-liane', uriSp(svgLiane()));
  r.setProperty('--sp-tuyau', uriSp(svgTuyau()));
  r.setProperty('--sp-fleuron', uriSp(svgFleuron()));
  var mini = svgRouage(12, 4.2, 0, '#5A421E', 'rgba(232,192,106,.4)').svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  r.setProperty('--sp-rouage-mini', uriSp(mini));
}

/* Tuyaux fixes dans les gouttières, avec deux soupapes qui lâchent de la vapeur */
function majSteampunk(theme) {
  var tuyaux = document.getElementById('sp-tuyaux');
  var valves = document.getElementById('sp-valves');
  if (theme !== 'steampunk') {
    if (tuyaux) { tuyaux.innerHTML = ''; }
    if (valves) { valves.innerHTML = ''; }
    return;
  }
  construireDecorSteampunk();
  if (!tuyaux) { tuyaux = document.createElement('div'); tuyaux.id = 'sp-tuyaux'; tuyaux.className = 'sp-tuyaux'; document.body.appendChild(tuyaux); }
  if (!valves) { valves = document.createElement('div'); valves.id = 'sp-valves'; valves.className = 'sp-valves'; document.body.appendChild(valves); }
  var H = window.innerHeight;
  function valve(cote, y, delai) {
    return '<span class="sp-soupape sp-soupape-' + cote + '" style="top:' + Math.round(y) + 'px;">' +
      '<i class="sp-puff" style="animation-delay:-' + delai + 's;"></i><i class="sp-puff" style="animation-delay:-' + (delai + 3.5) + 's;"></i></span>';
  }
  tuyaux.innerHTML = '<span class="sp-tuyau sp-tuyau-g"></span><span class="sp-tuyau sp-tuyau-d"></span>';
  valves.innerHTML = valve('g', H * 0.30, 0) + valve('d', H * 0.66, 2);
}

/* Séance prévue : verrière avec un orbe-générateur vert, deux anneaux à graduations et de la vapeur */
/* Orbe et anneaux : rangés DANS le conteneur de l'icône, donc toujours centrés dessus */
function htmlOrbeSteampunk() {
  var ext = '<svg viewBox="0 0 112 112"><circle cx="56" cy="56" r="54" fill="none" stroke="#C9953A" stroke-opacity=".7" stroke-width="1.2"/>';
  for (var t = 0; t < 24; t++) {
    var a = t * 15 * Math.PI / 180;
    ext += '<line x1="' + (56 + Math.cos(a) * 48.5).toFixed(1) + '" y1="' + (56 + Math.sin(a) * 48.5).toFixed(1) + '" x2="' + (56 + Math.cos(a) * 53.5).toFixed(1) + '" y2="' + (56 + Math.sin(a) * 53.5).toFixed(1) + '" stroke="#F0CE80" stroke-opacity=".75" stroke-width="' + (t % 6 === 0 ? 2 : 1) + '"/>';
  }
  ext += '</svg>';
  var inte = '<svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="40" fill="none" stroke="#4DE39A" stroke-opacity=".7" stroke-width="1.8" stroke-dasharray="12 7"/></svg>';
  return '<span class="sp-orbe"></span><span class="sp-anneau">' + ext + '</span><span class="sp-anneau-b">' + inte + '</span>';
}

/* Vapeur et étincelles : positions en pourcentage de la carte */
function genererSceneSteampunk() {
  var h = '<div class="particules">', i, dur;
  for (i = 0; i < 3; i++) {
    dur = alea(6, 10);
    h += '<span class="sp-vapeur" style="left:' + alea(8, 92).toFixed(0) + '%;top:' + alea(65, 100).toFixed(0) + '%;animation-duration:' + dur.toFixed(1) + 's;animation-delay:-' + (Math.random() * dur).toFixed(1) + 's;"></span>';
  }
  for (i = 0; i < 5; i++) {
    dur = alea(2.5, 5);
    h += '<span class="sp-etincelle" style="left:' + alea(2, 40).toFixed(0) + '%;top:' + alea(20, 75).toFixed(0) + '%;animation-duration:' + dur.toFixed(1) + 's;animation-delay:-' + (Math.random() * dur).toFixed(1) + 's;"></span>';
  }
  return h + '</div>';
}

/* Manomètre de séance : l'aiguille suit le nombre de séries validées (ressort à l'arrivée) */
function svgJaugeSeance() {
  function pt(r, deg) { var a = deg * Math.PI / 180; return [28 + r * Math.sin(a), 28 - r * Math.cos(a)]; }
  var s = '<svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="28" cy="28" r="26" fill="#B7832F" stroke="#2B1807" stroke-width="1"/>' +
    '<path d="M6,18 A24,24 0 0 1 20,5" fill="none" stroke="#FFEFC0" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>' +
    '<circle cx="28" cy="28" r="22.5" fill="#06100B" stroke="#2B1807" stroke-width="1"/>';
  var v0 = pt(18, 27), v1 = pt(18, 135);
  s += '<path d="M' + v0[0].toFixed(1) + ',' + v0[1].toFixed(1) + ' A18,18 0 0 1 ' + v1[0].toFixed(1) + ',' + v1[1].toFixed(1) + '" fill="none" stroke="#4DE39A" stroke-width="2.6" stroke-opacity=".9"/>';
  for (var t = 0; t <= 10; t++) {
    var deg = -135 + t * 27, p = pt(21, deg), q = pt(t % 5 === 0 ? 15.5 : 17.5, deg);
    s += '<line x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" stroke="#F0CE80" stroke-width="' + (t % 5 === 0 ? 1.5 : .8) + '"/>';
  }
  for (var k = 0; k < 4; k++) {
    var v = pt(24.25, 45 + k * 90);
    s += '<circle cx="' + v[0].toFixed(1) + '" cy="' + v[1].toFixed(1) + '" r="1.1" fill="#E8C06A" stroke="#2B1807" stroke-width=".5"/>';
  }
  return s + '</svg>';
}

function majManometreSteampunk(faites, total) {
  if (etat.profil.theme !== 'steampunk') { return; }
  var haut = document.querySelector('.sx-entete-haut');
  if (!haut) { return; }
  var m = document.getElementById('sp-manometre');
  var neuf = !m;
  if (neuf) {
    m = document.createElement('span');
    m.id = 'sp-manometre';
    m.className = 'sp-jauge';
    m.innerHTML = svgJaugeSeance() + '<i class="sp-jauge-aig"></i><b class="sp-jauge-hub"></b>';
    haut.insertBefore(m, haut.lastElementChild);   /* juste avant le bouton Fin */
  }
  var a = m.querySelector('.sp-jauge-aig');
  if (neuf) { void a.offsetWidth; }
  var ang = -135 + (total > 0 ? faites / total : 0) * 270;
  a.style.webkitTransform = 'rotate(' + ang.toFixed(1) + 'deg)';
  a.style.transform = 'rotate(' + ang.toFixed(1) + 'deg)';
}

/* Coup de sifflet : les deux soupapes crachent un gros jet de vapeur */
function sifflerVapeur() {
  var v = document.getElementById('sp-valves');
  if (!v || etat.profil.theme !== 'steampunk') { return; }
  v.classList.remove('sp-sifflet');
  void v.offsetWidth;
  v.classList.add('sp-sifflet');
  window.setTimeout(function () { v.classList.remove('sp-sifflet'); }, 1400);
}

function appliquerTheme() {
  var theme = etat.profil.theme || 'sombre';
  var themeEffectif = theme;
  if (theme === 'auto') {
    var prefereClair = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    themeEffectif = prefereClair ? 'clair' : 'sombre';
  }
  document.documentElement.setAttribute('data-theme', themeEffectif);
  majIconeNutrition(themeEffectif);
  majIconeAccueil(themeEffectif);
  majAmbiance(themeEffectif);
  majRouages(themeEffectif);
  majHiver(themeEffectif);
  majSteampunk(themeEffectif);
  majEclair(themeEffectif);
  majEsprits(themeEffectif);
  majNitro(themeEffectif);
  if (typeof window.publierEtatVersIPad === 'function') {
    window.publierEtatVersIPad();
  }
  if (pageCourante === 'accueil') { rendreCarteSeanceJour(); }
}

/* ============================================================
   PARALLAXE DU FOND
   ============================================================ */
var INDEX_PAGES_FOND = { accueil: 0, seance: 1, nutrition: 2, bibliotheque: 3, historique: 4 };
var DECALAGE_PAGE_PX = 24;       /* décalage horizontal par onglet */
var VITESSE_SCROLL_FOND = 0.5;  /* 0 = fond immobile, 1 = suit le contenu */
var PERIODE_MOTIF_PX = 240;      /* ne pas changer */
var fondExt = null;
var fondMotif = null;
var fondScrollEnAttente = false;

function appliquerTransformFond(element, x, y) {
  var valeur = 'translate3d(' + x + 'px,' + y + 'px,0)';
  element.style.webkitTransform = valeur;
  element.style.transform = valeur;
}

function majFondScroll() {
  if (!fondMotif) { return; }
  var y = -((window.pageYOffset * VITESSE_SCROLL_FOND) % PERIODE_MOTIF_PX);
  majRouagesParallaxe();
  majHiverParallaxe();
  appliquerTransformFond(fondMotif, 0, y);
}

/* Appelé à chaque changement d'onglet */
function majFondParallaxe(nomPage) {
  if (!fondExt || INDEX_PAGES_FOND[nomPage] === undefined) { return; }
  indexPageRouages = INDEX_PAGES_FOND[nomPage];
  appliquerTransformFond(fondExt, -INDEX_PAGES_FOND[nomPage] * DECALAGE_PAGE_PX, 0);
  majFondScroll();
}

function creerFondParallaxe() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    VITESSE_SCROLL_FOND = 0;
  }
  fondExt = document.createElement('div');
  fondExt.className = 'fond-theme';
  fondMotif = document.createElement('div');
  fondMotif.className = 'fond-motif';
  fondExt.appendChild(fondMotif);
  document.body.insertBefore(fondExt, document.body.firstChild);
  window.addEventListener('scroll', function () {
    if (fondScrollEnAttente) { return; }
    fondScrollEnAttente = true;
    window.requestAnimationFrame(function () {
      fondScrollEnAttente = false;
      majFondScroll();
    });
  }, false);
}


