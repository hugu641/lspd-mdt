import crypto from "crypto";
import { prisma } from "./prisma";

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

// 13 Official LSPD Ranks for matching
export const LSPD_RANK_NAMES = [
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
];

const DEFAULT_ALLOWED_ROLES = [
  "*",
  "LSPD",
  "Police",
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

const SESSION_SECRET = process.env.SESSION_SECRET || "lspd-mdt-secret-key-cyber-violet-2026";

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
 * Compute the canonical OAuth2 Redirect URI from the incoming request.
 * Behind reverse proxies (Render, Heroku, Cloudflare, etc.), req.url protocol is "http:".
 * This helper guarantees "https://" for all non-localhost domains so Discord never rejects it.
 */
export function getRequestRedirectUri(req: Request): string {
  const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, "");
    return `${cleanUrl}/api/auth/discord/callback`;
  }

  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  let proto: string;
  if (isLocal) {
    proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http";
  } else {
    proto = "https";
  }

  return `${proto}://${host}/api/auth/discord/callback`;
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

  // 1. Check if an Officer is already linked with this discordId in DB
  const existingOfficer = await prisma.officer.findFirst({
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
    // If discordId was not explicitly set yet, set it now
    if (!existingOfficer.discordId) {
      await prisma.officer.update({
        where: { id: existingOfficer.id },
        data: { discordId: discordUser.id, discordTag: discordUser.username },
      });
    }

    return {
      allowed: true,
      officer: existingOfficer,
      reason: "Agent déjà répertorié dans les effectifs du terminal LSPD.",
    };
  }

  // 2. If no bot token or guildId, check if authRequired is disabled
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

  // 3. Fetch member on the guild using Bot Token
  try {
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUser.id}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      }
    );

    if (!memberRes.ok) {
      return {
        allowed: false,
        reason: `Vous n'êtes pas membre du serveur Discord LSPD. Rejoignez le serveur avec votre compte Discord (${discordUser.username}).`,
      };
    }

    const member = await memberRes.json();
    const memberRoleIds: string[] = member.roles || [];

    // Fetch guild roles to check names
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    let guildRoles: any[] = [];
    if (rolesRes.ok) {
      guildRoles = await rolesRes.json();
    }

    const allowedList = (config.allowedRoles || DEFAULT_ALLOWED_ROLES.join(","))
      .split(",")
      .map((r) => r.trim().toLowerCase());

    const memberRolesNames = guildRoles
      .filter((r) => memberRoleIds.includes(r.id))
      .map((r) => r.name);

    // Check if member has high-level Discord administrator/founder/star role
    const isAdminOrFounder = memberRolesNames.some((r) => {
      const lower = r.toLowerCase().trim();
      return (
        lower === "*" ||
        lower.includes("fondateur") ||
        lower.includes("owner") ||
        lower.includes("admin") ||
        lower.includes("direction") ||
        lower.includes("staff") ||
        lower.includes("développeur") ||
        lower.includes("dev")
      );
    });

    // Check if member has at least one allowed role
    const matchedRole =
      memberRolesNames.find((roleName) =>
        allowedList.includes(roleName.toLowerCase())
      ) || (isAdminOrFounder ? "Fondateur / Admin Discord" : null);

    if (!matchedRole) {
      return {
        allowed: false,
        reason: `Accès refusé : Aucun rôle LSPD valide détecté sur votre profil Discord. Vos rôles actuels : [${
          memberRolesNames.length > 0 ? memberRolesNames.join(", ") : "Aucun rôle"
        }]. Attribuez-vous le rôle LSPD ou votre grade sur votre serveur Discord.`,
      };
    }

    // Determine rank: if admin/founder default to Chief of Police, else Rookie
    let detectedRank = isAdminOrFounder ? "Chief of Police" : "Rookie";
    for (const rank of LSPD_RANK_NAMES) {
      if (memberRolesNames.some((r) => r.toLowerCase().trim() === rank.toLowerCase().trim())) {
        detectedRank = rank;
        break;
      }
    }

    const displayName = member.nick || discordUser.global_name || discordUser.username;
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    // If Chief of Police exists in DB without a linked discordId, link directly to this Founder/Admin!
    if (isAdminOrFounder) {
      const unlinkedChief = await prisma.officer.findFirst({
        where: { rank: "Chief of Police", discordId: null },
        include: { badges: { include: { course: true } } },
      });
      if (unlinkedChief) {
        const updatedOfficer = await prisma.officer.update({
          where: { id: unlinkedChief.id },
          data: {
            discordId: discordUser.id,
            discordTag: discordUser.username,
            name: displayName || unlinkedChief.name,
            avatarUrl: avatarUrl || unlinkedChief.avatarUrl,
            isAdmin: true,
          },
          include: { badges: { include: { course: true } } },
        });
        return {
          allowed: true,
          officer: updatedOfficer,
          matchedRole: "Fondateur / Chief of Police",
          reason: `Accès Haut Commandement accordé (Badge #${updatedOfficer.badgeNumber} - ${updatedOfficer.name}).`,
        };
      }
    }

    // Auto-create / provision Officer account for this verified Discord member!
    const badgeNum = Math.floor(10 + Math.random() * 89).toString();

    const newOfficer = await prisma.officer.create({
      data: {
        badgeNumber: badgeNum,
        name: displayName,
        callsign: `1-ADAM-${badgeNum}`,
        rank: detectedRank,
        department: "LSPD",
        avatarUrl,
        discordId: discordUser.id,
        discordTag: discordUser.username,
        status: "10-8",
        unitType: "Adam",
        isInstructor: memberRolesNames.some((r) => r.toLowerCase().includes("instructeur")),
        isAdmin: detectedRank === "Chief of Police" || detectedRank === "Capitaine" || isAdminOrFounder,
      },
      include: {
        badges: { include: { course: true } },
      },
    });

    return {
      allowed: true,
      officer: newOfficer,
      matchedRole,
      reason: `Accès autorisé (Rôle : ${matchedRole}). Nouveau matricule #${badgeNum} attribué.`,
    };
  } catch (err: any) {
    console.error("checkUserLSPDAccess error:", err);
    return {
      allowed: false,
      reason: `Erreur de vérification Discord : ${err.message}`,
    };
  }
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
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(base64Data).digest("base64url");

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
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(base64Data).digest("base64url");

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
