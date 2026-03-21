import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStack, STACKS } from "@/lib/stacks";
import { getServersBySlugs } from "@/lib/servers";
import { ServerCard } from "@/components/ServerCard";
import { CopyButton } from "@/components/CopyButton";

export function generateStaticParams() {
  return STACKS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const stack = getStack(params.slug);
  if (!stack) return {};
  return {
    title: `${stack.name} Stack — MCPHub`,
    description: stack.description,
  };
}

export const dynamic = "force-dynamic";

export default async function StackPage({ params }: { params: { slug: string } }) {
  const stack = getStack(params.slug);
  if (!stack) notFound();

  const servers = await getServersBySlugs(stack.servers);

  // Preserve stack order
  const ordered = stack.servers
    .map((slug) => servers.find((s) => s.slug === slug))
    .filter(Boolean) as typeof servers;

  // Build CLI install commands for each server
  const installAll = stack.servers.map((s) => `mcp install ${s}`).join(" && ");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Back */}
      <a href="/stacks" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8">
        ← All stacks
      </a>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{stack.icon}</span>
          <h1 className="text-3xl sm:text-4xl font-bold">{stack.name}</h1>
        </div>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl">{stack.description}</p>
      </div>

      {/* Install all */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Install entire stack
        </h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-3">
            Installs all {ordered.length} servers with the MCPHub CLI — asks for required credentials as it goes.
          </p>
          <div className="flex items-center justify-between gap-4">
            <div className="font-mono text-sm text-green-400 overflow-x-auto">
              <span className="text-gray-500">$ </span>
              {installAll}
            </div>
            <CopyButton text={installAll} />
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Requires{" "}
            <a href="/install-cli" className="text-blue-400/70 hover:text-blue-400">
              MCPHub CLI
            </a>{" "}
            · <span className="font-mono">npm install -g @mcphub/cli</span>
          </p>
        </div>
      </section>

      {/* Servers */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Servers in this stack ({ordered.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {ordered.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      </section>

      {/* Team CTA */}
      <div className="mt-12 bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white mb-1">Share this stack with your team</h3>
          <p className="text-sm text-gray-400">
            Create a team, add these servers, and share one sync command.
          </p>
        </div>
        <a
          href="/teams/new"
          className="shrink-0 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create team →
        </a>
      </div>
    </div>
  );
}
