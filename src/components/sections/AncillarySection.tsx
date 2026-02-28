import GlossaryTerm from "../GlossaryTerm";

export default function AncillarySection() {
  return (
    <section id="ancillary" className="py-16 scroll-mt-32 border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-white mb-2">Ancillary Services</h2>
        <p className="text-blue-400 text-sm font-medium uppercase tracking-wider mb-8">
          Section B
        </p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <p>
            The grid must maintain exactly 60 Hz at all times. When a large generator
            trips offline, frequency drops within milliseconds. Grid operators contract
            with fast-responding resources to catch these events — these contracts are
            called <strong className="text-white">ancillary services</strong>, and
            batteries are exceptionally well-suited to provide them.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-green-400 font-semibold mb-2">
                <GlossaryTerm
                  term="Regulation Up/Down"
                  definition="Frequency regulation services where a resource continuously adjusts output (up or down) following an Automatic Generation Control (AGC) signal, helping balance supply and demand in real time."
                >
                  Regulation Up/Down
                </GlossaryTerm>
              </h3>
              <p className="text-sm text-slate-400">
                Continuous adjustment up or down following an AGC signal. Batteries
                respond in &lt;100ms — orders of magnitude faster than gas turbines.
                Pays both a capacity fee ($/MW-h of availability) and a performance
                bonus.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-green-400 font-semibold mb-2">
                <GlossaryTerm
                  term="FFR"
                  definition="Fast Frequency Response — the fastest-acting grid service, requiring a resource to respond within 1–2 seconds of a frequency deviation. Batteries can respond in under 200ms, making them the dominant FFR technology."
                >
                  FFR
                </GlossaryTerm>{" "}
                — Fast Frequency Response
              </h3>
              <p className="text-sm text-slate-400">
                Response within 1–2 seconds of a frequency event. Batteries respond in
                &lt;200ms. Premium pricing reflects the speed; GB and Australia have
                dedicated FFR markets.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-green-400 font-semibold mb-2">Spinning Reserve</h3>
              <p className="text-sm text-slate-400">
                Capacity held available to respond within 10 minutes. Batteries can
                fully load in seconds, so they capture spinning reserve contracts while
                still potentially doing other work.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-green-400 font-semibold mb-2">Voltage Support</h3>
              <p className="text-sm text-slate-400">
                Reactive power injection to maintain voltage levels at grid nodes.
                Battery inverters can provide VAR support continuously, independent of
                charge state.
              </p>
            </div>
          </div>

          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-green-400 font-semibold text-lg mb-3">
              Availability Payments
            </h3>
            <p className="text-slate-300">
              The key insight: ancillary services pay primarily for <em>being available</em>,
              not for energy delivered. A battery contracted for regulation may only move
              a fraction of its capacity in actual energy, yet earns a full capacity
              payment. This dramatically improves project economics versus pure arbitrage.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Market Names by Region</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-2 pr-6 text-slate-400 font-medium">Region</th>
                    <th className="pb-2 pr-6 text-slate-400 font-medium">Operator</th>
                    <th className="pb-2 text-slate-400 font-medium">Key Ancillary Markets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    ["US Mid-Atlantic", "PJM", "RegA, RegD, Synchronized Reserve"],
                    ["US Northeast", "ISO-NE", "Regulation, 10-min Spinning"],
                    ["US California", "CAISO", "Regulation Up/Down, Spinning Reserve"],
                    ["Great Britain", "National Grid ESO", "DC, BM, FFR"],
                    ["Australia", "AEMO", "FCAS (8 markets)"],
                  ].map(([region, op, markets]) => (
                    <tr key={region} className="text-slate-300">
                      <td className="py-2 pr-6 font-medium text-white">{region}</td>
                      <td className="py-2 pr-6 text-blue-400">{op}</td>
                      <td className="py-2">{markets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
