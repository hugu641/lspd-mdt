const fs = require('fs');
const path = require('path');

const WARNINGS_FILE = path.resolve(__dirname, '../../data/warnings.json');

function loadWarnings() {
  try {
    if (!fs.existsSync(WARNINGS_FILE)) {
      fs.writeFileSync(WARNINGS_FILE, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(WARNINGS_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Erreur lors du chargement des avertissements :', err);
    return {};
  }
}

function saveWarnings(data) {
  try {
    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur lors de la sauvegarde des avertissements :', err);
  }
}

function addWarning(userId, reason = 'Publicité / Lien Discord non autorisé', invite = '') {
  const all = loadWarnings();
  if (!all[userId]) {
    all[userId] = {
      count: 0,
      history: []
    };
  }

  all[userId].count += 1;
  all[userId].history.push({
    timestamp: new Date().toISOString(),
    reason,
    invite
  });

  saveWarnings(all);

  return {
    count: all[userId].count,
    isBanned: all[userId].count >= 3,
    history: all[userId].history
  };
}

function getWarnings(userId) {
  const all = loadWarnings();
  return all[userId] || { count: 0, history: [] };
}

function resetWarnings(userId) {
  const all = loadWarnings();
  if (all[userId]) {
    delete all[userId];
    saveWarnings(all);
    return true;
  }
  return false;
}

module.exports = {
  addWarning,
  getWarnings,
  resetWarnings,
  loadWarnings
};
