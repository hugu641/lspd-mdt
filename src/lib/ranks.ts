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

export const HIGH_COMMAND_RANKS = [
  "Directeur US Marshal",
  "US Marshal - Superviseur Légal",
  "US Marshal",
  "Chief of Police",
  "Assistant-Chief",
  "Deputy-Chief",
  "Commandant",
  "Capitaine",
];

/**
 * Checks if an officer is part of High Command (US Marshal, État-Major, Capitaine+)
 * or holds administrator privileges.
 */
export function isHighCommand(
  officer?: { rank?: string | null; department?: string | null; isAdmin?: boolean | null } | null
): boolean {
  if (!officer) return false;
  if (officer.isAdmin) return true;

  const cleanRank = (officer.rank || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const dept = (officer.department || "").toLowerCase().trim();

  if (dept.includes("marshal")) return true;

  const highCommandKeywords = [
    "directeur",
    "marshal",
    "marshall",
    "chiefofpolice",
    "chief",
    "assistantchief",
    "deputychief",
    "commandant",
    "capitaine",
  ];

  return highCommandKeywords.some((keyword) => cleanRank.includes(keyword));
}
