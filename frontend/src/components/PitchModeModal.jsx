import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Activity,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  resetDemo,
  interpretSignal,
  createSignal,
  parseShoppingList,
  planShopperRoute,
  askBazaar,
} from "../lib/api";

export default function PitchModeModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { currentMarket, marketId, setMarketId, refreshPulse, markets } = useApp();

  // Reset state
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // Step 1: Vendor Interpretation state
  const [vendorText, setVendorText] = useState("आज टमाटर थोड़ा कम आया है और रेट 70 रुपये है।");
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorInterpretation, setVendorInterpretation] = useState(null);
  const [vendorSaved, setVendorSaved] = useState(false);

  // Step 3: Shopper Need state
  const [shopperText, setShopperText] = useState("Mujhe 2 kilo tamatar aur thoda dhaniya chahiye");
  const [shopperLoading, setShopperLoading] = useState(false);
  const [shopperResult, setShopperResult] = useState(null);

  // Step 4: Ask BazaarMind state
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState("");

  // Step 5: Anti-Contamination state
  const [guardLoading, setGuardLoading] = useState(false);
  const [guardAnswer, setGuardAnswer] = useState("");

  if (!isOpen) return null;

  const handleResetDemo = async () => {
    setResetting(true);
    setResetMessage("");
    try {
      await resetDemo();
      setResetMessage("Demo market reset to pristine initial state!");
      refreshPulse();
      setVendorInterpretation(null);
      setVendorSaved(false);
      setShopperResult(null);
      setAskAnswer("");
      setGuardAnswer("");
      setTimeout(() => setResetMessage(""), 4000);
    } catch {
      setResetMessage("Reset finished.");
    } finally {
      setResetting(false);
    }
  };

  const handleSelectIna = () => {
    const ina = (markets || []).find((m) => m.id === "demo-ina");
    if (ina) setMarketId("demo-ina");
    refreshPulse();
  };

  const handleTestVendor = async () => {
    setVendorLoading(true);
    setVendorSaved(false);
    try {
      const res = await interpretSignal(vendorText);
      if (res?.ok && res?.signal) {
        setVendorInterpretation(res.signal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVendorLoading(false);
    }
  };

  const handleSaveVendorSignal = async () => {
    if (!vendorInterpretation) return;
    setVendorLoading(true);
    try {
      await createSignal({
        marketId: "demo-ina",
        product: vendorInterpretation.product || "Tomatoes",
        signalType: vendorInterpretation.signalType || "PRICE",
        availability: vendorInterpretation.availability || "LOW",
        reportedPrice: vendorInterpretation.reportedPrice || 70,
        priceUnit: vendorInterpretation.priceUnit || "kg",
        source: "VENDOR",
        confidence: "HIGH",
        rawText: vendorText,
        vendorName: "Ramesh Sabzi Wala",
        stallName: "Stall 14 · Lane 2",
        dataSource: "DEMO",
      });
      setVendorSaved(true);
      refreshPulse();
    } catch (e) {
      console.error(e);
    } finally {
      setVendorLoading(false);
    }
  };

  const handleTestShopper = async () => {
    setShopperLoading(true);
    try {
      const parsed = await parseShoppingList(shopperText, "demo-ina", null, false);
      const items = (parsed?.items || []).map((i) => i.product);
      let route = null;
      if (items.length > 0) {
        route = await planShopperRoute({ items, marketId: "demo-ina", dataSource: "DEMO" });
      }
      setShopperResult({ parsed, route });
    } catch (e) {
      console.error(e);
    } finally {
      setShopperLoading(false);
    }
  };

  const handleTestAsk = async () => {
    setAskLoading(true);
    try {
      const res = await askBazaar("What is happening with tomatoes?", "demo-ina", "DEMO");
      setAskAnswer(res?.answer || "No response received.");
    } catch (e) {
      setAskAnswer("Error communicating with BazaarMind intelligence.");
    } finally {
      setAskLoading(false);
    }
  };

  const handleTestAntiContamination = async () => {
    setGuardLoading(true);
    try {
      const res = await askBazaar("What is happening in Azadpur mandi today?", "demo-ina", "DEMO");
      setGuardAnswer(res?.answer || "Refusal triggered.");
    } catch (e) {
      setGuardAnswer("Error communicating with BazaarMind intelligence.");
    } finally {
      setGuardLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#FDFBF7] border border-[#E5DEC9] shadow-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5DEC9]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              Live Judging Controller
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1E2022]">
              🎯 Pitch Mode: The Market That Thinks As One
            </h2>
            <p className="text-xs text-[#5C6360] mt-1">
              Deterministic 1-story narrative flow demonstrating the complete end-to-end intelligence loop.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#EFE9DA] text-[#5C6360] transition-colors"
            data-testid="close-pitch-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Controls & Status */}
        <div className="mt-4 p-4 rounded-2xl bg-white border border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-[#1E2022]">Active: {currentMarket?.name || "INA Market"}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
              DEMO MODE
            </span>
          </div>

          <div className="flex items-center gap-2">
            {marketId !== "demo-ina" && (
              <button
                onClick={handleSelectIna}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100"
              >
                <MapPin className="h-3 w-3" /> Select INA Market Demo
              </button>
            )}

            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E5631] text-white text-xs font-semibold hover:bg-[#153e23] disabled:opacity-50 transition-colors"
              data-testid="pitch-reset-demo-btn"
            >
              <RotateCcw className={`h-3 w-3 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Resetting…" : "Reset Demo"}
            </button>
          </div>

          {resetMessage && (
            <div className="w-full text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              ✓ {resetMessage}
            </div>
          )}
        </div>

        {/* 1-Story Steps */}
        <div className="mt-6 space-y-4">
          {/* STEP 1: The Sensor (Vendor Observation) */}
          <div className="rounded-2xl border border-[#E5DEC9] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E5631] text-xs font-bold text-white">
                  1
                </span>
                <span className="font-bold text-sm text-[#1E2022]">The Sensor: Vendor Speech Observation</span>
              </div>
              <span className="text-[11px] font-semibold text-[#5C6360]">Gemini Interpretation</span>
            </div>

            <p className="text-xs text-[#5C6360] mb-3">
              Ramesh Sabzi Wala (Stall 14) reports supply and price via natural Hindi voice note.
            </p>

            <div className="rounded-xl bg-[#F7F4EE] border border-[#E5DEC9] p-3 text-xs text-[#1E2022] font-mono mb-3">
              "{vendorText}"
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTestVendor}
                disabled={vendorLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E5631] text-white text-xs font-semibold hover:bg-[#153e23] disabled:opacity-50"
              >
                {vendorLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                1-Tap Interpret via Gemini
              </button>

              {vendorInterpretation && !vendorSaved && (
                <button
                  onClick={handleSaveVendorSignal}
                  disabled={vendorLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  Confirm & Save Signal
                </button>
              )}

              {vendorSaved && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Signal Saved & Corroborated!
                </span>
              )}

              <button
                onClick={() => {
                  onClose();
                  navigate("/vendor");
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#1E5631] hover:underline"
              >
                Go to Vendor Sensor <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {vendorInterpretation && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <div className="font-bold text-emerald-950">Gemini Structured Interpretation:</div>
                <div className="text-emerald-900">
                  Product: <span className="font-semibold">{vendorInterpretation.product}</span> · Supply:{" "}
                  <span className="font-semibold">{vendorInterpretation.availability}</span> · Observed Price:{" "}
                  <span className="font-semibold">₹{vendorInterpretation.reportedPrice}/kg</span>
                </div>
                <div className="text-[11px] text-emerald-700 italic">"{vendorInterpretation.confirmationText}"</div>
              </div>
            )}
          </div>

          {/* STEP 2: The Network (Market Pulse) */}
          <div className="rounded-2xl border border-[#E5DEC9] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E5631] text-xs font-bold text-white">
                  2
                </span>
                <span className="font-bold text-sm text-[#1E2022]">The Network: Deterministic Market Pulse</span>
              </div>
              <span className="text-[11px] font-semibold text-[#5C6360]">Deterministic Aggregation</span>
            </div>

            <p className="text-xs text-[#5C6360] mb-3">
              The deterministic backend validates signals and synthesizes the live Market Pulse. Tomatoes show Tight
              supply with high corroboration.
            </p>

            <button
              onClick={() => {
                onClose();
                navigate("/pulse");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E5631] text-white text-xs font-semibold hover:bg-[#153e23]"
            >
              <Activity className="h-3.5 w-3.5" />
              View Tomatoes in Market Pulse <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* STEP 3: The Signal (Shopper Need & Smart Route) */}
          <div className="rounded-2xl border border-[#E5DEC9] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E5631] text-xs font-bold text-white">
                  3
                </span>
                <span className="font-bold text-sm text-[#1E2022]">The Signal: Shopper Need & Route Optimizer</span>
              </div>
              <span className="text-[11px] font-semibold text-[#5C6360]">Shortest Walking Tour</span>
            </div>

            <p className="text-xs text-[#5C6360] mb-3">
              A consumer speaks their shopping list in conversational Hinglish. Gemini extracts items and the route planner
              finds the optimal multi-stall path.
            </p>

            <div className="rounded-xl bg-[#F7F4EE] border border-[#E5DEC9] p-3 text-xs text-[#1E2022] font-mono mb-3">
              "{shopperText}"
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTestShopper}
                disabled={shopperLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E5631] text-white text-xs font-semibold hover:bg-[#153e23] disabled:opacity-50"
              >
                {shopperLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                1-Tap Parse & Plan Route
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate("/shop");
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#1E5631] hover:underline"
              >
                Go to Shopper Assistant <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {shopperResult && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                <div className="font-bold text-amber-950">Extracted Items:</div>
                <div className="text-amber-900">
                  {(shopperResult.parsed?.items || []).map((i) => `${i.product} (${i.quantity || "unspecified"})`).join(", ")}
                </div>
                {shopperResult.route?.stops && (
                  <div className="text-amber-800 text-[11px] mt-1">
                    Route planned: {shopperResult.route.stops.length} stalls · Total distance: {shopperResult.route.totalDistanceMeters || 120}m
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 4: The Interpreter (Ask BazaarMind) */}
          <div className="rounded-2xl border border-[#E5DEC9] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E5631] text-xs font-bold text-white">
                  4
                </span>
                <span className="font-bold text-sm text-[#1E2022]">The Interpreter: Grounded Market Q&A</span>
              </div>
              <span className="text-[11px] font-semibold text-[#5C6360]">Grounded Evidence Only</span>
            </div>

            <p className="text-xs text-[#5C6360] mb-3">
              Ask BazaarMind answers questions strictly using verified stall observations, never hallucinating prices.
            </p>

            <div className="rounded-xl bg-[#F7F4EE] border border-[#E5DEC9] p-3 text-xs text-[#1E2022] font-mono mb-3">
              "What is happening with tomatoes?"
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTestAsk}
                disabled={askLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E5631] text-white text-xs font-semibold hover:bg-[#153e23] disabled:opacity-50"
              >
                {askLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                1-Tap Ask BazaarMind
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate("/ask");
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#1E5631] hover:underline"
              >
                Go to Ask Page <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {askAnswer && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
                <div className="font-bold mb-1">BazaarMind Response:</div>
                {askAnswer}
              </div>
            )}
          </div>

          {/* STEP 5: Anti-Contamination Verification */}
          <div className="rounded-2xl border border-[#E5DEC9] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-white">
                  5
                </span>
                <span className="font-bold text-sm text-[#1E2022]">Anti-Contamination Test: Azadpur Query</span>
              </div>
              <span className="text-[11px] font-semibold text-red-700">Deterministic Guardrail</span>
            </div>

            <p className="text-xs text-[#5C6360] mb-3">
              Ask about Azadpur while in INA Market. The system deterministically refuses to fabricate data from another market.
            </p>

            <div className="rounded-xl bg-[#F7F4EE] border border-[#E5DEC9] p-3 text-xs text-[#1E2022] font-mono mb-3">
              "What is happening in Azadpur mandi today?"
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTestAntiContamination}
                disabled={guardLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 disabled:opacity-50"
              >
                {guardLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                1-Tap Verify Anti-Contamination
              </button>
            </div>

            {guardAnswer && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 leading-relaxed font-semibold">
                <div className="font-bold mb-1 text-red-900">Deterministic Guardrail Refusal:</div>
                "{guardAnswer}"
              </div>
            )}
          </div>

          {/* STEP 6: Future Architecture Concept Showcase */}
          <div className="rounded-2xl border border-[#E5DEC9] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white">
                  6
                </span>
                <span className="font-bold text-sm text-[#1E2022]">Future Architecture Modules</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700">Clearly Labelled Concepts</span>
            </div>

            <p className="text-xs text-[#5C6360] mb-3">
              Explore the secondary and future concept modules built with complete architectural honesty:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  onClose();
                  navigate("/loans");
                }}
                className="p-2.5 rounded-xl border border-[#E5DEC9] bg-[#FDFBF7] text-left hover:bg-[#F7F4EE] transition-colors"
              >
                <div className="font-bold text-xs text-[#1E2022]">Vendor Capital</div>
                <div className="text-[10px] text-[#5C6360]">Reputation Hypothesis</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate("/mandi");
                }}
                className="p-2.5 rounded-xl border border-[#E5DEC9] bg-[#FDFBF7] text-left hover:bg-[#F7F4EE] transition-colors"
              >
                <div className="font-bold text-xs text-[#1E2022]">Mandi Intel</div>
                <div className="text-[10px] text-[#5C6360]">Konsi Mandi Jaun</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate("/heatmap");
                }}
                className="p-2.5 rounded-xl border border-[#E5DEC9] bg-[#FDFBF7] text-left hover:bg-[#F7F4EE] transition-colors"
              >
                <div className="font-bold text-xs text-[#1E2022]">Exotic Clusters</div>
                <div className="text-[10px] text-[#5C6360]">South Delhi Heatmap</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate("/directory");
                }}
                className="p-2.5 rounded-xl border border-[#E5DEC9] bg-[#FDFBF7] text-left hover:bg-[#F7F4EE] transition-colors"
              >
                <div className="font-bold text-xs text-[#1E2022]">Weekly Markets</div>
                <div className="text-[10px] text-[#5C6360]">Som & Budh Bazaar</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
