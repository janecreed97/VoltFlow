export type SettlementPoint =
  | "HB_NORTH"
  | "HB_SOUTH"
  | "HB_WEST"
  | "HB_HOUSTON";

export const SETTLEMENT_POINTS: SettlementPoint[] = [
  "HB_NORTH",
  "HB_SOUTH",
  "HB_WEST",
  "HB_HOUSTON",
];

export interface PriceData {
  prices: number[];   // 24 hourly DAM prices $/MWh
  node: SettlementPoint;
  date: string;
  isDemo: true;
}

// Representative high-volatility ERCOT summer day (HB_NORTH baseline)
const BASE_PRICES: number[] = [
  24.5,  // 00:00
  22.1,  // 01:00
  20.3,  // 02:00
  19.8,  // 03:00
  21.0,  // 04:00
  27.6,  // 05:00
  38.4,  // 06:00
  52.0,  // 07:00
  74.3,  // 08:00
  88.5,  // 09:00
  95.2,  // 10:00
  91.0,  // 11:00
  85.7,  // 12:00
  79.4,  // 13:00
  82.1,  // 14:00
  145.0, // 15:00
  280.5, // 16:00
  452.0, // 17:00
  310.0, // 18:00
  190.0, // 19:00
  112.0, // 20:00
  68.5,  // 21:00
  47.2,  // 22:00
  34.8,  // 23:00
];

// Per-node price multipliers relative to HB_NORTH
const NODE_MULTIPLIERS: Record<SettlementPoint, number> = {
  HB_NORTH: 1.00,
  HB_SOUTH: 1.04,
  HB_HOUSTON: 1.08,
  HB_WEST: 0.93,
};

// Simulate 350ms network latency (production path would call ERCOT API here)
function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 350));
}

export async function fetchErcotPrices(
  node: SettlementPoint,
  date: string   // YYYY-MM-DD, used to seed light date-based variation
): Promise<PriceData> {
  // Production: GET https://api.ercot.com/api/public-reports/...
  // For now, return mock data with realistic price shape

  await simulateLatency();

  const multiplier = NODE_MULTIPLIERS[node];

  // Add mild date-based variation so different dates look slightly different
  const dateHash = date
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const jitter = ((dateHash % 20) - 10) / 100; // −10% to +10%

  const prices = BASE_PRICES.map((p) =>
    parseFloat((p * multiplier * (1 + jitter)).toFixed(2))
  );

  return {
    prices,
    node,
    date,
    isDemo: true,
  };
}
