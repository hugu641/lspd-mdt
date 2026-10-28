const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { getSettings } = require('./settingsManager');
const { addWarning } = require('./warningManager');

const WHITELIST_FILE = path.resolve(__dirname, '../../data/whitelist.json');

// Regex universelle pour détecter les invitations Discord (discord.gg, discord.com/invite, discordapp.com/invite, etc.)
const INVITE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9\-]+)/gi;

function loadWhitelist() {
  try {
    if (!fs.existsSync(WHITELIST_FILE)) {
      return { allowedGuildIds: [], allowedInviteCodes: [] };
    }
    const raw = fs.readFileSync(WHITELIST_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Erreur de lecture de la whitelist :', err);
    return { allowedGuildIds: [], allowedInviteCodes: [] };
  }
}

/**
 * Analyse un message et applique la sécurité anti-invitation
 */
async function handleAntiInvite(message, client) {
  // Ignorer les bots et les messages en MP
  if (message.author.bot || !message.guild) return;

  // Ignorer si l'utilisateur est Administrateur
  if (message.member && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return;
  }

  // Ignorer si l'utilisateur possède un rôle bypass
  if (config.inviteBypassRoleIds.length > 0 && message.member) {
    const hasBypass = message.member.roles.cache.some(role => config.inviteBypassRoleIds.includes(role.id));
    if (hasBypass) return;
  }

  const content = message.content;
  const matches = [...content.matchAll(INVITE_REGEX)];

  if (matches.length === 0) return;

  const whitelist = loadWhitelist();
  const allowedGuildIds = Array.isArray(whitelist.allowedGuildIds) ? whitelist.allowedGuildIds : [];
  const allowedCodes = Array.isArray(whitelist.allowedInviteCodes) 
    ? whitelist.allowedInviteCodes.map(c => c.toLowerCase()) 
    : [];

  let isIllegalInvite = false;
  let detectedCode = '';

  for (const match of matches) {
    const code = match[1];
    detectedCode = code;

    // Si le code textuel est directement dans la whitelist (ex: "lspd", "rubyfa")
    if (allowedCodes.includes(code.toLowerCase())) {
      continue;
    }

    try {
      // Résolution de l'invitation auprès de l'API Discord pour identifier le serveur de destination
      const invite = await client.fetchInvite(code);
      const targetGuildId = invite.guild ? invite.guild.id : null;

      // Si l'invitation pointe vers le serveur actuel lui-même, c'est autorisé
      if (targetGuildId && targetGuildId === message.guild.id) {
        continue;
      }

      // Si l'invitation pointe vers un serveur expressément whitelisté
      if (targetGuildId && allowedGuildIds.includes(targetGuildId)) {
        continue;
      }

      // Si ce n'est pas autorisé
      isIllegalInvite = true;
      break;
    } catch (err) {
      // Si l'invite est invalide ou expirée mais ressemble à une pub, on bloque par précaution
      isIllegalInvite = true;
      break;
    }
  }

  if (!isIllegalInvite) return;

  // 1. Suppression immédiate du message
  try {
    await message.delete();
  } catch (err) {
    console.error('Impossible de supprimer le message contenant l\'invitation :', err.message);
  }

  // 2. Enregistrement de l'avertissement
  const warnResult = addWarning(message.author.id, 'Publication d\'un lien d\'invitation Discord non autorisé', detectedCode);
  const currentStrikes = warnResult.count;

  // 3. Traitement selon le palier d'avertissement
  if (currentStrikes < 3) {
    // Envoi du MP d'avertissement
    const warnEmbed = new EmbedBuilder()
      .setTitle('⚠️ AVERTISSEMENT LSPD — INFRACTION AU RÈGLEMENT')
      .setColor(config.colors.warning)
      .setDescription(
        `Bonjour **${message.author.username}**,\n\n` +
        `Votre message sur le serveur **${message.guild.name}** a été **supprimé** car il contenait une invitation Discord non autorisée.\n\n` +
        `📊 **Palier d'avertissement :** \`${currentStrikes} / 3\`\n\n` +
        `> ⚠️ **Rappel important :** La promotion de serveurs tiers non affiliés est strictement interdite. ` +
        `Au **3ème avertissement**, votre compte sera **banni définitivement** du serveur.`
      )
      .setFooter({ text: 'Secrétaire LSPD | Ruby FA — Système de Sécurité' })
      .setTimestamp();

    await message.author.send({ embeds: [warnEmbed] }).catch(() => {
      // Si les MP sont fermés, envoi d'un message éphémère dans le salon qui s'autodétruit
      message.channel.send({
        content: `⚠️ ${message.author}, vos messages contenant des invitations non autorisées sont interdits ! Avertissement : **${currentStrikes}/3** (Vos MP sont fermés).`
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 7000)).catch(() => {});
    });

  } else {
    // 3 avertissements atteints -> BAN automatique
    const banEmbed = new EmbedBuilder()
      .setTitle('⛔ BANLISSEMENT DÉFINITIF — SÉCURITÉ LSPD')
      .setColor(config.colors.danger)
      .setDescription(
        `Bonjour **${message.author.username}**,\n\n` +
        `Vous avez atteint le seuil maximal de **3 avertissements** pour publication répétée d'invitations Discord non autorisées sur **${message.guild.name}**.\n\n` +
        `🔨 **Sanction :** Bannissement définitif du serveur.`
      )
      .setFooter({ text: 'Secrétaire LSPD | Ruby FA — Sanction Automatique' })
      .setTimestamp();

    // Envoi du MP avant le ban
    try {
      await message.author.send({ embeds: [banEmbed] });
    } catch (err) {
      // MP fermés
    }

    // Bannissement du membre
    try {
      await message.guild.members.ban(message.author.id, {
        reason: `[Auto-Sécurité LSPD] 3 avertissements atteints pour liens d'invitations non autorisés (Dernier code: ${detectedCode})`,
        deleteMessageSeconds: 60 * 60 * 24 // Supprime les messages des dernières 24h
      });
      console.log(`[BAN AUTO] Utilisateur ${message.author.tag} (${message.author.id}) banni pour 3/3 avertissements.`);
    } catch (err) {
      console.error('Erreur lors du bannissement automatique :', err);
    }
  }

  // 4. Notification dans le salon de logs de modération (si configuré)
  const settings = getSettings();
  const logChannelId = settings.channels?.logs || config.channels.logs;
  if (logChannelId) {
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle(currentStrikes >= 3 ? '🔨 LOG : Membre Banni (Anti-Pub 3/3)' : '🛡️ LOG : Invitation Non Autorisée Supprimée')
        .setColor(currentStrikes >= 3 ? config.colors.danger : config.colors.warning)
        .addFields(
          { name: 'Auteur', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
          { name: 'Salon', value: `${message.channel}`, inline: true },
          { name: 'Avertissements', value: `\`${currentStrikes} / 3\``, inline: true },
          { name: 'Code détecté', value: `\`${detectedCode}\``, inline: true },
          { name: 'Action prise', value: currentStrikes >= 3 ? '**Bannissement automatique**' : 'Suppression + Avertissement MP', inline: true }
        )
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }
}

module.exports = {
  handleAntiInvite,
  loadWhitelist
};
