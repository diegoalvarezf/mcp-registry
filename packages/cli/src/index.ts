#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { installCommand } from "./commands/install.js";
import { searchCommand } from "./commands/search.js";
import { listCommand } from "./commands/list.js";

const program = new Command();

program
  .name("mcp")
  .description(chalk.bold("MCPHub CLI") + " — Install and manage MCP servers")
  .version("0.1.0");

program
  .command("install <slug>")
  .description("Install an MCP server from MCPHub")
  .action(async (slug: string) => {
    await installCommand(slug).catch((err) => {
      console.error(chalk.red("Error:"), err.message);
      process.exit(1);
    });
  });

program
  .command("search <query>")
  .description("Search MCP servers in MCPHub")
  .action(async (query: string) => {
    await searchCommand(query).catch((err) => {
      console.error(chalk.red("Error:"), err.message);
      process.exit(1);
    });
  });

program
  .command("list")
  .description("List installed MCP servers across all clients")
  .action(() => {
    listCommand();
  });

program.parse();
