import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionOfficer, canEditDoa } from "../../../../../lib/discord";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!canEditDoa(await getSessionOfficer())) {
      return NextResponse.json({ error: "Accès refusé : réservé aux enquêteurs DOA." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (body.name !== undefined && !String(body.name).trim()) {
      return NextResponse.json({ error: "Le nom de l'organisation est obligatoire." }, { status: 400 });
    }

    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.type !== undefined && { type: String(body.type).trim() || "Gang" }),
        ...(body.dangerLevel !== undefined && { dangerLevel: String(body.dangerLevel).trim() || "Moyen" }),
        ...(body.territory !== undefined && { territory: body.territory?.trim() || null }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
      },
    });
    return NextResponse.json(organization);
  } catch (error: any) {
    console.error("PATCH /api/doa/organizations/[id] error:", error);
    const status = error?.code === "P2025" ? 404 : error?.code === "P2002" ? 409 : 500;
    return NextResponse.json({ error: "Impossible de modifier l'organisation" }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!canEditDoa(await getSessionOfficer())) {
      return NextResponse.json({ error: "Accès refusé : réservé aux enquêteurs DOA." }, { status: 403 });
    }

    // Links are polymorphic (no FK), so remove the organization's links explicitly.
    await prisma.$transaction([
      prisma.doaLink.deleteMany({
        where: {
          OR: [
            { sourceType: "ORGANIZATION", sourceId: params.id },
            { targetType: "ORGANIZATION", targetId: params.id },
          ],
        },
      }),
      prisma.organization.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/doa/organizations/[id] error:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer l'organisation" },
      { status: error?.code === "P2025" ? 404 : 500 }
    );
  }
}
