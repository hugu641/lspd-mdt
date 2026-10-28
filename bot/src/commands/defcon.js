const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateDefcon } = require('../utils/defconManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('defcon')
    .setDescription('Modifie le niveau d\'alerte DEFCON et actualise l\'affiche officielle')
    .addIntegerOption(opt =>
      opt.setName('niveau')
        .setDescription('Niveau d\'alerte (1 = Urgence maximale, 5 = Calme plat)')
        .setRequired(true)
        .addChoices(
          { name: 'DEFCON 1 - Alerte Maximale / Attaque / Émeute', value: 1 },
          { name: 'DEFCON 2 - Menace Imminente / Risque Élevé', value: 2 },
          { name: 'DEFCON 3 - Vigilance Renforcée / Tension', value: 3 },
          { name: 'DEFCON 4 - Vigilance Normale Accrue', value: 4 },
          { name: 'DEFCON 5 - Service Normal / Calme Plat', value: 5 }
        )
    )
    .addStringOption(opt =>
      opt.setName('motif')
        .setDescription('Raison ou consignes particulières du changement d\'alerte')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Vérification des permissions
    const member = interaction.member;
    const isStaff = member.permissions.has(PermissionFlagsBits.Administrator) ||
      (config.adminRoleIds.length > 0 && member.roles.cache.some(r => config.adminRoleIds.includes(r.id)));

    if (!isStaff) {
      return interaction.reply({
        content: '❌ **Accès Refusé :** Seul le Haut Commandement ou l\'État-Major LSPD peut modifier le niveau DEFCON.',
        ephemeral: true
      });
    }

    const level = interaction.options.getInteger('niveau');
    const reason = interaction.options.getString('motif') || '';

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await updateDefcon(interaction.client, interaction.guild, level, reason, member);
      return interaction.editReply({
        content: `✅ **Succès :** L'alerte **DEFCON ${level}** a été publiée avec succès dans le salon dédié ! L'ancienne affiche a été retirée.`,
      });
    } catch (err) {
      console.error('Erreur commande defcon :', err);
      return interaction.editReply({
        content: `❌ **Erreur :** ${err.message}`,
      });
    }
  }
};
