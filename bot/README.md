# 🚔 Bot Discord LSPD — Serveur BFA RP

Bot Discord officiel conçu spécialement pour le **Los Santos Police Department (LSPD)** sur le serveur RP **BFA**.

---

## 🌟 Fonctionnalités Incluses

### 1. 🚨 Système DEFCON Dynamique (`/defcon`)
* **Commande Slash** : `/defcon <niveau 1 à 5> [motif facultatif]`
* **Remplacement automatique** : Le bot supprime automatiquement l'ancienne affiche DEFCON dans le salon d'annonce et publie la nouvelle.
* **Visuels et Niveaux RP** :
  * **DEFCON 1** : Alerte Maximale / État d'urgence (Rouge vif, mention `@everyone`, consignes armement lourd, patrouilles 2-4 agents, couvre-feu).
  * **DEFCON 2** : Alerte Élevée / Menace Imminente (Orange, mention `@here`, binôme obligatoire).
  * **DEFCON 3** : Vigilance Renforcée / Tension Modérée (Jaune).
  * **DEFCON 4** : Vigilance Normale Accrue (Bleu).
  * **DEFCON 5** : Service Normal / Calme Plat (Vert).
* **Statut Discord dynamique** : Le statut du bot s'ajuste automatiquement (ex: `Regarde DEFCON 2 | LSPD BFA`).

---

### 2. 💻 Panneau d'Accès Officiel MDT (`/mdt`)
* Affiche un message RP soigné et immersif aux couleurs du LSPD.
* Bouton direct **[ 🌐 Accéder au Terminal MDT ]** redirigeant directement vers votre site MDT.
* Bouton d'aide interactif **[ ℹ️ Guide & Identifiants ]** qui donne en message privé/éphémère les consignes de connexion pour les officiers.

---

### 3. 💵 Grille des Salaires Interactive (`/post-salaires`)
* Commande pour poster le panneau permanent du Service Paye / RH.
* Les membres ont un bouton interactif : **[ 💰 Découvrir mon salaire & la grille ]**.
* **Affichage éphémère** : Quand un agent clique sur le bouton, l'embed s'affiche uniquement pour lui (sans spammer le salon public).
* Fichier de configuration simple : [data/salaires.json](file:///d:/Projet%20Code/MDT/bot/data/salaires.json) où vous pouvez ajuster les grades, montants et primes.

---

### 4. 🛡️ Système de Sécurité Anti-Pub (Whitelist & Ban 3 Strikes)
* Détecte instantanément tous les formats de liens Discord (`discord.gg/...`, `discord.com/invite/...`, etc.).
* **Vérification intelligente** : Résout l'invitation auprès de Discord pour vérifier l'ID réel du serveur de destination (ce qui permet d'autoriser un serveur même si un nouveau lien d'invitation est généré).
* **Whitelist personnalisable** : Gérée dans [data/whitelist.json](file:///d:/Projet%20Code/MDT/bot/data/whitelist.json).
* **Sanction graduelle** :
  * **Infraction 1** : Suppression instantanée + MP d'avertissement (`1 / 3`).
  * **Infraction 2** : Suppression instantanée + MP d'avertissement renforcé (`2 / 3`).
  * **Infraction 3** : Suppression instantanée + MP d'expulsion + **Bannissement automatique** du serveur.
* **Journalisation** : Envoi d'un rapport détaillé dans votre salon de logs de modération.
* **Gestion du staff** : Commandes `/warns check <membre>` et `/warns reset <membre>`.

---

## 🚀 Installation & Démarrage

### 1. Remplir le fichier `.env`
Copiez le fichier `.env.example` en `.env` dans le dossier `bot/` :
```ini
DISCORD_BOT_TOKEN="VOTRE_TOKEN_ICI"
DISCORD_CLIENT_ID="VOTRE_ID_APPLICATION_ICI"
DISCORD_GUILD_ID="VOTRE_ID_SERVEUR_DISCORD"

DEFCON_CHANNEL_ID="ID_SALON_DEFCON"
LOGS_CHANNEL_ID="ID_SALON_LOGS"
SALAIRES_CHANNEL_ID="ID_SALON_SALAIRES"

ADMIN_ROLE_IDS="ID_ROLE_COMMANDANT,ID_ROLE_CAPITAINE"
INVITE_BYPASS_ROLE_IDS="ID_ROLE_STAFF"

MDT_URL="http://localhost:3005"
```

### 2. Déployer les commandes Slash
```bash
npm run deploy
```

### 3. Lancer le bot
```bash
npm start
```
