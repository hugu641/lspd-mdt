// Official hierarchy and permissions for LSPD & US Marshal

export const LSPD_RANK_NAMES = [
  "Directeur US Marshal",
  "US Marshal - Superviseur Légal",
  "US Marshal",
  "Chief of Police",
  "Assistant-Chief",
  "Deputy-Chief",
  "Commandant",
  "Capitaine",
  "Lieutenant-Chef",
  "Lieutenant",
  "Sergent-Chef",
  "Sergent",
  "SLO",
  "Officier III",
  "Officier II",
  "Officier I",
  "Rookie",
];

// High Command ranks authorized to strip roles and delete officers
// Strictly limited to US Marshal, Chief of Police, Assistant-Chief, and Deputy-Chief.
// (Excludes Capitaine and Commandant)
export const HIGH_COMMAND_RANKS = [
  "Directeur US Marshal",
  "US Marshal - Superviseur Légal",
  "US Marshal",
  "Chief of Police",
  "Assistant-Chief",
  "Deputy-Chief",
];

/**
 * Checks if an officer is part of High Command (US Marshal, Chief, Assistant-Chief, Deputy-Chief)
 * Excludes Capitaine and Commandant.
 */
export function isHighCommand(
  officer?: { rank?: string | null; department?: string | null; isAdmin?: boolean | null } | null
): boolean {
  if (!officer) return false;

  const cleanRank = (officer.rank || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const dept = (officer.department || "").toLowerCase().trim();

  // 1. All US Marshal members have high command / admin rights
  if (dept.includes("marshal") || cleanRank.includes("marshal") || cleanRank.includes("marshall")) {
    return true;
  }

  // 2. High Command police ranks ONLY: Chief of Police, Assistant-Chief, Deputy-Chief
  const highCommandKeywords = [
    "chiefofpolice",
    "assistantchief",
    "deputychief",
  ];

  if (highCommandKeywords.some((keyword) => cleanRank.includes(keyword))) {
    return true;
  }

  // 3. Strictly exclude Capitaine and Commandant from high command actions
  if (cleanRank.includes("capitaine") || cleanRank.includes("commandant")) {
    return false;
  }

  return Boolean(officer.isAdmin);
}
