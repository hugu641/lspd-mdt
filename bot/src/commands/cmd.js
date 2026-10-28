const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCustomCommands } = require('../utils/settingsManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cmd')
    .setDescription('Exécute une commande rapide ou personnalisée de la LSPD')
    .addStringOption(opt =>
      opt.setName('nom')
        .setDescription('Nom de la commande')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Agent ciblé (obligatoire pour les packs de rôles)')
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const customCmds = getCustomCommands();
    const choices = Object.keys(customCmds);
    const filtered = choices.filter(choice => choice.toLowerCase().includes(focusedValue));

    await interaction.respond(
      filtered.slice(0, 25).map(choice => ({
        name: `${choice} — ${customCmds[choice].description || 'Commande LSPD'}`,
        value: choice
      }))
    );
  },

  async execute(interaction) {
    const name = interaction.options.getString('nom').toLowerCase();
    const targetUser = interaction.options.getUser('membre');
    const customCmds = getCustomCommands();
    const cmd = customCmds[name];

    if (!cmd) {
      return interaction.reply({
        content: `❌ La commande \`${name}\` n'existe pas. Utilisez \`/config customcmd list\` pour voir les commandes disponibles.`,
        ephemeral: true
      });
    }

    // Si c'est un pack de rôles
    if (cmd.type === 'role_action') {
      if (!targetUser) {
        return interaction.reply({
          content: `⚠️ La commande \`${name}\` est un **pack de rôles automatique**.\nVous devez spécifier l'agent ciblé : \`/action nom:${name} membre:@Agent\` ou \`/cmd nom:${name} membre:@Agent\`.`,
          ephemeral: true
        });
      }
      const actionCommand = require('./action');
      return actionCommand.execute(interaction);
    }

    const embed = new EmbedBuilder()
      .setColor(0x0A2540)
      .setDescription(cmd.response)
      .setFooter({ text: `Secrétaire LSPD | Ruby FA • Commande !${cmd.name}` });

    return interaction.reply({ embeds: [embed] });
  }
};
