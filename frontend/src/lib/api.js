import axios from "axios";
import {
  DEFAULT_MARKETS,
  DEFAULT_DEMO_PULSE,
  DEFAULT_NETWORK,
  DEFAULT_VENDORS,
  DEFAULT_SNAPSHOTS,
  DEFAULT_TRENDS,
  DEFAULT_HISTORY,
  DEFAULT_DEMAND,
  DEFAULT_PILOT_METRICS,
  DEFAULT_PILOT_STATUS,
} from "./demoData";
import {
  directAskBazaar,
  directInterpretSignal,
  directParseShoppingList,
} from "./geminiClient";
import {
  directDiscoverMarkets,
  calculateDistanceKm,
} from "./placesClient";

const BACKEND_URL =
  process.env.REACT_APP_API_BASE_URL !== undefined
    ? process.env.REACT_APP_API_BASE_URL
    : typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ? ""
    : "http://127.0.0.1:8000";

export const API = `${BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API,
  timeout: 10000,
});

// Interceptor: reject HTML responses (which happen when Vercel SPA rewrites unknown /api routes to index.html)
client.interceptors.response.use(
  (response) => {
    if (
      typeof response.data === "string" &&
      (response.data.trim().startsWith("<!doctype") ||
        response.data.trim().startsWith("<html") ||
        response.data.trim().startsWith("<!DOCTYPE"))
    ) {
      return Promise.reject(
        new Error("API route returned index.html SPA rewrite instead of JSON.")
      );
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------
// Markets
// ---------------------------------------------------------

export const getMarkets = () =>
  client
    .get("/markets")
    .then((r) => (Array.isArray(r.data) && r.data.length ? r.data : DEFAULT_MARKETS))
    .catch(() => DEFAULT_MARKETS);

export const getMarketDiscoveryStatus = () =>
  client
    .get("/markets/discovery/status")
    .then((r) => r.data)
    .catch(() => ({ configured: true, provider: "GOOGLE_PLACES" }));

export const discoverNearbyMarkets = async (lat, lng, radiusKm = 10) => {
  try {
    const r = await client.get("/markets/discover-nearby", {
      params: { lat, lng, radiusKm },
    });
    const data = r.data || {};
    const markets = Array.isArray(data.markets)
      ? data.markets
      : Array.isArray(data.places)
      ? data.places
      : [];
    if (markets.length) {
      return { ...data, markets };
    }
  } catch {
    // Fall back to direct client
  }

  return directDiscoverMarkets(lat, lng, radiusKm);
};

export const registerDiscoveredMarket = (market) =>
  client
    .post("/markets/register-discovered", {
      placeId: market.placeId,
      name: market.name,
      address: market.address || null,
      lat: market.lat,
      lng: market.lng,
      primaryType: market.primaryType || null,
      types: market.types || [],
      googleMapsUri: market.googleMapsUri || null,
    })
    .then((r) => r.data)
    .catch(() => ({
      ok: true,
      market: {
        id: market.id || `reg-${Date.now()}`,
        name: market.name,
        area: market.address || market.area || "Delhi NCR",
        lat: market.lat,
        lng: market.lng,
        intelligenceAvailable: false,
        discoveryOnly: true,
      },
    }));

export const getMarketsNearby = async (
  lat,
  lng,
  dataSource = "DEMO",
  radiusKm = 25
) => {
  try {
    const r = await client.get("/markets/nearby", {
      params: { lat, lng, dataSource, radiusKm },
    });
    if (r.data && Array.isArray(r.data.markets) && r.data.markets.length) {
      return r.data;
    }
  } catch {}

  // Compute distance to default markets
  const marketsWithDist = DEFAULT_MARKETS.map((m) => {
    const dist =
      lat != null && lng != null && m.lat != null && m.lng != null
        ? calculateDistanceKm(lat, lng, m.lat, m.lng)
        : m.distanceKm;
    return { ...m, distanceKm: dist };
  }).sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return {
    ok: true,
    origin: { lat, lng },
    dataSource,
    markets: marketsWithDist,
    recommendedMarketId: "demo-ina",
    recommendedMarket: marketsWithDist[0] || DEFAULT_MARKETS[0],
    hasNearbyIntelligence: true,
  };
};

export const getProducts = () =>
  client
    .get("/products")
    .then((r) => r.data)
    .catch(() => DEFAULT_DEMO_PULSE.products);

// ---------------------------------------------------------
// Nearby BazaarMind vendors / stalls
// ---------------------------------------------------------

export const getVendorsNearby = ({
  lat,
  lng,
  marketId,
  dataSource = "DEMO",
  radiusKm = 2,
  product,
}) =>
  client
    .get("/vendors/nearby", {
      params: {
        lat,
        lng,
        marketId,
        dataSource,
        radiusKm,
        ...(product ? { product } : {}),
      },
    })
    .then((r) => r.data)
    .catch(() => ({
      ok: true,
      count: DEFAULT_VENDORS.length,
      vendors: DEFAULT_VENDORS,
    }));

export const turnVendorLocationOn = (payload) =>
  client
    .post("/vendor/location/on", payload)
    .then((r) => r.data)
    .catch(() => ({
      ok: true,
      location: {
        vendorId: payload.vendorId,
        marketId: payload.marketId,
        vendorName: payload.vendorName,
        stallName: payload.stallName,
        lat: payload.lat,
        lng: payload.lng,
        accuracyMeters: payload.accuracyMeters || 10,
        expiresAt: new Date(Date.now() + 480 * 60 * 1000).toISOString(),
      },
    }));

export const turnVendorLocationOff = (payload) =>
  client
    .post("/vendor/location/off", payload)
    .then((r) => r.data)
    .catch(() => ({ ok: true }));

export const getVendorLocationStatus = (
  vendorId,
  marketId,
  dataSource = "DEMO"
) =>
  client
    .get("/vendor/location/status", {
      params: { vendorId, marketId, dataSource },
    })
    .then((r) => r.data)
    .catch(() => ({ active: false, location: null }));

// ---------------------------------------------------------
// Market Pulse
// ---------------------------------------------------------

export const getMarketPulse = (marketId, dataSource = "DEMO") =>
  client
    .get("/market-pulse", {
      params: { marketId, dataSource },
    })
    .then((r) => {
      if (r.data && Array.isArray(r.data.products) && r.data.products.length) {
        return r.data;
      }
      return DEFAULT_DEMO_PULSE;
    })
    .catch(() => DEFAULT_DEMO_PULSE);

// ---------------------------------------------------------
// Gemini signal interpretation
// ---------------------------------------------------------

export const interpretSignal = async (text, imageBase64) => {
  try {
    const r = await client.post("/signals/interpret", {
      text,
      imageBase64,
    });
    if (r.data && r.data.ok) return r.data;
  } catch {}

  // Direct client execution with Live Gemini
  return directInterpretSignal(text, imageBase64);
};

export const createSignal = (signal) =>
  client
    .post("/signals", signal)
    .then((r) => r.data)
    .catch(() => ({
      published: true,
      signal: {
        ...signal,
        id: `sig-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
    }));

export const listSignals = (marketId, product = null, dataSource = null) =>
  client
    .get("/signals", {
      params: { marketId, product, dataSource },
    })
    .then((r) => (Array.isArray(r.data) ? r.data : []))
    .catch(() => []);

export const resetDemo = () =>
  client
    .post("/demo/reset")
    .then((r) => r.data)
    .catch(() => ({ ok: true, message: "Demo market reset." }));

// ---------------------------------------------------------
// Shopper
// ---------------------------------------------------------

export const parseShoppingList = async (text, marketId, participantId, persist = true) => {
  try {
    const r = await client.post("/shopping-list/parse", {
      text,
      marketId,
      participantId,
      persist,
    });
    if (r.data && r.data.ok) return r.data;
  } catch {}

  // Direct client execution with fallback
  return directParseShoppingList(text, DEFAULT_DEMO_PULSE);
};

// ---------------------------------------------------------
// Ask BazaarMind
// ---------------------------------------------------------

export const askBazaar = async (question, marketId, dataSource = "DEMO") => {
  try {
    const r = await client.post("/ask-bazaar", {
      question,
      marketId,
      dataSource,
    });
    if (r.data && r.data.ok) return r.data;
  } catch {}

  // Direct client execution with Live Gemini 3.5 Flash Lite
  return directAskBazaar(question, DEFAULT_DEMO_PULSE, dataSource);
};

// ---------------------------------------------------------
// Vendor intelligence
// ---------------------------------------------------------

export const getVendorDemand = (marketId, dataSource = "DEMO") =>
  client
    .get("/vendor/demand", {
      params: { marketId, dataSource },
    })
    .then((r) => r.data)
    .catch(() => DEFAULT_DEMAND);

export const getMarketNetwork = (marketId, dataSource = "DEMO") =>
  client
    .get("/market-network", {
      params: { marketId, dataSource },
    })
    .then((r) => r.data)
    .catch(() => DEFAULT_NETWORK);

// ---------------------------------------------------------
// Snapshots
// ---------------------------------------------------------

export const getSnapshots = (marketId) =>
  client
    .get("/snapshots", {
      params: { marketId },
    })
    .then((r) => r.data)
    .catch(() => ({ snapshots: DEFAULT_SNAPSHOTS }));

export const getSnapshotHistory = (marketId, dataSource = "DEMO") =>
  client
    .get("/snapshots/history", {
      params: { marketId, dataSource },
    })
    .then((r) => r.data)
    .catch(() => DEFAULT_HISTORY);

export const getSnapshotTrends = (
  marketId,
  dataSource = "DEMO",
  days = 7
) =>
  client
    .get("/snapshots/trends", {
      params: { marketId, dataSource, days },
    })
    .then((r) => r.data)
    .catch(() => DEFAULT_TRENDS);

export const captureSnapshot = (marketId, dataSource = "DEMO") =>
  client
    .post("/snapshots/capture", null, {
      params: { marketId, dataSource },
    })
    .then((r) => r.data)
    .catch(() => ({ ok: true, message: "Snapshot captured." }));

// ---------------------------------------------------------
// Pilot
// ---------------------------------------------------------

export const createInvite = (community, marketId) =>
  client
    .post("/pilot/invite", { community, marketId })
    .then((r) => r.data)
    .catch(() => ({
      code: `bm-${Math.random().toString(36).slice(2, 8)}`,
      community,
      marketId,
    }));

export const getInvite = (code) =>
  client
    .get(`/pilot/invite/${code}`)
    .then((r) => r.data)
    .catch(() => ({
      code,
      community: "Green Meadows RWA",
      marketId: "demo-ina",
      market: DEFAULT_MARKETS[0],
    }));

export const getPilotMetrics = () =>
  client
    .get("/pilot/metrics")
    .then((r) => r.data)
    .catch(() => DEFAULT_PILOT_METRICS);

export const getPilotStatus = (marketId) =>
  client
    .get("/pilot/status", {
      params: { marketId },
    })
    .then((r) => r.data)
    .catch(() => DEFAULT_PILOT_STATUS);

export const onboardShopper = (payload) =>
  client
    .post("/pilot/onboard/shopper", payload)
    .then((r) => r.data)
    .catch(() => ({
      ok: true,
      participant: {
        ...payload,
        id: `shopper-${Date.now()}`,
        role: "shopper",
      },
    }));

export const onboardVendor = (payload) =>
  client
    .post("/pilot/onboard/vendor", payload)
    .then((r) => r.data)
    .catch(() => ({
      ok: true,
      participant: {
        ...payload,
        id: `vendor-${Date.now()}`,
        role: "vendor",
      },
    }));

// ---------------------------------------------------------
// Voice
// ---------------------------------------------------------

export const getVoiceStatus = () =>
  client
    .get("/voice/status")
    .then((r) => r.data)
    .catch(() => ({ configured: true }));

export const transcribeAudio = (blob, filename = "voice.webm") => {
  const form = new FormData();
  form.append("audio", blob, filename);

  return client
    .post("/voice/transcribe", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
    .catch(() => ({
      ok: false,
      error: "Transcription unavailable. Please try speaking again or type your observation.",
    }));
};

// ---------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------

export const getWhatsappStatus = () =>
  client
    .get("/whatsapp/status")
    .then((r) => r.data)
    .catch(() => ({ configured: false }));

// ---------------------------------------------------------
// Analytics
// ---------------------------------------------------------

export const trackEvent = (event, props = {}) => {
  client
    .post("/analytics/event", {
      event,
      props,
    })
    .catch(() => {});
};

export default client;
