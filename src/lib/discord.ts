import crypto from "crypto";
import { prisma } from "./prisma";
import { getSessionSecret } from "./sessionSecret";
import { cookies } from "next/headers";
import { isHighCommand } from "./ranks";

export interface DiscordConfig {
  botToken?: string;
  guildId?: string;
  clientId?: string;
  clientSecret?: string;
  welcomeChannelId?: string;
  autoSyncRoles: boolean;
  sendWelcomeDm: boolean;
  authRequired: boolean;
  allowedRoles?: string;
  roleMappings?: Record<string, string>; // { "Chief of Police": "roleId", ... }
}

// Official LSPD & US Marshal Ranks for matching
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

/**
 * Robust rank detector that cleans emojis, decorators and typos
 * (e.g. "👮‍♂️︙Rookie︙" -> "Rookie", "⚖️ Directeur US Marshal" -> "Directeur US Marshal")
 */
export function detectRankFromRoleNames(roleNames: string[]): string | null {
  // 1. Check US Marshal roles first (Admins du serveur)
  for (const roleName of roleNames) {
    const clean = roleName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.includes("directeur") && (clean.includes("marshal") || clean.includes("marshall"))) {
      return "Directeur US Marshal";
    }
    if (clean.includes("superviseur") && (clean.includes("marshal") || clean.includes("marshall"))) {
      return "US Marshal - Superviseur Légal";
    }
    if (clean.includes("marshal") || clean.includes("marshall")) {
      return "US Marshal";
    }
  }

  // 2. Check standard police ranks
  for (const rank of LSPD_RANK_NAMES) {
    const cleanRank = rank.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const roleName of roleNames) {
      const cleanRole = roleName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace("offcier", "officier");
      if (cleanRole.includes(cleanRank)) {
        return rank;
      }
    }
  }
  return null;
}

const DEFAULT_ALLOWED_ROLES = [
  "*",
  "LSPD",
  "Police",
  "Marshal",
  "Marshall",
  "US Marshal",
  "LS Marshall",
  "Directeur US Marshal",
  "Admin",
  "Administrateur",
  "Fondateur",
  "Owner",
  "Staff",
  "Direction",
  "Développeur",
  "Chief of Police",
  "Assistant-Chief",
  "Deputy-Chief",
  "Commandant",
  "Capitaine",
  "Lieutenant",
  "Sergent-Chef",
  "Sergent",
  "SLO",
  "Officier III",
  "Officier II",
  "Officier I",
  "Rookie",
  "Agent",
  "Membre LSPD",
];

/**
 * Retrieve Discord Bot & OAuth settings (DB preferred, fallback to process.env)
 */
export async function getDiscordConfig(): Promise<DiscordConfig> {
  try {
    const setting = await prisma.discordSetting.findUnique({
      where: { id: "default" },
    });

    const botToken = setting?.botToken || process.env.DISCORD_BOT_TOKEN || "";
    const guildId = setting?.guildId || process.env.DISCORD_GUILD_ID || "";
    const clientId = setting?.clientId || process.env.DISCORD_CLIENT_ID || "";
    const clientSecret = setting?.clientSecret || process.env.DISCORD_CLIENT_SECRET || "";
    const welcomeChannelId = setting?.welcomeChannelId || process.env.DISCORD_WELCOME_CHANNEL_ID || "";
    const autoSyncRoles = setting ? setting.autoSyncRoles : true;
    const sendWelcomeDm = setting ? setting.sendWelcomeDm : true;
    const authRequired = setting ? setting.authRequired : true;
    const allowedRoles = setting?.allowedRoles || process.env.DISCORD_ALLOWED_ROLES || DEFAULT_ALLOWED_ROLES.join(",");
    let roleMappings: Record<string, string> = {};

    if (setting?.roleMappings) {
      try {
        roleMappings = JSON.parse(setting.roleMappings);
      } catch (e) {
        roleMappings = {};
      }
    }

    return {
      botToken,
      guildId,
      clientId,
      clientSecret,
      welcomeChannelId,
      autoSyncRoles,
      sendWelcomeDm,
      authRequired,
      allowedRoles,
      roleMappings,
    };
  } catch (error) {
    console.error("Error retrieving Discord config:", error);
    return {
      botToken: process.env.DISCORD_BOT_TOKEN || "",
      guildId: process.env.DISCORD_GUILD_ID || "",
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      welcomeChannelId: process.env.DISCORD_WELCOME_CHANNEL_ID || "",
      autoSyncRoles: true,
      sendWelcomeDm: true,
      authRequired: true,
      allowedRoles: DEFAULT_ALLOWED_ROLES.join(","),
      roleMappings: {},
    };
  }
}

/**
 * Compute the canonical Base URL from the incoming request.
 * On Render / Docker, req.url is "http://localhost:10000".
 * This helper resolves the real public domain (e.g. "https://ruby-mdt.onrender.com").
 */
export function getRequestBaseUrl(req: Request): string {
  const envUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.RENDER_EXTERNAL_URL;
  if (envUrl) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const hostHeader = req.headers.get("host");
  const host = forwardedHost || hostHeader;

  if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes(":10000")) {
    return `https://${host}`;
  }

  const url = new URL(req.url);
  if (url.port === "10000" || (host && host.includes("10000"))) {
    return "https://ruby-mdt.onrender.com";
  }

  const isLocal = !host || host.includes("localhost") || host.includes("127.0.0.1");
  if (isLocal) {
    return `http://${host || "localhost:3000"}`;
  }

  return `https://${host}`;
}

/**
 * Compute the canonical OAuth2 Redirect URI from the incoming request.
 */
export function getRequestRedirectUri(req: Request): string {
  const baseUrl = getRequestBaseUrl(req);
  return `${baseUrl}/api/auth/discord/callback`;
}

/**
 * Generate Discord OAuth2 Authorization URL
 */
export async function getDiscordOAuthUrl(redirectUri: string) {
  const config = await getDiscordConfig();
  const clientId = config.clientId;
  if (!clientId) {
    throw new Error("Client ID Discord non configuré. Allez dans Administration > Bot Discord & Rôles Auto.");
  }

  const scopes = encodeURIComponent("identify guilds guilds.members.read");
  const encodedRedirect = encodeURIComponent(redirectUri);

  return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirect}&response_type=code&scope=${scopes}`;
}

/**
 * Exchange OAuth2 Code for Access Token
 */
export async function exchangeDiscordCode(code: string, redirectUri: string) {
  const config = await getDiscordConfig();
  const clientId = config.clientId;
  const clientSecret = config.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("Identifiants OAuth Discord (Client ID / Client Secret) non configurés.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Échec de l'échange OAuth2 Discord (${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Fetch Discord User Profile
 */
export async function getDiscordUser(accessToken: string) {
  const res = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Impossible de récupérer le profil Discord de l'utilisateur.");
  }

  return await res.json();
}

/**
 * Check if a Discord user is an authorized LSPD Officer
 * Verifies guild membership, allowed roles, or database officer match
 */
export async function checkUserLSPDAccess(discordUser: any, userAccessToken?: string) {
  const config = await getDiscordConfig();
  const guildId = config.guildId;
  const botToken = config.botToken;

  // 1. Fetch member on the guild using Bot Token to check roles & rank
  let member: any = null;
  let memberRolesNames: string[] = [];

  if (botToken && guildId) {
    try {
      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordUser.id}`,
        { headers: { Authorization: `Bot ${botToken}` } }
      );
      if (memberRes.ok) {
        member = await memberRes.json();
        const memberRoleIds: string[] = member.roles || [];

        const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
          headers: { Authorization: `Bot ${botToken}` },
        });
        if (rolesRes.ok) {
          const guildRoles = await rolesRes.json();
          memberRolesNames = guildRoles
            .filter((r: any) => memberRoleIds.includes(r.id))
            .map((r: any) => r.name);
        }
      }
    } catch (fetchErr) {
      console.error("Error fetching Discord member roles:", fetchErr);
    }
  }

  // Detect explicit rank from Discord roles (e.g. "👮‍♂️︙Rookie︙" -> "Rookie")
  const detectedRank = detectRankFromRoleNames(memberRolesNames);

  // Check if member has admin/founder/star permissions on Discord
  const isAdminOrFounder = memberRolesNames.some((r) => {
    const lower = r.toLowerCase().trim();
    return (
      lower === "*" ||
      lower.includes("fondateur") ||
      lower.includes("owner") ||
      lower.includes("admin") ||
      lower.includes("direction") ||
      lower.includes("staff")
    );
  });

  // 2. Check if an Officer is already linked with this discordId in DB
  let existingOfficer = await prisma.officer.findFirst({
    where: {
      OR: [
        { discordId: discordUser.id },
        { discordTag: { equals: discordUser.username, mode: "insensitive" } },
      ],
    },
    include: {
      badges: { include: { course: true } },
    },
  });

  if (existingOfficer) {
    // Dynamically synchronize rank & profile data from Discord on login!
    const updatePayload: Record<string, any> = {};
    if (!existingOfficer.discordId) {
      updatePayload.discordId = discordUser.id;
      updatePayload.discordTag = discordUser.username;
    }
    // If a rank is detected on Discord and differs from DB, update DB to match Discord!
    const isMarshal =
      (detectedRank && detectedRank.toLowerCase().includes("marshal")) ||
      memberRolesNames.some((r) => r.toLowerCase().includes("marshal") || r.toLowerCase().includes("marshall"));

    if (detectedRank && existingOfficer.rank !== detectedRank) {
      updatePayload.rank = detectedRank;
    }
    if ((isAdminOrFounder || isMarshal) && !existingOfficer.isAdmin) {
      updatePayload.isAdmin = true;
    }
    if (isMarshal && existingOfficer.department !== "US Marshal") {
      updatePayload.department = "US Marshal";
    }
    if (discordUser.avatar && !existingOfficer.avatarUrl) {
      updatePayload.avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
    }

    const hasRecruiterRole = memberRolesNames.some((r) => {
      const lower = r.toLowerCase().trim();
      return lower.includes("recruteur") || lower.includes("recrutement");
    });
    if (hasRecruiterRole && !existingOfficer.isRecruiter) {
      updatePayload.isRecruiter = true;
    }

    // Ensure badgeNumber is in sync with name if formatted as "04 | Hugo Derma" (LSPD only)
    if (!isMarshal) {
      const nameBadgeMatch = existingOfficer.name.match(/^(\d{1,4})\s*\|/);
      if (nameBadgeMatch && nameBadgeMatch[1] && existingOfficer.badgeNumber !== nameBadgeMatch[1]) {
        updatePayload.badgeNumber = nameBadgeMatch[1];
        updatePayload.callsign = `${(updatePayload.rank || existingOfficer.rank || "").toUpperCase()}-${nameBadgeMatch[1]}`;
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      existingOfficer = await prisma.officer.update({
        where: { id: existingOfficer.id },
        data: updatePayload,
        include: { badges: { include: { course: true } } },
      });
    }

    return {
      allowed: true,
      officer: existingOfficer,
      reason: `Connexion réussie • Agent #${existingOfficer.badgeNumber} (${existingOfficer.rank})`,
    };
  }

  // 3. If no bot token or guildId, check if authRequired is disabled
  if (!botToken || !guildId) {
    if (!config.authRequired) {
      return {
        allowed: true,
        reason: "Mode démo (serveur Discord non configuré).",
      };
    }
    return {
      allowed: false,
      reason: "Le serveur Discord LSPD n'est pas configuré dans l'administration.",
    };
  }

  // If member was not found on the guild
  if (!member) {
    return {
      allowed: false,
      reason: `Vous n'êtes pas membre du serveur Discord LSPD. Rejoignez le serveur avec votre compte Discord (${discordUser.username}).`,
    };
  }

  // Check allowed roles
  const allowedList = (config.allowedRoles || DEFAULT_ALLOWED_ROLES.join(","))
    .split(",")
    .map((r) => r.trim().toLowerCase());

  const matchedRole =
    memberRolesNames.find((roleName) =>
      allowedList.some((allowed) => roleName.toLowerCase().includes(allowed) || allowed === "*")
    ) || (isAdminOrFounder ? "Fondateur / Admin Discord" : null) || (detectedRank ? detectedRank : null);

  if (!matchedRole) {
    return {
      allowed: false,
      reason: `Accès refusé : Aucun rôle LSPD valide détecté sur votre profil Discord. Vos rôles actuels : [${
        memberRolesNames.length > 0 ? memberRolesNames.join(", ") : "Aucun rôle"
      }]. Attribuez-vous le rôle LSPD ou votre grade sur votre serveur Discord.`,
    };
  }

  // Final Rank: Priority to detected role rank (e.g. Rookie), fallback to Chief if admin, or Rookie
  const finalRank = detectedRank || (isAdminOrFounder ? "Chief of Police" : "Rookie");
  const isNewOfficerMarshal =
    finalRank.toLowerCase().includes("marshal") ||
    memberRolesNames.some((r) => r.toLowerCase().includes("marshal") || r.toLowerCase().includes("marshall"));

  const displayName = member.nick || discordUser.global_name || discordUser.username;
  const extractedBadge = !isNewOfficerMarshal ? displayName.match(/^(\d{1,4})\s*\|/) : null;
  const badgeNum = isNewOfficerMarshal
    ? `USMS-${discordUser.id.slice(-4)}`
    : extractedBadge
    ? extractedBadge[1]
    : Math.floor(10 + Math.random() * 89).toString();
  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  const newOfficer = await prisma.officer.create({
    data: {
      badgeNumber: badgeNum,
      name: displayName,
      callsign: `${finalRank.toUpperCase()}-${badgeNum}`,
      rank: finalRank,
      department: isNewOfficerMarshal ? "US Marshal" : "LSPD",
      avatarUrl,
      discordId: discordUser.id,
      discordTag: discordUser.username,
      status: "10-8",
      unitType: isNewOfficerMarshal ? "David" : "Adam",
      isInstructor: memberRolesNames.some((r) => r.toLowerCase().includes("instructeur") || r.toLowerCase().includes("fto")),
      isRecruiter: memberRolesNames.some((r) => r.toLowerCase().includes("recruteur") || r.toLowerCase().includes("recrutement")),
      isAdmin:
        finalRank === "Chief of Police" ||
        finalRank === "Assistant-Chief" ||
        finalRank === "Deputy-Chief" ||
        isAdminOrFounder ||
        isNewOfficerMarshal,
    },
    include: {
      badges: { include: { course: true } },
    },
  });

  return {
    allowed: true,
    officer: newOfficer,
    matchedRole,
    reason: `Compte agent créé avec succès • Grade : ${finalRank} • Matricule #${badgeNum}.`,
  };
}

/**
 * Sign a secure session token
 */
export function createSessionToken(payload: {
  officerId: string;
  discordId: string;
  username: string;
  rank: string;
  name: string;
}) {
  const data = {
    ...payload,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };

  const jsonStr = JSON.stringify(data);
  const base64Data = Buffer.from(jsonStr).toString("base64url");
  const signature = crypto.createHmac("sha256", getSessionSecret()).update(base64Data).digest("base64url");

  return `${base64Data}.${signature}`;
}

/**
 * Verify a session token
 */
export function verifySessionToken(token: string) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [base64Data, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", getSessionSecret()).update(base64Data).digest("base64url");

    if (signature !== expectedSig) return null;

    const jsonStr = Buffer.from(base64Data, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr);

    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Test Bot Token & Guild connection
 */
export async function testDiscordConnection(overrideToken?: string, overrideGuildId?: string) {
  const config = await getDiscordConfig();
  const token = overrideToken || config.botToken;
  const guildId = overrideGuildId || config.guildId;

  if (!token) {
    return { success: false, error: "Aucun token Discord Bot renseigné." };
  }

  try {
    // 1. Check Bot Identity
    const meRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!meRes.ok) {
      const errJson = await meRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Token invalide ou non autorisé (code HTTP ${meRes.status}): ${JSON.stringify(errJson)}`,
      };
    }

    const botUser = await meRes.json();

    // 2. If Guild ID provided, check guild & roles
    let guildInfo: any = null;
    let roles: any[] = [];

    if (guildId) {
      const guildRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
        {
          headers: { Authorization: `Bot ${token}` },
        }
      );

      if (guildRes.ok) {
        guildInfo = await guildRes.json();
      }

      const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${token}` },
      });

      if (rolesRes.ok) {
        roles = await rolesRes.json();
      }
    }

    return {
      success: true,
      bot: botUser,
      guild: guildInfo,
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        position: r.position,
      })),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau avec l'API Discord." };
  }
}

/**
 * Send Direct Message (MP) to a Discord user
 */
export async function sendDiscordDM(
  userId: string,
  messageData: { content?: string; embeds?: any[] }
) {
  const config = await getDiscordConfig();
  const token = config.botToken;

  if (!token) {
    console.warn("Discord DM skipped: No bot token configured.");
    return { success: false, error: "Bot token manquant." };
  }

  const cleanUserId = userId.trim().replace(/[<@!>]/g, "");
  if (!cleanUserId || !/^\d{17,20}$/.test(cleanUserId)) {
    return { success: false, error: `ID Discord invalide: "${userId}" (doit comporter 17 à 20 chiffres).` };
  }

  try {
    // 1. Open DM channel with recipient
    const channelRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: cleanUserId }),
    });

    if (!channelRes.ok) {
      const err = await channelRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Impossible d'ouvrir le canal MP avec l'utilisateur ${cleanUserId}: ${JSON.stringify(err)}`,
      };
    }

    const channel = await channelRes.json();

    // 2. Send Message / Embed
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    if (!msgRes.ok) {
      const err = await msgRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Impossible d'envoyer le message MP: ${JSON.stringify(err)}`,
      };
    }

    return { success: true, messageId: (await msgRes.json()).id };
  } catch (err: any) {
    console.error("sendDiscordDM error:", err);
    return { success: false, error: err?.message || "Erreur interne envoi MP Discord" };
  }
}

/**
 * Send official LSPD Welcome DM to a newly created officer
 */
export async function sendWelcomeDM(officer: {
  name: string;
  badgeNumber: string;
  rank: string;
  callsign: string;
  unitType?: string;
  department?: string;
  phone?: string | null;
  discordId: string;
}) {
  const embed = {
    title: "🛡️ LOS SANTOS POLICE DEPARTMENT • DOSSIER D'INCORPORATION",
    color: 0x7c3aed, // Cyber Violet
    description: `Bonjour **${officer.name}**,\n\nVotre dossier de recrutement au sein du **Los Santos Police Department** a été validé par le Haut Commandement. Vos accès au terminal MDT sont désormais actifs.`,
    fields: [
      {
        name: "👤 Identité",
        value: `\`${officer.name}\``,
        inline: true,
      },
      {
        name: "🎖️ Matricule",
        value: `\`Badge #${officer.badgeNumber}\``,
        inline: true,
      },
      {
        name: "⭐ Grade Officiel",
        value: `**${officer.rank}**`,
        inline: true,
      },
      {
        name: "📻 Indicatif Radio",
        value: `\`${officer.callsign}\``,
        inline: true,
      },
      {
        name: "🚓 Unité d'Affectation",
        value: `\`${officer.unitType || "Lincoln"}\``,
        inline: true,
      },
      {
        name: "📡 Fréquence Radio",
        value: "`91.4 MHz`",
        inline: true,
      },
      {
        name: "💻 Accès MDT & Registres",
        value: "[Accéder au terminal MDT](https://lspd-mdt.onrender.com)",
        inline: false,
      },
      {
        name: "📌 Instructions Opérationnelles",
        value:
          "• Prenez votre service en radio avec le code `10-8`.\n• Consultez le planning hebdomadaire pour valider vos brevets de conduite et tir.\n• Respectez scrupuleusement la nomenclature du Code Pénal.",
        inline: false,
      },
    ],
    footer: {
      text: "LSPD Central Command • Notification Sécurisée Automatique",
    },
    timestamp: new Date().toISOString(),
  };

  return await sendDiscordDM(officer.discordId, {
    content: `👋 Bienvenue dans le service, **${officer.name}** ! Voici votre récapitulatif opérationnel :`,
    embeds: [embed],
  });
}

/**
 * Sync Discord Roles for an officer on the Discord Server
 */
export async function syncOfficerDiscordRoles(officer: {
  discordId: string;
  rank: string;
  department?: string;
  isInstructor?: boolean;
  isRecruiter?: boolean;
}) {
  const config = await getDiscordConfig();
  const token = config.botToken;
  const guildId = config.guildId;

  if (!token || !guildId) {
    return { success: false, error: "Configuration Discord incomplète (token ou guildId manquant)." };
  }

  const cleanUserId = officer.discordId.trim().replace(/[<@!>]/g, "");
  if (!cleanUserId || !/^\d{17,20}$/.test(cleanUserId)) {
    return { success: false, error: `ID Discord invalide: ${officer.discordId}` };
  }

  try {
    // 1. Fetch Guild Roles
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!rolesRes.ok) {
      return { success: false, error: "Impossible de récupérer les rôles du serveur Discord." };
    }
    const allRoles: any[] = await rolesRes.json();

    // 2. Fetch Guild Member
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}`,
      {
        headers: { Authorization: `Bot ${token}` },
      }
    );
    if (!memberRes.ok) {
      return {
        success: false,
        error: `Membre Discord introuvable sur le serveur (ID: ${cleanUserId}). Vérifiez qu'il a bien rejoint le serveur.`,
      };
    }
    const member = await memberRes.json();
    const currentMemberRoleIds: string[] = member.roles || [];

    // 3. Find Role matching target rank
    let targetRoleId: string | undefined = config.roleMappings?.[officer.rank];
    if (!targetRoleId) {
      const matchedRole = allRoles.find(
        (r) => r.name.toLowerCase().trim() === officer.rank.toLowerCase().trim()
      );
      if (matchedRole) targetRoleId = matchedRole.id;
    }

    const allServerRankRoleIds = allRoles
      .filter((r) =>
        LSPD_RANK_NAMES.some((rankName) => rankName.toLowerCase() === r.name.toLowerCase().trim())
      )
      .map((r) => r.id);

    const addedRoles: string[] = [];
    const removedRoles: string[] = [];

    // 4. Remove obsolete rank roles
    for (const roleId of currentMemberRoleIds) {
      if (allServerRankRoleIds.includes(roleId) && roleId !== targetRoleId) {
        const delRes = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}/roles/${roleId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bot ${token}` },
          }
        );
        if (delRes.ok) {
          const removedName = allRoles.find((r) => r.id === roleId)?.name || roleId;
          removedRoles.push(removedName);
        }
      }
    }

    // 5. Add target rank role
    if (targetRoleId && !currentMemberRoleIds.includes(targetRoleId)) {
      const addRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}/roles/${targetRoleId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${token}` },
        }
      );
      if (addRes.ok) {
        const addedName = allRoles.find((r) => r.id === targetRoleId)?.name || targetRoleId;
        addedRoles.push(addedName);
      }
    }

    // 6. Ensure general LSPD / Police role is assigned
    const departmentRole = allRoles.find(
      (r) =>
        r.name.toLowerCase().trim() === "lspd" ||
        r.name.toLowerCase().trim() === "police" ||
        r.name.toLowerCase().trim() === (officer.department || "lspd").toLowerCase().trim()
    );
    if (departmentRole && !currentMemberRoleIds.includes(departmentRole.id)) {
      await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}/roles/${departmentRole.id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${token}` },
        }
      );
      addedRoles.push(departmentRole.name);
    }

    // 7. Ensure Instructor / FTO role if applicable
    if (officer.isInstructor) {
      const ftoRole = allRoles.find(
        (r) =>
          r.name.toLowerCase().trim() === "instructeur" ||
          r.name.toLowerCase().trim() === "fto" ||
          r.name.toLowerCase().trim() === "instructeur fto"
      );
      if (ftoRole && !currentMemberRoleIds.includes(ftoRole.id)) {
        await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}/roles/${ftoRole.id}`,
          {
            method: "PUT",
            headers: { Authorization: `Bot ${token}` },
          }
        );
        addedRoles.push(ftoRole.name);
      }
    }

    // 8. Ensure Recruiter role if applicable
    if (officer.isRecruiter) {
      const recruiterRole = allRoles.find(
        (r) =>
          r.name.toLowerCase().trim() === "recruteur lspd" ||
          r.name.toLowerCase().trim() === "recruteur" ||
          r.name.toLowerCase().trim() === "division recrutement"
      );
      if (recruiterRole && !currentMemberRoleIds.includes(recruiterRole.id)) {
        await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}/roles/${recruiterRole.id}`,
          {
            method: "PUT",
            headers: { Authorization: `Bot ${token}` },
          }
        );
        addedRoles.push(recruiterRole.name);
      }
    }

    return {
      success: true,
      officerName: officer.discordId,
      targetRank: officer.rank,
      addedRoles,
      removedRoles,
    };
  } catch (err: any) {
    console.error("syncOfficerDiscordRoles error:", err);
    return { success: false, error: err?.message || "Erreur de synchronisation des rôles Discord" };
  }
}

/**
 * Strip all police, rank, department, and instructor roles from an officer on Discord
 */
export async function stripOfficerDiscordRoles(discordId: string) {
  const config = await getDiscordConfig();
  const token = config.botToken;
  const guildId = config.guildId;

  if (!token || !guildId) {
    return { success: false, error: "Configuration Discord incomplète (token ou guildId manquant)." };
  }

  const cleanUserId = discordId.trim().replace(/[<@!>]/g, "");
  if (!cleanUserId || !/^\d{17,20}$/.test(cleanUserId)) {
    return { success: false, error: `ID Discord invalide: ${discordId}` };
  }

  try {
    // 1. Fetch Guild Roles
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!rolesRes.ok) {
      return { success: false, error: "Impossible de récupérer les rôles du serveur Discord." };
    }
    const allRoles: any[] = await rolesRes.json();

    // 2. Fetch Guild Member
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}`,
      {
        headers: { Authorization: `Bot ${token}` },
      }
    );
    if (!memberRes.ok) {
      return {
        success: false,
        error: `Membre Discord introuvable sur le serveur (ID: ${cleanUserId}).`,
      };
    }
    const member = await memberRes.json();
    const currentMemberRoleIds: string[] = member.roles || [];

    // 3. Match any role that corresponds to LSPD ranks or police/marshal/fto tags
    const rolesToStrip = allRoles.filter((r) => {
      const cleanName = r.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const isRank = LSPD_RANK_NAMES.some((rankName) => {
        const cleanRank = rankName.toLowerCase().replace(/[^a-z0-9]/g, "");
        return cleanName.includes(cleanRank);
      });
      const isServiceRole =
        cleanName.includes("lspd") ||
        cleanName.includes("police") ||
        cleanName.includes("cadet") ||
        cleanName.includes("rookie") ||
        cleanName.includes("officier") ||
        cleanName.includes("sergent") ||
        cleanName.includes("lieutenant") ||
        cleanName.includes("capitaine") ||
        cleanName.includes("commandant") ||
        cleanName.includes("fto") ||
        cleanName.includes("instructeur") ||
        cleanName.includes("marshal") ||
        cleanName.includes("marshall");

      return isRank || isServiceRole;
    });

    const removedRoles: string[] = [];
    for (const r of rolesToStrip) {
      if (currentMemberRoleIds.includes(r.id)) {
        const delRes = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}/roles/${r.id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bot ${token}` },
          }
        );
        if (delRes.ok) {
          removedRoles.push(r.name);
        }
      }
    }

    return {
      success: true,
      removedRoles,
    };
  } catch (err: any) {
    console.error("stripOfficerDiscordRoles error:", err);
    return { success: false, error: err?.message || "Erreur lors du retrait des rôles Discord" };
  }
}

/**
 * Updates a guild member's nickname on Discord (e.g. "04 | Hugo Derma")
 */
export async function updateDiscordMemberNickname(discordId: string, newNickname: string) {
  const config = await getDiscordConfig();
  const token = config.botToken;
  const guildId = config.guildId;

  if (!token || !guildId || !discordId) {
    return { success: false, error: "Configuration Discord incomplète." };
  }

  const cleanUserId = discordId.trim().replace(/[<@!>]/g, "");
  if (!cleanUserId || !/^\d{17,20}$/.test(cleanUserId)) {
    return { success: false, error: `ID Discord invalide: ${discordId}` };
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nick: newNickname.slice(0, 32),
      }),
    });

    if (res.ok) {
      return { success: true, nickname: newNickname };
    }

    const data = await res.json().catch(() => ({}));
    if (res.status === 403) {
      return {
        success: false,
        isOwner: true,
        error: "Discord interdit aux bots de modifier le pseudo du propriétaire du serveur ou d'un rôle supérieur.",
      };
    }

    return {
      success: false,
      error: data?.message || `Erreur Discord (${res.status})`,
    };
  } catch (err: any) {
    console.error("updateDiscordMemberNickname error:", err);
    return { success: false, error: err?.message || "Erreur de modification du pseudo Discord" };
  }
}

/**
 * Request to Discord Bot API to create or verify the Recruiter role on the Discord Server
 */
export async function createOrEnsureRecruiterRole() {
  const config = await getDiscordConfig();
  const token = config.botToken;
  const guildId = config.guildId;

  if (!token || !guildId) {
    return {
      success: false,
      error: "Bot Discord ou Serveur Discord non configuré dans l'Administration.",
    };
  }

  try {
    // 1. Fetch current server roles
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!rolesRes.ok) {
      const errText = await rolesRes.text();
      return {
        success: false,
        error: `Erreur API Discord (${rolesRes.status}) lors de la lecture des rôles: ${errText}`,
      };
    }

    const allRoles: any[] = await rolesRes.json();

    // 2. Check if Recruiter role already exists
    const existing = allRoles.find(
      (r) =>
        r.name.toLowerCase().trim() === "recruteur lspd" ||
        r.name.toLowerCase().trim() === "recruteur" ||
        r.name.toLowerCase().trim() === "division recrutement"
    );

    if (existing) {
      return {
        success: true,
        created: false,
        role: existing,
        message: `Le rôle Discord "${existing.name}" est déjà présent sur le serveur (ID: ${existing.id}).`,
      };
    }

    // 3. Create the role via Discord Bot API
    const createRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Recruteur LSPD",
        color: 0x9333ea, // Cyber Violet
        hoist: true,
        mentionable: true,
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Échec de création du rôle sur Discord (${createRes.status}): ${JSON.stringify(errJson)}`,
      };
    }

    const createdRole = await createRes.json();
    return {
      success: true,
      created: true,
      role: createdRole,
      message: `Rôle "${createdRole.name}" créé avec succès sur Discord (ID: ${createdRole.id}) !`,
    };
  } catch (err: any) {
    console.error("createOrEnsureRecruiterRole error:", err);
    return {
      success: false,
      error: err?.message || "Erreur de connexion à l'API Discord.",
    };
  }
}

/**
 * Create or ensure the "Cadet LSPD" role exists on the Discord Server
 */
export async function createOrEnsureCadetRole() {
  const config = await getDiscordConfig();
  const token = config.botToken;
  const guildId = config.guildId;

  if (!token || !guildId) {
    return {
      success: false,
      error: "Bot Discord ou Serveur Discord non configuré dans l'Administration.",
    };
  }

  try {
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!rolesRes.ok) {
      return {
        success: false,
        error: "Impossible d'accéder aux rôles du serveur Discord.",
      };
    }

    const allRoles: any[] = await rolesRes.json();

    const existing = allRoles.find(
      (r) =>
        r.name.toLowerCase().trim() === "cadet lspd" ||
        r.name.toLowerCase().trim() === "cadet" ||
        r.name.toLowerCase().trim() === "recrue" ||
        r.name.toLowerCase().trim() === "candidat retenu" ||
        r.name.toLowerCase().trim() === "candidature acceptée"
    );

    if (existing) {
      return {
        success: true,
        created: false,
        role: existing,
      };
    }

    // Create Cadet role
    const createRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Cadet LSPD",
        color: 0x3b82f6, // Police Blue
        hoist: true,
        mentionable: true,
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Échec de création du rôle Cadet sur Discord: ${JSON.stringify(errJson)}`,
      };
    }

    const created = await createRes.json();
    return {
      success: true,
      created: true,
      role: created,
    };
  } catch (err: any) {
    console.error("createOrEnsureCadetRole error:", err);
    return { success: false, error: err?.message || "Erreur API Discord" };
  }
}

/**
 * Assigns Discord role to accepted candidate and sends official Discord notification DM
 */
export async function assignRecruitmentAcceptedDiscordRoleAndNotify(
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    discordId?: string | null;
    interviewDate?: Date | string | null;
  },
  recruiterOfficer?: {
    name?: string;
    rank?: string;
    badgeNumber?: string;
  } | null
) {
  const config = await getDiscordConfig();
  const token = config.botToken;
  const guildId = config.guildId;

  if (!token || !guildId) {
    return {
      success: false,
      error: "Bot Discord ou Serveur Discord non configuré.",
    };
  }

  const cleanDiscordId = (candidate.discordId || "").trim().replace(/[<@!>]/g, "");
  if (!cleanDiscordId || !/^\d{17,20}$/.test(cleanDiscordId)) {
    return {
      success: false,
      roleGranted: false,
      dmSent: false,
      error: "Identifiant Discord manquant ou invalide pour ce candidat.",
    };
  }

  try {
    // 1. Get or create Cadet role
    const cadetRoleResult = await createOrEnsureCadetRole();
    if (!cadetRoleResult.success || !cadetRoleResult.role) {
      return {
        success: false,
        roleGranted: false,
        dmSent: false,
        error: cadetRoleResult.error || "Impossible d'obtenir le rôle Cadet LSPD sur Discord.",
      };
    }
    const cadetRoleId = cadetRoleResult.role.id;
    const cadetRoleName = cadetRoleResult.role.name;

    // 2. Check if candidate is on the guild
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${cleanDiscordId}`,
      { headers: { Authorization: `Bot ${token}` } }
    );

    let roleGranted = false;
    let memberNotFound = false;

    if (!memberRes.ok) {
      memberNotFound = true;
    } else {
      // 3. Assign role to candidate
      const assignRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${cleanDiscordId}/roles/${cadetRoleId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${token}` },
        }
      );
      if (assignRes.ok || assignRes.status === 204) {
        roleGranted = true;
      }
    }

    // 4. Send official Acceptance DM via Bot
    const recruiterLabel = recruiterOfficer?.rank
      ? `${recruiterOfficer.rank} ${recruiterOfficer.name} (#${recruiterOfficer.badgeNumber})`
      : "Division Recrutement LSPD";

    const embedFields: any[] = [
      {
        name: "📋 Décision du Recrutement",
        value: "✅ **Candidature Acceptée**",
        inline: true,
      },
      {
        name: "🎖️ Rôle Discord Obtenu",
        value: `\`${cadetRoleName}\``,
        inline: true,
      },
      {
        name: "👮‍♂️ Officier Référent",
        value: recruiterLabel,
        inline: true,
      },
    ];

    if (candidate.interviewDate) {
      embedFields.push({
        name: "📅 Convocation Entretien / Session",
        value: `**${new Date(candidate.interviewDate).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}**`,
        inline: false,
      });
    }

    embedFields.push(
      {
        name: "🚪 Accès aux Salons Débloqués",
        value:
          "Votre nouveau rôle vous donne immédiatement accès aux salons de recrutement, annonces d'incorporation et canaux vocaux réservés sur notre serveur Discord.",
        inline: false,
      },
      {
        name: "📌 Consignes d'Intégration",
        value:
          "• Rendez-vous dans les salons Discord nouvellement débloqués.\n• Munissez-vous de vos papiers d'identité en jeu et préparez-vous pour votre intégration.\n• Respectez le règlement et les instructions du service.",
        inline: false,
      }
    );

    const dmResult = await sendDiscordDM(cleanDiscordId, {
      content: `🎉 Félicitations **${candidate.firstName} ${candidate.lastName}** ! Votre candidature au sein du **Los Santos Police Department** a été acceptée !`,
      embeds: [
        {
          title: "🛡️ LOS SANTOS POLICE DEPARTMENT • DOSSIER D'ADMISSION",
          color: 0x10b981, // Emerald Green
          description: `Bonjour **${candidate.firstName} ${candidate.lastName}**,\n\nNous avons le plaisir de vous informer que votre candidature a été **validée avec succès** par la Division du Recrutement.`,
          fields: embedFields,
          footer: {
            text: "LSPD Recruitment Division • Notification Sécurisée Automatique",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });

    // 5. Update candidate in database
    await prisma.recruitmentCandidate.update({
      where: { id: candidate.id },
      data: {
        status: "Accepté",
        discordRoleGranted: roleGranted,
        discordNotified: dmResult.success,
      },
    });

    if (memberNotFound) {
      return {
        success: true,
        roleGranted: false,
        dmSent: dmResult.success,
        warning:
          "Le candidat n'a pas encore rejoint le serveur Discord LSPD. Le MP a été envoyé, mais le rôle Discord n'a pas pu être assigné.",
      };
    }

    return {
      success: true,
      roleGranted,
      dmSent: dmResult.success,
      message: `Rôle "${cadetRoleName}" attribué sur Discord et notification MP envoyée !`,
    };
  } catch (err: any) {
    console.error("assignRecruitmentAcceptedDiscordRoleAndNotify error:", err);
    return {
      success: false,
      error: err?.message || "Erreur interne lors de l'attribution du rôle et de la notification",
    };
  }
}

// =========================================================================
// REAL-TIME DISCORD ROLE & CERTIFICATIONS SCANNER ENGINE
// =========================================================================

export interface CertificationRule {
  keywords: string[];
  title: string;
  badgeName: string;
  badgeIcon: string;
  category: string;
  description: string;
}

export const DISCORD_CERTIFICATIONS_MAP: CertificationRule[] = [
  {
    keywords: ["ppalourd", "ppa lourd", "lourd"],
    title: "Armement Tactique & PPA Lourd",
    badgeName: "PPA Lourd",
    badgeIcon: "Crosshair",
    category: "Armement",
    description: "Habilitation au port d'arme lourde de service et d'intervention tactique.",
  },
  {
    keywords: ["ppa", "permisdeportdarme"],
    title: "Permis de Port d'Arme (PPA)",
    badgeName: "PPA Civil",
    badgeIcon: "Shield",
    category: "Armement",
    description: "Certification de maniement et port d'arme de poing réglementaire.",
  },
  {
    keywords: ["asd", "airsupport", "aerien", "supportaerien", "pilot", "helico"],
    title: "Air Support Division (ASD)",
    badgeName: "Pilote ASD",
    badgeIcon: "Plane",
    category: "Aérien",
    description: "Pilote breveté de la division aérienne de police (Hélicoptère).",
  },
  {
    keywords: ["leadnegociation", "negociat", "negociation"],
    title: "Lead Négociation & Prises d'Otage",
    badgeName: "Négociateur",
    badgeIcon: "MessageSquare",
    category: "Tactique",
    description: "Spécialiste de la désescalade, médiation et négociation de crise.",
  },
  {
    keywords: ["leaddispatch", "dispatch"],
    title: "Lead Dispatch & Régulation Radio",
    badgeName: "Lead Dispatch",
    badgeIcon: "Radio",
    category: "Procédure",
    description: "Gestion des fréquences radio, affectation des appels et supervision 10-Codes.",
  },
  {
    keywords: ["brevetpsychologique", "psychologique", "psycho"],
    title: "Brevet Psychologique & Aptitude",
    badgeName: "Brevet Psycho",
    badgeIcon: "Brain",
    category: "Spécialité",
    description: "Aptitude psychologique validée pour interventions sous haute tension.",
  },
  {
    keywords: ["formationperimetredesecurite", "perimetredesecurite", "perimetre"],
    title: "Périmètres de Sécurité & Zonage",
    badgeName: "Périmètre Sécurité",
    badgeIcon: "ShieldAlert",
    category: "Procédure",
    description: "Mise en place de cordons de sécurité, rubalise et sécurisation de scènes de crime.",
  },
  {
    keywords: ["formationcallradio", "callradio", "radiocode"],
    title: "Procédures Radio & 10-Codes",
    badgeName: "Procédures Radio",
    badgeIcon: "Radio",
    category: "Procédure",
    description: "Maîtrise des protocoles radio, 10-codes et phraséologie de service.",
  },
  {
    keywords: ["formationprocedure", "procedure", "miranda"],
    title: "Procédures Légales & Droits Miranda",
    badgeName: "Procédures Légales",
    badgeIcon: "FileText",
    category: "Procédure",
    description: "Respect des règles de garde à vue, rédaction des PV et lecture des droits.",
  },
  {
    keywords: ["formateur", "instructeur", "fto"],
    title: "Formateur Police Academy (FTO)",
    badgeName: "Instructeur FTO",
    badgeIcon: "GraduationCap",
    category: "Spécialité",
    description: "Habilité à former, évaluer et instruire les nouvelles recrues du LSPD.",
  },
  {
    keywords: ["responsablepa", "directionpa"],
    title: "Direction Police Academy",
    badgeName: "Responsable Academy",
    badgeIcon: "Award",
    category: "Spécialité",
    description: "Cadre formateur responsable du cursus d'incorporation de l'Academy.",
  },
  {
    keywords: ["recruteurpa", "recruteurlspd", "recruteur", "recrutement"],
    title: "Division du Recrutement & RH",
    badgeName: "Officier Recruteur",
    badgeIcon: "UserCheck",
    category: "Spécialité",
    description: "Officier habilité aux entretiens d'embauche et sélection des postulants.",
  },
  {
    keywords: ["hp", "highpursuit", "interception"],
    title: "High Pursuit & Interception Rapide (HP)",
    badgeName: "Pilote HP",
    badgeIcon: "Zap",
    category: "Conduite",
    description: "Conduite d'urgence avancée, manœuvres PIT et neutralisation de véhicules en fuite.",
  },
  {
    keywords: ["doa"],
    title: "Division Opérations Aériennes & Spéciales (DOA)",
    badgeName: "Opérateur DOA",
    badgeIcon: "Shield",
    category: "Tactique",
    description: "Unité d'appui opérationnel lourd et interventions coordonnées.",
  },
  {
    keywords: ["marry", "mary", "moto", "motard"],
    title: "Brigade Motorisée (Unité Mary)",
    badgeName: "Motard Police",
    badgeIcon: "Bike",
    category: "Conduite",
    description: "Pilote d'intervention motocycliste pour escorte et circulation rapide.",
  },
  {
    keywords: ["leadunites", "leadunite"],
    title: "Commandement de Quart & Lead Unités",
    badgeName: "Lead Unités",
    badgeIcon: "Star",
    category: "Tactique",
    description: "Gestion stratégique des patrouilles sur le terrain et dispatch opérationnel.",
  },
];

/**
 * Normalizes a role string to lowercase alphanumeric without accents/emojis
 */
function cleanRoleString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Sync an officer's rank, permissions, and certifications in real-time from Discord!
 */
export async function syncOfficerFromDiscord(discordIdOrOfficerId: string) {
  try {
    const config = await getDiscordConfig();
    const token = config.botToken;
    const guildId = config.guildId;

    if (!token || !guildId) {
      return null;
    }

    // 1. Find Officer in DB
    const officer = await prisma.officer.findFirst({
      where: {
        OR: [
          { discordId: discordIdOrOfficerId },
          { id: discordIdOrOfficerId },
        ],
      },
      include: {
        badges: { include: { course: true } },
      },
    });

    if (!officer || !officer.discordId) {
      return null;
    }

    const cleanDiscordId = officer.discordId.trim().replace(/[<@!>]/g, "");

    // 2. Fetch Guild Member from Discord
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${cleanDiscordId}`,
      { headers: { Authorization: `Bot ${token}` } }
    );

    if (!memberRes.ok) {
      return officer;
    }

    const member = await memberRes.json();
    const memberRoleIds: string[] = member.roles || [];

    // 3. Fetch Guild Roles
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!rolesRes.ok) {
      return officer;
    }

    const allGuildRoles: any[] = await rolesRes.json();
    const memberRoles = allGuildRoles.filter((r) => memberRoleIds.includes(r.id));
    const memberRoleNames = memberRoles.map((r) => r.name);
    const cleanedMemberRoleNames = memberRoleNames.map(cleanRoleString);

    // 4. Detect Rank
    const detectedRank = detectRankFromRoleNames(memberRoleNames);

    // 5. Detect Admin / Staff / US Marshal
    const isMarshal =
      (detectedRank && detectedRank.toLowerCase().includes("marshal")) ||
      cleanedMemberRoleNames.some((r) => r.includes("marshal") || r.includes("marshall"));

    const isAdminOrFounder =
      isMarshal ||
      detectedRank === "Chief of Police" ||
      detectedRank === "Assistant-Chief" ||
      detectedRank === "Deputy-Chief" ||
      cleanedMemberRoleNames.some(
        (r) =>
          r === "" ||
          r.includes("admin") ||
          r.includes("fondateur") ||
          r.includes("owner") ||
          r.includes("staff") ||
          r.includes("direction")
      );

    // 6. Detect Instructor & Recruiter
    const isInstructor = cleanedMemberRoleNames.some(
      (r) => r.includes("formateur") || r.includes("instructeur") || r.includes("fto") || r.includes("responsablepa")
    );

    const isRecruiter = cleanedMemberRoleNames.some(
      (r) => r.includes("recruteur") || r.includes("recrutement")
    );

    // 7. Prepare update payload
    const updateData: Record<string, any> = {};

    if (detectedRank && officer.rank !== detectedRank) {
      updateData.rank = detectedRank;
      if (!isMarshal) {
        updateData.callsign = `${detectedRank.toUpperCase()}-${officer.badgeNumber}`;
      }
    }

    if (isMarshal && officer.department !== "US Marshal") {
      updateData.department = "US Marshal";
    } else if (!isMarshal && officer.department === "US Marshal" && detectedRank && !detectedRank.includes("Marshal")) {
      updateData.department = "LSPD";
    }

    if (officer.isAdmin !== isAdminOrFounder) {
      updateData.isAdmin = isAdminOrFounder;
    }

    if (officer.isInstructor !== isInstructor) {
      updateData.isInstructor = isInstructor;
    }

    if (officer.isRecruiter !== isRecruiter) {
      updateData.isRecruiter = isRecruiter;
    }

    // Sync Discord tag / avatar if updated
    if (member.user?.username && officer.discordTag !== member.user.username) {
      updateData.discordTag = member.user.username;
    }
    if (member.user?.avatar) {
      const newAvatarUrl = `https://cdn.discordapp.com/avatars/${cleanDiscordId}/${member.user.avatar}.png`;
      if (officer.avatarUrl !== newAvatarUrl) {
        updateData.avatarUrl = newAvatarUrl;
      }
    }

    // Apply Officer DB updates if any
    let updatedOfficer = officer;
    if (Object.keys(updateData).length > 0) {
      updatedOfficer = await prisma.officer.update({
        where: { id: officer.id },
        data: updateData,
        include: { badges: { include: { course: true } } },
      });
    }

    // 8. CERTIFICATIONS / BADGES SCANNING & REAL-TIME ATTRIBUTION
    const existingBadgeCourseTitles = (updatedOfficer.badges || []).map(
      (b) => b.course?.title?.toLowerCase()
    );

    for (const certRule of DISCORD_CERTIFICATIONS_MAP) {
      // Check if user has this certification on Discord
      const hasCertificationOnDiscord = cleanedMemberRoleNames.some((cleanRole) =>
        certRule.keywords.some((kw) => cleanRole.includes(kw))
      );

      if (hasCertificationOnDiscord) {
        // Ensure the TrainingCourse exists in the database
        let course = await prisma.trainingCourse.findFirst({
          where: { title: certRule.title },
        });

        if (!course) {
          course = await prisma.trainingCourse.create({
            data: {
              title: certRule.title,
              description: certRule.description,
              category: certRule.category,
              badgeName: certRule.badgeName,
              badgeIcon: certRule.badgeIcon,
            },
          });
        }

        // Check if badge is already awarded to officer
        const alreadyHasBadge = (updatedOfficer.badges || []).some(
          (b) => b.courseId === course!.id || b.course?.title?.toLowerCase() === certRule.title.toLowerCase()
        );

        if (!alreadyHasBadge) {
          await prisma.officerBadge.create({
            data: {
              officerId: updatedOfficer.id,
              courseId: course.id,
              awardedBy: "Bot Discord • Rôle Synchronisé",
            },
          });
        }
      }
    }

    // Return the final fresh officer with all badges and relations
    return await prisma.officer.findUnique({
      where: { id: updatedOfficer.id },
      include: {
        badges: { include: { course: true } },
      },
    });
  } catch (error) {
    console.error("syncOfficerFromDiscord error:", error);
    return null;
  }
}

/**
 * Scan all officers with a Discord ID and synchronize all roles and certifications!
 */
export async function syncAllOfficersFromDiscord() {
  try {
    const config = await getDiscordConfig();
    const token = config.botToken;
    const guildId = config.guildId;

    if (!token || !guildId) {
      return {
        success: false,
        error: "Configuration Discord incomplète (botToken ou guildId manquant)",
      };
    }

    // Fetch all officers with discordId
    const officers = await prisma.officer.findMany({
      where: {
        discordId: { not: null },
      },
    });

    const results: Array<{
      id: string;
      name: string;
      badgeNumber: string;
      oldRank: string;
      newRank: string;
      badgesCount: number;
    }> = [];

    let updatedCount = 0;

    for (const off of officers) {
      if (!off.discordId) continue;
      const synced = await syncOfficerFromDiscord(off.discordId);
      if (synced) {
        const changed =
          synced.rank !== off.rank ||
          synced.isAdmin !== off.isAdmin ||
          synced.isInstructor !== off.isInstructor ||
          synced.isRecruiter !== off.isRecruiter ||
          (synced.badges?.length || 0) !== (off as any).badges?.length;

        if (changed) {
          updatedCount++;
        }

        results.push({
          id: synced.id,
          name: synced.name,
          badgeNumber: synced.badgeNumber,
          oldRank: off.rank,
          newRank: synced.rank,
          badgesCount: synced.badges?.length || 0,
        });
      }
    }

    return {
      success: true,
      totalScanned: officers.length,
      updatedCount,
      results,
    };
  } catch (error: any) {
    console.error("syncAllOfficersFromDiscord error:", error);
    return {
      success: false,
      error: error?.message || "Erreur de synchronisation globale",
    };
  }
}


/**
 * Discord settings may be edited by High Command / admins, or by anyone during
 * first setup (no OAuth Client ID yet, so nobody can log in to become admin).
 */
export async function canEditDiscordSettings(): Promise<boolean> {
  const config = await getDiscordConfig();
  if (!config.clientId) return true;
  return isHighCommand(await getSessionOfficer());
}

/** Officer of the current request's lspd_session cookie, or null. */
export async function getSessionOfficer() {
  const token = cookies().get("lspd_session")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return null;
  return prisma.officer.findUnique({ where: { id: session.officerId } });
}

/** DOA (criminal network) edit rights: High Command or officers flagged as investigators. */
export function canEditDoa(officer?: { isInvestigator?: boolean | null; rank?: string | null; department?: string | null; isAdmin?: boolean | null } | null) {
  return Boolean(officer && (officer.isInvestigator || isHighCommand(officer)));
}
