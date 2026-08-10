/* Bibliothèque de base adaptée au matériel : rack ATX (poulie haute/basse, barre de traction multigrip,
   fixations élastiques), banc inclinable, barre olympique + disques, barre EZ, haltères olympiques,
   poignées de tirage, élastiques 5/10 kg, poignées de pompes, tapis de sol. Poids/reps/séries = valeurs
   de départ, à ajuster ensuite selon ton niveau. */
var EXERCICES_DE_BASE = [
  { nom: 'Développé couché barre', groupe: 'Pectoraux', poidsDefaut: 40, repsDefaut: 8, seriesDefaut: 4, met: 5, variantes: 'Prise serrée : accentue les triceps. Prise large : accentue les pectoraux externes.' },
  { nom: 'Développé incliné barre', groupe: 'Pectoraux', poidsDefaut: 30, repsDefaut: 8, seriesDefaut: 4, met: 5, variantes: 'Incliné à 30-45° : accentue le haut des pectoraux.' },
  { nom: 'Développé couché haltères', groupe: 'Pectoraux', poidsDefaut: 12, repsDefaut: 10, seriesDefaut: 3, met: 5, variantes: 'Prise neutre (paumes face à face) : moins de stress sur les épaules.' },
  { nom: 'Développé incliné haltères', groupe: 'Pectoraux', poidsDefaut: 10, repsDefaut: 10, seriesDefaut: 3, met: 5, variantes: '' },
  { nom: 'Écarté couché haltères', groupe: 'Pectoraux', poidsDefaut: 8, repsDefaut: 12, seriesDefaut: 3, met: 4, variantes: '' },
  { nom: 'Écarté à la poulie vis-à-vis', groupe: 'Pectoraux', poidsDefaut: 15, repsDefaut: 12, seriesDefaut: 3, met: 4, variantes: 'Poulie basse vers le haut : accentue le haut des pectoraux. Poulie haute vers le bas : accentue le bas.' },
  { nom: 'Pompes (avec poignées)', groupe: 'Pectoraux', poidsDefaut: 0, repsDefaut: 15, seriesDefaut: 3, met: 4, variantes: 'Mains larges : pectoraux. Mains resserrées (diamant) : triceps.' },

  { nom: 'Tirage horizontal à la poulie', groupe: 'Dos', poidsDefaut: 40, repsDefaut: 10, seriesDefaut: 4, met: 5, variantes: 'Prise large : accentue le haut du dos. Prise serrée neutre : accentue le milieu du dos.' },
  { nom: 'Tirage vertical à la poulie', groupe: 'Dos', poidsDefaut: 35, repsDefaut: 10, seriesDefaut: 4, met: 5, variantes: 'Prise pronation large (devant) : grand dorsal en largeur. Prise supination serrée : plus de biceps.' },
  { nom: 'Rowing barre buste penché', groupe: 'Dos', poidsDefaut: 30, repsDefaut: 8, seriesDefaut: 4, met: 5.5, variantes: 'Prise pronation : haut du dos. Prise supination : bas du dos et biceps.' },
  { nom: 'Rowing haltère unilatéral', groupe: 'Dos', poidsDefaut: 14, repsDefaut: 10, seriesDefaut: 3, met: 5, variantes: '' },
  { nom: 'Tractions', groupe: 'Dos', poidsDefaut: 0, repsDefaut: 6, seriesDefaut: 4, met: 5, variantes: 'Prise large pronation : grand dorsal en largeur. Prise serrée supination (chin-up) : plus de biceps.' },
  { nom: 'Tractions assistées (élastique)', groupe: 'Dos', poidsDefaut: 0, repsDefaut: 8, seriesDefaut: 3, met: 4.5, variantes: '' },
  { nom: 'Soulevé de terre', groupe: 'Dos', poidsDefaut: 50, repsDefaut: 6, seriesDefaut: 4, met: 6, variantes: 'Sumo (jambes écartées, prise entre les jambes) : accentue adducteurs et fessiers, moins le bas du dos. Conventionnel (jambes serrées) : plus de chaîne postérieure.' },
  { nom: 'Face pull à la poulie', groupe: 'Dos', poidsDefaut: 15, repsDefaut: 15, seriesDefaut: 3, met: 4, variantes: '' },
  { nom: 'Extension lombaire au sol', groupe: 'Dos', poidsDefaut: 0, repsDefaut: 12, seriesDefaut: 3, met: 3.5, variantes: '' },

  { nom: 'Développé militaire barre', groupe: 'Épaules', poidsDefaut: 25, repsDefaut: 8, seriesDefaut: 4, met: 5, variantes: 'Devant la tête (assis ou debout) vs nuque (déconseillé pour les épaules fragiles).' },
  { nom: 'Développé militaire haltères', groupe: 'Épaules', poidsDefaut: 10, repsDefaut: 10, seriesDefaut: 3, met: 5, variantes: '' },
  { nom: 'Élévations latérales haltères', groupe: 'Épaules', poidsDefaut: 6, repsDefaut: 12, seriesDefaut: 3, met: 3.5, variantes: 'Buste légèrement penché en avant : accentue le faisceau arrière.' },
  { nom: 'Élévations frontales haltères', groupe: 'Épaules', poidsDefaut: 6, repsDefaut: 12, seriesDefaut: 3, met: 3.5, variantes: '' },
  { nom: 'Oiseau buste penché', groupe: 'Épaules', poidsDefaut: 5, repsDefaut: 12, seriesDefaut: 3, met: 3.5, variantes: '' },
  { nom: 'Rowing menton barre EZ', groupe: 'Épaules', poidsDefaut: 20, repsDefaut: 10, seriesDefaut: 3, met: 4.5, variantes: 'Prise large : plus épaules. Prise serrée : plus trapèzes.' },
  { nom: 'Haussements d\'épaules barre', groupe: 'Épaules', poidsDefaut: 40, repsDefaut: 12, seriesDefaut: 3, met: 4, variantes: '' },

  { nom: 'Curl barre', groupe: 'Bras', poidsDefaut: 20, repsDefaut: 10, seriesDefaut: 3, met: 3.5, variantes: 'Prise large : accentue le biceps court interne. Prise serrée : accentue le biceps long externe.' },
  { nom: 'Curl barre EZ', groupe: 'Bras', poidsDefaut: 20, repsDefaut: 10, seriesDefaut: 3, met: 3.5, variantes: 'Moins de stress sur les poignets que la barre droite.' },
  { nom: 'Curl haltères', groupe: 'Bras', poidsDefaut: 10, repsDefaut: 10, seriesDefaut: 3, met: 3.5, variantes: 'Supination complète en montant : plus de pic biceps.' },
  { nom: 'Curl marteau haltères', groupe: 'Bras', poidsDefaut: 10, repsDefaut: 10, seriesDefaut: 3, met: 3.5, variantes: 'Prise neutre (marteau) : accentue le brachial et l\'avant-bras.' },
  { nom: 'Curl à la poulie', groupe: 'Bras', poidsDefaut: 20, repsDefaut: 12, seriesDefaut: 3, met: 3.5, variantes: '' },
  { nom: 'Extension triceps à la poulie (corde)', groupe: 'Bras', poidsDefaut: 20, repsDefaut: 12, seriesDefaut: 3, met: 3.5, variantes: 'Écarter la corde en fin de mouvement : accentue la tête latérale.' },
  { nom: 'Extension triceps barre EZ (skull crusher)', groupe: 'Bras', poidsDefaut: 15, repsDefaut: 10, seriesDefaut: 3, met: 3.5, variantes: '' },
  { nom: 'Extension triceps haltère nuque', groupe: 'Bras', poidsDefaut: 10, repsDefaut: 12, seriesDefaut: 3, met: 3.5, variantes: 'Accentue la longue portion du triceps (bras au-dessus de la tête).' },
  { nom: 'Dips au banc', groupe: 'Bras', poidsDefaut: 0, repsDefaut: 12, seriesDefaut: 3, met: 4, variantes: '' },

  { nom: 'Squat barre', groupe: 'Jambes', poidsDefaut: 40, repsDefaut: 8, seriesDefaut: 4, met: 6, variantes: 'Sumo (jambes écartées, pointes de pieds ouvertes) : accentue adducteurs et fessiers. Squat serré : plus de quadriceps.' },
  { nom: 'Squat avant barre', groupe: 'Jambes', poidsDefaut: 30, repsDefaut: 8, seriesDefaut: 4, met: 6, variantes: 'Barre à l\'avant : accentue davantage les quadriceps que le squat classique.' },
  { nom: 'Fentes haltères', groupe: 'Jambes', poidsDefaut: 10, repsDefaut: 10, seriesDefaut: 3, met: 5.5, variantes: 'Fente marchée vs fente sur place : la fente marchée sollicite plus l\'équilibre.' },
  { nom: 'Fentes bulgares (banc)', groupe: 'Jambes', poidsDefaut: 8, repsDefaut: 10, seriesDefaut: 3, met: 5.5, variantes: '' },
  { nom: 'Soulevé de terre jambes tendues', groupe: 'Jambes', poidsDefaut: 40, repsDefaut: 10, seriesDefaut: 3, met: 6, variantes: 'Accentue les ischio-jambiers et fessiers, moins le dos que le soulevé classique.' },
  { nom: 'Hip thrust barre (au banc)', groupe: 'Jambes', poidsDefaut: 40, repsDefaut: 10, seriesDefaut: 4, met: 5, variantes: 'Pieds rapprochés : plus quadriceps. Pieds écartés : plus fessiers/adducteurs.' },
  { nom: 'Extension mollets debout', groupe: 'Jambes', poidsDefaut: 20, repsDefaut: 15, seriesDefaut: 4, met: 3.5, variantes: 'Pointes de pieds vers l\'intérieur : accentue le mollet externe. Vers l\'extérieur : accentue l\'interne.' },

  { nom: 'Crunch au sol', groupe: 'Abdominaux', poidsDefaut: 0, repsDefaut: 20, seriesDefaut: 3, met: 3, variantes: '' },
  { nom: 'Relevé de jambes suspendu', groupe: 'Abdominaux', poidsDefaut: 0, repsDefaut: 12, seriesDefaut: 3, met: 4, variantes: 'Jambes tendues : plus difficile. Genoux repliés : plus accessible.' },
  { nom: 'Gainage planche (secondes)', groupe: 'Abdominaux', poidsDefaut: 0, repsDefaut: 30, seriesDefaut: 3, met: 3, variantes: '' },
  { nom: 'Gainage latéral (secondes/côté)', groupe: 'Abdominaux', poidsDefaut: 0, repsDefaut: 20, seriesDefaut: 3, met: 3, variantes: '' },
  { nom: 'Rotation russe', groupe: 'Abdominaux', poidsDefaut: 5, repsDefaut: 20, seriesDefaut: 3, met: 3.5, variantes: '' },
  { nom: 'Crunch à la poulie', groupe: 'Abdominaux', poidsDefaut: 25, repsDefaut: 15, seriesDefaut: 3, met: 3.5, variantes: '' }
];

// Base de données des échauffements
const DONNEES_ECHAUFFEMENT = {
  hautDuCorps: {
    titre: "🔥 Échauffement Haut du Corps",
    description: "Circuit dynamique de 3 à 4 min (intensité progressive) :",
    exercices: [
      { nom: "Jumping Jacks", duree: "45 secondes" },
      { nom: "Shadow Boxing", duree: "45 secondes", details: "Coups de poing dans le vide en sautillant légèrement" },
      { nom: "Tirage 'Rameur' à l'élastique", duree: "45 secondes", details: "Accroché à la cage à squat, tirage fluide en sautillant légèrement" },
      { nom: "Montées de genoux légères", duree: "45 secondes" }
    ]
  },
  basDuCorps: {
    titre: "🔥 Échauffement Bas du Corps",
    description: "Circuit dynamique de 3 à 4 min (intensité progressive) :",
    exercices: [
      { nom: "Jumping Jacks", duree: "45 secondes" },
      { nom: "Air Squats fluides", duree: "45 secondes", details: "Squats sans charge, rythme modéré" },
      { nom: "Talons-fesses / Montées de genoux", duree: "45 secondes" },
      { nom: "Fentes marchées dynamiques", duree: "45 secondes", details: "Sans charge" }
    ]
  }
};

// Ouvre la fenêtre d'échauffement quand on lance une séance
function demarrerEchauffement() {
  document.getElementById('modalEchauffement').classList.remove('hidden');
  document.getElementById('vueChoixEchauffement').classList.remove('hidden');
  document.getElementById('vueListeEchauffement').classList.add('hidden');
}

// Affiche les exercices selon le choix sélectionné
function choisirEchauffement(type) {
  const donnee = DONNEES_ECHAUFFEMENT[type];
  if (!donnee) return;

  document.getElementById('titreEchauffement').textContent = donnee.titre;
  document.getElementById('descEchauffement').textContent = donnee.description;

  const listeUl = document.getElementById('listeExercicesEchauffement');
  listeUl.innerHTML = '';

  donnee.exercices.forEach((exo, index) => {
    const li = document.createElement('li');
    li.className = 'item-echauffement';
    li.innerHTML = `
      <label class="checkbox-container">
        <input type="checkbox" id="exo-echauf-${index}">
        <span class="checkmark"></span>
        <div class="exo-info">
          <strong>${exo.nom}</strong> — <span class="duree">${exo.duree}</span>
          ${exo.details ? `<small>${exo.details}</small>` : ''}
        </div>
      </label>
    `;
    listeUl.appendChild(li);
  });

  document.getElementById('vueChoixEchauffement').classList.add('hidden');
  document.getElementById('vueListeEchauffement').classList.remove('hidden');
}

// Ferme l'échauffement et démarre la séance normale
function terminerEchauffement() {
  document.getElementById('modalEchauffement').classList.add('hidden');
  // Appelez ici votre fonction existante qui lance le chrono / la séance
  if (typeof lanciaSeance === 'function') {
    lanciaSeance();
  }
}

// Optionnel : passer l'échauffement
function passerEchauffement() {
  document.getElementById('modalEchauffement').classList.add('hidden');
  if (typeof lanciaSeance === 'function') {
    lanciaSeance();
  }
}