import Link from "next/link";

export const metadata = {
  title: "Simulator — VoltFlow",
  description: "Battery storage revenue simulator — coming soon.",
};

export default function SimulatorPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center shadow-2xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Under Construction
        </div>

        {/* Icon */}
        <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔋</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Battery Storage Simulator
        </h1>
        <p className="text-slate-400 leading-relaxed mb-8">
          The simulator will let you model the full revenue stack for a grid-scale
          battery project — input your capacity, duration, target market, and capex,
          and see a detailed breakdown of projected arbitrage, ancillary, and capacity
          revenues.
        </p>

        {/* Feature list */}
        <ul className="text-left space-y-3 mb-10">
          {[
            "Market selection: PJM, ISO-NE, CAISO, GB, AEMO",
            "Revenue stack breakdown with % contributions",
            "RTE and degradation sensitivity analysis",
            "Project IRR and payback period outputs",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="text-blue-400 mt-0.5 shrink-0">→</span>
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/economics"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
        >
          ← Learn the economics first
        </Link>
      </div>
    </div>
  );
}
