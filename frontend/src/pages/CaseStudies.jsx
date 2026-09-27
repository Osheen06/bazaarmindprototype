import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  Store,
  Calendar,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";
import { SectionLabel, Chip } from "../components/atoms";

export default function CaseStudies() {
  const pilotQuestions = [
    {
      q: "Are signals frequent enough?",
      metric: "Target: ≥ 1 signal per participating stall / day",
      testMethod: "Voice-first 1-tap submission via browser or WhatsApp audio without text typing.",
    },
    {
      q: "Are extracted signals accurate?",
      metric: "Target: ≥ 95% semantic extraction accuracy",
      testMethod: "Gemini structured extraction cross-checked against vendor confirmation edits.",
    },
    {
      q: "Is market information fresh?",
      metric: "Target: < 2 hours signal latency during morning rush",
      testMethod: "Continuous decay tracking and stale warning flags for signals > 12 hours old.",
    },
    {
      q: "Do shoppers return to check Market Pulse?",
      metric: "Target: ≥ 40% 7-day repeat visit rate",
      testMethod: "Shoppers verifying availability and observed price ranges before leaving home.",
    },
    {
      q: "Do vendors find demand intelligence useful?",
      metric: "Target: Qualitative validation & repeat contribution",
      testMethod: "Vendors checking 'Today's Shopper Demand' panel to adjust morning mandi stocking.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-[#E5DEC9]">
        <div>
          <div className="flex items-center gap-2">
            <SectionLabel>Research & Pilots</SectionLabel>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#D96B27]/10 text-[#B4571E] font-semibold border border-[#D96B27]/25">
              MODULE 13 · DEMO / ILLUSTRATIVE
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[#1E2022] mt-1">
            Pilot Case Studies & Field Trials
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6360] mt-1 max-w-2xl leading-relaxed">
            Methodology, hypotheses, and experimental protocol for BazaarMind's initial neighbourhood market trials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Chip tone="green">
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              Honest Scientific Standard
            </span>
          </Chip>
        </div>
      </div>

      {/* Mandatory Honest Standard Banner */}
      <div className="rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9] p-5 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E5631]">
          <Info className="h-4 w-4" />
          Case Study Disclosure Standard
        </div>
        <p className="text-sm font-semibold text-[#1E2022]">
          "Case studies will appear after our first real-world pilots."
        </p>
        <p className="text-xs text-[#5C6360] leading-relaxed">
          BazaarMind never fabricates testimonials, customer quotes, or commercial traction. Below is our clearly-labelled <strong>DEMO CASE STUDY (Illustrative)</strong> detailing the precise experimental protocol for our upcoming 14-day field pilot.
        </p>
      </div>

      {/* Illustrative Demo Case Study */}
      <div className="bg-white border border-[#E5DEC9] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-2 pb-4 border-b border-[#F0EBDE]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1E5631]/10 text-[#1E5631]">
              ILLUSTRATIVE / DEMO CASE STUDY
            </span>
            <h2 className="font-display text-2xl font-bold text-[#1E2022] mt-2">
              The 14-Day INA Market Hyperlocal Pilot Protocol
            </h2>
            <p className="text-xs text-[#5C6360] mt-0.5">
              Protocol Location: Green Meadows RWA & INA Market (South Delhi)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#1E5631] bg-[#EAF4ED] px-3 py-1.5 rounded-xl border border-[#1E5631]/20">
            Cohort: 20 Households · 15 Vendors · 14 Days
          </div>
        </div>

        {/* 3 Step Protocol Setup */}
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5DEC9]">
            <div className="h-8 w-8 rounded-xl bg-[#1E5631]/10 text-[#1E5631] flex items-center justify-center font-bold mb-2">
              1
            </div>
            <h3 className="font-bold text-[#1E2022]">1 Community (RWA)</h3>
            <p className="text-[#5C6360] mt-1 leading-relaxed">
              20 participating households submit natural-language grocery needs in Hindi, Hinglish, or English before leaving home.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5DEC9]">
            <div className="h-8 w-8 rounded-xl bg-[#1E5631]/10 text-[#1E5631] flex items-center justify-center font-bold mb-2">
              2
            </div>
            <h3 className="font-bold text-[#1E2022]">1 Local Market (15 Stalls)</h3>
            <p className="text-[#5C6360] mt-1 leading-relaxed">
              15 fruit and vegetable vendors share spoken observations (arrivals, scarcity, observed price) via 1-tap audio.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5DEC9]">
            <div className="h-8 w-8 rounded-xl bg-[#1E5631]/10 text-[#1E5631] flex items-center justify-center font-bold mb-2">
              3
            </div>
            <h3 className="font-bold text-[#1E2022]">14-Day Duration</h3>
            <p className="text-[#5C6360] mt-1 leading-relaxed">
              Measuring signal frequency, corroboration rate, price range stability, and mutual value delivered to both sides.
            </p>
          </div>
        </div>

        {/* 5 Core Research Questions Tested */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E5631] mb-3">
            Core Empirical Hypotheses Tested in the Pilot
          </h3>
          <div className="space-y-3">
            {pilotQuestions.map((pq, idx) => (
              <div
                key={pq.q}
                className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-[#1E2022] flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-white text-[#1E5631] text-[11px] flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    {pq.q}
                  </div>
                  <p className="text-[#5C6360] mt-1 ml-6.5">{pq.testMethod}</p>
                </div>

                <span className="sm:shrink-0 text-[11px] font-semibold text-[#1E5631] bg-white px-3 py-1 rounded-full border border-[#E5DEC9]">
                  {pq.metric}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#F0EBDE] flex items-center justify-between text-xs text-[#8A8A82]">
          <span>Pilot Coordinator: BazaarMind Field Operations Unit</span>
          <a
            href="/join"
            className="inline-flex items-center gap-1 font-semibold text-[#1E5631] hover:underline"
          >
            Launch Onboarding Flow <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
