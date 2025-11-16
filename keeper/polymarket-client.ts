/* eslint-disable no-console */

export type MarketProbability = {
  marketId: string;
  probability: number; // 0..1
  source: string;
  slug?: string;
  imageUrl?: string;
};

/**
 * Resolve a market id from a human-friendly slug.
 * GET /markets/slug/{slug}
 */
export async function resolveMarketIdFromSlug(
  slug: string
): Promise<string> {
  const url = `https://gamma-api.polymarket.com/markets/slug/${encodeURIComponent(
    slug
  )}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`slug lookup HTTP ${res.status}`);
  }
  const data = (await res.json()) as any;
  const id: string | undefined = data?.id || data?.market?.id;
  if (!id) {
    throw new Error("slug lookup: id not found in response");
  }
  return id;
}

/**
 * Fetch a binary market probability from Polymarket public API.
 * Returns a value in [0,1]. On error, returns 0.5 as neutral prior.
 *
 * Notes:
 * - This is a minimal implementation; refine parsing for your chosen market.
 * - MARKET_ID should point to a binary market; we pick the "Yes" side if present.
 */
export async function getMarketProbability(
  marketId: string
): Promise<MarketProbability> {
  try {
    const url = `https://gamma-api.polymarket.com/markets?ids=${encodeURIComponent(
      marketId
    )}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as any;
    // Heuristic: find "Yes" outcome or first outcome with higher price
    const market = Array.isArray(data) ? data[0] : data?.[0];
    const outcomes: any[] = market?.outcomes || market?.markets || [];
    let prob = 0.5;
    for (const o of outcomes) {
      const ticker: string = o?.ticker || o?.name || "";
      const price: number =
        typeof o?.price === "number"
          ? o.price
          : typeof o?.last_price === "number"
          ? o.last_price
          : 0;
      if (/yes/i.test(ticker)) {
        prob = price;
        break;
      }
      // fallback to max price if no explicit Yes
      if (price > prob) prob = price;
    }
    // Clamp
    if (!(prob >= 0 && prob <= 1)) prob = Math.max(0, Math.min(1, prob));
    const slug: string | undefined = market?.slug;
    const imageUrl: string | undefined =
      market?.image_url || market?.image || market?.cover_image;
    return { marketId, probability: prob, source: "polymarket", slug, imageUrl };
  } catch (err) {
    console.warn(
      `[polymarket] fetch failed for ${marketId}: ${
        (err as Error).message
      }; returning 0.5`
    );
    return { marketId, probability: 0.5, source: "polymarket" };
  }
}


