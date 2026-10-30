import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSessionOfficer, canEditDoa } from "../../../lib/discord";

export const dynamic = "force-dynamic";

/**
 * GET /api/doa
 * Full criminal-network graph: organizations, links, and every citizen /
 * investigation referenced by a link. Links pointing to deleted records are dropped.
 */
export async function GET() {
  try {
    const [organizations, links, officer] = await Promise.all([
      prisma.organization.findMany({ orderBy: { name: "asc" } }),
      prisma.doaLink.findMany({ orderBy: { createdAt: "desc" } }),
      getSessionOfficer(),
    ]);

    const idsOf = (type: string) =>
      Array.from(
        new Set(
          links.flatMap((l) => [
            ...(l.sourceType === type ? [l.sourceId] : []),
            ...(l.targetType === type ? [l.targetId] : []),
          ])
        )
      );

    const [citizens, investigations] = await Promise.all([
      prisma.citizen.findMany({
        where: { id: { in: idsOf("CITIZEN") } },
        select: { id: true, firstName: true, lastName: true, photoUrl: true, dangerLevel: true },
      }),
      prisma.investigation.findMany({
        where: { id: { in: idsOf("INVESTIGATION") } },
        select: { id: true, caseNumber: true, title: true, status: true },
      }),
    ]);

    const exists = new Set([
      ...organizations.map((o) => `ORGANIZATION:${o.id}`),
      ...citizens.map((c) => `CITIZEN:${c.id}`),
      ...investigations.map((i) => `INVESTIGATION:${i.id}`),
    ]);

    return NextResponse.json({
      organizations,
      citizens,
      investigations,
      links: links.filter(
        (l) => exists.has(`${l.sourceType}:${l.sourceId}`) && exists.has(`${l.targetType}:${l.targetId}`)
      ),
      canEdit: canEditDoa(officer),
    });
  } catch (error) {
    console.error("GET /api/doa error:", error);
    return NextResponse.json({ error: "Impossible de charger la DOA" }, { status: 500 });
  }
}
