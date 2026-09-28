import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Zap,
  Building2,
  Store,
  Users,
  Flame,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Leaf,
  CheckCircle2,
} from "lucide-react";

export default function ConceptualLeapVisualizer() {
  const [activeSimulation, setActiveSimulation] = useState("normal");
  const [pulseState, setPulseState] = useState({
    tomatoes: { price: "₹65–₹72/kg", trend: "Balanced", color: "text-emerald-700" },
    onions: { price: "₹32–₹35/kg", trend: "Steady", color: "text-emerald-700" },
    coriander: { price: "₹18–₹22/bunch", trend: "Moderate", color: "text-emerald-700" },
  });

  const handleSimulate = (scenario) => {
    setActiveSimulation(scenario);
    if (scenario === "mandi_shock") {
      setPulseState({
        tomatoes: { price: "₹78–₹85/kg", trend: "▲ Wholesale Surge at Azadpur", color: "text-rose-600" },
        onions: { price: "₹32–₹35/kg", trend: "Steady", color: "text-emerald-700" },
        coriander: { price: "₹25–₹30/bunch", trend: "▲ Rain Scarcity", color: "text-amber-700" },
      });
    } else if (scenario === "evening_clearance") {
      setPulseState({
        tomatoes: { price: "₹45–₹50/kg", trend: "▼ 4 PM Dynamic Clearance", color: "text-blue-600" },
        onions: { price: "₹28–₹30/kg", trend: "▼ Bulk Evening Lot", color: "text-blue-600" },
        coriander: { price: "₹10–₹12/bunch", trend: "▼ Clearance before sunset", color: "text-blue-600" },
      });
    } else {
      setPulseState({
        tomatoes: { price: "₹65–₹72/kg", trend: "Balanced Morning Supply", color: "text-emerald-700" },
        onions: { price: "₹32–₹35/kg", trend: "Steady", color: "text-emerald-700" },
        coriander: { price: "₹18–₹22/bunch", trend: "Moderate", color: "text-emerald-700" },
      });
    }
  };

  return (
    <div className="bg-white border border-[#E5DEC9] rounded-3xl p-6 md:p-8 shadow-xs overflow-hidden">
      {/* Header Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          Criterion 1: The Extraordinary Conceptual Leap (30% Weight)
        </div>
        <span className="text-xs font-bold text-[#8A8A82]">
          Reframing Informal Commerce
        </span>
      </div>

      <div className="max-w-2xl mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-black text-[#1E2022] tracking-tight">
          The Dark Store Fallacy vs. The Bazaar Hive-Mind
        </h2>
        <p className="text-sm text-[#5C6360] mt-2 leading-relaxed">
          Quick-commerce companies spend billions building artificial dark store warehouses, burning venture capital, and locking produce in plastic bags. But a 500-stall bazaar is <strong>already an organic, distributed biological supercomputer</strong>.
        </p>
      </div>

      {/* Side-by-side Architectural Comparison */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {/* Old Model: Centralized Dark Stores */}
        <div className="p-5 rounded-2xl bg-[#F7F4EE] border border-red-200/80 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-800">
              <Building2 className="h-5 w-5" />
              <h3 className="font-bold text-sm">Centralized Dark Stores (Zepto/Blinkit)</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              High Carbon / Fragile
            </span>
          </div>

          <ul className="space-y-2 text-xs text-[#5C6360]">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>\$50M+ Venture Burn:</strong> Expensive warehouse rent & electricity in every pin code.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Single Point of Failure:</strong> Inventory mismatch locks customers out of fresh stock.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Gig Worker Exploitation:</strong> 10-minute delivery racing puts delivery drivers in danger.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Plastic Packaging Waste:</strong> Tons of single-use bags and cling wrap every morning.</span>
            </li>
          </ul>
        </div>

        {/* BazaarMind Model: Decentralized Hive-Mind */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-900">
              <Network className="h-5 w-5 text-emerald-700" />
              <h3 className="font-bold text-sm">BazaarMind: Distributed Neural Network</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Zero Warehouse / Resilient
            </span>
          </div>

          <ul className="space-y-2 text-xs text-emerald-950 font-medium">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>500 Living Human Sensors:</strong> Every vendor already knows their produce, price, and quality.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Zero Hardware or Capital Burn:</strong> No new tablets or screens; uses natural WhatsApp voice notes.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Gemini as the Nervous System:</strong> Multimodal AI turns messy Hindi speech into instant market truth.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Zero Extra Plastic:</strong> Traditional jute bags, direct open-air crates, minimal carbon footprint.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Synapse Simulation Canvas */}
      <div className="p-6 rounded-2xl bg-[#1E2022] text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-[#2C3033] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">
                Live Bazaar Synapse Visualizer · INA Market Nodes
              </h3>
            </div>
            <p className="text-xs text-[#8A8A82] mt-0.5">
              Click scenarios to observe signals pulse through the vendor network to the Market Pulse
            </p>
          </div>

          {/* Scenario Trigger Buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => handleSimulate("normal")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSimulation === "normal"
                  ? "bg-emerald-600 text-white"
                  : "bg-[#2C3033] text-neutral-300 hover:bg-[#383D42]"
              }`}
            >
              Normal Morning Supply
            </button>
            <button
              onClick={() => handleSimulate("mandi_shock")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSimulation === "mandi_shock"
                  ? "bg-rose-600 text-white"
                  : "bg-[#2C3033] text-neutral-300 hover:bg-[#383D42]"
              }`}
            >
              Azadpur Mandi Supply Shock
            </button>
            <button
              onClick={() => handleSimulate("evening_clearance")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSimulation === "evening_clearance"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2C3033] text-neutral-300 hover:bg-[#383D42]"
              }`}
            >
              4 PM Spoilage Clearance
            </button>
          </div>
        </div>

        {/* Dynamic Nodes Graph */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className={`p-3 rounded-xl border transition-all ${activeSimulation === "mandi_shock" ? "bg-rose-950/60 border-rose-500 animate-pulse" : "bg-[#2A2E31] border-[#383D42]"}`}>
            <span className="text-[10px] text-[#8A8A82] block">Node 1 · Stall 14</span>
            <span className="font-bold text-xs text-white">Ramesh (Tomatoes)</span>
            <span className="text-[11px] block mt-1 text-emerald-400 font-mono">
              {activeSimulation === "mandi_shock" ? "Voice: 'Maal mehnga hai!'" : "Reporting: ₹65–₹70"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#2A2E31] border border-[#383D42]">
            <span className="text-[10px] text-[#8A8A82] block">Node 2 · Stall 22</span>
            <span className="font-bold text-xs text-white">Sharma Ji (Onions)</span>
            <span className="text-[11px] block mt-1 text-emerald-400 font-mono">
              Reporting: ₹32–₹35
            </span>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${activeSimulation === "mandi_shock" ? "bg-amber-950/60 border-amber-500 animate-pulse" : "bg-[#2A2E31] border-[#383D42]"}`}>
            <span className="text-[10px] text-[#8A8A82] block">Node 3 · Stall 31</span>
            <span className="font-bold text-xs text-white">Gupta Ji (Greens)</span>
            <span className="text-[11px] block mt-1 text-emerald-400 font-mono">
              {activeSimulation === "mandi_shock" ? "Voice: 'Dhaniya tight'" : "Reporting: ₹20/bunch"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#2A2E31] border border-[#383D42]">
            <span className="text-[10px] text-[#8A8A82] block">Node 4 · Shopper Synapse</span>
            <span className="font-bold text-xs text-white">124 Shoppers Active</span>
            <span className="text-[11px] block mt-1 text-emerald-400 font-mono">
              Corroborating Rates
            </span>
          </div>
        </div>

        {/* Resulting Real-time Market Pulse */}
        <div className="p-4 rounded-xl bg-[#25282B] border border-[#383D42]">
          <div className="flex items-center justify-between text-xs text-[#8A8A82] mb-2 font-mono">
            <span>DETERMINISTIC MARKET PULSE REFLECTION:</span>
            <span className="text-emerald-400 font-bold">SYNAPSE CONSENSUS REACHED</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-[#1E2022] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#8A8A82] block">Tomatoes (टमाटर)</span>
              <span className="text-sm font-bold text-white">{pulseState.tomatoes.price}</span>
              <span className={`text-[10px] block font-semibold ${pulseState.tomatoes.color}`}>
                {pulseState.tomatoes.trend}
              </span>
            </div>

            <div className="bg-[#1E2022] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#8A8A82] block">Onions (प्याज)</span>
              <span className="text-sm font-bold text-white">{pulseState.onions.price}</span>
              <span className={`text-[10px] block font-semibold ${pulseState.onions.color}`}>
                {pulseState.onions.trend}
              </span>
            </div>

            <div className="bg-[#1E2022] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#8A8A82] block">Coriander (धनिया)</span>
              <span className="text-sm font-bold text-white">{pulseState.coriander.price}</span>
              <span className={`text-[10px] block font-semibold ${pulseState.coriander.color}`}>
                {pulseState.coriander.trend}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
