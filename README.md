# 🚔 LSPD MDT (Mobile Data Terminal) 2.0 - GTA RP

Application web moderne, ultra-fluide et autonome conçue sur-mesure pour les forces de l'ordre de votre serveur GTA RP (LSPD / BCSO / SASP), avec extension modulaire prête pour les EMS / Hôpital et la Justice.

---

## ⚡ Démarrage Rapide

Le site est d'ores et déjà prêt et lancé sur votre machine :
- 🌐 **URL Locale** : [http://localhost:3005](http://localhost:3005)
- 🗄️ **Base de données** : SQLite locale (`prisma/dev.db`), ultra-rapide et sans aucune installation complexe requise.

### Commandes utiles :
```bash
# Lancer en mode développement
npm run dev

# Re-générer ou appliquer des changements de base de données
npx prisma db push

# Réinitialiser et re-charger les données officielles (Code pénal, codes radio, grades)
node prisma/seed.js

# Compiler pour la production
npm run build
npm run start
```

---

## 📋 Fonctionnalités Complètes Réalisées

### 1. ⚖️ Calculateur d'Amendes & Contraventions Intéractif (`/calculator`)
- **Code Pénal Exact Intégré** :
  - **Contraventions (11 infractions)** : CP 100 à CD 19 avec amendes ($2,000 à $15,000) et sanctions complémentaires (suspension permis, confiscation matériel/stupéfiants, expulsion, remise en état).
  - **Délits (7 infractions)** : CP 200 à CP 230 avec amendes ($8,000 à $25,000), temps de cellule (15 à 40 min) et confiscations/restitutions.
  - **Crimes (5 infractions)** : CP 300 à CP 340 avec peines de 60 à 120 min de prison et amendes jusqu'à $90,000.
  - **Crimes Fédéraux (2 infractions)** : CP 400 & CP 410 (Trafic d'armes, meurtre sur agent) avec transfert au procureur fédéral, 120 à 180 min et jusqu'à $150,000 d'amende.
- **Panier d'infractions interactif** avec boutons `+` / `-` et calcul instantané en direct.
- **Plaidoyer coupable** : Réduction automatique de -25% ou -50% sur l'amende et la peine en un clic.
- **Génération automatique de PV / Contravention** : Enregistrement direct dans le casier judiciaire du citoyen sélectionné.

### 2. 👤 Fichier Central des Citoyens & Casiers Judiciaires (`/citizens`)
- Recherche instantanée par nom, prénom, téléphone ou profession.
- Fiches complètes avec photo, permis de conduire (Valide, Suspendu, Révoqué), permis de port d'arme (PPA), niveau de dangerosité.
- Historique complet des condamnations et contraventions passées.
- Liens directs avec les mandats d'arrêt actifs, les véhicules possédés et les armes déclarées.
- Notes confidentielles d'officiers modifiables et sauvegardées en direct.

### 3. 🚨 Mandats d'Arrêt & Avis de Recherche BOLO (`/warrants`)
- Émission de mandats d'arrêt judiciaires, BOLO Individus et BOLO Véhicules.
- Niveaux de dangerosité (Modéré, Dangereux, Armé et dangereux).
- Bouton "Exécuté (Appréhendé)" pour clore le mandat dès l'arrestation du suspect.

### 4. 🚗 Registre des Véhicules & DMV (`/vehicles`)
- Recherche par plaque d'immatriculation, modèle, couleur ou propriétaire.
- Gestion des statuts : *En règle*, *BOLO / Recherché*, *Volé*, *En Fourrière*.

### 5. 🔫 Registre Balistique & Armes Déclarées (`/weapons`)
- Recherche par numéro de série, type d'arme et propriétaire civil.
- Vérification automatique de la validité du PPA du titulaire.
- Suivi des armes saisies ou recherchées sur scènes de crime.

### 6. 📁 Dossiers d'Enquête & Affaires Criminelles (`/investigations`)
- Gestion des dossiers d'enquête pour inspecteurs et officiers supérieurs.
- Numérotation officielle des dossiers (INV-2026-XX).
- Regroupement des suspects, pièces à conviction, photos/preuves et suivi des statuts (*Ouvert*, *En cours*, *Transmis Justice*, *Clos*).

### 7. 🎓 Académie de Police, Formations & Badges (`/trainings`)
- **Système de Badges Débloqués** : EVOC (Interception), Air Support (Hélicoptère Henry), SWAT (David), K9 (Cynophile), FTO (Instructeur).
- **Planning interactif des sessions** : Dates, instructeurs, lieux, places disponibles, bouton "S'inscrire" pour les agents.
- **Espace Instructeur** : Les formateurs peuvent créer de nouveaux modules de formation et valider en direct la réussite des agents, attribuant automatiquement le badge sur leur profil.
- **Matrice des qualifications** : Tableau récapitulatif permettant de savoir en un coup d'œil quel agent possède quelles habilitations lors des interventions.

### 8. 📻 Fiches Mémotechniques & Codes Radio (`/radio-codes`)
- **Les 29 Ten-Codes exacts** (10-1 à 10-99) avec recherche rapide et copie en 1 clic.
- **Les indicatifs d'unités de patrouille** (Lincoln, Adam, Tango, XRay, Victor, Mary, Henry, David, Nora).
- **Les codes d'urgence** (CODE 1, CODE 2, CODE 3, CODE 4).
- **Fiches de procédure** : Énoncé exact des Droits Miranda et Protocole 10-38 Contrôle routier à haut risque (Felony Stop).

### 9. 🛡️ État-Major & Administration (`/admin`)
- **Les 13 Grades Officiels de votre serveur** :
  1. Chief of Police
  2. Assistant-Chief
  3. Deputy-Chief
  4. Commandant
  5. Capitaine
  6. Lieutenant
  7. Sergent-Chef
  8. Sergent
  9. SLO
  10. Officier III
  11. Officier II
  12. Officier I
  13. Rookie
- Attribution des promotions et nomination des instructeurs.
- Ajout ou modification des articles et montants du code pénal.

### 10. 🔄 Sélecteur d'Agent en 1 Clic & Bouton Détresse 10-99
- Dans l'en-tête, vous pouvez changer d'officier en 1 clic (Chief Marcus Vance, Capitaine Sarah Connor, Sergent-Chef David Miller, etc.) pour tester immédiatement tous les rôles et permissions sans configuration requise.
- Sélecteur de statut radio en direct : 10-8 (Disponible), 10-7 (Pause), 10-6 (Occupé), 10-10 (Fin de service).
- Bouton d'urgence 10-99 déclenchant une alerte visuelle prioritaire sur le terminal.
- Support Discord OAuth2 prévu dans le fichier `.env` pour activer la connexion par rôle Discord quand vous le souhaiterez.

---

## 🚑 Extension EMS / Hôpital (Prévue et modulaire)
L'architecture a été conçue de manière modulaire (champ `department` sur les agents, dossiers médicaux rattachables aux citoyens). Dès que vous souhaiterez activer la partie EMS, nous pourrons ajouter en un éclair les dossiers médicaux, rapports d'intervention SAMU et factures d'hospitalisation !
