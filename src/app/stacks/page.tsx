import type { Metadata } from "next";
import { STACKS } from "@/lib/stacks";
import { getServersBySlugs } from "@/lib/servers";

export const metadata: Metadata = {
  title: "MCP Stacks — MCPHub",
  description: "Curated collections of MCP servers for specific workflows. Install a full stack with one command.",
};

export const dynamic = "force-dynamic";

export default async function StacksPage() {
  // Fetch server names for display
  const allSlugs = [...new Set(STACKS.flatMap((s) => s.servers))];
  const servers = await getServersBySlugs(allSlugs);
  const serverMap = Object.fromEntries(servers.map((s) => [s.slug, s]));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 text-sm px-3 py-1 rounded-full mb-5 border border-purple-500/20">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
          Curated collections
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">MCP Stacks</h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
          Pre-configured sets of MCP servers for specific workflows.
          Install an entire stack with one command instead of configuring each server individually.
        </p>
      </div>

      {/* Stacks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {STACKS.map((stack) => {
          const stackServers = stack.servers
            .map((slug) => serverMap[slug])
            .filter(Boolean);

          return (
            <a
              key={stack.slug}
              href={`/stacks/${stack.slug}`}
              className="group block rounded-xl border border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800 transition-all hover:-translate-y-0.5 p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{stack.icon}</span>
                <div>
                  <h2 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {stack.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {stackServers.length} server{stackServers.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{stack.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {stackServers.slice(0, 5).map((s) => (
                  <span
                    key={s.slug}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
                  >
                    {s.name}
                  </span>
                ))}
                {stackServers.length > 5 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                    +{stackServers.length - 5} more
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {/* CTA — Teams */}
      <div className="mt-12 bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 text-center">
        <h3 className="font-semibold text-white mb-2">Need a custom stack for your team?</h3>
        <p className="text-sm text-gray-400 mb-4">
          Create a team on MCPHub, add the servers you use, and share a single sync command.
          New developers get everything configured in under a minute.
        </p>
        <a
          href="/teams"
          className="inline-flex items-center gap-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create a team →
        </a>
      </div>
    </div>
  );
}
