import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  MapPin,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info,
  Flame,
  Radio,
  ExternalLink
} from "lucide-react";
import { getExoticHeatmap, trackEvent } from "../lib/api";
import { SectionLabel, Chip } from "../components/atoms";

export default function ExoticHeatmap() {
  const [data, setData] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getExoticHeatmap("South Delhi")
      .then((res) => {
        setData(res);
        if (res?.clusters?.length) setSelectedCluster(res.clusters[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    trackEvent("exotic_heatmap_viewed");
  }, []);

  const clusters = data?.clusters || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-[#E5DEC9]">
        <div>
          <div className="flex items-center gap-2">
            <SectionLabel>Geographic Intelligence</SectionLabel>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1E5631]/10 text-[#1E5631] font-semibold border border-[#1E5631]/20">
              MODULE 14 · ADVANCED INTELLIGENCE
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[#1E2022] mt-1">
            South Delhi Exotic Food Heatmap
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6360] mt-1 max-w-2xl leading-relaxed">
            Spatial mapping of aggregated, anonymized demand clusters for high-margin gourmet culinary produce across South Delhi neighborhoods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Chip tone="green">
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              <Flame className="h-3.5 w-3.5 text-[#D96B27]" />
              {clusters.length} Demand Clusters
            </span>
          </Chip>
        </div>
      </div>

      {/* Strict Privacy Notice */}
      <div className="rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9] p-4 flex items-start gap-3 text-xs leading-relaxed text-[#3A403D]">
        <ShieldCheck className="h-4 w-4 text-[#1E5631] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#1E2022]">Privacy-Preserving Aggregation Guarantee:</strong> BazaarMind never plots individual household locations or private addresses. In accordance with Module 14 rules, geographic intelligence is strictly displayed as centroid clusters where $N \ge 5$ aggregated signals exist.
        </div>
      </div>

      {/* Main Heatmap Visual Layout */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* Interactive Spatial Canvas */}
        <div className="bg-white border border-[#E5DEC9] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EBDE]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E5631]">
                <Compass className="h-4 w-4" />
                South Delhi Geographic Clusters
              </div>
              <span className="text-[11px] text-[#8A8A82]">
                Center: Aurobindo Marg · INA Nexus
              </span>
            </div>

            {/* Stylized Visual Cluster Map */}
            <div className="relative h-[320px] sm:h-[400px] w-full rounded-2xl bg-[#F7F4EE] border border-[#E5DEC9] overflow-hidden flex items-center justify-center p-4">
              {/* Radial Grid Backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(#1E5631_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

              {/* INA Market Anchor Point */}
              <div className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none">
                <div className="h-8 w-8 rounded-full bg-[#1E5631] text-white flex items-center justify-center shadow-lg ring-4 ring-[#1E5631]/20 mx-auto">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-[#1E5631] bg-white px-2 py-0.5 rounded-full shadow-xs border border-[#E5DEC9] mt-1 inline-block">
                  INA Market (Sensor Hub)
                </span>
              </div>

              {/* Floating Cluster Pins */}
              {clusters.map((c, i) => {
                const isSelected = selectedCluster?.clusterId === c.clusterId;
                // Positional distribution
                const positions = [
                  { top: "30%", left: "68%" }, // Defence Colony
                  { top: "22%", left: "42%" }, // Jor Bagh
                  { top: "52%", left: "62%" }, // South Ext
                  { top: "75%", left: "72%" }, // Greater Kailash
                  { top: "72%", left: "28%" }, // Hauz Khas
                ];
                const pos = positions[i] || { top: "50%", left: "50%" };

                return (
                  <motion.button
                    key={c.clusterId}
                    type="button"
                    onClick={() => setSelectedCluster(c)}
                    style={pos}
                    whileHover={{ scale: 1.1 }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all ${
                      isSelected ? "scale-110 z-30" : "opacity-85 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`relative rounded-full flex items-center justify-center font-bold text-white shadow-md transition-all ${
                        c.signalDensity === "Strong cluster"
                          ? "h-11 w-11 bg-[#D96B27] ring-6 ring-[#D96B27]/25"
                          : c.signalDensity === "Emerging cluster"
                          ? "h-9 w-9 bg-[#1E5631] ring-4 ring-[#1E5631]/20"
                          : "h-8 w-8 bg-[#5C6360] ring-2 ring-[#5C6360]/20"
                      }`}
                    >
                      <Flame className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 shadow-xs transition-colors ${
                        isSelected
                          ? "bg-[#1E2022] text-white"
                          : "bg-white/95 text-[#1E2022] border border-[#E5DEC9]"
                      }`}
                    >
                      {c.clusterName} ({c.signalCount})
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0EBDE] flex items-center justify-between text-xs text-[#8A8A82]">
            <span>Click any cluster pin to inspect product demand</span>
            <span className="font-mono">Radius: 400m–600m</span>
          </div>
        </div>

        {/* Cluster Detail Inspector Panel */}
        <div className="flex flex-col gap-4">
          {selectedCluster ? (
            <motion.div
              key={selectedCluster.clusterId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-[#E5DEC9] rounded-3xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#1E5631]">
                    Cluster Profile
                  </span>
                  <h3 className="font-display text-xl font-bold text-[#1E2022] mt-0.5">
                    {selectedCluster.clusterName}
                  </h3>
                  <div className="text-xs text-[#5C6360]">{selectedCluster.area}</div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedCluster.signalDensity === "Strong cluster"
                      ? "bg-[#D96B27]/10 text-[#B4571E] border border-[#D96B27]/25"
                      : "bg-[#1E5631]/10 text-[#1E5631] border border-[#1E5631]/25"
                  }`}
                >
                  {selectedCluster.signalDensity}
                </span>
              </div>

              {/* Signals Count & Confidence */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9]">
                  <span className="text-[10px] text-[#8A8A82] block uppercase">Aggregated Signals</span>
                  <span className="font-display text-xl font-bold text-[#1E2022]">
                    {selectedCluster.signalCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9]">
                  <span className="text-[10px] text-[#8A8A82] block uppercase">Cluster Radius</span>
                  <span className="font-display text-xl font-bold text-[#1E5631]">
                    {selectedCluster.radiusMeters}m
                  </span>
                </div>
              </div>

              {/* Top Produce In Demand */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C6360] block mb-2">
                  Top High-Margin Demand:
                </span>
                <div className="space-y-1.5">
                  {(selectedCluster.topProduce || []).map((prod) => (
                    <div
                      key={prod}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#FDFBF7] border border-[#E5DEC9] text-xs font-semibold text-[#1E2022]"
                    >
                      <span>{prod}</span>
                      <span className="text-[10.5px] font-mono text-[#1E5631]">Elevated</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1E5631]/8 border border-[#1E5631]/20 text-xs text-[#1E5631] leading-relaxed">
                <strong>Commercial Application:</strong> Helps gourmet suppliers and INA vendors stock specialty inventory specifically matching South Delhi culinary clusters without stocking non-moving goods.
              </div>
            </motion.div>
          ) : (
            <div className="p-6 bg-white rounded-3xl border border-[#E5DEC9] text-center text-xs text-[#8A8A82]">
              Select a cluster to view demand details.
            </div>
          )}

          {/* Exotic Produce Value Proposition */}
          <div className="bg-[#1E5631] text-white rounded-3xl p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-[#F2C88C]">
              Why Exotic Food in South Delhi?
            </div>
            <p className="text-xs text-[#FDFBF7]/90 mt-2 leading-relaxed">
              Exotic vegetables (Avocados, Bok Choy, Shiitake) yield <b>3x to 5x higher retail margins</b> for vendors, but carry rapid spoilage risks if misplaced. BazaarMind's spatial clustering ensures perishable gourmet stock reaches hungry clusters within hours of arrival.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
