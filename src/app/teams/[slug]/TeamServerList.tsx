"use client";
import { useRouter } from "next/navigation";

interface Server {
  slug: string;
  name: string;
  description: string;
  verified: boolean;
  installCmd: string | null;
}

interface TeamServer {
  id: string;
  serverSlug: string;
  notes: string | null;
}

interface Props {
  teamSlug: string;
  servers: Server[];
  teamServers: TeamServer[];
  isOwner: boolean;
}

export function TeamServerList({ teamSlug, servers, teamServers, isOwner }: Props) {
  const router = useRouter();

  async function handleRemove(serverSlug: string) {
    await fetch(`/api/teams/${teamSlug}/servers?server=${serverSlug}`, { method: "DELETE" });
    router.refresh();
  }

  if (teamServers.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No servers yet. Add MCP servers that your team uses.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {teamServers.map((ts) => {
        const server = servers.find((s) => s.slug === ts.serverSlug);
        return (
          <div key={ts.id} className="flex items-start justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 gap-3">
            <div className="min-w-0 flex-1">
              {server ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <a href={`/server/${server.slug}`} className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate">
                      {server.name}
                    </a>
                    {server.verified && <span className="text-blue-400 text-xs shrink-0">✓</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{server.description}</p>
                </>
              ) : (
                <span className="text-sm text-gray-400 font-mono">{ts.serverSlug}</span>
              )}
              {ts.notes && <p className="text-xs text-gray-600 mt-1 italic">{ts.notes}</p>}
            </div>
            {isOwner && (
              <button
                onClick={() => handleRemove(ts.serverSlug)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors shrink-0"
              >
                Remove
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
