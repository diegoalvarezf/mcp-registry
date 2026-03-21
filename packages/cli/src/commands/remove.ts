import chalk from "chalk";
import inquirer from "inquirer";
import { detectClients, type DetectedClient } from "../lib/detect.js";
import { removeFromClient, isAlreadyInstalled } from "../lib/config.js";

export async function removeCommand(slug: string) {
  const detected = detectClients();

  if (detected.length === 0) {
    console.log(chalk.yellow("No se detectó ningún cliente MCP instalado."));
    process.exit(1);
  }

  // Filtrar solo donde está instalado
  const installed = detected.filter((c) => isAlreadyInstalled(c.id, slug));

  if (installed.length === 0) {
    console.log(chalk.yellow(`"${slug}" no está instalado en ningún cliente.`));
    process.exit(0);
  }

  let targets: DetectedClient[] = installed;

  if (installed.length > 1) {
    const { selected } = await inquirer.prompt<{ selected: string[] }>([
      {
        type: "checkbox",
        name: "selected",
        message: `¿De qué clientes eliminar ${chalk.bold(slug)}?`,
        choices: installed.map((c) => ({
          name: c.label,
          value: c.id,
          checked: true,
        })),
        validate: (choices: string[]) => choices.length > 0 || "Selecciona al menos uno",
      },
    ]);
    targets = installed.filter((c) => selected.includes(c.id));
  }

  console.log();

  for (const client of targets) {
    try {
      removeFromClient(client.id, slug);
      console.log(chalk.green(`✓ Eliminado de ${chalk.bold(client.label)}`));
    } catch (err: any) {
      console.log(chalk.red(`✗ ${client.label}: ${err.message}`));
    }
  }

  console.log();
}
