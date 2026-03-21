import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { detectClients, type DetectedClient } from "../lib/detect.js";
import { installForClient, isAlreadyInstalled } from "../lib/config.js";
import type { McpServer } from "../lib/api.js";

const REGISTRY_URL = process.env.MCPHUB_REGISTRY ?? "https://mcp-registry-sigma.vercel.app";

interface SyncResponse {
  team: { slug: string; name: string };
  servers: McpServer[];
}

async function fetchTeam(teamSlug: string, token: string): Promise<SyncResponse | null> {
  const res = await fetch(`${REGISTRY_URL}/api/teams/${encodeURIComponent(teamSlug)}/sync?token=${encodeURIComponent(token)}`);
  if (!res.ok) return null;
  return res.json() as Promise<SyncResponse>;
}

export async function syncCommand(teamSlug?: string) {
  if (!teamSlug) {
    console.log(chalk.red("Usage: mcp sync --team <slug> --token <token>"));
    console.log(chalk.gray("  Get the sync command from your team page on MCPHub."));
    process.exit(1);
  }

  // Prompt for token
  const { token } = await inquirer.prompt<{ token: string }>([
    {
      type: "input",
      name: "token",
      message: `Invite token for team ${chalk.bold(teamSlug)}:`,
      validate: (v: string) => v.trim().length > 0 || "Token is required",
    },
  ]);

  const spinner = ora(`Fetching team ${chalk.bold(teamSlug)}...`).start();
  const data = await fetchTeam(teamSlug, token.trim()).catch(() => null);

  if (!data) {
    spinner.fail("Team not found or invalid token.");
    process.exit(1);
  }

  spinner.succeed(`Team ${chalk.bold(data.team.name)} — ${data.servers.length} servers`);

  if (data.servers.length === 0) {
    console.log(chalk.gray("  No servers configured for this team."));
    return;
  }

  // Detect clients
  const detected = detectClients();
  if (detected.length === 0) {
    console.log(chalk.yellow("\nNo MCP clients detected."));
    process.exit(1);
  }

  let targets: DetectedClient[] = detected;
  if (detected.length > 1) {
    const { selected } = await inquirer.prompt<{ selected: string[] }>([
      {
        type: "checkbox",
        name: "selected",
        message: "Install in which clients?",
        choices: detected.map((c) => ({ name: c.label, value: c.id, checked: true })),
      },
    ]);
    targets = detected.filter((c) => selected.includes(c.id));
  }

  console.log();

  // Install each server
  for (const server of data.servers) {
    console.log(chalk.bold(`  ${server.name}`));

    const envValues: Record<string, string> = {};

    // Ask for required env vars that aren't already set
    if (server.envVars && server.envVars.length > 0) {
      for (const ev of server.envVars) {
        if (!ev.required) continue;
        const { value } = await inquirer.prompt<{ value: string }>([
          {
            type: "input",
            name: "value",
            message: `  ${chalk.cyan(ev.name)} — ${ev.description}${ev.example ? chalk.gray(` (e.g. ${ev.example})`) : ""}:`,
            validate: (input: string) => input.trim().length > 0 || "Required",
          },
        ]);
        if (value.trim()) envValues[ev.name] = value.trim();
      }
    }

    for (const client of targets) {
      const already = isAlreadyInstalled(client.id, server.slug);
      const s = ora(`    ${client.label}${already ? chalk.gray(" (updating)") : ""}`).start();
      try {
        const path = installForClient(client.id, server, envValues);
        s.succeed(`    ${chalk.bold(client.label)} ${chalk.gray(`→ ${path}`)}`);
      } catch (err: any) {
        s.fail(`    ${client.label}: ${err.message}`);
      }
    }
    console.log();
  }

  console.log(chalk.green(`✓ Synced ${data.servers.length} servers for team ${chalk.bold(data.team.name)}`));
  console.log(chalk.gray("  Restart your MCP clients to activate the servers.\n"));
}
