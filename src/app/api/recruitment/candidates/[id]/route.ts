import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.recruitmentCandidate.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName.trim() }),
        ...(body.lastName !== undefined && { lastName: body.lastName.trim() }),
        ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
        ...(body.discordTag !== undefined && { discordTag: body.discordTag?.trim() || null }),
        ...(body.discordId !== undefined && { discordId: body.discordId?.trim() || null }),
        ...(body.age !== undefined && { age: body.age ? parseInt(body.age) : null }),
        ...(body.motivation !== undefined && { motivation: body.motivation?.trim() || null }),
        ...(body.experience !== undefined && { experience: body.experience?.trim() || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.interviewDate !== undefined && {
          interviewDate: body.interviewDate ? new Date(body.interviewDate) : null,
        }),
        ...(body.interviewNotes !== undefined && { interviewNotes: body.interviewNotes?.trim() || null }),
        ...(body.decisionReason !== undefined && { decisionReason: body.decisionReason?.trim() || null }),
        ...(body.recruiterId !== undefined && { recruiterId: body.recruiterId || null }),
      },
      include: {
        recruiter: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH candidate error:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le dossier de candidature" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.recruitmentCandidate.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE candidate error:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer la candidature" },
      { status: 500 }
    );
  }
}
