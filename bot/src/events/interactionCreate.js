const { 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { buildSalairesDetailsEmbed } = require('../commands/salaires');
const { getSettings, setMdtUrl, addCustomCommand } = require('../utils/settingsManager');
const { addEntry } = require('../utils/whitelistManager');
const { addOrUpdateGrade } = require('../utils/salairesManager');
const config = require('../config');

function extractRoleIds(str) {
  if (!str) return [];
  const matches = [...str.matchAll(/<@&(\d+)>|(\b\d{16,21}\b)/g)];
  return matches.map(m => m[1] || m[2]);
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // 1. Gestion de l'autocomplétion (pour /cmd)
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command && typeof command.autocomplete === 'function') {
        try {
          await command.autocomplete(interaction);
        } catch (err) {
          console.error(`Erreur autocomplétion ${interaction.commandName} :`, err);
        }
      }
      return;
    }

    // 2. Gestion des Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Erreur exécution /${interaction.commandName} :`, error);
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

    // 3. Gestion des Boutons
    if (interaction.isButton()) {
      // Bouton Salaires (pour tous les officiers)
      if (interaction.customId === 'btn_salaires') {
        const salairesEmbed = buildSalairesDetailsEmbed();
        return interaction.reply({
          embeds: [salairesEmbed],
          ephemeral: true
        });
      }

      // Bouton Aide MDT
      if (interaction.customId === 'btn_mdt_help') {
        const settings = getSettings();
        const helpEmbed = new EmbedBuilder()
          .setTitle('ℹ️ GUIDE DE CONNEXION — TERMINAL MDT')
          .setColor(config.colors.info)
          .setDescription(
            `### 🔑 Identifiants & Accès Officier :\n\n` +
            `1. Cliquez sur le bouton bleu **[Accéder au Terminal MDT]**.\n` +
            `2. Entrez votre **Matricule** (ex: \`412\`) et votre mot de passe temporaire fourni par l'Académie.\n` +
            `3. Ou connectez-vous avec votre compte **Discord certifié LSPD**.\n\n` +
            `🌐 **Lien actuel :** \`${settings.mdt?.url || config.mdtUrl}\``
          )
          .setFooter({ text: 'Los Santos Police Department • Division des Systèmes d\'Information' });

        return interaction.reply({
          embeds: [helpEmbed],
          ephemeral: true
        });
      }

      // --- Boutons du Panneau /config ---
      // Vérification permissions staff
      const isStaff = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (config.adminRoleIds.length > 0 && interaction.member.roles.cache.some(r => config.adminRoleIds.includes(r.id)));

      if (interaction.customId.startsWith('cfg_btn_') && !isStaff) {
        return interaction.reply({
          content: '❌ Seuls les administrateurs et membres de l\'État-Major ont accès à ces réglages.',
          ephemeral: true
        });
      }

      // Actualiser le dashboard
      if (interaction.customId === 'cfg_btn_refresh') {
        const { buildConfigDashboard } = require('../commands/config');
        const { embed, components } = buildConfigDashboard(interaction.guild);
        return interaction.update({ embeds: [embed], components: components });
      }

      // Modal URL MDT
      if (interaction.customId === 'cfg_btn_mdt') {
        const settings = getSettings();
        const modal = new ModalBuilder()
          .setCustomId('modal_cfg_mdt')
          .setTitle('Configuration URL du MDT');

        const urlInput = new TextInputBuilder()
          .setCustomId('input_mdt_url')
          .setLabel('URL du Terminal MDT')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('https://mdt.lspd-bfa.fr ou http://localhost:3005')
          .setValue(settings.mdt?.url || '')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
        return interaction.showModal(modal);
      }

      // Modal Commande Personnalisée
      if (interaction.customId === 'cfg_btn_customcmd') {
        const modal = new ModalBuilder()
          .setCustomId('modal_cfg_customcmd')
          .setTitle('Créer une Commande Rapide');

        const nameInput = new TextInputBuilder()
          .setCustomId('input_cmd_name')
          .setLabel('Nom de la commande (sans espace)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: tenues, frequences, consignes')
          .setRequired(true);

        const descInput = new TextInputBuilder()
          .setCustomId('input_cmd_desc')
          .setLabel('Description de la commande')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: Affiche les codes tenues d\'intervention')
          .setRequired(false);

        const responseInput = new TextInputBuilder()
          .setCustomId('input_cmd_response')
          .setLabel('Réponse envoyée par le bot')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Contenu du message ou consignes RP...')
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(nameInput),
          new ActionRowBuilder().addComponents(descInput),
          new ActionRowBuilder().addComponents(responseInput)
        );
        return interaction.showModal(modal);
      }

      // Modal Whitelist
      if (interaction.customId === 'cfg_btn_whitelist') {
        const modal = new ModalBuilder()
          .setCustomId('modal_cfg_whitelist')
          .setTitle('Ajouter à la Whitelist');

        const input = new TextInputBuilder()
          .setCustomId('input_whitelist_entry')
          .setLabel('Lien d\'invitation ou ID du Serveur')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: https://discord.gg/abcde ou 1505337227192832051')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      // Modal Salaires
      if (interaction.customId === 'cfg_btn_salaires') {
        const modal = new ModalBuilder()
          .setCustomId('modal_cfg_salaires')
          .setTitle('Ajouter/Modifier un Salaire');

        const gradeInput = new TextInputBuilder()
          .setCustomId('input_salaire_grade')
          .setLabel('Nom du Grade')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: Sergent I')
          .setRequired(true);

        const payInput = new TextInputBuilder()
          .setCustomId('input_salaire_montant')
          .setLabel('Salaire de base')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: 4 200$')
          .setRequired(true);

        const primeInput = new TextInputBuilder()
          .setCustomId('input_salaire_prime')
          .setLabel('Prime de service (facultatif)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: 600$')
          .setRequired(false);

        const descInput = new TextInputBuilder()
          .setCustomId('input_salaire_desc')
          .setLabel('Description du poste')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: Superviseur de patrouille')
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(gradeInput),
          new ActionRowBuilder().addComponents(payInput),
          new ActionRowBuilder().addComponents(primeInput),
          new ActionRowBuilder().addComponents(descInput)
        );
        return interaction.showModal(modal);
      }

      // Modal Pack de Rôles
      if (interaction.customId === 'cfg_btn_rolepack') {
        const modal = new ModalBuilder()
          .setCustomId('modal_cfg_rolepack')
          .setTitle('Créer un Pack de Rôles');

        const nameInput = new TextInputBuilder()
          .setCustomId('input_rolepack_name')
          .setLabel('Nom du Pack (ex: rookie, cadet, fto)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: rookie')
          .setRequired(true);

        const addRolesInput = new TextInputBuilder()
          .setCustomId('input_rolepack_add')
          .setLabel('Rôles à donner (mentionnez ou IDs)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: @Cadet @LSPD (ou IDs séparés par espace)')
          .setRequired(true);

        const removeRolesInput = new TextInputBuilder()
          .setCustomId('input_rolepack_remove')
          .setLabel('Rôles à retirer (mentionnez ou IDs)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('ex: @Civil @Recrue (facultatif)')
          .setRequired(false);

        const responseInput = new TextInputBuilder()
          .setCustomId('input_rolepack_response')
          .setLabel('Message d\'annonce ({user} = l\'agent)')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('ex: Félicitations {user}, vous intégrez le LSPD en tant que Rookie !')
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(nameInput),
          new ActionRowBuilder().addComponents(addRolesInput),
          new ActionRowBuilder().addComponents(removeRolesInput),
          new ActionRowBuilder().addComponents(responseInput)
        );
        return interaction.showModal(modal);
      }

      // Aide Salons
      if (interaction.customId === 'cfg_btn_channels') {
        return interaction.reply({
          content: 'ℹ️ **Pour configurer les salons :**\nUtilisez la commande `/config salons defcon:#salon logs:#salon salaires:#salon`.',
          ephemeral: true
        });
      }
    }

    // 4. Gestion des Soumissions de Modaux
    if (interaction.isModalSubmit()) {
      // Sauvegarde URL MDT
      if (interaction.customId === 'modal_cfg_mdt') {
        const newUrl = interaction.fields.getTextInputValue('input_mdt_url');
        setMdtUrl(newUrl);
        return interaction.reply({
          content: `✅ L'URL du Terminal MDT a été mise à jour : \`${newUrl}\``,
          ephemeral: true
        });
      }

      // Sauvegarde Commande Custom
      if (interaction.customId === 'modal_cfg_customcmd') {
        const name = interaction.fields.getTextInputValue('input_cmd_name');
        const desc = interaction.fields.getTextInputValue('input_cmd_desc') || 'Commande LSPD';
        const response = interaction.fields.getTextInputValue('input_cmd_response');

        try {
          const cmd = addCustomCommand(name, response, desc);
          return interaction.reply({
            content: `✅ **Commande créée !**\nUtilisez dès maintenant \`!${cmd.name}\` ou \`/cmd nom:${cmd.name}\``,
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
        }
      }

      // Sauvegarde Whitelist
      if (interaction.customId === 'modal_cfg_whitelist') {
        const entry = interaction.fields.getTextInputValue('input_whitelist_entry');
        const res = addEntry(entry);
        if (res.type === 'already_exists') {
          return interaction.reply({ content: `ℹ️ L'entrée \`${entry}\` est déjà dans la whitelist.`, ephemeral: true });
        }
        return interaction.reply({ content: `✅ Entrée ajoutée à la whitelist : \`${res.value}\` (${res.type})`, ephemeral: true });
      }

      // Sauvegarde Grade Salaire
      if (interaction.customId === 'modal_cfg_salaires') {
        const grade = interaction.fields.getTextInputValue('input_salaire_grade');
        const pay = interaction.fields.getTextInputValue('input_salaire_montant');
        const prime = interaction.fields.getTextInputValue('input_salaire_prime') || 'N/A';
        const desc = interaction.fields.getTextInputValue('input_salaire_desc') || '';

        const item = addOrUpdateGrade(grade, pay, prime, desc);
        return interaction.reply({
          content: `✅ Grade enregistré dans la grille : **${item.rank}** (\`${item.salary}\` | Prime : \`${item.prime}\`)`,
          ephemeral: true
        });
      }

      // Sauvegarde Pack de Rôles
      if (interaction.customId === 'modal_cfg_rolepack') {
        const name = interaction.fields.getTextInputValue('input_rolepack_name');
        const addRaw = interaction.fields.getTextInputValue('input_rolepack_add');
        const removeRaw = interaction.fields.getTextInputValue('input_rolepack_remove') || '';
        const response = interaction.fields.getTextInputValue('input_rolepack_response') || "🎖️ **AFFECTATION ROOKIE :** L'agent {user} a reçu son paquetage !";

        const addRoleIds = extractRoleIds(addRaw);
        const removeRoleIds = extractRoleIds(removeRaw);

        if (addRoleIds.length === 0) {
          return interaction.reply({
            content: '❌ Vous devez spécifier au moins un rôle valide à ajouter (mention @Role ou ID).',
            ephemeral: true
          });
        }

        try {
          const pack = addCustomCommand(name, response, `Pack de rôles ${name}`, 'role_action', addRoleIds, removeRoleIds);
          return interaction.reply({
            content: `✅ **Pack de rôles créé avec succès !**\n` +
              `> 🎭 Nom : \`${pack.name}\`\n` +
              `> ➕ Rôles ajoutés : ${addRoleIds.map(id => `<@&${id}>`).join(', ')}\n` +
              `> 🚀 **Utilisation :** \`/action nom:${pack.name} membre:@Agent\``,
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
        }
      }
    }
  }
};
