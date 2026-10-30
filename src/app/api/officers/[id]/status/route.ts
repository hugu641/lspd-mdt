import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getDiscordConfig, syncOfficerDiscordRoles, getSessionOfficer, officerEditError } from "../../../../../lib/discord";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const permissionError = officerEditError(await getSessionOfficer(), params.id, body);
    if (permissionError) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }
    const updateData: Record<string, any> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.unitType !== undefined) updateData.unitType = body.unitType;
    if (body.rank !== undefined) updateData.rank = body.rank;
    if (body.callsign !== undefined) updateData.callsign = body.callsign;
    if (body.isInstructor !== undefined) updateData.isInstructor = body.isInstructor;
    if (body.phone !== undefined) {
      updateData.phone = body.phone ? body.phone.trim() : null;
    }
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl ? body.avatarUrl.trim() : null;
    }
    if (body.discordId !== undefined) {
      updateData.discordId = body.discordId ? body.discordId.trim().replace(/[<@!>]/g, "") : null;
    }
    if (body.discordTag !== undefined) {
      updateData.discordTag = body.discordTag ? body.discordTag.trim() : null;
    }

    const officer = await prisma.officer.update({
      where: { id: params.id },
      data: updateData,
    });

    // If rank or instructor status changed, automatically sync Discord roles
    let discordSyncResult = null;
    if ((body.rank !== undefined || body.isInstructor !== undefined || body.discordId !== undefined) && officer.discordId) {
      try {
        const config = await getDiscordConfig();
        if (config.autoSyncRoles && config.botToken && config.guildId) {
          discordSyncResult = await syncOfficerDiscordRoles({
            discordId: officer.discordId,
            rank: officer.rank,
            department: officer.department,
            isInstructor: officer.isInstructor,
          });
        }
      } catch (dErr) {
        console.error("Discord role sync error on patch:", dErr);
      }
    }

    return NextResponse.json({
      ...officer,
      discordSync: discordSyncResult,
    });
  } catch (error) {
    console.error("PATCH officer error:", error);
    return NextResponse.json({ error: "Failed to update officer status" }, { status: 500 });
  }
}
