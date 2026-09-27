import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Leaf,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LineChart as LineIcon
} from "lucide-react";
import { getSeasonalityData, getWastageMetrics, trackEvent } from "../lib/api";
import { SectionLabel, Chip } from "../components/atoms";

export default function SeasonalWastage() {
  const [seasonality, setSeasonality] = useState(null);
  const [wastage, setWastage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSeasonalityData("demo-ina", "DEMO"),
      getWastageMetrics("demo-ina", "DEMO")
    ])
      .then(([s, w]) => {
        setSeasonality(s);
        setWastage(w);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    trackEvent("seasonal_wastage_viewed");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-[#E5DEC9]">
        <div>
          <div className="flex items-center gap-2">
            <SectionLabel>Seasonality & Wastage</SectionLabel>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#D96B27]/10 text-[#B4571E] font-semibold border border-[#D96B27]/25">
              MODULE 9 & 10 · PILOT HYPOTHESIS
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[#1E2022] mt-1">
            Seasonal Demand & Wastage Reduction
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6360] mt-1 max-w-2xl leading-relaxed">
            Translating high-frequency consumer shopping requests and vendor observations into forward demand visibility, helping informal markets anticipate seasonal surges and slash avoidable food spoilage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Chip tone="green">
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              <Leaf className="h-3.5 w-3.5" />
              Pilot Hypothesis Engine
            </span>
          </Chip>
        </div>
      </div>

      {/* Honest Prototype Stage Notice */}
      <div className="rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9] p-4 flex items-start gap-3 text-xs leading-relaxed text-[#3A403D]">
        <Info className="h-4 w-4 text-[#1E5631] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#1E2022]">Scientific Grounding Standard:</strong> BazaarMind does NOT claim that the platform currently reduces wastage in the real world today. This architecture models the hypothesis: early morning demand signals + vendor stock observations $\to$ advance mismatch detection $\to$ avoidable wastage reduction during live pilots.
        </div>
      </div>

      {/* Wastage Reduction Architecture Section (Module 10) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#1E2022] flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#B4571E]" />
            Perishable Mismatch Detection Engine
          </h2>
          <span className="text-xs text-[#5C6360]">INA Market Demo Context</span>
        </div>

        {/* 4 Core Impact Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(wastage?.metrics || []).map((m, idx) => (
            <motion.div
              key={m.metric}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-[#E5DEC9] rounded-2xl p-4 shadow-2xs"
            >
              <span className="text-[10.5px] uppercase font-bold text-[#8A8A82] block tracking-wider">
                {m.metric}
              </span>
              <div className="font-display text-2xl font-extrabold text-[#1E2022] mt-1">
                {m.value}
              </div>
              <p className="text-[11px] text-[#5C6360] mt-1 leading-snug">{m.note}</p>
            </motion.div>
          ))}
        </div>

        {/* Mismatch Alerts Table / Cards */}
        <div className="bg-white border border-[#E5DEC9] rounded-3xl p-5 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1E5631] mb-3">
            Today's Detected Supply-Demand Mismatches
          </div>
          <div className="space-y-3">
            {(wastage?.mismatches || []).map((m) => (
              <div
                key={m.product}
                className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5DEC9] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold text-[#1E2022]">
                      {m.product}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        m.riskLevel === "CRITICAL_SPOILAGE"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : m.riskLevel === "HIGH"
                          ? "bg-[#D96B27]/10 text-[#B4571E] border border-[#D96B27]/25"
                          : "bg-green-100 text-green-700 border border-green-200"
                      }`}
                    >
                      {m.riskLevel.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-[#5C6360]">
                    Shopper Signal: <strong className="text-[#1E2022]">{m.shopperDemandSignal}</strong> ·
                    Vendor Stock: <strong className="text-[#1E2022]">{m.vendorStockSignal}</strong>
                  </div>
                  <p className="text-xs text-[#1E5631] font-medium pt-0.5">
                    💡 Actionable: {m.actionableInsight}
                  </p>
                </div>

                <div className="text-xs text-[#8A8A82] max-w-xs md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-[#E5DEC9]">
                  <span className="font-semibold text-[#5C6360] block">Hypothesized Impact:</span>
                  {m.avoidableSpoilageImpact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seasonal Demand Architecture Section (Module 9) */}
      <div className="space-y-4 pt-4 border-t border-[#E5DEC9]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#1E2022] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#1E5631]" />
            Seasonal & Weekly Demand Dynamics
          </h2>
          <span className="text-xs text-[#5C6360]">Delhi NCR Market Cycles</span>
        </div>

        {/* Weekly Footfall & Demand Multipliers */}
        <div className="bg-white border border-[#E5DEC9] rounded-3xl p-5 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1E5631] mb-2">
            Day-of-Week Demand Multiplier Model
          </div>
          <p className="text-xs text-[#5C6360] mb-4">
            Derived from consumer shopping rhythms in Delhi NCR (e.g. Tuesday vegetarian surges, weekend family stocking).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {(seasonality?.weeklyPatterns || []).map((w) => (
              <div
                key={w.day}
                className="p-3 rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9] flex flex-col justify-between text-center"
              >
                <div>
                  <span className="text-xs font-bold text-[#1E2022] block">{w.day}</span>
                  <span className="font-display text-lg font-extrabold text-[#1E5631] mt-1 block">
                    {w.demandMultiplier}x
                  </span>
                </div>
                <p className="text-[10px] text-[#5C6360] mt-2 leading-tight">{w.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Shock Cycles */}
        <div className="grid md:grid-cols-3 gap-4">
          {(seasonality?.seasonalCycles || []).map((s) => (
            <div
              key={s.season}
              className="bg-white border border-[#E5DEC9] rounded-2xl p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1E5631]/10 text-[#1E5631]">
                  {s.period}
                </span>
                <h3 className="font-display text-base font-bold text-[#1E2022] mt-2">
                  {s.season}
                </h3>
                <p className="text-xs text-[#5C6360] mt-1">{s.impactType}</p>

                {s.demandSurge.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#E5DEC9] text-xs">
                    <span className="font-bold text-[#1E5631] block mb-1">Demand Surges:</span>
                    <ul className="space-y-0.5 text-[11px] text-[#3A403D]">
                      {s.demandSurge.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.demandDip.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#E5DEC9] text-xs">
                    <span className="font-bold text-[#B4571E] block mb-1">Demand Dips:</span>
                    <ul className="space-y-0.5 text-[11px] text-[#3A403D]">
                      {s.demandDip.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#E5DEC9] text-[10px] text-[#8A8A82] uppercase font-mono">
                Status: {s.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
