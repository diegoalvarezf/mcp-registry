import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/join/[token] — join a team via invite token
export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findUnique({ where: { inviteToken: params.token } });
  if (!team) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { githubLogin: session.user.githubLogin! } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
  });

  if (!existing) {
    await prisma.teamMember.create({
      data: { teamId: team.id, userId: user.id, role: "member" },
    });
  }

  return NextResponse.redirect(new URL(`/teams/${team.slug}`, _req.url));
}
