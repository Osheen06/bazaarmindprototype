import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Radio, Network, Store, Users, Sparkles, MessageSquare, Mic, ShieldCheck, ChevronDown } from "lucide-react";
import { trackEvent } from "../lib/api";

export default function Landing() {
  const navigate = useNavigate();
  useEffect(() => { trackEvent("landing_viewed"); }, []);

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] bm-noise">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#1E5631] flex items-center justify-center shadow-sm">
            <Network className="h-5 w-5 text-[#FDFBF7]" />
          </div>
          <div>
            <span className="font-display font-extrabold text-[#1E2022] tracking-tight text-lg">BazaarMind</span>
            <span className="block text-[10px] text-[#5C6360] uppercase tracking-wider">Neighborhood Market Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D96B27]/10 border border-[#D96B27]/25 px-3 py-1.5 text-xs font-semibold text-[#B4571E]">
            <Radio className="h-3 w-3" /> DEMO MARKET · INA Market
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-6 md:pt-12 pb-12 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5DEC9] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#5C6360] mb-5 shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-[#1E5631] animate-pulse" />
            An intelligence layer for India's neighborhood markets
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1E2022] leading-[1.05]"
          >
            The Market That<br />
            <span className="text-[#1E5631]">Thinks as One.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 text-[#3A403D] text-base sm:text-lg leading-relaxed space-y-1 font-medium"
          >
            <p>Every shopper is a signal.</p>
            <p>Every vendor is a sensor.</p>
            <p>The market is the network.</p>
            <p className="text-[#1E5631] font-bold pt-1">Gemini is the interpreter.</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-4 text-xs sm:text-sm text-[#5C6360] leading-relaxed max-w-md"
          >
            BazaarMind makes information that already exists inside neighborhood markets visible and useful — without asking vendors or shoppers to learn English, databases, or schemas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <button
              data-testid="cta-see-pulse"
              onClick={() => { trackEvent("cta_explore_demo"); navigate("/pulse"); }}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1E5631] px-7 py-3.5 text-[#FDFBF7] font-semibold text-sm hover:bg-[#194727] transition-all shadow-md hover:shadow-lg"
            >
              Explore Demo Market
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#E5DEC9] px-6 py-3.5 text-[#1E2022] font-semibold text-sm hover:bg-[#F7F4EE] transition-colors"
            >
              How it works
              <ChevronDown className="h-4 w-4 text-[#8A8A82]" />
            </button>
          </motion.div>

          {/* Demo disclaimer banner */}
          <div className="mt-6 text-[11px] text-[#8A8A82] bg-white border border-[#E5DEC9] rounded-xl px-3 py-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#1E5631] shrink-0" />
            <span>
              Demonstration Market: <strong className="text-[#1E2022]">INA MARKET — BAZAARMIND DEMO</strong>. Illustrative synthetic data — not live market data.
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <div className="rounded-3xl overflow-hidden border border-[#E5DEC9] shadow-[0_20px_60px_rgba(30,32,34,0.12)] relative">
            <img
              src={process.env.PUBLIC_URL + "/images/mandi.jpg"}
              alt="Authentic neighborhood vegetable market in Delhi NCR"
              className="w-full h-[320px] md:h-[440px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md">
                Delhi NCR Neighborhood Mandi
              </span>
              <p className="text-sm font-medium mt-1 drop-shadow">
                Where messy conversations become structured intelligence.
              </p>
            </div>
          </div>
          <FlywheelCard />
        </motion.div>
      </section>

      {/* Pipeline Diagram (How it works) */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 md:px-8 py-12 border-t border-[#E5DEC9]">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E5631]">The BazaarMind Pipeline</span>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1E2022] mt-1">
            Messy conversations in. Structured intelligence out.
          </h2>
          <p className="text-xs text-[#5C6360] mt-2">
            Google Gemini interprets human inputs. Deterministic backend logic aggregates evidence into a living Market Pulse.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PipelineStep
            num="1"
            title="Human Input"
            desc="Shoppers express what they need. Vendors describe what they see in Hindi, Hinglish, or English via voice, text, or photos."
            icon={Mic}
          />
          <PipelineStep
            num="2"
            title="Gemini Interpreter"
            desc="Extracts structured produce, availability, observed price, and quantity without forcing database forms on users."
            icon={Sparkles}
          />
          <PipelineStep
            num="3"
            title="Validation & Aggregation"
            desc="Deterministic logic checks boundaries, deduplicates signals, tracks independent stall diversity, and computes confidence."
            icon={ShieldCheck}
          />
          <PipelineStep
            num="4"
            title="Market Pulse"
            desc="A living, evidence-grounded view of availability and observed prices for the entire neighborhood."
            icon={Network}
          />
        </div>

        <div className="mt-10 rounded-2xl bg-[#1E5631] text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <div className="text-xs tracking-wider uppercase opacity-80">Pitch & Demo Ready</div>
            <h3 className="font-display text-xl md:text-2xl font-bold mt-1">
              Experience the INA Market Demonstration
            </h3>
            <p className="text-xs opacity-90 mt-1 max-w-lg">
              Walk through the 3-minute flow: view the pulse, speak as a vendor, express a shopper need, and query Ask BazaarMind.
            </p>
          </div>
          <button
            onClick={() => navigate("/pulse")}
            className="shrink-0 px-6 py-3 rounded-full bg-[#FDFBF7] text-[#1E5631] font-semibold text-sm hover:bg-white transition-colors"
          >
            Launch Market Pulse →
          </button>
        </div>
      </section>
    </div>
  );
}

function PipelineStep({ num, title, desc, icon: Icon }) {
  return (
    <div className="bg-white border border-[#E5DEC9] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="h-7 w-7 rounded-full bg-[#1E5631]/10 text-[#1E5631] font-bold text-xs flex items-center justify-center">
            {num}
          </span>
          <Icon className="h-4 w-4 text-[#1E5631]" />
        </div>
        <h4 className="font-bold text-[#1E2022] text-sm">{title}</h4>
        <p className="text-xs text-[#5C6360] mt-1.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FlywheelCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
      className="hidden sm:block absolute -bottom-5 -left-5 bg-white/95 backdrop-blur-md border border-[#E5DEC9] rounded-2xl p-4 shadow-lg max-w-[240px]"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="h-3.5 w-3.5 text-[#1E5631]" />
        <span className="text-[11px] font-bold text-[#1E2022] uppercase tracking-wider">Living Pulse</span>
      </div>
      <p className="text-xs text-[#5C6360] leading-snug">
        Evidence-backed availability & observed price ranges for India's neighborhood markets.
      </p>
    </motion.div>
  );
}
