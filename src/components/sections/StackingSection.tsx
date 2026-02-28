import RevenueStackSVG from "../RevenueStackSVG";
import GlossaryTerm from "../GlossaryTerm";

export default function StackingSection() {
  return (
    <section id="stacking" className="py-16 scroll-mt-32 border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-white mb-2">Revenue Stacking</h2>
        <p className="text-blue-400 text-sm font-medium uppercase tracking-wider mb-8">
          Section D
        </p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <p>
            No profitable battery project relies on a single revenue stream. The art of
            storage asset management is <strong className="text-white">revenue stacking</strong>:
            layering capacity, ancillary, and arbitrage revenues so that the battery is
            always earning the highest marginal value from its available capacity.
          </p>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <h3 className="text-white font-semibold text-lg">A Typical Stack</h3>
              <p>
                A 4-hour lithium-ion battery in a US market might allocate its capacity
                roughly as follows:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-3 h-3 rounded-sm bg-blue-500 shrink-0" />
                  <div>
                    <span className="text-white font-medium">Capacity Market — ~30%</span>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Fixed $/MW-day contract locked in 3 years forward. Provides revenue
                      floor. Low operating overhead.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-3 h-3 rounded-sm bg-green-500 shrink-0" />
                  <div>
                    <span className="text-white font-medium">Ancillary Services — ~50%</span>
                    <p className="text-sm text-slate-400 mt-0.5">
                      20-hour ancillary window: availability payments for regulation or
                      spinning reserve. Battery rarely fully discharges in this mode.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 w-3 h-3 rounded-sm bg-amber-500 shrink-0" />
                  <div>
                    <span className="text-white font-medium">Arbitrage — ~20%</span>
                    <p className="text-sm text-slate-400 mt-0.5">
                      4-hour price spike capture during peak window. Residual capacity
                      used for energy time-shifting after ancillary commitments are met.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="lg:w-[420px] bg-slate-800 rounded-xl p-4">
              <RevenueStackSVG />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4">
              The 20h Ancillary + 4h Spike Pattern
            </h3>
            <p className="mb-4">
              The dominant operating pattern for a 4-hour{" "}
              <GlossaryTerm
                term="LMP"
                definition="Locational Marginal Price — the real-time wholesale electricity price at a specific grid node, set every 5 minutes by the market clearing algorithm."
              >
                LMP
              </GlossaryTerm>{" "}
              market battery:
            </p>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono font-bold shrink-0">01.</span>
                <span>
                  Hours 0–20: Battery is available for{" "}
                  <GlossaryTerm
                    term="Regulation Up/Down"
                    definition="Grid frequency regulation services where a battery follows an Automatic Generation Control (AGC) signal, continuously adjusting charge/discharge to balance supply and demand."
                  >
                    Regulation Up/Down
                  </GlossaryTerm>{" "}
                  and spinning reserve. Earns capacity payment. Net state of charge
                  stays near 50% (symmetric regulation).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono font-bold shrink-0">02.</span>
                <span>
                  Hours 1–6 (off-peak): If{" "}
                  <GlossaryTerm
                    term="RTE"
                    definition="Round-Trip Efficiency — the ratio of energy extracted from a battery to energy put in. Modern Li-ion systems achieve 85–92% RTE."
                  >
                    RTE
                  </GlossaryTerm>
                  -adjusted LMP spread justifies it, battery charges opportunistically
                  during low-price overnight hours.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono font-bold shrink-0">03.</span>
                <span>
                  Hours 17–21 (evening peak): Battery exits ancillary markets and
                  discharges at full rate into the spike, capturing arbitrage spread.
                  4-hour duration means full discharge capacity is available for the
                  entire peak window.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono font-bold shrink-0">04.</span>
                <span>
                  Repeat. The optimization is running every 5 minutes, re-evaluating
                  prices and adjusting the operating mode in real time.
                </span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <h3 className="text-amber-400 font-semibold mb-2">
              Why Stacking Matters for Project Finance
            </h3>
            <p>
              A battery earning only arbitrage might achieve a 10–12% IRR in a liquid
              market. Layer in ancillary services and capacity, and the same asset can
              reach 15–20%+ unlevered — enough to attract institutional capital and
              support project-finance debt structures. Revenue stacking is not a
              bonus strategy; it&apos;s the fundamental business model.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
