const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getCustomCommands, getSettings } = require('../utils/settingsManager');
const { getLogChannel } = require('../utils/logsManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('action')
    .setDescription('Exécute un pack de rôles automatique sur un agent (ex: rookie, cadet, officier...)')
    .addStringOption(opt =>
      opt.setName('nom')
        .setDescription('Nom de l\'action ou du pack (ex: rookie)')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('L\'agent ou membre qui recevra les rôles')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motif')
        .setDescription('Motif RP ou note de service (facultatif)')
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const customCmds = getCustomCommands();
    const rolePacks = Object.keys(customCmds).filter(k => customCmds[k].type === 'role_action');
    const filtered = rolePacks.filter(choice => choice.toLowerCase().includes(focusedValue));

    await interaction.respond(
      filtered.slice(0, 25).map(choice => ({
        name: `🎭 ${choice} — ${customCmds[choice].description || 'Pack de rôles'}`,
        value: choice
      }))
    );
  },

  async execute(interaction) {
    // Vérification des permissions
    const member = interaction.member;
    const settings = getSettings();
    const adminRoles = (settings.roles?.adminRoleIds && settings.roles.adminRoleIds.length > 0)
      ? settings.roles.adminRoleIds
      : config.adminRoleIds;

    const isStaff = member.permissions.has(PermissionFlagsBits.ManageRoles) ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      (adminRoles.length > 0 && member.roles.cache.some(r => adminRoles.includes(r.id)));

    if (!isStaff) {
      return interaction.reply({
        content: '❌ **Accès Refusé :** Seuls les instructeurs, superviseurs et membres autorisés peuvent attribuer des packs de rôles.',
        ephemeral: true
      });
    }

    const actionName = interaction.options.getString('nom').toLowerCase();
    const targetUser = interaction.options.getUser('membre');
    const reason = interaction.options.getString('motif') || 'Attribution de grade / pack de service';

    const customCmds = getCustomCommands();
    const pack = customCmds[actionName];

    if (!pack || pack.type !== 'role_action') {
      return interaction.reply({
        content: `❌ Le pack de rôles \`${actionName}\` est introuvable. Utilisez \`/config customcmd list\` pour voir les packs existants.`,
        ephemeral: true
      });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({ content: '❌ Ce membre est introuvable sur le serveur.', ephemeral: true });
    }

    await interaction.deferReply();

    const addedRolesList = [];
    const removedRolesList = [];
    const errorsList = [];

    // 1. Ajout des rôles configurés
    if (Array.isArray(pack.addRoleIds) && pack.addRoleIds.length > 0) {
      for (const rId of pack.addRoleIds) {
        const role = interaction.guild.roles.cache.get(rId);
        if (role) {
          try {
            await targetMember.roles.add(role);
            addedRolesList.push(`• <@&${role.id}>`);
          } catch (err) {
            errorsList.push(`Impossible d'ajouter <@&${role.id}> (Hiérarchie Discord trop basse).`);
          }
        }
      }
    }

    // 2. Retrait des rôles configurés
    if (Array.isArray(pack.removeRoleIds) && pack.removeRoleIds.length > 0) {
      for (const rId of pack.removeRoleIds) {
        const role = interaction.guild.roles.cache.get(rId);
        if (role) {
          try {
            await targetMember.roles.remove(role);
            removedRolesList.push(`• ~~<@&${role.id}>~~`);
          } catch (err) {
            errorsList.push(`Impossible de retirer <@&${role.id}>.`);
          }
        }
      }
    }

    // 3. Message de confirmation RP
    let responseText = pack.response || "🎖️ **AFFECTATION DE SERVICE :** L'agent {user} a reçu son paquetage !";
    responseText = responseText
      .replace(/{user}/g, `<@${targetMember.id}>`)
      .replace(/{author}/g, `<@${interaction.user.id}>`);

    const embed = new EmbedBuilder()
      .setTitle(`🎖️ [LSPD RESSOURCES HUMAINES] PACK DÉCERNÉ : ${actionName.toUpperCase()}`)
      .setColor(0x10B981)
      .setDescription(
        `${responseText}\n\n` +
        `**Agent concerné :** <@${targetMember.id}>\n` +
        `**Instructeur / Superviseur :** <@${interaction.user.id}>\n` +
        (reason ? `**Note de service :** *« ${reason} »*\n` : '')
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Secrétaire LSPD | Ruby FA • Division des Ressources Humaines & Formation' })
      .setTimestamp();

    if (addedRolesList.length > 0) {
      embed.addFields({ name: '✅ Rôles Attribués', value: addedRolesList.join('\n'), inline: true });
    }
    if (removedRolesList.length > 0) {
      embed.addFields({ name: '⛔ Rôles Retirés', value: removedRolesList.join('\n'), inline: true });
    }
    if (errorsList.length > 0) {
      embed.addFields({ name: '⚠️ Alertes Permissions', value: errorsList.join('\n'), inline: false });
    }

    await interaction.editReply({ embeds: [embed] });

    // 4. Log dans le salon de logs
    const logChannel = getLogChannel(interaction.guild, 'moderation');
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle(`📋 LOG : Pack de Rôles Attribué (${actionName})`)
        .setColor(0x3B82F6)
        .addFields(
          { name: 'Cible', value: `<@${targetMember.id}> (\`${targetMember.id}\`)`, inline: true },
          { name: 'Modérateur', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Pack', value: `\`${actionName}\``, inline: true }
        )
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }
};
