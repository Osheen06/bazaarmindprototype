import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Store,
  Sparkles,
  Compass,
  Tag,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { DEFAULT_VENDORS } from "../lib/demoData";
import { getGoogleMapsDirectionsUrl } from "../lib/api";

const STALL_POSITIONS = {
  v1: { x: 28, y: 35, color: "#1E5631", zone: "Greens Row" },
  v2: { x: 72, y: 32, color: "#D97706", zone: "Fruit Row" },
  v3: { x: 68, y: 70, color: "#2563EB", zone: "Center Lane" },
  v4: { x: 26, y: 75, color: "#059669", zone: "Main Gate Lane" },
};

const FILTER_ITEMS = [
  "All",
  "Tomatoes",
  "Onions",
  "Potatoes",
  "Coriander",
  "Fruits",
  "Spinach",
];

export default function MarketRadarMap({
  marketName = "INA MARKET — BAZAARMIND DEMO",
  vendors = DEFAULT_VENDORS,
  onSelectVendor,
}) {
  const [selectedId, setSelectedId] = useState("v1");
  const [activeFilter, setActiveFilter] = useState("All");

  const vendorList = useMemo(() => {
    return vendors && vendors.length ? vendors : DEFAULT_VENDORS;
  }, [vendors]);

  const selectedVendor = useMemo(() => {
    return vendorList.find((v) => v.vendorId === selectedId) || vendorList[0];
  }, [vendorList, selectedId]);

  const filteredVendorIds = useMemo(() => {
    if (activeFilter === "All") return new Set(vendorList.map((v) => v.vendorId));

    const matches = new Set();
    vendorList.forEach((v) => {
      const hasOffer = (v.offers || []).some((o) => {
        if (activeFilter === "Fruits") {
          return ["Banana", "Apple", "Lemon"].includes(o.product);
        }
        return o.product.toLowerCase().includes(activeFilter.toLowerCase());
      });
      if (hasOffer) matches.add(v.vendorId);
    });
    return matches;
  }, [vendorList, activeFilter]);

  const directionsUrl = useMemo(() => {
    if (!selectedVendor) return "https://www.google.com/maps";
    return getGoogleMapsDirectionsUrl({
      lat: selectedVendor.lat || 28.56885,
      lng: selectedVendor.lng || 77.20925,
      stallName: selectedVendor.stallName || selectedVendor.vendorName,
      marketName: "INA Market",
      area: "South Delhi",
    });
  }, [selectedVendor]);

  return (
    <div className="rounded-3xl border border-[#E5DEC9] bg-[#FDFBF7] p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5DEC9]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#1E5631] bg-[#1E5631]/10 px-2.5 py-0.5 rounded-full">
              <Compass className="h-3.5 w-3.5" />
              Live Stall Navigator
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#5C6360] font-medium">
              <Radio className="h-3 w-3 text-[#1E5631] animate-pulse" />
              4 Stalls Active
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-[#1E2022] mt-1">
            {marketName} · Physical Stall Radar
          </h3>
          <p className="text-xs text-[#5C6360]">
            Tap any stall pin to view observed inventory and open walking directions in Google Maps.
          </p>
        </div>

        {/* Global Google Maps CTA */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E5631] hover:bg-[#194727] text-white text-xs font-semibold px-4 py-2.5 shadow-sm transition-all shrink-0"
        >
          <Navigation className="h-4 w-4" />
          <span>Navigate with Google Maps</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      </div>

      {/* Produce Filter Chips */}
      <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[11px] font-semibold text-[#8A8A82] shrink-0 mr-1">
          Locate item:
        </span>
        {FILTER_ITEMS.map((item) => {
          const active = activeFilter === item;
          return (
            <button
              key={item}
              onClick={() => setActiveFilter(item)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-[#1E5631] text-white shadow-xs"
                  : "bg-white border border-[#E5DEC9] text-[#5C6360] hover:bg-[#F7F4EE]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Interactive Map Layout & Radar Canvas */}
      <div className="mt-4 grid lg:grid-cols-12 gap-5">
        {/* Visual Market Map (7 cols) */}
        <div className="lg:col-span-7 relative h-72 sm:h-84 rounded-2xl bg-[#F4EFE6] border border-[#E5DEC9] overflow-hidden select-none">
          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#1E5631 0.75px, transparent 0.75px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Market Walkways & Zones (Decorations) */}
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-[#8A8A82] bg-white/70 px-2 py-0.5 rounded-md">
            North Gate (Metro Side)
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-wider text-[#8A8A82] bg-white/70 px-2 py-0.5 rounded-md">
            Main Gate · Aurobindo Marg
          </div>

          {/* Walkway guides */}
          <div className="absolute top-1/2 left-4 right-4 h-8 -translate-y-1/2 rounded-full border border-dashed border-[#D5CDBD] flex items-center justify-center pointer-events-none">
            <span className="text-[10px] text-[#A39E92] font-semibold uppercase tracking-widest">
              Central Walkway · INA Mandi
            </span>
          </div>

          {/* Stalls Pins */}
          {vendorList.map((vendor) => {
            const pos = STALL_POSITIONS[vendor.vendorId] || {
              x: 50,
              y: 50,
              color: "#1E5631",
              zone: "Market Lane",
            };
            const isSelected = selectedVendor?.vendorId === vendor.vendorId;
            const isHighlighted = filteredVendorIds.has(vendor.vendorId);

            return (
              <motion.button
                key={vendor.vendorId}
                onClick={() => {
                  setSelectedId(vendor.vendorId);
                  if (onSelectVendor) onSelectVendor(vendor);
                }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  top: `${pos.y}%`,
                  left: `${pos.x}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 focus:outline-none transition-opacity ${
                  isHighlighted ? "opacity-100" : "opacity-35"
                }`}
              >
                {/* Ping animation if selected or highlighted */}
                {(isSelected || (activeFilter !== "All" && isHighlighted)) && (
                  <span
                    className="absolute -inset-2 rounded-full animate-ping opacity-40 pointer-events-none"
                    style={{ backgroundColor: pos.color }}
                  />
                )}

                {/* Stall Badge Pin */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-md text-white text-xs font-bold transition-all ${
                    isSelected
                      ? "ring-3 ring-black/40 scale-105"
                      : "hover:shadow-lg"
                  }`}
                  style={{ backgroundColor: pos.color }}
                >
                  <Store className="h-3.5 w-3.5" />
                  <span>{vendor.stallName ? vendor.stallName.split("·")[0].trim() : "Stall"}</span>
                </div>

                {/* Subtitle Label under pin */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#E5DEC9] text-[9.5px] font-semibold text-[#1E2022] shadow-2xs">
                  {vendor.vendorName}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Stall Detail & Google Maps Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-white border border-[#E5DEC9] p-4.5 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedVendor?.vendorId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Stall Title */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E5631]">
                    {STALL_POSITIONS[selectedVendor?.vendorId]?.zone || "Market Zone"}
                  </div>
                  <h4 className="font-display text-base font-bold text-[#1E2022]">
                    {selectedVendor?.vendorName}
                  </h4>
                  <p className="text-xs text-[#5C6360] font-medium">
                    {selectedVendor?.stallName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E5631] bg-[#1E5631]/10 px-2 py-0.5 rounded-full">
                    {Math.round((selectedVendor?.distanceKm || 0.15) * 1000)}m away
                  </span>
                  <div className="text-[10px] text-[#8A8A82] mt-0.5 font-mono">
                    ~2 min walk
                  </div>
                </div>
              </div>

              {/* Observed Stock & Prices */}
              <div className="pt-2 border-t border-[#F0EBDE]">
                <div className="text-[11px] font-semibold text-[#8A8A82] uppercase mb-1.5 flex items-center justify-between">
                  <span>Current Live Price Signals:</span>
                  <span className="text-[10px] text-[#1E5631] font-mono">Verified Sensor</span>
                </div>

                <div className="space-y-1.5">
                  {(selectedVendor?.offers || []).slice(0, 4).map((off) => (
                    <div
                      key={off.product}
                      className="flex items-center justify-between rounded-xl bg-[#FDFBF7] border border-[#E5DEC9] px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-[#1E2022] flex items-center gap-1.5">
                        <Tag className="h-3 w-3 text-[#1E5631]" />
                        {off.product}
                      </span>
                      <span className="font-bold text-[#1E5631]">
                        ₹{off.reportedPrice}/{off.priceUnit || "kg"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Walking Coordinates & Sensor Info */}
              <div className="rounded-xl bg-[#F7F4EE] p-2.5 text-[11px] text-[#5C6360] flex items-center justify-between font-mono">
                <span>GPS: {selectedVendor?.lat?.toFixed(4)}, {selectedVendor?.lng?.toFixed(4)}</span>
                <span className="text-[#1E5631] font-semibold">Active Sensor</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-[#F0EBDE] space-y-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1E5631] hover:bg-[#194727] text-white text-xs font-semibold py-2.5 transition-colors shadow-sm"
            >
              <Navigation className="h-4 w-4" />
              <span>Get Walking Directions to this Stall</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <div className="text-center text-[10px] text-[#8A8A82]">
              Opens Google Maps with direct walking path inside INA Market.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
