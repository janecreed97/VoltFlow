export interface BessConfig {
  powerMW: number;
  durationHours: number;
  rte: number;        // 0–1
  cyclesPerDay: number;
  vom: number;        // $/MWh of discharge
}

export interface HourlyDispatch {
  hour: number;
  label: string;      // "00:00"
  price: number;
  action: "charge" | "discharge" | "idle";
  soc: number;        // 0–100%
}

export interface RevenueResult {
  hourlyDispatch: HourlyDispatch[];
  grossRevenue: number;
  chargingCost: number;
  efficiencyLoss: number;
  vomCost: number;
  netPnL: number;
  dailyCapturedSpread: number;
  avgChargePrice: number;
  avgDischargePrice: number;
  cyclesExecuted: number;
}

function mean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function calculateBessRevenue(
  prices: number[],
  config: BessConfig
): RevenueResult {
  const { powerMW, durationHours, rte, cyclesPerDay, vom } = config;

  const hoursPerCycle = Math.max(1, Math.round(durationHours));
  const numCycles = Math.max(1, Math.round(cyclesPerDay));
  const energyCap = powerMW * durationHours;

  // action map: hour → charge | discharge | idle
  const actions = new Array<"charge" | "discharge" | "idle">(24).fill("idle");
  const usedHours = new Set<number>();

  let totalGrossRevenue = 0;
  let totalChargingCost = 0;
  let totalVomCost = 0;

  const allChargePrices: number[] = [];
  const allDischargePrices: number[] = [];
  let cyclesExecuted = 0;

  for (let c = 0; c < numCycles; c++) {
    const available = Array.from({ length: 24 }, (_, i) => i).filter(
      (h) => !usedHours.has(h)
    );

    if (available.length < hoursPerCycle * 2) break;

    // Cheapest N hours for charging
    const sortedAsc = [...available].sort((a, b) => prices[a] - prices[b]);
    const chargeHours = sortedAsc.slice(0, hoursPerCycle);
    const chargeSet = new Set(chargeHours);

    // Most expensive N hours (excluding charge hours) for discharging
    const remainingAvailable = available.filter((h) => !chargeSet.has(h));
    const sortedDesc = [...remainingAvailable].sort(
      (a, b) => prices[b] - prices[a]
    );
    const dischargeHours = sortedDesc.slice(0, hoursPerCycle);

    if (dischargeHours.length < hoursPerCycle) break;

    const avgChargeP = mean(chargeHours.map((h) => prices[h]));
    const avgDischargeP = mean(dischargeHours.map((h) => prices[h]));

    const grossRev = powerMW * avgDischargeP * hoursPerCycle;
    const chargeCost = (powerMW / rte) * avgChargeP * hoursPerCycle;
    const vomCost = powerMW * hoursPerCycle * vom;
    const netProfit = grossRev - chargeCost - vomCost;

    // Commercial guardrail — skip unprofitable cycle
    if (netProfit <= 0) continue;

    for (const h of chargeHours) {
      actions[h] = "charge";
      usedHours.add(h);
      allChargePrices.push(prices[h]);
    }
    for (const h of dischargeHours) {
      actions[h] = "discharge";
      usedHours.add(h);
      allDischargePrices.push(prices[h]);
    }

    totalGrossRevenue += grossRev;
    totalChargingCost += chargeCost;
    totalVomCost += vomCost;
    cyclesExecuted++;
  }

  // Build hourly dispatch with SOC tracking
  let soc = 0;
  const socStep = energyCap > 0 ? (powerMW / energyCap) * 100 : 100;

  const hourlyDispatch: HourlyDispatch[] = Array.from(
    { length: 24 },
    (_, h) => {
      const action = actions[h];
      if (action === "charge") {
        soc = Math.min(100, soc + socStep);
      } else if (action === "discharge") {
        soc = Math.max(0, soc - socStep);
      }
      return {
        hour: h,
        label: `${String(h).padStart(2, "0")}:00`,
        price: prices[h],
        action,
        soc,
      };
    }
  );

  const avgChargePrice = mean(allChargePrices);
  const avgDischargePrice = mean(allDischargePrices);
  const efficiencyLoss = totalChargingCost * (1 - rte);
  const netPnL = totalGrossRevenue - totalChargingCost - totalVomCost;

  return {
    hourlyDispatch,
    grossRevenue: totalGrossRevenue,
    chargingCost: totalChargingCost,
    efficiencyLoss,
    vomCost: totalVomCost,
    netPnL,
    dailyCapturedSpread: avgDischargePrice - avgChargePrice,
    avgChargePrice,
    avgDischargePrice,
    cyclesExecuted,
  };
}
