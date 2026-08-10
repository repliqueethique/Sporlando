/* Bibliothèque d'aliments de base — 100% végétalienne (0% produit d'origine animale).
   Valeurs nutritionnelles pour 100 g (calories, protéines, glucides, lipides). */
var ALIMENTS_DE_BASE = [

  // ==========================================
  // --- 1. PROTÉINES VÉGÉTALES & SUBSTITUTS ---
  // ==========================================
  { nom: 'Tofu ferme', categorie: 'Protéines végétales', caloriesPour100g: 144, proteinesPour100g: 15, glucidesPour100g: 3, lipidesPour100g: 9 },
  { nom: 'Tofu fumé', categorie: 'Protéines végétales', caloriesPour100g: 170, proteinesPour100g: 17, glucidesPour100g: 1.5, lipidesPour100g: 10 },
  { nom: 'Tofu soyeux', categorie: 'Protéines végétales', caloriesPour100g: 55, proteinesPour100g: 5.8, glucidesPour100g: 2, lipidesPour100g: 2.7 },
  { nom: 'Tempeh', categorie: 'Protéines végétales', caloriesPour100g: 190, proteinesPour100g: 19, glucidesPour100g: 9, lipidesPour100g: 11 },
  { nom: 'Seitan', categorie: 'Protéines végétales', caloriesPour100g: 370, proteinesPour100g: 75, glucidesPour100g: 14, lipidesPour100g: 1.9 },
  { nom: 'Protéine de pois (poudre)', categorie: 'Protéines végétales', caloriesPour100g: 380, proteinesPour100g: 80, glucidesPour100g: 5, lipidesPour100g: 6 },
  { nom: 'Protéine de soja texturée (réhydratée)', categorie: 'Protéines végétales', caloriesPour100g: 110, proteinesPour100g: 17, glucidesPour100g: 8, lipidesPour100g: 0.5 },
  { nom: 'Levure nutritionnelle / maltée', categorie: 'Protéines végétales', caloriesPour100g: 325, proteinesPour100g: 45, glucidesPour100g: 35, lipidesPour100g: 5 },
  { nom: 'Graines de chanvre décortiquées', categorie: 'Protéines végétales', caloriesPour100g: 553, proteinesPour100g: 31, glucidesPour100g: 8.7, lipidesPour100g: 48 },

  // Brands / Produits carnés végétaux du commerce
  { nom: 'Jambon végétal "La Vie"', categorie: 'Protéines végétales', caloriesPour100g: 215, proteinesPour100g: 19.5, glucidesPour100g: 2.5, lipidesPour100g: 13.5 },
  { nom: 'Lardons végétaux "La Vie"', categorie: 'Protéines végétales', caloriesPour100g: 230, proteinesPour100g: 15, glucidesPour100g: 2, lipidesPour100g: 18 },
  { nom: 'Saucisses "Heura"', categorie: 'Protéines végétales', caloriesPour100g: 163, proteinesPour100g: 15, glucidesPour100g: 2.5, lipidesPour100g: 9.8 },
  { nom: 'Aiguillettes / Bouchées "Heura"', categorie: 'Protéines végétales', caloriesPour100g: 136, proteinesPour100g: 18, glucidesPour100g: 0.8, lipidesPour100g: 6.1 },
  { nom: 'Steak "Beyond Burger"', categorie: 'Protéines végétales', caloriesPour100g: 252, proteinesPour100g: 18, glucidesPour100g: 3.5, lipidesPour100g: 18 },
  { nom: 'Aiguillettes végétales "HappyVore"', categorie: 'Protéines végétales', caloriesPour100g: 151, proteinesPour100g: 18.2, glucidesPour100g: 4.1, lipidesPour100g: 5.8 },
  { nom: 'Haché végétal "Accro"', categorie: 'Protéines végétales', caloriesPour100g: 195, proteinesPour100g: 16, glucidesPour100g: 5, lipidesPour100g: 11 },


  // ==========================================
  // --- 2. CÉRÉALES, FÉCULENTS & LÉGUMINEUSES ---
  // ==========================================
  { nom: 'Lentilles vertes cuites', categorie: 'Céréales et féculents', caloriesPour100g: 116, proteinesPour100g: 9, glucidesPour100g: 20, lipidesPour100g: 0.4 },
  { nom: 'Lentilles corail cuites', categorie: 'Céréales et féculents', caloriesPour100g: 112, proteinesPour100g: 8.5, glucidesPour100g: 18, lipidesPour100g: 0.5 },
  { nom: 'Lentilles beluga cuites', categorie: 'Céréales et féculents', caloriesPour100g: 115, proteinesPour100g: 9, glucidesPour100g: 19, lipidesPour100g: 0.5 },
  { nom: 'Pois chiches cuits', categorie: 'Céréales et féculents', caloriesPour100g: 164, proteinesPour100g: 8.9, glucidesPour100g: 27, lipidesPour100g: 2.6 },
  { nom: 'Haricots rouges cuits', categorie: 'Céréales et féculents', caloriesPour100g: 127, proteinesPour100g: 8.7, glucidesPour100g: 22.8, lipidesPour100g: 0.5 },
  { nom: 'Haricots noirs cuits', categorie: 'Céréales et féculents', caloriesPour100g: 132, proteinesPour100g: 8.9, glucidesPour100g: 23.7, lipidesPour100g: 0.5 },
  { nom: 'Haricots blancs cuits', categorie: 'Céréales et féculents', caloriesPour100g: 139, proteinesPour100g: 9.7, glucidesPour100g: 25, lipidesPour100g: 0.6 },
  { nom: 'Fèves cuites', categorie: 'Céréales et féculents', caloriesPour100g: 110, proteinesPour100g: 7.6, glucidesPour100g: 19.7, lipidesPour100g: 0.4 },
  { nom: 'Pois cassés cuits', categorie: 'Céréales et féculents', caloriesPour100g: 118, proteinesPour100g: 8.3, glucidesPour100g: 21, lipidesPour100g: 0.4 },
  { nom: 'Edamame', categorie: 'Céréales et féculents', caloriesPour100g: 122, proteinesPour100g: 11, glucidesPour100g: 10, lipidesPour100g: 5 },

  { nom: 'Riz blanc cuit', categorie: 'Céréales et féculents', caloriesPour100g: 130, proteinesPour100g: 2.7, glucidesPour100g: 28, lipidesPour100g: 0.3 },
  { nom: 'Riz complet cuit', categorie: 'Céréales et féculents', caloriesPour100g: 112, proteinesPour100g: 2.3, glucidesPour100g: 23, lipidesPour100g: 0.9 },
  { nom: 'Riz basmati cuit', categorie: 'Céréales et féculents', caloriesPour100g: 121, proteinesPour100g: 3.5, glucidesPour100g: 25, lipidesPour100g: 0.4 },
  { nom: 'Riz sauvage cuit', categorie: 'Céréales et féculents', caloriesPour100g: 101, proteinesPour100g: 4, glucidesPour100g: 21, lipidesPour100g: 0.3 },
  { nom: 'Pâtes blanches cuites', categorie: 'Céréales et féculents', caloriesPour100g: 131, proteinesPour100g: 5, glucidesPour100g: 25, lipidesPour100g: 1.1 },
  { nom: 'Pâtes complètes cuites', categorie: 'Céréales et féculents', caloriesPour100g: 124, proteinesPour100g: 5, glucidesPour100g: 25, lipidesPour100g: 1 },
  { nom: 'Pâtes de lentilles corail cuites', categorie: 'Céréales et féculents', caloriesPour100g: 140, proteinesPour100g: 11, glucidesPour100g: 21, lipidesPour100g: 1.2 },
  { nom: 'Quinoa cuit', categorie: 'Céréales et féculents', caloriesPour100g: 120, proteinesPour100g: 4.4, glucidesPour100g: 21, lipidesPour100g: 1.9 },
  { nom: 'Avoine (flocons)', categorie: 'Céréales et féculents', caloriesPour100g: 389, proteinesPour100g: 13, glucidesPour100g: 66, lipidesPour100g: 7 },
  { nom: 'Sarrasin cuit', categorie: 'Céréales et féculents', caloriesPour100g: 92, proteinesPour100g: 3.4, glucidesPour100g: 20, lipidesPour100g: 0.6 },
  { nom: 'Boulgour cuit', categorie: 'Céréales et féculents', caloriesPour100g: 83, proteinesPour100g: 3.1, glucidesPour100g: 18.6, lipidesPour100g: 0.2 },
  { nom: 'Épeautre cuit', categorie: 'Céréales et féculents', caloriesPour100g: 127, proteinesPour100g: 5.5, glucidesPour100g: 26.8, lipidesPour100g: 0.8 },
  { nom: 'Polenta cuite', categorie: 'Céréales et féculents', caloriesPour100g: 85, proteinesPour100g: 2, glucidesPour100g: 18, lipidesPour100g: 0.4 },
  { nom: 'Semoule de blé cuite (couscous)', categorie: 'Céréales et féculents', caloriesPour100g: 112, proteinesPour100g: 3.8, glucidesPour100g: 23, lipidesPour100g: 0.2 },
  { nom: 'Millet cuit', categorie: 'Céréales et féculents', caloriesPour100g: 119, proteinesPour100g: 3.5, glucidesPour100g: 23.7, lipidesPour100g: 1 },
  { nom: 'Pomme de terre cuite', categorie: 'Céréales et féculents', caloriesPour100g: 87, proteinesPour100g: 1.9, glucidesPour100g: 20, lipidesPour100g: 0.1 },
  { nom: 'Patate douce cuite', categorie: 'Céréales et féculents', caloriesPour100g: 90, proteinesPour100g: 2, glucidesPour100g: 21, lipidesPour100g: 0.2 },
  { nom: 'Pain complet', categorie: 'Céréales et féculents', caloriesPour100g: 250, proteinesPour100g: 9, glucidesPour100g: 45, lipidesPour100g: 3 },
  { nom: 'Pain de seigle', categorie: 'Céréales et féculents', caloriesPour100g: 240, proteinesPour100g: 8.5, glucidesPour100g: 48, lipidesPour100g: 1.7 },
  { nom: 'Wrap / Tortilla complète', categorie: 'Céréales et féculents', caloriesPour100g: 290, proteinesPour100g: 8.5, glucidesPour100g: 48, lipidesPour100g: 6 },
  { nom: 'Gnocchis de pomme de terre', categorie: 'Céréales et féculents', caloriesPour100g: 160, proteinesPour100g: 3.5, glucidesPour100g: 33, lipidesPour100g: 0.8 },


  // ==========================================
  // --- 3. FRUITS ---
  // ==========================================
  { nom: 'Banane', categorie: 'Fruits', caloriesPour100g: 89, proteinesPour100g: 1.1, glucidesPour100g: 23, lipidesPour100g: 0.3 },
  { nom: 'Pomme', categorie: 'Fruits', caloriesPour100g: 52, proteinesPour100g: 0.3, glucidesPour100g: 14, lipidesPour100g: 0.2 },
  { nom: 'Poire', categorie: 'Fruits', caloriesPour100g: 57, proteinesPour100g: 0.4, glucidesPour100g: 15, lipidesPour100g: 0.1 },
  { nom: 'Fraise', categorie: 'Fruits', caloriesPour100g: 32, proteinesPour100g: 0.7, glucidesPour100g: 7.7, lipidesPour100g: 0.3 },
  { nom: 'Framboise', categorie: 'Fruits', caloriesPour100g: 52, proteinesPour100g: 1.2, glucidesPour100g: 12, lipidesPour100g: 0.6 },
  { nom: 'Myrtille', categorie: 'Fruits', caloriesPour100g: 57, proteinesPour100g: 0.7, glucidesPour100g: 14, lipidesPour100g: 0.3 },
  { nom: 'Mûre', categorie: 'Fruits', caloriesPour100g: 43, proteinesPour100g: 1.4, glucidesPour100g: 10, lipidesPour100g: 0.5 },
  { nom: 'Kiwi', categorie: 'Fruits', caloriesPour100g: 61, proteinesPour100g: 1.1, glucidesPour100g: 15, lipidesPour100g: 0.5 },
  { nom: 'Orange', categorie: 'Fruits', caloriesPour100g: 47, proteinesPour100g: 0.9, glucidesPour100g: 12, lipidesPour100g: 0.1 },
  { nom: 'Clémentine', categorie: 'Fruits', caloriesPour100g: 47, proteinesPour100g: 0.8, glucidesPour100g: 12, lipidesPour100g: 0.2 },
  { nom: 'Pamplemousse', categorie: 'Fruits', caloriesPour100g: 42, proteinesPour100g: 0.8, glucidesPour100g: 10, lipidesPour100g: 0.1 },
  { nom: 'Mangue', categorie: 'Fruits', caloriesPour100g: 60, proteinesPour100g: 0.8, glucidesPour100g: 15, lipidesPour100g: 0.4 },
  { nom: 'Ananas', categorie: 'Fruits', caloriesPour100g: 50, proteinesPour100g: 0.5, glucidesPour100g: 13, lipidesPour100g: 0.1 },
  { nom: 'Pêche / Nectarine', categorie: 'Fruits', caloriesPour100g: 39, proteinesPour100g: 0.9, glucidesPour100g: 9.5, lipidesPour100g: 0.25 },
  { nom: 'Abricot', categorie: 'Fruits', caloriesPour100g: 48, proteinesPour100g: 1.4, glucidesPour100g: 11, lipidesPour100g: 0.4 },
  { nom: 'Prune', categorie: 'Fruits', caloriesPour100g: 46, proteinesPour100g: 0.7, glucidesPour100g: 11.4, lipidesPour100g: 0.2 },
  { nom: 'Raisin', categorie: 'Fruits', caloriesPour100g: 69, proteinesPour100g: 0.7, glucidesPour100g: 18, lipidesPour100g: 0.2 },
  { nom: 'Melon', categorie: 'Fruits', caloriesPour100g: 34, proteinesPour100g: 0.8, glucidesPour100g: 8, lipidesPour100g: 0.2 },
  { nom: 'Pastèque', categorie: 'Fruits', caloriesPour100g: 30, proteinesPour100g: 0.6, glucidesPour100g: 7.5, lipidesPour100g: 0.1 },
  { nom: 'Figue fraîche', categorie: 'Fruits', caloriesPour100g: 74, proteinesPour100g: 0.8, glucidesPour100g: 19, lipidesPour100g: 0.3 },
  { nom: 'Grenade', categorie: 'Fruits', caloriesPour100g: 83, proteinesPour100g: 1.7, glucidesPour100g: 18.7, lipidesPour100g: 1.2 },
  { nom: 'Dattes Medjool', categorie: 'Fruits', caloriesPour100g: 277, proteinesPour100g: 1.8, glucidesPour100g: 75, lipidesPour100g: 0.2 },
  { nom: 'Figues séchées', categorie: 'Fruits', caloriesPour100g: 249, proteinesPour100g: 3.3, glucidesPour100g: 64, lipidesPour100g: 0.9 },
  { nom: 'Raisins secs', categorie: 'Fruits', caloriesPour100g: 299, proteinesPour100g: 3.1, glucidesPour100g: 79, lipidesPour100g: 0.5 },
  { nom: 'Abricots secs', categorie: 'Fruits', caloriesPour100g: 241, proteinesPour100g: 3.4, glucidesPour100g: 63, lipidesPour100g: 0.5 },


  // ==========================================
  // --- 4. LÉGUMES ---
  // ==========================================
  { nom: 'Brocoli cuit', categorie: 'Légumes', caloriesPour100g: 35, proteinesPour100g: 2.4, glucidesPour100g: 7, lipidesPour100g: 0.4 },
  { nom: 'Chou-fleur cuit', categorie: 'Légumes', caloriesPour100g: 25, proteinesPour100g: 1.9, glucidesPour100g: 5, lipidesPour100g: 0.3 },
  { nom: 'Épinards cuits', categorie: 'Légumes', caloriesPour100g: 23, proteinesPour100g: 2.9, glucidesPour100g: 3.6, lipidesPour100g: 0.4 },
  { nom: 'Courgette cuite', categorie: 'Légumes', caloriesPour100g: 17, proteinesPour100g: 1.2, glucidesPour100g: 3.1, lipidesPour100g: 0.3 },
  { nom: 'Aubergine cuite', categorie: 'Légumes', caloriesPour100g: 25, proteinesPour100g: 1, glucidesPour100g: 6, lipidesPour100g: 0.2 },
  { nom: 'Poivron rouge cuit', categorie: 'Légumes', caloriesPour100g: 31, proteinesPour100g: 1, glucidesPour100g: 6, lipidesPour100g: 0.3 },
  { nom: 'Poivron vert cuit', categorie: 'Légumes', caloriesPour100g: 20, proteinesPour100g: 0.9, glucidesPour100g: 4.6, lipidesPour100g: 0.2 },
  { nom: 'Carotte crue', categorie: 'Légumes', caloriesPour100g: 41, proteinesPour100g: 0.9, glucidesPour100g: 9.6, lipidesPour100g: 0.2 },
  { nom: 'Tomate crue', categorie: 'Légumes', caloriesPour100g: 18, proteinesPour100g: 0.9, glucidesPour100g: 3.9, lipidesPour100g: 0.2 },
  { nom: 'Concombre', categorie: 'Légumes', caloriesPour100g: 15, proteinesPour100g: 0.7, glucidesPour100g: 3.6, lipidesPour100g: 0.1 },
  { nom: 'Champignons de Paris cuits', categorie: 'Légumes', caloriesPour100g: 28, proteinesPour100g: 2.2, glucidesPour100g: 3.3, lipidesPour100g: 0.5 },
  { nom: 'Asperges cuites', categorie: 'Légumes', caloriesPour100g: 20, proteinesPour100g: 2.2, glucidesPour100g: 3.9, lipidesPour100g: 0.2 },
  { nom: 'Haricots verts cuits', categorie: 'Légumes', caloriesPour100g: 31, proteinesPour100g: 1.8, glucidesPour100g: 7, lipidesPour100g: 0.1 },
  { nom: 'Petits pois cuits', categorie: 'Légumes', caloriesPour100g: 81, proteinesPour100g: 5.4, glucidesPour100g: 14.5, lipidesPour100g: 0.4 },
  { nom: 'Chou de Bruxelles cuit', categorie: 'Légumes', caloriesPour100g: 43, proteinesPour100g: 3.4, glucidesPour100g: 9, lipidesPour100g: 0.3 },
  { nom: 'Chou kale cru', categorie: 'Légumes', caloriesPour100g: 49, proteinesPour100g: 4.3, glucidesPour100g: 8.8, lipidesPour100g: 0.9 },
  { nom: 'Poireau cuit', categorie: 'Légumes', caloriesPour100g: 31, proteinesPour100g: 1.5, glucidesPour100g: 7.6, lipidesPour100g: 0.3 },
  { nom: 'Céleri-branche', categorie: 'Légumes', caloriesPour100g: 14, proteinesPour100g: 0.7, glucidesPour100g: 3, lipidesPour100g: 0.2 },
  { nom: 'Radis', categorie: 'Légumes', caloriesPour100g: 16, proteinesPour100g: 0.7, glucidesPour100g: 3.4, lipidesPour100g: 0.1 },
  { nom: 'Betterave cuite', categorie: 'Légumes', caloriesPour100g: 43, proteinesPour100g: 1.6, glucidesPour100g: 9.6, lipidesPour100g: 0.2 },
  { nom: 'Courge butternut cuite', categorie: 'Légumes', caloriesPour100g: 45, proteinesPour100g: 1, glucidesPour100g: 11.7, lipidesPour100g: 0.1 },
  { nom: 'Potimarron cuit', categorie: 'Légumes', caloriesPour100g: 34, proteinesPour100g: 1.2, glucidesPour100g: 8.3, lipidesPour100g: 0.2 },


  // ==========================================
  // --- 5. MATIÈRES GRASSES & OLÉAGINEUX ---
  // ==========================================
  { nom: 'Huile d\'olive', categorie: 'Matières grasses', caloriesPour100g: 884, proteinesPour100g: 0, glucidesPour100g: 0, lipidesPour100g: 100 },
  { nom: 'Huile de colza', categorie: 'Matières grasses', caloriesPour100g: 884, proteinesPour100g: 0, glucidesPour100g: 0, lipidesPour100g: 100 },
  { nom: 'Huile de lin', categorie: 'Matières grasses', caloriesPour100g: 884, proteinesPour100g: 0, glucidesPour100g: 0, lipidesPour100g: 100 },
  { nom: 'Huile de coco', categorie: 'Matières grasses', caloriesPour100g: 862, proteinesPour100g: 0, glucidesPour100g: 0, lipidesPour100g: 100 },
  { nom: 'Margarine végétale', categorie: 'Matières grasses', caloriesPour100g: 717, proteinesPour100g: 0.2, glucidesPour100g: 0.5, lipidesPour100g: 80 },
  { nom: 'Avocat', categorie: 'Matières grasses', caloriesPour100g: 160, proteinesPour100g: 2, glucidesPour100g: 8.5, lipidesPour100g: 14.7 },
  { nom: 'Purée d\'amande', categorie: 'Matières grasses', caloriesPour100g: 614, proteinesPour100g: 21, glucidesPour100g: 19, lipidesPour100g: 56 },
  { nom: 'Purée de cacahuète', categorie: 'Matières grasses', caloriesPour100g: 588, proteinesPour100g: 25, glucidesPour100g: 20, lipidesPour100g: 50 },
  { nom: 'Tahin (purée de sésame)', categorie: 'Matières grasses', caloriesPour100g: 595, proteinesPour100g: 17, glucidesPour100g: 21, lipidesPour100g: 53 },
  { nom: 'Amandes', categorie: 'Matières grasses', caloriesPour100g: 579, proteinesPour100g: 21, glucidesPour100g: 22, lipidesPour100g: 50 },
  { nom: 'Noix de Grenoble', categorie: 'Matières grasses', caloriesPour100g: 654, proteinesPour100g: 15, glucidesPour100g: 14, lipidesPour100g: 65 },
  { nom: 'Noix de cajou', categorie: 'Matières grasses', caloriesPour100g: 553, proteinesPour100g: 18, glucidesPour100g: 30, lipidesPour100g: 44 },
  { nom: 'Noix de pécan', categorie: 'Matières grasses', caloriesPour100g: 691, proteinesPour100g: 9.2, glucidesPour100g: 13.9, lipidesPour100g: 72 },
  { nom: 'Noix du Brésil', categorie: 'Matières grasses', caloriesPour100g: 656, proteinesPour100g: 14, glucidesPour100g: 12, lipidesPour100g: 66 },
  { nom: 'Pistaches', categorie: 'Matières grasses', caloriesPour100g: 560, proteinesPour100g: 20, glucidesPour100g: 27, lipidesPour100g: 45 },
  { nom: 'Graines de chia', categorie: 'Matières grasses', caloriesPour100g: 486, proteinesPour100g: 17, glucidesPour100g: 42, lipidesPour100g: 31 },
  { nom: 'Graines de courge', categorie: 'Matières grasses', caloriesPour100g: 559, proteinesPour100g: 30, glucidesPour100g: 10.7, lipidesPour100g: 49 },
  { nom: 'Graines de tournesol', categorie: 'Matières grasses', caloriesPour100g: 584, proteinesPour100g: 21, glucidesPour100g: 20, lipidesPour100g: 51 },
  { nom: 'Graines de lin moulues', categorie: 'Matières grasses', caloriesPour100g: 534, proteinesPour100g: 18, glucidesPour100g: 29, lipidesPour100g: 42 },
  { nom: 'Graines de sésame', categorie: 'Matières grasses', caloriesPour100g: 573, proteinesPour100g: 18, glucidesPour100g: 23, lipidesPour100g: 50 },


  // ==========================================
  // --- 6. PRODUITS LAITIERS VÉGÉTAUX ---
  // ==========================================
  { nom: 'Lait de soja nature', categorie: 'Produits laitiers végétaux', caloriesPour100g: 33, proteinesPour100g: 3.3, glucidesPour100g: 1.8, lipidesPour100g: 1.8 },
  { nom: 'Lait d\'avoine', categorie: 'Produits laitiers végétaux', caloriesPour100g: 45, proteinesPour100g: 1, glucidesPour100g: 6.6, lipidesPour100g: 1.5 },
  { nom: 'Lait d\'amande sans sucre', categorie: 'Produits laitiers végétaux', caloriesPour100g: 13, proteinesPour100g: 0.4, glucidesPour100g: 0.3, lipidesPour100g: 1.1 },
  { nom: 'Lait de riz', categorie: 'Produits laitiers végétaux', caloriesPour100g: 47, proteinesPour100g: 0.3, glucidesPour100g: 9.2, lipidesPour100g: 1 },
  { nom: 'Lait de noisette', categorie: 'Produits laitiers végétaux', caloriesPour100g: 29, proteinesPour100g: 0.5, glucidesPour100g: 3.1, lipidesPour100g: 1.6 },
  { nom: 'Lait de coco (boisson)', categorie: 'Produits laitiers végétaux', caloriesPour100g: 20, proteinesPour100g: 0.2, glucidesPour100g: 2.7, lipidesPour100g: 0.9 },
  { nom: 'Lait de coco (en brique pour cuisine)', categorie: 'Produits laitiers végétaux', caloriesPour100g: 197, proteinesPour100g: 2.3, glucidesPour100g: 5.5, lipidesPour100g: 18 },
  { nom: 'Yaourt de soja nature', categorie: 'Produits laitiers végétaux', caloriesPour100g: 60, proteinesPour100g: 3.5, glucidesPour100g: 4, lipidesPour100g: 2.5 },
  { nom: 'Skyr végétal "Alpro Soja"', categorie: 'Produits laitiers végétaux', caloriesPour100g: 65, proteinesPour100g: 5.8, glucidesPour100g: 2.5, lipidesPour100g: 3.3 },
  { nom: 'Yaourt d\'avoine nature', categorie: 'Produits laitiers végétaux', caloriesPour100g: 65, proteinesPour100g: 1.2, glucidesPour100g: 8.5, lipidesPour100g: 2.8 },
  { nom: 'Yaourt de coco nature', categorie: 'Produits laitiers végétaux', caloriesPour100g: 110, proteinesPour100g: 0.9, glucidesPour100g: 4.5, lipidesPour100g: 10 },
  { nom: 'Crème fluide végétal (soja)', categorie: 'Produits laitiers végétaux', caloriesPour100g: 145, proteinesPour100g: 3, glucidesPour100g: 3, lipidesPour100g: 13 },
  { nom: 'Fromage végétal bloc "Violife"', categorie: 'Produits laitiers végétaux', caloriesPour100g: 285, proteinesPour100g: 0, glucidesPour100g: 20, lipidesPour100g: 23 },
  { nom: 'Fromage végétal râpé', categorie: 'Produits laitiers végétaux', caloriesPour100g: 280, proteinesPour100g: 3, glucidesPour100g: 8, lipidesPour100g: 25 },
  { nom: 'Fauxmage affiné au cajou ("Jay & Joy")', categorie: 'Produits laitiers végétaux', caloriesPour100g: 320, proteinesPour100g: 8, glucidesPour100g: 10, lipidesPour100g: 27 }
];