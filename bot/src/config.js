const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  token: process.env.DISCORD_BOT_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  guildId: process.env.DISCORD_GUILD_ID || '',
  
  // Salons spécifiques
  channels: {
    defcon: process.env.DEFCON_CHANNEL_ID || '',
    logs: process.env.LOGS_CHANNEL_ID || '',
    salaires: process.env.SALAIRES_CHANNEL_ID || '',
    annonces: process.env.ANNONCES_CHANNEL_ID || '',
  },

  // Rôles autorisés à changer le DEFCON ou exécuter les commandes admin
  adminRoleIds: (process.env.ADMIN_ROLE_IDS || '').split(',').filter(Boolean),

  // Rôles autorisés à poster des liens Discord (exemptés du filtre anti-pub)
  inviteBypassRoleIds: (process.env.INVITE_BYPASS_ROLE_IDS || '').split(',').filter(Boolean),

  // URL du Terminal MDT
  mdtUrl: process.env.MDT_URL || 'http://localhost:3005',

  // Couleurs d'embed de base LSPD
  colors: {
    lspdBlue: 0x0A2540,
    gold: 0xD4AF37,
    danger: 0xDC2626,
    warning: 0xF59E0B,
    success: 0x10B981,
    info: 0x3B82F6,
  },

  // Logos et images officielles LSPD
  assets: {
    badgeUrl: 'https://cdn-icons-png.flaticon.com/512/924/924915.png', // Badge de police
    bannerUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  }
};
