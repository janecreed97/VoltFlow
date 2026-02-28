import { NextRequest, NextResponse } from "next/server";

// ─── ERCOT Azure B2C auth ─────────────────────────────────────────────────────
const TOKEN_URL =
  "https://ercotb2c.b2clogin.com/ercotb2c.onmicrosoft.com/B2C_1_PUBAPI-ROPC-FLOW/oauth2/v2.0/token";
const CLIENT_ID = "fec253ea-0d06-4272-a5e6-b478baeecd70";
const SCOPE = `openid ${CLIENT_ID} offline_access`;

// ─── ERCOT Public API ─────────────────────────────────────────────────────────
// Production: https://developer.ercot.com/applications/pubapi/user-guide/using-api/
const API_BASE = "https://api.ercot.com/api/public-reports";

// ─── Mock data (fallback when credentials not configured) ─────────────────────
// Representative high-volatility ERCOT summer day, HB_NORTH baseline
const BASE_PRICES = [
  24.5, 22.1, 20.3, 19.8, 21.0, 27.6,   // 00–05
  38.4, 52.0, 74.3, 88.5, 95.2, 91.0,   // 06–11
  85.7, 79.4, 82.1, 145.0, 280.5, 452.0, // 12–17
  310.0, 190.0, 112.0, 68.5, 47.2, 34.8, // 18–23
];

const NODE_MULTIPLIERS: Record<string, number> = {
  HB_NORTH: 1.0,
  HB_SOUTH: 1.04,
  HB_HOUSTON: 1.08,
  HB_WEST: 0.93,
};

function getMockPrices(node: string, date: string): number[] {
  const mult = NODE_MULTIPLIERS[node] ?? 1;
  const dateHash = date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((dateHash % 20) - 10) / 100;
  return BASE_PRICES.map((p) =>
    parseFloat((p * mult * (1 + jitter)).toFixed(2))
  );
}

// ─── Token cache (lives as long as the serverless instance) ──────────────────
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
  // Tokens expire in 1 hour; cache for 55 minutes to be safe
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
  const date =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const username = process.env.ERCOT_USERNAME;
  const password = process.env.ERCOT_PASSWORD;
  const subKey = process.env.ERCOT_SUBSCRIPTION_KEY;

  // No credentials → return mock immediately
  if (!username || !password || !subKey) {
    return NextResponse.json({ prices: getMockPrices(node, date), isDemo: true });
  }

  try {
    const idToken = await getIdToken(username, password);

    const url = new URL(`${API_BASE}/np4-190-cd/dam_stlmnt_pnt_prices`);
    url.searchParams.set("deliveryDateFrom", date);
    url.searchParams.set("deliveryDateTo", date);
    url.searchParams.set("settlementPoint", node);
    url.searchParams.set("size", "25"); // 24 hours + possible DST hour

    const res = await fetch(url.toString(), {
      headers: {
        "Ocp-Apim-Subscription-Key": subKey,
        Authorization: `Bearer ${idToken}`,
      },
      // Cache real prices for 5 minutes (DAM prices don't change once published)
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ prices: getMockPrices(node, date), isDemo: true });
    }

    const json = await res.json() as {
      fields?: { name: string }[];
      data?: unknown[];
    };

    const rows = json.data ?? [];
    if (rows.length < 24) {
      // DAM prices not yet published for this date
      return NextResponse.json({ prices: getMockPrices(node, date), isDemo: true });
    }

    // ERCOT returns either array-of-arrays or array-of-objects depending on version.
    // Detect format from the fields descriptor and parse defensively.
    const fieldNames = (json.fields ?? []).map((f) => f.name);
    const hourIdx =
      fieldNames.indexOf("hourEnding") !== -1
        ? fieldNames.indexOf("hourEnding")
        : 1;
    const priceIdx =
      fieldNames.indexOf("settlementPointPrice") !== -1
        ? fieldNames.indexOf("settlementPointPrice")
        : 3;

    const prices = new Array<number>(24).fill(0);
    for (const row of rows) {
      let hourEnding: string;
      let price: number;
      if (Array.isArray(row)) {
        hourEnding = String(row[hourIdx]);
        price = Number(row[priceIdx]);
      } else {
        const obj = row as Record<string, unknown>;
        hourEnding = String(obj.hourEnding);
        price = Number(obj.settlementPointPrice);
      }
      const idx = parseInt(hourEnding, 10) - 1; // ERCOT hour 1–24 → index 0–23
      if (idx >= 0 && idx < 24) prices[idx] = price;
    }

    return NextResponse.json({ prices, isDemo: false });
  } catch {
    // Auth failure, network error, etc. — degrade gracefully to demo
    return NextResponse.json({ prices: getMockPrices(node, date), isDemo: true });
  }
}
