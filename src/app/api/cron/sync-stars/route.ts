import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getGitHubHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  return headers;
}

function extractOwnerRepo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

// Fetch stars for a single repo — returns null on failure
async function fetchStars(owner: string, repo: string): Promise<number | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: getGitHubHeaders() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const servers = await prisma.server.findMany({
    select: { id: true, repoUrl: true, stars: true },
  });

  let updated = 0;
  let failed = 0;

  // Process in batches of 10 to respect GitHub rate limits
  const BATCH = 10;
  for (let i = 0; i < servers.length; i += BATCH) {
    const batch = servers.slice(i, i + BATCH);

    await Promise.all(
      batch.map(async (server) => {
        const ownerRepo = extractOwnerRepo(server.repoUrl);
        if (!ownerRepo) { failed++; return; }

        const stars = await fetchStars(ownerRepo.owner, ownerRepo.repo);
        if (stars === null) { failed++; return; }

        if (stars !== server.stars) {
          await prisma.server.update({
            where: { id: server.id },
            data: { stars },
          });
        }
        updated++;
      })
    );

    // Small delay between batches to avoid hitting rate limits
    if (i + BATCH < servers.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return NextResponse.json({ ok: true, total: servers.length, updated, failed });
}
