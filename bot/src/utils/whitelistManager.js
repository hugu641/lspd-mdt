const fs = require('fs');
const path = require('path');

const WHITELIST_FILE = path.resolve(__dirname, '../../data/whitelist.json');

function getWhitelist() {
  try {
    if (!fs.existsSync(WHITELIST_FILE)) {
      const def = { allowedGuildIds: [], allowedInviteCodes: [] };
      saveWhitelist(def);
      return def;
    }
    const raw = fs.readFileSync(WHITELIST_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Erreur getWhitelist :', err);
    return { allowedGuildIds: [], allowedInviteCodes: [] };
  }
}

function saveWhitelist(data) {
  try {
    fs.writeFileSync(WHITELIST_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erreur saveWhitelist :', err);
    return false;
  }
}

function addEntry(input) {
  const data = getWhitelist();
  if (!Array.isArray(data.allowedGuildIds)) data.allowedGuildIds = [];
  if (!Array.isArray(data.allowedInviteCodes)) data.allowedInviteCodes = [];

  const clean = input.trim();

  // Si c'est un lien complet (ex: https://discord.gg/abcde)
  const inviteRegex = /(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9\-]+)/i;
  const match = clean.match(inviteRegex);
  const code = match ? match[1] : clean;

  // Si c'est un ID numérique Discord (17-20 chiffres)
  if (/^\d{16,21}$/.test(code)) {
    if (!data.allowedGuildIds.includes(code)) {
      data.allowedGuildIds.push(code);
      saveWhitelist(data);
      return { type: 'guildId', value: code };
    }
    return { type: 'already_exists', value: code };
  }

  // Sinon c'est un code textuel d'invitation
  if (!data.allowedInviteCodes.map(c => c.toLowerCase()).includes(code.toLowerCase())) {
    data.allowedInviteCodes.push(code);
    saveWhitelist(data);
    return { type: 'code', value: code };
  }

  return { type: 'already_exists', value: code };
}

function removeEntry(input) {
  const data = getWhitelist();
  const clean = input.trim();

  let removed = false;

  if (Array.isArray(data.allowedGuildIds)) {
    const idx = data.allowedGuildIds.indexOf(clean);
    if (idx !== -1) {
      data.allowedGuildIds.splice(idx, 1);
      removed = true;
    }
  }

  if (Array.isArray(data.allowedInviteCodes)) {
    const idx = data.allowedInviteCodes.findIndex(c => c.toLowerCase() === clean.toLowerCase());
    if (idx !== -1) {
      data.allowedInviteCodes.splice(idx, 1);
      removed = true;
    }
  }

  if (removed) {
    saveWhitelist(data);
  }

  return removed;
}

module.exports = {
  getWhitelist,
  saveWhitelist,
  addEntry,
  removeEntry
};
