export interface Stack {
  slug: string;
  name: string;
  description: string;
  icon: string;
  servers: string[];
  skills: string[];
  agents: string[];
  tags: string[];
  curated?: boolean;
}

export const STACKS: Stack[] = [
  {
    slug: "full-stack-dev",
    name: "Full-Stack Dev",
    description: "Filesystem access, Git, GitHub, and Postgres — everything to build and ship web apps. Includes skills for PRs, tests, and commit messages, plus a senior engineer agent for code review sessions.",
    icon: "⬡",
    servers: ["filesystem", "git", "github", "postgres"],
    skills: ["review-pr", "write-tests", "commit-message"],
    agents: ["senior-engineer"],
    tags: ["development", "popular"],
    curated: true,
  },
  {
    slug: "research",
    name: "Research & Knowledge",
    description: "Search the web with Brave, scrape pages with Puppeteer, fetch any URL, and persist findings to memory. Built for deep research, competitive analysis, and knowledge management.",
    icon: "◈",
    servers: ["brave-search", "fetch", "memory", "puppeteer"],
    skills: ["document", "summarize"],
    agents: ["researcher"],
    tags: ["research", "ai"],
    curated: true,
  },
  {
    slug: "data-engineering",
    name: "Data Engineering",
    description: "Query and transform data across Postgres, SQLite, MySQL, and Redis. Let Claude write, explain, and optimize your queries — without leaving your terminal.",
    icon: "⊞",
    servers: ["postgres", "sqlite", "mysql", "redis"],
    skills: ["explain-code", "document"],
    agents: ["senior-engineer"],
    tags: ["data", "databases"],
    curated: true,
  },
  {
    slug: "devops",
    name: "DevOps & Cloud",
    description: "Manage Docker containers, deploy to Vercel and Cloudflare, track errors with Sentry, and automate GitHub workflows. A DevOps engineer agent that knows your infrastructure.",
    icon: "▲",
    servers: ["docker", "vercel", "cloudflare", "github", "sentry"],
    skills: ["fix-bug", "document"],
    agents: ["devops-engineer"],
    tags: ["devops", "cloud"],
    curated: true,
  },
  {
    slug: "product-team",
    name: "Product Team",
    description: "Connect Linear for issues, Notion for docs, GitHub for code, and Supabase for data. Everything a cross-functional team needs to plan, ship, and communicate — in one stack.",
    icon: "◆",
    servers: ["linear", "notion", "github", "supabase"],
    skills: ["document", "explain-code"],
    agents: ["tech-lead"],
    tags: ["product", "collaboration"],
    curated: true,
  },
  {
    slug: "security",
    name: "Security & Audit",
    description: "Audit your codebase for vulnerabilities across the filesystem and Git history. Review PRs through a security lens and get actionable fixes — with a dedicated security expert agent.",
    icon: "⊕",
    servers: ["filesystem", "git", "github"],
    skills: ["security-audit", "review-pr", "fix-bug"],
    agents: ["security-expert"],
    tags: ["security", "quality"],
    curated: true,
  },
];

export function getStack(slug: string): Stack | undefined {
  return STACKS.find((s) => s.slug === slug);
}
