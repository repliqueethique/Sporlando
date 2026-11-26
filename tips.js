/* ============================================================
   MODULE TIPS QUOTIDIENS SOURCÉS (VÉGANE, SCIENTIFIQUE)
   ============================================================ */

var TIPS_QUOTIDIENS = [
  {
    id: 'tip-01',
    numero: 1,
    domaine: 'Sommeil & Récupération',
    titre: 'Régularité du sommeil et synthèse protéique',
    texte: 'La privation de sommeil aiguë réduit la synthèse protéique musculaire et oriente vers un profil plus catabolique. Maintenir des horaires réguliers de coucher et de réveil favorise la stabilité de l’architecture du sommeil et la récupération globale.',
    sourceLabel: 'Lamon et al., 2021 — Physiological Reports (DOI)',
    sourceUrl: 'https://doi.org/10.14814/phy2.14660'
  },
  {
    id: 'tip-02',
    numero: 2,
    domaine: 'Hypertrophie',
    titre: 'Proximité de l’échec plutôt qu’une plage de charge rigide',
    texte: 'Des charges variées (du léger au lourd, menées près de l’échec volitionnel, environ 0 à 3 répétitions en réserve) peuvent stimuler une hypertrophie musculaire comparable, à condition que l’effort soit réel et l’adaptation articulaire/technique respectée.',
    sourceLabel: 'Morton et al., 2016 — Journal of Applied Physiology (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/27330038/'
  },
  {
    id: 'tip-03',
    numero: 3,
    domaine: 'Efficacité & Force',
    titre: 'Temps de repos suffisants entre séries',
    texte: 'Accorder environ 2 à 3 minutes de repos sur les mouvements sollicitant de grands groupes musculaires permet une meilleure resynthèse de la phosphocréatine et maintient davantage le volume de travail efficace qu’un repos très court.',
    sourceLabel: 'Schoenfeld et al., 2016 — Sports Medicine (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/26605807/'
  },
  {
    id: 'tip-04',
    numero: 4,
    domaine: 'Nutrition végétale',
    titre: 'Protéines végétales et seuil de leucine',
    texte: 'Les sources végétales (soja, tofu, tempeh, légumineuses, céréales, graines) couvrent très bien les besoins en acides aminés lorsqu’elles sont suffisamment abondantes et variées. Veiller à un apport suffisant en leucine par prise aide à déclencher efficacement la synthèse protéique.',
    sourceLabel: 'Gorissen et al., 2018 — Amino Acids (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/29799016/'
  },
  {
    id: 'tip-05',
    numero: 5,
    domaine: 'Prise de masse',
    titre: 'Le total protéique journalier comme repère principal',
    texte: 'Pour le maintien ou le gain de masse maigre chez les personnes pratiquant la musculation, l’apport protéique quotidien total (souvent visé autour de 1,6 à 2,2 g/kg/jour selon le contexte) et sa répartition régulière priment sur le timing étroit.',
    sourceLabel: 'Morton et al., 2018 — British Journal of Sports Medicine (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/28698222/'
  },
  {
    id: 'tip-06',
    numero: 6,
    domaine: 'Supplémentation',
    titre: 'Créatine monohydrate : intérêt marqué en alimentation végétale',
    texte: 'La créatine monohydrate (d’origine non animale) augmente les réserves musculaires de phosphocréatine et soutient la performance sur les efforts intenses répétés. Les personnes véganes partent souvent avec des stocks initiaux plus bas, rendant la supplémentation particulièrement pertinente.',
    sourceLabel: 'Kreider et al., 2017 — JISSN (BioMed Central)',
    sourceUrl: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z'
  },
  {
    id: 'tip-07',
    numero: 7,
    domaine: 'Énergie & Nutrition',
    titre: 'Glycogène et capacité à soutenir l’effort',
    texte: 'Les glucides issus d’aliments végétaux (céréales complètes, avoine, légumineuses, fruits, tubercules) alimentent les réserves de glycogène musculaire et hépatique, essentielles pour maintenir l’intensité et la qualité du mouvement.',
    sourceLabel: 'Burke et al., 2011 — Journal of Sports Sciences (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/21475137/'
  },
  {
    id: 'tip-08',
    numero: 8,
    domaine: 'Prévention blessures',
    titre: 'Progression graduelle et adaptation des tendons',
    texte: 'Les tendons s’adaptent plus lentement que les muscles aux hausses de charge ou de volume. Augmenter progressivement les contraintes mécaniques réduit le risque de surcharge tendineuse.',
    sourceLabel: 'Bohm et al., 2015 — Sports Medicine (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/25182256/'
  },
  {
    id: 'tip-09',
    numero: 9,
    domaine: 'Préparation séance',
    titre: 'Échauffement progressif et conduction neuromusculaire',
    texte: 'Un échauffement gradué augmente la température tissulaire, la vélocité de conduction nerveuse et la cinétique de l’oxygène, préparant les articulations et la coordination sans épuiser la séance.',
    sourceLabel: 'Bishop, 2003 — Sports Medicine (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/12744600/'
  },
  {
    id: 'tip-10',
    numero: 10,
    domaine: 'Mobilité & Force',
    titre: 'Étirements statiques longs juste avant l’effort maximal',
    texte: 'De longs étirements statiques immédiatement avant une tâche de force maximale ou de puissance peuvent réduire temporairement la performance ; préférer la mobilité active en préparation et garder les étirements statiques à d’autres moments.',
    sourceLabel: 'Simic et al., 2013 — Scandinavian Journal of Medicine & Science in Sports (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/22316148/'
  },
  {
    id: 'tip-11',
    numero: 11,
    domaine: 'Neurosciences & Récupération',
    titre: 'Variabilité de la fréquence cardiaque (VFC) et fatigue autonome',
    texte: 'La VFC renseigne sur l’activité autonome et la récupération. Observer ses tendances sur plusieurs jours — plutôt qu’une valeur isolée — aide à ajuster l’intensité quand la fatigue s’accumule.',
    sourceLabel: 'Plews et al., 2013 — International Journal of Sports Physiology and Performance (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/23876192/'
  },
  {
    id: 'tip-12',
    numero: 12,
    domaine: 'Autorégulation',
    titre: 'Charge externe et charge interne perçue',
    texte: 'Le stress psychologique, un sommeil court ou une fatigue latente modifient la charge interne ressentie pour une même charge externe. Ajuster les répétitions ou charges selon l’état réel du jour protège la progression sur la durée.',
    sourceLabel: 'Impellizzeri et al., 2019 — Frontiers in Physiology (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/31332730/'
  },
  {
    id: 'tip-13',
    numero: 13,
    domaine: 'Planification',
    titre: 'L’intérêt des semaines de décharge (deload)',
    texte: 'Réduire ponctuellement le volume ou l’intensité permet de dissiper la fatigue neuromusculaire et articulaire accumulée, favorisant la récupération et la poursuite des progrès.',
    sourceLabel: 'Bell et al., 2023 — Sports Medicine (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/37163078/'
  },
  {
    id: 'tip-14',
    numero: 14,
    domaine: 'Psychologie & Motricité',
    titre: 'Focus attentionnel externe vs contrôle interne excessif',
    texte: 'Orienter l’attention vers l’effet du mouvement ou la trajectoire de la charge (focus externe) favorise souvent l’automatisation et l’efficacité du geste par rapport à une surveillance constante de chaque muscle.',
    sourceLabel: 'Wulf, 2013 — International Review of Sport and Exercise Psychology (DOI)',
    sourceUrl: 'https://doi.org/10.1080/1750984X.2012.723728'
  },
  {
    id: 'tip-15',
    numero: 15,
    domaine: 'Hydratation',
    titre: 'Déshydratation, thermorégulation et perception de l’effort',
    texte: 'Perdre plus d’environ 2 % de sa masse corporelle en eau peut nuire à l’endurance, à la régulation thermique et augmenter la pénibilité perçue. Boire régulièrement selon la soif et la sudation reste un réflexe de base.',
    sourceLabel: 'Sawka et al., 2007 — Medicine & Science in Sports & Exercise (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/17277604/'
  },
  {
    id: 'tip-16',
    numero: 16,
    domaine: 'Hydratation & Électrolytes',
    titre: 'Le rôle du sodium lors des sudations importantes',
    texte: 'La sueur contient principalement de l’eau et du sodium. Lors de séances longues ou chaudes avec forte sudation, l’apport hydrique et sodique contribue au maintien du volume plasmatique et à la réhydratation.',
    sourceLabel: 'Shirreffs & Sawka, 2011 — Journal of Sports Sciences (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/22150427/'
  },
  {
    id: 'tip-17',
    numero: 17,
    domaine: 'Nutrition végétale',
    titre: 'Optimiser l’absorption du fer végétal avec la vitamine C',
    texte: 'Le fer non héminique des végétaux (légumineuses, tofu, graines, céréales complètes) voit son absorption augmentée en présence de vitamine C lors du repas, tandis que le thé ou café pris au même moment peut la réduire.',
    sourceLabel: 'Hurrell & Egli, 2010 — American Journal of Clinical Nutrition (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/20410097/'
  },
  {
    id: 'tip-18',
    numero: 18,
    domaine: 'Santé & Biologie',
    titre: 'Vitamine B12 : pilier neurologique et hématologique',
    texte: 'La vitamine B12 est indispensable au fonctionnement du système nerveux et à l’érythropoïèse. En alimentation végane, un apport régulier par complémentation ou aliments enrichis est indispensable pour prévenir toute carence.',
    sourceLabel: 'Allen, 2009 — American Journal of Clinical Nutrition (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/19116323/'
  },
  {
    id: 'tip-19',
    numero: 19,
    domaine: 'Nutrition végétale',
    titre: 'EPA et DHA via les microalgues',
    texte: 'Les huiles de microalgues apportent directement l’EPA et le DHA sans dépendre de produits animaux ni de la pêche, soutenant les fonctions cellulaires et la régulation inflammatoire.',
    sourceLabel: 'Arterburn et al., 2008 — Journal of the American Dietetic Association (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/18505804/'
  },
  {
    id: 'tip-20',
    numero: 20,
    domaine: 'Adaptation cellulaire',
    titre: 'Prudence avec les antioxydants isolés à très haute dose',
    texte: 'Des suppléments antioxydants très dosés autour des séances peuvent interférer avec certains signaux redox utiles à l’adaptation musculaire et mitochondriale. L’alimentation végétale riche en micronutriments reste la base.',
    sourceLabel: 'Paulsen et al., 2014 — Journal of Physiology (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/24798551/'
  },
  {
    id: 'tip-21',
    numero: 21,
    domaine: 'Sommeil & Circadien',
    titre: 'Lumière matinale et synchronisation circadienne',
    texte: 'S’exposer à la lumière extérieure dès le matin renforce le rythme veille-sommeil et aide la sécrétion nocturne de mélatonine à se caler plus naturellement le soir.',
    sourceLabel: 'Duffy & Czeisler, 2009 — Sleep Medicine Clinics (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/19403706/'
  },
  {
    id: 'tip-22',
    numero: 22,
    domaine: 'Sommeil & Thermorégulation',
    titre: 'Baisse de température corporelle et qualité du sommeil',
    texte: 'La diminution de la température centrale accompagne l’endormissement et le maintien du sommeil. Un environnement tempéré et un sas de décompression avant le coucher soutiennent ce processus.',
    sourceLabel: 'Harding et al., 2019 — Nature and Science of Sleep (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/31480775/'
  },
  {
    id: 'tip-23',
    numero: 23,
    domaine: 'Technique & Hypertrophie',
    titre: 'Amplitude de mouvement et travail en étirement',
    texte: 'Travailler sur une amplitude complète ou en étirement marqué favorise souvent de meilleurs gains d’hypertrophie qu’une amplitude réduite, sous réserve d’un contrôle technique et d’une charge adaptés.',
    sourceLabel: 'Bloomquist et al., 2013 — European Journal of Applied Physiology (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/23629583/'
  },
  {
    id: 'tip-24',
    numero: 24,
    domaine: 'Neurosciences & Rééducation',
    titre: 'L’effet d’éducation croisée (cross-education)',
    texte: 'Entraîner un membre peut induire un gain de force modéré dans le membre opposé via des adaptations nerveuses centrales. Une piste concrète pour préserver la force lors d’une blessure unilatérale.',
    sourceLabel: 'Manca et al., 2017 — European Journal of Applied Physiology (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/28218020/'
  },
  {
    id: 'tip-25',
    numero: 25,
    domaine: 'Sociologie & Régularité',
    titre: 'L’environnement et les conditions matérielles avant la volonté',
    texte: 'La régularité sportive dépend fortement de facteurs concrets : proximité du lieu d’entraînement, temps disponible, organisation, coût et soutien collectif. Réduire les frictions logistiques est souvent plus efficace que compter sur l’élan seul.',
    sourceLabel: 'Bauman et al., 2012 — The Lancet (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/22818936/'
  },
  {
    id: 'tip-26',
    numero: 26,
    domaine: 'Psychologie comportementale',
    titre: 'Plans d’action « Si… alors… » pour les jours chargés',
    texte: 'Définir à l’avance des règles simples du type « Si j’ai peu de temps, alors je fais une séance courte ciblée » aide à transformer l’intention en action sans avoir à renégocier chaque décision.',
    sourceLabel: 'Gollwitzer & Sheeran, 2006 — Advances in Experimental Social Psychology (DOI)',
    sourceUrl: 'https://doi.org/10.1016/S0065-2601(06)38002-1'
  },
  {
    id: 'tip-27',
    numero: 27,
    domaine: 'Fatigue mentale & Coordination',
    titre: 'La fatigue cognitive pèse aussi sur l’effort physique',
    texte: 'Une forte charge mentale préalable peut accroître la perception d’effort et altérer la régulation motrice. S’accorder de courtes pauses de récupération cognitive améliore la disponibilité attentionnelle.',
    sourceLabel: 'Marcora et al., 2009 — Journal of Applied Physiology (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/18948527/'
  },
  {
    id: 'tip-28',
    numero: 28,
    domaine: 'Équilibre & Prévention',
    titre: 'Varier les angles et plans de mouvement',
    texte: 'Alterner des exercices complémentaires et des variantes de prise ou d’appui répartit mieux les contraintes mécaniques sur les structures articulaires qu’un schéma répétitif unique.',
    sourceLabel: 'Fonseca et al., 2012 — European Journal of Applied Physiology (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/22160191/'
  },
  {
    id: 'tip-29',
    numero: 29,
    domaine: 'Sommeil & Vigilance',
    titre: 'Éviter la dette de sommeil chronique sur la semaine',
    texte: 'Accumuler de courtes nuits en semaine crée une dette de sommeil que deux grasse matinées ne compensent que partiellement sur le plan cognitif et métabolique.',
    sourceLabel: 'Belenky et al., 2003 — Journal of Sleep Research (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/12603781/'
  },
  {
    id: 'tip-30',
    numero: 30,
    domaine: 'Constance & Long terme',
    titre: 'La constance prime sur la perfection ponctuelle',
    texte: 'Une séance moyenne réalisée régulièrement contribue davantage aux adaptations physiologiques et à la pérennité de la pratique qu’une séance isolée parfaite suivie d’un abandon.',
    sourceLabel: 'Garber et al., 2011 — ACSM Position Stand (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/21694556/'
  }
];

var filtreArchiveTips = 'tous'; // 'tous' | 'non_lus' | 'lus'

function initialiserEtatTips() {
  if (!etat.tipsLus || typeof etat.tipsLus !== 'object') {
    etat.tipsLus = {};
  }
}

function hashDatePourTip(dateISO) {
  var hash = 0;
  for (var i = 0; i < dateISO.length; i++) {
    hash = ((hash << 5) - hash) + dateISO.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function obtenirTipDuJour(dateISO) {
  var ref = dateISO || (typeof obtenirDateJourReference === 'function' ? obtenirDateJourReference() : formaterDateISO(new Date()));
  var index = hashDatePourTip(ref) % TIPS_QUOTIDIENS.length;
  return TIPS_QUOTIDIENS[index];
}

function estTipLu(tipId) {
  initialiserEtatTips();
  return !!etat.tipsLus[tipId];
}

function marquerTipLu(tipId, marquerRoutine) {
  initialiserEtatTips();
  etat.tipsLus[tipId] = true;
  if (marquerRoutine && typeof obtenirDateJourReference === 'function' && typeof checklistDuJour === 'function') {
    var c = checklistDuJour(obtenirDateJourReference());
    c.tip = true;
  }
  sauvegarderEtat();
}

function basculerLectureTip(tipId) {
  initialiserEtatTips();
  etat.tipsLus[tipId] = !etat.tipsLus[tipId];
  sauvegarderEtat();
}

function injecterBoutonTipDansRoutine() {
  var zoneIcones = document.querySelector('#carte-checklist-quotidienne .todo-icones');
  if (!zoneIcones) { return; }
  if (zoneIcones.querySelector('.todo-bouton[data-tache="tip"]')) { return; }

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'todo-bouton';
  btn.setAttribute('data-action', 'ouvrir-tip-du-jour');
  btn.setAttribute('data-tache', 'tip');
  btn.setAttribute('title', 'Tip scientifique du jour');
  btn.setAttribute('aria-label', 'Tip scientifique du jour');
  btn.innerHTML = '<span class="todo-rond"><span class="todo-emoji">💡</span></span>';
  zoneIcones.appendChild(btn);
}

function synchroniserEtatBoutonTipRoutine() {
  injecterBoutonTipDansRoutine();
  initialiserEtatTips();
  var btn = document.querySelector('#carte-checklist-quotidienne .todo-bouton[data-tache="tip"]');
  if (!btn) { return; }
  var tipJour = obtenirTipDuJour();
  if (estTipLu(tipJour.id)) {
    btn.classList.add('todo-fait');
  } else {
    btn.classList.remove('todo-fait');
  }
}

function construireHtmlCarteTip(tip, options) {
  var opts = options || {};
  var lu = estTipLu(tip.id);
  var html = '<div class="tip-carte-modal">';
  html += '<div class="tip-meta-ligne">';
  html += '<span class="tip-numero">#' + tip.numero + '</span>';
  html += '<span class="tip-domaine">' + echapperHtml(tip.domaine) + '</span>';
  html += lu
    ? '<span class="tip-statut-lu" title="Déjà lu">✓ Lu</span>'
    : '<span class="tip-statut-nonlu" title="Non lu">○ Non lu</span>';
  html += '</div>';

  html += '<h3 class="tip-titre">' + echapperHtml(tip.titre) + '</h3>';
  html += '<p class="tip-corps">' + echapperHtml(tip.texte) + '</p>';

  html += '<div class="tip-sources">';
  html += '<div class="tip-sources-titre">Source scientifique</div>';
  if (tip.sourceUrl) {
    html += '<a class="tip-source-lien" href="' + echapperHtml(tip.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + echapperHtml(tip.sourceLabel || tip.sourceUrl) + ' ↗</a>';
  } else {
    html += '<div class="tip-source-texte">' + echapperHtml(tip.sourceLabel || '') + '</div>';
  }
  html += '</div>';

  html += '<div style="display:flex; gap:8px; flex-wrap:wrap;">';
  if (opts.afficherBoutonArchive) {
    html += '<button type="button" class="btn btn-contour btn-bloc" style="flex:1;" data-action="ouvrir-archive-tips">Tous les tips (' + TIPS_QUOTIDIENS.length + ')</button>';
  } else if (opts.afficherRetourArchive) {
    html += '<button type="button" class="btn btn-contour btn-bloc" style="flex:1;" data-action="ouvrir-archive-tips">← Retour à la liste</button>';
  }
  html += '<button type="button" class="btn btn-contour" data-action="basculer-lecture-tip" data-tip-id="' + tip.id + '">' + (lu ? 'Marquer non lu' : 'Marquer lu') + '</button>';
  html += '</div>';
  html += '</div>';
  return html;
}

function ouvrirTipDuJour() {
  var tip = obtenirTipDuJour();
  marquerTipLu(tip.id, true);
  synchroniserEtatBoutonTipRoutine();

  var html = '';
  html += '<div class="modal-entete"><h2>Tip du jour</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += construireHtmlCarteTip(tip, { afficherBoutonArchive: true });
  ouvrirModal(html);
}

function ouvrirDetailTipArchive(tipId) {
  var tip = null;
  for (var i = 0; i < TIPS_QUOTIDIENS.length; i++) {
    if (TIPS_QUOTIDIENS[i].id === tipId) { tip = TIPS_QUOTIDIENS[i]; break; }
  }
  if (!tip) { return; }
  marquerTipLu(tip.id, false);
  synchroniserEtatBoutonTipRoutine();

  var html = '';
  html += '<div class="modal-entete">';
  html += '<div class="modal-entete-gauche"><button type="button" class="bouton-retour" data-action="ouvrir-archive-tips" aria-label="Retour">‹</button><h2>Tip #' + tip.numero + '</h2></div>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += construireHtmlCarteTip(tip, { afficherRetourArchive: true });
  ouvrirModal(html, 'avant');
}

function ouvrirArchiveTips(nouveauFiltre) {
  if (nouveauFiltre) { filtreArchiveTips = nouveauFiltre; }
  initialiserEtatTips();

  var nbLus = 0;
  for (var i = 0; i < TIPS_QUOTIDIENS.length; i++) {
    if (etat.tipsLus[TIPS_QUOTIDIENS[i].id]) { nbLus++; }
  }

  var listeAffichee = TIPS_QUOTIDIENS.filter(function (t) {
    var lu = !!etat.tipsLus[t.id];
    if (filtreArchiveTips === 'lus') { return lu; }
    if (filtreArchiveTips === 'non_lus') { return !lu; }
    return true;
  });

  var html = '';
  html += '<div class="modal-entete"><h2>Bibliothèque de tips</h2>';
  html += '<button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';

  html += '<div class="tip-resume-lecture donnee-num">Lus : ' + nbLus + ' / ' + TIPS_QUOTIDIENS.length + '</div>';

  html += '<div class="tip-filtres">';
  html += '<button type="button" class="chip-rapide' + (filtreArchiveTips === 'tous' ? ' chip-actif' : '') + '" data-action="filtrer-archive-tips" data-filtre="tous">Tous</button>';
  html += '<button type="button" class="chip-rapide' + (filtreArchiveTips === 'non_lus' ? ' chip-actif' : '') + '" data-action="filtrer-archive-tips" data-filtre="non_lus">Non lus</button>';
  html += '<button type="button" class="chip-rapide' + (filtreArchiveTips === 'lus' ? ' chip-actif' : '') + '" data-action="filtrer-archive-tips" data-filtre="lus">Lus</button>';
  html += '</div>';

  if (listeAffichee.length === 0) {
    html += '<div class="etat-vide">Aucun tip dans ce filtre pour le moment.</div>';
  } else {
    html += '<div class="tip-archive-liste">';
    for (var j = 0; j < listeAffichee.length; j++) {
      var tip = listeAffichee[j];
      var estLu = !!etat.tipsLus[tip.id];
      html += '<button type="button" class="tip-archive-item' + (estLu ? ' est-lu' : '') + '" data-action="ouvrir-detail-tip" data-tip-id="' + tip.id + '">';
      html += '<span class="tip-icone-etat" aria-label="' + (estLu ? 'Lu' : 'Non lu') + '">' + (estLu ? '✓' : '○') + '</span>';
      html += '<span class="tip-archive-corps">';
      html += '<span class="tip-archive-titre">#' + tip.numero + ' · ' + echapperHtml(tip.titre) + '</span>';
      html += '<span class="tip-archive-sous">' + echapperHtml(tip.domaine) + ' · ' + (estLu ? 'Lu' : 'À lire') + '</span>';
      html += '</span>';
      html += '</button>';
    }
    html += '</div>';
  }

  ouvrirModal(html);
}

window.addEventListener('DOMContentLoaded', function () {
  injecterBoutonTipDansRoutine();
  synchroniserEtatBoutonTipRoutine();
});