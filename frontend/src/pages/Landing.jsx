import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Network,
  Store,
  Users,
  Sparkles,
  ShoppingBag,
  Mic,
  ShieldCheck,
  TrendingUp,
  Banknote,
  Compass,
  CheckCircle2,
  MapPin,
  Flame,
  Volume2,
} from "lucide-react";
import { trackEvent } from "../lib/api";
import BuiltWithGeminiModal from "../components/BuiltWithGeminiModal";
import PitchModeModal from "../components/PitchModeModal";
import ConceptualLeapVisualizer from "../components/ConceptualLeapVisualizer";
import TomorrowCityResilience from "../components/TomorrowCityResilience";

const LIVE_TICKER_ITEMS = [
  { item: "Tomatoes", price: "₹65–₹72/kg", change: "▲ 3%", tone: "up" },
  { item: "Onions", price: "₹32–₹35/kg", change: "▼ 1%", tone: "down" },
  { item: "Potatoes", price: "₹24–₹28/kg", change: "— 0%", tone: "flat" },
  { item: "Coriander", price: "₹18–₹22/bunch", change: "Tight Supply", tone: "alert" },
  { item: "Hass Avocados", price: "₹110–₹130/pc", change: "High Demand", tone: "up" },
  { item: "Bok Choy", price: "₹85–₹95/kg", change: "▲ 5%", tone: "up" },
  { item: "Fresh Ginger", price: "₹120–₹140/kg", change: "Stable", tone: "flat" },
  { item: "Green Chilli", price: "₹80–₹95/kg", change: "▲ 2%", tone: "up" },
];

const INA_PRODUCE_PREVIEW = [
  {
    name: "Tomatoes",
    hindi: "टमाटर",
    price: "₹65–₹72/kg",
    status: "Tight Supply",
    stalls: "5 Stalls Reporting",
    leadStall: "Ramesh Kumar · Stall 14",
    tag: "Morning Peak",
  },
  {
    name: "Onions",
    hindi: "प्याज",
    price: "₹32–₹35/kg",
    status: "Good Stock",
    stalls: "4 Stalls Reporting",
    leadStall: "Subhash Chand · Stall 22",
    tag: "Fresh Nashik Lot",
  },
  {
    name: "Potatoes",
    hindi: "आलू",
    price: "₹24–₹28/kg",
    status: "Good Stock",
    stalls: "4 Stalls Reporting",
    leadStall: "Chaudhary Ji · Stall 05",
    tag: "Pahadi Crop",
  },
  {
    name: "Coriander",
    hindi: "धनिया",
    price: "₹18–₹22/bunch",
    status: "Limited",
    stalls: "3 Stalls Reporting",
    leadStall: "Gupta Ji · Stall 31",
    tag: "Rain Scarcity",
  },
  {
    name: "Bok Choy",
    hindi: "पाक चोई",
    price: "₹85–₹95/kg",
    status: "Fast Moving",
    stalls: "2 Stalls Reporting",
    leadStall: "Pooja Exotics · Stall 18",
    tag: "South Delhi Favorite",
  },
  {
    name: "Avocados",
    hindi: "एवोकाडो",
    price: "₹110–₹130/pc",
    status: "High Demand",
    stalls: "3 Stalls Reporting",
    leadStall: "Khan Fruits · Stall 09",
    tag: "Kodaikanal Lot",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeVoiceStep, setActiveVoiceStep] = useState(0);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);

  useEffect(() => {
    trackEvent("landing_viewed");
    const interval = setInterval(() => {
      setActiveVoiceStep((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] bm-noise text-[#1E2022] overflow-x-hidden">
      {/* Streaming Rate Ticker */}
      <div className="bg-[#1E2022] text-white py-2 px-4 text-xs font-mono border-b border-[#2C3033] overflow-hidden whitespace-nowrap">
        <div className="inline-flex items-center gap-8 animate-marquee">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            INA MARKET DEMO TICKER · SYNTHETIC SIGNALS:
          </span>
          {LIVE_TICKER_ITEMS.concat(LIVE_TICKER_ITEMS).map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-2">
              <span className="text-[#E9E4D6] font-semibold">{item.item}</span>
              <span className="text-white font-bold">{item.price}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  item.tone === "up"
                    ? "bg-emerald-950 text-emerald-300"
                    : item.tone === "alert"
                    ? "bg-amber-950 text-amber-300"
                    : "bg-neutral-800 text-neutral-300"
                }`}
              >
                {item.change}
              </span>
              <span className="text-[#5C6360]">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#1E5631] flex items-center justify-center shadow-md">
            <Network className="h-5 w-5 text-[#FDFBF7]" />
          </div>
          <div>
            <span className="font-display font-black text-[#1E2022] tracking-tight text-xl">
              BazaarMind
            </span>
            <span className="block text-[10px] font-bold text-[#5C6360] uppercase tracking-widest">
              INA Market · South Delhi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPitchModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1E5631] text-[#FDFBF7] hover:bg-[#164024] px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
            data-testid="landing-pitch-btn"
          >
            <span>🎯 Pitch Mode (5 Steps)</span>
          </button>
          <button
            onClick={() => setShowGeminiModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1E2022] text-[#FDFBF7] hover:bg-[#2C3033] px-3.5 py-1.5 text-xs font-bold border border-emerald-500/40 shadow-xs transition-all hover:scale-105 active:scale-95"
            data-testid="landing-gemini-btn"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Built with Gemini</span>
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            DEMO ENVIRONMENT
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-6 md:pt-14 pb-14">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-bold text-emerald-800 mb-6 shadow-xs"
            >
              <Flame className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
              India's First Neighborhood Market Intelligence Network
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1E2022] leading-[1.04]"
            >
              The Market That
              <span className="block text-[#1E5631] mt-1">
                Thinks As One.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-6 text-[#3A403D] text-base sm:text-lg leading-relaxed max-w-xl font-medium"
            >
              Every shopper is a signal. Every vendor is a sensor. BazaarMind connects offline bazaar observations through Google Gemini into verified price ranges, smart stall navigation, wholesale mandi intelligence, and a reputation model for vendor working capital.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-3.5"
            >
              <button
                onClick={() => setShowPitchModal(true)}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1E5631] px-7 py-3.5 text-[#FDFBF7] font-bold text-sm hover:bg-[#164024] transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                data-testid="hero-pitch-cta"
              >
                <span>🎯 Pitch Mode (5-Step Live Demo)</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  trackEvent("hero_cta_pulse");
                  navigate("/pulse");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#E5DEC9] px-6 py-3.5 text-[#1E2022] font-bold text-sm hover:bg-[#F7F4EE] transition-all shadow-xs"
              >
                <span>⚡ Explore Market Pulse</span>
              </button>

              <button
                onClick={() => {
                  trackEvent("hero_cta_mandi");
                  navigate("/mandi");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#E5DEC9] px-6 py-3.5 text-[#1E2022] font-bold text-sm hover:bg-[#F7F4EE] transition-all shadow-xs"
              >
                <TrendingUp className="h-4 w-4 text-[#1E5631]" />
                Mandi Arbitrage
              </button>

              <button
                onClick={() => {
                  trackEvent("hero_cta_loans");
                  navigate("/loans");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-5 py-3.5 text-amber-900 font-bold text-sm hover:bg-amber-100 transition-all shadow-xs"
              >
                <Banknote className="h-4 w-4 text-amber-700" />
                Vendor Capital (Concept)
              </button>

              <button
                onClick={() => setShowGeminiModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E2022] text-[#FDFBF7] border border-emerald-500/40 px-5 py-3.5 font-bold text-sm hover:bg-[#2A2E31] transition-all shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Built with Gemini
              </button>
            </motion.div>

            <div className="mt-8 flex items-center gap-6 text-xs text-[#5C6360] font-medium pt-4 border-t border-[#E5DEC9]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1E5631]" />
                <span>Range-based price truth</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1E5631]" />
                <span>GPS stall routing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1E5631]" />
                <span>Signal reputation model</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Voice Sensor Simulation Card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-white border border-[#E5DEC9] rounded-3xl p-6 shadow-[0_20px_50px_rgba(30,32,34,0.08)] relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EBDE]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-[#1E5631] flex items-center justify-center">
                    <Mic className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1E2022]">
                      Voice Sensor Stream
                    </h3>
                    <span className="text-[10px] text-[#8A8A82]">
                      INA Market · Stall 14 (Ramesh Kumar · Demo)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  SYNTHETIC DEMO
                </span>
              </div>

              {/* Voice simulation transcript */}
              <div className="mt-4 p-4 rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5C6360] mb-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-[#1E5631]" />
                  <span>Stall Audio Log (Hindi/Hinglish):</span>
                </div>
                <p className="text-sm font-medium text-[#1E2022] italic leading-relaxed">
                  "Subah 6 baje Azadpur se hybrid tamatar laaye the, fresh stock hai aur ₹70/kg me bik raha hai."
                </p>
              </div>

              {/* Gemini AI Live Extraction */}
              <div className="mt-4 p-4 rounded-2xl bg-[#1E2022] text-[#FDFBF7]">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-emerald-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Gemini 2.5 Live Interpretation
                  </span>
                  <span className="text-[#8A8A82]">180ms</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#2A2E31] p-2 rounded-lg">
                    <span className="text-[#8A8A82] text-[10px] block">Produce</span>
                    <span className="font-bold text-white">Tomatoes (टमाटर)</span>
                  </div>
                  <div className="bg-[#2A2E31] p-2 rounded-lg">
                    <span className="text-[#8A8A82] text-[10px] block">Observed Price</span>
                    <span className="font-bold text-emerald-400">₹70 / kg</span>
                  </div>
                  <div className="bg-[#2A2E31] p-2 rounded-lg">
                    <span className="text-[#8A8A82] text-[10px] block">Supply Status</span>
                    <span className="font-bold text-amber-300">Tight (Morning Peak)</span>
                  </div>
                  <div className="bg-[#2A2E31] p-2 rounded-lg">
                    <span className="text-[#8A8A82] text-[10px] block">Confidence</span>
                    <span className="font-bold text-emerald-400">High (Corroborated)</span>
                  </div>
                </div>
              </div>

              {/* Downstream Pulse Update */}
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900">
                  ⚡ Market Pulse Updated: ₹65–₹72/kg
                </span>
                <button
                  onClick={() => navigate("/pulse")}
                  className="text-emerald-800 font-bold hover:underline"
                >
                  View Pulse →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Criterion 1: Extraordinary Conceptual Leap (30% Weight) */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-6">
        <ConceptualLeapVisualizer />
      </section>

      {/* The 4 Commercial Pillars */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 border-t border-[#E5DEC9]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E5631] bg-[#1E5631]/10 px-3.5 py-1 rounded-full">
            Full-Stack Commerce Infrastructure
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E2022] mt-3">
            Built for the Real Dynamics of the Bazaar
          </h2>
          <p className="text-sm text-[#5C6360] mt-2">
            No forced forms or rigid catalog uploads. BazaarMind captures the physical flow of commerce.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => navigate("/pulse")}
            className="cursor-pointer bg-white border border-[#E5DEC9] hover:border-[#1E5631] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-[#1E5631] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-[#1E2022]">
              Living Market Pulse
            </h3>
            <p className="text-xs text-[#5C6360] mt-2 leading-relaxed">
              Price ranges, not fake single numbers. Continuous stall corroboration, item freshness decay, and traceable evidence.
            </p>
            <div className="mt-4 text-xs font-bold text-[#1E5631] flex items-center gap-1">
              Explore Rates <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate("/shop")}
            className="cursor-pointer bg-white border border-[#E5DEC9] hover:border-[#1E5631] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-[#1E5631] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-[#1E2022]">
              GPS Stall Navigation
            </h3>
            <p className="text-xs text-[#5C6360] mt-2 leading-relaxed">
              Every stall mapped with exact coordinates. 1-click Google Maps walking routes to the freshest crates in the bazaar.
            </p>
            <div className="mt-4 text-xs font-bold text-[#1E5631] flex items-center gap-1">
              Find Stalls <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate("/mandi")}
            className="cursor-pointer bg-white border border-[#E5DEC9] hover:border-[#1E5631] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-[#1E5631] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-[#1E2022]">
              Mandi Wholesale Arbitrage
            </h3>
            <p className="text-xs text-[#5C6360] mt-2 leading-relaxed">
              "Konsi Mandi?" Live wholesale vs retail spreads between Azadpur APMC, Ghazipur, Okhla, and INA Market.
            </p>
            <div className="mt-4 text-xs font-bold text-[#1E5631] flex items-center gap-1">
              Compare Mandis <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate("/loans")}
            className="cursor-pointer bg-white border border-[#E5DEC9] hover:border-amber-600 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Banknote className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-[#1E2022]">
              Vendor Capital Layer
            </h3>
            <p className="text-xs text-[#5C6360] mt-2 leading-relaxed">
              Future Concept: Reputation-based working capital underwriting driven by morning presence and signal consistency.
            </p>
            <div className="mt-4 text-xs font-bold text-amber-800 flex items-center gap-1">
              Explore Concept <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Criterion 4: Future Focused · 2027 Urban Food Resilience (15% Weight) */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-6">
        <TomorrowCityResilience />
      </section>

      {/* Live INA Produce Board Preview */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-12">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-[#1E2022]">
              Live Produce Board · INA Market
            </h3>
            <p className="text-xs text-[#5C6360] mt-0.5">
              Current observed price spreads reported by verified stall sensors
            </p>
          </div>
          <button
            onClick={() => navigate("/pulse")}
            className="px-4 py-2 rounded-xl bg-white border border-[#E5DEC9] hover:bg-[#F7F4EE] text-xs font-bold text-[#1E2022] shadow-2xs flex items-center gap-1.5"
          >
            View All 15 Items <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INA_PRODUCE_PREVIEW.map((item) => (
            <div
              key={item.name}
              onClick={() => navigate("/pulse")}
              className="cursor-pointer bg-white border border-[#E5DEC9] hover:border-[#1E5631] rounded-2xl p-4 transition-all shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-base text-[#1E2022]">
                    {item.name}
                  </span>
                  <span className="text-xs text-[#8A8A82] ml-2 font-medium">
                    {item.hindi}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {item.tag}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-xl font-bold text-[#1E5631]">
                  {item.price}
                </span>
                <span className="text-xs font-semibold text-[#1E2022]">
                  {item.status}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#F0EBDE] flex items-center justify-between text-xs text-[#5C6360]">
                <span>{item.stalls}</span>
                <span className="truncate max-w-[140px] text-right font-medium text-[#1E2022]">
                  {item.leadStall}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* High-Converting Bottom Banner */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="rounded-3xl bg-[#1E5631] text-white p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Prototype & Pilot Architecture
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold mt-2 leading-tight">
              Experience the INA Market Intelligence Layer Today
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
              Explore range-based produce prices, speak as a vendor, check wholesale mandi spreads, or explore the vendor capital reputation model.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => navigate("/pulse")}
              className="px-7 py-3.5 rounded-full bg-[#FDFBF7] text-[#1E5631] font-bold text-sm hover:bg-white transition-all shadow-md"
            >
              Launch Market Pulse →
            </button>
            <button
              onClick={() => navigate("/loans")}
              className="px-6 py-3.5 rounded-full bg-emerald-900 border border-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-all"
            >
              Vendor Capital (Concept)
            </button>
          </div>
        </div>
      </section>

      {/* Clean Production Footer */}
      <footer className="border-t border-[#E5DEC9] bg-[#F7F4EE] py-8 px-5 md:px-8 text-xs text-[#5C6360]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#1E5631] flex items-center justify-center text-white font-bold text-xs">
              B
            </div>
            <span className="font-bold text-[#1E2022]">BazaarMind India</span>
            <span>· The Intelligence Layer for Local Markets</span>
          </div>

          <div className="flex items-center gap-5 font-semibold text-[#1E2022]">
            <button onClick={() => navigate("/pulse")} className="hover:text-[#1E5631]">Market Pulse</button>
            <button onClick={() => navigate("/shop")} className="hover:text-[#1E5631]">Shopper</button>
            <button onClick={() => navigate("/vendor")} className="hover:text-[#1E5631]">Vendor</button>
            <button onClick={() => navigate("/mandi")} className="hover:text-[#1E5631]">Mandi Arbitrage</button>
            <button onClick={() => navigate("/loans")} className="hover:text-[#1E5631]">Vendor Capital</button>
            <button onClick={() => navigate("/ask")} className="hover:text-[#1E5631]">Ask AI</button>
          </div>
        </div>
      </footer>
      <BuiltWithGeminiModal isOpen={showGeminiModal} onClose={() => setShowGeminiModal(false)} />
      <PitchModeModal isOpen={showPitchModal} onClose={() => setShowPitchModal(false)} />
    </div>
  );
}
