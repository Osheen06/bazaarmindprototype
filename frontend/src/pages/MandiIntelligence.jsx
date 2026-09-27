import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Tractor,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  Info,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { getMandiIntelligence, trackEvent } from "../lib/api";
import { SectionLabel, Chip } from "../components/atoms";

const PRODUCTS = [
  "Tomatoes",
  "Potatoes",
  "Onions",
  "Coriander",
  "Spinach",
  "Avocados",
  "Cauliflower",
  "Green Chilli",
  "Ginger",
  "Lemon",
  "Garlic",
  "Bell Peppers",
];

export default function MandiIntelligence() {
  const [product, setProduct] = useState("Tomatoes");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMandiIntelligence(product)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    trackEvent("mandi_intelligence_viewed", { product });
  }, [product]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-[#E5DEC9]">
        <div>
          <div className="flex items-center gap-2">
            <SectionLabel>Mandi Intelligence</SectionLabel>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              LIVE DELHI NCR WHOLESALE ARBITRAGE
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[#1E2022] mt-1">
            कौन सी मंडी जाऊं? / Which Mandi Should I Go To?
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6360] mt-1 max-w-2xl leading-relaxed">
            Connecting neighborhood retail demand with wholesale mandis and peri-urban farmers. Helping growers and suppliers identify where buyers are looking before distress sales happen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Chip tone="green">
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              <Tractor className="h-3.5 w-3.5" />
              Farmer Confidence Engine
            </span>
          </Chip>
        </div>
      </div>

      {/* Real-time Arbitrage Operating Banner */}
      <div className="rounded-2xl bg-white border border-[#E5DEC9] p-4 flex items-start sm:items-center justify-between gap-4 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-[#1E5631]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-[#1E2022] text-sm">Real-Time Wholesale-to-Retail Spread Engine</div>
            <div className="text-[#5C6360] text-xs">Direct correlation between Azadpur & Ghazipur wholesale arrivals and INA Market retail demand.</div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE MANDI SYNC
          </span>
        </div>
      </div>

      {/* Produce Selector Bar */}
      <div>
        <label className="text-xs font-semibold text-[#5C6360] block mb-2">
          Select Produce for Mandi Demand & Price Comparison:
        </label>
        <div className="flex gap-2 flex-wrap">
          {PRODUCTS.map((p) => (
            <button
              key={p}
              onClick={() => setProduct(p)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-2xs ${
                product === p
                  ? "bg-[#1E5631] text-white"
                  : "bg-white border border-[#E5DEC9] text-[#5C6360] hover:bg-[#F7F4EE]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Arbitrage Banner */}
      {data?.recommendedMandi && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#1E5631] text-white p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#F2C88C]">
              Observed Demand Synthesis · {product}
            </div>
            <div className="font-display text-lg font-bold mt-1 text-[#FDFBF7]">
              {data.recommendedMandi}
            </div>
            <p className="text-xs text-[#E9E4D6] mt-0.5">
              Based on aggregated vendor stockouts in retail clusters vs truck arrival velocity in wholesale mandis.
            </p>
          </div>
          <span className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs text-[#FDFBF7]">
            Arbitrage Model
          </span>
        </motion.div>
      )}

      {/* Mandi Comparison Table & Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.mandis || []).map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white border border-[#E5DEC9] rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-[#1E2022]">
                    {m.name}
                  </h3>
                  <span className="text-[11px] text-[#5C6360]">{m.type}</span>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800"
                >
                  {m.status === "LIVE_DEMO" ? "Live Retail" : "Active Mandi"}
                </span>
              </div>

              {/* Observed Price Range */}
              <div className="mt-3.5 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A82]">
                  {m.priceType || "Observed Price Range"}
                </div>
                <div className="font-display text-xl font-bold text-[#1E2022] mt-0.5">
                  {m.observedPriceRange}
                </div>
                <div className="text-[10px] text-[#5C6360] mt-0.5">
                  Observed range across reporting lots
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="p-2 rounded-lg bg-[#FDFBF7] border border-[#E5DEC9]/80">
                  <span className="text-[10px] text-[#8A8A82] block uppercase">Reported Demand</span>
                  <span className="font-bold text-[#1E5631]">{m.demandLevel}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#FDFBF7] border border-[#E5DEC9]/80">
                  <span className="text-[10px] text-[#8A8A82] block uppercase">Farmer Confidence</span>
                  <span className="font-bold text-[#1E2022]">{m.farmerConfidenceScore} / 100</span>
                </div>
              </div>

              {/* Activity & Freshness */}
              <div className="mt-3 text-xs text-[#5C6360] space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#1E5631] shrink-0" />
                  <span className="truncate">{m.recentActivity}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A82]">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Signal freshness: {m.signalFreshness}</span>
                </div>
              </div>

              {m.arbitrageOpportunity && (
                <div className="mt-3 pt-2.5 border-t border-[#E5DEC9]/70 text-[11px] text-[#3A403D] italic">
                  💡 {m.arbitrageOpportunity}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5DEC9] flex items-center justify-between text-xs text-[#8A8A82]">
              <span>Confidence: {m.confidence}</span>
              <span className="text-[10px] font-mono">{m.role}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Conceptual Farmer Workflow Explanation */}
      <div className="rounded-3xl bg-white border border-[#E5DEC9] p-6 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E5631] mb-2">
          <Sparkles className="h-4 w-4" />
          The Farmer Mandi Confidence Loop
        </div>
        <h3 className="font-display text-xl font-bold text-[#1E2022]">
          How BazaarMind Bridges Peri-Urban Growers with City Appetite
        </h3>
        <p className="text-xs sm:text-sm text-[#5C6360] mt-2 leading-relaxed max-w-3xl">
          When farmers load trucks at 3:00 AM in Sonipat or Meerut, they currently choose mandis blind. If 200 trucks dump tomatoes in Azadpur simultaneously, wholesale prices collapse to ₹15/kg while INA or Defence Colony vendors report shortages at ₹70/kg. BazaarMind aggregates neighborhood retail pulses back to farmers, enabling informed distribution and preventing distress sales.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mt-4 text-xs font-medium text-[#1E2022]">
          <div className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9]">
            <span className="block text-[10px] uppercase font-bold text-[#1E5631] mb-1">1. Retail Signal Pulse</span>
            Neighborhood shoppers and vendors submit daily supply and demand observations.
          </div>
          <div className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9]">
            <span className="block text-[10px] uppercase font-bold text-[#1E5631] mb-1">2. Wholesale Spread Analysis</span>
            The deterministic engine computes spread between wholesale auction lots and retail realized prices.
          </div>
          <div className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9]">
            <span className="block text-[10px] uppercase font-bold text-[#1E5631] mb-1">3. Farmer Decision Support</span>
            Farmer chooses the optimal mandi destination based on freshness, realized price, and retail scarcity.
          </div>
        </div>
      </div>
    </div>
  );
}
