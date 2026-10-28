import { prisma } from "./prisma";

export interface DiscordConfig {
  botToken?: string;
  guildId?: string;
  welcomeChannelId?: string;
  autoSyncRoles: boolean;
  sendWelcomeDm: boolean;
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

/**
 * Retrieve Discord Bot settings (DB preferred, fallback to process.env)
 */
export async function getDiscordConfig(): Promise<DiscordConfig> {
  try {
    const setting = await prisma.discordSetting.findUnique({
      where: { id: "default" },
    });

    const botToken = setting?.botToken || process.env.DISCORD_BOT_TOKEN || "";
    const guildId = setting?.guildId || process.env.DISCORD_GUILD_ID || "";
    const welcomeChannelId = setting?.welcomeChannelId || process.env.DISCORD_WELCOME_CHANNEL_ID || "";
    const autoSyncRoles = setting ? setting.autoSyncRoles : true;
    const sendWelcomeDm = setting ? setting.sendWelcomeDm : true;
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
      welcomeChannelId,
      autoSyncRoles,
      sendWelcomeDm,
      roleMappings,
    };
  } catch (error) {
    console.error("Error retrieving Discord config:", error);
    return {
      botToken: process.env.DISCORD_BOT_TOKEN || "",
      guildId: process.env.DISCORD_GUILD_ID || "",
      welcomeChannelId: process.env.DISCORD_WELCOME_CHANNEL_ID || "",
      autoSyncRoles: true,
      sendWelcomeDm: true,
      roleMappings: {},
    };
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
 * Automatically assigns their current rank role, removes old rank roles,
 * and assigns departmental ("LSPD") & instructor ("FTO") roles if applicable.
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
    // Priority: custom mappings in config, then case-insensitive name match
    let targetRoleId: string | undefined = config.roleMappings?.[officer.rank];
    if (!targetRoleId) {
      const matchedRole = allRoles.find(
        (r) => r.name.toLowerCase().trim() === officer.rank.toLowerCase().trim()
      );
      if (matchedRole) targetRoleId = matchedRole.id;
    }

    // Identify all rank role IDs that exist on the server
    const allServerRankRoleIds = allRoles
      .filter((r) =>
        LSPD_RANK_NAMES.some((rankName) => rankName.toLowerCase() === r.name.toLowerCase().trim())
      )
      .map((r) => r.id);

    const addedRoles: string[] = [];
    const removedRoles: string[] = [];

    // 4. Remove obsolete rank roles the member currently has
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

    // 5. Add target rank role if not already assigned
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
