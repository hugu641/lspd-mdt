const fs = require('fs');
const path = require('path');

const SALAIRES_FILE = path.resolve(__dirname, '../../data/salaires.json');

function getSalaires() {
  try {
    if (!fs.existsSync(SALAIRES_FILE)) {
      return { title: 'GRILLE SALARIALE LSPD', period: 'par service', grades: [], primes_speciales: [] };
    }
    const raw = fs.readFileSync(SALAIRES_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Erreur getSalaires :', err);
    return { title: 'GRILLE SALARIALE LSPD', period: 'par service', grades: [], primes_speciales: [] };
  }
}

function saveSalaires(data) {
  try {
    fs.writeFileSync(SALAIRES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erreur saveSalaires :', err);
    return false;
  }
}

function addOrUpdateGrade(rank, salary, prime = 'N/A', description = '') {
  const data = getSalaires();
  if (!Array.isArray(data.grades)) data.grades = [];

  const existingIdx = data.grades.findIndex(g => g.rank.toLowerCase() === rank.toLowerCase());
  const entry = {
    rank: rank.trim(),
    salary: salary.trim(),
    prime: prime.trim(),
    description: description.trim()
  };

  if (existingIdx !== -1) {
    data.grades[existingIdx] = entry;
  } else {
    data.grades.push(entry);
  }

  saveSalaires(data);
  return entry;
}

function removeGrade(rank) {
  const data = getSalaires();
  if (!Array.isArray(data.grades)) return false;

  const initialLength = data.grades.length;
  data.grades = data.grades.filter(g => g.rank.toLowerCase() !== rank.toLowerCase());

  if (data.grades.length < initialLength) {
    saveSalaires(data);
    return true;
  }
  return false;
}

module.exports = {
  getSalaires,
  saveSalaires,
  addOrUpdateGrade,
  removeGrade
};
