"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fetchERCOTRTData } from "@/lib/ercotRTService";
import {
  calculateComprehensiveRevenue,
  type BatteryConfig,
  type DispatchInterval,
  type ComprehensiveResult,
} from "@/lib/comprehensiveEngine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number, decimals = 0): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (n < 0 ? "-$" : "$") + formatted;
}

function fmtMW(n: number): string {
  return n.toFixed(1) + " MW";
}

const NODES = ["HB_NORTH", "HB_SOUTH", "HB_HOUSTON", "HB_WEST"];

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface DispatchTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string | number;
}

function DispatchTooltip({ active, payload, label }: DispatchTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded p-3 text-xs space-y-1 shadow-xl">
      <p className="text-slate-300 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Revenue Card ─────────────────────────────────────────────────────────────

function RevenueCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const isNeg = value < 0;
  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${isNeg ? "text-red-400" : color}`}>{fmt$(value, 0)}</p>
    </div>
  );
}

// ─── Slider Control ───────────────────────────────────────────────────────────

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500 cursor-pointer"
      />
    </div>
  );
}

// ─── Waterfall chart data ─────────────────────────────────────────────────────

interface WaterfallEntry {
  name: string;
  base: number;
  value: number;
  fill: string;
}

function buildWaterfall(result: ComprehensiveResult): WaterfallEntry[] {
  const steps = [
    { name: "Energy Rev", value: result.energyRevenue, fill: "#22c55e" },
    { name: "ECRS", value: result.ecrsRevenue, fill: "#8b5cf6" },
    { name: "RRS", value: result.rrsRevenue, fill: "#3b82f6" },
    { name: "Reg Up", value: result.regUpRevenue, fill: "#06b6d4" },
    { name: "Reg Down", value: result.regDownRevenue, fill: "#14b8a6" },
    { name: "NonSpin", value: result.nonSpinRevenue, fill: "#64748b" },
    { name: "Chg Cost", value: -result.chargingCost, fill: "#f97316" },
    { name: "VOM", value: -result.vomCost, fill: "#ef4444" },
  ];

  let running = 0;
  const entries: WaterfallEntry[] = steps.map((s) => {
    const entry = {
      name: s.name,
      base: running,
      value: s.value,
      fill: s.fill,
    };
    running += s.value;
    return entry;
  });

  // Net Revenue bar from 0
  entries.push({ name: "Net Rev", base: 0, value: result.netRevenue, fill: result.netRevenue >= 0 ? "#22c55e" : "#ef4444" });
  return entries;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ComprehensivePage() {
  const [mounted, setMounted] = useState(false);

  // Config state
  const [powerMW, setPowerMW] = useState(100);
  const [energyMWh, setEnergyMWh] = useState(200);
  const [rtePct, setRtePct] = useState(85);
  const [minSoCPct, setMinSoCPct] = useState(5);
  const [vom, setVom] = useState(2.5);
  const [node, setNode] = useState("HB_NORTH");
  const [date, setDate] = useState(todayDate());

  // Data state
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dispatch, setDispatch] = useState<DispatchInterval[]>([]);
  const [result, setResult] = useState<ComprehensiveResult | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    const config: BatteryConfig = {
      powerCapacityMW: powerMW,
      energyCapacityMWh: energyMWh,
      rte: rtePct / 100,
      minSoC: minSoCPct / 100,
      variableOM: vom,
    };
    const rtData = await fetchERCOTRTData(node, date);
    setIsDemo(rtData.isDemo);
    const res = calculateComprehensiveRevenue(rtData.intervals, config);
    setResult(res);
    setDispatch(res.dispatch);
    setLoading(false);
  }, [powerMW, energyMWh, rtePct, minSoCPct, vom, node, date]);

  useEffect(() => {
    if (mounted) runSimulation();
  }, [mounted, runSimulation]);

  // Chart data: one point per interval (288), but for X-axis label every 12 = hourly
  const chartData = dispatch.map((d) => ({
    time: d.time,
    interval: d.interval,
    dischargeMW: d.dischargeMW,
    chargeMWNeg: -d.chargeMW,
    ecrsMW: d.ecrsMW,
    rrsMW: d.rrsMW,
    regUpMW: d.regUpMW,
    nonSpinMW: d.nonSpinMW,
    regDownMWNeg: -d.regDownMW,
    soc: d.soc,
    lmp: d.lmp,
  }));

  // Basis risk table: hourly aggregation
  const basisRows = Array.from({ length: 24 }, (_, h) => {
    const hourIntervals = dispatch.filter((d) => d.hour === h);
    if (hourIntervals.length === 0) return { hour: h, nodeLmp: 0, hubLmp: 0, basis: 0 };
    const nodeLmp = hourIntervals.reduce((s, d) => s + d.lmp, 0) / hourIntervals.length;
    const hubLmp = nodeLmp * 0.97; // approximate hub price = 97% of node
    return { hour: h, nodeLmp, hubLmp, basis: nodeLmp - hubLmp };
  });

  const waterfallData = result ? buildWaterfall(result) : [];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Comprehensive ERCOT ESR Simulator
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Co-optimized energy + 5 AS markets · 5-min RT dispatch · Post-Dec 2025 RTC+B rules
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isDemo && (
                <span className="text-amber-400 text-xs bg-amber-400/10 border border-amber-400/30 rounded px-2 py-1">
                  Demo Data
                </span>
              )}
              <select
                value={node}
                onChange={(e) => setNode(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NODES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={runSimulation}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
              >
                {loading ? "Running…" : "Run"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="w-64 shrink-0 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Battery Config
              </h2>

              <SliderControl
                label="Power Capacity"
                value={powerMW}
                min={10}
                max={500}
                step={10}
                onChange={setPowerMW}
                unit=" MW"
              />
              <SliderControl
                label="Energy Capacity"
                value={energyMWh}
                min={20}
                max={2000}
                step={20}
                onChange={setEnergyMWh}
                unit=" MWh"
              />
              <SliderControl
                label="Round-Trip Efficiency"
                value={rtePct}
                min={70}
                max={98}
                step={1}
                onChange={setRtePct}
                unit="%"
              />

              <div className="space-y-1">
                <span className="text-slate-400 text-xs">Min State of Charge</span>
                <div className="flex gap-2">
                  {[5, 10, 15].map((v) => (
                    <button
                      key={v}
                      onClick={() => setMinSoCPct(v)}
                      className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                        minSoCPct === v
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              </div>

              <SliderControl
                label="Variable O&M"
                value={vom}
                min={0}
                max={10}
                step={0.5}
                onChange={setVom}
                unit=" $/MWh"
              />
            </div>

            {/* Duration ratio */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-xs space-y-2">
              <p className="text-slate-400 font-medium">System Summary</p>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="text-white">{(energyMWh / powerMW).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">One-way eff.</span>
                <span className="text-white">{(Math.sqrt(rtePct / 100) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Break-even LMP</span>
                <span className="text-white">
                  {fmt$(vom / (rtePct / 100), 2)}/MWh
                </span>
              </div>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-8">
            {loading ? (
              <div className="flex items-center justify-center h-72">
                <div className="text-slate-500 text-sm animate-pulse">Running dispatch…</div>
              </div>
            ) : (
              <>
                {/* ── Chart ①: Dispatch Stack ────────────────────────────── */}
                <section>
                  <h2 className="text-base font-semibold text-slate-300 mb-3">
                    5-Min Dispatch Stack
                  </h2>
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={chartData}
                          margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="time"
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            interval={11}
                            tickLine={false}
                          />
                          <YAxis
                            yAxisId="mw"
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            label={{
                              value: "MW",
                              angle: -90,
                              position: "insideLeft",
                              fill: "#64748b",
                              fontSize: 10,
                            }}
                          />
                          <YAxis
                            yAxisId="soc"
                            orientation="right"
                            domain={[0, 100]}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}%`}
                            label={{
                              value: "SoC",
                              angle: 90,
                              position: "insideRight",
                              fill: "#64748b",
                              fontSize: 10,
                              dx: 20,
                            }}
                          />
                          <YAxis
                            yAxisId="lmp"
                            orientation="right"
                            tick={false}
                            axisLine={false}
                            tickLine={false}
                            width={0}
                          />
                          <Tooltip content={<DispatchTooltip />} />

                          {/* Discharge side (positive) */}
                          <Area
                            yAxisId="mw"
                            dataKey="dischargeMW"
                            stackId="pos"
                            fill="#ef4444"
                            stroke="none"
                            fillOpacity={0.7}
                            name="Discharge"
                          />
                          <Area
                            yAxisId="mw"
                            dataKey="ecrsMW"
                            stackId="pos"
                            fill="#8b5cf6"
                            stroke="none"
                            fillOpacity={0.7}
                            name="ECRS"
                          />
                          <Area
                            yAxisId="mw"
                            dataKey="rrsMW"
                            stackId="pos"
                            fill="#3b82f6"
                            stroke="none"
                            fillOpacity={0.7}
                            name="RRS"
                          />
                          <Area
                            yAxisId="mw"
                            dataKey="regUpMW"
                            stackId="pos"
                            fill="#06b6d4"
                            stroke="none"
                            fillOpacity={0.7}
                            name="RegUp"
                          />
                          <Area
                            yAxisId="mw"
                            dataKey="nonSpinMW"
                            stackId="pos"
                            fill="#64748b"
                            stroke="none"
                            fillOpacity={0.7}
                            name="NonSpin"
                          />

                          {/* Charge side (negative) */}
                          <Area
                            yAxisId="mw"
                            dataKey="chargeMWNeg"
                            stackId="neg"
                            fill="#22c55e"
                            stroke="none"
                            fillOpacity={0.7}
                            name="Charge"
                          />
                          <Area
                            yAxisId="mw"
                            dataKey="regDownMWNeg"
                            stackId="neg"
                            fill="#14b8a6"
                            stroke="none"
                            fillOpacity={0.7}
                            name="RegDown"
                          />

                          {/* SOC line */}
                          <Line
                            yAxisId="soc"
                            dataKey="soc"
                            stroke="#fbbf24"
                            strokeWidth={1.5}
                            dot={false}
                            name="SoC %"
                          />

                          {/* LMP overlay */}
                          <Line
                            yAxisId="lmp"
                            dataKey="lmp"
                            stroke="#60a5fa"
                            strokeWidth={1}
                            strokeOpacity={0.4}
                            dot={false}
                            name="LMP"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {[
                        { color: "#ef4444", label: "Discharge" },
                        { color: "#8b5cf6", label: "ECRS" },
                        { color: "#3b82f6", label: "RRS" },
                        { color: "#06b6d4", label: "Reg Up" },
                        { color: "#64748b", label: "NonSpin" },
                        { color: "#22c55e", label: "Charge" },
                        { color: "#14b8a6", label: "Reg Down" },
                        { color: "#fbbf24", label: "SoC" },
                        { color: "#60a5fa", label: "LMP" },
                      ].map(({ color, label }) => (
                        <span key={label} className="flex items-center gap-1 text-slate-400">
                          <span
                            className="inline-block w-3 h-2 rounded-sm"
                            style={{ backgroundColor: color }}
                          />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                {/* ── Section ②: Revenue Cards ───────────────────────────── */}
                {result && (
                  <section>
                    <h2 className="text-base font-semibold text-slate-300 mb-3">
                      Daily Revenue Breakdown
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <RevenueCard label="Energy Revenue" value={result.energyRevenue} color="text-green-400" />
                      <RevenueCard label="ECRS Revenue" value={result.ecrsRevenue} color="text-purple-400" />
                      <RevenueCard label="RRS Revenue" value={result.rrsRevenue} color="text-blue-400" />
                      <RevenueCard
                        label="Reg Up + Reg Down + NonSpin"
                        value={result.regUpRevenue + result.regDownRevenue + result.nonSpinRevenue}
                        color="text-cyan-400"
                      />
                      <RevenueCard label="Charging Cost" value={-result.chargingCost} color="text-orange-400" />
                      <RevenueCard label="Net Revenue" value={result.netRevenue} color="text-amber-400" />
                    </div>
                  </section>
                )}

                {/* ── Chart ③: Waterfall ─────────────────────────────────── */}
                {result && (
                  <section>
                    <h2 className="text-base font-semibold text-slate-300 mb-3">
                      Revenue Waterfall
                    </h2>
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={waterfallData}
                            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                              dataKey="name"
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              formatter={(value: number | undefined) => [value !== undefined ? fmt$(value, 0) : "$0", ""]}
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "6px",
                                fontSize: "12px",
                              }}
                            />
                            {/* Invisible base bar for floating effect */}
                            <Bar dataKey="base" stackId="waterfall" fill="transparent" />
                            {/* Visible value bar */}
                            <Bar dataKey="value" stackId="waterfall" radius={[2, 2, 0, 0]}>
                              {waterfallData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── Section ④: Basis Risk Table ────────────────────────── */}
                <section>
                  <h2 className="text-base font-semibold text-slate-300 mb-3">
                    Hourly Basis Risk: {node} vs Hub
                  </h2>
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                          <th className="text-left px-4 py-2.5">Hour</th>
                          <th className="text-right px-4 py-2.5">Node LMP ($/MWh)</th>
                          <th className="text-right px-4 py-2.5">Hub LMP ($/MWh)</th>
                          <th className="text-right px-4 py-2.5">Basis ($/MWh)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {basisRows.map((row) => {
                          const positive = row.basis >= 0;
                          return (
                            <tr
                              key={row.hour}
                              className={`border-b border-slate-800 ${
                                positive
                                  ? "bg-green-950/20 hover:bg-green-950/40"
                                  : "bg-red-950/20 hover:bg-red-950/40"
                              } transition-colors`}
                            >
                              <td className="px-4 py-1.5 text-slate-300">
                                {String(row.hour).padStart(2, "0")}:00–{String(row.hour + 1).padStart(2, "0")}:00
                              </td>
                              <td className="px-4 py-1.5 text-right text-white">
                                {row.nodeLmp.toFixed(2)}
                              </td>
                              <td className="px-4 py-1.5 text-right text-slate-300">
                                {row.hubLmp.toFixed(2)}
                              </td>
                              <td
                                className={`px-4 py-1.5 text-right font-medium ${
                                  positive ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {positive ? "+" : ""}
                                {row.basis.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
