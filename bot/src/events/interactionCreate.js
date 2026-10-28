const { EmbedBuilder } = require('discord.js');
const { buildSalairesDetailsEmbed } = require('../commands/salaires');
const config = require('../config');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // 1. Gestion des Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Erreur lors de l'exécution de ${interaction.commandName} :`, error);
        const replyPayload = {
          content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
          ephemeral: true
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload).catch(() => {});
        } else {
          await interaction.reply(replyPayload).catch(() => {});
        }
      }
      return;
    }

    // 2. Gestion des Boutons
    if (interaction.isButton()) {
      if (interaction.customId === 'btn_salaires') {
        const salairesEmbed = buildSalairesDetailsEmbed();
        return interaction.reply({
          embeds: [salairesEmbed],
          ephemeral: true // Visible UNIQUEMENT par l'agent qui a cliqué
        });
      }

      if (interaction.customId === 'btn_mdt_help') {
        const helpEmbed = new EmbedBuilder()
          .setTitle('ℹ️ GUIDE DE CONNEXION — TERMINAL MDT')
          .setColor(config.colors.info)
          .setDescription(
            `### 🔑 Identifiants & Accès Officier :\n\n` +
            `1. Cliquez sur le bouton bleu **[Accéder au Terminal MDT]**.\n` +
            `2. Entrez votre **Matricule** (ex: \`412\`) et votre mot de passe temporaire fourni par l'Académie.\n` +
            `3. Ou cliquez sur le bouton de connexion rapide avec votre compte **Discord certifié LSPD**.\n\n` +
            `⚠️ *En cas de perte de mot de passe ou d'oubli de matricule, veuillez contacter le Service Informatique ou votre Superviseur.*`
          )
          .setFooter({ text: 'Los Santos Police Department • Division des Télécommunications' });

        return interaction.reply({
          embeds: [helpEmbed],
          ephemeral: true
        });
      }
    }
  }
};
