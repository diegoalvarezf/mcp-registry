export interface Stack {
  slug: string;
  name: string;
  description: string;
  icon: string;
  servers: string[];  // MCP server slugs
  skills: string[];   // prompt skill slugs
  agents: string[];   // agent slugs
  tags: string[];
}

export const STACKS: Stack[] = [
  {
    slug: "full-stack-dev",
    name: "Full-Stack Dev",
    description: "Everything you need to build and ship web apps — filesystem, git, GitHub, Postgres, and the right AI skills to match.",
    icon: "⚡",
    servers: ["filesystem", "git", "github", "postgres", "redis"],
    skills: ["review-pr", "write-tests", "write-docs"],
    agents: ["senior-engineer"],
    tags: ["development", "popular"],
  },
  {
    slug: "research",
    name: "Research & Browsing",
    description: "Search the web, fetch pages, and persist findings to memory. Great for deep research workflows.",
    icon: "🔍",
    servers: ["brave-search", "fetch", "memory", "puppeteer"],
    skills: ["summarize-page", "debug-issue"],
    agents: [],
    tags: ["research", "ai"],
  },
  {
    slug: "data-engineering",
    name: "Data Engineering",
    description: "Query, explore and transform data across Postgres, SQLite, Redis, and more.",
    icon: "📊",
    servers: ["postgres", "sqlite", "redis"],
    skills: ["write-tests", "refactor-code"],
    agents: ["senior-engineer"],
    tags: ["data", "databases"],
  },
  {
    slug: "devops",
    name: "DevOps & Cloud",
    description: "Manage infrastructure, containers, serverless functions, and monitor deployments.",
    icon: "🚀",
    servers: ["docker", "vercel", "cloudflare", "github"],
    skills: ["write-docs", "debug-issue"],
    agents: ["devops-engineer"],
    tags: ["devops", "cloud"],
  },
  {
    slug: "product-team",
    name: "Product Team",
    description: "Connect your issue tracker, project management, and database. Manage everything from the CLI.",
    icon: "📋",
    servers: ["linear", "notion", "github"],
    skills: ["review-pr", "write-docs"],
    agents: ["product-manager"],
    tags: ["product", "collaboration"],
  },
  {
    slug: "security",
    name: "Security & Code Quality",
    description: "Audit your code, review PRs for vulnerabilities, and keep dependencies up to date.",
    icon: "🔒",
    servers: ["github", "filesystem"],
    skills: ["security-audit", "review-pr"],
    agents: ["security-expert"],
    tags: ["security", "quality"],
  },
];

export function getStack(slug: string): Stack | undefined {
  return STACKS.find((s) => s.slug === slug);
}
