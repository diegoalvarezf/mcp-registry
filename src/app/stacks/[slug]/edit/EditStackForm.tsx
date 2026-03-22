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

interface Props {
  slug: string;
  initialName: string;
  initialDescription: string;
  initialIcon: string;
  initialPublic: boolean;
  initialItems: { type: string; itemSlug: string }[];
}

export function EditStackForm({
  slug,
  initialName,
  initialDescription,
  initialIcon,
  initialPublic,
  initialItems,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [icon, setIcon] = useState(initialIcon);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [items, setItems] = useState<StackItem[]>(
    initialItems.map(i => ({ type: i.type as ItemType, itemSlug: i.itemSlug, name: i.itemSlug }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve names for initial items
  useEffect(() => {
    if (initialItems.length === 0) return;
    const serverSlugs = initialItems.filter(i => i.type === "server").map(i => i.itemSlug);
    const skillSlugs = initialItems.filter(i => i.type !== "server").map(i => i.itemSlug);

    Promise.allSettled([
      serverSlugs.length > 0 ? fetch(`/api/servers?q=&limit=100`).then(r => r.json()) : Promise.resolve({ servers: [] }),
      skillSlugs.length > 0 ? fetch(`/api/skills?q=&limit=100`).then(r => r.json()) : Promise.resolve({ skills: [] }),
    ]).then(([sr, skr]) => {
      const serverMap: Record<string, string> = {};
      const skillMap: Record<string, string> = {};
      if (sr.status === "fulfilled") {
        for (const s of sr.value.servers ?? []) serverMap[s.slug] = s.name;
      }
      if (skr.status === "fulfilled") {
        for (const s of skr.value.skills ?? []) skillMap[s.slug] = s.name;
      }
      setItems(prev => prev.map(i => ({
        ...i,
        name: (i.type === "server" ? serverMap[i.itemSlug] : skillMap[i.itemSlug]) ?? i.itemSlug,
      })));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setSearching(true);
    try {
      const [sr, skr] = await Promise.all([
        fetch(`/api/servers?q=${encodeURIComponent(q)}&limit=5`).then(r => r.json()),
        fetch(`/api/skills?q=${encodeURIComponent(q)}`).then(r => r.json()),
      ]);
      const serverResults: SearchResult[] = (sr.servers ?? []).slice(0, 5).map((s: { slug: string; name: string; description: string }) => ({
        slug: s.slug, name: s.name, description: s.description, type: "server" as ItemType,
      }));
      const skillResults: SearchResult[] = (skr.skills ?? []).slice(0, 5).map((s: { slug: string; name: string; description: string; type: string }) => ({
        slug: s.slug, name: s.name, description: s.description,
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
    if (items.some(i => i.itemSlug === result.slug)) { setQuery(""); setOpen(false); return; }
    setItems(prev => [...prev, { type: result.type, itemSlug: result.slug, name: result.name }]);
    setQuery(""); setOpen(false); setResults([]);
  }

  function removeItem(itemSlug: string) {
    setItems(prev => prev.filter(i => i.itemSlug !== itemSlug));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      // 1. Update metadata
      const metaRes = await fetch(`/api/stacks/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, icon, public: isPublic }),
      });
      if (!metaRes.ok) throw new Error((await metaRes.json()).error ?? "Error updating stack");

      // 2. Diff items — remove deleted, add new ones
      const originalSlugs = new Set(initialItems.map(i => i.itemSlug));
      const newSlugs = new Set(items.map(i => i.itemSlug));

      const toRemove = initialItems.filter(i => !newSlugs.has(i.itemSlug));
      const toAdd = items.filter(i => !originalSlugs.has(i.itemSlug));

      await Promise.all([
        ...toRemove.map(i =>
          fetch(`/api/stacks/${slug}/items`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemSlug: i.itemSlug }),
          })
        ),
        ...toAdd.map(i =>
          fetch(`/api/stacks/${slug}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: i.type, itemSlug: i.itemSlug }),
          })
        ),
      ]);

      router.push(`/stacks/${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving changes");
      setLoading(false);
    }
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

      {/* Items */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Items</label>
        <div ref={searchRef} className="relative">
          <input
            value={query}
            onChange={handleQueryChange}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search to add servers, skills, or agents…"
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
                  <button key={r.slug} type="button" onClick={() => addResult(r)} disabled={already}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-gray-800 last:border-0 ${already ? "opacity-40 cursor-default" : "hover:bg-gray-800"}`}>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border text-gray-400 border-gray-700 bg-gray-800 shrink-0">
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
          <p className="text-xs text-gray-600 mt-3">No items. Search above to add some.</p>
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
          {loading ? "Saving…" : "Save changes"}
        </button>
        <a href={`/stacks/${slug}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Cancel</a>
      </div>
    </form>
  );
}
