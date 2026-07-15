// Cache exchange rate in memory for 1 hour
let cachedRate = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK_RATE = 155; // 1 USD ≈ 155 KES (conservative default)

/**
 * Get live USD to KES exchange rate with caching and fallback.
 * Uses the free exchangerate-api.com endpoint.
 */
export async function getUsdToKesRate() {
  const now = Date.now();
  if (cachedRate && now - cacheTimestamp < CACHE_TTL) {
    return cachedRate;
  }

  try {
    const res = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data?.rates?.KES) {
      cachedRate = data.rates.KES;
      cacheTimestamp = now;
      return cachedRate;
    }
  } catch (_) {
    // Fall through to cached or default
  }

  // Use stale cache if available, otherwise fallback
  return cachedRate || FALLBACK_RATE;
}

/**
 * Convert USD to KES, rounding up to the next 10 shillings.
 * @param {number} usdAmount - Price in USD (e.g. 9.99)
 * @returns {Promise<number>} KES amount rounded up to the next 10 shillings (e.g. 1549 -> 1550)
 */
export async function usdToKes(usdAmount) {
  const rate = await getUsdToKesRate();
  const rawAmount = usdAmount * rate;
  return Math.ceil(rawAmount / 10) * 10;
}

/**
 * Convert USD cents (as used by Paystack) to KES whole units.
 * @param {number} usdCents - Price in USD cents (e.g. 999 for $9.99)
 * @returns {Promise<number>} KES amount rounded up to the next 10 shillings (e.g. 1549 -> 1550)
 */
export async function usdCentsToKes(usdCents) {
  return usdToKes(usdCents / 100);
}
