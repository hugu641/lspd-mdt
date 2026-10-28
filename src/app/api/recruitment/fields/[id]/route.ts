import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// PATCH: Update a form field
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.recruitmentFormField.update({
      where: { id },
      data: {
        ...(body.label !== undefined && { label: body.label.trim() }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.placeholder !== undefined && { placeholder: body.placeholder?.trim() || null }),
        ...(body.helpText !== undefined && { helpText: body.helpText?.trim() || null }),
        ...(body.options !== undefined && { options: body.options?.trim() || null }),
        ...(body.required !== undefined && { required: Boolean(body.required) }),
        ...(body.enabled !== undefined && { enabled: Boolean(body.enabled) }),
        ...(body.orderIndex !== undefined && { orderIndex: Number(body.orderIndex) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/recruitment/fields/[id] error:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le champ" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a form field
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.recruitmentFormField.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/recruitment/fields/[id] error:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le champ" },
      { status: 500 }
    );
  }
}
