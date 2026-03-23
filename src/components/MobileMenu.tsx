"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ExternalLink } from "lucide-react";

interface Props {
  links: { label: string; href: string; external?: boolean }[];
}

export function MobileMenu({ links }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="sm:hidden" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 text-gray-400 hover:text-white transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-64 bg-gray-900 border-l border-gray-800 z-50 flex flex-col pt-16">
            <nav className="flex flex-col py-4">
              {links.map(({ label, href, external }) => (
                <a
                  key={href}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-6 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {label}
                  {external && <ExternalLink size={12} className="text-gray-600" />}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
