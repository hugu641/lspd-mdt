import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { canEditDiscordSettings } from "../../../../lib/discord";

export async function GET() {
  try {
    const setting = await prisma.discordSetting.findUnique({
      where: { id: "default" },
    });

    const botToken = setting?.botToken || process.env.DISCORD_BOT_TOKEN || "";
    const guildId = setting?.guildId || process.env.DISCORD_GUILD_ID || "";
    const clientId = setting?.clientId || process.env.DISCORD_CLIENT_ID || "";
    const clientSecret = setting?.clientSecret || process.env.DISCORD_CLIENT_SECRET || "";
    const autoSyncRoles = setting ? setting.autoSyncRoles : true;
    const sendWelcomeDm = setting ? setting.sendWelcomeDm : true;
    const authRequired = setting ? setting.authRequired : true;
    const allowedRoles = setting?.allowedRoles || process.env.DISCORD_ALLOWED_ROLES || "LSPD,Police,Rookie,Officier I,Officier II,Officier III,SLO,Sergent,Sergent-Chef,Lieutenant,Capitaine,Commandant,Deputy-Chief,Assistant-Chief,Chief of Police";

    // Mask sensitive fields
    const maskedToken = botToken
      ? `${botToken.slice(0, 8)}...${botToken.slice(-4)}`
      : "";
    const maskedSecret = clientSecret
      ? `${clientSecret.slice(0, 4)}...${clientSecret.slice(-4)}`
      : "";

    return NextResponse.json({
      isConfigured: Boolean(botToken && guildId),
      isConfiguredOAuth: Boolean(clientId && clientSecret),
      hasToken: Boolean(botToken),
      hasSecret: Boolean(clientSecret),
      botToken: maskedToken,
      guildId,
      clientId,
      clientSecret: maskedSecret,
      autoSyncRoles,
      sendWelcomeDm,
      authRequired,
      allowedRoles,
      welcomeChannelId: setting?.welcomeChannelId || "",
    });
  } catch (error) {
    console.error("GET discord settings error:", error);
    return NextResponse.json({ error: "Failed to fetch Discord settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await canEditDiscordSettings())) {
      return NextResponse.json({ error: "Accès refusé : réservé au Haut Commandement." }, { status: 403 });
    }

    const body = await req.json();

    const dataToUpdate: any = {};
    if (body.botToken && !body.botToken.includes("...")) {
      dataToUpdate.botToken = body.botToken.trim();
    }
    if (body.guildId !== undefined) {
      dataToUpdate.guildId = body.guildId.trim();
    }
    if (body.clientId !== undefined) {
      dataToUpdate.clientId = body.clientId.trim();
    }
    if (body.clientSecret && !body.clientSecret.includes("...")) {
      dataToUpdate.clientSecret = body.clientSecret.trim();
    }
    if (body.welcomeChannelId !== undefined) {
      dataToUpdate.welcomeChannelId = body.welcomeChannelId.trim();
    }
    if (body.autoSyncRoles !== undefined) {
      dataToUpdate.autoSyncRoles = Boolean(body.autoSyncRoles);
    }
    if (body.sendWelcomeDm !== undefined) {
      dataToUpdate.sendWelcomeDm = Boolean(body.sendWelcomeDm);
    }
    if (body.authRequired !== undefined) {
      dataToUpdate.authRequired = Boolean(body.authRequired);
    }
    if (body.allowedRoles !== undefined) {
      dataToUpdate.allowedRoles = body.allowedRoles.trim();
    }
    if (body.roleMappings !== undefined) {
      dataToUpdate.roleMappings = typeof body.roleMappings === "string" 
        ? body.roleMappings 
        : JSON.stringify(body.roleMappings);
    }

    const updated = await prisma.discordSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...dataToUpdate,
      },
      update: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      isConfigured: Boolean(updated.botToken && updated.guildId),
      isConfiguredOAuth: Boolean(updated.clientId && updated.clientSecret),
      guildId: updated.guildId,
      clientId: updated.clientId,
      autoSyncRoles: updated.autoSyncRoles,
      sendWelcomeDm: updated.sendWelcomeDm,
      authRequired: updated.authRequired,
      allowedRoles: updated.allowedRoles,
    });
  } catch (error) {
    console.error("POST discord settings error:", error);
    return NextResponse.json({ error: "Failed to update Discord settings" }, { status: 500 });
  }
}
