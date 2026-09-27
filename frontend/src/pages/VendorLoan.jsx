import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight,
  Sparkles,
  Zap,
  Building,
  UserCheck,
  Layers,
  ChevronRight,
} from "lucide-react";
import { getVendorLoansOverview, applyVendorLoan, trackEvent } from "../lib/api";
import { PageHeader, SectionLabel, Chip } from "../components/atoms";

export default function VendorLoan() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loanAmount, setLoanAmount] = useState(20000);
  const [tenureDays, setTenureDays] = useState(30);
  const [upiId, setUpiId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disbursedResult, setDisbursedResult] = useState(null);

  useEffect(() => {
    trackEvent("vendor_loan_viewed");
    getVendorLoansOverview("demo-ina").then((res) => {
      setData(res);
      if (res?.vendors?.length > 0) {
        setSelectedVendor(res.vendors[0]);
        setUpiId(res.vendors[0].upi || "");
        setLoanAmount(res.vendors[0].preApprovedLimit || 20000);
      }
      setLoading(false);
    });
  }, []);

  const handleSelectVendor = (v) => {
    setSelectedVendor(v);
    setUpiId(v.upi || "");
    setLoanAmount(v.preApprovedLimit || 20000);
    setDisbursedResult(null);
  };

  const dailyDeduction = Math.round(
    loanAmount / tenureDays + (loanAmount * 0.015) / tenureDays
  );

  const handleApply = async () => {
    if (!upiId) return;
    setSubmitting(true);
    try {
      const res = await applyVendorLoan({
        vendorId: selectedVendor?.vendorId || "v1",
        amount: Number(loanAmount),
        tenureDays: Number(tenureDays),
        upiId: upiId,
        purpose: "Daily Morning Mandi Inventory Purchase",
      });
      setDisbursedResult(res);
      trackEvent("loan_disbursed_success");
    } catch (err) {
      console.error("Loan application error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-10 w-10 border-3 border-[#1E5631] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#1E2022]">Loading Vendor Credit Lines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Vendor Micro-Working Capital"
        subtitle="Unlocking daily inventory cash-flow for INA Market stall holders. Underwritten in real-time by BazaarMind morning presence and price verification signals."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
            LIVE CREDIT ENGINE · RBI-REGULATED NBFC POOL
          </span>
        }
      />

      {/* Top Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5DEC9] rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#8A8A82] uppercase tracking-wider">
            Total Disbursed
          </div>
          <div className="font-display text-2xl font-bold text-[#1E2022] mt-1">
            ₹{data?.totalCreditDisbursed?.toLocaleString("en-IN") || "4,85,000"}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> INA Bazaar Stalls
          </div>
        </div>

        <div className="bg-white border border-[#E5DEC9] rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#8A8A82] uppercase tracking-wider">
            Active Borrowers
          </div>
          <div className="font-display text-2xl font-bold text-[#1E2022] mt-1">
            {data?.activeBorrowers || 18} Stalls
          </div>
          <div className="text-[11px] text-[#5C6360] font-medium mt-1">
            Zero defaults recorded
          </div>
        </div>

        <div className="bg-white border border-[#E5DEC9] rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#8A8A82] uppercase tracking-wider">
            Repayment Rate
          </div>
          <div className="font-display text-2xl font-bold text-[#1E5631] mt-1">
            {data?.repaymentRate || 99.4}%
          </div>
          <div className="text-[11px] text-[#5C6360] font-medium mt-1">
            Daily QR Auto-Settlement
          </div>
        </div>

        <div className="bg-white border border-[#E5DEC9] rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#8A8A82] uppercase tracking-wider">
            Lending Partners
          </div>
          <div className="font-display text-base font-bold text-[#1E2022] mt-1 truncate">
            BharatPe · ICICI NBFC
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            PM SVANidhi Aligned
          </div>
        </div>
      </div>

      {/* Main Grid: Calculator & Vendor Selection */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Vendor Selection & Credit Score */}
        <div className="space-y-4">
          <SectionLabel>Pre-Approved Stall Merchants</SectionLabel>
          <div className="space-y-3">
            {data?.vendors?.map((v) => {
              const isSelected = selectedVendor?.vendorId === v.vendorId;
              return (
                <button
                  key={v.vendorId}
                  onClick={() => handleSelectVendor(v)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-[#1E5631]/5 border-[#1E5631] shadow-xs"
                      : "bg-white border-[#E5DEC9] hover:border-[#1E5631]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1E2022]">
                      {v.vendorName}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Score: {v.creditScore}
                    </span>
                  </div>
                  <div className="text-xs text-[#5C6360] mt-1">{v.stallName}</div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-[#F0EBDE]">
                    <span className="text-[#8A8A82]">Pre-Approved Limit:</span>
                    <span className="font-bold text-[#1E5631]">
                      ₹{v.preApprovedLimit?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#5C6360]">
                    <span>Reporting Consistency:</span>
                    <span className="font-semibold text-emerald-700">
                      {v.morningLogConsistency} ({v.consecutiveDaysReporting} days)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Underwriting Thesis Explainer */}
          <div className="rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9] p-4 text-xs space-y-2">
            <div className="font-bold text-[#1E2022] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#1E5631]" />
              How BazaarMind Alternative Scoring Works
            </div>
            <p className="text-[#5C6360] leading-relaxed">
              Street vendors lack balance sheets. When stall holders report daily morning crate arrivals via voice, our engine verifies their physical presence, trade continuity, and inventory velocity.
            </p>
            <div className="pt-2 border-t border-[#E5DEC9] grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#8A8A82]">Morning Signal Log:</span>
                <span className="block font-bold text-[#1E2022]">35% Weight</span>
              </div>
              <div>
                <span className="text-[#8A8A82]">Price Transparency:</span>
                <span className="block font-bold text-[#1E2022]">25% Weight</span>
              </div>
              <div>
                <span className="text-[#8A8A82]">INA Stalls Longevity:</span>
                <span className="block font-bold text-[#1E2022]">25% Weight</span>
              </div>
              <div>
                <span className="text-[#8A8A82]">Shopper Confirmations:</span>
                <span className="block font-bold text-[#1E2022]">15% Weight</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right Column: Interactive Loan Calculator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E5DEC9] rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-[#F0EBDE]">
              <div>
                <h3 className="font-display text-xl font-bold text-[#1E2022]">
                  Instant Working Capital Disbursal
                </h3>
                <p className="text-xs text-[#5C6360] mt-0.5">
                  Selected Stall: <strong className="text-[#1E2022]">{selectedVendor?.vendorName}</strong> ({selectedVendor?.stallName})
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {selectedVendor?.scoreCategory || "Tier 1 Prime"}
              </span>
            </div>

            {/* Amount Slider */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#1E2022]">
                  Loan Amount (for morning Mandi purchases):
                </label>
                <span className="font-display text-2xl font-extrabold text-[#1E5631]">
                  ₹{Number(loanAmount).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max={selectedVendor?.preApprovedLimit || 40000}
                step="1000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-2 bg-[#E5DEC9] rounded-lg appearance-none cursor-pointer accent-[#1E5631]"
              />
              <div className="flex justify-between text-[11px] text-[#8A8A82]">
                <span>Min: ₹5,000</span>
                <span>Pre-Approved Max: ₹{(selectedVendor?.preApprovedLimit || 40000).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Tenure Options */}
            <div className="mt-6 space-y-3">
              <label className="text-sm font-semibold text-[#1E2022]">
                Repayment Tenure:
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[15, 30, 45, 60].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTenureDays(t)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      tenureDays === t
                        ? "bg-[#1E5631] text-white border-[#1E5631]"
                        : "bg-white border-[#E5DEC9] text-[#1E2022] hover:bg-[#F7F4EE]"
                    }`}
                  >
                    {t} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Deduction Card */}
            <div className="mt-6 rounded-2xl bg-[#1E5631]/8 border border-[#1E5631]/20 p-5 grid sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#5C6360] font-semibold">
                  Daily Micro-Repayment
                </span>
                <div className="font-display text-2xl font-bold text-[#1E5631] mt-0.5">
                  ₹{dailyDeduction}
                  <span className="text-xs font-normal text-[#5C6360]">/day</span>
                </div>
                <span className="text-[10px] text-[#8A8A82]">
                  Auto-settled via merchant UPI QR
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#5C6360] font-semibold">
                  Flat Interest
                </span>
                <div className="font-display text-xl font-bold text-[#1E2022] mt-0.5">
                  1.5%
                  <span className="text-xs font-normal text-[#5C6360]">/month</span>
                </div>
                <span className="text-[10px] text-[#8A8A82]">
                  No hidden processing charges
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#5C6360] font-semibold">
                  Disbursal Speed
                </span>
                <div className="font-display text-xl font-bold text-emerald-800 mt-0.5">
                  &lt; 90 Seconds
                </div>
                <span className="text-[10px] text-[#8A8A82]">
                  Direct UPI transfer to vendor
                </span>
              </div>
            </div>

            {/* UPI ID Input */}
            <div className="mt-6 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5C6360]">
                Vendor Merchant UPI ID (for instant transfer):
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. vendor.stall@okaxis"
                  className="flex-1 rounded-xl border border-[#E5DEC9] px-4 py-2.5 text-sm bg-white font-mono focus:outline-none focus:border-[#1E5631]"
                />
                <button
                  onClick={handleApply}
                  disabled={submitting || !upiId}
                  className="px-6 py-2.5 rounded-xl bg-[#1E5631] text-[#FDFBF7] font-semibold text-sm hover:bg-[#194727] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Disbursing...
                    </>
                  ) : (
                    <>
                      Claim ₹{Number(loanAmount).toLocaleString("en-IN")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Disbursal Receipt Modal / Success Notification */}
            <AnimatePresence>
              {disbursedResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900"
                >
                  <div className="flex items-center gap-2 mb-2 font-bold text-base text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Capital Disbursed Successfully!
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs mt-3 bg-white/70 p-3 rounded-xl">
                    <div>
                      <span className="text-[#8A8A82]">Transaction UTR:</span>
                      <span className="block font-mono font-bold text-[#1E2022]">
                        {disbursedResult.utrNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A8A82]">Loan ID:</span>
                      <span className="block font-mono font-bold text-[#1E2022]">
                        {disbursedResult.loanId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A8A82]">Disbursed Amount:</span>
                      <span className="block font-bold text-emerald-800">
                        ₹{disbursedResult.disbursedAmount?.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A8A82]">Daily UPI Auto-Deduction:</span>
                      <span className="block font-bold text-[#1E2022]">
                        ₹{disbursedResult.dailyDeduction}/day for {disbursedResult.tenureDays} days
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-3 font-medium">
                    Funds credited to <strong>{disbursedResult.upiId}</strong>. Daily repayment of ₹{disbursedResult.dailyDeduction} will automatically deduct from tomorrow morning's UPI customer QR payments.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active INA Stall Working Capital Loans */}
          <div className="bg-white border border-[#E5DEC9] rounded-2xl p-5 shadow-xs">
            <SectionLabel className="mb-3">Live Active Loan Repayments · INA Market</SectionLabel>
            <div className="divide-y divide-[#F0EBDE]">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#1E2022]">
                    Subhash Chand & Sons · Stall #22
                  </div>
                  <div className="text-xs text-[#5C6360]">
                    ₹15,000 Mandi Loan · Disbursed Sep 15 · 30-Day Cycle
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ₹525/day ON TRACK
                  </span>
                  <div className="text-xs text-[#8A8A82] mt-0.5">
                    Remaining: ₹4,725
                  </div>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#1E2022]">
                    Khan Fresh Fruits · Stall #09
                  </div>
                  <div className="text-xs text-[#5C6360]">
                    ₹20,000 Apple Crate Financing · Disbursed Sep 10 · 30-Day Cycle
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ₹700/day ON TRACK
                  </span>
                  <div className="text-xs text-[#8A8A82] mt-0.5">
                    Remaining: ₹3,100
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
