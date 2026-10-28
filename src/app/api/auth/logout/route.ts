import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("lspd_session");

  const response = NextResponse.json({ success: true });
  response.cookies.delete("lspd_session");
  return response;
}
