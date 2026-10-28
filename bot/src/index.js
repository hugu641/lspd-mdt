const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Requis pour analyser les messages et intercepter les pubs
    GatewayIntentBits.GuildMembers,    // Requis pour les bans automatiques et la gestion des rôles
    GatewayIntentBits.DirectMessages   // Requis pour envoyer les avertissements en MP
  ],
  partials: [
    Partials.Channel,
    Partials.Message
  ]
});

client.commands = new Collection();

// 1. Chargement des commandes Slash
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`[COMMANDE CHARGÉE] /${command.data.name}`);
  } else {
    console.warn(`[AVERTISSEMENT] La commande ${filePath} n'a pas les propriétés requises "data" ou "execute".`);
  }
}

// 2. Chargement des événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`[ÉVÉNEMENT CHARGÉ] ${event.name}`);
}

// Événement de démarrage
client.once('ready', () => {
  console.log(`===============================================`);
  console.log(`🚨 BOT LSPD EN LIGNE : Connecté sous ${client.user.tag}`);
  console.log(`🛡️ Système Anti-Pub : ACTIF (Seuil 3 avertissements = BAN)`);
  console.log(`🚔 Système DEFCON : OPÉRATIONNEL`);
  console.log(`💻 Terminal MDT : OPÉRATIONNEL (${config.mdtUrl})`);
  console.log(`💰 Système des Salaires : OPÉRATIONNEL`);
  console.log(`===============================================`);

  client.user.setPresence({
    activities: [{
      name: 'Secrétaire LSPD | Ruby FA',
      state: 'Secrétaire LSPD | Ruby FA',
      type: ActivityType.Custom
    }],
    status: 'online'
  });
});

// Gestion des erreurs globales pour éviter les crashs
process.on('unhandledRejection', error => {
  console.error('[UNHANDLED REJECTION]', error);
});

process.on('uncaughtException', error => {
  console.error('[UNCAUGHT EXCEPTION]', error);
});

// Connexion du bot
if (!config.token) {
  console.warn('⚠️ Aucun token trouvé dans DISCORD_BOT_TOKEN. Veuillez configurer le fichier .env avant de lancer le bot.');
} else {
  client.login(config.token).catch(err => {
    console.error('❌ Échec de la connexion du bot Discord :', err.message);
  });
}
