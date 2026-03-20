import { z } from "zod";

export const submitServerSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().min(20).max(280),
  longDesc: z.string().max(2000).optional(),
  repoUrl: z.string().url().startsWith("https://github.com"),
  npmPackage: z.string().optional(),
  authorName: z.string().min(1).max(80),
  authorUrl: z.string().url().optional().or(z.literal("")),
  license: z.string().default("MIT"),
  version: z.string().default("0.1.0"),
  tags: z.array(z.string().min(1).max(30)).min(1).max(8),
  tools: z.array(z.string().min(1).max(60)).min(1).max(20),
  clients: z.array(z.enum(["claude-code", "cursor", "continue", "other"])).min(1),
  transport: z.enum(["stdio", "sse", "http"]).default("stdio"),
});

export type SubmitServerInput = z.infer<typeof submitServerSchema>;
