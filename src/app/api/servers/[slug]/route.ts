import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function parse(server: any) {
  return {
    ...server,
    tags: JSON.parse(server.tags),
    tools: JSON.parse(server.tools),
    clients: JSON.parse(server.clients),
    envVars: server.envVars ? JSON.parse(server.envVars) : null,
  };
}

// GET /api/servers/[slug] — public API
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const server = await prisma.server.findUnique({ where: { slug: params.slug } });
  if (!server) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ server: parse(server) });
}
