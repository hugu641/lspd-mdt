const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  }
}

if (!config.token || !config.clientId) {
  console.error('❌ Erreur : DISCORD_BOT_TOKEN ou DISCORD_CLIENT_ID manquant dans le fichier .env !');
  process.exit(1);
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`⏳ Déploiement de ${commands.length} commandes Slash (/) en cours...`);

    let data;
    if (config.guildId) {
      // Déploiement instantané sur le serveur de test / serveur LSPD
      data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`✅ ${data.length} commandes Slash déployées avec succès sur le serveur (${config.guildId}) !`);
    } else {
      // Déploiement global (peut prendre quelques minutes à se propager sur Discord)
      data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log(`✅ ${data.length} commandes Slash déployées mondialement !`);
    }
  } catch (error) {
    console.error('❌ Erreur lors du déploiement des commandes :', error);
  }
})();
