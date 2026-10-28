const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const { 
  getSettings, 
  setChannel, 
  setMdtUrl, 
  addCustomCommand, 
  removeCustomCommand, 
  getCustomCommands,
  setLoggingOption 
} = require('../utils/settingsManager');
const { getWhitelist, addEntry, removeEntry } = require('../utils/whitelistManager');
const { getSalaires, addOrUpdateGrade, removeGrade } = require('../utils/salairesManager');
const config = require('../config');

function checkPermissions(interaction) {
  const member = interaction.member;
  const settings = getSettings();
  const adminRoles = (settings.roles?.adminRoleIds && settings.roles.adminRoleIds.length > 0)
    ? settings.roles.adminRoleIds
    : config.adminRoleIds;

  return member.permissions.has(PermissionFlagsBits.Administrator) ||
    (adminRoles.length > 0 && member.roles.cache.some(r => adminRoles.includes(r.id)));
}

function extractRoleIds(str) {
  if (!str) return [];
  const matches = [...str.matchAll(/<@&(\d+)>|(\b\d{16,21}\b)/g)];
  return matches.map(m => m[1] || m[2]);
}

function buildConfigDashboard(guild) {
  const settings = getSettings();
  const whitelist = getWhitelist();
  const salaires = getSalaires();
  const customCmds = getCustomCommands();

  const defconCh = settings.channels?.defcon ? `<#${settings.channels.defcon}>` : '`Non configuré`';
  const logsModCh = (settings.channels?.logs_moderation || settings.channels?.logs) ? `<#${settings.channels.logs_moderation || settings.channels.logs}>` : '`Non configuré`';
  const logsMsgCh = settings.channels?.logs_messages ? `<#${settings.channels.logs_messages}>` : '`Non configuré`';
  const salairesCh = settings.channels?.salaires ? `<#${settings.channels.salaires}>` : '`Non configuré`';

  const whitelistCount = (whitelist.allowedGuildIds?.length || 0) + (whitelist.allowedInviteCodes?.length || 0);
  const gradesCount = salaires.grades?.length || 0;

  const textCmds = Object.keys(customCmds).filter(k => customCmds[k].type !== 'role_action');
  const rolePacks = Object.keys(customCmds).filter(k => customCmds[k].type === 'role_action');

  const logDel = settings.logging?.messageDelete !== false ? '✅' : '❌';
  const logUpd = settings.logging?.messageUpdate !== false ? '✅' : '❌';
  const logCre = settings.logging?.messageCreate === true ? '✅' : '❌';

  const embed = new EmbedBuilder()
    .setTitle('⚙️ CENTRE DE CONTRÔLE & CONFIGURATION LSPD')
    .setColor(0x0A2540)
    .setDescription(
      `Bienvenue dans le panneau de configuration centralisé du bot **LSPD — Ruby FA**.\n` +
      `Toutes les modifications effectuées ici ou via \`/config\` sont **sauvegardées et appliquées en temps réel**.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .addFields(
      {
        name: '📌 Salons Officiels',
        value: `• **DEFCON :** ${defconCh}\n• **Logs Modération :** ${logsModCh}\n• **Logs Messages :** ${logsMsgCh}\n• **Grille Salaires :** ${salairesCh}`,
        inline: false
      },
      {
        name: '📜 Journalisation des Messages',
        value: `• **Supprimés :** ${logDel}\n• **Modifiés :** ${logUpd}\n• **Envoyés :** ${logCre}`,
        inline: true
      },
      {
        name: '🌐 Terminal MDT',
        value: `**URL :** \`${settings.mdt?.url || 'Non définie'}\`\n[Tester le lien](${settings.mdt?.url || 'http://localhost:3005'})`,
        inline: true
      },
      {
        name: '🛡️ Sécurité Anti-Pub',
        value: `**Statut :** \`3 strikes = BAN\`\n**Serveurs autorisés :** \`${whitelistCount}\``,
        inline: true
      },
      {
        name: `🎭 Packs de Rôles Automatiques (${rolePacks.length})`,
        value: rolePacks.length > 0 
          ? rolePacks.map(k => `\`/action ${k} @agent\``).join(', ')
          : '*Aucun pack configuré.*',
        inline: false
      },
      {
        name: `⚡ Commandes Textuelles (${textCmds.length})`,
        value: textCmds.length > 0 
          ? textCmds.map(k => `\`!${k}\` ou \`/cmd ${k}\``).join(', ')
          : '*Aucune commande textuelle.*',
        inline: false
      }
    )
    .setFooter({ text: 'Los Santos Police Department • Console d\'Administration' })
    .setTimestamp();

  // Boutons rapides d'action pour ouvrir les fenêtres de configuration
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('cfg_btn_channels')
      .setLabel('Salons')
      .setEmoji('📁')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('cfg_btn_mdt')
      .setLabel('URL MDT')
      .setEmoji('🌐')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('cfg_btn_customcmd')
      .setLabel('Créer Texte')
      .setEmoji('⚡')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('cfg_btn_rolepack')
      .setLabel('Créer Pack Rôles')
      .setEmoji('🎭')
      .setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('cfg_btn_whitelist')
      .setLabel('Whitelist')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('cfg_btn_salaires')
      .setLabel('Grille Salaires')
      .setEmoji('💵')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('cfg_btn_refresh')
      .setLabel('Actualiser')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [row1, row2] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Panneau de configuration central du bot LSPD')
    .addSubcommand(sub =>
      sub.setName('panel')
        .setDescription('Ouvrir le panneau interactif de configuration centralisé')
    )
    .addSubcommand(sub =>
      sub.setName('salons')
        .setDescription('Définir les salons clés (DEFCON, Logs, Salaires)')
        .addChannelOption(opt => opt.setName('defcon').setDescription('Salon de l\'affiche DEFCON').addChannelTypes(ChannelType.GuildText))
        .addChannelOption(opt => opt.setName('logs_moderation').setDescription('Salon des logs de modération').addChannelTypes(ChannelType.GuildText))
        .addChannelOption(opt => opt.setName('logs_messages').setDescription('Salon des logs de messages (supprimés/modifiés)').addChannelTypes(ChannelType.GuildText))
        .addChannelOption(opt => opt.setName('salaires').setDescription('Salon de la grille salariale').addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub =>
      sub.setName('logs')
        .setDescription('Activer ou désactiver les types de logs de messages')
        .addBooleanOption(opt => opt.setName('supprimes').setDescription('Journaliser les messages supprimés'))
        .addBooleanOption(opt => opt.setName('modifies').setDescription('Journaliser les messages modifiés'))
        .addBooleanOption(opt => opt.setName('envoyes').setDescription('Journaliser les nouveaux messages envoyés'))
        .addChannelOption(opt => opt.setName('salon').setDescription('Salon dédié aux logs de messages').addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub =>
      sub.setName('mdt')
        .setDescription('Définir le lien web officiel du Terminal MDT')
        .addStringOption(opt => opt.setName('url').setDescription('URL complète (ex: https://mdt.lspd-rubyfa.fr)').setRequired(true))
    )
    .addSubcommandGroup(group =>
      group.setName('whitelist')
        .setDescription('Gérer la whitelist des serveurs Discord autorisés')
        .addSubcommand(sub =>
          sub.setName('add')
            .setDescription('Ajouter un ID de serveur ou un lien d\'invitation à la whitelist')
            .addStringOption(opt => opt.setName('entree').setDescription('Lien d\'invitation ou ID du serveur').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Retirer un ID ou code de la whitelist')
            .addStringOption(opt => opt.setName('entree').setDescription('Code d\'invitation ou ID à supprimer').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('list')
            .setDescription('Lister tous les serveurs et codes autorisés')
        )
    )
    .addSubcommandGroup(group =>
      group.setName('customcmd')
        .setDescription('Créer et gérer des commandes personnalisées et packs de rôles')
        .addSubcommand(sub =>
          sub.setName('add-texte')
            .setDescription('Créer une commande informative texte (ex: !radio, !tenues)')
            .addStringOption(opt => opt.setName('nom').setDescription('Nom de la commande').setRequired(true))
            .addStringOption(opt => opt.setName('reponse').setDescription('Texte ou consignes envoyées par le bot').setRequired(true))
            .addStringOption(opt => opt.setName('description').setDescription('Description de la commande').setRequired(false))
        )
        .addSubcommand(sub =>
          sub.setName('add-pack')
            .setDescription('Créer un pack de rôles automatique (ex: rookie, cadet, fto)')
            .addStringOption(opt => opt.setName('nom').setDescription('Nom du pack (ex: rookie)').setRequired(true))
            .addStringOption(opt => opt.setName('ajouter_roles').setDescription('Rôles à donner (mentionnez les @rôles ou tapez leurs IDs)').setRequired(true))
            .addStringOption(opt => opt.setName('retirer_roles').setDescription('Rôles à retirer (mentions @rôles ou IDs)').setRequired(false))
            .addStringOption(opt => opt.setName('reponse').setDescription('Message RP de confirmation ({user} = l\'agent)').setRequired(false))
            .addStringOption(opt => opt.setName('description').setDescription('Description du pack').setRequired(false))
        )
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Supprimer une commande personnalisée ou un pack')
            .addStringOption(opt => opt.setName('nom').setDescription('Nom de la commande à supprimer').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('list')
            .setDescription('Lister toutes les commandes et packs créés')
        )
    )
    .addSubcommandGroup(group =>
      group.setName('salaire')
        .setDescription('Gérer la grille des salaires LSPD')
        .addSubcommand(sub =>
          sub.setName('add')
            .setDescription('Ajouter ou mettre à jour un grade et son salaire')
            .addStringOption(opt => opt.setName('grade').setDescription('Nom du grade (ex: Sergent I)').setRequired(true))
            .addStringOption(opt => opt.setName('salaire').setDescription('Montant du salaire (ex: 4 200$)').setRequired(true))
            .addStringOption(opt => opt.setName('prime').setDescription('Prime de service (ex: 600$)').setRequired(false))
            .addStringOption(opt => opt.setName('description').setDescription('Description ou rôle du grade').setRequired(false))
        )
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Supprimer un grade de la grille')
            .addStringOption(opt => opt.setName('grade').setDescription('Nom exact du grade').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('list')
            .setDescription('Afficher la grille salariale actuelle')
        )
    ),

  buildConfigDashboard,

  async execute(interaction) {
    if (!checkPermissions(interaction)) {
      return interaction.reply({
        content: '❌ **Accès Refusé :** Seuls les administrateurs et membres autorisés de l\'État-Major ont accès à la configuration.',
        ephemeral: true
      });
    }

    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    // 1. Panneau général par défaut
    if (!group && (sub === 'panel' || !sub)) {
      const { embed, components } = buildConfigDashboard(interaction.guild);
      return interaction.reply({ embeds: [embed], components: components, ephemeral: true });
    }

    // 2. Configuration des salons
    if (sub === 'salons') {
      const defcon = interaction.options.getChannel('defcon');
      const logsMod = interaction.options.getChannel('logs_moderation');
      const logsMsg = interaction.options.getChannel('logs_messages');
      const salaires = interaction.options.getChannel('salaires');

      const updates = [];
      if (defcon) {
        setChannel('defcon', defcon.id);
        updates.push(`• **DEFCON :** ${defcon}`);
      }
      if (logsMod) {
        setChannel('logs_moderation', logsMod.id);
        setChannel('logs', logsMod.id);
        updates.push(`• **Logs Modération :** ${logsMod}`);
      }
      if (logsMsg) {
        setChannel('logs_messages', logsMsg.id);
        updates.push(`• **Logs Messages :** ${logsMsg}`);
      }
      if (salaires) {
        setChannel('salaires', salaires.id);
        updates.push(`• **Salaires :** ${salaires}`);
      }

      if (updates.length === 0) {
        return interaction.reply({ content: '⚠️ Aucun salon spécifié.', ephemeral: true });
      }

      return interaction.reply({
        content: `✅ **Salons mis à jour avec succès :**\n${updates.join('\n')}`,
        ephemeral: true
      });
    }

    // 3. Configuration des Logs
    if (sub === 'logs') {
      const suppr = interaction.options.getBoolean('supprimes');
      const modif = interaction.options.getBoolean('modifies');
      const envoyes = interaction.options.getBoolean('envoyes');
      const salon = interaction.options.getChannel('salon');

      const updates = [];
      if (salon) {
        setChannel('logs_messages', salon.id);
        updates.push(`• Salon des logs messages : ${salon}`);
      }
      if (suppr !== null) {
        setLoggingOption('messageDelete', suppr);
        updates.push(`• Logs messages supprimés : ${suppr ? '✅ Activé' : '❌ Désactivé'}`);
      }
      if (modif !== null) {
        setLoggingOption('messageUpdate', modif);
        updates.push(`• Logs messages modifiés : ${modif ? '✅ Activé' : '❌ Désactivé'}`);
      }
      if (envoyes !== null) {
        setLoggingOption('messageCreate', envoyes);
        updates.push(`• Logs messages envoyés : ${envoyes ? '✅ Activé' : '❌ Désactivé'}`);
      }

      if (updates.length === 0) {
        return interaction.reply({ content: '⚠️ Aucune option spécifiée.', ephemeral: true });
      }

      return interaction.reply({
        content: `✅ **Paramètres des logs mis à jour :**\n${updates.join('\n')}`,
        ephemeral: true
      });
    }

    // 4. Configuration de l'URL MDT
    if (sub === 'mdt') {
      const url = interaction.options.getString('url');
      setMdtUrl(url);
      return interaction.reply({
        content: `✅ **URL du Terminal MDT mise à jour :** \`${url}\``,
        ephemeral: true
      });
    }

    // 5. Groupe Whitelist
    if (group === 'whitelist') {
      if (sub === 'add') {
        const val = interaction.options.getString('entree');
        const res = addEntry(val);
        if (res.type === 'already_exists') {
          return interaction.reply({ content: `ℹ️ L'entrée \`${val}\` est déjà présente dans la whitelist.`, ephemeral: true });
        }
        return interaction.reply({ content: `✅ Entrée ajoutée à la whitelist (${res.type}) : \`${res.value}\``, ephemeral: true });
      }

      if (sub === 'remove') {
        const val = interaction.options.getString('entree');
        const removed = removeEntry(val);
        return interaction.reply({
          content: removed ? `✅ L'entrée \`${val}\` a été retirée de la whitelist.` : `❌ L'entrée \`${val}\` n'a pas été trouvée.`,
          ephemeral: true
        });
      }

      if (sub === 'list') {
        const wl = getWhitelist();
        const ids = (wl.allowedGuildIds || []).map(id => `• ID Serveur : \`${id}\``).join('\n') || '*Aucun ID*';
        const codes = (wl.allowedInviteCodes || []).map(c => `• Code Invite : \`${c}\``).join('\n') || '*Aucun code*';

        const embed = new EmbedBuilder()
          .setTitle('🛡️ WHITELIST OFFICIELLE DES SERVEURS AUTORISÉS')
          .setColor(0x10B981)
          .addFields(
            { name: 'Serveurs autorisés (IDs)', value: ids, inline: false },
            { name: 'Codes d\'invitations autorisés', value: codes, inline: false }
          );

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // 6. Groupe Commandes Personnalisées & Packs
    if (group === 'customcmd') {
      if (sub === 'add-texte') {
        const name = interaction.options.getString('nom');
        const response = interaction.options.getString('reponse');
        const desc = interaction.options.getString('description') || 'Commande LSPD';

        try {
          const cmd = addCustomCommand(name, response, desc, 'text');
          return interaction.reply({
            content: `✅ **Commande créée avec succès !**\n` +
              `> Nom : \`${cmd.name}\`\n` +
              `> Utilisation : \`!${cmd.name}\` dans le tchat ou \`/cmd nom:${cmd.name}\``,
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
        }
      }

      if (sub === 'add-pack') {
        const name = interaction.options.getString('nom');
        const addRolesRaw = interaction.options.getString('ajouter_roles');
        const removeRolesRaw = interaction.options.getString('retirer_roles') || '';
        const response = interaction.options.getString('reponse') || "🎖️ **AFFECTATION ROOKIE :** L'agent {user} a reçu son paquetage !";
        const desc = interaction.options.getString('description') || `Pack de rôles ${name}`;

        const addRoleIds = extractRoleIds(addRolesRaw);
        const removeRoleIds = extractRoleIds(removeRolesRaw);

        if (addRoleIds.length === 0) {
          return interaction.reply({
            content: '❌ Vous devez spécifier au moins un rôle valide à ajouter (ex: `@Cadet` ou son identifiant numérique).',
            ephemeral: true
          });
        }

        try {
          const pack = addCustomCommand(name, response, desc, 'role_action', addRoleIds, removeRoleIds);
          const addNames = addRoleIds.map(id => `<@&${id}>`).join(', ');
          const remNames = removeRoleIds.length > 0 ? removeRoleIds.map(id => `<@&${id}>`).join(', ') : '*Aucun*';

          return interaction.reply({
            content: `✅ **Pack de rôles créé avec succès !**\n` +
              `> 🎭 Nom : \`${pack.name}\`\n` +
              `> ➕ Rôles ajoutés : ${addNames}\n` +
              `> ➖ Rôles retirés : ${remNames}\n` +
              `> 🚀 **Utilisation :** \`/action nom:${pack.name} membre:@Agent\``,
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
        }
      }

      if (sub === 'remove') {
        const name = interaction.options.getString('nom');
        const removed = removeCustomCommand(name);
        return interaction.reply({
          content: removed ? `✅ La commande / pack \`${name}\` a été supprimé.` : `❌ Commande \`${name}\` introuvable.`,
          ephemeral: true
        });
      }

      if (sub === 'list') {
        const cmds = getCustomCommands();
        const keys = Object.keys(cmds);
        if (keys.length === 0) {
          return interaction.reply({ content: 'ℹ️ Aucune commande personnalisée créée.', ephemeral: true });
        }

        const rolePacksText = keys
          .filter(k => cmds[k].type === 'role_action')
          .map(k => `• **\`/action ${k} @agent\`** : ${cmds[k].description} *(+${cmds[k].addRoleIds?.length || 0} rôles)*`)
          .join('\n') || '*Aucun pack de rôles*';

        const textCmdsText = keys
          .filter(k => cmds[k].type !== 'role_action')
          .map(k => `• **\`!${k}\`** (ou \`/cmd ${k}\`) : ${cmds[k].description}`)
          .join('\n') || '*Aucune commande texte*';

        const embed = new EmbedBuilder()
          .setTitle('⚡ COMMANDES & PACKS DE RÔLES ACTIFS')
          .setColor(0x3B82F6)
          .addFields(
            { name: '🎭 Packs de Rôles Automatiques', value: rolePacksText, inline: false },
            { name: '💬 Commandes Textuelles & Utilitaires', value: textCmdsText, inline: false }
          );

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // 7. Groupe Grille Salariale
    if (group === 'salaire') {
      if (sub === 'add') {
        const grade = interaction.options.getString('grade');
        const salaire = interaction.options.getString('salaire');
        const prime = interaction.options.getString('prime') || 'N/A';
        const desc = interaction.options.getString('description') || '';

        const entry = addOrUpdateGrade(grade, salaire, prime, desc);
        return interaction.reply({
          content: `✅ **Grade enregistré dans la grille !**\n` +
            `> Grade : **${entry.rank}**\n` +
            `> Salaire : \`${entry.salary}\` | Prime : \`${entry.prime}\`\n` +
            `> Description : *${entry.description || 'N/A'}*`,
          ephemeral: true
        });
      }

      if (sub === 'remove') {
        const grade = interaction.options.getString('grade');
        const removed = removeGrade(grade);
        return interaction.reply({
          content: removed ? `✅ Le grade **${grade}** a été retiré de la grille salariale.` : `❌ Grade **${grade}** introuvable.`,
          ephemeral: true
        });
      }

      if (sub === 'list') {
        const { buildSalairesDetailsEmbed } = require('./salaires');
        const embed = buildSalairesDetailsEmbed();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }
};
