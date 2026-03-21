import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ServerCard } from "@/components/ServerCard";
import { SkillCard } from "@/components/SkillCard";
import { AgentCard } from "@/components/AgentCard";
import { LibraryActions } from "./LibraryActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Library — MCPHub",
};

function parseServer(s: any) {
  return { ...s, tags: JSON.parse(s.tags), tools: JSON.parse(s.tools), clients: JSON.parse(s.clients) };
}

export default async function LibraryPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin?callbackUrl=/library");

  const login = session.user.githubLogin;
  if (!login) redirect("/auth/signin");

  const [rawServers, skills] = await Promise.all([
    prisma.server.findMany({
      where: { createdBy: login },
      orderBy: { createdAt: "desc" },
    }),
    prisma.skill.findMany({
      where: { createdBy: login },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const servers = rawServers.map(parseServer);
  const prompts = skills.filter(s => s.type === "prompt");
  const agents = skills.filter(s => s.type === "agent");

  const total = servers.length + skills.length;
  const publicCount = servers.length + skills.filter(s => s.published).length;
  const privateCount = skills.filter(s => !s.published).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Library</h1>
          <p className="text-gray-400 text-sm">
            Everything you've submitted — MCP servers, skills, and agents.
          </p>
        </div>
        <a
          href="/submit"
          className="shrink-0 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-white transition-colors"
        >
          + Add new
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total items</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{publicCount}</p>
          <p className="text-xs text-gray-500 mt-1">Published</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{privateCount}</p>
          <p className="text-xs text-gray-500 mt-1">Private</p>
        </div>
      </div>

      {total === 0 && (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">Your library is empty</p>
          <p className="text-sm mb-6">Submit MCP servers, skills, or agents — public or private.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/submit" className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-sm text-blue-300 hover:bg-blue-600/30 transition-colors">
              + Submit MCP Server
            </a>
            <a href="/submit?type=prompt" className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:bg-purple-600/30 transition-colors">
              + New skill
            </a>
            <a href="/submit?type=agent" className="px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-lg text-sm text-orange-300 hover:bg-orange-600/30 transition-colors">
              + New agent
            </a>
          </div>
        </div>
      )}

      {/* MCP Servers */}
      {servers.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              MCP Servers ({servers.length})
            </h2>
            <a href="/submit" className="text-xs text-blue-400 hover:underline">+ New server</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {servers.map(s => (
              <ServerCard key={s.id} server={s} />
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {prompts.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Skills ({prompts.length})
            </h2>
            <a href="/submit?type=prompt" className="text-xs text-purple-400 hover:underline">+ New skill</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {prompts.map(s => (
              <div key={s.id} className="relative group">
                <SkillCard skill={s as any} />
                <LibraryActions slug={s.slug} type="skill" published={s.published} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agents */}
      {agents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Agents ({agents.length})
            </h2>
            <a href="/submit?type=agent" className="text-xs text-orange-400 hover:underline">+ New agent</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {agents.map(s => (
              <div key={s.id} className="relative group">
                <AgentCard skill={s as any} />
                <LibraryActions slug={s.slug} type="agent" published={s.published} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
