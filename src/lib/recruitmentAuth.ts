/**
 * Permission checker for the LSPD Recruitment category (/recruitment).
 *
 * Authorized personnel:
 * - Recruteurs (isRecruiter: true)
 * - Deputy / Deputi / Deputy Chief
 * - Assistant Chief
 * - Chief of Police
 * - US Marshal (all US Marshal ranks & department)
 * - MDT Admins (isAdmin: true)
 */
export function hasRecruitmentAccess(officer: any): boolean {
  if (!officer) return false;

  // 1. MDT Admin
  if (officer.isAdmin) return true;

  // 2. Official Recruiter status
  if (officer.isRecruiter) return true;

  const rank = (officer.rank || "").toLowerCase().trim();
  const department = (officer.department || "").toLowerCase().trim();

  // 3. US Marshal (all Marshals have oversight access)
  if (
    department.includes("marshal") ||
    rank.includes("marshal") ||
    rank.includes("marshall")
  ) {
    return true;
  }

  // 4. Chief of Police, Assistant Chief, Deputy Chief, Deputi
  if (
    rank.includes("chief") ||
    rank.includes("deputy") ||
    rank.includes("deputi") ||
    rank.includes("commandant") ||
    rank.includes("capitaine")
  ) {
    return true;
  }

  return false;
}
