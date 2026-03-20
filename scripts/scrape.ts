/**
 * MCP Registry scraper
 * Sources:
 *   1. punkpeye/awesome-mcp-servers README (curated list)
 *   2. GitHub topic search: mcp-server
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const GH_TOKEN = process.env.GH_TOKEN ?? "";

const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "mcp-registry-scraper",
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function inferTransport(text: string): string {
  if (/\bsse\b/i.test(text)) return "sse";
  if (/\bhttp\b/i.test(text)) return "http";
  return "stdio";
}

function inferClients(text: string): string[] {
  const clients: string[] = [];
  if (/claude/i.test(text)) clients.push("claude-code");
  if (/cursor/i.test(text)) clients.push("cursor");
  if (/continue/i.test(text)) clients.push("continue");
  return clients.length ? clients : ["claude-code", "cursor", "continue"];
}

function inferTags(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const tagMap: Record<string, string[]> = {
    database:   ["database", "db", "sql", "postgres", "mysql", "sqlite", "mongo"],
    filesystem: ["file", "filesystem", "directory", "folder"],
    search:     ["search", "brave", "google", "bing", "web"],
    git:        ["git", "github", "gitlab", "bitbucket"],
    browser:    ["browser", "playwright", "puppeteer", "selenium", "web scraping"],
    ai:         ["ai", "llm", "openai", "embedding", "vector"],
    cloud:      ["aws", "azure", "gcp", "cloud", "s3"],
    devtools:   ["debug", "lint", "test", "ci", "deploy"],
    memory:     ["memory", "knowledge", "context", "rag"],
    api:        ["api", "rest", "graphql", "http", "webhook"],
    slack:      ["slack"],
    email:      ["email", "gmail", "smtp", "mail"],
    calendar:   ["calendar", "google calendar", "scheduling"],
    notion:     ["notion"],
  };

  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some((k) => text.includes(k))) tags.push(tag);
  }
  return tags.length ? tags.slice(0, 5) : ["tools"];
}

// ── Source 1: awesome-mcp-servers README ─────────────────────────────────────

interface AwesomeEntry {
  name: string;
  repoUrl: string;
  description: string;
}

async function fetchAwesomeMcpServers(): Promise<AwesomeEntry[]> {
  console.log("  Fetching awesome-mcp-servers...");
  const res = await fetch(
    "https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md",
    { headers }
  );
  if (!res.ok) {
    console.warn("  Could not fetch awesome-mcp-servers:", res.status);
    return [];
  }

  const text = await res.text();
  const entries: AwesomeEntry[] = [];

  // Match: - [name](https://github.com/...) — description
  const pattern = /[-*]\s+\[([^\]]+)\]\((https:\/\/github\.com\/[^\)]+)\)[^\n]*?[-–—]\s*(.+)/gm;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const [, name, repoUrl, description] = match;
    if (name && repoUrl && description) {
      entries.push({
        name: name.trim(),
        repoUrl: repoUrl.trim(),
        description: description.trim().slice(0, 280),
      });
    }
  }

  console.log(`  Found ${entries.length} entries in awesome-mcp-servers`);
  return entries;
}

// ── Source 2: GitHub topic search ────────────────────────────────────────────

interface GithubRepo {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  owner: { login: string; html_url: string };
  license: { spdx_id: string } | null;
  topics: string[];
}

async function fetchGithubTopic(topic: string, pages = 3): Promise<GithubRepo[]> {
  console.log(`  Fetching GitHub topic: ${topic}...`);
  const repos: GithubRepo[] = [];

  for (let page = 1; page <= pages; page++) {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&per_page=30&page=${page}`,
      { headers }
    );
    if (!res.ok) break;
    const data: any = await res.json();
    if (!data.items?.length) break;
    repos.push(...data.items);
    await new Promise((r) => setTimeout(r, 800)); // rate limit
  }

  console.log(`  Found ${repos.length} repos for topic: ${topic}`);
  return repos;
}

// ── Upsert into DB ────────────────────────────────────────────────────────────

async function upsertServer(data: {
  name: string;
  repoUrl: string;
  description: string;
  authorName: string;
  authorUrl?: string;
  stars?: number;
  license?: string;
  tags: string[];
  clients: string[];
  transport: string;
}) {
  const slug = slugify(data.name);
  if (!slug || slug.length < 2) return;

  try {
    await prisma.server.upsert({
      where: { slug },
      update: {
        description: data.description,
        stars: data.stars ?? 0,
        tags: JSON.stringify(data.tags),
        clients: JSON.stringify(data.clients),
      },
      create: {
        slug,
        name: data.name,
        description: data.description,
        repoUrl: data.repoUrl,
        authorName: data.authorName,
        authorUrl: data.authorUrl ?? null,
        license: data.license ?? "MIT",
        version: "latest",
        tags: JSON.stringify(data.tags),
        tools: JSON.stringify([]),
        clients: JSON.stringify(data.clients),
        transport: data.transport,
        stars: data.stars ?? 0,
      },
    });
  } catch {
    // skip duplicates silently
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nmcp-registry scraper\n");

  let total = 0;

  // Source 1: awesome-mcp-servers
  const awesome = await fetchAwesomeMcpServers();
  for (const entry of awesome) {
    const ownerMatch = entry.repoUrl.match(/github\.com\/([^/]+)/);
    const authorName = ownerMatch?.[1] ?? "unknown";
    await upsertServer({
      name: entry.name,
      repoUrl: entry.repoUrl,
      description: entry.description,
      authorName,
      authorUrl: `https://github.com/${authorName}`,
      tags: inferTags(entry.name, entry.description),
      clients: inferClients(entry.description),
      transport: inferTransport(entry.description),
    });
    total++;
  }
  console.log(`  ✓ Imported ${awesome.length} from awesome-mcp-servers`);

  // Source 2: GitHub topics
  const topics = ["mcp-server", "model-context-protocol", "mcp-servers"];
  for (const topic of topics) {
    const repos = await fetchGithubTopic(topic);
    for (const repo of repos) {
      if (!repo.description) continue;
      await upsertServer({
        name: repo.name,
        repoUrl: repo.html_url,
        description: repo.description.slice(0, 280),
        authorName: repo.owner.login,
        authorUrl: repo.owner.html_url,
        stars: repo.stargazers_count,
        license: repo.license?.spdx_id ?? "MIT",
        tags: inferTags(repo.name, repo.description),
        clients: inferClients(repo.description),
        transport: inferTransport(repo.description),
      });
      total++;
    }
    console.log(`  ✓ Imported repos from topic: ${topic}`);
  }

  const count = await prisma.server.count();
  console.log(`\n  Done! Total servers in DB: ${count}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
