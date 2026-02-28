import GlossaryTerm from "../GlossaryTerm";

export default function CapacitySection() {
  return (
    <section id="capacity" className="py-16 scroll-mt-32 border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-white mb-2">Capacity Markets</h2>
        <p className="text-blue-400 text-sm font-medium uppercase tracking-wider mb-8">
          Section C
        </p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <p>
            Capacity markets pay generators and storage assets to <em>exist</em> — to
            be there when needed during peak demand, typically on a small number of
            critical days per year. The payment is a fixed $/MW-year (or $/kW-year)
            contract, regardless of whether the asset is ever called to dispatch.
          </p>

          <p>
            This is the most bankable of the three revenue streams. Because capacity
            payments are locked in through forward auctions (typically 3 years in
            advance in{" "}
            <GlossaryTerm
              term="PJM"
              definition="PJM Interconnection — the largest wholesale electricity market in North America, covering 13 states plus DC. Runs the largest capacity market (RPM) in the world, auctioning multi-year capacity commitments."
            >
              PJM
            </GlossaryTerm>
            ), lenders can underwrite them as contracted revenue, improving debt
            financing terms for battery projects.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-blue-500/20">
              <h3 className="text-blue-400 font-semibold text-lg mb-3">PJM — RPM</h3>
              <p className="text-sm text-slate-300 mb-3">
                PJM&apos;s Reliability Pricing Model runs annual Base Residual Auctions
                (BRAs) 3 years ahead. Batteries qualify as Capacity Performance (CP)
                resources and must be available during all Emergency Action hours — or
                face performance penalties.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                  Typical range
                </span>
                <span className="text-white font-semibold">$50–$200 /MW-day</span>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-blue-500/20">
              <h3 className="text-blue-400 font-semibold text-lg mb-3">ISO-NE — FCM</h3>
              <p className="text-sm text-slate-300 mb-3">
                ISO New England&apos;s Forward Capacity Market auctions capacity 3 years
                out via the Forward Capacity Auction (FCA). New England&apos;s tight
                supply/demand balance has driven some of the highest capacity clearing
                prices in North America.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                  Typical range
                </span>
                <span className="text-white font-semibold">$3–$15 /kW-month</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-blue-400 font-semibold text-lg mb-3">
              The Fixed Payment Model
            </h3>
            <div className="space-y-3 text-slate-300">
              <p>
                Unlike energy markets that pay per MWh delivered, capacity markets pay
                per MW of committed capacity per day (or month, or year). A 100 MW / 400
                MWh battery clearing at $100/MW-day earns:
              </p>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                <span className="text-amber-400">100 MW</span>
                <span className="text-slate-400"> × </span>
                <span className="text-blue-400">$100/MW-day</span>
                <span className="text-slate-400"> × </span>
                <span className="text-green-400">365 days</span>
                <span className="text-slate-400"> = </span>
                <span className="text-white font-bold">$3.65M/year</span>
                <span className="text-slate-500 ml-2 text-xs">(regardless of dispatch)</span>
              </div>
              <p className="text-sm text-slate-400">
                This predictable income stream is why project finance models prioritize
                capacity market participation — it anchors debt service coverage ratios
                (DSCR) even before energy revenue is modelled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
