// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatteryConfig {
  powerCapacityMW: number;    // max MW in or out
  energyCapacityMWh: number;  // total usable storage
  rte: number;                // 0–1; oneWayEff = √rte applied each direction
  minSoC: number;             // fraction, e.g. 0.05
  variableOM: number;         // $/MWh of throughput
}

export interface RTInterval {
  interval: number;           // 0–287
  time: string;               // "00:00" … "23:55"
  hour: number;               // 0–23
  lmp: number;                // $/MWh real-time nodal price
  regUpMCPC: number;          // $/MW-h capacity price
  regDownMCPC: number;
  rrsMCPC: number;
  ecrsMCPC: number;
  nonSpinMCPC: number;
}

export interface DispatchInterval extends RTInterval {
  dischargeMW: number;
  chargeMW: number;
  regUpMW: number;
  regDownMW: number;
  rrsMW: number;
  ecrsMW: number;
  nonSpinMW: number;
  soc: number;          // 0–100%
  socReserved: number;  // % held for outstanding AS obligations
  energyRevenue: number;
  asRevenue: number;
}

export interface ComprehensiveResult {
  dispatch: DispatchInterval[];
  energyRevenue: number;
  regUpRevenue: number;
  regDownRevenue: number;
  rrsRevenue: number;
  ecrsRevenue: number;
  nonSpinRevenue: number;
  grossRevenue: number;
  chargingCost: number;
  vomCost: number;
  netRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function calculateComprehensiveRevenue(
  intervals: RTInterval[],
  config: BatteryConfig
): ComprehensiveResult {
  const { powerCapacityMW, energyCapacityMWh, rte, minSoC, variableOM } = config;
  const Δt = 1 / 12; // each 5-min interval = 1/12 hour
  const oneWayEff = Math.sqrt(rte);

  // Hold durations (in intervals)
  const ECRS_HOLD = 24; // 2 hours at 5-min resolution
  const RRS_HOLD = 12;  // 1 hour at 5-min resolution

  // All LMPs for the day (for threshold computation)
  const allLmps = intervals.map((d) => d.lmp);
  const chargeThreshold = percentile(allLmps, 25);

  // ─── Pass 1: Hourly AS pre-commitment ─────────────────────────────────────

  // Per-interval AS awards (MW per product)
  const asEcrsMW = new Array<number>(288).fill(0);
  const asRrsMW = new Array<number>(288).fill(0);
  const asRegUpMW = new Array<number>(288).fill(0);
  const asRegDownMW = new Array<number>(288).fill(0);
  const asNonSpinMW = new Array<number>(288).fill(0);

  // SoC reservation array (fraction of energyCapacityMWh that must remain above minSoC)
  const socReservedPct = new Array<number>(288).fill(0);

  // Track running SoC reservation commitment (in MWh)
  // For each interval, how many MWh must be held above minSoC
  const socReservedMWh = new Array<number>(288).fill(0);

  for (let h = 0; h < 24; h++) {
    const startI = h * 12;
    const hourIntervals = intervals.slice(startI, startI + 12);
    const lmpMedian = median(hourIntervals.map((x) => x.lmp));
    const ecrsMCPC = hourIntervals[0]?.ecrsMCPC ?? 0;
    const rrsMCPC = hourIntervals[0]?.rrsMCPC ?? 0;
    const regUpMCPC = hourIntervals[0]?.regUpMCPC ?? 0;
    const regDownMCPC = hourIntervals[0]?.regDownMCPC ?? 0;
    const nonSpinMCPC = hourIntervals[0]?.nonSpinMCPC ?? 0;

    // Energy break-even (after efficiency losses)
    const breakEven = variableOM / (oneWayEff * oneWayEff);

    // ECRS: requires holding 2h of energy; award if MCPC beats opportunity cost
    // and we can reserve headroom in subsequent ECRS_HOLD intervals
    const ecrsMW = powerCapacityMW * 0.15; // commit 15% of capacity
    const ecrsEnergyNeeded = ecrsMW * (ECRS_HOLD / 12); // MWh needed in reserve

    // Check if holding is economic: MCPC vs what we'd earn from energy
    const ecrsEconomic = ecrsMCPC > lmpMedian * oneWayEff * oneWayEff * 0.5;

    if (ecrsEconomic) {
      // Check if SoC headroom exists across the hold window
      let canHold = true;
      for (let k = startI; k < Math.min(startI + ECRS_HOLD, 288); k++) {
        const alreadyReserved = socReservedMWh[k];
        const maxReservable = (1 - minSoC) * energyCapacityMWh - alreadyReserved;
        if (ecrsEnergyNeeded > maxReservable) {
          canHold = false;
          break;
        }
      }
      if (canHold) {
        for (let k = startI; k < Math.min(startI + ECRS_HOLD, 288); k++) {
          asEcrsMW[k] = ecrsMW;
          socReservedMWh[k] += ecrsEnergyNeeded;
        }
      }
    }

    // RRS: requires holding 1h of energy
    const rrsMW = powerCapacityMW * 0.10;
    const rrsEnergyNeeded = rrsMW * (RRS_HOLD / 12);
    const rrsEconomic = rrsMCPC > lmpMedian * oneWayEff * oneWayEff * 0.4;

    if (rrsEconomic) {
      let canHold = true;
      for (let k = startI; k < Math.min(startI + RRS_HOLD, 288); k++) {
        const alreadyReserved = socReservedMWh[k];
        const maxReservable = (1 - minSoC) * energyCapacityMWh - alreadyReserved;
        if (rrsEnergyNeeded > maxReservable) {
          canHold = false;
          break;
        }
      }
      if (canHold) {
        for (let k = startI; k < Math.min(startI + RRS_HOLD, 288); k++) {
          asRrsMW[k] = rrsMW;
          socReservedMWh[k] += rrsEnergyNeeded;
        }
      }
    }

    // RegUp: no energy hold; award freely when economic
    if (regUpMCPC > variableOM) {
      const regUpMW = powerCapacityMW * 0.10;
      for (let k = startI; k < startI + 12; k++) {
        asRegUpMW[k] = regUpMW;
      }
    }

    // NonSpin: no energy hold; award freely when economic
    if (nonSpinMCPC > variableOM * 0.5) {
      const nonSpinMW = powerCapacityMW * 0.08;
      for (let k = startI; k < startI + 12; k++) {
        asNonSpinMW[k] = nonSpinMW;
      }
    }

    // RegDown: award when LMP is low (battery charging anyway)
    if (lmpMedian < chargeThreshold) {
      const regDownMW = powerCapacityMW * 0.08;
      for (let k = startI; k < startI + 12; k++) {
        asRegDownMW[k] = regDownMW;
      }
    }

    // Build socReservedPct for display
    for (let k = startI; k < startI + 12; k++) {
      socReservedPct[k] = (socReservedMWh[k] / energyCapacityMWh) * 100;
    }
  }

  // Rebuild socReservedPct after all AS commitments are finalized
  for (let i = 0; i < 288; i++) {
    socReservedPct[i] = (socReservedMWh[i] / energyCapacityMWh) * 100;
  }

  // ─── Pass 2: Per-interval energy dispatch ─────────────────────────────────

  let soc = 50; // start at 50%
  const dispatch: DispatchInterval[] = [];

  let totalEnergyRevenue = 0;
  let totalRegUpRevenue = 0;
  let totalRegDownRevenue = 0;
  let totalRrsRevenue = 0;
  let totalEcrsRevenue = 0;
  let totalNonSpinRevenue = 0;
  let totalChargingCost = 0;
  let totalVomCost = 0;

  for (let i = 0; i < 288; i++) {
    const iv = intervals[i];
    const { lmp } = iv;
    const reserved = socReservedPct[i]; // % of capacity that must stay above minSoC

    // AS MW committed this interval
    const ecrsMW = asEcrsMW[i];
    const rrsMW = asRrsMW[i];
    const regUpMW = asRegUpMW[i];
    const regDownMW = asRegDownMW[i];
    const nonSpinMW = asNonSpinMW[i];

    // Discharged MW to satisfy any as obligations that activate
    // (for revenue calc, we assume ECRS/RRS/RegUp don't actually discharge unless activated;
    // we only book capacity revenue here)
    const asDischargedMW = 0;

    // Available MW for energy dispatch
    // Discharge: available SoC above (minSoC + reserved), limited by power capacity
    const socAboveMin = soc / 100 - minSoC - reserved / 100;
    const availDischargeMWh = clamp(socAboveMin * energyCapacityMWh, 0, Infinity);
    const availDischargeMW = clamp(
      availDischargeMWh * oneWayEff * (1 / Δt),
      0,
      powerCapacityMW - asDischargedMW
    );

    // Charge: available headroom below 100%, limited by power capacity
    const socHeadroom = 1 - soc / 100;
    const availChargeMWh = clamp(socHeadroom * energyCapacityMWh, 0, Infinity);
    const availChargeMW = clamp(
      availChargeMWh / oneWayEff * (1 / Δt),
      0,
      powerCapacityMW
    );

    let dischargeMW = 0;
    let chargeMW = 0;

    const breakEven = variableOM / (oneWayEff * oneWayEff);

    if (lmp > breakEven && availDischargeMW > 0) {
      // Discharge when LMP beats break-even
      dischargeMW = availDischargeMW;
    } else if (lmp < chargeThreshold && availChargeMW > 0) {
      // Charge when LMP is in the cheap 25th percentile
      chargeMW = availChargeMW;
    }

    // SoC update (separate efficiency per direction)
    soc += (chargeMW * oneWayEff * Δt / energyCapacityMWh) * 100;
    soc -= (dischargeMW / oneWayEff * Δt / energyCapacityMWh) * 100;
    soc = clamp(soc, minSoC * 100, 100);

    // Revenue
    const energyRevenue = (dischargeMW - chargeMW) * lmp * Δt;
    const asRevenue =
      (regUpMW * iv.regUpMCPC +
        regDownMW * iv.regDownMCPC +
        rrsMW * iv.rrsMCPC +
        ecrsMW * iv.ecrsMCPC +
        nonSpinMW * iv.nonSpinMCPC) *
      Δt;
    const vomCost = (dischargeMW + chargeMW) * variableOM * Δt;

    // Allocate AS revenue to products (for breakdown)
    const regUpRev = regUpMW * iv.regUpMCPC * Δt;
    const regDownRev = regDownMW * iv.regDownMCPC * Δt;
    const rrsRev = rrsMW * iv.rrsMCPC * Δt;
    const ecrsRev = ecrsMW * iv.ecrsMCPC * Δt;
    const nonSpinRev = nonSpinMW * iv.nonSpinMCPC * Δt;
    const chargingCost = chargeMW * lmp * Δt; // already included in energyRevenue as negative

    totalEnergyRevenue += energyRevenue;
    totalRegUpRevenue += regUpRev;
    totalRegDownRevenue += regDownRev;
    totalRrsRevenue += rrsRev;
    totalEcrsRevenue += ecrsRev;
    totalNonSpinRevenue += nonSpinRev;
    totalChargingCost += chargingCost;
    totalVomCost += vomCost;

    dispatch.push({
      ...iv,
      dischargeMW,
      chargeMW,
      regUpMW,
      regDownMW,
      rrsMW,
      ecrsMW,
      nonSpinMW,
      soc,
      socReserved: reserved,
      energyRevenue,
      asRevenue,
    });
  }

  const grossRevenue =
    totalEnergyRevenue +
    totalRegUpRevenue +
    totalRegDownRevenue +
    totalRrsRevenue +
    totalEcrsRevenue +
    totalNonSpinRevenue;

  const netRevenue = grossRevenue - totalChargingCost - totalVomCost;

  return {
    dispatch,
    energyRevenue: totalEnergyRevenue,
    regUpRevenue: totalRegUpRevenue,
    regDownRevenue: totalRegDownRevenue,
    rrsRevenue: totalRrsRevenue,
    ecrsRevenue: totalEcrsRevenue,
    nonSpinRevenue: totalNonSpinRevenue,
    grossRevenue,
    chargingCost: totalChargingCost,
    vomCost: totalVomCost,
    netRevenue,
  };
}
