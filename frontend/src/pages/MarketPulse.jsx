import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ShieldCheck, RotateCcw, X, Layers, Store, Users, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { getMarketPulse, trackEvent, resetDemo } from "../lib/api";
import { useApp } from "../context/AppContext";
import SignalCard from "../components/SignalCard";
import { CardSkeleton } from "../components/Loading";
import { SectionLabel, DemoNote } from "../components/atoms";

export default function MarketPulse() {
  const { marketId, setMarketId, pulseVersion, refreshPulse, dataSource, currentMarket } = useApp();
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getMarketPulse(marketId, dataSource)
      .then(setPulse)
      .catch(() => setPulse(null))
      .finally(() => setLoading(false));
  }, [marketId, dataSource]);

  useEffect(() => {
    load();
    trackEvent("market_pulse_viewed");
  }, [load, pulseVersion]);

  const handleResetDemo = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetDemo();
      refreshPulse();
      trackEvent("demo_reset_clicked");
    } catch {
      alert("Failed to reset demo market state.");
    } finally {
      setResetting(false);
    }
  };

  const isDemo = dataSource === "DEMO" || pulse?.dataSource === "DEMO";

  return (
    <div>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <SectionLabel>Today's Market Pulse</SectionLabel>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[#1E2022] mt-1">
            {pulse?.market?.name || "INA MARKET — BAZAARMIND DEMO"}
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6360] mt-1">
            Last updated {pulse?.lastUpdated || "recently"} · {pulse?.totalSignals ?? pulse?.activeSignalsCount ?? 0} local signals combined
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {pulse && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E5DEC9] px-3 py-1.5 text-xs font-semibold text-[#1E2022] shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1E5631]" />
              Confidence: {pulse.overallConfidence || "High"}
            </span>
          )}

          {isDemo && (
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              title="Reset the demo market to clean initial state"
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E5DEC9] px-3 py-1.5 text-xs font-medium text-[#B4571E] hover:bg-[#F7F4EE] transition-colors shadow-2xs disabled:opacity-50"
            >
              <RotateCcw className={`h-3 w-3 ${resetting ? "animate-spin" : ""}`} />
              Reset Demo State
            </button>
          )}

          <button
            onClick={load}
            data-testid="refresh-pulse-button"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1E5631] text-[#FDFBF7] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#194727] transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Switch to Flagship Prototype Demo callout */}
      {marketId !== "demo-ina" && (
        <div className="mt-3.5 rounded-2xl bg-[#EAF4ED] border border-[#B7CDBD] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-[#1E5631]">
            <span className="font-bold">Viewing {currentMarket?.name || "Discovery Market"}.</span> This market is in discovery mode awaiting local vendor signals. Switch to the flagship prototype demo to test with 11 live tracked items and 4 independent stalls.
          </div>
          <button
            onClick={() => setMarketId("demo-ina")}
            className="shrink-0 rounded-full bg-[#1E5631] text-white px-4 py-2 font-bold hover:bg-[#194727] transition-colors"
          >
            Switch to INA Demo Market
          </button>
        </div>
      )}

      {/* Demo Market Disclaimer Banner */}
      <div className="mt-3.5 rounded-xl bg-[#D96B27]/8 border border-[#D96B27]/20 px-4 py-2.5">
        <DemoNote className="not-italic text-[#B4571E] font-medium text-xs leading-relaxed">
          {isDemo
            ? "DEMO MARKET · Illustrative synthetic data — not live market data. Values demonstrate how BazaarMind aggregates natural vendor & shopper signals. No real commercial traction claimed."
            : "PILOT DATA · Grounded strictly in authentic signals contributed by onboarded local pilot participants."}
        </DemoNote>
      </div>

      {/* Grid of Product Signal Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {loading && !pulse
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : (Array.isArray(pulse?.products) ? pulse.products : []).map((p, i) => (
              <SignalCard
                key={p.product}
                p={p}
                index={i}
                onViewEvidence={(product) => setSelectedProduct(product)}
              />
            ))}
      </div>

      {/* Empty State for Markets with No Signals */}
      {!loading && pulse && Array.isArray(pulse?.products) && pulse.products.length === 0 && (
        <div className="mt-12 rounded-3xl bg-white border border-[#E5DEC9] p-8 text-center max-w-lg mx-auto shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-[#1E5631]/10 text-[#1E5631] flex items-center justify-center mx-auto mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#1E2022]">Market Discovered</h3>
          <p className="text-sm text-[#5C6360] mt-2">
            BazaarMind doesn't have enough local signals in this neighborhood market yet.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setMarketId("demo-ina")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1E5631] text-white text-xs font-semibold hover:bg-[#194727] transition-colors"
            >
              Explore INA Demo Market
            </button>
            <a
              href="/vendor"
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#E5DEC9] text-[#1E2022] text-xs font-semibold hover:bg-[#F7F4EE] transition-colors inline-flex items-center justify-center gap-1"
            >
              Be the first to contribute <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Footer Grounding Statement */}
      <p className="mt-8 text-xs text-[#8A8A82] text-center max-w-xl mx-auto leading-relaxed">
        Prices shown are reported observations from participating stalls, never guaranteed official prices. BazaarMind never ranks a "cheapest vendor" or endorses one stall over another. Gemini interprets messy conversations — humans decide.
      </p>

      {/* Evidence Traceability Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <EvidenceModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EvidenceModal({ product, onClose }) {
  const evidenceList = product.evidence || product.evidenceSignals || [];
  const stalls = product.independentStallsCount || product.independentVendors || product.vendorObservations || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg max-h-[85vh] bg-white border border-[#E5DEC9] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DEC9] bg-[#FDFBF7]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E5631]">Evidence Trace</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1E5631]/10 text-[#1E5631] font-semibold">
                {product.confidence} Confidence
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1E2022] mt-0.5">
              {product.product}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#F7F4EE] hover:bg-[#E5DEC9] flex items-center justify-center text-[#5C6360] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Stats Bar */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-[#F7F4EE] border-b border-[#E5DEC9] text-xs">
          <div>
            <span className="text-[#8A8A82] block text-[10px] uppercase">Observed Price</span>
            <span className="font-bold text-[#1E2022]">{product.reportedPriceSignal || "None"}</span>
          </div>
          <div>
            <span className="text-[#8A8A82] block text-[10px] uppercase">Stalls Diversity</span>
            <span className="font-bold text-[#1E2022]">{stalls} stalls</span>
          </div>
          <div>
            <span className="text-[#8A8A82] block text-[10px] uppercase">Total Signals</span>
            <span className="font-bold text-[#1E2022]">{product.signalCount || evidenceList.length || 0}</span>
          </div>
        </div>

        {/* Modal Content / Signals List */}
        <div className="flex-1 overflow-y-auto bm-scroll p-6 space-y-3">
          <div className="text-xs font-semibold text-[#5C6360] uppercase tracking-wide mb-1">
            Source Observations Backing this Card:
          </div>

          {evidenceList.length > 0 ? (
            evidenceList.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className="rounded-2xl border border-[#E5DEC9] p-3.5 bg-[#FDFBF7] text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1E2022]">
                    {ev.source === "VENDOR" ? (
                      <>
                        <Store className="h-3 w-3 text-[#1E5631]" />
                        {ev.vendorName || "Neighborhood Vendor"}
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 text-[#2D6A4F]" />
                        Shopper Demand Signal
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-[#8A8A82] flex items-center gap-1 font-mono">
                    <Clock className="h-2.5 w-2.5" />
                    {ev.timeAgo || "today"}
                  </span>
                </div>

                {ev.observedValue && (
                  <div className="font-medium text-[#1E5631] text-[11px] bg-white px-2.5 py-1 rounded-lg border border-[#E5DEC9]/80 inline-block">
                    {ev.observedValue}
                  </div>
                )}

                {ev.rawText && (
                  <p className="text-[11.5px] text-[#3A403D] italic bg-white/60 p-2 rounded-lg border border-[#E5DEC9]/50">
                    "{ev.rawText}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-[#8A8A82] pt-1">
                  <span>Confidence: {ev.confidence || "MEDIUM"}</span>
                  <span className="font-mono">{ev.dataSource || "DEMO"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-[#8A8A82] bg-[#FDFBF7] rounded-xl border border-[#E5DEC9]">
              Aggregated from verified stall observations. Details are refreshed periodically.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E5DEC9] bg-[#FDFBF7] flex items-center justify-between text-[11px] text-[#5C6360]">
          <span>Grounded deterministic aggregation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#1E5631] text-white font-semibold text-xs hover:bg-[#194727] transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
