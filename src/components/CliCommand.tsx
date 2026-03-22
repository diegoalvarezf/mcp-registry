"use client";

import { useState, useEffect } from "react";

const EXAMPLES = ["github", "postgres", "filesystem", "slack", "brave-search", "puppeteer"];

export function CliCommand() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % EXAMPLES.length);
        setVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-2.5 font-mono text-sm text-gray-300">
      <span className="text-gray-600 select-none">$ </span>
      npx @sallyheller/mcphub install{" "}
      <span
        className="text-blue-400 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {EXAMPLES[index]}
      </span>
    </div>
  );
}
