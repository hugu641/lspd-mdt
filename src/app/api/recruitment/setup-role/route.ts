import { NextResponse } from "next/server";
import { createOrEnsureRecruiterRole } from "../../../../lib/discord";

export async function POST(req: Request) {
  try {
    const result = await createOrEnsureRecruiterRole();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/recruitment/setup-role error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur interne lors de la création du rôle Discord" },
      { status: 500 }
    );
  }
}
