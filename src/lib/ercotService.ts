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
  isDemo: boolean;    // true = mock data, false = live ERCOT API
}

/**
 * Fetch ERCOT Day-Ahead Market Settlement Point Prices.
 *
 * Calls the /api/ercot-prices route handler, which proxies the ERCOT Public
 * API server-side (avoids CORS and keeps credentials off the client).
 * Falls back to representative mock data when ERCOT credentials are not
 * configured — see .env.local.example for required environment variables.
 */
export async function fetchErcotPrices(
  node: SettlementPoint,
  date: string
): Promise<PriceData> {
  const res = await fetch(
    `/api/ercot-prices?node=${encodeURIComponent(node)}&date=${encodeURIComponent(date)}`
  );
  const json = await res.json() as { prices: number[]; isDemo: boolean };
  return { prices: json.prices, node, date, isDemo: json.isDemo };
}
