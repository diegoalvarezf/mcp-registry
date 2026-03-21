import chalk from "chalk";
import { searchServers } from "../lib/api.js";

export async function searchCommand(query: string) {
  const servers = await searchServers(query, 10);

  if (servers.length === 0) {
    console.log(chalk.yellow(`No se encontraron resultados para "${query}"`));
    return;
  }

  console.log(chalk.bold(`\n${servers.length} resultados para "${query}":\n`));

  for (const s of servers) {
    const badges = [
      s.verified ? chalk.blue("✓ verified") : "",
      s.installCmd ? chalk.green("● installable") : chalk.gray("○ manual"),
    ].filter(Boolean).join("  ");

    console.log(`  ${chalk.bold(s.name)} ${chalk.gray(`(${s.slug})`)}  ${badges}`);
    console.log(`  ${chalk.gray(s.description)}`);
    if (s.installCmd) {
      console.log(`  ${chalk.cyan(`mcp install ${s.slug}`)}`);
    }
    console.log();
  }
}
