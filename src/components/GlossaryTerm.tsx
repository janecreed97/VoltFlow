"use client";

import { useState } from "react";

interface GlossaryTermProps {
  term: string;
  definition: string;
  children: React.ReactNode;
}

export default function GlossaryTerm({
  term,
  definition,
  children,
}: GlossaryTermProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        className="border-b border-dashed border-blue-400 cursor-help text-blue-300"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        aria-label={`${term}: ${definition}`}
      >
        {children}
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg bg-slate-700 border border-slate-600 p-3 shadow-xl pointer-events-none">
          <span className="block text-xs font-semibold text-blue-400 mb-1">{term}</span>
          <span className="block text-xs text-slate-200 leading-relaxed">{definition}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
        </span>
      )}
    </span>
  );
}
