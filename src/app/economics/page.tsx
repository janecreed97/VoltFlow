import StickySubNav from "../../components/StickySubNav";
import ArbitrageSection from "../../components/sections/ArbitrageSection";
import AncillarySection from "../../components/sections/AncillarySection";
import CapacitySection from "../../components/sections/CapacitySection";
import StackingSection from "../../components/sections/StackingSection";

export const metadata = {
  title: "How It Works — VoltFlow",
  description:
    "A deep-dive into the three revenue streams of grid-scale battery storage: wholesale arbitrage, ancillary services, and capacity markets.",
};

export default function EconomicsPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-slate-900 border-b border-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-blue-400 text-sm font-medium uppercase tracking-wider mb-3">
            The Revenue Stack
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            How Battery Storage <br className="hidden sm:block" />
            Economics Actually Work
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Grid-scale batteries earn revenue from three distinct markets. Understanding
            how they interact — and how to stack them — is the foundation of every
            viable storage project.
          </p>
        </div>
      </div>

      <StickySubNav />

      <div className="bg-slate-900">
        <ArbitrageSection />
        <AncillarySection />
        <CapacitySection />
        <StackingSection />
      </div>

      {/* Footer CTA */}
      <div className="border-t border-slate-800 bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to model it yourself?
          </h2>
          <p className="text-slate-400 mb-6">
            The simulator lets you plug in real asset parameters and see how the revenue
            stack changes across markets.
          </p>
          <a
            href="/simulator"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Run the Simulator →
          </a>
        </div>
      </div>
    </>
  );
}
