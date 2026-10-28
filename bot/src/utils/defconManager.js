const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('./settingsManager');

const DEFCON_FILE = path.resolve(__dirname, '../../data/defcon_data.json');
const ASSETS_DIR = path.resolve(__dirname, '../../assets/defcon');

function loadDefconData() {
  try {
    const raw = fs.readFileSync(DEFCON_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erreur lors du chargement des données DEFCON :', err);
    return { lastMessageId: null, levels: {} };
  }
}

function saveDefconData(data) {
  try {
    fs.writeFileSync(DEFCON_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur lors de la sauvegarde des données DEFCON :', err);
  }
}

/**
 * Construit l'affiche et l'embed RP pour le niveau DEFCON
 */
function buildDefconPayload(levelInfo, customReason, author) {
  const directivesFormatted = levelInfo.directives.map(d => `> 🛡️ ${d}`).join('\n');
  const infoFormatted = (levelInfo.informations || []).map(i => `> ℹ️ ${i}`).join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`🚨 [GOUVERNEMENT DE LOS SANTOS] ÉTAT D'ALERTE : ${levelInfo.name}`)
    .setColor(levelInfo.color)
    .setDescription(
      `### 🏛️ ÉTAT DE SAN ANDREAS — SÉCURITÉ & PROTECTION\n` +
      `**STATUT DU TERRITOIRE :** \`${levelInfo.status}\`\n\n` +
      `**COMMUNIQUÉ OFFICIEL :**\n${levelInfo.description}\n\n` +
      (customReason ? `**Motif / Note du Haut Commandement :**\n*« ${customReason} »*\n\n` : '') +
      `**📋 MESURES APPLIQUÉES & DIRECTIVES :**\n${directivesFormatted}\n\n` +
      (infoFormatted ? `**ℹ️ INFORMATIONS AUX CITOYENS & FORCES DE L'ORDRE :**\n${infoFormatted}\n\n` : '') +
      `*Alerte validée et ordonnée par :* ${author ? author : 'Le Gouvernement & l\'État-Major LSPD'}`
    )
    .setFooter({
      text: 'Gouvernement de Los Santos • Service Intégrité & Protection',
      iconURL: 'https://cdn-icons-png.flaticon.com/512/924/924915.png'
    })
    .setTimestamp();

  const files = [];

  // Recherche de l'affiche image locale correspondante (ex: defcon3.jpg, defcon4.jpg, defcon5.jpg)
  const possibleExtensions = ['jpg', 'png', 'jpeg', 'webp'];
  let localFoundPath = null;
  let localFilename = '';

  for (const ext of possibleExtensions) {
    const candidate = path.join(ASSETS_DIR, `defcon${levelInfo.level}.${ext}`);
    if (fs.existsSync(candidate)) {
      localFoundPath = candidate;
      localFilename = `defcon${levelInfo.level}.${ext}`;
      break;
    }
  }

  if (localFoundPath) {
    const attachment = new AttachmentBuilder(localFoundPath, { name: localFilename });
    files.push(attachment);
    embed.setImage(`attachment://${localFilename}`);
  } else if (levelInfo.image && !levelInfo.image.includes('githubusercontent.com/LSPD-Resources')) {
    embed.setImage(levelInfo.image);
  }

  return { embed, files };
}

/**
 * Met à jour le DEFCON sur le salon dédié
 */
async function updateDefcon(client, guild, levelNumber, customReason, authorMember) {
  const settings = getSettings();
  const channelId = settings.channels?.defcon || config.channels.defcon;
  if (!channelId) {
    throw new Error("L'identifiant du salon DEFCON n'est pas configuré. Utilisez `/config salons defcon:#salon`.");
  }

  const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    throw new Error(`Le salon DEFCON avec l'ID ${channelId} est introuvable sur le serveur.`);
  }

  const defconData = loadDefconData();
  const levelInfo = defconData.levels[String(levelNumber)];
  if (!levelInfo) {
    throw new Error(`Le niveau DEFCON ${levelNumber} n'existe pas (disponibles: 1 à 5).`);
  }

  // 1. Suppression de l'ancienne affiche si elle existe
  if (defconData.lastMessageId) {
    try {
      const oldMessage = await channel.messages.fetch(defconData.lastMessageId).catch(() => null);
      if (oldMessage) {
        await oldMessage.delete();
      }
    } catch (err) {
      console.warn('Impossible de supprimer l\'ancienne affiche DEFCON :', err.message);
    }
  }

  // 2. Préparation du message (avec mention selon gravité)
  const { embed, files } = buildDefconPayload(levelInfo, customReason, authorMember ? authorMember.displayName : null);
  
  let mentionText = '';
  if (levelNumber === 1) {
    mentionText = '🚨 @everyone **ALERTE GÉNÉRALE LSPD — DEFCON 1 DÉCRÉTÉ ! ÉTAT D\'URGENCE ABSOLU !**';
  } else if (levelNumber === 2) {
    mentionText = '⚠️ @here **ATTENTION UNITÉS LSPD — DEFCON 2 ACTIVÉ ! MENACE IMMINENTE !**';
  } else if (levelNumber === 3) {
    mentionText = '⚠️ **COMMUNIQUÉ OFFICIEL : DEFCON 3 EN VIGUEUR — SITUATION ÉLEVÉE.**';
  }

  // 3. Envoi de la nouvelle affiche
  const newMessage = await channel.send({
    content: mentionText || undefined,
    embeds: [embed],
    files: files
  });

  // 4. Mémorisation du nouvel ID de message
  defconData.lastMessageId = newMessage.id;
  saveDefconData(defconData);

  // 5. Mise à jour de la présence du bot
  try {
    client.user.setPresence({
      activities: [{
        name: `[DEFCON ${levelNumber}] Secrétaire LSPD | Ruby FA`,
        state: `[DEFCON ${levelNumber}] Secrétaire LSPD | Ruby FA`,
        type: 4 // Custom status
      }]
    });
  } catch (err) {}

  return { message: newMessage, levelInfo };
}

module.exports = {
  loadDefconData,
  saveDefconData,
  updateDefcon,
  buildDefconPayload
};
