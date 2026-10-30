import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionOfficer, canEditDoa } from "../../../../lib/discord";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!canEditDoa(await getSessionOfficer())) {
      return NextResponse.json({ error: "Accès refusé : réservé aux enquêteurs DOA." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Le nom de l'organisation est obligatoire." }, { status: 400 });
    }

    const existing = await prisma.organization.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Une organisation porte déjà ce nom." }, { status: 409 });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        type: body.type?.trim() || "Gang",
        dangerLevel: body.dangerLevel?.trim() || "Moyen",
        territory: body.territory?.trim() || null,
        description: body.description?.trim() || null,
      },
    });
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("POST /api/doa/organizations error:", error);
    return NextResponse.json({ error: "Impossible de créer l'organisation" }, { status: 500 });
  }
}
