const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const SALAIRES_FILE = path.resolve(__dirname, '../../data/salaires.json');

function loadSalairesData() {
  try {
    const raw = fs.readFileSync(SALAIRES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erreur lecture salaires.json :', err);
    return null;
  }
}

/**
 * Construit l'embed détaillé des salaires à afficher quand un agent clique sur le bouton
 */
function buildSalairesDetailsEmbed() {
  const data = loadSalairesData();
  if (!data) {
    return new EmbedBuilder()
      .setTitle('❌ Données non disponibles')
      .setDescription('La grille salariale est en cours de mise à jour par les RH.')
      .setColor(config.colors.danger);
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏛️ ${data.title || 'GRILLE SALARIALE OFFICIELLE — LSPD'}`)
    .setColor(config.colors.gold)
    .setDescription(
      `Voici le barème officiel des émoluments et compensations financières pour les agents du département de police de Los Santos (**${data.period || 'par service'}**).\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/924/924915.png');

  if (Array.isArray(data.grades)) {
    data.grades.forEach(g => {
      embed.addFields({
        name: `🔹 ${g.rank}`,
        value: `💵 **Salaire de base :** \`${g.salary}\` | 🎁 **Prime de quart :** \`${g.prime || 'N/A'}\`\n*${g.description || ''}*`,
        inline: false
      });
    });
  }

  if (Array.isArray(data.primes_speciales) && data.primes_speciales.length > 0) {
    const primesList = data.primes_speciales.map(p => `• **${p.nom} :** \`${p.montant}\``).join('\n');
    embed.addFields({
      name: '⭐ Primes de Spécialité & Unités d\'Élite',
      value: primesList,
      inline: false
    });
  }

  embed.setFooter({
    text: 'Trésorerie de la Ville de Los Santos • Service Paye & RH LSPD',
    iconURL: 'https://cdn-icons-png.flaticon.com/512/924/924915.png'
  }).setTimestamp();

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('post-salaires')
    .setDescription('Publie le panneau officiel interactif pour consulter la grille des salaires LSPD')
    .addChannelOption(opt =>
      opt.setName('salon')
        .setDescription('Salon où envoyer le panneau (laisser vide pour le salon actuel)')
        .setRequired(false)
    ),

  buildSalairesDetailsEmbed,

  async execute(interaction) {
    const member = interaction.member;
    const isStaff = member.permissions.has(PermissionFlagsBits.Administrator) ||
      (config.adminRoleIds.length > 0 && member.roles.cache.some(r => config.adminRoleIds.includes(r.id)));

    if (!isStaff) {
      return interaction.reply({
        content: '❌ **Accès Refusé :** Seul le staff ou l\'État-Major peut publier le panneau des salaires.',
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('💵 SERVICE DU PERSONNEL & FINANCES — GRILLE DES SALAIRES')
      .setColor(0xD4AF37) // Or police
      .setDescription(
        `### 🏛️ VILLE DE LOS SANTOS — LOS SANTOS POLICE DEPARTMENT\n\n` +
        `Chaque agent assermenté perçoit une rémunération proportionnelle à son grade, son ancienneté et ses qualifications au sein du département.\n\n` +
        `Pour préserver la clarté et la confidentialité, **cliquez sur le bouton ci-dessous** pour afficher instantanément la grille complète des salaires et primes associées à votre grade.\n\n` +
        `*Note : Les primes de risque et de nuit sont calculées lors de la clôture hebdomadaire des pointages.*`
      )
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/924/924915.png')
      .setImage('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80')
      .setFooter({
        text: 'Los Santos Police Department • Division des Ressources Humaines',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/924/924915.png'
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_salaires')
        .setLabel('Découvrir mon salaire & la grille')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💰')
    );

    if (targetChannel.id === interaction.channelId) {
      await interaction.reply({ embeds: [embed], components: [row] });
    } else {
      await targetChannel.send({ embeds: [embed], components: [row] });
      await interaction.reply({
        content: `✅ Le panneau des salaires a été publié avec succès dans ${targetChannel} !`,
        ephemeral: true
      });
    }
  }
};
