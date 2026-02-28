import type { RTInterval } from "./comprehensiveEngine";

export interface RTData {
  intervals: RTInterval[];  // 288 elements
  node: string;
  date: string;
  isDemo: boolean;
}

// ─── Node multipliers (same as existing DAM service) ──────────────────────────

const NODE_MULTIPLIERS: Record<string, number> = {
  HB_NORTH: 1.0,
  HB_SOUTH: 1.04,
  HB_HOUSTON: 1.08,
  HB_WEST: 0.93,
};

// ─── Mock data generation ─────────────────────────────────────────────────────
// Realistic ERCOT summer shape: overnight valley, midday plateau, sharp evening peak

function smoothLmp(interval: number, nodeMultiplier: number, jitter: number): number {
  const hour = interval / 12;

  let base: number;
  if (hour < 5) {
    // Overnight: $15–$30 with slight dip around 03:00
    base = 20 - 5 * Math.sin((hour / 5) * Math.PI);
  } else if (hour < 8) {
    // Morning ramp: $25→$55
    base = 25 + (hour - 5) * 10;
  } else if (hour < 14) {
    // Midday plateau: $55–$90, heat-driven
    base = 65 + 15 * Math.sin(((hour - 8) / 6) * Math.PI);
  } else if (hour < 16) {
    // Brief afternoon dip: $55–$70
    base = 70 - 8 * ((hour - 14) / 2);
  } else if (hour < 20) {
    // Evening peak: $80→$180 then back down
    const peakHour = hour - 16;
    base = 80 + 100 * Math.sin((peakHour / 4) * Math.PI);
  } else if (hour < 22) {
    // Evening descent: $70→$40
    base = 70 - 15 * (hour - 20);
  } else {
    // Late night: $30–$40
    base = 38 - 4 * ((hour - 22) / 2);
  }

  // Occasional price spikes (~3% of intervals, random-looking via fractional hash)
  const raw = Math.sin(interval * 127.1 + jitter * 100) * 43758.5453;
  const spikeSeed = raw - Math.floor(raw); // uniform [0, 1)
  if (spikeSeed > 0.97) {
    base += 200 + spikeSeed * 250;
  }

  // 5-minute granularity noise (±8%)
  const noise = 1 + (Math.sin(interval * 1.3 + jitter * 5) * 0.08);

  return Math.max(5, parseFloat((base * nodeMultiplier * noise * (1 + jitter)).toFixed(2)));
}

function hourlyASPrices(hour: number, jitter: number): {
  regUpMCPC: number;
  regDownMCPC: number;
  rrsMCPC: number;
  ecrsMCPC: number;
  nonSpinMCPC: number;
} {
  // Cleared hourly; prices track load curve loosely
  const loadFactor = hour >= 15 && hour <= 20 ? 1.4 : hour >= 7 && hour <= 14 ? 1.1 : 0.8;
  const seed = Math.sin(hour * 1.7 + jitter * 3) * 0.5 + 0.5;

  return {
    regUpMCPC: parseFloat(((6 + seed * 22) * loadFactor * (1 + jitter)).toFixed(2)),
    regDownMCPC: parseFloat(((3 + seed * 9) * (1 + jitter * 0.5)).toFixed(2)),
    rrsMCPC: parseFloat(((8 + seed * 14) * loadFactor * (1 + jitter)).toFixed(2)),
    ecrsMCPC: parseFloat(((18 + seed * 27) * loadFactor * (1 + jitter)).toFixed(2)),
    nonSpinMCPC: parseFloat(((2 + seed * 6) * (1 + jitter * 0.3)).toFixed(2)),
  };
}

function generateMockIntervals(node: string, date: string): RTInterval[] {
  const mult = NODE_MULTIPLIERS[node] ?? 1.0;
  const dateHash = date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((dateHash % 20) - 10) / 100;

  const intervals: RTInterval[] = [];
  for (let i = 0; i < 288; i++) {
    const hour = Math.floor(i / 12);
    const minute = (i % 12) * 5;
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const as = hourlyASPrices(hour, jitter);

    intervals.push({
      interval: i,
      time,
      hour,
      lmp: smoothLmp(i, mult, jitter),
      ...as,
    });
  }
  return intervals;
}

// ─── Main fetch function ───────────────────────────────────────────────────────

export async function fetchERCOTRTData(node: string, date: string): Promise<RTData> {
  try {
    const res = await fetch(`/api/ercot-rt-prices?node=${encodeURIComponent(node)}&date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json() as { intervals: RTInterval[]; isDemo: boolean };
    if (!json.intervals || json.intervals.length < 288) throw new Error("Insufficient data");
    return { intervals: json.intervals, node, date, isDemo: json.isDemo };
  } catch {
    return {
      intervals: generateMockIntervals(node, date),
      node,
      date,
      isDemo: true,
    };
  }
}
