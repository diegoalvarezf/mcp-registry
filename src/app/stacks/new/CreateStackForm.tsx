"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const ICONS = ["⬡", "◈", "◎", "◆", "▲", "⊕", "⌬", "⬢", "✦", "⟡", "⊞", "⌘"];

type ItemType = "server" | "skill" | "agent";

interface StackItem {
  type: ItemType;
  itemSlug: string;
  name: string;
}

interface SearchResult {
  slug: string;
  name: string;
  description: string;
  type: ItemType;
}

const TYPE_LABEL: Record<ItemType, string> = {
  server: "MCP",
  skill: "Skill",
  agent: "Agent",
};

const TYPE_STYLE: Record<ItemType, string> = {
  server: "text-gray-400 border-gray-700 bg-gray-800",
  skill: "text-gray-400 border-gray-700 bg-gray-800",
  agent: "text-gray-400 border-gray-700 bg-gray-800",
};

export function CreateStackForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⬡");
  const [isPublic, setIsPublic] = useState(false);
  const [items, setItems] = useState<StackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    try {
      const [serversRes, skillsRes] = await Promise.all([
        fetch(`/api/servers?q=${encodeURIComponent(q)}&limit=5`),
        fetch(`/api/skills?q=${encodeURIComponent(q)}`),
      ]);
      const [serversData, skillsData] = await Promise.all([
        serversRes.json(),
        skillsRes.json(),
      ]);

      const serverResults: SearchResult[] = (serversData.servers ?? []).slice(0, 5).map((s: { slug: string; name: string; description: string }) => ({
        slug: s.slug,
        name: s.name,
        description: s.description,
        type: "server" as ItemType,
      }));

      const skillResults: SearchResult[] = (skillsData.skills ?? []).slice(0, 5).map((s: { slug: string; name: string; description: string; type: string }) => ({
        slug: s.slug,
        name: s.name,
        description: s.description,
        type: (s.type === "agent" ? "agent" : "skill") as ItemType,
      }));

      setResults([...serverResults, ...skillResults]);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 250);
  }

  function addResult(result: SearchResult) {
    if (items.some(i => i.itemSlug === result.slug)) {
      setQuery("");
      setOpen(false);
      return;
    }
    setItems(prev => [...prev, { type: result.type, itemSlug: result.slug, name: result.name }]);
    setQuery("");
    setOpen(false);
    setResults([]);
  }

  function removeItem(slug: string) {
    setItems(prev => prev.filter(i => i.itemSlug !== slug));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/stacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        icon,
        public: isPublic,
        items: items.map(i => ({ type: i.type, itemSlug: i.itemSlug })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error creating stack");
      setLoading(false);
      return;
    }
    router.push(`/stacks/${data.slug}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Icon */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(i => (
            <button key={i} type="button" onClick={() => setIcon(i)}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${icon === i ? "border-white bg-gray-700" : "border-gray-700 bg-gray-900 hover:border-gray-600"}`}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Name *</label>
        <input
          value={name} onChange={e => setName(e.target.value)} required
          placeholder="My Full-Stack Kit"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
        <input
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="What's this stack for?"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
      </div>

      {/* Items search */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Items</label>
        <div ref={searchRef} className="relative">
          <input
            value={query}
            onChange={handleQueryChange}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search servers, skills, or agents..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">searching…</span>
          )}

          {open && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
              {results.map(r => {
                const already = items.some(i => i.itemSlug === r.slug);
                return (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => addResult(r)}
                    disabled={already}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-gray-800 last:border-0 ${already ? "opacity-40 cursor-default" : "hover:bg-gray-800"}`}
                  >
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${TYPE_STYLE[r.type]}`}>
                      {TYPE_LABEL[r.type]}
                    </span>
                    <span className="text-sm text-white truncate">{r.name}</span>
                    <span className="text-xs text-gray-600 font-mono truncate ml-auto">{r.slug}</span>
                    {already && <span className="text-xs text-gray-600 shrink-0">added</span>}
                  </button>
                );
              })}
            </div>
          )}

          {open && !searching && results.length === 0 && query.trim() && (
            <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-500">
              No results for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Selected items */}
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {items.map(item => (
              <div key={item.itemSlug} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-800/60 text-xs text-gray-300">
                <span className="text-[10px] text-gray-500 font-medium">{TYPE_LABEL[item.type]}</span>
                <span className="font-medium">{item.name}</span>
                <button type="button" onClick={() => removeItem(item.itemSlug)} className="ml-0.5 text-gray-600 hover:text-gray-300 transition-colors">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600 mt-3">No items yet. Search above to add servers, skills, or agents.</p>
        )}
      </div>

      {/* Public toggle */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => setIsPublic(p => !p)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors mt-0.5 ${isPublic ? "bg-green-600" : "bg-gray-700"}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-white">{isPublic ? "Public" : "Private"}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isPublic ? "Visible to everyone in the stacks directory." : "Only you can see this stack."}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading || !name.trim()}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors">
          {loading ? "Creating..." : "Create stack"}
        </button>
        <a href="/stacks" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Cancel</a>
      </div>
    </form>
  );
}
