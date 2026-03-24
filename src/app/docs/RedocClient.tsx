"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export function RedocClient({ specUrl }: { specUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  function initRedoc() {
    if (initializedRef.current || !containerRef.current) return;
    const w = window as any;
    if (!w.Redoc) return;
    initializedRef.current = true;
    w.Redoc.init(
      specUrl,
      {
        theme: {
          colors: {
            primary: { main: "#6366f1" },
            success: { main: "#22c55e" },
            error:   { main: "#ef4444" },
          },
          sidebar: {
            backgroundColor: "#0f172a",
            textColor: "#cbd5e1",
            activeTextColor: "#a5b4fc",
            groupItems: { textTransform: "uppercase" },
          },
          rightPanel: { backgroundColor: "#1e293b" },
          codeBlock: { backgroundColor: "#0f172a" },
          typography: {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
            headings: { fontFamily: "Inter, system-ui, sans-serif" },
            code: { fontFamily: "JetBrains Mono, Fira Code, monospace", fontSize: "13px" },
          },
        },
        hideDownloadButton: false,
        expandResponses: "200,201",
        showExtensions: false,
        sortPropsAlphabetically: false,
        requiredPropsFirst: true,
        hideHostname: false,
        noAutoAuth: false,
        pathInMiddlePanel: false,
        scrollYOffset: 60,
      },
      containerRef.current
    );
  }

  useEffect(() => {
    // If Redoc was already loaded by the script (fast connection), init immediately
    initRedoc();
  });

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/redoc@2.1.5/bundles/redoc.standalone.js"
        strategy="afterInteractive"
        onReady={initRedoc}
      />
      <div
        ref={containerRef}
        className="min-h-screen"
        style={{ background: "#111827" }}
      />
    </>
  );
}
