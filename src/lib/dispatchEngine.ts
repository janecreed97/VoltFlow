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

  // Each cycle must start after the previous cycle's last discharge hour.
  // This enforces charge→discharge→charge→discharge across all cycles.
  let cycleStartHour = 0;

  for (let c = 0; c < numCycles; c++) {
    // Only consider hours from cycleStartHour onward
    const available = Array.from({ length: 24 }, (_, i) => i).filter(
      (h) => h >= cycleStartHour && !usedHours.has(h)
    );

    if (available.length < hoursPerCycle * 2) break;

    // Try every split point T within the available window.
    // Charge candidates: available hours < T
    // Discharge candidates: available hours >= T
    let bestProfit = -Infinity;
    let bestChargeHours: number[] = [];
    let bestDischargeHours: number[] = [];
    let bestGrossRev = 0;
    let bestChargeCost = 0;
    let bestVomCost = 0;

    for (let T = cycleStartHour + hoursPerCycle; T <= 24 - hoursPerCycle; T++) {
      const leftAvail = available.filter((h) => h < T);
      const rightAvail = available.filter((h) => h >= T);

      if (leftAvail.length < hoursPerCycle || rightAvail.length < hoursPerCycle) continue;

      const chargeHours = [...leftAvail]
        .sort((a, b) => prices[a] - prices[b])
        .slice(0, hoursPerCycle);
      const dischargeHours = [...rightAvail]
        .sort((a, b) => prices[b] - prices[a])
        .slice(0, hoursPerCycle);

      const avgChargeP = mean(chargeHours.map((h) => prices[h]));
      const avgDischargeP = mean(dischargeHours.map((h) => prices[h]));

      const grossRev = powerMW * avgDischargeP * hoursPerCycle;
      const chargeCost = (powerMW / rte) * avgChargeP * hoursPerCycle;
      const vomCost = powerMW * hoursPerCycle * vom;
      const profit = grossRev - chargeCost - vomCost;

      if (profit > bestProfit) {
        bestProfit = profit;
        bestChargeHours = chargeHours;
        bestDischargeHours = dischargeHours;
        bestGrossRev = grossRev;
        bestChargeCost = chargeCost;
        bestVomCost = vomCost;
      }
    }

    // No profitable split found — no point trying further cycles
    if (bestProfit <= 0) break;

    for (const h of bestChargeHours) {
      actions[h] = "charge";
      usedHours.add(h);
      allChargePrices.push(prices[h]);
    }
    for (const h of bestDischargeHours) {
      actions[h] = "discharge";
      usedHours.add(h);
      allDischargePrices.push(prices[h]);
    }

    totalGrossRevenue += bestGrossRev;
    totalChargingCost += bestChargeCost;
    totalVomCost += bestVomCost;
    cyclesExecuted++;

    // Next cycle must begin after this cycle's last discharge hour
    cycleStartHour = Math.max(...bestDischargeHours) + 1;
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
