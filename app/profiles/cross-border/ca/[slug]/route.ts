import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.redirect(`https://ca.mmips.com/profiles/${encodeURIComponent(slug)}`, 307);
}
