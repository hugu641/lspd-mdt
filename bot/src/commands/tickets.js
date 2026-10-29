const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { buildTicketPanel } = require('../utils/ticketManager');
const config = require('../config');
const { getSettings } = require('../utils/settingsManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('post-tickets')
    .setDescription('Publie le panneau officiel de création de tickets LSPD avec menu déroulant')
    .addChannelOption(opt =>
      opt.setName('salon')
        .setDescription('Salon où envoyer le panneau (laisser vide pour le salon actuel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const settings = getSettings();
    const adminRoles = (settings.roles?.adminRoleIds && settings.roles.adminRoleIds.length > 0)
      ? settings.roles.adminRoleIds
      : config.adminRoleIds;

    const isStaff = member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageChannels) ||
      (adminRoles.length > 0 && member.roles.cache.some(r => adminRoles.includes(r.id)));

    if (!isStaff) {
      return interaction.reply({
        content: '❌ **Accès Refusé :** Seul le staff ou le Haut Commandement peut déployer le panneau de tickets.',
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    const { embed, components } = buildTicketPanel();

    if (targetChannel.id === interaction.channelId) {
      await interaction.reply({ embeds: [embed], components: components });
    } else {
      await targetChannel.send({ embeds: [embed], components: components });
      await interaction.reply({
        content: `✅ Le panneau de tickets a été envoyé avec succès dans ${targetChannel} !`,
        ephemeral: true
      });
    }
  }
};
