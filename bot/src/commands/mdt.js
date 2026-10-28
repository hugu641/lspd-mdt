const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits 
} = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/settingsManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mdt')
    .setDescription('Affiche le panneau officiel et l\'accès sécurisé au Terminal MDT de la LSPD')
    .addChannelOption(opt =>
      opt.setName('salon')
        .setDescription('Salon où publier le panneau officiel (laisser vide pour le salon actuel)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    const settings = getSettings();
    const currentMdtUrl = settings.mdt?.url || config.mdtUrl;

    const embed = new EmbedBuilder()
      .setTitle('💻 LSPD MOBILE DATA TERMINAL (M.D.T.) — TERMINAL SÉCURISÉ')
      .setColor(0x0A2540) // Bleu nuit LSPD
      .setDescription(
        `### 🏛️ DÉPARTEMENT DE POLICE DE LOS SANTOS — RUBY FA\n` +
        `**Système Central des Données Opérationnelles & Judiciaires**\n\n` +
        `Le Terminal de Données Mobile (MDT) est l'outil numérique officiel utilisé par toutes les unités de patrouille du LSPD. ` +
        `Il permet l'accès en temps réel aux registres légaux de l'État de San Andreas.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `**📡 FONCTIONNALITÉS OPÉRATIONNELLES DU TERMINAL :**\n` +
        `> 🔍 **Recherche Citoyen & Antécédents :** Casier judiciaire, permis, condamnations.\n` +
        `> 🚘 **Base de Données Véhicules :** Immatriculations, statuts volés / signalés.\n` +
        `> 📜 **Mandats d'Arrêt & Avis de Recherche :** Consultation et émission directe.\n` +
        `> 📝 **Rapports d'Intervention :** Rédaction des procès-verbaux (PV) et dépôts de plainte.\n` +
        `> 🚨 **Gestion des Unités en Service :** Affectation radio et suivi des patrouilles.\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ **AVIS DE SÉCURITÉ FED-POLICE :**\n` +
        `*L'accès à ce système est strictement réservé au personnel assermenté du LSPD. ` +
        `Toute tentative d'intrusion ou divulgation de données confidentielles est passible de sanctions disciplinaires et pénales.*`
      )
      .addFields(
        { name: '🟢 État des Serveurs', value: '`EN LIGNE & OPÉRATIONNEL (100%)`', inline: true },
        { name: '🔐 Chiffrement', value: '`AES-256 BIT POLICE NET`', inline: true },
        { name: '🌐 Accès Web', value: `[Cliquer ici pour ouvrir le MDT](${currentMdtUrl})`, inline: true }
      )
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/924/924915.png')
      .setImage('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80')
      .setFooter({
        text: 'Los Santos Police Department • Division des Systèmes d\'Information',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/924/924915.png'
      })
      .setTimestamp();

    // Boutons interactifs
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Accéder au Terminal MDT')
        .setURL(currentMdtUrl)
        .setStyle(ButtonStyle.Link)
        .setEmoji('🌐'),

      new ButtonBuilder()
        .setCustomId('btn_mdt_help')
        .setLabel('Guide & Identifiants')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('ℹ️')
    );

    // Publication
    if (targetChannel.id === interaction.channelId) {
      await interaction.reply({ embeds: [embed], components: [row] });
    } else {
      await targetChannel.send({ embeds: [embed], components: [row] });
      await interaction.reply({
        content: `✅ Le panneau du MDT a été publié dans le salon ${targetChannel} !`,
        ephemeral: true
      });
    }
  }
};
