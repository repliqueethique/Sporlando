/* ============================================================
   BLOC SEANCE ETIREMENT — LOGIQUE
   ============================================================ */

var SEANCE_ETIREMENT_MATIN = {
  id: 'reveil-articulaire-matin',
  titre: 'Réveil Articulaire & Mobilité Dynamique',
  dureeEstimeeMin: 7,
  etapes: [
    {
      id: 'cervical-epaules',
      titre: 'Déverrouillage Cervical & Épaules',
      dureeSec: 90,
      position: 'Debout',
      consignes: [
        'Rotations de nuque : 5 demi-cercles lents d\'une épaule à l\'autre (passer par le bas, ne pas projeter la tête en arrière)',
        'Grands cercles d\'épaules : 10 cercles vers l\'arrière, puis 10 vers l\'avant',
        'Rotations des poignets : 15 secondes dans chaque sens'
      ]
    },
    {
      id: 'chat-chameau',
      titre: 'Le Chat-Chameau / Cat-Cow',
      dureeSec: 90,
      position: 'Au sol à 4 pattes',
      consignes: [
        'Mains sous les épaules, genoux sous les hanches',
        'Inspiration : laisse le ventre descendre doucement, regarde vers l\'avant',
        'Expiration : arrondis le dos vers le plafond, rentre le nombril, relâche la tête',
        '10 à 12 aller-retours très lents'
      ]
    },
    {
      id: 'torsions-thoraciques',
      titre: 'Torsions Thoraciques en Quadrupédie',
      dureeSec: 90,
      position: 'Au sol',
      consignes: [
        'À quatre pattes, main droite derrière la tête',
        'Amène le coude droit vers le poignet gauche, puis pivote le buste vers la droite, coude vers le plafond, bassin fixe',
        '8 répétitions à droite, puis 8 à gauche'
      ]
    },
    {
      id: 'psoas-dynamique',
      titre: 'Déverrouillage des Hanches / Psoas Dynamique',
      dureeSec: 90,
      position: 'Au sol',
      consignes: [
        'Position de fente, un genou au sol sur un tapis moelleux',
        'Serre le fessier arrière pour basculer le bassin en rétroversion',
        'Avance doucement le bassin de 3 à 5 cm jusqu\'à légère tension sur l\'avant de cuisse/hanche, tiens 2 secondes',
        '6 à 8 petites impulsions douces par côté, jamais d\'étirement fixe prolongé'
      ]
    },
    {
      id: 'squat-lent',
      titre: 'Squat à Vide Très Lent',
      dureeSec: 60,
      position: 'Debout',
      consignes: [
        'Pieds largeur d\'épaules, talons bien à plat',
        'Descends en 3 secondes, pause 1 seconde en bas, remonte',
        '5 répétitions uniquement'
      ]
    }
  ]
};

var etatSeanceEtirement = {
  enCours: false,
  indexEtape: 0,
  chronoRestantSec: 0,
  dureeTotaleSec: 0,
  minuteurId: null,
  enPause: false,
  timestampFin: null
};

function ouvrirSeanceEtirement() {
  etatSeanceEtirement.enCours = true;
  etatSeanceEtirement.indexEtape = 0;
  allerVersPage('etirement');
  demarrerEtapeEtirement();
}

function demarrerEtapeEtirement() {
  var etape = SEANCE_ETIREMENT_MATIN.etapes[etatSeanceEtirement.indexEtape];
  etatSeanceEtirement.chronoRestantSec = etape.dureeSec;
  etatSeanceEtirement.dureeTotaleSec = etape.dureeSec;
  etatSeanceEtirement.enPause = false;
  rendreEtapeEtirement();
  lancerMinuteurEtirement();
}

function lancerMinuteurEtirement() {
  if (etatSeanceEtirement.minuteurId) { clearInterval(etatSeanceEtirement.minuteurId); }

  etatSeanceEtirement.timestampFin = Date.now() + (etatSeanceEtirement.chronoRestantSec * 1000);

  etatSeanceEtirement.minuteurId = setInterval(function () {
    var msRestantes = etatSeanceEtirement.timestampFin - Date.now();
    etatSeanceEtirement.chronoRestantSec = Math.max(0, Math.round(msRestantes / 1000));
    rendreChronoEtirement();

    if (msRestantes <= 0) {
      passerEtapeEtirementSuivante();
    }
  }, 250);
}

function togglePauseChronoEtirement() {
  if (etatSeanceEtirement.enPause) {
    // reprise
    etatSeanceEtirement.enPause = false;
    lancerMinuteurEtirement();
  } else {
    // pause
    etatSeanceEtirement.enPause = true;
    clearInterval(etatSeanceEtirement.minuteurId);
    etatSeanceEtirement.minuteurId = null;
  }
  rendreChronoEtirement();
}

function passerEtapeEtirementSuivante() {
  clearInterval(etatSeanceEtirement.minuteurId);
  etatSeanceEtirement.minuteurId = null;
  etatSeanceEtirement.enPause = false;
  etatSeanceEtirement.indexEtape++;

  if (etatSeanceEtirement.indexEtape >= SEANCE_ETIREMENT_MATIN.etapes.length) {
    terminerSeanceEtirement();
    return;
  }
  demarrerEtapeEtirement();
}

function terminerSeanceEtirement() {
  etatSeanceEtirement.enCours = false;

  var dateReference = obtenirDateJourReference();
  var checklist = checklistDuJour(dateReference);
  checklist.etirements = true;
  sauvegarderEtat();

  afficherToast(messageTheme('etirementsTermines', 'Séance d\'étirements terminée !'));
  allerVersPage('accueil');
  rendreChecklistQuotidienne();

  if (checklistEstComplete(dateReference)) {
    fermerCarteChecklistAvecAnimation();
  }
}

function rendreEtapeEtirement() {
  var conteneur = document.getElementById('page-etirement');
  if (!conteneur) { return; }
  var etape = SEANCE_ETIREMENT_MATIN.etapes[etatSeanceEtirement.indexEtape];
  var numero = etatSeanceEtirement.indexEtape + 1;
  var total = SEANCE_ETIREMENT_MATIN.etapes.length;

  var html = '';
  html += '<div class="etirement-conteneur">';
  html += '<div class="etirement-entete"><span class="etirement-progression">Étape ' + numero + ' / ' + total + '</span></div>';
  html += '<h2 class="etirement-titre-etape">' + etape.titre + '</h2>';
  html += '<p class="etirement-position">' + etape.position + '</p>';

  html += '<div class="etirement-chrono-zone">';
  html += '<span id="etirement-chrono" class="etirement-chrono" data-action="etirement-toggle-pause">' + etape.dureeSec + '</span>';
  html += '</div>';

  html += '<div class="etirement-barre-progression"><div id="etirement-barre-remplissage" class="etirement-barre-remplissage" style="width:100%;"></div></div>';

  html += '<details class="etirement-explications">';
  html += '<summary>Explications</summary>';
  html += '<div class="etirement-explications-contenu"><ul>';
  for (var i = 0; i < etape.consignes.length; i++) {
    html += '<li>' + etape.consignes[i] + '</li>';
  }
  html += '</ul></div>';
  html += '</details>';

  html += '</div>'; // fin .etirement-conteneur

  html += '<div class="etirement-actions">';
  html += '<button class="etirement-bouton-quitter" data-action="etirement-quitter">Quitter</button>';
  html += '<button class="etirement-bouton-passer" data-action="etirement-passer">Passer l\'étape</button>';
  html += '</div>';

  conteneur.innerHTML = html;
}

function rendreChronoEtirement() {
  var chrono = document.getElementById('etirement-chrono');
  if (chrono) {
    chrono.textContent = etatSeanceEtirement.chronoRestantSec;
    chrono.classList.toggle('etirement-chrono-pause', etatSeanceEtirement.enPause);
  }

  var barre = document.getElementById('etirement-barre-remplissage');
  if (barre) {
    var pourcentage = (etatSeanceEtirement.chronoRestantSec / etatSeanceEtirement.dureeTotaleSec) * 100;
    barre.style.width = pourcentage + '%';
    barre.classList.toggle('pause-active', etatSeanceEtirement.enPause);
  }
}

function quitterSeanceEtirement() {
  clearInterval(etatSeanceEtirement.minuteurId);
  etatSeanceEtirement.minuteurId = null;
  etatSeanceEtirement.enCours = false;
  etatSeanceEtirement.enPause = false;
  allerVersPage('accueil');
}

/* ============================================================
   BLOC : ECHAUFFEMENT
   ============================================================ */

var DONNEES_ECHAUFFEMENT = {
  hautDuCorps: {
    titre: 'Haut du corps',
    icone: '💪',
    exercices: [
      { nom: 'Jumping Jacks', duree: '45 s' },
      { nom: 'Shadow Boxing', duree: '45 s' },
      { nom: 'Tirage élastique', duree: '30 s' },
      { nom: 'Rotations d\'épaules', duree: '30 s' }
    ]
  },
  basDuCorps: {
    titre: 'Bas du corps',
    icone: '🦵',
    exercices: [
      { nom: 'Jumping Jacks', duree: '45 s' },
      { nom: 'Air Squats', duree: '45 s' },
      { nom: 'Fentes marchées', duree: '45 s' },
      { nom: 'Talons-fesses', duree: '30 s' }
    ]
  }
};

var callbackApresEchauffement = null;

/* Étape 1 : choix du type (volontairement sans détail des exercices) */
function demanderEchauffement(callbackSuite) {
  callbackApresEchauffement = callbackSuite;

  var html = '';
  html += '<div class="echauf-entete">';
  html += '<div><h2 class="echauf-titre">Échauffement</h2>';
  html += '<p class="echauf-sous-titre">3 à 4 min pour monter en température</p></div>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button>';
  html += '</div>';

  html += '<div class="echauf-choix">';
  ['hautDuCorps', 'basDuCorps'].forEach(function (type) {
    var d = DONNEES_ECHAUFFEMENT[type];
    html += '<button class="echauf-carte" data-action="choisir-echauffement" data-type="' + type + '">';
    html += '<span class="echauf-carte-icone">' + d.icone + '</span>';
    html += '<span class="echauf-carte-titre">' + echapperHtml(d.titre) + '</span>';
    html += '</button>';
  });
  html += '</div>';

  html += '<button class="echauf-passer" data-action="passer-echauffement">Passer l\'échauffement</button>';
  ouvrirModal(html);
}

/* Étape 2 : liste à cocher, tap sur une ligne pour valider */
function choisirEchauffement(type) {
  var data = DONNEES_ECHAUFFEMENT[type];
  if (!data) { return; }

  var html = '';
  html += '<div class="echauf-entete">';
  html += '<button class="echauf-retour" data-action="echauffement-retour">&#8249;</button>';
  html += '<h2 class="echauf-titre echauf-titre-centre">' + echapperHtml(data.titre) + '</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button>';
  html += '</div>';

  html += '<div class="echauf-compteur donnee-num"><span class="echauf-flamme" id="echauf-flamme">&#128293;</span> <span id="echauf-compteur">0 / ' + data.exercices.length + '</span></div>';
  html += '<div class="echauf-progression"><div class="echauf-barre" id="echauf-barre"></div></div>';

  html += '<ul class="echauf-liste">';
  data.exercices.forEach(function (ex) {
    html += '<li class="echauf-ligne">';
    html += '<span class="echauf-check">&#10003;</span>';
    html += '<span class="echauf-nom">' + echapperHtml(ex.nom) + '</span>';
    html += '<span class="echauf-duree donnee-num">' + echapperHtml(ex.duree) + '</span>';
    html += '</li>';
  });
  html += '</ul>';

  html += '<button class="btn btn-plein btn-bloc" data-action="terminer-echauffement">Démarrer la séance</button>';
  ouvrirModal(html);
  var lignes = document.querySelectorAll('.echauf-ligne');
  for (var i = 0; i < lignes.length; i++) {
    lignes[i].addEventListener('click', function () {
      basculerEtapeEchauffement(this);
    });
  }
}

function basculerEtapeEchauffement(ligne) {
  ligne.classList.toggle('echauf-ligne-faite');
  var total = document.querySelectorAll('.echauf-ligne').length;
  var faites = document.querySelectorAll('.echauf-ligne-faite').length;
  var compteur = document.getElementById('echauf-compteur');
  var barre = document.getElementById('echauf-barre');
  if (compteur) { compteur.innerHTML = faites + ' / ' + total; }
  if (barre) { barre.style.width = (total > 0 ? Math.round(faites / total * 100) : 0) + '%'; }
  var flamme = document.getElementById('echauf-flamme');
  if (flamme) {
    var pct = total > 0 ? (faites / total) : 0;
    var filtre = 'grayscale(' + Math.round((1 - pct) * 100) + '%) opacity(' + (0.35 + 0.65 * pct).toFixed(2) + ')';
    flamme.style.webkitFilter = filtre;
    flamme.style.filter = filtre;
    flamme.style.webkitTransform = 'scale(' + (1 + 0.3 * pct).toFixed(2) + ')';
    flamme.style.transform = 'scale(' + (1 + 0.3 * pct).toFixed(2) + ')';
  }
}

function passerEchauffement() {
  fermerModal();
  var cb = callbackApresEchauffement;
  callbackApresEchauffement = null;
  if (cb) { cb(); }
}

function terminerEchauffement() {
  fermerModal();
  var cb = callbackApresEchauffement;
  callbackApresEchauffement = null;
  if (cb) { cb(); }
}


