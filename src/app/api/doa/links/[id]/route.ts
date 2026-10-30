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
    if (body.relation !== undefined && !String(body.relation).trim()) {
      return NextResponse.json({ error: "Le type de relation est obligatoire." }, { status: 400 });
    }

    const link = await prisma.doaLink.update({
      where: { id: params.id },
      data: {
        ...(body.relation !== undefined && { relation: String(body.relation).trim() }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
      },
    });
    return NextResponse.json(link);
  } catch (error: any) {
    console.error("PATCH /api/doa/links/[id] error:", error);
    return NextResponse.json(
      { error: "Impossible de modifier la liaison" },
      { status: error?.code === "P2025" ? 404 : 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!canEditDoa(await getSessionOfficer())) {
      return NextResponse.json({ error: "Accès refusé : réservé aux enquêteurs DOA." }, { status: 403 });
    }
    await prisma.doaLink.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/doa/links/[id] error:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer la liaison" },
      { status: error?.code === "P2025" ? 404 : 500 }
    );
  }
}
