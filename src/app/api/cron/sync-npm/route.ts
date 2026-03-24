import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// npm registry API — no auth needed, generous rate limits (5000 req/h)
async function fetchNpmWeeklyDownloads(pkg: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg)}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.downloads === "number" ? data.downloads : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const servers = await prisma.server.findMany({
    where: { npmPackage: { not: null } },
    select: { id: true, npmPackage: true, npmDownloads: true },
  });

  let updated = 0;
  let failed = 0;
  const BATCH = 20; // npm API is more lenient than GitHub

  for (let i = 0; i < servers.length; i += BATCH) {
    await Promise.all(
      servers.slice(i, i + BATCH).map(async (server) => {
        const downloads = await fetchNpmWeeklyDownloads(server.npmPackage!);
        if (downloads === null) { failed++; return; }
        if (downloads !== server.npmDownloads) {
          await prisma.server.update({
            where: { id: server.id },
            data: { npmDownloads: downloads },
          });
        }
        updated++;
      })
    );
    if (i + BATCH < servers.length) await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({ ok: true, total: servers.length, updated, failed });
}
