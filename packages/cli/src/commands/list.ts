import chalk from "chalk";
import * as fs from "fs";
import { detectClients } from "../lib/detect.js";

export function listCommand() {
  const clients = detectClients();

  if (clients.length === 0) {
    console.log(chalk.yellow("No se detectó ningún cliente MCP instalado."));
    return;
  }

  for (const client of clients) {
    console.log(chalk.bold(`\n${client.label}`) + chalk.gray(` (${client.configPath})`));

    if (!fs.existsSync(client.configPath)) {
      console.log(chalk.gray("  Sin servidores configurados."));
      continue;
    }

    const config = JSON.parse(fs.readFileSync(client.configPath, "utf-8"));

    let servers: string[] = [];
    if (client.id === "continue") {
      servers = (config.mcpServers ?? []).map((s: any) => s.name);
    } else {
      servers = Object.keys(config.mcpServers ?? {});
    }

    if (servers.length === 0) {
      console.log(chalk.gray("  Sin servidores configurados."));
    } else {
      servers.forEach((s) => console.log(`  ${chalk.green("●")} ${s}`));
    }
  }

  console.log();
}
