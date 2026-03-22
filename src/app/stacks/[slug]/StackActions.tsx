"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function StackActions({ slug }: { slug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/stacks/${slug}`, { method: "DELETE" });
    router.push("/stacks");
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <a
        href={`/stacks/${slug}/edit`}
        className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
      >
        Edit
      </a>

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Delete?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-400 bg-gray-900 hover:bg-red-500/10 border border-gray-800 hover:border-red-500/30 rounded-lg transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  );
}
