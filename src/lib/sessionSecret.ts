// No imports: shared by middleware (Edge runtime) and Node routes.
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (ou NEXTAUTH_SECRET) doit être défini en production.");
  }
  return "lspd-mdt-dev-only-secret";
}
