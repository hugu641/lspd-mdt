const fs = require('fs');
const path = require('path');
const envConfig = require('../config');

const SETTINGS_FILE = path.resolve(__dirname, '../../data/settings.json');

const DEFAULT_SETTINGS = {
  channels: {
    defcon: envConfig.channels?.defcon || '',
    logs: envConfig.channels?.logs || '',
    logs_messages: '', // Salon spécifique pour les logs de messages
    salaires: envConfig.channels?.salaires || '',
    annonces: envConfig.channels?.annonces || ''
  },
  logging: {
    messageDelete: true,
    messageUpdate: true,
    messageCreate: false
  },
  roles: {
    adminRoleIds: envConfig.adminRoleIds || [],
    inviteBypassRoleIds: envConfig.inviteBypassRoleIds || []
  },
  mdt: {
    url: envConfig.mdtUrl || 'http://localhost:3005',
    title: 'LSPD MOBILE DATA TERMINAL (M.D.T.)'
  },
  antiInvite: {
    enabled: true,
    maxStrikes: 3
  },
  customCommands: {
    radio: {
      name: 'radio',
      type: 'text',
      response: "📻 **FRÉQUENCES RADIO OFFICIELLES — LSPD :**\n> • **Fréquence 1.0 :** Dispatch principal & Patrouilles régulières\n> • **Fréquence 2.0 :** Opérations tactiques SWAT & Assauts\n> • **Fréquence 3.0 :** Poursuites & Interceptions prioritaires\n> • **Fréquence 4.0 :** Convoi fédéral & Inter-services (EMS / Gouvernement)",
      description: 'Affiche les fréquences radio officielles LSPD'
    },
    codes: {
      name: 'codes',
      type: 'text',
      response: "📋 **LEXIQUE DES CODES RADIO LSPD :**\n> • **10-4 :** Reçu / Compris\n> • **10-6 :** Occupé temporairement\n> • **10-8 :** En service / Disponible patrouille\n> • **10-10 :** Fin de service\n> • **10-20 :** Position / Localisation actuelle\n> • **Code 0 :** URGENCE CRITIQUE — Officier à terre / en danger de mort\n> • **Code 2 :** Intervention urgente sans sirène\n> • **Code 3 :** Urgence gyrophares + deux-tons\n> • **Code 5 :** Contrôle routier sous haute surveillance",
      description: 'Affiche le lexique des codes 10 et d\'urgence'
    },
    rookie: {
      name: 'rookie',
      type: 'role_action',
      addRoleIds: [],
      removeRoleIds: [],
      response: "🎖️ **AFFECTATION ROOKIE :** L'agent {user} a reçu l'ensemble des paquetages et grades de **Cadet / Rookie** du LSPD !",
      description: 'Attribue automatiquement le pack de rôles Rookie / Cadet à un membre'
    }
  },
  ticketSettings: {
    categoryChannelId: '',
    logChannelId: '',
    ticketCount: 0
  },
  ticketCategories: {
    haute_hierarchie: {
      id: 'haute_hierarchie',
      label: 'Haute Hiérarchie',
      description: 'Marshal, Chief of Police, Assistance & Deputy',
      emoji: '🎖️',
      roles: ['Marshal', 'Chief of the Police', 'Assistance', 'Deputy'],
      welcomeMessage: 'Bienvenue dans votre salon privé avec le Haut Commandement de la LSPD.\nVeuillez exposer clairement votre demande ou rapport ci-dessous.'
    }
  }
};

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      channels: { ...DEFAULT_SETTINGS.channels, ...(parsed.channels || {}) },
      logging: { ...DEFAULT_SETTINGS.logging, ...(parsed.logging || {}) },
      customCommands: { ...DEFAULT_SETTINGS.customCommands, ...(parsed.customCommands || {}) },
      ticketSettings: { ...DEFAULT_SETTINGS.ticketSettings, ...(parsed.ticketSettings || {}) },
      ticketCategories: { ...DEFAULT_SETTINGS.ticketCategories, ...(parsed.ticketCategories || {}) }
    };
  } catch (err) {
    console.error('Erreur chargement settings.json :', err);
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erreur sauvegarde settings.json :', err);
    return false;
  }
}

function getSettings() {
  return loadSettings();
}

function updateSetting(section, key, value) {
  const current = loadSettings();
  if (!current[section]) {
    current[section] = {};
  }
  current[section][key] = value;
  saveSettings(current);
  return current;
}

function setChannel(type, channelId) {
  const current = loadSettings();
  if (!current.channels) current.channels = {};
  current.channels[type] = channelId;
  saveSettings(current);
  return current;
}

function setLoggingOption(option, enabled) {
  const current = loadSettings();
  if (!current.logging) current.logging = {};
  current.logging[option] = Boolean(enabled);
  saveSettings(current);
  return current;
}

function setMdtUrl(newUrl) {
  const current = loadSettings();
  if (!current.mdt) current.mdt = {};
  current.mdt.url = newUrl;
  saveSettings(current);
  return current;
}

function addCustomCommand(name, response, description = 'Commande personnalisée', type = 'text', addRoleIds = [], removeRoleIds = []) {
  const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  if (!cleanName) throw new Error('Nom de commande invalide (lettres, chiffres, tirets uniquement).');

  const current = loadSettings();
  if (!current.customCommands) current.customCommands = {};

  current.customCommands[cleanName] = {
    name: cleanName,
    type,
    response,
    description,
    addRoleIds: Array.isArray(addRoleIds) ? addRoleIds : [],
    removeRoleIds: Array.isArray(removeRoleIds) ? removeRoleIds : [],
    updatedAt: new Date().toISOString()
  };

  saveSettings(current);
  return current.customCommands[cleanName];
}

function removeCustomCommand(name) {
  const cleanName = name.toLowerCase().trim();
  const current = loadSettings();
  if (current.customCommands && current.customCommands[cleanName]) {
    delete current.customCommands[cleanName];
    saveSettings(current);
    return true;
  }
  return false;
}

function getCustomCommands() {
  const current = loadSettings();
  return current.customCommands || {};
}

function getTicketCategories() {
  const current = loadSettings();
  return current.ticketCategories || {};
}

function addTicketCategory(id, label, description, emoji = '🎫', roles = [], welcomeMessage = '') {
  const cleanId = id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  if (!cleanId) throw new Error('Identifiant de catégorie invalide.');

  const current = loadSettings();
  if (!current.ticketCategories) current.ticketCategories = {};

  current.ticketCategories[cleanId] = {
    id: cleanId,
    label: label.trim(),
    description: description ? description.trim() : `Demandes concernant ${label}`,
    emoji: emoji.trim() || '🎫',
    roles: Array.isArray(roles) ? roles : [],
    welcomeMessage: welcomeMessage.trim() || `Bienvenue dans votre ticket **${label}**.\nUn membre de l'équipe va vous prendre en charge sous peu.`
  };

  saveSettings(current);
  return current.ticketCategories[cleanId];
}

function removeTicketCategory(id) {
  const cleanId = id.toLowerCase().trim();
  const current = loadSettings();
  if (current.ticketCategories && current.ticketCategories[cleanId]) {
    delete current.ticketCategories[cleanId];
    saveSettings(current);
    return true;
  }
  return false;
}

function getTicketSettings() {
  const current = loadSettings();
  return current.ticketSettings || { categoryChannelId: '', logChannelId: '', ticketCount: 0 };
}

function updateTicketSettings(partial) {
  const current = loadSettings();
  current.ticketSettings = { ...current.ticketSettings, ...partial };
  saveSettings(current);
  return current.ticketSettings;
}

function incrementTicketCount() {
  const current = loadSettings();
  if (!current.ticketSettings) current.ticketSettings = { categoryChannelId: '', logChannelId: '', ticketCount: 0 };
  current.ticketSettings.ticketCount = (current.ticketSettings.ticketCount || 0) + 1;
  saveSettings(current);
  return current.ticketSettings.ticketCount;
}

module.exports = {
  getSettings,
  saveSettings,
  updateSetting,
  setChannel,
  setLoggingOption,
  setMdtUrl,
  addCustomCommand,
  removeCustomCommand,
  getCustomCommands,
  getTicketCategories,
  addTicketCategory,
  removeTicketCategory,
  getTicketSettings,
  updateTicketSettings,
  incrementTicketCount
};
