import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getMembership(teamSlug: string, githubLogin: string) {
  const user = await prisma.user.findUnique({ where: { githubLogin } });
  if (!user) return null;
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) return null;
  const member = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: team.id, userId: user.id } } });
  return member ? { team, user, member } : null;
}

// GET /api/teams/[slug] — team detail with servers
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getMembership(params.slug, session.user.githubLogin!);
  if (!ctx) return NextResponse.json({ error: "Not found or not a member" }, { status: 404 });

  const team = await prisma.team.findUnique({
    where: { slug: params.slug },
    include: {
      members: { include: { user: { select: { id: true, githubLogin: true, name: true, avatarUrl: true } } } },
      servers: { orderBy: { addedAt: "asc" } },
    },
  });

  return NextResponse.json({ team, role: ctx.member.role });
}

// DELETE /api/teams/[slug] — delete team (owner only)
export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getMembership(params.slug, session.user.githubLogin!);
  if (!ctx || ctx.member.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.team.delete({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true });
}
