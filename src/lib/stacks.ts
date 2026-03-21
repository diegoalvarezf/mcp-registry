export interface Stack {
  slug: string;
  name: string;
  description: string;
  icon: string;
  servers: string[]; // slugs
  tags: string[];
}

export const STACKS: Stack[] = [
  {
    slug: "full-stack-dev",
    name: "Full-Stack Dev",
    description: "Everything you need to build and ship web apps — filesystem, git, GitHub, Postgres, and Redis.",
    icon: "⚡",
    servers: ["filesystem", "git", "github", "postgres", "redis"],
    tags: ["development", "popular"],
  },
  {
    slug: "research",
    name: "Research & Browsing",
    description: "Search the web, fetch pages, and persist findings to memory. Great for deep research workflows.",
    icon: "🔍",
    servers: ["brave-search", "fetch", "memory", "puppeteer"],
    tags: ["research", "ai"],
  },
  {
    slug: "data-engineering",
    name: "Data Engineering",
    description: "Query, explore and transform data across Postgres, MySQL, SQLite, Redis, and Elasticsearch.",
    icon: "📊",
    servers: ["postgres", "mysql", "sqlite", "redis", "elasticsearch"],
    tags: ["data", "databases"],
  },
  {
    slug: "devops",
    name: "DevOps & Cloud",
    description: "Manage infrastructure, containers, serverless functions, and monitor deployments.",
    icon: "🚀",
    servers: ["docker", "vercel", "cloudflare", "github"],
    tags: ["devops", "cloud"],
  },
  {
    slug: "product-team",
    name: "Product Team",
    description: "Connect your issue tracker, project management, and database. Manage everything from the CLI.",
    icon: "📋",
    servers: ["linear", "jira", "notion", "github", "supabase"],
    tags: ["product", "collaboration"],
  },
  {
    slug: "customer-success",
    name: "Customer & Payments",
    description: "Handle support tickets, payments, and user data with Stripe and Sentry integration.",
    icon: "💳",
    servers: ["stripe", "sentry", "notion"],
    tags: ["business", "payments"],
  },
];

export function getStack(slug: string): Stack | undefined {
  return STACKS.find((s) => s.slug === slug);
}
