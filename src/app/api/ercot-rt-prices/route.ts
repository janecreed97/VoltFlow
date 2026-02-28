import { NextRequest, NextResponse } from "next/server";
import type { RTInterval } from "@/lib/comprehensiveEngine";

// ─── ERCOT Azure B2C auth ─────────────────────────────────────────────────────
const TOKEN_URL =
  "https://ercotb2c.b2clogin.com/ercotb2c.onmicrosoft.com/B2C_1_PUBAPI-ROPC-FLOW/oauth2/v2.0/token";
const CLIENT_ID = "fec253ea-0d06-4272-a5e6-b478baeecd70";
const SCOPE = `openid ${CLIENT_ID} offline_access`;

// ─── ERCOT Public API ─────────────────────────────────────────────────────────
// Real-Time Settlement Point Prices (5-min LMP):
//   GET https://api.ercot.com/api/public-reports/np6-970-cd/rtd_spp
//   params: deliveryDateFrom, deliveryDateTo, settlementPoint
//
// Day-Ahead AS Market Clearing Prices (hourly, per product):
//   GET https://api.ercot.com/api/public-reports/np3-911-er/dam_mcpc
//   params: deliveryDateFrom, deliveryDateTo
const API_BASE = "https://api.ercot.com/api/public-reports";

// ─── Node multipliers ─────────────────────────────────────────────────────────
const NODE_MULTIPLIERS: Record<string, number> = {
  HB_NORTH: 1.0,
  HB_SOUTH: 1.04,
  HB_HOUSTON: 1.08,
  HB_WEST: 0.93,
};

// ─── Mock data (fallback) ─────────────────────────────────────────────────────

function smoothLmp(interval: number, mult: number, jitter: number): number {
  const hour = interval / 12;
  let base: number;
  if (hour < 5) {
    base = 20 - 5 * Math.sin((hour / 5) * Math.PI);
  } else if (hour < 8) {
    base = 25 + (hour - 5) * 10;
  } else if (hour < 14) {
    base = 65 + 15 * Math.sin(((hour - 8) / 6) * Math.PI);
  } else if (hour < 16) {
    base = 70 - 8 * ((hour - 14) / 2);
  } else if (hour < 20) {
    const peakHour = hour - 16;
    base = 80 + 100 * Math.sin((peakHour / 4) * Math.PI);
  } else if (hour < 22) {
    base = 70 - 15 * (hour - 20);
  } else {
    base = 38 - 4 * ((hour - 22) / 2);
  }
  const raw = Math.sin(interval * 127.1 + jitter * 100) * 43758.5453;
  const spikeSeed = raw - Math.floor(raw); // uniform [0, 1)
  if (spikeSeed > 0.97) base += 200 + spikeSeed * 250;
  const noise = 1 + Math.sin(interval * 1.3 + jitter * 5) * 0.08;
  return Math.max(5, parseFloat((base * mult * noise * (1 + jitter)).toFixed(2)));
}

function hourlyAS(hour: number, jitter: number) {
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

function getMockIntervals(node: string, date: string): RTInterval[] {
  const mult = NODE_MULTIPLIERS[node] ?? 1.0;
  const dateHash = date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((dateHash % 20) - 10) / 100;
  const intervals: RTInterval[] = [];
  for (let i = 0; i < 288; i++) {
    const hour = Math.floor(i / 12);
    const minute = (i % 12) * 5;
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    intervals.push({
      interval: i,
      time,
      hour,
      lmp: smoothLmp(i, mult, jitter),
      ...hourlyAS(hour, jitter),
    });
  }
  return intervals;
}

// ─── Token cache ──────────────────────────────────────────────────────────────
let tokenCache: { idToken: string; expiresAt: number } | null = null;

async function getIdToken(username: string, password: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.idToken;
  }
  const body = new URLSearchParams({
    username,
    password,
    grant_type: "password",
    scope: SCOPE,
    client_id: CLIENT_ID,
    response_type: "id_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const json = await res.json() as { id_token: string };
  tokenCache = {
    idToken: json.id_token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };
  return tokenCache.idToken;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const node = searchParams.get("node") ?? "HB_NORTH";
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const username = process.env.ERCOT_USERNAME;
  const password = process.env.ERCOT_PASSWORD;
  const subKey = process.env.ERCOT_SUBSCRIPTION_KEY;

  if (!username || !password || !subKey) {
    return NextResponse.json({ intervals: getMockIntervals(node, date), isDemo: true, debugReason: "missing_env_vars" });
  }

  try {
    const idToken = await getIdToken(username, password);

    // Fetch 5-min RT LMP
    const lmpUrl = new URL(`${API_BASE}/np6-970-cd/rtd_spp`);
    lmpUrl.searchParams.set("deliveryDateFrom", date);
    lmpUrl.searchParams.set("deliveryDateTo", date);
    lmpUrl.searchParams.set("settlementPoint", node);
    lmpUrl.searchParams.set("size", "300");

    const headers = {
      "Ocp-Apim-Subscription-Key": subKey,
      Authorization: `Bearer ${idToken}`,
    };

    // Fetch DAM MCPC for AS prices (hourly, all products)
    const asUrl = new URL(`${API_BASE}/np3-911-er/dam_mcpc`);
    asUrl.searchParams.set("deliveryDateFrom", date);
    asUrl.searchParams.set("deliveryDateTo", date);
    asUrl.searchParams.set("size", "30");

    const [lmpRes, asRes] = await Promise.all([
      fetch(lmpUrl.toString(), { headers, next: { revalidate: 300 } }),
      fetch(asUrl.toString(), { headers, next: { revalidate: 300 } }),
    ]);

    if (!lmpRes.ok) {
      return NextResponse.json({ intervals: getMockIntervals(node, date), isDemo: true });
    }

    const lmpJson = await lmpRes.json() as {
      fields?: { name: string }[];
      data?: unknown[];
    };

    const lmpRows = lmpJson.data ?? [];
    if (lmpRows.length < 288) {
      return NextResponse.json({ intervals: getMockIntervals(node, date), isDemo: true });
    }

    // Parse LMP rows into 288-element array
    const lmpByInterval = new Array<number>(288).fill(0);
    const lmpFields = (lmpJson.fields ?? []).map((f) => f.name);
    const lmpPriceIdx = lmpFields.indexOf("settlementPointPrice") !== -1
      ? lmpFields.indexOf("settlementPointPrice") : 2;
    const lmpIntervalIdx = lmpFields.indexOf("deliveryInterval") !== -1
      ? lmpFields.indexOf("deliveryInterval") : 1;

    for (const row of lmpRows) {
      let intervalNum: number;
      let price: number;
      if (Array.isArray(row)) {
        intervalNum = Number(row[lmpIntervalIdx]) - 1;
        price = Number(row[lmpPriceIdx]);
      } else {
        const obj = row as Record<string, unknown>;
        intervalNum = Number(obj.deliveryInterval) - 1;
        price = Number(obj.settlementPointPrice);
      }
      if (intervalNum >= 0 && intervalNum < 288) lmpByInterval[intervalNum] = price;
    }

    // Parse AS prices (hourly)
    const asByHour: Record<number, {
      regUpMCPC: number; regDownMCPC: number;
      rrsMCPC: number; ecrsMCPC: number; nonSpinMCPC: number;
    }> = {};

    if (asRes.ok) {
      const asJson = await asRes.json() as { fields?: { name: string }[]; data?: unknown[] };
      const asRows = asJson.data ?? [];
      const asFields = (asJson.fields ?? []).map((f) => f.name);

      const getIdx = (name: string, fallback: number) => {
        const i = asFields.indexOf(name);
        return i !== -1 ? i : fallback;
      };

      const hourIdx = getIdx("hourEnding", 1);
      const regUpIdx = getIdx("regUp", 3);
      const regDownIdx = getIdx("regDown", 4);
      const rrsIdx = getIdx("rrs", 5);
      const ecrsIdx = getIdx("ecrs", 6);
      const nonSpinIdx = getIdx("nonSpin", 7);

      for (const row of asRows) {
        let h: number;
        let regUp: number, regDown: number, rrs: number, ecrs: number, nonSpin: number;
        if (Array.isArray(row)) {
          h = parseInt(String(row[hourIdx]), 10) - 1;
          regUp = Number(row[regUpIdx]);
          regDown = Number(row[regDownIdx]);
          rrs = Number(row[rrsIdx]);
          ecrs = Number(row[ecrsIdx]);
          nonSpin = Number(row[nonSpinIdx]);
        } else {
          const obj = row as Record<string, unknown>;
          h = parseInt(String(obj.hourEnding), 10) - 1;
          regUp = Number(obj.regUp);
          regDown = Number(obj.regDown);
          rrs = Number(obj.rrs);
          ecrs = Number(obj.ecrs);
          nonSpin = Number(obj.nonSpin);
        }
        if (h >= 0 && h < 24) {
          asByHour[h] = {
            regUpMCPC: regUp, regDownMCPC: regDown,
            rrsMCPC: rrs, ecrsMCPC: ecrs, nonSpinMCPC: nonSpin,
          };
        }
      }
    }

    // Assemble 288 RTInterval objects
    const mult = NODE_MULTIPLIERS[node] ?? 1.0;
    const dateHash = date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const jitter = ((dateHash % 20) - 10) / 100;

    const intervals: RTInterval[] = [];
    for (let i = 0; i < 288; i++) {
      const hour = Math.floor(i / 12);
      const minute = (i % 12) * 5;
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const as = asByHour[hour] ?? hourlyAS(hour, jitter);
      const lmp = lmpByInterval[i] > 0 ? lmpByInterval[i] : smoothLmp(i, mult, jitter);
      intervals.push({ interval: i, time, hour, lmp, ...as });
    }

    return NextResponse.json({ intervals, isDemo: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ intervals: getMockIntervals(node, date), isDemo: true, debugReason: msg });
  }
}
