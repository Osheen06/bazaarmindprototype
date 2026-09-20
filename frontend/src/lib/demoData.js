/**
 * Comprehensive fallback demo dataset for BazaarMind.
 * Ensures the prototype functions gracefully even when offline or during deployment transitions.
 */

export const DEFAULT_MARKETS = [
  {
    id: "demo-ina",
    name: "INA Market",
    area: "South Delhi, Delhi NCR",
    community: "Green Meadows RWA (demo community)",
    lat: 28.5687,
    lng: 77.2094,
    synthetic: true,
    distanceKm: 0.0,
    intelligenceAvailable: true,
  },
  {
    id: "demo-sarojini",
    name: "Sarojini Nagar Market",
    area: "South West Delhi, Delhi NCR",
    community: "Sarojini RWA (demo)",
    lat: 28.5775,
    lng: 77.1969,
    synthetic: true,
    distanceKm: 1.56,
    intelligenceAvailable: false,
    discoveryOnly: true,
  },
  {
    id: "demo-ghazipur",
    name: "Ghazipur Mandi",
    area: "East Delhi, Delhi NCR",
    community: "Kondli RWA (demo)",
    lat: 28.6255,
    lng: 77.3255,
    synthetic: true,
    distanceKm: 12.98,
    intelligenceAvailable: false,
    discoveryOnly: true,
  },
];

export const DEFAULT_DEMO_PULSE = {
  marketId: "demo-ina",
  products: [
    {
      product: "Tomatoes",
      availability: "Tight",
      availabilityCode: "LOW",
      demand: "Elevated",
      demandCode: "HIGH",
      reportedPriceSignal: "₹55–₹60/kg",
      priceLow: 55,
      priceHigh: 60,
      priceUnit: "kg",
      vendorObservations: 7,
      shopperSignals: 23,
      signalCount: 30,
      confidence: "High",
      conflicting: false,
      lastUpdatedMinutes: 5,
      lastUpdated: "5 min ago",
    },
    {
      product: "Potatoes",
      availability: "Good",
      availabilityCode: "HIGH",
      demand: "Normal",
      demandCode: "NORMAL",
      reportedPriceSignal: "₹24–₹26/kg",
      priceLow: 24,
      priceHigh: 26,
      priceUnit: "kg",
      vendorObservations: 6,
      shopperSignals: 9,
      signalCount: 15,
      confidence: "High",
      conflicting: false,
      lastUpdatedMinutes: 5,
      lastUpdated: "5 min ago",
    },
    {
      product: "Onions",
      availability: "Good",
      availabilityCode: "HIGH",
      demand: "Elevated",
      demandCode: "HIGH",
      reportedPriceSignal: "₹30–₹35/kg",
      priceLow: 30,
      priceHigh: 35,
      priceUnit: "kg",
      vendorObservations: 5,
      shopperSignals: 18,
      signalCount: 23,
      confidence: "High",
      conflicting: false,
      lastUpdatedMinutes: 5,
      lastUpdated: "5 min ago",
    },
    {
      product: "Coriander",
      availability: "Tight",
      availabilityCode: "LOW",
      demand: "Elevated",
      demandCode: "HIGH",
      reportedPriceSignal: "₹20–₹30/bunch",
      priceLow: 20,
      priceHigh: 30,
      priceUnit: "bunch",
      vendorObservations: 4,
      shopperSignals: 14,
      signalCount: 18,
      confidence: "Medium",
      conflicting: false,
      lastUpdatedMinutes: 5,
      lastUpdated: "5 min ago",
    },
    {
      product: "Bananas",
      availability: "Normal",
      availabilityCode: "NORMAL",
      demand: "Normal",
      demandCode: "NORMAL",
      reportedPriceSignal: "₹50–₹60/dozen",
      priceLow: 50,
      priceHigh: 60,
      priceUnit: "dozen",
      vendorObservations: 3,
      shopperSignals: 6,
      signalCount: 9,
      confidence: "Medium",
      conflicting: false,
      lastUpdatedMinutes: 5,
      lastUpdated: "5 min ago",
    },
    {
      product: "Green Chilies",
      availability: "Tight",
      availabilityCode: "LOW",
      demand: "Elevated",
      demandCode: "HIGH",
      reportedPriceSignal: "₹80–₹100/kg",
      priceLow: 80,
      priceHigh: 100,
      priceUnit: "kg",
      vendorObservations: 4,
      shopperSignals: 11,
      signalCount: 15,
      confidence: "Medium",
      conflicting: false,
      lastUpdatedMinutes: 5,
      lastUpdated: "5 min ago",
    },
    {
      product: "Carrots",
      availability: "Good",
      availabilityCode: "HIGH",
      demand: "Normal",
      demandCode: "NORMAL",
      reportedPriceSignal: "₹38–₹42/kg",
      priceLow: 38,
      priceHigh: 42,
      priceUnit: "kg",
      vendorObservations: 3,
      shopperSignals: 5,
      signalCount: 8,
      confidence: "Medium",
      conflicting: false,
      lastUpdatedMinutes: 5,
      lastUpdated: "5 min ago",
    },
    {
      product: "Spinach",
      availability: "Tight",
      availabilityCode: "LOW",
      demand: "Elevated",
      demandCode: "HIGH",
      reportedPriceSignal: "₹20–₹30/bunch",
      priceLow: 20,
      priceHigh: 30,
      priceUnit: "bunch",
      vendorObservations: 3,
      shopperSignals: 12,
      signalCount: 15,
      confidence: "Medium",
      conflicting: false,
      lastUpdatedMinutes: 5,
      lastUpdated: "5 min ago",
    },
  ],
  overallConfidence: "High",
  totalSignals: 133,
  lastUpdated: "5 min ago",
  synthetic: true,
  dataSource: "DEMO",
  market: {
    id: "demo-ina",
    name: "INA Market",
    area: "South Delhi, Delhi NCR",
    community: "Green Meadows RWA (demo community)",
    lat: 28.5687,
    lng: 77.2094,
    synthetic: true,
  },
};

export const DEFAULT_NETWORK = {
  marketId: "demo-ina",
  shopperSignals: 64,
  supplySignals: 47,
  vendors: [
    { id: "v1", name: "Ramesh Kumar", stall: "Stall 14 · INA Mandi", supplySignals: 12 },
    { id: "v2", name: "Suresh Sabziwala", stall: "Stall 08 · Green Corner", supplySignals: 9 },
    { id: "v3", name: "Anil Produce", stall: "Stall 22 · Front Row", supplySignals: 11 },
    { id: "v4", name: "Vijay Fruits", stall: "Stall 03 · Fruit Aisle", supplySignals: 8 },
    { id: "v5", name: "Mohan Lal", stall: "Stall 31 · East Gate", supplySignals: 7 },
  ],
};

export const DEFAULT_VENDORS = [
  {
    vendorId: "v1",
    vendorName: "Ramesh Kumar",
    stallName: "Stall 14 · Fresh Greens",
    distanceKm: 0.12,
    offers: [
      { product: "Tomatoes", reportedPrice: 58, priceUnit: "kg" },
      { product: "Potatoes", reportedPrice: 25, priceUnit: "kg" },
      { product: "Coriander", reportedPrice: 25, priceUnit: "bunch" },
    ],
  },
  {
    vendorId: "v2",
    vendorName: "Suresh Sabziwala",
    stallName: "Stall 08 · Green Corner",
    distanceKm: 0.24,
    offers: [
      { product: "Onions", reportedPrice: 32, priceUnit: "kg" },
      { product: "Green Chilies", reportedPrice: 90, priceUnit: "kg" },
    ],
  },
  {
    vendorId: "v3",
    vendorName: "Vijay Fruits & More",
    stallName: "Stall 03 · Fruit Aisle",
    distanceKm: 0.35,
    offers: [
      { product: "Bananas", reportedPrice: 55, priceUnit: "dozen" },
      { product: "Carrots", reportedPrice: 40, priceUnit: "kg" },
    ],
  },
];

export const DEFAULT_SNAPSHOTS = [
  {
    id: "snap-1",
    label: "Yesterday (Morning)",
    changes: [
      { product: "Tomatoes", field: "Availability", from: "Normal", to: "Tight" },
      { product: "Onions", field: "Reported Price", from: "₹28/kg", to: "₹32/kg" },
    ],
  },
  {
    id: "snap-2",
    label: "2 Days Ago",
    changes: [
      { product: "Potatoes", field: "Reported Price", from: "₹22/kg", to: "₹25/kg" },
      { product: "Spinach", field: "Availability", from: "Good", to: "Tight" },
    ],
  },
  {
    id: "snap-3",
    label: "3 Days Ago",
    changes: [
      { product: "Coriander", field: "Availability", from: "Normal", to: "Tight" },
      { product: "Green Chilies", field: "Reported Price", from: "₹75/kg", to: "₹90/kg" },
    ],
  },
];

export const DEFAULT_TRENDS = {
  products: [
    {
      product: "Tomatoes",
      points: [
        { date: "2026-09-15", priceMid: 45, availability: "Good" },
        { date: "2026-09-16", priceMid: 48, availability: "Good" },
        { date: "2026-09-17", priceMid: 52, availability: "Normal" },
        { date: "2026-09-18", priceMid: 55, availability: "Normal" },
        { date: "2026-09-19", priceMid: 58, availability: "Tight" },
        { date: "2026-09-20", priceMid: 57, availability: "Tight" },
        { date: "2026-09-21", priceMid: 58, availability: "Tight" },
      ],
    },
    {
      product: "Potatoes",
      points: [
        { date: "2026-09-15", priceMid: 24, availability: "Good" },
        { date: "2026-09-16", priceMid: 24, availability: "Good" },
        { date: "2026-09-17", priceMid: 25, availability: "Good" },
        { date: "2026-09-18", priceMid: 25, availability: "Good" },
        { date: "2026-09-19", priceMid: 25, availability: "Good" },
        { date: "2026-09-20", priceMid: 25, availability: "Good" },
        { date: "2026-09-21", priceMid: 25, availability: "Good" },
      ],
    },
    {
      product: "Onions",
      points: [
        { date: "2026-09-15", priceMid: 28, availability: "Good" },
        { date: "2026-09-16", priceMid: 30, availability: "Good" },
        { date: "2026-09-17", priceMid: 30, availability: "Good" },
        { date: "2026-09-18", priceMid: 32, availability: "Good" },
        { date: "2026-09-19", priceMid: 33, availability: "Normal" },
        { date: "2026-09-20", priceMid: 32, availability: "Normal" },
        { date: "2026-09-21", priceMid: 32, availability: "Normal" },
      ],
    },
  ],
};

export const DEFAULT_HISTORY = {
  history: [
    { capturedAt: "2026-09-21T02:00:00Z", totalSignals: 133 },
    { capturedAt: "2026-09-20T02:00:00Z", totalSignals: 118 },
  ],
  comparison: {
    available: true,
    changes: [
      { product: "Tomatoes", field: "Reported Price", from: "₹50–₹55/kg", to: "₹55–₹60/kg" },
      { product: "Coriander", field: "Availability", from: "Normal", to: "Tight" },
    ],
  },
};

export const DEFAULT_DEMAND = {
  totalRequests: 42,
  products: [
    { product: "Tomatoes", level: "High demand · 18 shopper requests" },
    { product: "Onions", level: "Elevated demand · 12 shopper requests" },
    { product: "Coriander", level: "Elevated demand · 8 shopper requests" },
    { product: "Spinach", level: "Moderate demand · 6 shopper requests" },
  ],
};

export const DEFAULT_PILOT_METRICS = {
  setup: {
    community: "Green Meadows RWA",
    market: "INA Market",
    vendors: "10–15 stalls",
    households: "20–50 homes",
    durationDays: 14,
  },
  metrics: [
    { name: "Daily Active Signals", target: "50+ signals / day", status: "Active" },
    { name: "Vendor Stall Check-ins", target: "8+ stalls / day", status: "Active" },
    { name: "Shopper Accuracy Rating", target: "> 85% helpfulness", status: "Target" },
    { name: "WhatsApp Retention", target: "> 60% week-2 return", status: "Pilot" },
  ],
};

export const DEFAULT_PILOT_STATUS = {
  environment: "DEMO",
  hasPilotData: true,
  metrics: [
    { name: "Registered Markets", display: "3 markets (Delhi NCR)" },
    { name: "Demonstration Pulse", display: "8 active product signals" },
    { name: "Gemini Model", display: "gemini-3.5-flash-lite (Live)" },
    { name: "Location Provider", display: "Google Places + GPS" },
    { name: "Corroboration Confidence", display: "High (Synthetic baseline)" },
  ],
};
