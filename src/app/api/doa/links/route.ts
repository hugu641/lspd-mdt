import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionOfficer, canEditDoa } from "../../../../lib/discord";

export const dynamic = "force-dynamic";

const NODE_TYPES = ["CITIZEN", "ORGANIZATION", "INVESTIGATION"];

async function nodeExists(type: string, id: string) {
  if (type === "CITIZEN") return Boolean(await prisma.citizen.findUnique({ where: { id }, select: { id: true } }));
  if (type === "ORGANIZATION") return Boolean(await prisma.organization.findUnique({ where: { id }, select: { id: true } }));
  if (type === "INVESTIGATION") return Boolean(await prisma.investigation.findUnique({ where: { id }, select: { id: true } }));
  return false;
}

export async function POST(req: Request) {
  try {
    const officer = await getSessionOfficer();
    if (!canEditDoa(officer)) {
      return NextResponse.json({ error: "Accès refusé : réservé aux enquêteurs DOA." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { sourceType, sourceId, targetType, targetId } = body;
    const relation = typeof body.relation === "string" ? body.relation.trim() : "";

    if (!NODE_TYPES.includes(sourceType) || !NODE_TYPES.includes(targetType) || !sourceId || !targetId || !relation) {
      return NextResponse.json({ error: "Liaison incomplète : deux éléments et un type de relation sont requis." }, { status: 400 });
    }
    if (sourceType === targetType && sourceId === targetId) {
      return NextResponse.json({ error: "Un élément ne peut pas être relié à lui-même." }, { status: 400 });
    }
    if (!(await nodeExists(sourceType, sourceId)) || !(await nodeExists(targetType, targetId))) {
      return NextResponse.json({ error: "Élément introuvable." }, { status: 404 });
    }

    const link = await prisma.doaLink.create({
      data: {
        sourceType,
        sourceId,
        targetType,
        targetId,
        relation,
        notes: body.notes?.trim() || null,
        createdById: officer!.id,
        createdBy: officer!.name,
      },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("POST /api/doa/links error:", error);
    return NextResponse.json({ error: "Impossible de créer la liaison" }, { status: 500 });
  }
}
