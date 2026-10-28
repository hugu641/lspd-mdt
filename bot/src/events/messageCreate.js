const { EmbedBuilder } = require('discord.js');
const { handleAntiInvite } = require('../utils/antiInvite');
const { getCustomCommands } = require('../utils/settingsManager');
const { logMessageCreate } = require('../utils/logsManager');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // 1. Filtrage de sécurité Anti-Pub
    await handleAntiInvite(message, client);

    // 2. Journalisation d'envoi de messages (si activé dans /config logs)
    await logMessageCreate(message);

    // Ignorer les bots et les MPs pour les commandes préfixées
    if (message.author.bot || !message.guild) return;

    // 2. Gestion des Commandes Personnalisées par Préfixe (ex: !radio, !codes, etc.)
    const prefix = '!';
    if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();

      const customCmds = getCustomCommands();
      const cmd = customCmds[commandName];

      if (cmd) {
        const embed = new EmbedBuilder()
          .setColor(0x0A2540)
          .setDescription(cmd.response)
          .setFooter({ text: `LSPD • Commande !${cmd.name} demandée par ${message.author.displayName}` })
          .setTimestamp();

        message.channel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  }
};
