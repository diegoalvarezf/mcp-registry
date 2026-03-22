import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

const ANALYZABLE_EXTENSIONS = new Set([
  ".ts", ".js", ".mjs", ".cjs", ".py", ".go", ".rs", ".rb", ".sh", ".bash",
]);

const MAX_FILES = 12;
const MAX_FILE_CHARS = 6000;
const MAX_TOTAL_CHARS = 40000;

async function fetchRepoCode(owner: string, repo: string): Promise<string> {
  const headers = getGitHubHeaders();

  // Get file tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) return "";

  const tree = await treeRes.json();
  const files: { path: string; url: string }[] = (tree.tree ?? [])
    .filter((f: { type: string; path: string; url: string }) => {
      if (f.type !== "blob") return false;
      const ext = "." + f.path.split(".").pop();
      const name = f.path.split("/").pop() ?? "";
      if (name === "package.json") return true;
      return ANALYZABLE_EXTENSIONS.has(ext);
    })
    .sort((a: { path: string }, b: { path: string }) => {
      // Prioritize root and src files
      const aDepth = a.path.split("/").length;
      const bDepth = b.path.split("/").length;
      return aDepth - bDepth;
    })
    .slice(0, MAX_FILES);

  let combined = "";
  for (const file of files) {
    if (combined.length >= MAX_TOTAL_CHARS) break;
    try {
      const blobRes = await fetch(file.url, { headers });
      if (!blobRes.ok) continue;
      const blob = await blobRes.json();
      const content = Buffer.from(blob.content ?? "", "base64").toString("utf-8");
      const truncated = content.slice(0, MAX_FILE_CHARS);
      combined += `\n\n### ${file.path}\n\`\`\`\n${truncated}\n\`\`\``;
    } catch {
      // skip unreadable files
    }
  }

  return combined.slice(0, MAX_TOTAL_CHARS);
}

async function analyzeWithClaude(
  serverName: string,
  code: string,
  checks: { githubExists: boolean; recentActivity: boolean; npmExists: boolean; npmRepoMatch: boolean }
): Promise<{ riskLevel: string; reason: string }> {
  const contextSummary = [
    checks.githubExists ? "GitHub repo is public" : "GitHub repo is private or missing",
    checks.recentActivity ? "Active in the last year" : "No activity in over a year",
    checks.npmExists ? `Published on npm${checks.npmRepoMatch ? " (matches repo)" : " (repo mismatch!)"}` : "Not on npm",
  ].join(". ");

  const prompt = `You are a security auditor for MCP (Model Context Protocol) servers. Analyze this server for security risks.

Server: ${serverName}
Context: ${contextSummary}

${code ? `Source code:\n${code}` : "Source code: not available"}

Assess the risk level based on:
- Credential theft: reads process.env, ~/.ssh, ~/.aws, ~/.config, API keys
- Data exfiltration: sends data to undocumented external URLs
- Code execution: uses eval(), exec(), execSync(), spawn() unsafely
- Prompt injection: tool responses try to hijack Claude's behavior
- Supply chain: suspicious dependencies or obfuscated code
- Repo health: private/missing repo, no activity, npm mismatch

Respond with ONLY a JSON object, no markdown:
{"riskLevel":"safe|low|medium|high","reason":"one sentence explanation"}

Rules:
- "safe": clean code, no red flags, transparent behavior
- "low": minor concerns or limited visibility but nothing dangerous
- "medium": suspicious patterns or significant missing info
- "high": clear malicious patterns, credential theft, exfiltration, private repo`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  try {
    const parsed = JSON.parse(text);
    const validLevels = ["safe", "low", "medium", "high"];
    if (validLevels.includes(parsed.riskLevel)) {
      return { riskLevel: parsed.riskLevel, reason: parsed.reason ?? "" };
    }
  } catch {
    // fallback
  }

  return { riskLevel: "unknown", reason: "Could not parse Claude response" };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const server = await prisma.server.findUnique({ where: { slug: params.slug } });
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

  const ownerRepo = extractOwnerRepo(server.repoUrl);

  // --- Level 1: GitHub + npm checks ---
  let githubExists = false;
  let recentActivity = false;
  let githubStars: number | null = null;
  let npmExists = false;
  let npmRepoMatch = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let npmData: any = null;

  const [githubResult, npmResult] = await Promise.allSettled([
    (async () => {
      if (!ownerRepo) return null;
      const res = await fetch(
        `https://api.github.com/repos/${ownerRepo.owner}/${ownerRepo.repo}`,
        { headers: getGitHubHeaders() }
      );
      if (!res.ok) return null;
      return res.json();
    })(),
    (async () => {
      if (!server.npmPackage) return null;
      const res = await fetch(`https://registry.npmjs.org/${server.npmPackage}`);
      if (!res.ok) return null;
      return res.json();
    })(),
  ]);

  if (githubResult.status === "fulfilled" && githubResult.value) {
    const data = githubResult.value;
    githubExists = data.private === false;
    githubStars = typeof data.stargazers_count === "number" ? data.stargazers_count : null;
    if (data.pushed_at) {
      const diffDays = (Date.now() - new Date(data.pushed_at).getTime()) / 86400000;
      recentActivity = diffDays <= 365;
    }
  }

  if (npmResult.status === "fulfilled" && npmResult.value) {
    npmData = npmResult.value;
    npmExists = true;
  }

  if (npmData && ownerRepo) {
    const repoUrlInNpm: string = npmData.repository?.url ?? "";
    npmRepoMatch = repoUrlInNpm.toLowerCase().includes(
      `${ownerRepo.owner}/${ownerRepo.repo}`.toLowerCase()
    );
  }

  const checks = { githubExists, recentActivity, npmExists, npmRepoMatch };

  // --- Level 2: fetch code + Claude analysis ---
  let riskLevel = "unknown";
  let reason = "";

  try {
    const code = ownerRepo && githubExists
      ? await fetchRepoCode(ownerRepo.owner, ownerRepo.repo)
      : "";

    const result = await analyzeWithClaude(server.name, code, checks);
    riskLevel = result.riskLevel;
    reason = result.reason;
  } catch {
    // If Claude fails, fall back to basic heuristics
    if (!ownerRepo || !githubExists) riskLevel = "high";
    else if (!recentActivity) riskLevel = "medium";
    else riskLevel = "low";
    reason = "Claude analysis unavailable, used basic checks";
  }

  await prisma.server.update({
    where: { slug: params.slug },
    data: {
      riskLevel,
      stars: githubStars ?? server.stars,
    },
  });

  return NextResponse.json({
    ok: true,
    riskLevel,
    reason,
    checks: { githubExists, npmExists, npmRepoMatch, recentActivity, stars: githubStars },
  });
}
