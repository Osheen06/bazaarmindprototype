import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Store,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag
} from "lucide-react";
import { getMarketsDirectory, trackEvent } from "../lib/api";
import { SectionLabel, Chip } from "../components/atoms";

const MARKET_TYPES = [
  "ALL",
  "Specialty & Gourmet Market",
  "Neighbourhood Market",
  "Wholesale Mandi",
  "Periodic / Farmers Market",
  "Weekly Market (Som Bazaar)"
];

export default function WeeklyMarkets() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    getMarketsDirectory()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    trackEvent("markets_directory_viewed");
  }, []);

  const markets = data?.markets || [];

  const filtered = markets.filter((m) => {
    const matchType = filterType === "ALL" || m.marketType === filterType;
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.area && m.area.toLowerCase().includes(search.toLowerCase())) ||
      (m.categories && m.categories.some((c) => c.toLowerCase().includes(search.toLowerCase())));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-[#E5DEC9]">
        <div>
          <div className="flex items-center gap-2">
            <SectionLabel>Market Directory</SectionLabel>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1E5631]/10 text-[#1E5631] font-semibold border border-[#1E5631]/20">
              MODULE 6 & 7 ARCHITECTURE
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[#1E2022] mt-1">
            Weekly & Neighbourhood Markets
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6360] mt-1 max-w-2xl leading-relaxed">
            Discover local neighbourhood markets, periodic farmers markets, weekly haats, and wholesale hubs across Delhi NCR with operating schedules and real-time signal density.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Chip tone="green">
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              <Store className="h-3.5 w-3.5" />
              {data?.totalMarkets || markets.length} Markets Mapped
            </span>
          </Chip>
        </div>
      </div>

      {/* Honest Data Disclaimer */}
      <div className="rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9] p-4 flex items-start gap-3 text-xs text-[#3A403D] leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-[#1E5631] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#1E2022]">Directory Truth Standard:</strong> BazaarMind never fabricates operating hours or schedules. Where field verification has occurred, verified hours are shown. Where schedule data is pending coordinator verification, the directory explicitly indicates <em className="text-[#8A8A82]">"Information coming soon"</em> or <em className="text-[#8A8A82]">"Insufficient local data"</em>.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#8A8A82] absolute left-3.5 top-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by market name, area, or produce categories…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#E5DEC9] bg-white text-xs outline-none focus:border-[#1E5631] focus:ring-2 focus:ring-[#1E5631]/15"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto bm-scroll pb-1">
          {MARKET_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs ${
                filterType === t
                  ? "bg-[#1E5631] text-white"
                  : "bg-white border border-[#E5DEC9] text-[#5C6360] hover:bg-[#F7F4EE]"
              }`}
            >
              {t === "ALL" ? "All Types" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Markets Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m, idx) => {
          const isDemo = m.verificationStatus === "DEMO";
          const isUnverified = m.verificationStatus === "UNVERIFIED";

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white border border-[#E5DEC9] rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                {/* Type and Verification Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#1E5631] bg-[#1E5631]/8 px-2.5 py-0.5 rounded-full border border-[#1E5631]/15">
                    {m.marketType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isDemo
                        ? "bg-[#D96B27]/10 text-[#B4571E] border border-[#D96B27]/25"
                        : isUnverified
                        ? "bg-[#8A8A82]/10 text-[#5C6360] border border-[#8A8A82]/20"
                        : "bg-[#1E5631]/10 text-[#1E5631] border border-[#1E5631]/25"
                    }`}
                  >
                    {m.verificationStatus}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-[#1E2022]">
                  {m.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[#5C6360] mt-1">
                  <MapPin className="h-3.5 w-3.5 text-[#1E5631] shrink-0" />
                  <span className="truncate">{m.location || m.area}</span>
                </div>

                {/* Operating Schedule Box */}
                <div className="mt-3.5 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8A82] flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[#1E5631]" /> Operating Days
                    </span>
                    <span className="font-semibold text-[#1E2022]">{m.operatingDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8A82] flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#1E5631]" /> Timings
                    </span>
                    <span className="font-semibold text-[#1E2022]">{m.operatingHours}</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(m.categories || []).map((c) => (
                    <span
                      key={c}
                      className="text-[10px] bg-[#FDFBF7] text-[#5C6360] border border-[#E5DEC9] px-2 py-0.5 rounded-md"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Signal Density & Footer */}
              <div className="mt-4 pt-3 border-t border-[#E5DEC9] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#8A8A82] block uppercase">Signal Density</span>
                  <span className="font-semibold text-[#1E2022]">{m.currentSignalDensity}</span>
                </div>

                {m.isLive ? (
                  <a
                    href="/pulse"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E5631] hover:underline"
                  >
                    View Pulse <ArrowRight className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-[#8A8A82] italic">
                    Awaiting deployment
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#E5DEC9]">
          <p className="text-sm text-[#5C6360]">No markets match your current filter.</p>
        </div>
      )}
    </div>
  );
}
