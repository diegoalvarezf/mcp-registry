import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// GET /api/teams — list teams for the authenticated user
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { githubLogin: session.user.githubLogin! } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          _count: { select: { members: true, servers: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    teams: memberships.map((m) => ({
      ...m.team,
      role: m.role,
      memberCount: m.team._count.members,
      serverCount: m.team._count.servers,
    })),
  });
}

// POST /api/teams — create a team
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { githubLogin: session.user.githubLogin! } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 });

  let slug = slugify(parsed.data.name);
  const existing = await prisma.team.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const team = await prisma.team.create({
    data: {
      slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      members: {
        create: { userId: user.id, role: "owner" },
      },
    },
  });

  return NextResponse.json({ team }, { status: 201 });
}
