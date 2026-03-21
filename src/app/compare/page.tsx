import { getServersBySlugs, getServers } from "@/lib/servers";
import type { McpServer } from "@/lib/types";
import { IconShieldCheck, IconShieldQuestion, IconShieldAlert, IconCheck, IconDownload, IconStar } from "@/components/Icons";

export const dynamic = "force-dynamic";

const RISK_LABEL: Record<string, string> = {
  safe: "Safe", low: "Low risk", medium: "Medium risk", high: "High risk", unknown: "Unaudited",
};
const RISK_COLOR: Record<string, string> = {
  safe: "text-green-400", low: "text-yellow-400", medium: "text-orange-400", high: "text-red-400", unknown: "text-gray-500",
};

function RiskIcon({ level }: { level: string }) {
  if (level === "safe") return <IconShieldCheck size={13} />;
  if (level === "unknown") return <IconShieldQuestion size={13} />;
  return <IconShieldAlert size={13} />;
}

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-5 py-4 align-top border-b border-gray-800 ${className}`}>
      {children}
    </td>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-5 py-4 align-top border-b border-gray-800 w-40 shrink-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{children}</span>
    </td>
  );
}

function ServerColumn({ server }: { server: McpServer }) {
  return (
    <th className="px-5 py-4 text-left border-b border-gray-800 bg-gray-900/50 w-72">
      <a href={`/server/${server.slug}`} className="group">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{server.name}</span>
          {server.verified && <IconCheck size={12} className="text-blue-400 shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed font-normal">{server.description}</p>
      </a>
    </th>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(t => (
        <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">#{t}</span>
      ))}
    </div>
  );
}

function ToolList({ tools }: { tools: string[] }) {
  return (
    <div className="space-y-0.5">
      {tools.map(t => (
        <div key={t} className="font-mono text-xs text-gray-300">{t}</div>
      ))}
    </div>
  );
}

function ClientList({ clients }: { clients: string[] }) {
  const labels: Record<string, string> = {
    "claude-code": "Claude Code",
    "claude-desktop": "Claude Desktop",
    cursor: "Cursor",
    continue: "Continue.dev",
    openclaw: "OpenClaw",
    other: "Other",
  };
  return (
    <div className="flex flex-wrap gap-1">
      {clients.map(c => (
        <span key={c} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
          {labels[c] ?? c}
        </span>
      ))}
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string; c?: string };
}) {
  const slugs = [searchParams.a, searchParams.b, searchParams.c].filter(Boolean) as string[];
  const [servers, allServers] = await Promise.all([
    slugs.length ? getServersBySlugs(slugs) : Promise.resolve([]),
    getServers({ sort: "popular" }),
  ]);

  // Sort servers to match URL order
  const ordered = slugs.map(s => servers.find(sv => sv.slug === s)).filter(Boolean) as McpServer[];

  function buildUrl(newSlugs: string[]) {
    const params = new URLSearchParams();
    const keys = ["a", "b", "c"];
    newSlugs.forEach((s, i) => params.set(keys[i], s));
    return `/compare?${params.toString()}`;
  }

  function addUrl(slug: string) {
    const newSlugs = [...slugs.filter(s => s !== slug), slug].slice(0, 3);
    return buildUrl(newSlugs);
  }

  function removeUrl(slug: string) {
    return buildUrl(slugs.filter(s => s !== slug));
  }

  const available = allServers.servers.filter(s => !slugs.includes(s.slug));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Compare MCP Servers</h1>
        <p className="text-gray-500 text-sm">Select up to 3 servers to compare side by side.</p>
      </div>

      {/* Server picker */}
      <div className="flex flex-wrap gap-2 mb-8">
        {ordered.map(s => (
          <a
            key={s.slug}
            href={removeUrl(s.slug)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm hover:bg-blue-500/20 transition-colors"
          >
            <span>{s.name}</span>
            <span className="text-blue-500/60 text-xs">×</span>
          </a>
        ))}
        {ordered.length < 3 && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">
              + Add server
            </button>
            <div className="absolute top-full left-0 mt-1 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-10 hidden group-focus-within:block overflow-hidden">
              <div className="p-2 max-h-72 overflow-y-auto">
                {available.slice(0, 20).map(s => (
                  <a
                    key={s.slug}
                    href={addUrl(s.slug)}
                    className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-xs text-gray-600 shrink-0">{s.transport}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {ordered.length < 2 ? (
        /* Empty state — show popular servers to pick */
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Popular servers — select to compare</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allServers.servers.slice(0, 12).map(s => (
              <a
                key={s.slug}
                href={addUrl(s.slug)}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-all hover:-translate-y-0.5 ${
                  slugs.includes(s.slug)
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-gray-800 bg-gray-900 hover:border-gray-600"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-medium text-sm text-white truncate">{s.name}</span>
                    {slugs.includes(s.slug) && <IconCheck size={11} className="text-blue-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        /* Comparison table */
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-4 text-left border-b border-gray-800 bg-gray-900/50 w-40" />
                {ordered.map(s => <ServerColumn key={s.slug} server={s} />)}
              </tr>
            </thead>
            <tbody>
              {/* Install */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Install</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}>
                    {s.installCmd
                      ? <code className="font-mono text-xs text-green-400 bg-gray-800 px-2 py-1 rounded block truncate">{s.installCmd}</code>
                      : <span className="text-gray-600 text-xs">—</span>
                    }
                  </Cell>
                ))}
              </tr>

              {/* Transport */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Transport</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}>
                    <span className="font-mono text-sm text-gray-300">{s.transport}</span>
                  </Cell>
                ))}
              </tr>

              {/* Security */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Security</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}>
                    <span className={`flex items-center gap-1.5 text-sm ${RISK_COLOR[s.riskLevel] ?? RISK_COLOR.unknown}`}>
                      <RiskIcon level={s.riskLevel} />
                      {RISK_LABEL[s.riskLevel] ?? "Unaudited"}
                    </span>
                  </Cell>
                ))}
              </tr>

              {/* Rating */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Rating</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}>
                    {s.avgRating
                      ? <span className="flex items-center gap-1 text-sm text-yellow-400"><IconStar size={12} />{s.avgRating} <span className="text-gray-600 text-xs">({s.reviewCount})</span></span>
                      : <span className="text-gray-600 text-xs">No reviews yet</span>
                    }
                  </Cell>
                ))}
              </tr>

              {/* Downloads */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Installs</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}>
                    <span className="flex items-center gap-1 text-sm text-gray-300">
                      <IconDownload size={12} className="text-gray-500" />
                      {s.downloadCount > 0 ? s.downloadCount.toLocaleString() : "—"}
                    </span>
                  </Cell>
                ))}
              </tr>

              {/* Compatible clients */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Works with</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}><ClientList clients={s.clients} /></Cell>
                ))}
              </tr>

              {/* License */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>License</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}>
                    <span className="text-sm text-gray-300">{s.license}</span>
                  </Cell>
                ))}
              </tr>

              {/* Author */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Author</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}>
                    {s.authorUrl
                      ? <a href={s.authorUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">{s.authorName}</a>
                      : <span className="text-sm text-gray-300">{s.authorName}</span>
                    }
                  </Cell>
                ))}
              </tr>

              {/* Tags */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Tags</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}><TagList tags={s.tags} /></Cell>
                ))}
              </tr>

              {/* Tools */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <Label>Tools ({ordered.map(s => s.tools.length).join(" / ")})</Label>
                {ordered.map(s => (
                  <Cell key={s.slug}><ToolList tools={s.tools} /></Cell>
                ))}
              </tr>

              {/* Install button row */}
              <tr>
                <td className="px-5 py-4" />
                {ordered.map(s => (
                  <td key={s.slug} className="px-5 py-4">
                    <a
                      href={`/server/${s.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      View & install
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
