import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function getMembership(teamSlug: string, githubLogin: string) {
  const user = await prisma.user.findUnique({ where: { githubLogin } });
  if (!user) return null;
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) return null;
  const member = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: team.id, userId: user.id } } });
  return member ? { team, user, member } : null;
}

// POST /api/teams/[slug]/servers — add a server to the team
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getMembership(params.slug, session.user.githubLogin!);
  if (!ctx) return NextResponse.json({ error: "Not found or not a member" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = z.object({ serverSlug: z.string(), notes: z.string().optional() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 });

  // Verify server exists
  const server = await prisma.server.findUnique({ where: { slug: parsed.data.serverSlug } });
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

  const teamServer = await prisma.teamServer.upsert({
    where: { teamId_serverSlug: { teamId: ctx.team.id, serverSlug: parsed.data.serverSlug } },
    create: { teamId: ctx.team.id, serverSlug: parsed.data.serverSlug, notes: parsed.data.notes ?? null },
    update: { notes: parsed.data.notes ?? null },
  });

  return NextResponse.json({ teamServer }, { status: 201 });
}

// DELETE /api/teams/[slug]/servers?server=slug — remove a server from the team
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getMembership(params.slug, session.user.githubLogin!);
  if (!ctx) return NextResponse.json({ error: "Not found or not a member" }, { status: 404 });

  const serverSlug = new URL(req.url).searchParams.get("server");
  if (!serverSlug) return NextResponse.json({ error: "Missing server param" }, { status: 400 });

  await prisma.teamServer.deleteMany({
    where: { teamId: ctx.team.id, serverSlug },
  });

  return NextResponse.json({ ok: true });
}
