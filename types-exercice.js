/* ============================================================
   TYPES D'EXERCICE : catalogue + guide
   Chaque type : id, cat (catégorie), nom, besoin, comment, conseil
   Les ids reprennent ceux déjà utilisés dans l'app (lineaire, cluster, drop_set...).
   ============================================================ */

var CATEGORIES_TYPES = [
  { id: 'base', nom: "Séries de base" },
  { id: 'variable', nom: "Charges et reps qui changent" },
  { id: 'intensif', nom: "Techniques d'intensification" },
  { id: 'combine', nom: "Combinaisons d'exercices" },
  { id: 'special', nom: "Sans reps × charge classiques" }
];

var TYPES_EXERCICE = [
  { id: 'lineaire', cat: 'base', nom: "Séries droites",
    besoin: "Progresser simplement et régulièrement : c'est la base de presque tous les programmes.",
    comment: "Même charge et même nombre de reps à chaque série (ex. 4 × 10 à 40 kg). Repos de 1 min 30 à 2 min.",
    conseil: "Quand tu réussis toutes les séries, monte la charge de 2,5 kg à la séance suivante." },

  { id: 'fourchette', cat: 'base', nom: "Fourchette de reps (double progression)",
    besoin: "Progresser sans stagner en alternant montée en reps et montée en charge.",
    comment: "Tu vises une fourchette (ex. 3 × 8 à 12). Tu gardes la même charge jusqu'à faire 12 reps sur toutes les séries, puis tu montes la charge et tu repars à 8.",
    conseil: "Très adaptée à la prise de muscle, surtout sur les exercices d'isolation et aux machines." },

  { id: 'lourdes', cat: 'base', nom: "Séries lourdes (force)",
    besoin: "Devenir plus fort : travailler des charges proches de ton maximum.",
    comment: "1 à 5 reps par série à 80-95 % de ton 1RM, avec 3 à 5 min de repos, après un échauffement progressif.",
    conseil: "À réserver aux gros exercices (squat, développé couché, soulevé de terre), avec les barres de sécurité bien réglées ou un pareur." },

  { id: 'rer_cible', cat: 'base', nom: "Autorégulé (RER cible)",
    besoin: "Adapter la charge à ta forme du jour plutôt que de suivre un poids fixe.",
    comment: "Tu vises un nombre de reps avec une réserve imposée (ex. 3 × 8 à RER 2 : tu t'arrêtes 2 reps avant l'échec). Tu choisis la charge qui donne ça.",
    conseil: "Pratique quand la fatigue varie d'un jour à l'autre. Note ton RER : l'app s'en sert pour te suggérer la progression." },

  { id: 'echec', cat: 'base', nom: "Jusqu'à l'échec (AMRAP)",
    besoin: "Mesurer ta force réelle du jour et pousser un muscle à fond.",
    comment: "Une série (souvent la dernière) où tu fais le maximum de reps possible avec une bonne technique, sans nombre imposé. Tu notes combien tu en as fait.",
    conseil: "Donne l'estimation de 1RM la plus fiable. À éviter sur les exercices lourds et techniques sans pareur : préfère les machines, les poulies et les haltères. Pas à chaque séance, la récupération coûte cher." },

  { id: 'pyramide_montante', cat: 'variable', nom: "Pyramide montante",
    besoin: "Monter progressivement vers une série lourde, en t'échauffant au passage.",
    comment: "La charge augmente à chaque série et les reps diminuent (ex. 12 × 40 kg, 10 × 50, 8 × 60, 6 × 70). La dernière série est la plus lourde.",
    conseil: "Bien pour la force. Attention : la fatigue s'accumule avant la série la plus lourde." },

  { id: 'pyramide_descendante', cat: 'variable', nom: "Pyramide descendante (reverse pyramid)",
    besoin: "Faire ta série la plus lourde quand tu es frais, avec peu de séries.",
    comment: "Tu commences par la série la plus lourde (ex. 6 × 70 kg), puis tu baisses la charge d'environ 10 % et tu augmentes les reps (8 × 63, 10 × 56).",
    conseil: "Efficace quand tu manques de temps. Échauffe-toi bien : la première série est directement lourde." },

  { id: 'pyramide_double', cat: 'variable', nom: "Pyramide double (diamant)",
    besoin: "Cumuler du volume et de l'intensité dans un même exercice.",
    comment: "La charge monte puis redescend (ex. 12 × 40 kg, 8 × 55, 5 × 65, 8 × 55, 12 × 40).",
    conseil: "Plutôt pour changer de routine, sur un exercice d'isolation ou à la machine. Demande du temps et de l'énergie." },

  { id: 'echelle', cat: 'variable', nom: "Échelle (reps croissantes)",
    besoin: "Accumuler beaucoup de reps à charge lourde sans aller à l'échec.",
    comment: "Même charge, reps qui augmentent à chaque série : 1, 2, 3, 4… (ou l'inverse). Repos court.",
    conseil: "Bon pour travailler la technique et la force-endurance, par exemple aux tractions. La fatigue reste contrôlée." },

  { id: 'back_off', cat: 'variable', nom: "Top set + séries de décharge (back-off)",
    besoin: "Combiner force et volume : une série très lourde, puis du volume plus léger.",
    comment: "Une série lourde (ex. 1 × 5 à 85 % du 1RM), puis 2 à 4 séries 10 à 15 % plus légères avec plus de reps (ex. 3 × 8).",
    conseil: "Très utilisée en force. La série lourde sert de repère : si elle progresse, tu montes la charge à la séance suivante." },

  { id: 'cluster', cat: 'intensif', nom: "Cluster set",
    besoin: "Faire des reps lourdes de bonne qualité sans t'épuiser, pour la force et la puissance.",
    comment: "Tu découpes une série en grappes de 2 à 3 reps avec 10 à 20 s de repos entre elles (ex. 4 grappes de 2 reps), puis 2 à 3 min de repos avant la série suivante.",
    conseil: "Permet de faire plus de reps qu'une série continue ne le permettrait à cette charge." },

  { id: 'drop_set', cat: 'intensif', nom: "Série dégressive (drop set)",
    besoin: "Pousser un muscle au-delà de l'échec, ou gagner du temps.",
    comment: "Tu vas à l'échec, tu baisses la charge de 20 à 30 %, tu continues tout de suite sans repos, 1 à 3 fois.",
    conseil: "Idéal sur machines et poulies, où l'on change de charge vite. Très fatigant : sur la dernière série d'un exercice seulement." },

  { id: 'rest_pause', cat: 'intensif', nom: "Rest-pause",
    besoin: "Faire beaucoup de reps lourdes en peu de temps, ou franchir un plateau.",
    comment: "Tu vas à l'échec (ou presque), tu te reposes 15 à 20 s, tu refais quelques reps avec la même charge, puis encore une fois.",
    conseil: "À garder pour la dernière série. Une série rest-pause peut remplacer deux séries classiques." },

  { id: 'myo_reps', cat: 'intensif', nom: "Myo-reps",
    besoin: "Du volume intense en un minimum de temps, pour prendre du muscle.",
    comment: "Une série d'activation de 12 à 20 reps proche de l'échec, puis des mini-séries de 3 à 5 reps avec 10 à 20 s de repos, jusqu'à ne plus réussir 3 à 5 reps.",
    conseil: "Surtout pour l'isolation (curl, élévations, extensions), avec une charge légère à modérée." },

  { id: 'partielles', cat: 'intensif', nom: "Répétitions partielles",
    besoin: "Prolonger une série quand tu ne peux plus faire toute l'amplitude, ou travailler une zone précise du mouvement.",
    comment: "Après l'échec, tu continues avec des mouvements plus courts (moitié basse ou moitié haute) pendant quelques reps.",
    conseil: "Surtout en isolation (élévations, curl). Reste contrôlé : ce n'est pas un balancement." },

  { id: 'forcees', cat: 'intensif', nom: "Répétitions forcées",
    besoin: "Aller au-delà de l'échec avec une aide extérieure.",
    comment: "Un partenaire t'aide juste assez pour terminer 1 à 3 reps de plus après l'échec.",
    conseil: "Demande un pareur de confiance. À éviter seul." },

  { id: 'negatives', cat: 'intensif', nom: "Répétitions négatives (excentriques)",
    besoin: "Travailler la force sur la phase de descente, ou franchir un plateau de force.",
    comment: "Descente lente (3 à 5 s) avec une charge un peu supérieure à celle que tu soulèves normalement, remontée assistée. 3 à 5 reps.",
    conseil: "Très éprouvant pour les muscles et les tendons : au plus une fois par semaine et par exercice, avec pareur." },

  { id: 'superset', cat: 'combine', nom: "Superset",
    besoin: "Gagner du temps ou travailler deux muscles à la suite sans repos.",
    comment: "Deux exercices enchaînés sans repos entre eux (ex. biceps puis triceps, ou pectoraux puis dos), puis repos, puis on recommence.",
    conseil: "Avec des muscles opposés, chacun récupère pendant que l'autre travaille : tu gardes tes charges tout en économisant du temps." },

  { id: 'circuit', cat: 'combine', nom: "Circuit / giant set",
    besoin: "Dépenser de l'énergie et travailler l'endurance en mélangeant muscu et cardio.",
    comment: "3 à 6 exercices enchaînés avec peu de repos, répétés sur 2 à 4 tours.",
    conseil: "Charges plus légères : moins adapté à la force pure." },

  { id: 'maintien', cat: 'special', nom: "Maintien chronométré (isométrique)",
    besoin: "Renforcer le gainage et la stabilité.",
    comment: "Tu tiens une position pendant une durée cible (ex. planche 3 × 45 s). On compte des secondes, pas des reps.",
    conseil: "Quand tu dépasses 60 secondes sans trembler, rends l'exercice plus difficile plutôt que plus long." },

  { id: 'poids_corps', cat: 'special', nom: "Poids du corps",
    besoin: "T'entraîner avec ton propre poids (pompes, tractions, dips).",
    comment: "Seules les reps comptent. Pour progresser : plus de reps, une variante plus difficile ou un lest ; un élastique aide si c'est encore trop dur.",
    conseil: "Le 1RM estimé ne s'applique qu'avec une charge ajoutée." },

  { id: 'cardio', cat: 'special', nom: "Durée et distance (cardio)",
    besoin: "Travailler l'endurance : course, vélo, rameur, natation.",
    comment: "On note la durée et/ou la distance à la place des reps et de la charge.",
    conseil: "En intervalles (court et intense) ou en continu (long et facile), selon ton objectif." }
];

function trouverTypeExercice(id) {
  for (var i = 0; i < TYPES_EXERCICE.length; i++) {
    if (TYPES_EXERCICE[i].id === id) { return TYPES_EXERCICE[i]; }
  }
  return null;
}

function ligneTypeFiche(libelle, texte) {
  return '<div class="type-ligne"><span class="type-label">' + libelle + '</span>' + echapperHtml(texte) + '</div>';
}

/* idOuvert (optionnel) : la fiche à déplier directement */
function ouvrirGuideTypes(idOuvert) {
  var html = '<div class="modal-entete"><h2>Types d\'exercice</h2><button class="bouton-fermer" data-action="fermer-modal">&times;</button></div>';
  html += '<p class="reglages-note" style="margin:0 2px 6px;">Pour chaque type : le besoin auquel il répond, comment le pratiquer, et un conseil.</p>';
  for (var c = 0; c < CATEGORIES_TYPES.length; c++) {
    var cat = CATEGORIES_TYPES[c];
    html += '<div class="selecteur-groupe">' + echapperHtml(cat.nom) + '</div>';
    for (var i = 0; i < TYPES_EXERCICE.length; i++) {
      var t = TYPES_EXERCICE[i];
      if (t.cat !== cat.id) { continue; }
      html += '<details class="type-fiche"' + (t.id === idOuvert ? ' open' : '') + '>';
      html += '<summary>' + echapperHtml(t.nom) + '</summary><div class="type-fiche-corps">';
      html += ligneTypeFiche('Besoin', t.besoin) + ligneTypeFiche('Comment', t.comment) + ligneTypeFiche('Conseil', t.conseil);
      html += '</div></details>';
    }
  }
  html += '<button class="btn btn-contour btn-bloc" style="margin-top:12px;" data-action="ouvrir-notice">Retour à la notice</button>';
  ouvrirModal(html, 'avant');
}