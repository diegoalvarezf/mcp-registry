import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { TeamServerList } from "./TeamServerList";
import { AddServerForm } from "./AddServerForm";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const team = await prisma.team.findUnique({ where: { slug: params.slug } });
  return { title: team ? `${team.name} — MCPHub` : "Team — MCPHub" };
}

export default async function TeamPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const user = await prisma.user.findUnique({ where: { githubLogin: session.user.githubLogin! } });
  if (!user) redirect("/auth/signin");

  const team = await prisma.team.findUnique({
    where: { slug: params.slug },
    include: {
      members: {
        include: { user: { select: { id: true, githubLogin: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
      servers: { orderBy: { addedAt: "asc" } },
    },
  });

  if (!team) notFound();

  const membership = team.members.find((m) => m.userId === user.id);
  if (!membership) notFound();

  const isOwner = membership.role === "owner";
  const inviteUrl = `${process.env.NEXTAUTH_URL ?? "https://mcp-registry-sigma.vercel.app"}/join/${team.inviteToken}`;
  const syncCmd = `mcp sync --team ${team.slug} --token ${team.inviteToken}`;

  // Fetch server details for display
  const slugs = team.servers.map((s) => s.serverSlug);
  const servers = slugs.length > 0
    ? await prisma.server.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true, description: true, verified: true, installCmd: true } })
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <a href="/teams" className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 inline-block">
        ← Back to teams
      </a>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          {team.description && <p className="text-gray-400 mt-1">{team.description}</p>}
          <p className="text-xs text-gray-500 mt-2">{team.members.length} member{team.members.length !== 1 ? "s" : ""}</p>
        </div>
        {isOwner && (
          <span className="text-xs border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full">
            ★ Owner
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main: servers list */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Team Servers ({team.servers.length})
            </h2>
            <TeamServerList
              teamSlug={team.slug}
              servers={servers}
              teamServers={team.servers}
              isOwner={isOwner}
            />
            <div className="mt-4">
              <AddServerForm teamSlug={team.slug} />
            </div>
          </section>

          {/* Sync command */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Sync with CLI
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">
                Run this command to install all team servers on a new machine:
              </p>
              <div className="flex items-center justify-between gap-4 font-mono text-sm">
                <span className="text-green-400 break-all">{syncCmd}</span>
                <CopyButton text={syncCmd} />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Members */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Members</h2>
            <div className="space-y-2">
              {team.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  {m.user.avatarUrl && (
                    <img src={m.user.avatarUrl} alt="" className="w-7 h-7 rounded-full bg-gray-800" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300 truncate">{m.user.name}</p>
                    <p className="text-xs text-gray-500">@{m.user.githubLogin}</p>
                  </div>
                  {m.role === "owner" && <span className="text-xs text-yellow-400 ml-auto">owner</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Invite link */}
          {isOwner && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Invite Link</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Share this link to invite team members:</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-400 truncate flex-1">{inviteUrl}</span>
                  <CopyButton text={inviteUrl} />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
