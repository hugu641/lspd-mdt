const fs = require('fs');
const path = require('path');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
  AttachmentBuilder
} = require('discord.js');
const {
  getTicketCategories,
  getTicketSettings,
  incrementTicketCount
} = require('./settingsManager');
const config = require('../config');

const TICKETS_FILE = path.resolve(__dirname, '../../data/tickets.json');

function loadTickets() {
  try {
    if (!fs.existsSync(TICKETS_FILE)) {
      fs.writeFileSync(TICKETS_FILE, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(TICKETS_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Erreur loadTickets :', err);
    return {};
  }
}

function saveTickets(data) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur saveTickets :', err);
  }
}

/**
 * Résout les rôles par ID ou par Nom dans le serveur
 */
function resolveRoles(guild, rolesList) {
  if (!Array.isArray(rolesList)) return [];
  const resolved = [];

  for (const item of rolesList) {
    if (!item) continue;
    const clean = String(item).trim();
    const mentionMatch = clean.match(/<@&(\d+)>/);
    const id = mentionMatch ? mentionMatch[1] : (clean.match(/^\d{16,21}$/) ? clean : null);

    if (id) {
      const role = guild.roles.cache.get(id);
      if (role && !resolved.some(r => r.id === role.id)) resolved.push(role);
    } else {
      const role = guild.roles.cache.find(r => r.name.toLowerCase() === clean.toLowerCase());
      if (role && !resolved.some(r => r.id === role.id)) resolved.push(role);
    }
  }

  return resolved;
}

/**
 * Construit l'embed officiel et le menu déroulant du panneau de tickets
 */
function buildTicketPanel() {
  const categories = getTicketCategories();
  const catKeys = Object.keys(categories);

  const embed = new EmbedBuilder()
    .setTitle('🏛️ LSPD RUBY FA — SERVICE DES TICKETS & COMMUNICATIONS')
    .setColor(0x0A2540)
    .setDescription(
      `Bienvenue sur la plateforme officielle de communication et de requêtes de la **Los Santos Police Department**.\n\n` +
      `Pour contacter un service spécifique, signaler un incident ou vous adresser à la Haute Hiérarchie, ` +
      `**choisissez la catégorie appropriée dans le menu déroulant ci-dessous**.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `**📋 Catégories disponibles actuellement :**\n` +
      catKeys.map(k => `> ${categories[k].emoji || '🎫'} **${categories[k].label}** : *${categories[k].description}*`).join('\n') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⚠️ *Tout abus, ouverture de ticket sans motif valable ou troll sera sanctionné conformément au règlement RP.*`
    )
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/924/924915.png')
    .setImage('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80')
    .setFooter({ text: 'Secrétaire LSPD | Ruby FA • Bureau des Enquêtes & Relations Publiques' })
    .setTimestamp();

  const options = catKeys.map(k => {
    const c = categories[k];
    return {
      label: c.label.length > 100 ? c.label.substring(0, 97) + '...' : c.label,
      description: c.description ? (c.description.length > 100 ? c.description.substring(0, 97) + '...' : c.description) : 'Ouvrir un ticket',
      value: c.id,
      emoji: c.emoji || '🎫'
    };
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_ticket_category')
    .setPlaceholder('Sélectionnez la catégorie de votre demande...')
    .addOptions(options.length > 0 ? options : [{ label: 'Aucune catégorie', value: 'none', description: 'Contactez un administrateur' }]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  return { embed, components: [row] };
}

/**
 * Création d'un nouveau ticket suite à la sélection dans le menu
 */
async function handleTicketCreate(interaction, categoryId) {
  const guild = interaction.guild;
  const user = interaction.user;

  const categories = getTicketCategories();
  const category = categories[categoryId];

  if (!category) {
    return interaction.reply({
      content: '❌ Cette catégorie de ticket est introuvable ou a été supprimée.',
      ephemeral: true
    });
  }

  // Vérifier si l'utilisateur a déjà un ticket ouvert dans cette catégorie
  const tickets = loadTickets();
  const existingChannelId = Object.keys(tickets).find(cId => {
    const t = tickets[cId];
    return t.creatorId === user.id && t.categoryId === categoryId && t.status === 'open';
  });

  if (existingChannelId) {
    const existingChannel = guild.channels.cache.get(existingChannelId);
    if (existingChannel) {
      return interaction.reply({
        content: `⚠️ Vous avez déjà un ticket ouvert dans cette catégorie : ${existingChannel}`,
        ephemeral: true
      });
    }
  }

  await interaction.deferReply({ ephemeral: true });

  const ticketSettings = getTicketSettings();
  const ticketNum = String(incrementTicketCount()).padStart(4, '0');
  const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
  const channelName = `ticket-${ticketNum}-${cleanUsername}`;

  // Résolution des rôles ayant accès
  const allowedRoles = resolveRoles(guild, category.roles);

  // Construction des permissions du salon
  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    }
  ];

  // Ajout des rôles spécifiés (Marshal, Chief, Assistance, Deputy, etc.)
  for (const role of allowedRoles) {
    permissionOverwrites.push({
      id: role.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    });
  }

  // Création du salon textuel
  let parentCategory = null;
  if (ticketSettings.categoryChannelId) {
    parentCategory = guild.channels.cache.get(ticketSettings.categoryChannelId) || null;
  }

  let ticketChannel;
  try {
    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parentCategory ? parentCategory.id : null,
      topic: `Ticket LSPD #${ticketNum} | Créé par ${user.tag} (${user.id}) | Catégorie: ${category.label}`,
      permissionOverwrites
    });
  } catch (err) {
    console.error('Erreur lors de la création du salon ticket :', err);
    return interaction.editReply({
      content: `❌ Impossible de créer le salon du ticket. Erreur de permissions Discord : ${err.message}`
    });
  }

  // Sauvegarde des données du ticket
  tickets[ticketChannel.id] = {
    id: ticketChannel.id,
    number: ticketNum,
    creatorId: user.id,
    creatorTag: user.tag,
    categoryId: category.id,
    categoryLabel: category.label,
    createdAt: new Date().toISOString(),
    status: 'open',
    claimedBy: null
  };
  saveTickets(tickets);

  // Message d'accueil RP dans le ticket
  const rolesPings = allowedRoles.length > 0 ? allowedRoles.map(r => `<@&${r.id}>`).join(' ') : '*Aucun rôle spécifique configuré*';

  const welcomeEmbed = new EmbedBuilder()
    .setTitle(`🎫 TICKET #${ticketNum} — ${category.label.toUpperCase()}`)
    .setColor(0x0A2540)
    .setDescription(
      `Bonjour ${user},\n\n` +
      `${category.welcomeMessage || 'Veuillez exposer les détails de votre demande ou rapport ci-dessous.'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `**👤 Auteur du ticket :** ${user} (\`${user.id}\`)\n` +
      `**📁 Catégorie :** \`${category.label}\`\n` +
      `**👥 Services notifiés :** ${rolesPings}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setFooter({ text: 'Secrétaire LSPD | Ruby FA • Gestionnaire de Ticket' })
    .setTimestamp();

  const ticketButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ticket_claim')
      .setLabel('Prendre en charge')
      .setEmoji('✋')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('btn_ticket_transcript')
      .setLabel('Sauvegarder Transcript')
      .setEmoji('📑')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('btn_ticket_close')
      .setLabel('Fermer le Ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );

  await ticketChannel.send({
    content: `${user} | ${rolesPings}`,
    embeds: [welcomeEmbed],
    components: [ticketButtons]
  });

  return interaction.editReply({
    content: `✅ Votre ticket a été créé avec succès : ${ticketChannel}`
  });
}

/**
 * Prise en charge d'un ticket par un membre du staff / haute hiérarchie
 */
async function handleTicketClaim(interaction) {
  const tickets = loadTickets();
  const ticketData = tickets[interaction.channelId];

  if (!ticketData) {
    return interaction.reply({ content: '❌ Ce salon n\'est pas reconnu comme un ticket actif.', ephemeral: true });
  }

  if (ticketData.claimedBy) {
    return interaction.reply({
      content: `ℹ️ Ce ticket a déjà été pris en charge par <@${ticketData.claimedBy}>.`,
      ephemeral: true
    });
  }

  ticketData.claimedBy = interaction.user.id;
  saveTickets(tickets);

  const embed = new EmbedBuilder()
    .setColor(0x10B981)
    .setDescription(`✋ Ce ticket a été pris en charge par ${interaction.user}. Il sera votre interlocuteur privilégié.`);

  await interaction.reply({ embeds: [embed] });
}

/**
 * Fermeture d'un ticket
 */
async function handleTicketClose(interaction) {
  const tickets = loadTickets();
  const ticketData = tickets[interaction.channelId];

  if (!ticketData) {
    return interaction.reply({ content: '❌ Ce salon n\'est pas reconnu comme un ticket actif.', ephemeral: true });
  }

  if (ticketData.status === 'closed') {
    return interaction.reply({ content: 'ℹ️ Ce ticket est déjà fermé.', ephemeral: true });
  }

  ticketData.status = 'closed';
  ticketData.closedBy = interaction.user.id;
  ticketData.closedAt = new Date().toISOString();
  saveTickets(tickets);

  // Retirer la permission d'écrire au créateur
  await interaction.channel.permissionOverwrites.edit(ticketData.creatorId, {
    SendMessages: false
  }).catch(() => {});

  // Renommer le salon
  await interaction.channel.setName(`ferme-${ticketData.number}`).catch(() => {});

  const embed = new EmbedBuilder()
    .setTitle('🔒 TICKET FERMÉ')
    .setColor(config.colors.warning)
    .setDescription(
      `Ce ticket a été fermé par ${interaction.user}.\n` +
      `L'auteur ne peut plus envoyer de messages.\n\n` +
      `Que souhaitez-vous faire ?`
    )
    .setFooter({ text: 'Secrétaire LSPD | Ruby FA' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ticket_reopen')
      .setLabel('Réouvrir')
      .setEmoji('🔓')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('btn_ticket_transcript')
      .setLabel('Transcript')
      .setEmoji('📑')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('btn_ticket_delete')
      .setLabel('Supprimer définitivement')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

/**
 * Réouverture d'un ticket fermé
 */
async function handleTicketReopen(interaction) {
  const tickets = loadTickets();
  const ticketData = tickets[interaction.channelId];

  if (!ticketData) {
    return interaction.reply({ content: '❌ Salon de ticket introuvable.', ephemeral: true });
  }

  ticketData.status = 'open';
  delete ticketData.closedBy;
  delete ticketData.closedAt;
  saveTickets(tickets);

  await interaction.channel.permissionOverwrites.edit(ticketData.creatorId, {
    SendMessages: true
  }).catch(() => {});

  await interaction.channel.setName(`ticket-${ticketData.number}`).catch(() => {});

  const embed = new EmbedBuilder()
    .setColor(0x10B981)
    .setDescription(`🔓 Le ticket a été réouvert par ${interaction.user}.`);

  await interaction.reply({ embeds: [embed] });
}

/**
 * Génère le transcript des messages du ticket
 */
async function generateTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  const sorted = Array.from(messages.values()).reverse();

  let text = `====================================================\n`;
  text += `TRANSCRIPT OFFICIEL LSPD — RUBY FA\n`;
  text += `Salon : #${channel.name} (${channel.id})\n`;
  text += `Date d'exportation : ${new Date().toLocaleString('fr-FR')}\n`;
  text += `Nombre de messages : ${sorted.length}\n`;
  text += `====================================================\n\n`;

  for (const msg of sorted) {
    const time = msg.createdAt.toLocaleString('fr-FR');
    const author = `${msg.author.tag} (${msg.author.id})`;
    const content = msg.content || '[Pas de contenu texte]';

    text += `[${time}] ${author} :\n${content}\n`;

    if (msg.attachments.size > 0) {
      msg.attachments.forEach(att => {
        text += `  [PIÈCE JOINTE] ${att.name} -> ${att.url}\n`;
      });
    }

    text += `----------------------------------------------------\n`;
  }

  const buffer = Buffer.from(text, 'utf-8');
  return new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });
}

/**
 * Bouton transcript manuel
 */
async function handleTicketTranscript(interaction) {
  await interaction.deferReply();
  try {
    const attachment = await generateTranscript(interaction.channel);
    await interaction.editReply({
      content: '📑 Voici l\'historique complet des échanges de ce ticket :',
      files: [attachment]
    });
  } catch (err) {
    await interaction.editReply({ content: `❌ Erreur lors de la génération du transcript : ${err.message}` });
  }
}

/**
 * Suppression définitive d'un ticket
 */
async function handleTicketDelete(interaction) {
  await interaction.reply({
    content: '🗑️ **Suppression du ticket en cours...** Ce salon sera effacé dans 5 secondes.'
  });

  const channel = interaction.channel;
  const tickets = loadTickets();
  const ticketData = tickets[channel.id];

  // Envoi automatique du transcript dans le salon de logs (si configuré)
  try {
    const ticketSettings = getTicketSettings();
    const logChannelId = ticketSettings.logChannelId || config.channels.logs;
    if (logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const attachment = await generateTranscript(channel);
        const logEmbed = new EmbedBuilder()
          .setTitle(`📁 TICKET SUPPRIMÉ : #${ticketData?.number || channel.name}`)
          .setColor(0xDC2626)
          .addFields(
            { name: 'Créateur', value: `<@${ticketData?.creatorId}> (\`${ticketData?.creatorTag || 'N/A'}\`)`, inline: true },
            { name: 'Catégorie', value: `\`${ticketData?.categoryLabel || 'N/A'}\``, inline: true },
            { name: 'Supprimé par', value: `${interaction.user}`, inline: true }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed], files: [attachment] }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Erreur archivage transcript ticket :', err);
  }

  // Nettoyage de la base
  if (tickets[channel.id]) {
    delete tickets[channel.id];
    saveTickets(tickets);
  }

  setTimeout(async () => {
    await channel.delete('Fermeture et suppression définitive du ticket').catch(() => {});
  }, 5000);
}

module.exports = {
  buildTicketPanel,
  handleTicketCreate,
  handleTicketClaim,
  handleTicketClose,
  handleTicketReopen,
  handleTicketTranscript,
  handleTicketDelete,
  generateTranscript
};
