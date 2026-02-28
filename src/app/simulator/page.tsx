"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  calculateBessRevenue,
  type BessConfig,
  type HourlyDispatch,
} from "@/lib/dispatchEngine";
import {
  fetchErcotPrices,
  SETTLEMENT_POINTS,
  type SettlementPoint,
} from "@/lib/ercotService";

// ─── defaults ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: BessConfig = {
  powerMW: 100,
  durationHours: 2,
  rte: 0.85,
  cyclesPerDay: 1,
  vom: 2.0,
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt$(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipPayload {
  payload?: HourlyDispatch;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const d = payload[0].payload;
  const actionColor =
    d.action === "charge"
      ? "text-green-400"
      : d.action === "discharge"
      ? "text-red-400"
      : "text-slate-400";
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-1">{d.label}</p>
      <p className="text-blue-400">${d.price.toFixed(2)}/MWh</p>
      <p className={`font-medium capitalize ${actionColor}`}>{d.action}</p>
      <p className="text-amber-400">SOC {d.soc.toFixed(0)}%</p>
    </div>
  );
}

// ─── Slider control ───────────────────────────────────────────────────────────

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-sm font-mono text-white">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500 h-1.5 rounded"
      />
    </div>
  );
}

// ─── Pill buttons ─────────────────────────────────────────────────────────────

function PillGroup<T extends number>({
  label,
  options,
  value,
  display,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  display: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="text-xs text-slate-400 block mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              value === opt
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {display(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "green" | "red" | "amber" | "blue";
}) {
  const colors = {
    green: "text-green-400",
    red: "text-red-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
  };
  const color = highlight ? colors[highlight] : "text-white";
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SimulatorPage() {
  const [config, setConfig] = useState<BessConfig>(DEFAULT_CONFIG);
  const [node, setNode] = useState<SettlementPoint>("HB_NORTH");
  const [date, setDate] = useState(todayStr());
  const [prices, setPrices] = useState<number[] | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // SSR / Recharts hydration guard
  useEffect(() => setMounted(true), []);

  // Fetch prices when node or date changes
  useEffect(() => {
    setLoading(true);
    fetchErcotPrices(node, date).then((d) => {
      setPrices(d.prices);
      setIsDemo(d.isDemo);
      setLoading(false);
    });
  }, [node, date]);

  const result = useMemo(
    () => (prices ? calculateBessRevenue(prices, config) : null),
    [prices, config]
  );

  const chartData = useMemo(
    () => result?.hourlyDispatch ?? [],
    [result]
  );

  const pnlHighlight: "green" | "red" =
    (result?.netPnL ?? 0) >= 0 ? "green" : "red";

  function setField<K extends keyof BessConfig>(key: K, val: BessConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
          <h1 className="text-lg font-bold text-white flex-1">
            ERCOT BESS Revenue Simulator
          </h1>

          {/* Node selector */}
          <select
            value={node}
            onChange={(e) => setNode(e.target.value as SettlementPoint)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SETTLEMENT_POINTS.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>

          {/* Date picker */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {/* Live / demo badge */}
          {isDemo ? (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo Data
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live ERCOT
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-5 bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Control Panel
          </h2>

          <SliderControl
            label="Power"
            value={config.powerMW}
            min={10}
            max={500}
            step={10}
            display={`${config.powerMW} MW`}
            onChange={(v) => setField("powerMW", v)}
          />

          <PillGroup<number>
            label="Duration"
            options={[1, 2, 4, 6, 8]}
            value={config.durationHours}
            display={(v) => `${v}h`}
            onChange={(v) => setField("durationHours", v)}
          />
          <p className="text-xs text-slate-500 -mt-2">
            {(config.powerMW * config.durationHours).toLocaleString()} MWh capacity
          </p>

          <SliderControl
            label="Round-trip efficiency"
            value={Math.round(config.rte * 100)}
            min={70}
            max={98}
            step={1}
            display={`${Math.round(config.rte * 100)}%`}
            onChange={(v) => setField("rte", v / 100)}
          />

          <PillGroup<number>
            label="Cycles / Day"
            options={[1, 2, 3]}
            value={config.cyclesPerDay}
            display={(v) => `${v}×`}
            onChange={(v) => setField("cyclesPerDay", v)}
          />

          <SliderControl
            label="VOM cost"
            value={config.vom}
            min={0}
            max={10}
            step={0.5}
            display={`$${config.vom.toFixed(2)}/MWh`}
            onChange={(v) => setField("vom", v)}
          />

          {/* Dispatch summary */}
          {result && (
            <>
              <div className="border-t border-slate-700 pt-4 space-y-1.5">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Dispatch Summary
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Cycles executed</span>
                  <span className="text-white font-semibold">{result.cyclesExecuted}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Avg charge price</span>
                  <span className="text-green-400 font-semibold">
                    ${result.avgChargePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Avg discharge price</span>
                  <span className="text-red-400 font-semibold">
                    ${result.avgDischargePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">VOM cost</span>
                  <span className="text-slate-300 font-semibold">
                    {fmt$(result.vomCost)}
                  </span>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-6">
          {/* Chart */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300">
                Day-Ahead Price & Dispatch
              </h2>
              {loading && (
                <span className="text-xs text-slate-500 animate-pulse">
                  Loading prices…
                </span>
              )}
            </div>

            {mounted && !loading ? (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 4, right: 48, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    interval={5}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                  />
                  {/* Left Y: price */}
                  <YAxis
                    yAxisId="price"
                    orientation="left"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                    width={52}
                  />
                  {/* Right Y: SOC */}
                  <YAxis
                    yAxisId="soc"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Price bars coloured by action */}
                  <Bar yAxisId="price" dataKey="price" fillOpacity={0.7} radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.action === "charge"
                            ? "#22c55e"
                            : entry.action === "discharge"
                            ? "#ef4444"
                            : "#334155"
                        }
                      />
                    ))}
                  </Bar>

                  {/* Price line overlay */}
                  <Line
                    yAxisId="price"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    legendType="none"
                  />

                  {/* SOC arc */}
                  <Line
                    yAxisId="soc"
                    dataKey="soc"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    legendType="none"
                    strokeDasharray="5 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-slate-500 text-sm animate-pulse">Loading chart…</div>
              </div>
            )}

            {/* Custom legend */}
            <div className="flex flex-wrap gap-5 mt-3 justify-center text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
                Charging
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                Discharging
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-600 inline-block" />
                Idle
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-500 inline-block" />
                DA Price
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400 inline-block border-dashed border-t border-amber-400" />
                SOC
              </span>
            </div>
          </div>

          {/* Metrics grid */}
          {result && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Captured Spread"
                value={`$${result.dailyCapturedSpread.toFixed(0)}/MWh`}
                sub={`$${result.avgChargePrice.toFixed(0)} → $${result.avgDischargePrice.toFixed(0)}`}
                highlight="blue"
              />
              <MetricCard
                label="Gross Revenue"
                value={fmt$(result.grossRevenue)}
                sub="before costs"
                highlight="amber"
              />
              <MetricCard
                label="Efficiency Loss"
                value={`−${fmt$(result.efficiencyLoss)}`}
                sub={`RTE ${Math.round(config.rte * 100)}%`}
                highlight="red"
              />
              <MetricCard
                label="Net P&L"
                value={fmt$(result.netPnL)}
                sub="per day"
                highlight={pnlHighlight}
              />
            </div>
          )}

          {/* Zero-revenue notice */}
          {result && result.cyclesExecuted === 0 && (
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 text-sm text-amber-300">
              No profitable dispatch found for current configuration. Try lowering VOM cost, increasing power, or adjusting RTE.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
