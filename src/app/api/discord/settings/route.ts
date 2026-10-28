import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.discordSetting.findUnique({
      where: { id: "default" },
    });

    const botToken = setting?.botToken || process.env.DISCORD_BOT_TOKEN || "";
    const guildId = setting?.guildId || process.env.DISCORD_GUILD_ID || "";
    const autoSyncRoles = setting ? setting.autoSyncRoles : true;
    const sendWelcomeDm = setting ? setting.sendWelcomeDm : true;

    // Mask token for client safety (e.g., MTEw...XXXX)
    const maskedToken = botToken
      ? `${botToken.slice(0, 8)}...${botToken.slice(-4)}`
      : "";

    return NextResponse.json({
      isConfigured: Boolean(botToken && guildId),
      hasToken: Boolean(botToken),
      botToken: maskedToken,
      guildId,
      autoSyncRoles,
      sendWelcomeDm,
      welcomeChannelId: setting?.welcomeChannelId || "",
    });
  } catch (error) {
    console.error("GET discord settings error:", error);
    return NextResponse.json({ error: "Failed to fetch Discord settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const dataToUpdate: any = {};
    if (body.botToken && !body.botToken.includes("...")) {
      dataToUpdate.botToken = body.botToken.trim();
    }
    if (body.guildId !== undefined) {
      dataToUpdate.guildId = body.guildId.trim();
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
      guildId: updated.guildId,
      autoSyncRoles: updated.autoSyncRoles,
      sendWelcomeDm: updated.sendWelcomeDm,
    });
  } catch (error) {
    console.error("POST discord settings error:", error);
    return NextResponse.json({ error: "Failed to update Discord settings" }, { status: 500 });
  }
}
