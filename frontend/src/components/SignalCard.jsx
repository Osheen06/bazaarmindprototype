import React from "react";
import { motion } from "framer-motion";
import { Boxes, TrendingUp, IndianRupee, Users, Store, Clock, AlertTriangle, Layers, ArrowRight } from "lucide-react";
import { AvailabilityPill, DemandPill, ConfidenceBadge } from "./atoms";

export default function SignalCard({ p, index = 0, onViewEvidence }) {
  const stalls = p.independentStallsCount || p.independentVendors || p.vendorObservations || 1;

  return (
    <motion.div
      data-testid="market-pulse-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="bg-white border border-[#E5DEC9] rounded-2xl p-5 shadow-[0_1px_2px_rgba(30,32,34,0.04)] hover:shadow-[0_8px_28px_rgba(30,32,34,0.08)] transition-all flex flex-col justify-between"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1E2022]">{p.product}</h3>
            <span className="text-[11px] text-[#5C6360]">
              {stalls} independent {stalls === 1 ? "stall" : "stalls"} reported
            </span>
          </div>
          <ConfidenceBadge level={p.confidence} />
        </div>

        {/* Availability & Demand */}
        <div className="grid grid-cols-2 gap-3 mt-3.5">
          <Field icon={Boxes} label="Availability">
            <AvailabilityPill value={p.availability} />
          </Field>
          <Field icon={TrendingUp} label="Demand">
            <DemandPill value={p.demand} />
          </Field>
        </div>

        {/* Observed Price Signal Box */}
        <div className="mt-3.5 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9] px-3.5 py-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide uppercase text-[#5C6360]">
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" /> Observed Price Range
            </span>
            <span className="text-[10px] text-[#8A8A82] lowercase">reported signals</span>
          </div>
          <div className="font-display text-xl font-bold text-[#1E2022] mt-0.5">
            {p.reportedPriceSignal || "No price reported today"}
          </div>
          <div className="text-[10.5px] text-[#8A8A82] mt-0.5">
            Observed across neighborhood stalls · Not an official price
          </div>
        </div>

        {/* Conflicts Note if any */}
        {p.conflicting && (
          <div className="mt-2.5 rounded-lg bg-[#D96B27]/10 border border-[#D96B27]/25 px-2.5 py-1.5 flex items-center gap-2 text-xs text-[#B4571E]">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px]">
              {p.conflictNote || "Vendors are reporting varying stock conditions."}
            </span>
          </div>
        )}

        {/* Stale Warning if any */}
        {p.isStale && p.staleWarning && (
          <div className="mt-2 rounded-lg bg-yellow-50 border border-yellow-200 px-2.5 py-1.5 flex items-center gap-2 text-xs text-yellow-800">
            <Clock className="h-3.5 w-3.5 shrink-0 text-yellow-600" />
            <span className="text-[11px]">{p.staleWarning}</span>
          </div>
        )}
      </div>

      {/* Card Footer with Evidence CTA */}
      <div className="mt-4 pt-3 border-t border-[#E5DEC9] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-[#5C6360]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <Store className="h-3.5 w-3.5 text-[#1E5631]" />
              {p.vendorObservations || 0} vendor
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <Users className="h-3.5 w-3.5 text-[#2D6A4F]" />
              {p.shopperSignals || 0} shopper
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#8A8A82]">
            <Clock className="h-3 w-3" />
            {p.lastUpdated || "today"}
          </span>
        </div>

        {/* Trace Evidence Button */}
        <button
          onClick={() => onViewEvidence && onViewEvidence(p)}
          className="w-full mt-1 py-1.5 px-3 rounded-lg bg-white border border-[#E5DEC9] hover:bg-[#F7F4EE] hover:border-[#1E5631]/40 text-[#1E5631] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>View evidence signals ({p.signalCount || (p.vendorObservations + p.shopperSignals) || 0})</span>
          <ArrowRight className="h-3 w-3 opacity-60" />
        </button>
      </div>
    </motion.div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-[#5C6360] mb-1">
        <Icon className="h-3 w-3 text-[#1E5631]" /> {label}
      </div>
      {children}
    </div>
  );
}
