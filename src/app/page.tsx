import Link from "next/link";

const cards = [
  {
    anchor: "arbitrage",
    icon: "📈",
    title: "Wholesale Arbitrage",
    description:
      "Buy low, sell high — on the grid. Understand how batteries capture price spreads in real-time wholesale markets and why round-trip efficiency is the critical variable.",
    color: "border-amber-500/30 hover:border-amber-500/60",
    badge: "bg-amber-500/10 text-amber-400",
  },
  {
    anchor: "ancillary",
    icon: "⚡",
    title: "Ancillary Services",
    description:
      "The grid needs to stay at exactly 60 Hz. Fast-responding batteries get paid just for being available to stabilize frequency — often the highest-value market per MW.",
    color: "border-green-500/30 hover:border-green-500/60",
    badge: "bg-green-500/10 text-green-400",
  },
  {
    anchor: "capacity",
    icon: "🏦",
    title: "Capacity Markets",
    description:
      "Bankable, forward-contracted revenue. Capacity markets pay per MW per year to guarantee resource availability — lenders love it, and it anchors project finance models.",
    color: "border-blue-500/30 hover:border-blue-500/60",
    badge: "bg-blue-500/10 text-blue-400",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 pt-24 pb-20">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span>⚡</span>
            Grid-Scale Battery Economics
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Demystifying the{" "}
            <span className="text-blue-400">Economics</span> of
            <br className="hidden sm:block" /> Grid-Scale Storage
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Grid-scale batteries earn from three revenue streams simultaneously. Learn
            how arbitrage, ancillary services, and capacity markets stack together to
            make storage projects pencil out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/economics"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-lg"
            >
              Explore the Revenue Stack
            </Link>
            <Link
              href="/simulator"
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-3.5 rounded-lg border border-slate-700 transition-colors text-lg"
            >
              Run the Simulator →
            </Link>
          </div>
        </div>
      </section>

      {/* 3-column cards */}
      <section className="bg-slate-900 py-20 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">The Three Revenue Streams</h2>
            <p className="text-slate-400 text-lg">
              Each market rewards batteries for a different capability. Together, they
              form the revenue stack.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {cards.map(({ anchor, icon, title, description, color, badge }) => (
              <Link
                key={anchor}
                href={`/economics#${anchor}`}
                className={`group bg-slate-800 border rounded-xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/50 ${color}`}
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-4 ${badge}`}
                >
                  {icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
                <div className="mt-4 text-blue-400 text-sm font-medium group-hover:underline">
                  Learn more →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            See the Numbers for Yourself
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Plug in your asset parameters — capacity, duration, market, cost — and
            watch the revenue stack update in real time.
          </p>
          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-10 py-4 rounded-lg text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Run the Simulator →
          </Link>
        </div>
      </section>
    </>
  );
}
