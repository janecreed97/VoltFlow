import GlossaryTerm from "../GlossaryTerm";

export default function ArbitrageSection() {
  return (
    <section id="arbitrage" className="py-16 scroll-mt-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-white mb-2">Wholesale Arbitrage</h2>
        <p className="text-blue-400 text-sm font-medium uppercase tracking-wider mb-8">
          Section A
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-slate-300 leading-relaxed">
          <p>
            Wholesale arbitrage is the simplest revenue stream to understand: charge the
            battery when electricity is cheap, discharge when it&apos;s expensive. A
            grid-scale battery sitting on the wholesale market reads{" "}
            <GlossaryTerm
              term="LMP"
              definition="Locational Marginal Price — the real-time price of electricity at a specific point on the grid, set by the wholesale market every 5 minutes."
            >
              LMP
            </GlossaryTerm>{" "}
            prices in real time and executes charge/discharge cycles to capture price
            spreads.
          </p>

          <div className="bg-slate-800 border border-amber-500/30 rounded-xl p-6">
            <h3 className="text-amber-400 font-semibold text-lg mb-3">
              ⚡ The Spread
            </h3>
            <p className="text-slate-300">
              A typical day in a liquid wholesale market might see off-peak prices of
              $25/MWh at 3 AM and on-peak prices of $80/MWh at 6 PM. That $55/MWh
              gross spread is the raw arbitrage opportunity — but it must cover charging
              costs and efficiency losses.
            </p>
          </div>

          <p>
            The critical constraint is{" "}
            <GlossaryTerm
              term="RTE"
              definition="Round-Trip Efficiency — the percentage of energy you put into a battery that you can actually get back out. Modern lithium-ion systems achieve 85–92% RTE."
            >
              RTE
            </GlossaryTerm>{" "}
            (Round-Trip Efficiency). If a battery has 90% RTE, charging 1 MWh at $25
            costs $27.78/MWh on a delivered basis. The net arbitrage margin on a $55
            gross spread shrinks to roughly $52 after efficiency losses.
          </p>

          <p>
            <GlossaryTerm
              term="Degradation"
              definition="The gradual loss of a battery's energy capacity over its lifetime due to repeated charge/discharge cycles. A battery might lose 2–3% of capacity per year, affecting its long-term arbitrage value."
            >
              Degradation
            </GlossaryTerm>{" "}
            is the silent cost. Every cycle slightly reduces the battery&apos;s total
            capacity. Operators must model degradation over a 10–15 year asset life to
            determine whether the arbitrage returns justify the cycling.
          </p>

          {/* Price curve SVG sketch */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-200 font-semibold mb-4">Typical Daily Price Curve</h3>
            <svg
              viewBox="0 0 520 160"
              className="w-full"
              aria-label="Typical daily electricity price curve showing off-peak and on-peak periods"
            >
              {/* Grid lines */}
              {[0, 40, 80, 120].map((y) => (
                <line key={y} x1="50" y1={y + 10} x2="510" y2={y + 10} stroke="#334155" strokeWidth="1" />
              ))}
              {/* Y axis labels */}
              <text x="45" y="15" textAnchor="end" fill="#64748b" fontSize="10">$100</text>
              <text x="45" y="55" textAnchor="end" fill="#64748b" fontSize="10">$75</text>
              <text x="45" y="95" textAnchor="end" fill="#64748b" fontSize="10">$50</text>
              <text x="45" y="135" textAnchor="end" fill="#64748b" fontSize="10">$25</text>
              {/* Price curve path: low overnight, peak morning, dip midday, evening peak */}
              <polyline
                points="50,130 100,125 150,120 200,115 230,90 260,100 300,95 340,70 380,60 420,75 460,110 510,125"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Charge zone */}
              <rect x="50" y="10" width="180" height="130" fill="#22c55e" fillOpacity="0.06" />
              <text x="140" y="155" textAnchor="middle" fill="#22c55e" fontSize="10">Charge (off-peak)</text>
              {/* Discharge zone */}
              <rect x="310" y="10" width="200" height="130" fill="#f59e0b" fillOpacity="0.06" />
              <text x="410" y="155" textAnchor="middle" fill="#f59e0b" fontSize="10">Discharge (on-peak)</text>
              {/* Hour labels */}
              <text x="50" y="155" textAnchor="middle" fill="#64748b" fontSize="9">00:00</text>
              <text x="280" y="155" textAnchor="middle" fill="#64748b" fontSize="9">12:00</text>
              <text x="510" y="155" textAnchor="middle" fill="#64748b" fontSize="9">24:00</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
