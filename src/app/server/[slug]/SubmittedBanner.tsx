"use client";

import { useSearchParams } from "next/navigation";

export function SubmittedBanner() {
  const params = useSearchParams();
  if (!params.get("submitted")) return null;

  return (
    <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-5 py-4 mb-8 text-sm flex items-center gap-3">
      <span className="text-lg">✓</span>
      <div>
        <p className="font-medium">Server submitted successfully!</p>
        <p className="text-green-400/70 mt-0.5">It will be reviewed and published shortly.</p>
      </div>
    </div>
  );
}
