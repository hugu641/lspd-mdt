const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('./settingsManager');
const config = require('../config');

/**
 * Récupère le salon de log approprié (salon spécifique logs_messages ou salon général logs)
 */
function getLogChannel(guild, type = 'messages') {
  const settings = getSettings();
  const channelId = (type === 'messages' && settings.channels?.logs_messages)
    ? settings.channels.logs_messages
    : (settings.channels?.logs_moderation || settings.channels?.logs || config.channels.logs);

  if (!channelId) return null;
  return guild.channels.cache.get(channelId) || null;
}

/**
 * Journalise la suppression d'un message
 */
async function logMessageDelete(message) {
  // Ignorer les messages de bots ou hors serveur
  if (!message.guild || (message.author && message.author.bot)) return;

  const settings = getSettings();
  if (settings.logging && settings.logging.messageDelete === false) return;

  const logChannel = getLogChannel(message.guild, 'messages');
  if (!logChannel || logChannel.id === message.channelId) return;

  const authorTag = message.author ? `${message.author.tag} (<@${message.author.id}>)` : 'Auteur Inconnu';
  const authorAvatar = message.author ? message.author.displayAvatarURL({ dynamic: true }) : null;
  const content = message.content ? (message.content.length > 1000 ? message.content.substring(0, 1000) + '...' : message.content) : '*Aucun contenu texte (image ou embed)*';

  const embed = new EmbedBuilder()
    .setTitle('🗑️ LOG : Message Supprimé')
    .setColor(config.colors.danger)
    .addFields(
      { name: 'Auteur', value: authorTag, inline: true },
      { name: 'Salon', value: `<#${message.channelId}> (\`${message.channel.name}\`)`, inline: true },
      { name: 'Contenu du Message', value: `\`\`\`\n${content}\n\`\`\``, inline: false }
    )
    .setTimestamp();

  if (authorAvatar) {
    embed.setThumbnail(authorAvatar);
  }

  // Si le message contenait des pièces jointes (fichiers/images)
  if (message.attachments && message.attachments.size > 0) {
    const attachNames = message.attachments.map(a => `• [${a.name || 'Fichier'}](${a.url})`).join('\n');
    embed.addFields({ name: 'Pièces Jointes', value: attachNames });
  }

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Journalise la modification d'un message
 */
async function logMessageUpdate(oldMessage, newMessage) {
  if (!newMessage.guild || (newMessage.author && newMessage.author.bot)) return;
  if (oldMessage.content === newMessage.content) return; // Ignore si pas de changement de texte (ex: ajout de réaction)

  const settings = getSettings();
  if (settings.logging && settings.logging.messageUpdate === false) return;

  const logChannel = getLogChannel(newMessage.guild, 'messages');
  if (!logChannel || logChannel.id === newMessage.channelId) return;

  const authorTag = newMessage.author ? `${newMessage.author.tag} (<@${newMessage.author.id}>)` : 'Auteur Inconnu';
  const authorAvatar = newMessage.author ? newMessage.author.displayAvatarURL({ dynamic: true }) : null;

  const oldContent = oldMessage.content ? (oldMessage.content.length > 800 ? oldMessage.content.substring(0, 800) + '...' : oldMessage.content) : '*Inconnu ou non mis en cache*';
  const newContent = newMessage.content ? (newMessage.content.length > 800 ? newMessage.content.substring(0, 800) + '...' : newMessage.content) : '*Vide*';

  const embed = new EmbedBuilder()
    .setTitle('✏️ LOG : Message Modifié')
    .setColor(config.colors.warning)
    .addFields(
      { name: 'Auteur', value: authorTag, inline: true },
      { name: 'Salon', value: `<#${newMessage.channelId}>`, inline: true },
      { name: 'Lien Direct', value: `[Accéder au Message](${newMessage.url})`, inline: true },
      { name: 'Ancien Contenu', value: `\`\`\`\n${oldContent}\n\`\`\``, inline: false },
      { name: 'Nouveau Contenu', value: `\`\`\`\n${newContent}\n\`\`\``, inline: false }
    )
    .setTimestamp();

  if (authorAvatar) {
    embed.setThumbnail(authorAvatar);
  }

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Journalise l'envoi d'un message (si activé dans la config)
 */
async function logMessageCreate(message) {
  if (!message.guild || message.author.bot) return;

  const settings = getSettings();
  if (!settings.logging || settings.logging.messageCreate !== true) return; // Désactivé par défaut pour éviter le spam

  const logChannel = getLogChannel(message.guild, 'messages');
  if (!logChannel || logChannel.id === message.channelId) return;

  const embed = new EmbedBuilder()
    .setTitle('💬 LOG : Nouveau Message')
    .setColor(config.colors.info)
    .addFields(
      { name: 'Auteur', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
      { name: 'Salon', value: `<#${message.channelId}>`, inline: true },
      { name: 'Contenu', value: message.content ? `\`\`\`\n${message.content.substring(0, 1000)}\n\`\`\`` : '*Sans texte*' }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = {
  getLogChannel,
  logMessageDelete,
  logMessageUpdate,
  logMessageCreate
};
