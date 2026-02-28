"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "arbitrage", label: "Arbitrage" },
  { id: "ancillary", label: "Ancillary" },
  { id: "capacity", label: "Capacity" },
  { id: "stacking", label: "Stacking" },
];

export default function StickySubNav() {
  const [active, setActive] = useState("arbitrage");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActive(id);
          }
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav className="sticky top-16 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 py-3">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto">
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              active === id
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
