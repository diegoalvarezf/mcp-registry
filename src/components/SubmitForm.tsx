"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Field = { label: string; name: string; type?: string; placeholder: string; required?: boolean; hint?: string };

const CLIENTS = ["claude-code", "cursor", "continue", "other"];

export function SubmitForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<string[]>([]);
  const [transport, setTransport] = useState("stdio");

  const toggleClient = (c: string) =>
    setClients((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      description: fd.get("description"),
      longDesc: fd.get("longDesc") || undefined,
      repoUrl: fd.get("repoUrl"),
      npmPackage: fd.get("npmPackage") || undefined,
      authorName: fd.get("authorName"),
      authorUrl: fd.get("authorUrl") || undefined,
      license: fd.get("license") || "MIT",
      version: fd.get("version") || "0.1.0",
      tags: String(fd.get("tags")).split(",").map((t) => t.trim()).filter(Boolean),
      tools: String(fd.get("tools")).split(",").map((t) => t.trim()).filter(Boolean),
      clients,
      transport,
    };

    const res = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push(`/server/${data.server.slug}?submitted=1`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field name="name" label="Server name" placeholder="my-mcp-server" required />
      <Field
        name="description"
        label="Short description"
        placeholder="A brief description of what this server does (20–280 chars)"
        required
        hint="Shown in search results"
      />
      <Field
        name="repoUrl"
        label="GitHub repository"
        placeholder="https://github.com/user/repo"
        required
      />
      <Field name="npmPackage" label="npm package" placeholder="@scope/package-name" />

      <div className="grid grid-cols-2 gap-4">
        <Field name="authorName" label="Author" placeholder="your-github-username" required />
        <Field name="authorUrl" label="Author URL" placeholder="https://github.com/you" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field name="version" label="Version" placeholder="0.1.0" />
        <Field name="license" label="License" placeholder="MIT" />
      </div>

      <Field
        name="tags"
        label="Tags"
        placeholder="filesystem, search, database"
        required
        hint="Comma-separated, up to 8 tags"
      />
      <Field
        name="tools"
        label="MCP Tools"
        placeholder="read_file, write_file, list_directory"
        required
        hint="Comma-separated tool names exposed by this server"
      />

      {/* Compatible clients */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Compatible clients <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {CLIENTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleClient(c)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                clients.includes(c)
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Transport */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Transport</label>
        <div className="flex gap-2">
          {["stdio", "sse", "http"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTransport(t)}
              className={`px-3 py-1.5 rounded-lg text-sm border font-mono transition-colors ${
                transport === t
                  ? "bg-gray-700 border-gray-500 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Long description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Full description <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          name="longDesc"
          rows={4}
          placeholder="Detailed description of what the server does, how to configure it, etc."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || clients.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
      >
        {loading ? "Submitting..." : "Submit server"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        By submitting, you confirm this server is open source and complies with the MCP specification.
      </p>
    </form>
  );
}

function Field({
  name, label, placeholder, required, hint, type = "text",
}: {
  name: string; label: string; placeholder: string;
  required?: boolean; hint?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
