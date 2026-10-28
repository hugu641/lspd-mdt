const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getWarnings, resetWarnings } = require('../utils/warningManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Consulte ou réinitialise les avertissements d\'un membre (Anti-Pub)')
    .addSubcommand(sub =>
      sub.setName('check')
        .setDescription('Afficher les avertissements d\'un membre')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre à vérifier').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Réinitialiser à zéro les avertissements d\'un membre')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre à réinitialiser').setRequired(true))
    ),

  async execute(interaction) {
    const member = interaction.member;
    const isStaff = member.permissions.has(PermissionFlagsBits.KickMembers) ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      (config.adminRoleIds.length > 0 && member.roles.cache.some(r => config.adminRoleIds.includes(r.id)));

    if (!isStaff) {
      return interaction.reply({
        content: '❌ **Accès Refusé :** Seule l\'équipe de modération/staff peut gérer les avertissements.',
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('membre');

    if (sub === 'check') {
      const info = getWarnings(targetUser.id);
      const embed = new EmbedBuilder()
        .setTitle(`🛡️ DOSSIER DISCIPLINAIRE : ${targetUser.username}`)
        .setColor(info.count >= 2 ? config.colors.danger : (info.count === 1 ? config.colors.warning : config.colors.success))
        .addFields(
          { name: 'Utilisateur', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
          { name: 'Avertissements Anti-Pub', value: `\`${info.count} / 3\``, inline: true },
          { name: 'Statut', value: info.count >= 3 ? '🔴 Seuil de bannissement atteint' : (info.count > 0 ? '🟡 Sous surveillance' : '🟢 Casier vierge'), inline: true }
        )
        .setFooter({ text: 'Système Anti-Pub LSPD' })
        .setTimestamp();

      if (info.history && info.history.length > 0) {
        const historyText = info.history.map((h, i) => 
          `**#${i + 1}** [${new Date(h.timestamp).toLocaleDateString('fr-FR')}] : ${h.reason} *(Code: \`${h.invite || 'N/A'}\`)*`
        ).join('\n');
        embed.addFields({ name: 'Historique des infractions', value: historyText });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'reset') {
      const success = resetWarnings(targetUser.id);
      return interaction.reply({
        content: success 
          ? `✅ Les avertissements de ${targetUser} ont été réinitialisés à 0.` 
          : `ℹ️ ${targetUser} n'avait aucun avertissement enregistré.`,
        ephemeral: true
      });
    }
  }
};
