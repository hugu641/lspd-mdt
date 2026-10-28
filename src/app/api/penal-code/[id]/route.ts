import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// PATCH: Update an existing penal code item
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.penalCodeItem.update({
      where: { id },
      data: {
        ...(body.code !== undefined && { code: body.code.trim() }),
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.category !== undefined && { category: body.category.trim() }),
        ...(body.fine !== undefined && { fine: Number(body.fine) || 0 }),
        ...(body.jailTime !== undefined && { jailTime: Number(body.jailTime) || 0 }),
        ...(body.secondarySanction !== undefined && {
          secondarySanction: body.secondarySanction?.trim() || null,
        }),
        ...(body.orderIndex !== undefined && { orderIndex: Number(body.orderIndex) || 0 }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/penal-code/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Impossible de modifier cet article du code pénal" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a penal code item
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if referenced by existing citations
    const citationCount = await prisma.citationItem.count({
      where: { penalCodeItemId: id },
    });

    if (citationCount > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cet article car il figure déjà sur ${citationCount} contravention(s) existante(s).`,
        },
        { status: 400 }
      );
    }

    await prisma.penalCodeItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/penal-code/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Impossible de supprimer l'article du code pénal" },
      { status: 500 }
    );
  }
}
