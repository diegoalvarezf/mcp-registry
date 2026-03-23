import { describe, it, expect } from "vitest";
import { submitServerSchema, envVarSchema } from "../lib/validations";

// ─── envVarSchema ─────────────────────────────────────────────────────────────

describe("envVarSchema", () => {
  const valid = { name: "API_KEY", description: "Your API key", required: true };

  it("accepts a minimal valid env var", () => {
    expect(envVarSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an optional env var with an example", () => {
    const result = envVarSchema.safeParse({ ...valid, required: false, example: "sk-abc123" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = envVarSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 60 chars", () => {
    const result = envVarSchema.safeParse({ ...valid, name: "A".repeat(61) });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 200 chars", () => {
    const result = envVarSchema.safeParse({ ...valid, description: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects an example longer than 100 chars", () => {
    const result = envVarSchema.safeParse({ ...valid, example: "x".repeat(101) });
    expect(result.success).toBe(false);
  });
});

// ─── submitServerSchema ───────────────────────────────────────────────────────

const validServer = {
  name: "My MCP Server",
  description: "A useful MCP server for doing things with AI tools",
  repoUrl: "https://github.com/example/my-mcp",
  authorName: "Alice",
  tags: ["ai", "tools"],
  tools: ["read_file", "write_file"],
  clients: ["claude-code"],
  transport: "stdio",
};

describe("submitServerSchema", () => {
  it("accepts a valid server submission", () => {
    expect(submitServerSchema.safeParse(validServer).success).toBe(true);
  });

  it("applies default values for license, version, transport", () => {
    const result = submitServerSchema.safeParse(validServer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.license).toBe("MIT");
      expect(result.data.version).toBe("0.1.0");
      expect(result.data.transport).toBe("stdio");
    }
  });

  it("rejects a name shorter than 2 chars", () => {
    const result = submitServerSchema.safeParse({ ...validServer, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 60 chars", () => {
    const result = submitServerSchema.safeParse({ ...validServer, name: "A".repeat(61) });
    expect(result.success).toBe(false);
  });

  it("rejects a description shorter than 20 chars", () => {
    const result = submitServerSchema.safeParse({ ...validServer, description: "Too short" });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 280 chars", () => {
    const result = submitServerSchema.safeParse({ ...validServer, description: "x".repeat(281) });
    expect(result.success).toBe(false);
  });

  it("rejects a repoUrl that is not a GitHub URL", () => {
    const result = submitServerSchema.safeParse({ ...validServer, repoUrl: "https://gitlab.com/foo/bar" });
    expect(result.success).toBe(false);
  });

  it("rejects a repoUrl that is not a valid URL", () => {
    const result = submitServerSchema.safeParse({ ...validServer, repoUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty tags array", () => {
    const result = submitServerSchema.safeParse({ ...validServer, tags: [] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 8 tags", () => {
    const result = submitServerSchema.safeParse({ ...validServer, tags: Array.from({ length: 9 }, (_, i) => `tag${i}`) });
    expect(result.success).toBe(false);
  });

  it("rejects an empty tools array", () => {
    const result = submitServerSchema.safeParse({ ...validServer, tools: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid client value", () => {
    const result = submitServerSchema.safeParse({ ...validServer, clients: ["vscode"] });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid transport value", () => {
    const result = submitServerSchema.safeParse({ ...validServer, transport: "websocket" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid client values", () => {
    const clients = ["claude-code", "cursor", "continue", "other"] as const;
    for (const client of clients) {
      const result = submitServerSchema.safeParse({ ...validServer, clients: [client] });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid transport values", () => {
    for (const transport of ["stdio", "sse", "http"] as const) {
      const result = submitServerSchema.safeParse({ ...validServer, transport });
      expect(result.success).toBe(true);
    }
  });

  it("accepts optional fields: longDesc, npmPackage, authorUrl, installCmd, configJson, envVars, category", () => {
    const result = submitServerSchema.safeParse({
      ...validServer,
      longDesc: "A detailed description of the server.",
      npmPackage: "@example/my-mcp",
      authorUrl: "https://example.com",
      installCmd: "npx -y @example/my-mcp",
      configJson: '{"mcpServers":{}}',
      envVars: [{ name: "API_KEY", description: "Your key", required: true }],
      category: "community",
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 20 envVars", () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => ({
      name: `VAR_${i}`,
      description: "desc",
      required: false,
    }));
    const result = submitServerSchema.safeParse({ ...validServer, envVars: tooMany });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category value", () => {
    const result = submitServerSchema.safeParse({ ...validServer, category: "personal" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty authorUrl", () => {
    const result = submitServerSchema.safeParse({ ...validServer, authorUrl: "" });
    expect(result.success).toBe(true);
  });
});
