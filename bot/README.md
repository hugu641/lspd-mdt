# 🚔 Bot Discord LSPD — Serveur Ruby FA

Bot Discord officiel complet conçu spécialement pour le **Los Santos Police Department (LSPD)** sur le serveur RP **Ruby FA**.

---

## 🌟 Fonctionnalités Incluses

### 1. ⚙️ Centre de Configuration Ultime (`/config`)
Vous pouvez **absolument tout configurer directement depuis Discord**, sans toucher au code ni redémarrer le bot !

* **Tableau de Bord Interactif (`/config panel`) :**
  * Affiche l'état en direct de vos salons, URL MDT, sécurité anti-pub, logs de messages, grille des salaires et packs de rôles.
  * Boutons d'action pour ouvrir les formulaires (Modaux) : URL MDT, Commandes textuelles, Packs de rôles, Whitelist et Salaires.
* **Configuration des Salons :**
  * `/config salons defcon:#defcon logs_moderation:#logs logs_messages:#logs-msg salaires:#salaires`
* **Configuration de la Journalisation des Messages :**
  * `/config logs supprimes:true modifies:true envoyes:false salon:#logs-messages`
* **Configuration du Terminal MDT :**
  * `/config mdt url:https://votre-mdt.fr`
* **Gestion de la Whitelist Anti-Pub :**
  * `/config whitelist add entree:<id_ou_lien>`
  * `/config whitelist remove entree:<id_ou_code>`
  * `/config whitelist list`
* **Gestion du Système de Tickets :**
  * `/config tickets add-cat nom:<id> label:<nom> roles:<roles> [emoji] [description]`
  * `/config tickets remove-cat nom:<id>`
  * `/config tickets list`
  * `/config tickets settings [categorie_parent:#cat] [salon_logs:#logs]`

---

### 2. 🎫 Système de Tickets avec Menu Déroulant (`/post-tickets`)
* **Déploiement du panneau :** `/post-tickets [salon]` affiche l'embed officiel avec un menu de sélection des catégories.
* **Catégorie par défaut incluse :**
  * **🎖️ Haute Hiérarchie** : Donne accès direct et exclusif aux rôles **Marshal**, **Chief of the Police**, **Assistance** et **Deputy**.
* **Entièrement modulable :** Ajoutez d'autres catégories à volonté (Plaintes, Recrutement, RH, etc.) avec leurs propres rôles autorisés !
* **Fonctionnalités des tickets :**
  * ✋ **Prendre en charge** (`btn_ticket_claim`)
  * 📑 **Génération automatique de Transcripts** (`btn_ticket_transcript`)
  * 🔒 **Fermeture propre** (`btn_ticket_close`)
  * 🔓 **Réouverture** (`btn_ticket_reopen`)
  * 🗑️ **Suppression sécurisée avec compte à rebours et archivage** (`btn_ticket_delete`)

---

### 3. 🎭 Créateur de Commandes & Packs de Rôles Automatiques (`/action` & `/cmd`)
Vous pouvez créer des commandes personnalisées qui **attribuent et retirent automatiquement une série de grades / rôles Discord à un membre** (ex: Rookie, Cadet, Officier, FTO, SWAT) !

* **Créer un pack de rôles :**
  ```text
  /config customcmd add-pack nom:rookie ajouter_roles:@Cadet @LSPD @Radio-1 retirer_roles:@Civil @Recrue reponse:Félicitations {user}, vous intégrez le LSPD !
  ```
* **Exécuter le pack sur un agent :**
  * Soit avec la commande dédiée : `/action nom:rookie membre:@Agent [motif]`
  * Soit via `/cmd nom:rookie membre:@Agent`
* **Effet automatique :**
  * Attribue instantanément tous les rôles configurés.
  * Retire les anciens rôles (ex: Civil, Recrue).
  * Publie un communiqué officiel RH avec photo de l'agent.
  * Journalise l'affectation dans votre salon de logs.

---

### 3. 📜 Traçabilité & Journalisation des Messages (Logs)
* **Messages Supprimés :** Journalise l'auteur, le salon, l'heure, le contenu texte intégral et les pièces jointes (photos/fichiers).
* **Messages Modifiés :** Affiche l'avant / après avec l'ancien et le nouveau texte ainsi que le lien direct vers le message.
* **Messages Envoyés :** Optionnel (activable ou désactivable dans `/config logs`).

---

### 4. 🚨 Système DEFCON Dynamique (`/defcon`)
* **Commande Slash** : `/defcon niveau:<1 à 5> [motif]`
* **Remplacement automatique** : Supprime l'ancienne affiche dans le salon DEFCON et publie la nouvelle.
* **Affiches officielles intégrées** :
  * **DEFCON 3**, **DEFCON 4** et **DEFCON 5** : Affiches haute résolution officielles du Gouvernement de San Andreas !
  * **DEFCON 1** et **DEFCON 2** : Embed d'alerte tactique haute priorité avec mentions `@everyone` / `@here`.
* **Statut Discord dynamique** : Le bot affiche en temps réel le DEFCON actif en statut (ex: `Regarde DEFCON 2 | LSPD Ruby FA`).

---

### 5. 💻 Panneau d'Accès Officiel MDT (`/mdt`)
* Affiche un message RP soigné et immersif aux couleurs du LSPD.
* Bouton direct **[ 🌐 Accéder au Terminal MDT ]** redirigeant vers l'URL configurée.
* Bouton interactif **[ ℹ️ Guide & Identifiants ]** pour les consignes de connexion des agents.

---

### 6. 💵 Grille des Salaires Interactive (`/post-salaires`)
* Panneau permanent officiel du Service Paye / RH.
* Bouton interactif pour les agents : **[ 💰 Découvrir mon salaire & la grille ]**.
* **Affichage éphémère** : L'embed s'affiche uniquement pour l'agent qui a cliqué.
* Modifiable à volonté via `/config salaire add/remove`.

---

### 7. 🛡️ Sécurité Anti-Pub (Whitelist & Ban 3 Strikes)
* Détecte et bloque tous les liens d'invitations Discord non autorisés.
* Vérification de l'ID réel du serveur de destination.
* **Sanction graduelle** : 1er et 2ème avertissement en MP (`1/3`, `2/3`), puis **Bannissement automatique** au 3ème strike (`3/3`).
* Commandes staff : `/warns check <membre>` et `/warns reset <membre>`.

---

## 🚀 Guide de Lancement

1. **Remplir `bot/.env`** avec votre Token et Client ID.
2. **Déployer les commandes :**
   ```bash
   npm run deploy
   ```
3. **Démarrer le bot :**
   ```bash
   npm start
   ```
