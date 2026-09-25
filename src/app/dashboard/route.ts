import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  const url = new URL(request.url);

  if (!session) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session.role === "admin") {
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (session.role === "guru") {
    url.pathname = "/guru";
    return NextResponse.redirect(url);
  }

  url.pathname = "/siswa";
  return NextResponse.redirect(url);
}
